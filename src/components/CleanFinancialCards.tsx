import React from 'react';
import { Plus, Edit3, Trash2, TrendingUp, Percent, BarChart3, ChevronDown, ChevronUp } from 'lucide-react';
import { FinancialData, Asset, Liability, Income, Expense } from '../types/financial';
import { formatCurrency } from '../utils/currencies';
import { getTranslation } from '../utils/languages';
import { searchStockSymbols, getStockNameBySymbol } from '../utils/stockApi';

interface CleanFinancialCardsProps {
  data: FinancialData;
  onEditItem: (item: Asset | Liability | Income | Expense, type: 'asset' | 'liability' | 'income' | 'expense') => void;
  onDeleteItem: (id: string, type: 'asset' | 'liability' | 'income' | 'expense') => void;
  onAddItem: (type: 'asset' | 'liability' | 'income' | 'expense') => void;
  onUpdateInvestmentPercentage: (percentage: number) => void;
  onUpdateInvestmentType: (type: 'rate' | 'stock') => void;
  onUpdateInvestmentRate: (rate: number) => void;
  onUpdateInvestmentStock: (symbol: string) => void;
  currency: string;
  language: string;
  darkMode: boolean;
  onUpdateAssetStockTarget: (assetId: string, updatedStockTargets: Array<{ date: string; expectedPrice: number }>) => void; // New prop
  onUpdateAssetGrowthRate: (assetId: string, newGrowthRate: number) => void; // New prop
  onUpdateAssetStockGrowthType: (assetId: string, newStockGrowthType: 'rate' | 'targets') => void; // New prop
  showBetaFeatures: boolean; // New prop
}

