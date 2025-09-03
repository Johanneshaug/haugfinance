import { FinancialData, ProjectionResult, Asset } from '../types/financial';

// New helper function for projecting stock price per share
function getProjectedStockPricePerShare(
  initialPricePerShare: number,
  stockTargets: Array<{ date: string; expectedPrice: number }> | undefined,
  useEstimation: boolean | undefined,
  projectionDate: Date
): number {
  console.log('  --- getProjectedStockPricePerShare ---');
  console.log('  Initial Price Per Share:', initialPricePerShare);
  console.log('  Stock Targets:', stockTargets);
  console.log('  Use Estimation:', useEstimation);
  console.log('  Projection Date:', projectionDate);

  if (!stockTargets || stockTargets.length === 0) {
    return initialPricePerShare;
  }

  const sortedTargets = [...stockTargets]
    .filter((t) => t.date && t.expectedPrice > 0)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (sortedTargets.length === 0) {
    return initialPricePerShare;
  }

  const firstTarget = sortedTargets[0];
  const lastTarget = sortedTargets[sortedTargets.length - 1];

  // If before the first target date
  if (projectionDate < new Date(firstTarget.date)) {
    console.log('  Case: Before first target, returning initialPricePerShare:', initialPricePerShare);
    return initialPricePerShare;
  }

  // If at or after the last target date
  if (projectionDate >= new Date(lastTarget.date)) {
    console.log('  Case: At or after last target, returning lastTarget.expectedPrice:', lastTarget.expectedPrice);
    return lastTarget.expectedPrice;
  }

  // Between two targets
  for (let i = 0; i < sortedTargets.length - 1; i++) {
    const prevTarget = sortedTargets[i];
    const nextTarget = sortedTargets[i + 1];
    const prevDate = new Date(prevTarget.date);
    const nextDate = new Date(nextTarget.date);

    if (projectionDate >= prevDate && projectionDate < nextDate) {
      if (useEstimation) {
        // Linear interpolation
        const timeElapsed = projectionDate.getTime() - prevDate.getTime();
        const totalTime = nextDate.getTime() - prevDate.getTime();
        if (totalTime <= 0) return prevTarget.expectedPrice;
        const progress = timeElapsed / totalTime;
        const calculatedPrice = prevTarget.expectedPrice + (nextTarget.expectedPrice - prevTarget.expectedPrice) * progress;
        console.log('  Case: Between targets with estimation, returning:', calculatedPrice);
        return calculatedPrice;
      } else {
        // Hold price at previous target's expected price
        console.log('  Case: Between targets without estimation, returning prevTarget.expectedPrice:', prevTarget.expectedPrice);
        return prevTarget.expectedPrice;
      }
    }
  }
  console.log('  Case: Fallback, should not be reached, returning initialPricePerShare:', initialPricePerShare);
  return initialPricePerShare; // Fallback, should not be reached if logic is correct
}

