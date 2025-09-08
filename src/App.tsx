import React, { useState, useMemo } from 'react';
import { Settings } from 'lucide-react';
import { LandingPage } from './components/LandingPage';
import { SetupWizard } from './components/SetupWizard';
import CleanFinancialCards from './components/CleanFinancialCards';
import { EditModal } from './components/EditModal';
import { ProjectionChart } from './components/ProjectionChart';
import { SummaryCards } from './components/SummaryCards';
import { SettingsPanel } from './components/SettingsPanel';
import { FinancialData, Asset, Liability, Income, Expense, DistributionFrequency } from './types/financial';
import { projectNetWorth } from './utils/calculations';
import { getTranslation } from './utils/languages';
import { updateExchangeRates } from './utils/currencies';
import { fetchStockPrice } from './utils/stockApi';

function App() {
  const [showLandingPage, setShowLandingPage] = useState(true);
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const [projectionYears, setProjectionYears] = useState(3);
  const [selectedCurrency, setSelectedCurrency] = useState('EUR');
  const [selectedLanguage, setSelectedLanguage] = useState('de');
  const [showSettings, setShowSettings] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [showBetaFeatures, setShowBetaFeatures] = useState(false); // New state for beta features
  const [failedStockSymbols, setFailedStockSymbols] = useState<Set<string>>(new Set());
  const [lastCurrencyUpdate, setLastCurrencyUpdate] = useState(0);
  const [editModal, setEditModal] = useState<{
    isOpen: boolean;
    item: Asset | Liability | Income | Expense | null;
    type: 'asset' | 'liability' | 'income' | 'expense' | null;
  }>({
    isOpen: false,
    item: null,
    type: null
  });
  const [financialData, setFinancialData] = useState<FinancialData>({
    assets: [],
    liabilities: [],
    income: [],
    expenses: [],
    investmentPercentage: 0,
    investmentType: 'rate',
    investmentRate: 7,
    investmentStockSymbol: '',
  });

  // New function for inline update of stock targets
  const handleUpdateAssetStockTarget = (assetId: string, updatedStockTargets: Array<{ date: string; expectedPrice: number }>) => {
    setFinancialData(prev => ({
      ...prev,
      assets: prev.assets.map(asset =>
        asset.id === assetId
          ? { ...asset, stockTargets: updatedStockTargets }
          : asset
      ),
    }));
  };

  // New function for inline update of asset growth rate
  const handleUpdateAssetGrowthRate = (assetId: string, newGrowthRate: number) => {
    setFinancialData(prev => ({
      ...prev,
      assets: prev.assets.map(asset =>
        asset.id === assetId
          ? { ...asset, growthRate: newGrowthRate }
          : asset
      ),
    }));
  };

  // New function for inline update of stock growth type
  const handleUpdateAssetStockGrowthType = (assetId: string, newStockGrowthType: 'rate' | 'targets') => {
    setFinancialData(prev => ({
      ...prev,
      assets: prev.assets.map(asset =>
        asset.id === assetId
          ? { 
              ...asset, 
              stockGrowthType: newStockGrowthType, 
              // Reset growthRate if switching to targets, or targets if switching to rate
              growthRate: newStockGrowthType === 'targets' ? 0 : asset.growthRate,
              stockTargets: newStockGrowthType === 'rate' ? [] : asset.stockTargets,
            }
          : asset
      ),
    }));
  };

  // Calculate projections (always called, even on landing page)
  const projections = useMemo(() => {
    return projectNetWorth(financialData, projectionYears, selectedLanguage);
  }, [financialData, projectionYears, selectedLanguage]);

  // Update currency rates every 5 minutes
  React.useEffect(() => {
    const updateCurrencyRates = async () => {
      const success = await updateExchangeRates();
      if (success) {
        setLastCurrencyUpdate(Date.now());
      }
    };
    
    // Initial update
    updateCurrencyRates();
    
    // Set up interval for every 5 minutes (300,000 ms)
    const interval = setInterval(updateCurrencyRates, 300000);
    
    return () => clearInterval(interval);
  }, []);

  // Auto-update stock prices every 30 seconds
  React.useEffect(() => {
    const updateStockPrices = async () => {
      const stockAssets = financialData.assets.filter(asset => 
        asset.type === 'stock' && asset.stockSymbol && asset.quantity && !failedStockSymbols.has(asset.stockSymbol)
      );
      
      if (stockAssets.length === 0) return;
      
      const updatedAssets = [...financialData.assets];
      const newFailedSymbols = new Set(failedStockSymbols);
      let hasUpdates = false;
      
      for (const asset of stockAssets) {
        try {
          const stockData = await fetchStockPrice(asset.stockSymbol!, selectedCurrency);
          if (stockData && asset.quantity) {
            const newValue = stockData.price * asset.quantity;
            const assetIndex = updatedAssets.findIndex(a => a.id === asset.id);
            if (assetIndex !== -1 && Math.abs(updatedAssets[assetIndex].value - newValue) > 0.01) {
              updatedAssets[assetIndex] = { ...updatedAssets[assetIndex], value: newValue };
              hasUpdates = true;
            }
          }
        } catch (error) {
          console.warn(`Stock symbol ${asset.stockSymbol} failed to fetch. Adding to failed list.`);
          newFailedSymbols.add(asset.stockSymbol!);
        }
      }
      
      if (newFailedSymbols.size > failedStockSymbols.size) {
        setFailedStockSymbols(newFailedSymbols);
      }
      
      if (hasUpdates) {
        setFinancialData(prev => ({ ...prev, assets: updatedAssets }));
      }
    };
    
    // Initial update
    updateStockPrices();
    
    // Set up interval for every 30 seconds
    const interval = setInterval(updateStockPrices, 30000);
    
    return () => clearInterval(interval);
  }, [financialData.assets, failedStockSymbols, selectedCurrency, lastCurrencyUpdate]);

  // Show landing page first
  if (showLandingPage) {
    return (
      <LandingPage 
        onEnterApp={() => {
          setShowLandingPage(false);
          setShowSetupWizard(true);
        }}
        darkMode={darkMode}
      />
    );
  }

  // Show setup wizard after landing page
  if (showSetupWizard) {
    return (
      <SetupWizard
        onComplete={(data) => {
          setFinancialData(prev => ({
            ...prev,
            assets: data.assets,
            liabilities: data.liabilities,
            income: data.income,
            expenses: data.expenses,
            investmentPercentage: data.investmentPercentage || 0,
            investmentType: data.investmentType || 'rate',
            investmentRate: data.investmentRate || 7,
            investmentStockSymbol: data.investmentStockSymbol || '',
          }));
          console.log("SetupWizard completed, financialData set:", data);
          setShowSetupWizard(false);
        }}
        darkMode={darkMode}
        currency={selectedCurrency}
        language={selectedLanguage} // Pass language to SetupWizard
        showBetaFeatures={showBetaFeatures}
      />
    );
  }

  const handleEditItem = (item: Asset | Liability | Income | Expense, type: 'asset' | 'liability' | 'income' | 'expense') => {
    // Handle permanent bank account
    if ((item as any).isPermanent) {
      // Find existing bank account in data or create new one
      const existingBankAccount = financialData.assets.find(a => a.id === 'permanent-bank-account');
      const bankAccountToEdit = existingBankAccount || {
        id: 'permanent-bank-account',
        name: selectedLanguage === 'de' ? 'Bankkonto' : 'Bank Account',
        value: 0,
        growthRate: 0,
        type: 'cash' as const
      };
      
      setEditModal({
        isOpen: true,
        item: bankAccountToEdit,
        type: 'asset'
      });
      return;
    }

    setEditModal({
      isOpen: true,
      item,
      type
    });
  };

  const handleSaveItem = (updatedItem: Asset | Liability | Income | Expense) => {
    if (!editModal.type) return;

    // Handle permanent bank account
    if (updatedItem.id === 'permanent-bank-account') {
      const newData = { ...financialData };
      const existingIndex = newData.assets.findIndex(a => a.id === 'permanent-bank-account');
      
      if (existingIndex >= 0) {
        newData.assets[existingIndex] = updatedItem as Asset;
      } else {
        newData.assets.push(updatedItem as Asset);
      }
      
      setFinancialData(newData);
      return;
    }

    // If it's a stock asset, remove it from failed symbols list to allow retry
    if (editModal.type === 'asset' && (updatedItem as Asset).type === 'stock' && (updatedItem as Asset).stockSymbol) {
      const newFailedSymbols = new Set(failedStockSymbols);
      newFailedSymbols.delete((updatedItem as Asset).stockSymbol!);
      setFailedStockSymbols(newFailedSymbols);
    }

    const newData = { ...financialData };
    
    switch (editModal.type) {
      case 'asset':
        const assetIndex = newData.assets.findIndex(item => item.id === updatedItem.id);
        if (assetIndex >= 0) {
          newData.assets[assetIndex] = updatedItem as Asset;
        } else {
          newData.assets.push(updatedItem as Asset);
        }
        break;
      case 'liability':
        const liabilityIndex = newData.liabilities.findIndex(item => item.id === updatedItem.id);
        if (liabilityIndex >= 0) {
          newData.liabilities[liabilityIndex] = updatedItem as Liability;
        } else {
          newData.liabilities.push(updatedItem as Liability);
        }
        break;
      case 'income':
        const incomeIndex = newData.income.findIndex(item => item.id === updatedItem.id);
        if (incomeIndex >= 0) {
          newData.income[incomeIndex] = updatedItem as Income;
        } else {
          newData.income.push(updatedItem as Income);
        }
        break;
      case 'expense':
        const expenseIndex = newData.expenses.findIndex(item => item.id === updatedItem.id);
        if (expenseIndex >= 0) {
          newData.expenses[expenseIndex] = updatedItem as Expense;
        } else {
          newData.expenses.push(updatedItem as Expense);
        }
        break;
    }
    
    setFinancialData(newData);
  };

  const handleDeleteItem = (id: string, type: 'asset' | 'liability' | 'income' | 'expense') => {
    // Prevent deletion of permanent bank account
    if (id === 'permanent-bank-account') {
      return;
    }

    const newData = { ...financialData };
    
    switch (type) {
      case 'asset':
        newData.assets = newData.assets.filter(item => item.id !== id);
        break;
      case 'liability':
        newData.liabilities = newData.liabilities.filter(item => item.id !== id);
        break;
      case 'income':
        newData.income = newData.income.filter(item => item.id !== id);
        break;
      case 'expense':
        newData.expenses = newData.expenses.filter(item => item.id !== id);
        break;
    }
    
    setFinancialData(newData);
  };

  const handleAddItem = (type: 'asset' | 'liability' | 'income' | 'expense') => {
    let newItem: Asset | Liability | Income | Expense;
    
    switch (type) {
      case 'asset':
        newItem = {
          id: Date.now().toString(),
          name: '',
          value: 0,
          growthRate: 0,
          type: 'investment',
          stockSymbol: '',
          quantity: 0
        };
        break;
      case 'liability':
        newItem = {
          id: Date.now().toString(),
          name: '',
          balance: 0,
          interestRate: 5,
          minimumPayment: 0,
          type: 'other'
        };
        break;
      case 'income':
        newItem = {
          id: Date.now().toString(),
          source: '',
          monthlyAmount: 0,
          growthRate: 3
        };
        break;
      case 'expense':
        newItem = {
          id: Date.now().toString(),
          category: '',
          monthlyAmount: 0,
          growthRate: 2
        };
        break;
    }
    
    setEditModal({
      isOpen: true,
      item: newItem,
      type
    });
  };

  const handleUpdateInvestmentPercentage = (percentage: number) => {
    setFinancialData(prev => ({
      ...prev,
      investmentPercentage: percentage
    }));
  };

  const handleUpdateInvestmentType = (type: 'rate' | 'stock') => {
    setFinancialData(prev => ({
      ...prev,
      investmentType: type
    }));
  };

  const handleUpdateInvestmentRate = (rate: number) => {
    setFinancialData(prev => ({
      ...prev,
      investmentRate: rate
    }));
  };

  const handleUpdateInvestmentStock = (symbol: string) => {
    setFinancialData(prev => ({
      ...prev,
      investmentStockSymbol: symbol
    }));
  };

  const handleUpdateAssetDistributionFrequency = (assetId: string, frequency: DistributionFrequency) => {
    setFinancialData(prev => ({
      ...prev,
      assets: prev.assets.map(asset => asset.id === assetId ? { ...asset, distributionFrequency: frequency } : asset)
    }));
  };

  return (
    <div className={`min-h-screen transition-all duration-700 ${
      darkMode 
        ? 'bg-gradient-to-br from-slate-900 via-blue-900 to-amber-900' 
        : 'bg-gradient-to-br from-white via-blue-50 to-amber-50'
    }`} style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 z-40 ${darkMode ? 'bg-slate-900/95 border-slate-700/50' : 'bg-white/95 border-slate-200/50'} backdrop-blur-xl shadow-2xl border-b transition-all duration-700`}>
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-xl ${darkMode ? 'bg-blue-500/20 border border-blue-400/30' : 'bg-blue-500/10 border border-blue-400/20'} backdrop-blur-sm`}>
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-amber-500 rounded-lg flex items-center justify-center">
                  <span className="text-lg font-bold text-white">H</span>
                </div>
              </div>
              <div>
                <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'} flex items-center space-x-2 tracking-tight`}>
                  <span>{getTranslation('netWorthCalculator', selectedLanguage)}</span>
                </h1>
                <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'} font-medium`}>
                  HaugFinance Professional
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowLandingPage(true)}
                className={`px-6 py-3 text-sm font-semibold ${darkMode ? 'text-slate-300 hover:bg-slate-700/50 border-slate-600/50' : 'text-slate-600 hover:bg-slate-100/50 border-slate-300/50'} border rounded-xl transition-all duration-300 backdrop-blur-sm`}
              >
                ← Startseite
              </button>
              <button
                onClick={() => setShowSettings(true)}
                className={`p-4 ${darkMode ? 'text-slate-300 hover:bg-slate-700/50 border-slate-600/50' : 'text-slate-600 hover:bg-slate-100/50 border-slate-300/50'} border rounded-xl transition-all duration-300 transform hover:scale-105 backdrop-blur-sm`}
              >
                <Settings className="w-7 h-7" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 pt-40 pb-16">
        {/* Projection Controls */}
        <div className="flex items-center justify-center mb-10">
          <div className={`flex items-center space-x-8 ${darkMode ? 'bg-slate-800/60 border-slate-700/50' : 'bg-white/80 border-slate-200/50'} rounded-2xl shadow-2xl px-10 py-8 border backdrop-blur-xl`}>
            <label className={`text-xl font-bold ${darkMode ? 'text-slate-200' : 'text-slate-700'} tracking-tight`}>
              {getTranslation('projectFor', selectedLanguage)}
            </label>
            <input
              type="text"
              value={projectionYears != null ? projectionYears.toString().replace('.', ',') : ''}
              onChange={(e) => {
                const v = e.target.value.replace(',', '.');
                const n = parseFloat(v);
                const years = Math.max(1, Math.min(50, isNaN(n) ? 1 : Math.round(n)));
                setProjectionYears(years);
              }}
              className={`px-6 py-4 border ${darkMode ? 'border-slate-600/50 bg-slate-700/50 text-white' : 'border-slate-300/50 bg-white/50'} rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent font-bold text-xl w-28 text-center backdrop-blur-sm transition-all duration-300`}
              placeholder="3"
            />
            <span className={`text-xl font-bold ${darkMode ? 'text-slate-200' : 'text-slate-700'} tracking-tight`}>
              Jahre
            </span>
          </div>
        </div>

        {/* Chart */}
        <div className="mb-10">
          <ProjectionChart projections={projections} language={selectedLanguage} darkMode={darkMode} />
        </div>

        {/* Input Forms */}
        <CleanFinancialCards 
          data={financialData}
          onEditItem={handleEditItem}
          onDeleteItem={handleDeleteItem}
          onAddItem={handleAddItem}
          onUpdateInvestmentPercentage={handleUpdateInvestmentPercentage}
          onUpdateInvestmentType={handleUpdateInvestmentType}
          onUpdateInvestmentRate={handleUpdateInvestmentRate}
          onUpdateInvestmentStock={handleUpdateInvestmentStock}
          currency={selectedCurrency}
          language={selectedLanguage}
          darkMode={darkMode}
          onUpdateAssetStockTarget={handleUpdateAssetStockTarget} // Pass the new handler
          onUpdateAssetGrowthRate={handleUpdateAssetGrowthRate} // Pass new handler
          onUpdateAssetStockGrowthType={handleUpdateAssetStockGrowthType} // Pass new handler
          showBetaFeatures={showBetaFeatures}
          onUpdateAssetDistributionFrequency={handleUpdateAssetDistributionFrequency}
        />
        {/* Summary Cards - After financial overview */}
        <div className="mt-10">
          <SummaryCards 
            data={financialData} 
            projections={projections} 
            projectionYears={projectionYears}
            currency={selectedCurrency}
            language={selectedLanguage}
            darkMode={darkMode}
          />
        </div>

      </main>

      {/* Settings Panel */}
      <SettingsPanel
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        selectedCurrency={selectedCurrency}
        onCurrencyChange={setSelectedCurrency}
        selectedLanguage={selectedLanguage}
        onLanguageChange={setSelectedLanguage}
        darkMode={darkMode}
        onDarkModeToggle={() => setDarkMode(!darkMode)}
        showBetaFeatures={showBetaFeatures} // Pass new state to SettingsPanel
        onToggleBetaFeatures={() => setShowBetaFeatures(prev => !prev)} // Pass new handler
      />

      {/* Edit Modal */}
      <EditModal
        isOpen={editModal.isOpen}
        onClose={() => setEditModal({ isOpen: false, item: null, type: null })}
        item={editModal.item}
        type={editModal.type!}
        onSave={handleSaveItem}
        currency={selectedCurrency}
        language={selectedLanguage}
        darkMode={darkMode}
      />
    </div>
  );
}

export default App;