export default function CleanFinancialCards({
  data,
  onEditItem,
  onDeleteItem,
  onAddItem,
  onUpdateInvestmentPercentage,
  onUpdateInvestmentType,
  onUpdateInvestmentRate,
  onUpdateInvestmentStock,
  currency,
  language,
  darkMode,
  onUpdateAssetStockTarget,
  onUpdateAssetGrowthRate, // Destructure new prop
  onUpdateAssetStockGrowthType, // Destructure new prop
  showBetaFeatures, // Destructure new prop
}: CleanFinancialCardsProps) {
  const [stockSuggestions, setStockSuggestions] = React.useState<Array<{ symbol: string; name: string }>>([]);
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const [isInvestmentExpanded, setIsInvestmentExpanded] = React.useState(false);

  // Local state for inline editing Investment Percentage
  const [localInvestmentPercentage, setLocalInvestmentPercentage] = React.useState<string>(
    data.investmentPercentage != null ? data.investmentPercentage.toString().replace('.', ',') : ''
  );
  React.useEffect(() => {
    setLocalInvestmentPercentage(data.investmentPercentage != null ? data.investmentPercentage.toString().replace('.', ',') : '');
  }, [data.investmentPercentage]);

  // Local state for inline editing Investment Rate
  const [localInvestmentRate, setLocalInvestmentRate] = React.useState<string>(
    data.investmentRate != null ? data.investmentRate.toString().replace('.', ',') : ''
  );
  React.useEffect(() => {
    setLocalInvestmentRate(data.investmentRate != null ? data.investmentRate.toString().replace('.', ',') : '');
  }, [data.investmentRate]);

  const updateAssetInline = (assetId: string, changes: Partial<Asset>) => {
    const asset = data.assets.find(a => a.id === assetId);
    if (!asset) return;
    const updated: Asset = { ...asset, ...changes } as Asset;
    onEditItem(updated, 'asset');
  };

  // Create permanent bank account (always first)
  const permanentBankAccount = {
    id: 'permanent-bank-account',
    name: language === 'de' ? 'Bankkonto' : 'Bank Account',
    value: 0,
    growthRate: 0,
    type: 'cash' as const,
    itemType: 'asset' as const,
    colorClass: 'text-emerald-600',
    isPermanent: true
  };

  // Check if permanent bank account exists in data and update values
  const existingBankAccount = data.assets.find(a => a.id === 'permanent-bank-account');
  if (existingBankAccount) {
    permanentBankAccount.value = existingBankAccount.value;
    permanentBankAccount.name = existingBankAccount.name;
    permanentBankAccount.growthRate = existingBankAccount.growthRate;
  }

  // Combine all items into a single list with bank account first
  const allItems = [
    permanentBankAccount, // Always first
    ...data.assets.filter(item => item.id !== 'permanent-bank-account').map(item => ({ ...item, itemType: 'asset' as const, colorClass: 'text-emerald-600' })),
    ...data.liabilities.map(item => ({ ...item, itemType: 'liability' as const, colorClass: 'text-red-600' })),
    ...data.income.map(item => ({ ...item, itemType: 'income' as const, colorClass: 'text-blue-600' })),
    ...data.expenses.map(item => ({ ...item, itemType: 'expense' as const, colorClass: 'text-orange-600' }))
  ];

  // New sub-component for handling individual stock targets
  interface StockTargetItemProps {
    target: { date: string; expectedPrice: number };
    index: number;
    assetId: string;
    onUpdateAssetStockTarget: (assetId: string, updatedStockTargets: Array<{ date: string; expectedPrice: number }>) => void;
    onRemoveStockTarget: (assetId: string, indexToRemove: number) => void;
    darkMode: boolean;
    assetStockTargets: Array<{ date: string; expectedPrice: number }>;
  }

  const StockTargetItem: React.FC<StockTargetItemProps> = React.memo(({
    target,
    index,
    assetId,
    onUpdateAssetStockTarget,
    onRemoveStockTarget,
    darkMode,
    assetStockTargets
  }) => {
    const [localExpectedPrice, setLocalExpectedPrice] = React.useState<string>(
      target.expectedPrice != null ? target.expectedPrice.toString().replace('.', ',') : ''
    );

    React.useEffect(() => {
      // Only update local state if the prop changes and it's not currently being edited
      if (target.expectedPrice != null && localExpectedPrice !== target.expectedPrice.toString().replace('.', ',')) {
        setLocalExpectedPrice(target.expectedPrice.toString().replace('.', ','));
      }
    }, [target.expectedPrice]);

    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setLocalExpectedPrice(e.target.value);
    };

    const handlePriceBlur = () => {
      const v = localExpectedPrice.replace(',', '.');
      const parsed = parseFloat(v);
      const newPrice = isNaN(parsed) ? 0 : parsed;

      // Create a copy of the array to update a specific item
      const updatedTargets = [...assetStockTargets];
      updatedTargets[index] = { ...updatedTargets[index], expectedPrice: newPrice };
      onUpdateAssetStockTarget(assetId, updatedTargets);

      // Update local state to show formatted number
      setLocalExpectedPrice(newPrice.toString().replace('.', ','));
    };

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const updatedTargets = [...assetStockTargets];
      updatedTargets[index] = { ...updatedTargets[index], date: e.target.value };
      onUpdateAssetStockTarget(assetId, updatedTargets);
    };

    return (
      <div key={index} className={`grid grid-cols-2 gap-2 p-2 rounded ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
        <input
          type="date"
          value={target.date}
          onChange={handleDateChange}
          className={`px-2 py-1 text-xs border ${darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white'} rounded`}
        />
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={localExpectedPrice}
            onChange={handlePriceChange}
            onBlur={handlePriceBlur}
            className={`flex-1 px-2 py-1 text-xs border ${darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white'} rounded`}
            placeholder="0,00"
          />
          <button
            type="button"
            onClick={() => onRemoveStockTarget(assetId, index)}
            className="px-2 py-1 text-[11px] text-red-600 border border-red-200 rounded"
          >
            Entfernen
          </button>
        </div>
      </div>
    );
  });

  const ItemCard = ({ item, type, colorClass }: { 
    item: Asset | Liability | Income | Expense | any, 
    type: 'asset' | 'liability' | 'income' | 'expense',
    colorClass: string 
  }) => {
    // Local state for inline editing to handle string inputs
    const [localGrowthRate, setLocalGrowthRate] = React.useState<string>(
      (item as Asset).growthRate != null ? (item as Asset).growthRate.toString().replace('.', ',') : ''
    );

    React.useEffect(() => {
      if (type === 'asset' && (item as Asset).growthRate != null) {
        setLocalGrowthRate((item as Asset).growthRate.toString().replace('.', ','));
      }
    }, [item, type]);

    const getValue = () => {
      switch (type) {
        case 'asset':
          return (item as Asset).value;
        case 'liability':
          return (item as Liability).balance;
        case 'income':
          return (item as Income).monthlyAmount;
        case 'expense':
          return (item as Expense).monthlyAmount;
      }
    };

    const getName = () => {
      switch (type) {
        case 'asset':
          return (item as Asset).name;
        case 'liability':
          return (item as Liability).name;
        case 'income':
          return (item as Income).source;
        case 'expense':
          return (item as Expense).category;
      }
    };

    const getSubtext = () => {
      switch (type) {
        case 'asset':
          const asset = item as Asset;
          return asset.type === 'stock' && asset.stockSymbol
            ? `${getStockNameBySymbol(asset.stockSymbol) || asset.stockSymbol} • ${asset.quantity} shares`
            : `${asset.growthRate}% growth`;
        case 'liability':
          const liability = item as Liability;
          return `${formatCurrency(liability.minimumPayment, currency)}/month • ${liability.interestRate}% APR`;
        case 'income':
          const income = item as Income;
          if (income.hasDateRange && (income.startDate || income.endDate)) {
            const dateRange = [];
            if (income.startDate) dateRange.push(`ab ${new Date(income.startDate).toLocaleDateString('de-DE')}`);
            if (income.endDate) dateRange.push(`bis ${new Date(income.endDate).toLocaleDateString('de-DE')}`);
            return dateRange.join(' ');
          }
          return 'Monatliches Einkommen';
        case 'expense':
          return 'Monatliche Ausgabe';
      }
    };

    const renderStockGrowthControls = () => {
      if (type !== 'asset') return null;
      const asset = item as Asset;
      if (asset.type !== 'stock') return null;

      return (
        <div className="mt-2 space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className={`text-[11px] font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Wachstumsmethode</label>
              <select
                value={asset.stockGrowthType || 'rate'}
                onChange={(e) => {
                  onUpdateAssetStockGrowthType(asset.id, e.target.value as 'rate' | 'targets');
                }}
                className={`w-full px-2 py-2 text-xs border ${darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white'} rounded-lg`}
              >
                <option value="rate">Feste Jahresrate</option>
                <option value="targets">Zieldatumspreise</option>
              </select>
            </div>

            {(asset.stockGrowthType || 'rate') === 'rate' && (
              <div>
                <label className={`text-[11px] font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Jährliche Wachstumsrate (%)</label>
                <input
                  type="text"
                  value={localGrowthRate}
                  onChange={(e) => setLocalGrowthRate(e.target.value)}
                  onBlur={() => {
                    const v = localGrowthRate.replace(',', '.');
                    const parsed = parseFloat(v);
                    onUpdateAssetGrowthRate(asset.id, isNaN(parsed) ? 0 : parsed);
                    setLocalGrowthRate((isNaN(parsed) ? 0 : parsed).toString().replace('.', ',')); // Ensure consistent display
                  }}
                  className={`w-full px-2 py-2 text-xs border ${darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white'} rounded-lg`}
                  placeholder="7,0"
                />
              </div>
            )}
          </div>

          {(asset.stockGrowthType || 'rate') === 'targets' && (
            <div className="space-y-2">
              {showBetaFeatures && (
                <div className="mb-1">
                  <label className="inline-flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      checked={asset.useEstimation || false}
                      onChange={(e) => onUpdateAssetUseEstimation(asset.id, e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Preise zwischen jetzt und Zieldaten schätzen</span>
                  </label>
                </div>
              )}
              <div className="flex items-center justify-between">
                <label className={`text-[11px] font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Zielpreise</label>
                <button
                  type="button"
                  onClick={() => {
                    const newTargets = [...(asset.stockTargets || []), { date: '', expectedPrice: 0 }];
                    onUpdateAssetStockTarget(asset.id, newTargets);
                  }}
                  className="px-2 py-1 text-[11px] bg-blue-500 text-white rounded"
                >
                  + Hinzufügen
                </button>
              </div>
              <div className="space-y-2">
                {(asset.stockTargets || []).map((t, idx) => (
                  <StockTargetItem
                    key={idx} // Using index as key is acceptable here as items are managed by a stable array prop
                    target={t}
                    index={idx}
                    assetId={asset.id}
                    onUpdateAssetStockTarget={onUpdateAssetStockTarget}
                    onRemoveStockTarget={(id, indexToRemove) => {
                      const arr = (asset.stockTargets || []).filter((_, i) => i !== indexToRemove);
                      onUpdateAssetStockTarget(id, arr);
                    }}
                    darkMode={darkMode}
                    assetStockTargets={asset.stockTargets || []}
                  />
                ))}
                {(asset.stockTargets || []).length === 0 && (
                  <div className={`text-[11px] ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Keine Zielpreise festgelegt.</div>
                )}
              </div>
              <div className={`text-[11px] ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Hinweis: Bei Zieldatumspreisen wird die Wachstumsrate deaktiviert und die Aktie wächst nach dem letzten Zieldatum nicht weiter.
              </div>
            </div>
          )}
        </div>
      );
    };

    return (
      <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-xl border p-3 hover:shadow-md transition-all group`} style={{ fontFamily: 'Arial, sans-serif' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1">
            <div className="flex-1 min-w-0">
              <h3 className={`font-medium text-sm ${darkMode ? 'text-white' : 'text-gray-900'} truncate`}>
                {getName() || 'Unnamed'}
              </h3>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} truncate`}>
                {getSubtext()}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="text-right">
              <p className={`font-semibold text-sm ${colorClass}`}>
                {formatCurrency(getValue(), currency)}
              </p>
            </div>
            <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => onEditItem(item, type)}
                className={`p-1 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} rounded transition-colors`}
              >
                <Edit3 className={`w-3 h-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              </button>
              {!(item as any).isPermanent && (
                <button
                  onClick={() => onDeleteItem(item.id, type)}
                  className={`p-1 hover:bg-red-100 rounded transition-colors`}
                >
                  <Trash2 className="w-3 h-3 text-red-500" />
                </button>
              )}
            </div>
          </div>
        </div>
        {renderStockGrowthControls()}
      </div>
    );
  };

  const monthlyNet = data.income.reduce((sum, income) => sum + income.monthlyAmount, 0) - 
                    data.expenses.reduce((sum, expense) => sum + expense.monthlyAmount, 0) - 
                    data.liabilities.reduce((sum, liability) => sum + liability.minimumPayment + ((liability.balance * liability.interestRate / 100) / 12), 0);

  const handleStockSymbolChange = (value: string) => {
    onUpdateInvestmentStock(value.toUpperCase());
    
    if (value.length > 0) {
      const suggestions = searchStockSymbols(value);
      setStockSuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0);
    } else {
      setStockSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const selectStockSuggestion = (symbol: string) => {
    onUpdateInvestmentStock(symbol);
    setShowSuggestions(false);
    setStockSuggestions([]);
  };

  return (
    <div>
      <div className={`${darkMode ? 'bg-slate-800/60 border-slate-700/50' : 'bg-white/80 border-slate-200/50'} rounded-2xl border p-6 shadow-2xl backdrop-blur-xl`} style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'} tracking-tight`}>
            {getTranslation('yourFinancialOverview', language)}
          </h2>
          <div className="flex space-x-2">
            <button
              onClick={() => onAddItem('asset')}
              className={`px-4 py-2 text-xs bg-emerald-100 text-emerald-700 rounded-xl hover:bg-emerald-200 transition-all duration-300 font-semibold shadow-sm hover:shadow-md transform hover:scale-105`}
            >
              + {getTranslation('addAsset', language)}
            </button>
            <button
              onClick={() => onAddItem('liability')}
              className={`px-4 py-2 text-xs bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition-all duration-300 font-semibold shadow-sm hover:shadow-md transform hover:scale-105`}
            >
              + {getTranslation('addDebt', language)}
            </button>
            <button
              onClick={() => onAddItem('income')}
              className={`px-4 py-2 text-xs bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 transition-all duration-300 font-semibold shadow-sm hover:shadow-md transform hover:scale-105`}
            >
              + {getTranslation('addIncome', language)}
            </button>
            <button
              onClick={() => onAddItem('expense')}
              className={`px-4 py-2 text-xs bg-orange-100 text-orange-700 rounded-xl hover:bg-orange-200 transition-all duration-300 font-semibold shadow-sm hover:shadow-md transform hover:scale-105`}
            >
              + {getTranslation('addExpense', language)}
            </button>
          </div>
        </div>
        
        <div className="space-y-2">
          {allItems.map((item) => (
            <ItemCard
              key={`${item.itemType}-${item.id}`}
              item={item}
              type={item.itemType}
              colorClass={item.colorClass}
            />
          ))}
        </div>
        
        {allItems.length === 1 && (
          <div className={`text-center py-8 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            <p className="text-base font-medium">
              {getTranslation('noFinancialItemsAdded', language)}
            </p>
          </div>
        )}
        
        {/* Investment Percentage Section */}
        <div className={`mt-6 p-6 rounded-xl border ${monthlyNet > 0 ? (darkMode ? 'border-blue-600/50 bg-blue-700/20' : 'border-blue-200/50 bg-blue-50/50') : (darkMode ? 'border-slate-600/50 bg-slate-700/50' : 'border-slate-200/50 bg-slate-50/50')} backdrop-blur-sm`}>
          <div 
            className="flex items-center justify-between mb-4 cursor-pointer group"
            onClick={() => setIsInvestmentExpanded(!isInvestmentExpanded)}
          >
            <h3 className={`text-base font-bold ${monthlyNet > 0 ? (darkMode ? 'text-blue-300' : 'text-blue-700') : (darkMode ? 'text-slate-400' : 'text-slate-600')} tracking-tight`}>
              💰 Automatische Anlage
            </h3>
            <div className="flex items-center space-x-2">
              <div className={`text-sm font-medium ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Netto: {formatCurrency(monthlyNet, currency)}/Monat
              </div>
              <div className={`p-2 rounded-full ${darkMode ? 'bg-slate-600/50 group-hover:bg-slate-500/50' : 'bg-slate-200/50 group-hover:bg-slate-300/50'} transition-all duration-300`}>
                {isInvestmentExpanded ? (
                  <ChevronUp className={`w-5 h-5 ${darkMode ? 'text-white' : 'text-slate-700'}`} />
                ) : (
                  <ChevronDown className={`w-5 h-5 ${darkMode ? 'text-white' : 'text-slate-700'}`} />
                )}
              </div>
            </div>
          </div>
          
          {isInvestmentExpanded && (
            <>
              <div className="flex items-center space-x-3">
                <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Investment-Anteil:
                </label>
                <input
                  type="text"
                  value={localInvestmentPercentage}
                  onChange={(e) => setLocalInvestmentPercentage(e.target.value)}
                  onBlur={() => {
                    const normalized = localInvestmentPercentage.replace(',', '.');
                    const n = parseFloat(normalized);
                    const clamped = Math.max(0, Math.min(100, isNaN(n) ? 0 : n));
                    onUpdateInvestmentPercentage(clamped);
                    setLocalInvestmentPercentage(clamped.toString().replace('.', ','));
                  }}
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
                      onClick={() => onUpdateInvestmentType('rate')}
                      className={`flex items-center space-x-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                        data.investmentType === 'rate'
                          ? 'bg-blue-500 text-white'
                          : darkMode ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      <Percent className="w-4 h-4" />
                      <span>Zinssatz</span>
                    </button>
                    <button
                      onClick={() => onUpdateInvestmentType('stock')}
                      className={`flex items-center space-x-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                        data.investmentType === 'stock'
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
                {data.investmentType === 'rate' && (
                  <div className="flex items-center space-x-3">
                    <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Jährlicher Zinssatz:
                    </label>
                    <input
                      type="text"
                      value={localInvestmentRate}
                      onChange={(e) => setLocalInvestmentRate(e.target.value)}
                      onBlur={() => {
                        const value = localInvestmentRate.replace(',', '.');
                        const n = parseFloat(value);
                        onUpdateInvestmentRate(isNaN(n) ? 0 : n);
                        setLocalInvestmentRate((isNaN(n) ? 0 : n).toString().replace('.', ','));
                      }}
                      className={`w-20 px-3 py-2 text-sm border ${darkMode ? 'border-gray-500 bg-gray-600 text-white' : 'border-gray-300 bg-white'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center`}
                      placeholder="z.B. 7,0"
                    />
                    <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>%</span>
                  </div>
                )}

                {/* Stock-based Investment */}
                {data.investmentType === 'stock' && (
                  <div className="space-y-2">
                    <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Aktien-Symbol:
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={data.investmentStockSymbol || ''}
                        onChange={(e) => handleStockSymbolChange(e.target.value)}
                        className={`w-full px-3 py-2 text-sm border ${darkMode ? 'border-gray-500 bg-gray-600 text-white' : 'border-gray-300 bg-white'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                        placeholder="z.B. AAPL, MSFT, TSLA"
                      />
                      {showSuggestions && stockSuggestions.length > 0 && (
                        <div className={`absolute z-10 w-full mt-1 ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'} border rounded-lg shadow-lg max-h-32 overflow-y-auto`}>
                          {stockSuggestions.map((suggestion) => (
                            <button
                              key={suggestion.symbol}
                              onClick={() => selectStockSuggestion(suggestion.symbol)}
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
                )}
              </div>
            </>
          )}

          {monthlyNet > 0 ? (
            <div className={`mt-2 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'} space-y-1`}>
              <div>💼 Investment: {formatCurrency(monthlyNet * (data.investmentPercentage || 0) / 100, currency)}/Monat 
                {data.investmentType === 'rate' 
                  ? ` (${data.investmentRate || 7}% Zinsen)` 
                  : data.investmentStockSymbol 
                    ? ` (${getStockNameBySymbol(data.investmentStockSymbol) || data.investmentStockSymbol} Aktien)` 
                    : ' (Aktie wählen)'
                }
              </div>
              <div>🏦 Bankkonto: {formatCurrency(monthlyNet * (100 - (data.investmentPercentage || 0)) / 100, currency)}/Monat (0% Zinsen)</div>
            </div>
          ) : (
            <div className={`mt-2 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Füge Einkommen hinzu, um automatische Anlagen zu aktivieren
            </div>
          )}
        </div>
      </div>
    </div>
  );
}