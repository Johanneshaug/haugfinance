import { FinancialData, ProjectionResult, Asset } from '../types/financial';

function addYearsToDate(date: Date, years: number): Date {
  console.log('    addYearsToDate: Input date =', date, ', years =', years);
  const millisecondsPerYear = 1000 * 60 * 60 * 24 * 365.25; // Average days in a year
  const newDate = new Date(date.getTime() + years * millisecondsPerYear);
  console.log('    addYearsToDate: Output newDate =', newDate);
  return newDate;
}

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
  
  // Variables for distribution of savings and investments (per target frequency)
  let accumulatedSavingsForBank = 0;
  let accumulatedSavingsForInvestment = 0;
  let lastBankDistributionYearFraction = 0;
  let lastInvestmentDistributionYearFraction = 0;
  
  const mapFrequencyToYears = (freq?: Asset['distributionFrequency']): number => {
    switch (freq) {
      case 'monthly': return 1 / 12;
      case 'quarterly': return 3 / 12;
      case 'yearly':
      default:
        return 1;
    }
  };

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
  const getBankAsset = (): Asset | undefined => currentAssets.find(a => a.id === 'permanent-bank-account');
  const getInvestmentStockAsset = (): Asset | undefined =>
    currentAssets.find(a => a.type === 'stock' && a.stockSymbol === data.investmentStockSymbol);
  
  const getBankIntervalYears = (): number => mapFrequencyToYears(getBankAsset()?.distributionFrequency);
  const getInvestmentIntervalYears = (): number => mapFrequencyToYears(getInvestmentStockAsset()?.distributionFrequency);
  
  console.log('Bank distribution interval (years):', getBankIntervalYears());
  console.log('Investment distribution interval (years):', getInvestmentIntervalYears());

  const NUMBER_OF_DATA_POINTS = 100; // Number of data points for the graph
  const stepYears = years / (NUMBER_OF_DATA_POINTS - 1); // Calculate year step for 100 data points

  for (let i = 0; i < NUMBER_OF_DATA_POINTS; i++) {
    const yearFraction = i * stepYears; // Calculate year fraction for each data point
    console.log(`  projectNetWorth Loop ${i}: yearFraction = ${yearFraction}`);
    const currentProjectionDate = addYearsToDate(initialProjectionStartDate, yearFraction);
    console.log(`  projectNetWorth Loop ${i}: currentProjectionDate (after addYearsToDate) =`, currentProjectionDate);
    
    // First, update values of all assets for the current projection date
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
      date: currentProjectionDate, // Store the exact date
      totalAssets,
      totalLiabilities,
      netWorth: totalAssets - totalLiabilities,
      monthlyIncome,
      monthlyExpenses: monthlyExpenses + monthlyLoanPayments + monthlyInterestPayments,
      monthlySavings
    });
    
    console.log(`--- Data Point ${i} (Year Fraction: ${yearFraction}) ---`);
    console.log('Current Projection Date:', currentProjectionDate);
    currentAssets.filter(a => a.type === 'stock').forEach(asset => {
      console.log(`  Asset ${asset.id} (${asset.name}): Value=${asset.value}, Quantity=${asset.quantity}, StockGrowthType=${asset.stockGrowthType}, UseEstimation=${asset.useEstimation}`);
    });
    console.log('Total Assets:', totalAssets);
    console.log('Monthly Savings:', monthlySavings);

    // Apply monthly savings and investments for the next period
    if (i < NUMBER_OF_DATA_POINTS - 1) {
      const monthsInStep = stepYears * 12; // Use actual stepYears for continuous accumulation
      // Accumulate monthly savings over the steps for both bank and investment paths
      const stepSavings = monthlySavings * monthsInStep;
      accumulatedSavingsForBank += stepSavings;
      accumulatedSavingsForInvestment += stepSavings;

      // Determine if bank distribution should be triggered (based on bank's own frequency)
      const bankIntervalYears = getBankIntervalYears();
      const shouldDistributeBank = (yearFraction - lastBankDistributionYearFraction + stepYears) >= (bankIntervalYears - 0.0001) || (i === NUMBER_OF_DATA_POINTS - 2);
      if (shouldDistributeBank) {
        console.log(`  Applying bank savings. AccumulatedBank: ${accumulatedSavingsForBank} at yearFraction: ${yearFraction}`);
        // Distribute savings into bank account
        let bankAccount = getBankAsset();
        if (bankAccount) {
          bankAccount.value += accumulatedSavingsForBank;
          console.log('Bank Account updated with savings:', bankAccount.value);
        } else {
          const newBankAccount: Asset = {
            id: 'permanent-bank-account',
            name: 'Bankkonto',
            value: accumulatedSavingsForBank,
            growthRate: 0,
            type: 'cash'
          };
          currentAssets.push(newBankAccount);
          bankAccount = newBankAccount;
        }
        accumulatedSavingsForBank = 0;
        lastBankDistributionYearFraction = yearFraction;
      }

      // Determine if investment distribution should be triggered (based on investment stock's own frequency)
      const investmentIntervalYears = getInvestmentIntervalYears();
      const shouldDistributeInvestment = (yearFraction - lastInvestmentDistributionYearFraction + stepYears) >= (investmentIntervalYears - 0.0001) || (i === NUMBER_OF_DATA_POINTS - 2);
      if (shouldDistributeInvestment) {
        // Handle automatic investment if configured
        if (data.investmentPercentage && data.investmentPercentage > 0 && data.investmentType === 'stock' && data.investmentStockSymbol) {
          const investmentAmount = accumulatedSavingsForInvestment * (data.investmentPercentage / 100);
          const investmentStockAsset = getInvestmentStockAsset();
          let bankAccount = getBankAsset();
          if (!bankAccount) {
            const newBankAccount: Asset = {
              id: 'permanent-bank-account',
              name: 'Bankkonto',
              value: 0,
              growthRate: 0,
              type: 'cash'
            };
            currentAssets.push(newBankAccount);
            bankAccount = newBankAccount;
          }

          if (investmentStockAsset) {
            const currentPricePerShare = getProjectedStockPricePerShare(
              initialStockPricesPerShare.get(investmentStockAsset.id) || 0,
              investmentStockAsset.stockTargets,
              investmentStockAsset.useEstimation,
              currentProjectionDate
            );

            console.log(`  Investment Stock (${investmentStockAsset.stockSymbol}): Investment Amount=${investmentAmount}, Current Price Per Share=${currentPricePerShare}`);

            if (currentPricePerShare > 0 && investmentAmount > 0) {
              const newSharesBought = investmentAmount / currentPricePerShare;
              mutableStockQuantities.set(investmentStockAsset.id, (mutableStockQuantities.get(investmentStockAsset.id) || 0) + newSharesBought);
              if (bankAccount) {
                bankAccount.value -= investmentAmount; // move funds from bank
              }
              console.log(`  New Shares Bought: ${newSharesBought}, Updated Quantity: ${mutableStockQuantities.get(investmentStockAsset.id)}, Bank Account after investment: ${bankAccount?.value}`);
            }
          }
        }
        accumulatedSavingsForInvestment = 0;
        lastInvestmentDistributionYearFraction = yearFraction;
      }
      // Update liabilities (e.g., reduce balance by payments, accrue interest) for the step period
      currentLiabilities = currentLiabilities.map(liability => {
        const updatedLiability = { ...liability };
        const totalInterest = updatedLiability.balance * (Math.pow(1 + updatedLiability.interestRate / 100, stepYears) - 1); // Apply annual compounding
        const totalPayments = updatedLiability.minimumPayment * monthsInStep;
        const actualPayment = Math.min(totalPayments, updatedLiability.balance + totalInterest); // Don't overpay

        updatedLiability.balance = updatedLiability.balance + totalInterest - actualPayment;

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