// Main function to get projected asset value at a specific date
function getProjectedAssetValueAtDate(
  asset: Asset,
  projectionDate: Date,
  initialProjectionStartDate: Date,
  currentQuantity: number, // Pass current quantity for stocks
  initialPricePerShareForStock: number | undefined // Pass initial price for stocks
): number {
  if (asset.type === 'stock') {
    const pricePerShare = getProjectedStockPricePerShare(
      initialPricePerShareForStock || 0,
      asset.stockTargets,
      asset.useEstimation,
      projectionDate
    );
    return pricePerShare * currentQuantity;
  } else {
    // For non-stock assets, calculate value based on annual growth rate from initial projection start
    const yearsFromInitialStart = (projectionDate.getTime() - initialProjectionStartDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    return asset.value * Math.pow(1 + (asset.growthRate || 0) / 100, yearsFromInitialStart);
  }
}

export function calculateCurrentNetWorth(data: FinancialData): number {
  const totalAssets = data.assets.reduce((sum, asset) => sum + asset.value, 0);
  const totalLiabilities = data.liabilities.reduce((sum, liability) => sum + liability.balance, 0);
  return totalAssets - totalLiabilities;
}

export function calculateMonthlyNet(data: FinancialData): number {
  const monthlyIncome = data.income.reduce((sum, income) => sum + income.monthlyAmount, 0);
  const monthlyExpenses = data.expenses.reduce((sum, expense) => sum + expense.monthlyAmount, 0);
  const monthlyLoanPayments = data.liabilities.reduce((sum, liability) => sum + liability.minimumPayment, 0);
  const monthlyLoanInterest = data.liabilities.reduce((sum, liability) => sum + ((liability.balance * liability.interestRate / 100) / 12), 0);
  return monthlyIncome - monthlyExpenses - monthlyLoanPayments - monthlyLoanInterest;
}

export function projectNetWorth(data: FinancialData, years: number, language: string = 'de'): ProjectionResult[] {
  const results: ProjectionResult[] = [];
  
  const initialProjectionStartDate = new Date(); // Capture the exact start date of the projection

  // Starting values
  let currentAssets: Asset[] = data.assets.map(a => ({ ...a })); // Deep copy to allow modification
  let currentLiabilities = [...data.liabilities];
  let currentIncome = [...data.income];
  let currentExpenses = [...data.expenses];
  
  // Capture initial stock quantities and prices for projection base
  const initialStockQuantities = new Map<string, number>();
  const initialStockPricesPerShare = new Map<string, number>();
  currentAssets.forEach(asset => {
    if (asset.type === 'stock') {
      initialStockQuantities.set(asset.id, asset.quantity || 0);
      initialStockPricesPerShare.set(asset.id, (asset.value && asset.quantity) ? (asset.value / asset.quantity) : 0);
    }
  });
  // Use a mutable map for current quantities, so we can update it for new investments
  const mutableStockQuantities = new Map<string, number>(initialStockQuantities);

  console.log('--- Starting projectNetWorth ---');
  console.log('Initial Projection Start Date:', initialProjectionStartDate);
  console.log('Initial Assets:', currentAssets);
  console.log('Initial Stock Quantities Map:', initialStockQuantities);
  console.log('Initial Stock Prices Per Share Map:', initialStockPricesPerShare);

  // Generate quarterly data points (4 quarters per year)
  const totalQuarters = years * 4 + 1; // +1 to include the starting point
  
  for (let quarter = 0; quarter < totalQuarters; quarter++) {
    const yearFraction = quarter / 4; // Convert quarter to year fraction (0, 0.25, 0.5, 0.75, 1, etc.)
    const currentProjectionDate = new Date(initialProjectionStartDate.getFullYear() + yearFraction, initialProjectionStartDate.getMonth(), initialProjectionStartDate.getDate());

    // First, update values of all assets for the current projection date
    // Note: We need to use a temporary array or modify currentAssets carefully to reflect changes
    // for stocks within this quarter before calculating totals.
    // Instead of re-mapping here, we'll directly update the values and quantities on the currentAssets objects.
    currentAssets.forEach(asset => {
      if (asset.type === 'stock') {
        const currentQuantity = mutableStockQuantities.get(asset.id) || 0;
        const newStockValue = getProjectedAssetValueAtDate(
          asset,
          currentProjectionDate,
          initialProjectionStartDate,
          currentQuantity, // Pass the mutable current quantity
          initialStockPricesPerShare.get(asset.id) // Initial price per share for this stock
        );
        asset.value = newStockValue;
        asset.quantity = currentQuantity; // Ensure asset object's quantity reflects the mutable map
      } else {
        const newNonStockValue = getProjectedAssetValueAtDate(
          asset,
          currentProjectionDate,
          initialProjectionStartDate,
          0, // Not applicable for non-stocks
          undefined // Not applicable for non-stocks
        );
        asset.value = newNonStockValue;
      }
    });

    // Calculate total values for this year
    const totalAssets = currentAssets.reduce((sum, asset) => sum + asset.value, 0);
    const totalLiabilities = currentLiabilities.reduce((sum, liability) => sum + liability.balance, 0);
    const monthlyIncome = currentIncome.reduce((sum, income) => sum + income.monthlyAmount, 0);
    const monthlyExpenses = currentExpenses.reduce((sum, expense) => sum + expense.monthlyAmount, 0);
    const monthlyLoanPayments = currentLiabilities.reduce((sum, liability) => sum + liability.minimumPayment, 0);
    const monthlyInterestPayments = currentLiabilities.reduce((sum, liability) => sum + (liability.balance * liability.interestRate / 100 / 12), 0);
    const monthlySavings = monthlyIncome - monthlyExpenses - monthlyLoanPayments - monthlyInterestPayments;
    
    results.push({
      year: yearFraction, // Use yearFraction for the result
      totalAssets,
      totalLiabilities,
      netWorth: totalAssets - totalLiabilities,
      monthlyIncome,
      monthlyExpenses: monthlyExpenses + monthlyLoanPayments + monthlyInterestPayments,
      monthlySavings
    });
    
    console.log(`--- Quarter ${quarter} (Year Fraction: ${yearFraction}) ---`);
    console.log('Current Projection Date:', currentProjectionDate);
    currentAssets.filter(a => a.type === 'stock').forEach(asset => {
      console.log(`  Asset ${asset.id} (${asset.name}): Value=${asset.value}, Quantity=${asset.quantity}, StockGrowthType=${asset.stockGrowthType}, UseEstimation=${asset.useEstimation}`);
    });
    console.log('Total Assets:', totalAssets);
    console.log('Monthly Savings:', monthlySavings);

    if (quarter < totalQuarters - 1) { // Check for next quarter, not year
      const nextQuarterFraction = (quarter + 1) / 4;
      const nextProjectionDate = new Date(initialProjectionStartDate.getFullYear() + nextQuarterFraction, initialProjectionStartDate.getMonth(), initialProjectionStartDate.getDate());

      // Handle monthly income/expenses growth for the next quarter (if applicable)
      // (this part can be more complex if income/expenses have growth rates over time,
      // for now we assume they are static or handled outside this loop for growth)

      const quarterlySavingsAmount = monthlySavings * 3; // 3 months per quarter

      // Distribute quarterly savings into bank account first
      let bankAccount = currentAssets.find(a => a.id === 'permanent-bank-account');
      if (bankAccount) {
        bankAccount.value += quarterlySavingsAmount;
        console.log('Bank Account updated with quarterly savings:', bankAccount.value);
      } else {
        // Create if not exists, though it should be permanent from SetupWizard
        const newBankAccount: Asset = {
          id: 'permanent-bank-account',
          name: 'Bankkonto',
          value: quarterlySavingsAmount,
          growthRate: 0,
          type: 'cash'
        };
        currentAssets.push(newBankAccount);
        bankAccount = newBankAccount; // Assign reference to the newly created object
      }

      // Handle automatic investment if configured
      if (data.investmentPercentage && data.investmentPercentage > 0 && data.investmentType === 'stock' && data.investmentStockSymbol) {
        const investmentAmount = quarterlySavingsAmount * (data.investmentPercentage / 100);
        let investmentStockAsset = currentAssets.find(a => a.type === 'stock' && a.stockSymbol === data.investmentStockSymbol);

        if (investmentStockAsset) {
          // Get the current projected price per share for the investment stock at this projection date
          const currentPricePerShare = getProjectedStockPricePerShare(
            initialStockPricesPerShare.get(investmentStockAsset.id) || 0,
            investmentStockAsset.stockTargets,
            investmentStockAsset.useEstimation,
            currentProjectionDate // Use the current projection date for getting the current price
          );

          console.log(`  Investment Stock (${investmentStockAsset.stockSymbol}): Investment Amount=${investmentAmount}, Current Price Per Share=${currentPricePerShare}`);

          if (currentPricePerShare > 0) {
            const newSharesBought = investmentAmount / currentPricePerShare; // Buy new shares at the current projected price per share
            // Update mutable quantity map for the investment stock
            mutableStockQuantities.set(investmentStockAsset.id, (mutableStockQuantities.get(investmentStockAsset.id) || 0) + newSharesBought);
            // Deduct investment amount from bank account
            if (bankAccount) {
              bankAccount.value -= investmentAmount;
            }
            console.log(`  New Shares Bought: ${newSharesBought}, Updated Quantity: ${mutableStockQuantities.get(investmentStockAsset.id)}, Bank Account after investment: ${bankAccount?.value}`);
          }
        }
      }
      // Update liabilities (e.g., reduce balance by payments, accrue interest)
      currentLiabilities = currentLiabilities.map(liability => {
        const updatedLiability = { ...liability };
        const monthlyInterest = (updatedLiability.balance * updatedLiability.interestRate / 100) / 12;
        const actualPayment = Math.min(updatedLiability.minimumPayment, updatedLiability.balance + monthlyInterest); // Don't overpay beyond balance + interest
        updatedLiability.balance = updatedLiability.balance + (monthlyInterest * 3) - (actualPayment * 3); // Quarterly interest and payments

        // Ensure balance doesn't go below zero
        if (updatedLiability.balance < 0) {
          updatedLiability.balance = 0;
        }
        return updatedLiability;
      });
    }
  }
  
  return results;
}

function isIncomeActive(income: any, currentYear: number): boolean {
  if (!income.hasDateRange) {
    return true; // Income without date range is always active
  }
  
  const currentDate = new Date();
  const projectionDate = new Date(currentDate.getFullYear() + currentYear, currentDate.getMonth(), currentDate.getDate());
  
  let isActive = true;
  
  if (income.startDate) {
    const startDate = new Date(income.startDate);
    isActive = isActive && projectionDate >= startDate;
  }
  
  if (income.endDate) {
    const endDate = new Date(income.endDate);
    isActive = isActive && projectionDate <= endDate;
  }
  
  return isActive;
}