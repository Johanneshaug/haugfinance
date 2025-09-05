import React, { useState } from 'react';
import { Plus, Trash2, ArrowRight, ArrowLeft, Percent, BarChart3 } from 'lucide-react';
import { Asset, Liability, Income, Expense, FinancialData, DistributionFrequency } from '../types/financial';
import { searchStockSymbols, fetchStockPrice, getStockNameBySymbol } from '../utils/stockApi';
import { formatCurrency } from '../utils/currencies';
import { getTranslation } from '../utils/languages';

interface SetupWizardProps {
  onComplete: (data: FinancialData) => void;
  darkMode: boolean;
  currency: string;
  language: string; // Add language prop
  showBetaFeatures: boolean; // New prop
}

export function SetupWizard({ onComplete, darkMode, currency, language, showBetaFeatures }: SetupWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [liabilities, setLiabilities] = useState<Liability[]>([]);
  const [income, setIncome] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [draftValues, setDraftValues] = useState<{ [key: string]: string }>({});
  const [stockSuggestions, setStockSuggestions] = useState<Array<{ symbol: string; name: string }>>([]);
  const [showSuggestions, setShowSuggestions] = useState<{ [key: string]: boolean }>({});
  const [lastStockUpdate, setLastStockUpdate] = useState<{ [key: string]: number }>({});
  const [stockPrices, setStockPrices] = useState<{ [assetId: string]: { price: number; changePercent: number } }>(() => ({}));
  const [investmentPercentage, setInvestmentPercentage] = useState(0);
  const [investmentType, setInvestmentType] = useState<'rate' | 'stock'>('rate');
  const [investmentRate, setInvestmentRate] = useState(7);
  const [investmentStockSymbol, setInvestmentStockSymbol] = useState('');
  const [investmentStockSuggestions, setInvestmentStockSuggestions] = useState<Array<{ symbol: string; name: string }>>([]);
  const [showInvestmentSuggestions, setShowInvestmentSuggestions] = useState(false);
  const [investmentStockGrowthType, setInvestmentStockGrowthType] = useState<'rate' | 'targets'>('rate');
  const [investmentStockTargets, setInvestmentStockTargets] = useState<Array<{ date: string; expectedPrice: number }>>([]);
  const symbolChangeTimeout = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const sanitizeDecimalInput = (input: string): string => {
    if (!input) return '';
    let s = input.replace(/[^0-9.,]/g, '');
    const firstComma = s.indexOf(',');
    const firstDot = s.indexOf('.');
    let sepIndex = -1;
    let sepChar = '' as ',' | '.' | '';
    if (firstComma === -1 && firstDot === -1) {
      return s;
    } else if (firstComma === -1) {
      sepIndex = firstDot; sepChar = '.';
    } else if (firstDot === -1) {
      sepIndex = firstComma; sepChar = ',';
    } else {
      if (firstComma < firstDot) { sepIndex = firstComma; sepChar = ','; } else { sepIndex = firstDot; sepChar = '.'; }
    }
    const before = s.slice(0, sepIndex).replace(/[.,]/g, '');
    const afterRaw = s.slice(sepIndex + 1).replace(/[.,]/g, '');
    const after = afterRaw.slice(0, 2);
    return after.length > 0 ? `${before}${sepChar}${after}` : `${before}${sepChar}`;
  };

  const fetchAndSetStockPrice = async (assetId: string, symbol: string) => {
    if (!symbol) return;

    try {
      const stockData = await fetchStockPrice(symbol, currency);
      if (stockData) {
        // Update live price for display
        setStockPrices(prev => ({
          ...prev,
          [assetId]: { price: stockData.price, changePercent: stockData.changePercent }
        }));

        // Update asset value based on new price and existing quantity
        setAssets(prevAssets => prevAssets.map(asset => {
          if (asset.id === assetId && asset.type === 'stock') {
            const newQuantity = parseFloat(asset.quantity?.toString() || '0') || 0;
            return { ...asset, value: stockData.price * newQuantity };
          }
          return asset;
        }));
      }
    } catch (error) {
      console.warn(`Failed to fetch and set stock price for ${symbol}:`, error);
    }
  };

  // Real-time stock price updates every 30 seconds
  React.useEffect(() => {
    const updateStockPrices = async () => {
      const stockAssets = assets.filter(asset => 
        asset.type === 'stock' && asset.stockSymbol && asset.quantity
      );
      
      if (stockAssets.length === 0) return;
      
      const updatedAssets = [...assets];
      let hasUpdates = false;
      
      for (const asset of stockAssets) {
        try {
          const stockData = await fetchStockPrice(asset.stockSymbol!, currency);
          if (stockData && asset.quantity) {
            const newValue = stockData.price * asset.quantity;
            const assetIndex = updatedAssets.findIndex(a => a.id === asset.id);
            if (assetIndex !== -1 && Math.abs(updatedAssets[assetIndex].value - newValue) > 0.01) {
              updatedAssets[assetIndex] = { ...updatedAssets[assetIndex], value: newValue };
              hasUpdates = true;
              setLastStockUpdate(prev => ({ ...prev, [asset.id]: Date.now() }));
            }
            // store live price and change percent for display
            setStockPrices(prev => ({
              ...prev,
              [asset.id]: { price: stockData.price, changePercent: stockData.changePercent }
            }));
          }
        } catch (error) {
          console.warn(`Failed to update stock price for ${asset.stockSymbol}:`, error);
        }
      }
      
      if (hasUpdates) {
        setAssets(updatedAssets);
      }
    };
    
    // Initial update
    updateStockPrices();
    
    // Set up interval for every 30 seconds
    const interval = setInterval(updateStockPrices, 30000);
    
    return () => clearInterval(interval);
  }, [assets, currency]);

  React.useEffect(() => {
    // Ensure a single permanent bank account exists and deduplicate other cash assets
    if (currentStep === 0) {
      setAssets(prev => {
        let next = [...prev];
        const permanentIdx = next.findIndex(a => a.id === 'permanent-bank-account');
        const cashIdxs = next.map((a, i) => (a.type === 'cash' ? i : -1)).filter(i => i >= 0);

        if (permanentIdx >= 0) {
          // Keep permanent, remove any other cash assets
          next = next.filter((_, i) => i === permanentIdx || prev[i].type !== 'cash');
          // Move permanent to front
          const bank = next.find(a => a.id === 'permanent-bank-account')!;
          next = [bank, ...next.filter(a => a.id !== 'permanent-bank-account')];
        } else if (cashIdxs.length > 0) {
          // Convert first existing cash asset into permanent and remove any others
          const idx = cashIdxs[0];
          const existing = next[idx];
          const bank = {
            ...existing,
            id: 'permanent-bank-account',
            type: 'cash' as const,
          };
          next = [bank, ...next.filter((_, i) => i !== idx).filter(a => a.type !== 'cash')];
        } else {
          // Create a new permanent bank account at the top
          const bank: Asset = {
            id: 'permanent-bank-account',
            name: 'Bankkonto',
            value: 0,
            growthRate: 0,
            type: 'cash'
          } as Asset;
          next = [bank, ...next];
        }
        return next;
      });
    }
  }, [currentStep]);

  const steps = [
    { title: 'Vermögenswerte', subtitle: 'Ihre Ersparnisse und Investitionen' },
    { title: 'Schulden', subtitle: 'Kredite und Verbindlichkeiten' },
    { title: 'Einkommen', subtitle: 'Monatliche Einnahmen' },
    { title: 'Ausgaben', subtitle: 'Monatliche Kosten' },
    { title: 'Automatische Anlage', subtitle: 'Investment-Strategie festlegen' }
  ];

  const handleStockSymbolChange = (id: string, value: string) => {
    const upperValue = value.toUpperCase();
    const stockName = getStockNameBySymbol(upperValue);
    setAssets(assets.map(asset => 
      asset.id === id ? { ...asset, stockSymbol: upperValue, name: stockName || '' } : asset
    ));
    
    // Clear previous timeout
    if (symbolChangeTimeout.current) {
      clearTimeout(symbolChangeTimeout.current);
    }

    if (value.length > 0) {
      // Set a new timeout to fetch suggestions and price after a delay
      symbolChangeTimeout.current = setTimeout(async () => {
        const suggestions = searchStockSymbols(upperValue);
        setStockSuggestions(suggestions);
        setShowSuggestions({ ...showSuggestions, [id]: suggestions.length > 0 });
        await fetchAndSetStockPrice(id, upperValue); // Fetch price immediately on symbol change
      }, 300); // 300ms debounce delay
    } else {
      setStockSuggestions([]);
      setShowSuggestions({ ...showSuggestions, [id]: false });
      setStockPrices(prev => { // Clear live price when symbol is empty
        const newPrices = { ...prev };
        delete newPrices[id];
        return newPrices;
      });
    }
  };

  const selectStockSuggestion = (assetId: string, symbol: string) => {
    const stockName = getStockNameBySymbol(symbol);
    setAssets(assets.map(asset => 
      asset.id === assetId ? { ...asset, stockSymbol: symbol, name: stockName || symbol } : asset
    ));
    setShowSuggestions({ ...showSuggestions, [assetId]: false });
    fetchAndSetStockPrice(assetId, symbol); // Fetch price immediately on suggestion selection
  };

  const addAsset = () => {
    const newAsset: Asset = {
      id: Date.now().toString(),
      name: '',
      value: 0,
      growthRate: 0,
      type: 'stock', // Changed default type to 'stock'
      stockSymbol: '',
      quantity: 0,
      stockGrowthType: 'rate', // Explicitly set default growth type
      distributionFrequency: 'yearly',
    };
    setAssets([...assets, newAsset]);
  };

  const updateAsset = (id: string, field: keyof Asset, value: any) => {
    setAssets(assets.map(asset => {
      if (asset.id === id) {
        const updatedAsset = { ...asset, [field]: value };
        // Immediately update the total value if quantity of a stock changes
        if (updatedAsset.type === 'stock' && field === 'quantity') {
          const currentPerSharePrice = stockPrices[id]?.price || 0;
          const newQuantity = parseFloat(value) || 0; // Ensure new quantity is a number
          updatedAsset.value = currentPerSharePrice * newQuantity;
        }
        if (field === 'stockGrowthType') {
          console.log(`Asset ${id}: stockGrowthType changed to ${value}`);
        }
        return updatedAsset;
      }
      return asset;
    }));
  };

  const removeAsset = (id: string) => {
    setAssets(assets.filter(asset => asset.id !== id));
  };

  const addLiability = () => {
    const newLiability: Liability = {
      id: Date.now().toString(),
      name: '',
      balance: 0,
      interestRate: 5,
      minimumPayment: 0,
      type: 'other'
    };
    setLiabilities([...liabilities, newLiability]);
  };

  const updateLiability = (id: string, field: keyof Liability, value: any) => {
    setLiabilities(liabilities.map(liability => 
      liability.id === id ? { ...liability, [field]: value } : liability
    ));
  };

  const removeLiability = (id: string) => {
    setLiabilities(liabilities.filter(liability => liability.id !== id));
  };

  const addIncome = () => {
    const newIncome: Income = {
      id: Date.now().toString(),
      source: '',
      monthlyAmount: 0,
      growthRate: 3,
      hasDateRange: false,
      startDate: '',
      endDate: ''
    };
    setIncome([...income, newIncome]);
  };

  const updateIncome = (id: string, field: keyof Income, value: any) => {
    setIncome(income.map(incomeItem => 
      incomeItem.id === id ? { ...incomeItem, [field]: value } : incomeItem
    ));
  };

  const removeIncome = (id: string) => {
    setIncome(income.filter(incomeItem => incomeItem.id !== id));
  };

  const addExpense = () => {
    const newExpense: Expense = {
      id: Date.now().toString(),
      category: '',
      monthlyAmount: 0,
      growthRate: 2
    };
    setExpenses([...expenses, newExpense]);
  };

  const updateExpense = (id: string, field: keyof Expense, value: any) => {
    setExpenses(expenses.map(expense => 
      expense.id === id ? { ...expense, [field]: value } : expense
    ));
  };

  const removeExpense = (id: string) => {
    setExpenses(expenses.filter(expense => expense.id !== id));
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete({
        assets,
        liabilities,
        income,
        expenses,
        investmentPercentage,
        investmentType,
        investmentRate,
        investmentStockSymbol,
      });
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Assets
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className={`text-2xl font-bold ${darkMode ? 'text-blue-300' : 'text-blue-700'} tracking-tight`}>
                💼 Vermögenswerte
              </h3>
              <button
                onClick={addAsset}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 transition-all duration-300 font-semibold shadow-sm hover:shadow-md transform hover:scale-105"
              >
                <Plus className="w-4 h-4" />
                <div className="flex flex-col leading-tight text-left">
                  <span>Weitere hinzufügen</span>
                  <span className="text-xs font-normal opacity-80">z.B. Aktien</span>
                </div>
              </button>
            </div>
            
            {assets.length === 0 ? (
              <div className={`text-center py-8 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                <p className="text-lg font-medium">Keine Vermögenswerte hinzugefügt</p>
              </div>
            ) : (
              <div className="space-y-4">
                {assets.map((asset) => (
                  <div key={asset.id} className={`${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'} rounded-xl border p-6 space-y-4`}>
                    <div className="flex items-center justify-between">
                      <h4 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{asset.id === 'permanent-bank-account' ? 'Bankkonto' : 'Vermögenswert'}</h4>
                      {asset.id !== 'permanent-bank-account' && (
                        <button
                          onClick={() => removeAsset(asset.id)}
                          className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    
                    {asset.id === 'permanent-bank-account' ? (
                      <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                            Bankname
                          </label>
                          <input
                            type="text"
                            value={asset.name}
                            onChange={(e) => updateAsset(asset.id, 'name', e.target.value)}
                            className={`w-full px-4 py-3 border ${darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white'} rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                            placeholder="z.B. Sparkasse"
                          />
                        </div>
                        <div>
                          <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                            Kontostand
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={draftValues[`asset:${asset.id}:value`] ?? (asset.value ? asset.value.toString().replace('.', ',') : '')}
                              onChange={(e) => {
                                const s = sanitizeDecimalInput(e.target.value);
                                setDraftValues(prev => ({ ...prev, [`asset:${asset.id}:value`]: s }));
                                const n = parseFloat(s.replace(',', '.'));
                                updateAsset(asset.id, 'value', isNaN(n) ? 0 : n);
                              }}
                              onBlur={() => setDraftValues(prev => { const { [`asset:${asset.id}:value`]: _, ...rest } = prev; return rest; })}
                              className={`w-full px-4 py-3 pr-12 border ${darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white'} rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                              placeholder="0,00"
                            />
                            <span className={`absolute right-4 top-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>€</span>
                          </div>
                        </div>
                        <div>
                          <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                            Zinsen p.a. (%)
                          </label>
                          <input
                            type="text"
                            value={draftValues[`asset:${asset.id}:growthRate`] ?? (asset.growthRate != null ? asset.growthRate.toString().replace('.', ',') : '')}
                            onChange={(e) => {
                              const s = sanitizeDecimalInput(e.target.value);
                              setDraftValues(prev => ({ ...prev, [`asset:${asset.id}:growthRate`]: s }));
                              const n = parseFloat(s.replace(',', '.'));
                              updateAsset(asset.id, 'growthRate', isNaN(n) ? 0 : n);
                            }}
                            onBlur={() => setDraftValues(prev => { const { [`asset:${asset.id}:growthRate`]: _, ...rest } = prev; return rest; })}
                            className={`w-full px-4 py-3 border ${darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white'} rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                            placeholder="1,5"
                          />
                        </div>
                      </div>
                      <div>
                        <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                          {getTranslation('distributionFrequency', language)}
                        </label>
                        <select
                          value={asset.distributionFrequency || 'yearly'}
                          onChange={(e) => updateAsset(asset.id, 'distributionFrequency', e.target.value as DistributionFrequency)}
                          className={`w-full px-4 py-3 border ${darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white'} rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                        >
                          <option value="monthly">{getTranslation('monthly', language)}</option>
                          <option value="quarterly">{getTranslation('quarterly', language)}</option>
                          <option value="yearly">{getTranslation('yearly', language)}</option>
                        </select>
                      </div>
                      </>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                            Typ
                          </label>
                          <select
                            value={asset.type}
                            onChange={(e) => updateAsset(asset.id, 'type', e.target.value)}
                            className={`w-full px-4 py-3 border ${darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white'} rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                          >
                            <option value="cash">Bargeld</option>
                            <option value="investment">Investition</option>
                            <option value="stock">Aktie</option>
                          </select>
                        </div>

                        {asset.type !== 'stock' && (
                          <div>
                            <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                              Name
                            </label>
                            <input
                              type="text"
                              value={asset.name}
                              onChange={(e) => updateAsset(asset.id, 'name', e.target.value)}
                              className={`w-full px-4 py-3 border ${darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white'} rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                              placeholder="z.B. Sparkonto"
                            />
                          </div>
                        )}

                        {(asset.type === 'cash' || asset.type === 'investment') && (
                          <>
                            <div>
                              <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                                Aktueller Wert
                              </label>
                              <div className="relative">
                                <input
                                  type="text"
                                  value={draftValues[`asset:${asset.id}:value`] ?? (asset.value ? asset.value.toString().replace('.', ',') : '')}
                                  onChange={(e) => {
                                    const s = sanitizeDecimalInput(e.target.value);
                                    setDraftValues(prev => ({ ...prev, [`asset:${asset.id}:value`]: s }));
                                    const n = parseFloat(s.replace(',', '.'));
                                    updateAsset(asset.id, 'value', isNaN(n) ? 0 : n);
                                  }}
                                  onBlur={() => setDraftValues(prev => { const { [`asset:${asset.id}:value`]: _, ...rest } = prev; return rest; })}
                                  className={`w-full px-4 py-3 pr-12 border ${darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white'} rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                                  placeholder="0,00"
                                />
                                <span className={`absolute right-4 top-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>€</span>
                              </div>
                            </div>

                            {asset.type === 'investment' && (
                              <div className="col-span-2">
                                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                                  Jährliche Wachstumsrate (% p.a.)
                                </label>
                                <input
                                  type="text"
                                  value={draftValues[`asset:${asset.id}:growthRate`] ?? (asset.growthRate ? asset.growthRate.toString().replace('.', ',') : '')}
                                  onChange={(e) => {
                                    const s = sanitizeDecimalInput(e.target.value);
                                    setDraftValues(prev => ({ ...prev, [`asset:${asset.id}:growthRate`]: s }));
                                    const n = parseFloat(s.replace(',', '.'));
                                    updateAsset(asset.id, 'growthRate', isNaN(n) ? 0 : n);
                                  }}
                                  onBlur={() => setDraftValues(prev => { const { [`asset:${asset.id}:growthRate`]: _, ...rest } = prev; return rest; })}
                                  className={`w-full px-4 py-3 border ${darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white'} rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                                  placeholder="5,0"
                                />
                              </div>
                            )}
                                                           <div>
                                 <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                                   {getTranslation('distributionFrequency', language)}
                                 </label>
                                 <select
                                   value={asset.distributionFrequency || 'yearly'} // Default to yearly if not set
                                   onChange={(e) => updateAsset(asset.id, 'distributionFrequency', e.target.value as DistributionFrequency)}
                                   className={`w-full px-4 py-3 border ${darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white'} rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                                 >
                                   <option value="monthly">{getTranslation('monthly', language)}</option>
                                   <option value="quarterly">{getTranslation('quarterly', language)}</option>
                                   <option value="yearly">{getTranslation('yearly', language)}</option>
                                 </select>
                               </div>
                          </>
                        )}

                        {asset.type === 'stock' && (
                          <>
                            <div>
                              <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                                Aktiensymbol
                              </label>
                              <div className="relative">
                                <input
                                  type="text"
                                  value={asset.stockSymbol || ''}
                                  onChange={(e) => handleStockSymbolChange(asset.id, e.target.value)}
                                  className={`w-full px-4 py-3 border ${darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white'} rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                                  placeholder="z.B. AAPL, TSLA"
                                />
                                {showSuggestions[asset.id] && stockSuggestions.length > 0 && (
                                  <div className={`absolute z-10 w-full mt-1 ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'} border rounded-xl shadow-lg max-h-48 overflow-y-auto`}>
                                    {stockSuggestions.map((suggestion) => (
                                      <button
                                        key={suggestion.symbol}
                                        onClick={() => {
                                          selectStockSuggestion(asset.id, suggestion.symbol);
                                        }}
                                        className={`w-full text-left px-4 py-3 ${darkMode ? 'hover:bg-gray-600 text-white' : 'hover:bg-gray-50'} transition-colors`}
                                      >
                                        <div className="font-semibold">{suggestion.symbol}</div>
                                        <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{suggestion.name}</div>
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                              {asset.stockSymbol && (
                                <div className="mt-2 text-sm">
                                  {stockPrices[asset.id] ? (
                                    <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                                      Live: {formatCurrency(stockPrices[asset.id].price, currency)}
                                    </span>
                                  ) : (
                                    <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Preis wird geladen…</span>
                                  )}
                                </div>
                              )}
                            </div>

                            {asset.stockSymbol && (
                              <div>
                                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                                  Anzahl Aktien
                                </label>
                                <input
                                  type="text"
                                  value={draftValues[`asset:${asset.id}:quantity`] ?? (asset.quantity ? asset.quantity.toString().replace('.', ',') : '')}
                                  onChange={(e) => {
                                    const s = sanitizeDecimalInput(e.target.value);
                                    setDraftValues(prev => ({ ...prev, [`asset:${asset.id}:quantity`]: s }));
                                    const n = parseFloat(s.replace(',', '.'));
                                    updateAsset(asset.id, 'quantity', s === '' ? 0 : (isNaN(n) ? 0 : n));
                                  }}
                                  onBlur={() => setDraftValues(prev => { const { [`asset:${asset.id}:quantity`]: _, ...rest } = prev; return rest; })}
                                  className={`w-full px-4 py-3 border ${darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white'} rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                                  placeholder="100,0"
                                />
                              </div>
                            )}

                            {asset.type === 'stock' && (
                              <div>
                                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                                  {getTranslation('distributionFrequency', language)}
                                </label>
                                <select
                                  value={asset.distributionFrequency || 'yearly'}
                                  onChange={(e) => updateAsset(asset.id, 'distributionFrequency', e.target.value as DistributionFrequency)}
                                  className={`w-full px-4 py-3 border ${darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white'} rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                                >
                                  <option value="monthly">{getTranslation('monthly', language)}</option>
                                  <option value="quarterly">{getTranslation('quarterly', language)}</option>
                                  <option value="yearly">{getTranslation('yearly', language)}</option>
                                </select>
                              </div>
                            )}

                            {asset.type === 'stock' && (
                              <div>
                                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                                  Wachstumsmethode
                                </label>
                                <select
                                  value={asset.stockGrowthType || 'rate'}
                                  onChange={(e) => updateAsset(asset.id, 'stockGrowthType', e.target.value)}
                                  className={`w-full px-4 py-3 border ${darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white'} rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                                >
                                  <option value="rate">Jährliche Wachstumsrate</option>
                                  <option value="targets">Zielpreise zu bestimmten Daten</option>
                                </select>
                              </div>
                            )}

                            {asset.type === 'stock' && (asset.stockGrowthType || 'rate') === 'rate' && (
                              <div>
                                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                                  Jährliche Wachstumsrate (% p.a.)
                                </label>
                                <input
                                  type="text"
                                  value={draftValues[`asset:${asset.id}:growthRate`] ?? (asset.growthRate ? asset.growthRate.toString().replace('.', ',') : '')}
                                  onChange={(e) => {
                                    const s = sanitizeDecimalInput(e.target.value);
                                    setDraftValues(prev => ({ ...prev, [`asset:${asset.id}:growthRate`]: s }));
                                    const n = parseFloat(s.replace(',', '.'));
                                    updateAsset(asset.id, 'growthRate', isNaN(n) ? 0 : n);
                                  }}
                                  onBlur={() => setDraftValues(prev => { const { [`asset:${asset.id}:growthRate`]: _, ...rest } = prev; return rest; })}
                                  className={`w-full px-4 py-3 border ${darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white'} rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                                  placeholder="10,0"
                                />
                              </div>
                            )}

                            {asset.type === 'stock' && (asset.stockGrowthType || 'rate') === 'targets' && (
                              <div>
                                {showBetaFeatures && (
                                  <div className="mb-4">
                                    <label className="flex items-center space-x-2">
                                      <input
                                        type="checkbox"
                                        checked={asset.useEstimation || false}
                                        onChange={(e) => updateAsset(asset.id, 'useEstimation', e.target.checked)}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                      />
                                      <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Preise zwischen jetzt und Zieldaten schätzen
                                      </span>
                                    </label>
                                  </div>
                                )}
                                <div className="flex items-center justify-between mb-3">
                                  <label className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Zielpreise
                                  </label>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newTargets = [...(asset.stockTargets || []), { date: '', expectedPrice: 0 }];
                                      updateAsset(asset.id, 'stockTargets', newTargets);
                                    }}
                                    className="flex items-center space-x-1 px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                                  >
                                    <Plus className="w-4 h-4" />
                                    <span>Hinzufügen</span>
                                  </button>
                                </div>
                                <div className="space-y-3 max-h-40 overflow-y-auto">
                                  {(asset.stockTargets || []).map((target, index) => (
                                    <div key={index} className={`flex items-center space-x-2 p-3 border ${darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'} rounded-lg`}>
                                      <div className="flex-1">
                                        <input
                                          type="date"
                                          value={target.date}
                                          onChange={(e) => {
                                            const newTargets = [...(asset.stockTargets || [])];
                                            newTargets[index] = { ...newTargets[index], date: e.target.value };
                                            updateAsset(asset.id, 'stockTargets', newTargets);
                                          }}
                                          className={`w-full px-2 py-1 text-sm border ${darkMode ? 'border-gray-500 bg-gray-600 text-white' : 'border-gray-300 bg-white'} rounded focus:ring-1 focus:ring-blue-500`}
                                        />
                                      </div>
                                      <div className="flex-1">
                                        <div className="relative">
                                          <input
                                            type="text"
                                            value={draftValues[`asset:${asset.id}:stockTarget:${index}:expectedPrice`] ?? (target.expectedPrice ? target.expectedPrice.toString().replace('.', ',') : '')}
                                            onChange={(e) => {
                                              const s = sanitizeDecimalInput(e.target.value);
                                              setDraftValues(prev => ({ ...prev, [`asset:${asset.id}:stockTarget:${index}:expectedPrice`]: s }));
                                              const n = parseFloat(s.replace(',', '.'));
                                              const newTargets = [...(asset.stockTargets || [])];
                                              newTargets[index] = { ...newTargets[index], expectedPrice: isNaN(n) ? 0 : n };
                                              updateAsset(asset.id, 'stockTargets', newTargets);
                                            }}
                                            onBlur={() => setDraftValues(prev => { const { [`asset:${asset.id}:stockTarget:${index}:expectedPrice`]: _, ...rest } = prev; return rest; })}
                                            className={`w-full px-2 py-1 text-sm border ${darkMode ? 'border-gray-500 bg-gray-600 text-white' : 'border-gray-300 bg-white'} rounded focus:ring-1 focus:ring-blue-500`}
                                            placeholder="0,00"
                                          />
                                          <span className={`absolute right-2 top-1 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>€</span>
                                        </div>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const newTargets = (asset.stockTargets || []).filter((_, i) => i !== index);
                                          updateAsset(asset.id, 'stockTargets', newTargets);
                                        }}
                                        className="p-1 text-red-500 hover:bg-red-100 rounded transition-colors"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  ))}
                                  {(!asset.stockTargets || asset.stockTargets.length === 0) && (
                                    <div className={`text-center py-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                      Keine Zielpreise definiert. Klicken Sie "Hinzufügen" um einen Zielpreis festzulegen.
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 1: // Liabilities
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className={`text-2xl font-bold ${darkMode ? 'text-blue-300' : 'text-blue-700'} tracking-tight`}>
                💳 Schulden
              </h3>
              <button
                onClick={addLiability}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 transition-all duration-300 font-semibold shadow-sm hover:shadow-md transform hover:scale-105"
              >
                <Plus className="w-4 h-4" />
                <span>Hinzufügen</span>
              </button>
            </div>
            
            {liabilities.length === 0 ? (
              <div className={`text-center py-8 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                <p className="text-lg font-medium">Keine Schulden hinzugefügt</p>
              </div>
            ) : (
              <div className="space-y-4">
                {liabilities.map((liability) => (
                  <div key={liability.id} className={`${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'} rounded-xl border p-6 space-y-4`}>
                    <div className="flex items-center justify-between">
                      <h4 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Schuld</h4>
                      <button
                        onClick={() => removeLiability(liability.id)}
                        className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                          Name
                        </label>
                        <input
                          type="text"
                          value={liability.name}
                          onChange={(e) => updateLiability(liability.id, 'name', e.target.value)}
                          className={`w-full px-4 py-3 border ${darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white'} rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                          placeholder="z.B. Studienkredit"
                        />
                      </div>

                      <div>
                        <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                          Aktueller Saldo
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={draftValues[`liability:${liability.id}:balance`] ?? (liability.balance ? liability.balance.toString().replace('.', ',') : '')}
                            onChange={(e) => {
                              const s = sanitizeDecimalInput(e.target.value);
                              setDraftValues(prev => ({ ...prev, [`liability:${liability.id}:balance`]: s }));
                              const n = parseFloat(s.replace(',', '.'));
                              updateLiability(liability.id, 'balance', isNaN(n) ? 0 : n);
                            }}
                            onBlur={() => setDraftValues(prev => { const { [`liability:${liability.id}:balance`]: _, ...rest } = prev; return rest; })}
                            className={`w-full px-4 py-3 pr-12 border ${darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white'} rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                            placeholder="0,00"
                          />
                          <span className={`absolute right-4 top-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>€</span>
                        </div>
                      </div>

                      <div>
                        <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                          Tilgung/Monat
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={draftValues[`liability:${liability.id}:minimumPayment`] ?? (liability.minimumPayment ? liability.minimumPayment.toString().replace('.', ',') : '')}
                            onChange={(e) => {
                              const s = sanitizeDecimalInput(e.target.value);
                              setDraftValues(prev => ({ ...prev, [`liability:${liability.id}:minimumPayment`]: s }));
                              const n = parseFloat(s.replace(',', '.'));
                              updateLiability(liability.id, 'minimumPayment', isNaN(n) ? 0 : n);
                            }}
                            onBlur={() => setDraftValues(prev => { const { [`liability:${liability.id}:minimumPayment`]: _, ...rest } = prev; return rest; })}
                            className={`w-full px-4 py-3 pr-12 border ${darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white'} rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                            placeholder="0,00"
                          />
                          <span className={`absolute right-4 top-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>€</span>
                        </div>
                      </div>

                      <div>
                        <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                          Zinssatz (% p.a.)
                        </label>
                        <input
                          type="text"
                          value={draftValues[`liability:${liability.id}:interestRate`] ?? (liability.interestRate ? liability.interestRate.toString().replace('.', ',') : '')}
                          onChange={(e) => {
                            const s = sanitizeDecimalInput(e.target.value);
                            setDraftValues(prev => ({ ...prev, [`liability:${liability.id}:interestRate`]: s }));
                            const n = parseFloat(s.replace(',', '.'));
                            updateLiability(liability.id, 'interestRate', isNaN(n) ? 0 : n);
                          }}
                          onBlur={() => setDraftValues(prev => { const { [`liability:${liability.id}:interestRate`]: _, ...rest } = prev; return rest; })}
                          className={`w-full px-4 py-3 border ${darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white'} rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                          placeholder="5,5"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 2: // Income
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className={`text-2xl font-bold ${darkMode ? 'text-blue-300' : 'text-blue-700'} tracking-tight`}>
                💰 Einkommen
              </h3>
              <button
                onClick={addIncome}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 transition-all duration-300 font-semibold shadow-sm hover:shadow-md transform hover:scale-105"
              >
                <Plus className="w-4 h-4" />
                <span>Hinzufügen</span>
              </button>
            </div>
            
            {income.length === 0 ? (
              <div className={`text-center py-8 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                <p className="text-lg font-medium">Kein Einkommen hinzugefügt</p>
              </div>
            ) : (
              <div className="space-y-4">
                {income.map((incomeItem) => (
                  <div key={incomeItem.id} className={`${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'} rounded-xl border p-6 space-y-4`}>
                    <div className="flex items-center justify-between">
                      <h4 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Einkommen</h4>
                      <button
                        onClick={() => removeIncome(incomeItem.id)}
                        className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                          Quelle
                        </label>
                        <input
                          type="text"
                          value={incomeItem.source}
                          onChange={(e) => updateIncome(incomeItem.id, 'source', e.target.value)}
                          className={`w-full px-4 py-3 border ${darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white'} rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                          placeholder="z.B. Gehalt"
                        />
                      </div>

                      <div>
                        <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                          Monatlicher Betrag
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={draftValues[`income:${incomeItem.id}:monthlyAmount`] ?? (incomeItem.monthlyAmount ? incomeItem.monthlyAmount.toString().replace('.', ',') : '')}
                            onChange={(e) => {
                              const s = sanitizeDecimalInput(e.target.value);
                              setDraftValues(prev => ({ ...prev, [`income:${incomeItem.id}:monthlyAmount`]: s }));
                              const n = parseFloat(s.replace(',', '.'));
                              updateIncome(incomeItem.id, 'monthlyAmount', isNaN(n) ? 0 : n);
                            }}
                            onBlur={() => setDraftValues(prev => { const { [`income:${incomeItem.id}:monthlyAmount`]: _, ...rest } = prev; return rest; })}
                            className={`w-full px-4 py-3 pr-12 border ${darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white'} rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                            placeholder="0,00"
                          />
                          <span className={`absolute right-4 top-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>€</span>
                        </div>
                      </div>

                    </div>

                    <div>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={incomeItem.hasDateRange || false}
                          onChange={(e) => updateIncome(incomeItem.id, 'hasDateRange', e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Zeitraum festlegen
                        </span>
                      </label>
                    </div>

                    {incomeItem.hasDateRange && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                            Startdatum
                          </label>
                          <input
                            type="date"
                            value={incomeItem.startDate || ''}
                            onChange={(e) => updateIncome(incomeItem.id, 'startDate', e.target.value)}
                            className={`w-full px-4 py-3 border ${darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white'} rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                          />
                        </div>
                        <div>
                          <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                            Enddatum
                          </label>
                          <input
                            type="date"
                            value={incomeItem.endDate || ''}
                            onChange={(e) => updateIncome(incomeItem.id, 'endDate', e.target.value)}
                            className={`w-full px-4 py-3 border ${darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white'} rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 3: // Expenses  
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className={`text-2xl font-bold ${darkMode ? 'text-blue-300' : 'text-blue-700'} tracking-tight`}>
                🛒 Ausgaben
              </h3>
              <button
                onClick={addExpense}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 transition-all duration-300 font-semibold shadow-sm hover:shadow-md transform hover:scale-105"
              >
                <Plus className="w-4 h-4" />
                <span>Hinzufügen</span>
              </button>
            </div>
            
            {expenses.length === 0 ? (
              <div className={`text-center py-8 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                <p className="text-lg font-medium">Keine Ausgaben hinzugefügt</p>
              </div>
            ) : (
              <div className="space-y-4">
                {expenses.map((expense) => (
                  <div key={expense.id} className={`${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'} rounded-xl border p-6 space-y-4`}>
                    <div className="flex items-center justify-between">
                      <h4 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Ausgabe</h4>
                      <button
                        onClick={() => removeExpense(expense.id)}
                        className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                          Kategorie
                        </label>
                        <input
                          type="text"
                          value={expense.category}
                          onChange={(e) => updateExpense(expense.id, 'category', e.target.value)}
                          className={`w-full px-4 py-3 border ${darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white'} rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                          placeholder="z.B. Lebenshaltungskosten"
                        />
                      </div>

                      <div>
                        <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                          Monatlicher Betrag
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={draftValues[`expense:${expense.id}:monthlyAmount`] ?? (expense.monthlyAmount ? expense.monthlyAmount.toString().replace('.', ',') : '')}
                            onChange={(e) => {
                              const s = sanitizeDecimalInput(e.target.value);
                              setDraftValues(prev => ({ ...prev, [`expense:${expense.id}:monthlyAmount`]: s }));
                              const n = parseFloat(s.replace(',', '.'));
                              updateExpense(expense.id, 'monthlyAmount', isNaN(n) ? 0 : n);
                            }}
                            onBlur={() => setDraftValues(prev => { const { [`expense:${expense.id}:monthlyAmount`]: _, ...rest } = prev; return rest; })}
                            className={`w-full px-4 py-3 pr-12 border ${darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white'} rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                            placeholder="0,00"
                          />
                          <span className={`absolute right-4 top-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>€</span>
                        </div>
                      </div>

                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 4: // Automatic Investment
        const monthlyNet = income.reduce((sum, item) => sum + item.monthlyAmount, 0) - expenses.reduce((sum, item) => sum + item.monthlyAmount, 0);

        return (
          <div className="space-y-6">
            <div className={`mt-6 p-6 rounded-xl border ${monthlyNet > 0 ? (darkMode ? 'border-blue-600/50 bg-blue-700/20' : 'border-blue-200/50 bg-blue-50/50') : (darkMode ? 'border-slate-600/50 bg-slate-700/50' : 'border-slate-200/50 bg-slate-50/50')} backdrop-blur-sm`}>
              <div 
                className="flex items-center justify-between mb-4 group"
              >
                <h3 className={`text-base font-bold ${monthlyNet > 0 ? (darkMode ? 'text-blue-300' : 'text-blue-700') : (darkMode ? 'text-slate-400' : 'text-slate-600')} tracking-tight`}>
                  💰 Automatische Anlage
                </h3>
                <div className="flex items-center space-x-2">
                  <div className={`text-sm font-medium ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    Netto: {formatCurrency(monthlyNet, currency)}/Monat
                  </div>
                </div>
              </div>
              
              {monthlyNet > 0 ? (
                <>
                  <div className="flex items-center space-x-3">
                    <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Investment-Anteil:
                    </label>
                    <input
                      type="text"
                      value={draftValues['investmentPercentage'] ?? (investmentPercentage != null ? investmentPercentage.toString().replace('.', ',') : '')}
                      onChange={(e) => {
                        const s = sanitizeDecimalInput(e.target.value);
                        setDraftValues(prev => ({ ...prev, ['investmentPercentage']: s }));
                        const n = parseFloat(s.replace(',', '.'));
                        const clamped = Math.max(0, Math.min(100, isNaN(n) ? 0 : n));
                        setInvestmentPercentage(clamped);
                      }}
                      onBlur={() => setDraftValues(prev => { const { ['investmentPercentage']: _, ...rest } = prev; return rest; })}
                      className={`w-20 px-3 py-2 text-sm border ${darkMode ? 'border-gray-500 bg-gray-600 text-white' : 'border-gray-300 bg-white'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center`}
                      placeholder="0,0"
                    />
                    <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>%</span>
                  </div>
                  
                  {/* Investment Type Selection */}
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center space-x-4">
                      <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Investment-Art:
                      </label>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setInvestmentType('rate')}
                          className={`flex items-center space-x-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                            investmentType === 'rate'
                              ? 'bg-blue-500 text-white'
                              : darkMode ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          <Percent className="w-4 h-4" />
                          <span>Zinssatz</span>
                        </button>
                        <button
                          onClick={() => setInvestmentType('stock')}
                          className={`flex items-center space-x-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                            investmentType === 'stock'
                              ? 'bg-blue-500 text-white'
                              : darkMode ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          <BarChart3 className="w-4 h-4" />
                          <span>Aktie</span>
                        </button>
                      </div>
                    </div>

                    {/* Rate-based Investment */}
                    {investmentType === 'rate' && (
                      <div className="flex items-center space-x-3">
                        <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Jährlicher Zinssatz:
                        </label>
                        <input
                          type="text"
                          value={draftValues['investmentRate'] ?? (investmentRate !== undefined && investmentRate !== null ? investmentRate.toString().replace('.', ',') : '')}
                          onChange={(e) => {
                            const s = sanitizeDecimalInput(e.target.value);
                            setDraftValues(prev => ({ ...prev, ['investmentRate']: s }));
                            const n = parseFloat(s.replace(',', '.'));
                            setInvestmentRate(isNaN(n) ? 0 : n);
                          }}
                          onBlur={() => setDraftValues(prev => { const { ['investmentRate']: _, ...rest } = prev; return rest; })}
                          className={`w-20 px-3 py-2 text-sm border ${darkMode ? 'border-gray-500 bg-gray-600 text-white' : 'border-gray-300 bg-white'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center`}
                          placeholder="z.B. 7,0"
                        />
                        <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>%</span>
                      </div>
                    )}

                    {/* Stock-based Investment */}
                    {investmentType === 'stock' && (
                      <div className="space-y-4">
                        <div>
                          <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Aktien-Symbol:
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={investmentStockSymbol || ''}
                              onChange={(e) => {
                                const upperValue = e.target.value.toUpperCase();
                                setInvestmentStockSymbol(upperValue);
                                if (upperValue.length > 0) {
                                  const suggestions = searchStockSymbols(upperValue);
                                  setInvestmentStockSuggestions(suggestions);
                                  setShowInvestmentSuggestions(suggestions.length > 0);
                                } else {
                                  setInvestmentStockSuggestions([]);
                                  setShowInvestmentSuggestions(false);
                                }
                              }}
                              className={`w-full px-3 py-2 text-sm border ${darkMode ? 'border-gray-500 bg-gray-600 text-white' : 'border-gray-300 bg-white'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                              placeholder="z.B. AAPL, MSFT, TSLA"
                            />
                            {showInvestmentSuggestions && investmentStockSuggestions.length > 0 && (
                              <div className={`absolute z-10 w-full mt-1 ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'} border rounded-lg shadow-lg max-h-40 overflow-y-auto`}>
                                {investmentStockSuggestions.map((suggestion) => (
                                  <button
                                    key={suggestion.symbol}
                                    onClick={() => {
                                      setInvestmentStockSymbol(suggestion.symbol);
                                      setInvestmentStockSuggestions([]);
                                      setShowInvestmentSuggestions(false);
                                      const match = assets.find(a => a.type === 'stock' && a.stockSymbol?.toUpperCase() === suggestion.symbol.toUpperCase());
                                      if (match) {
                                        if (match.stockGrowthType) setInvestmentStockGrowthType(match.stockGrowthType);
                                        if (match.stockTargets) setInvestmentStockTargets(match.stockTargets);
                                        if (typeof match.growthRate === 'number') setInvestmentRate(match.growthRate);
                                      }
                                    }}
                                    className={`w-full text-left px-3 py-2 text-sm ${darkMode ? 'hover:bg-gray-600 text-white' : 'hover:bg-gray-50'} transition-colors`}
                                  >
                                    <div className="font-semibold">{suggestion.symbol}</div>
                                    <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{suggestion.name}</div>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Growth method selector for auto investment stock */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Wachstumsmethode</label>
                            <select
                              value={investmentStockGrowthType}
                              onChange={(e) => setInvestmentStockGrowthType(e.target.value as 'rate' | 'targets')}
                              className={`w-full px-3 py-2 text-sm border ${darkMode ? 'border-gray-500 bg-gray-600 text-white' : 'border-gray-300 bg-white'} rounded-lg`}
                            >
                              <option value="rate">Feste Jahresrate</option>
                              <option value="targets">Zieldatumspreise</option>
                            </select>
                          </div>

                          {investmentStockGrowthType === 'rate' && (
                            <div>
                              <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Jährliche Wachstumsrate (% p.a.)</label>
                              <input
                                type="text"
                                value={draftValues['investmentRate'] ?? (investmentRate !== undefined && investmentRate !== null ? investmentRate.toString().replace('.', ',') : '')}
                                onChange={(e) => {
                                  const s = sanitizeDecimalInput(e.target.value);
                                  setDraftValues(prev => ({ ...prev, ['investmentRate']: s }));
                                  const n = parseFloat(s.replace(',', '.'));
                                  setInvestmentRate(isNaN(n) ? 0 : n);
                                }}
                                onBlur={() => setDraftValues(prev => { const { ['investmentRate']: _, ...rest } = prev; return rest; })}
                                className={`w-full px-3 py-2 text-sm border ${darkMode ? 'border-gray-500 bg-gray-600 text-white' : 'border-gray-300 bg-white'} rounded-lg`}
                                placeholder="z.B. 7,0"
                              />
                            </div>
                          )}
                        </div>

                        {investmentStockGrowthType === 'targets' && (
                          <div className="space-y-3">
                            <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Zielpreise</label>
                            
                            {showBetaFeatures && (
                              <div className="mb-1">
                                <label className="inline-flex items-center space-x-2 text-sm">
                                  <input
                                    type="checkbox"
                                    checked={false} // investmentUseEstimation is removed
                                    onChange={() => { /* disabled in wizard */ }} // No state update for this checkbox
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <span className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Zwischenwerte schätzen</span>
                                </label>
                              </div>
                            )}
                            <div className="flex items-center justify-between">
                              <label className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                Zielpreise
                              </label>
                              <button
                                type="button"
                                onClick={() => setInvestmentStockTargets([...(investmentStockTargets || []), { date: '', expectedPrice: 0 }])}
                                className="flex items-center space-x-1 px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                              >
                                <Plus className="w-4 h-4" />
                                <span>Hinzufügen</span>
                              </button>
                            </div>
                            <div className="space-y-2 max-h-40 overflow-y-auto">
                              {(investmentStockTargets || []).map((t, i) => (
                                <div key={i} className={`grid grid-cols-2 gap-2 p-2 rounded ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                                  <input
                                    type="date"
                                    value={t.date}
                                    onChange={(e) => {
                                      const arr = [...investmentStockTargets];
                                      arr[i] = { ...arr[i], date: e.target.value };
                                      setInvestmentStockTargets(arr);
                                    }}
                                    className={`px-2 py-1 text-xs border ${darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white'} rounded`}
                                  />
                                  <div className="flex items-center space-x-2">
                                    <input
                                      type="text"
                                      value={draftValues[`investTarget:${i}:expectedPrice`] ?? (t.expectedPrice ? t.expectedPrice.toString().replace('.', ',') : '')}
                                      onChange={(e) => {
                                        const s = sanitizeDecimalInput(e.target.value);
                                        setDraftValues(prev => ({ ...prev, [`investTarget:${i}:expectedPrice`]: s }));
                                        const n = parseFloat(s.replace(',', '.'));
                                        const arr = [...investmentStockTargets];
                                        arr[i] = { ...arr[i], expectedPrice: isNaN(n) ? 0 : n };
                                        setInvestmentStockTargets(arr);
                                      }}
                                      onBlur={() => setDraftValues(prev => { const { [`investTarget:${i}:expectedPrice`]: _, ...rest } = prev; return rest; })}
                                      className={`flex-1 px-2 py-1 text-xs border ${darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white'} rounded`}
                                      placeholder="0,00"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => setInvestmentStockTargets((investmentStockTargets || []).filter((_, idx) => idx !== i))}
                                      className="px-2 py-1 text-xs text-red-600 border border-red-200 rounded"
                                    >
                                      Entfernen
                                    </button>
                                  </div>
                                </div>
                              ))}
                              {(investmentStockTargets || []).length === 0 && (
                                <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Keine Zielpreise festgelegt.</div>
                              )}
                            </div>
                            <div className={`text-[11px] ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              Hinweis: Nach dem letzten Zieldatum wächst die Aktie nicht weiter.
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className={`mt-2 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Füge Einkommen hinzu, um automatische Anlagen zu aktivieren
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`min-h-screen transition-all duration-700 ${
      darkMode 
        ? 'bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900' 
        : 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50'
    }`} style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
      
      {/* Header */}
      <header className={`${darkMode ? 'bg-slate-900/95 border-slate-700/50' : 'bg-white/95 border-slate-200/50'} backdrop-blur-xl shadow-2xl border-b`}>
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-xl ${darkMode ? 'bg-blue-500/20 border border-blue-400/30' : 'bg-blue-500/10 border border-blue-400/20'} backdrop-blur-sm`}>
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <span className="text-lg font-bold text-white">H</span>
                </div>
              </div>
              <div>
                <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'} tracking-tight`}>
                  Setup Wizard
                </h1>
                <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'} font-medium`}>
                  Schritt {currentStep + 1} von {steps.length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Progress Bar */}
        <div className="mb-12">
          <div className={`${darkMode ? 'bg-slate-800/60 border-slate-700/50' : 'bg-white/80 border-slate-200/50'} rounded-2xl shadow-2xl p-8 border backdrop-blur-xl`}>
            <div className="flex items-center justify-between mb-6">
              {steps.map((step, index) => (
                <div key={index} className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    index <= currentStep 
                      ? 'bg-blue-500 text-white' 
                      : darkMode ? 'bg-gray-600 text-gray-400' : 'bg-gray-200 text-gray-500'
                  }`}>
                    {index + 1}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-16 h-1 mx-4 ${
                      index < currentStep 
                        ? 'bg-blue-500' 
                        : darkMode ? 'bg-gray-600' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <div className="text-center">
              <h2 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'} mb-2 tracking-tight`}>
                {steps[currentStep].title}
              </h2>
              <p className={`text-lg ${darkMode ? 'text-slate-400' : 'text-slate-600'} font-medium`}>
                {steps[currentStep].subtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Step Content */}
        <div className={`${darkMode ? 'bg-slate-800/60 border-slate-700/50' : 'bg-white/80 border-slate-200/50'} rounded-2xl shadow-2xl p-8 border backdrop-blur-xl mb-8`}>
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all ${
              currentStep === 0
                ? darkMode ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : darkMode ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Zurück</span>
          </button>

          <button
            onClick={nextStep}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <span>{currentStep === steps.length - 1 ? 'Fertigstellen' : 'Weiter'}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </main>
    </div>
  );
}