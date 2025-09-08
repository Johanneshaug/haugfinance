import React, { useState, useEffect, useRef } from 'react';
import { X, TrendingUp, RefreshCw, Plus, Trash2 } from 'lucide-react';
import { Asset, Liability, Income, Expense } from '../types/financial';
import { fetchStockPrice, searchStockSymbols } from '../utils/stockApi';
import { getTranslation } from '../utils/languages';
import { DistributionFrequency } from '../types/financial'; // Import DistributionFrequency

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: Asset | Liability | Income | Expense | null;
  type: 'asset' | 'liability' | 'income' | 'expense';
  onSave: (item: Asset | Liability | Income | Expense) => void;
  currency: string;
  language: string;
  darkMode: boolean;
}

export function EditModal({ isOpen, onClose, item, type, onSave, currency, language, darkMode }: EditModalProps) {
  const [editedItem, setEditedItem] = useState<any>(null);
  const [loadingStock, setLoadingStock] = useState(false);
  const [stockSuggestions, setStockSuggestions] = useState<Array<{ symbol: string; name: string }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const stockInputRef = useRef<HTMLInputElement>(null);
  const [stockGrowthType, setStockGrowthType] = useState<'rate' | 'targets'>('rate');
  const [stockTargets, setStockTargets] = useState<Array<{ date: string; expectedPrice: number }>>([]);

  // Local states for numeric inputs in EditModal
  const [localQuantity, setLocalQuantity] = useState<string>('');
  const [localValue, setLocalValue] = useState<string>(''); // For non-stock assets
  const [localGrowthRate, setLocalGrowthRate] = useState<string>(''); // For stock growth rate or other assets
  const [localBalance, setLocalBalance] = useState<string>('');
  const [localMinimumPayment, setLocalMinimumPayment] = useState<string>('');
  const [localInterestRate, setLocalInterestRate] = useState<string>('');
  const [localMonthlyAmount, setLocalMonthlyAmount] = useState<string>(''); // For income/expense
  const [localDistributionFrequency, setLocalDistributionFrequency] = useState<DistributionFrequency>('yearly');

  useEffect(() => {
    if (item) {
      setEditedItem({ ...item });
      if (item.type === 'asset') {
        const asset = item as Asset;
        setStockGrowthType(asset.stockGrowthType || 'rate');
        setStockTargets(asset.stockTargets || []);
        setLocalQuantity(asset.quantity != null ? asset.quantity.toString().replace('.', ',') : '');
        // Only set localValue if it's a non-stock asset. Stock asset value is readOnly and derived.
        if (asset.type !== 'stock') {
          setLocalValue(asset.value != null ? asset.value.toString().replace('.', ',') : '');
        } else {
          setLocalValue(''); // Clear if it's a stock asset, as it's read-only
        }
        setLocalGrowthRate(asset.growthRate != null ? asset.growthRate.toString().replace('.', ',') : '');
        setLocalDistributionFrequency(asset.distributionFrequency || 'yearly');
      } else if (item.type === 'liability') {
        const liability = item as Liability;
        setLocalBalance(liability.balance != null ? liability.balance.toString().replace('.', ',') : '');
        setLocalMinimumPayment(liability.minimumPayment != null ? liability.minimumPayment.toString().replace('.', ',') : '');
        setLocalInterestRate(liability.interestRate != null ? liability.interestRate.toString().replace('.', ',') : '');
        setLocalGrowthRate(''); // Clear growth rate for liabilities
        setLocalValue(''); // Clear value for liabilities
        setLocalDistributionFrequency('yearly'); // Default for non-asset types or if not specified
      } else if (item.type === 'income') {
        const income = item as Income;
        setLocalMonthlyAmount(income.monthlyAmount != null ? income.monthlyAmount.toString().replace('.', ',') : '');
        setLocalGrowthRate(income.growthRate != null ? income.growthRate.toString().replace('.', ',') : ''); // Income might have growth rate
        setLocalBalance(''); // Clear for other types
        setLocalMinimumPayment(''); // Clear for other types
        setLocalInterestRate(''); // Clear for other types
        setLocalValue(''); // Clear for other types
        setLocalDistributionFrequency('yearly');
      } else if (item.type === 'expense') {
        const expense = item as Expense;
        setLocalMonthlyAmount(expense.monthlyAmount != null ? expense.monthlyAmount.toString().replace('.', ',') : '');
        setLocalGrowthRate(''); // Clear growth rate for expenses
        setLocalBalance(''); // Clear for other types
        setLocalMinimumPayment(''); // Clear for other types
        setLocalInterestRate(''); // Clear for other types
        setLocalValue(''); // Clear for other types
        setLocalDistributionFrequency('yearly');
      }
    }
  }, [item]);

  // Auto-calculate value when quantity changes for stocks
  useEffect(() => {
    if (editedItem?.type === 'stock' && editedItem.stockSymbol && localQuantity && localQuantity !== '') {
      fetchStockDataForSymbol(editedItem.stockSymbol);
    }
  }, [localQuantity, editedItem?.stockSymbol]); // Depend on localQuantity

  if (!isOpen || !item || !editedItem) return null;

  const currencySymbol = currency === 'USD' ? '$' : currency;

  const handleSave = () => {
    if (editedItem.type === 'stock') {
      // Ensure the final numeric values are saved from local states if still in focus
      const quantityParsed = parseFloat(localQuantity.replace(',', '.'));
      editedItem.quantity = isNaN(quantityParsed) ? 0 : quantityParsed;

      const growthRateParsed = parseFloat(localGrowthRate.replace(',', '.'));
      editedItem.growthRate = isNaN(growthRateParsed) ? 0 : growthRateParsed;

      // For stock targets, ensure expectedPrice is numeric
      editedItem.stockTargets = stockTargets.map(target => ({
        ...target,
        expectedPrice: typeof target.expectedPrice === 'string' 
          ? (isNaN(parseFloat((target.expectedPrice as string).replace(',', '.'))) ? 0 : parseFloat((target.expectedPrice as string).replace(',', '.')))
          : target.expectedPrice
      }));

      editedItem.stockGrowthType = stockGrowthType;
      editedItem.stockTargets = stockTargets; // This is already handled by the map above
      editedItem.distributionFrequency = localDistributionFrequency; // Save distribution frequency
    } else if (editedItem.type === 'liability') {
      const balanceParsed = parseFloat(localBalance.replace(',', '.'));
      editedItem.balance = isNaN(balanceParsed) ? 0 : balanceParsed;

      const minPaymentParsed = parseFloat(localMinimumPayment.replace(',', '.'));
      editedItem.minimumPayment = isNaN(minPaymentParsed) ? 0 : minPaymentParsed;

      const interestRateParsed = parseFloat(localInterestRate.replace(',', '.'));
      editedItem.interestRate = isNaN(interestRateParsed) ? 0 : interestRateParsed;
    } else if (editedItem.type === 'income') { // Separated income and expense to handle growthRate correctly
      const monthlyAmountParsed = parseFloat(localMonthlyAmount.replace(',', '.'));
      editedItem.monthlyAmount = isNaN(monthlyAmountParsed) ? 0 : monthlyAmountParsed;

      const incomeGrowthRateParsed = parseFloat(localGrowthRate.replace(',', '.'));
      editedItem.growthRate = isNaN(incomeGrowthRateParsed) ? 0 : incomeGrowthRateParsed; // Ensure income growth rate is saved
    } else if (editedItem.type === 'expense') { // Separated income and expense to handle growthRate correctly
      const monthlyAmountParsed = parseFloat(localMonthlyAmount.replace(',', '.'));
      editedItem.monthlyAmount = isNaN(monthlyAmountParsed) ? 0 : monthlyAmountParsed;
    } else if (editedItem.type !== 'stock') { // For cash/investment assets (non-stock)
      const valueParsed = parseFloat(localValue.replace(',', '.'));
      editedItem.value = isNaN(valueParsed) ? 0 : valueParsed;
    }

    onSave(editedItem);
    onClose();
  };

  const updateStockPrice = async () => {
    if (!editedItem.stockSymbol || !localQuantity) return;
    
    setLoadingStock(true);
    try {
      const stockData = await fetchStockPrice(editedItem.stockSymbol, currency);
      if (stockData) {
        const quantity = parseFloat(localQuantity.replace(',', '.')) || 0;
        const newValue = stockData.price * quantity;
        setEditedItem({ ...editedItem, value: newValue });
        setLocalValue(newValue.toString().replace('.', ',')); // Update local value for consistency
      }
    } catch (error) {
      console.error('Error updating stock price:', error);
    } finally {
      setLoadingStock(false);
    }
  };

  const handleStockSymbolChange = (value: string) => {
    setEditedItem({ ...editedItem, stockSymbol: value.toUpperCase() });
    
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
    setEditedItem({ ...editedItem, stockSymbol: symbol });
    setShowSuggestions(false);
    setStockSuggestions([]);
    
    // Auto-fetch stock data when symbol is selected
    fetchStockDataForSymbol(symbol);
  };

  const fetchStockDataForSymbol = async (symbol: string) => {
    if (!symbol || !localQuantity) return;
    
    setLoadingStock(true);
    try {
      const stockData = await fetchStockPrice(symbol, currency);
      if (stockData) {
        const quantity = parseFloat(localQuantity.replace(',', '.')) || 0;
        const newValue = stockData.price * quantity;
        setEditedItem(prev => ({ 
          ...prev, 
          name: symbol, // Use symbol as name for stocks
          value: newValue,
          growthRate: 0 // Default stock growth rate
        }));
        setLocalValue(newValue.toString().replace('.', ',')); // Update local value for consistency
      }
    } catch (error) {
      console.error('Error fetching stock data:', error);
    } finally {
      setLoadingStock(false);
    }
  };

  const addStockTarget = () => {
    const newTarget = { date: '', expectedPrice: 0 };
    setStockTargets([...stockTargets, newTarget]);
  };

  const removeStockTarget = (index: number) => {
    setStockTargets(stockTargets.filter((_, i) => i !== index));
  };

  const updateStockTarget = (index: number, field: 'date' | 'expectedPrice', value: string | number) => {
    const updatedTargets = [...stockTargets];
    updatedTargets[index] = { ...updatedTargets[index], [field]: value };
    setStockTargets(updatedTargets);
  };

  // New sub-component for handling individual stock targets within the modal
  interface EditStockTargetItemProps {
    target: { date: string; expectedPrice: number };
    index: number;
    onUpdateStockTarget: (index: number, field: 'date' | 'expectedPrice', value: string | number) => void;
    onRemoveStockTarget: (indexToRemove: number) => void;
    darkMode: boolean;
  }

  const EditStockTargetItem: React.FC<EditStockTargetItemProps> = React.memo(({
    target,
    index,
    onUpdateStockTarget,
    onRemoveStockTarget,
    darkMode,
  }) => {
    const [localExpectedPrice, setLocalExpectedPrice] = useState<string>(
      target.expectedPrice != null ? target.expectedPrice.toString().replace('.', ',') : ''
    );

    useEffect(() => {
      // Only update local state if the prop changes and it's not currently being edited (i.e., on blur of another field)
      const formattedPrice = target.expectedPrice != null ? target.expectedPrice.toString().replace('.', ',') : '';
      if (localExpectedPrice !== formattedPrice) {
        setLocalExpectedPrice(formattedPrice);
      }
    }, [target.expectedPrice]);

    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setLocalExpectedPrice(e.target.value);
    };

    const handlePriceBlur = () => {
      const v = localExpectedPrice.replace(',', '.');
      const parsed = parseFloat(v);
      const newPrice = isNaN(parsed) ? 0 : parsed;

      onUpdateStockTarget(index, 'expectedPrice', newPrice);
      // Ensure local state reflects the parsed/formatted value
      setLocalExpectedPrice(newPrice.toString().replace('.', ','));
    };

    return (
      <div key={index} className={`flex items-center space-x-2 p-3 border ${darkMode ? 'border-gray-600 bg-gray-700' : 'bg-gray-50'} rounded-lg`}>
        <div className="flex-1">
          <input
            type="date"
            value={target.date}
            onChange={(e) => onUpdateStockTarget(index, 'date', e.target.value)}
            className={`w-full px-2 py-1 text-sm border ${darkMode ? 'border-gray-500 bg-gray-600 text-white' : 'border-gray-300 bg-white'} rounded focus:ring-1 focus:ring-orange-500`}
          />
        </div>
        <div className="flex-1">
          <div className="relative">
            <input
              type="text"
              value={localExpectedPrice}
              onChange={handlePriceChange}
              onBlur={handlePriceBlur}
              className={`w-full px-2 py-1 text-sm border ${darkMode ? 'border-gray-500 bg-gray-600 text-white' : 'border-gray-300 bg-white'} rounded focus:ring-1 focus:ring-orange-500`}
              placeholder="0,00"
            />
            <span className={`absolute right-2 top-1 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>€</span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onRemoveStockTarget(index)}
          className="p-1 text-red-500 hover:bg-red-100 rounded transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    );
  });

  const getTitle = () => {
    switch (type) {
      case 'asset': return getTranslation('editAsset', language);
      case 'liability': return getTranslation('editDebt', language);
      case 'income': return getTranslation('editIncome', language);
      case 'expense': return getTranslation('editExpense', language);
    }
  };

  const getFields = () => {
    switch (type) {
      case 'asset':
        return (
          <>
            {editedItem.id !== 'permanent-bank-account' && (
              <div>
                <label className={`block text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  {getTranslation('assetType', language)}
                </label>
                <select
                  value={editedItem.type || 'stock'}
                  onChange={(e) => setEditedItem({ ...editedItem, type: e.target.value })}
                  className={`w-full px-4 py-3 border ${darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white'} rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent`}
                >
                  <option value="cash">{getTranslation('cash', language)}</option>
                  <option value="investment">{getTranslation('investment', language)}</option>
                  <option value="stock">{getTranslation('stock', language)}</option>
                </select>
              </div>
            )}

            {editedItem.id !== 'permanent-bank-account' && (
              <div>
                <label className={`block text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  {getTranslation('assetName', language)}
                </label>
                <input
                  type="text"
                  value={editedItem.name || ''}
                  onChange={(e) => setEditedItem({ ...editedItem, name: e.target.value })}
                  className={`w-full px-4 py-3 border ${darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white'} rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent`}
                  placeholder={getTranslation('placeholderSavingsAccount', language)}
                />
              </div>
            )}

            {editedItem.type === 'stock' && (
              <div>
                <label className={`block text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  {getTranslation('stockSymbol', language)}
                </label>
                <div className="relative">
                  <input
                    ref={stockInputRef}
                    type="text"
                    value={editedItem.stockSymbol || ''}
                    onChange={(e) => handleStockSymbolChange(e.target.value)}
                    className={`w-full px-4 py-3 border ${darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white'} rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent`}
                    placeholder="z.B. AAPL"
                  />
                  {showSuggestions && stockSuggestions.length > 0 && (
                    <div className={`absolute z-10 w-full mt-1 ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'} border rounded-xl shadow-lg max-h-48 overflow-y-auto`}>
                      {stockSuggestions.map((suggestion) => (
                        <button
                          key={suggestion.symbol}
                          onClick={() => selectStockSuggestion(suggestion.symbol)}
                          className={`w-full text-left px-4 py-3 ${darkMode ? 'hover:bg-gray-600 text-white' : 'hover:bg-gray-50'} transition-colors`}
                        >
                          <div className="font-semibold">{suggestion.symbol}</div>
                          <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{suggestion.name}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {editedItem.type === 'stock' && (
              <div>
                <label className={`block text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  {getTranslation('numberOfShares', language)}
                </label>
                <input
                  type="text"
                  value={localQuantity}
                  onChange={(e) => setLocalQuantity(e.target.value)}
                  onBlur={() => {
                    const value = localQuantity.replace(',', '.');
                    const parsed = parseFloat(value);
                    setEditedItem({ ...editedItem, quantity: isNaN(parsed) ? 0 : parsed });
                    setLocalQuantity((isNaN(parsed) ? 0 : parsed).toString().replace('.', ','));
                  }}
                  className={`w-full px-4 py-3 border ${darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white'} rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent`}
                  placeholder="100,0"
                />
              </div>
            )}
            
            {editedItem.id !== 'permanent-bank-account' && editedItem.type !== 'stock' && ( // Added editedItem.type !== 'stock'
              <div>
                <label className={`block text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  {getTranslation('currentValue', language)}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={localValue}
                    onChange={(e) => setLocalValue(e.target.value)}
                    onBlur={() => {
                      const value = localValue.replace(',', '.');
                      const parsed = parseFloat(value);
                      setEditedItem({ ...editedItem, value: isNaN(parsed) ? 0 : parsed });
                      setLocalValue((isNaN(parsed) ? 0 : parsed).toString().replace('.', ','));
                    }}
                    className={`w-full px-4 py-3 border ${darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white'} rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent`}
                    placeholder="0,00"
                  />
                  <span className={`absolute right-4 top-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>€</span>
                </div>
              </div>
            )}

            {editedItem.type === 'stock' && (
              <div>
                <label className={`block text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  {getTranslation('currentValue', language)} {loadingStock && '(Wird berechnet...)'}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={editedItem.value != null ? editedItem.value.toString().replace('.', ',') : ''}
                    readOnly
                    className={`w-full px-4 py-3 border ${darkMode ? 'border-gray-600 bg-gray-600 text-gray-300' : 'border-gray-200 bg-gray-100 text-gray-600'} rounded-xl cursor-not-allowed`}
                    placeholder="Automatisch berechnet"
                  />
                  <span className={`absolute right-4 top-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>€</span>
                </div>
              </div>
            )}

            {editedItem.type === 'stock' && (
              <div>
                <div>
                  <label className={`block text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                    Wachstumsmethode
                  </label>
                  <select
                    value={stockGrowthType || 'rate'} // Use local state for growth type
                    onChange={(e) => setStockGrowthType(e.target.value as 'rate' | 'targets')}
                    className={`w-full px-4 py-3 border ${darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white'} rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent`}
                  >
                    <option value="rate">Jährliche Wachstumsrate</option>
                    <option value="targets">Zielpreise zu bestimmten Daten</option>
                  </select>
                </div>

                {stockGrowthType === 'rate' && (
                  <div>
                    <label className={`block text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                      {getTranslation('annualGrowthRate', language)} (p.a.)
                    </label>
                    <input
                      type="text"
                      value={localGrowthRate}
                      onChange={(e) => setLocalGrowthRate(e.target.value)}
                      onBlur={() => {
                        const value = localGrowthRate.replace(',', '.');
                        const parsed = parseFloat(value);
                        setEditedItem({ ...editedItem, growthRate: isNaN(parsed) ? 0 : parsed });
                        setLocalGrowthRate((isNaN(parsed) ? 0 : parsed).toString().replace('.', ','));
                      }}
                      className={`w-full px-4 py-3 border ${darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white'} rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent`}
                      placeholder="7,0"
                    />
                  </div>
                )}

                {stockGrowthType === 'targets' && (
                  <div>
                    <div className="mb-4">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={editedItem.useEstimation || false}
                          onChange={(e) => setEditedItem({ ...editedItem, useEstimation: e.target.checked })}
                          className="rounded border-gray-300 text-blue-600 focus:ring-orange-500"
                        />
                        <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Preise zwischen jetzt und Zieldaten schätzen
                        </span>
                      </label>
                      <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Wenn deaktiviert, wird der aktuelle Preis bis zum Zieldatum beibehalten
                      </p>
                    </div>
                    <div className="flex items-center justify-between mb-3">
                      <label className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Zielpreise
                      </label>
                      <button
                        type="button"
                        onClick={addStockTarget}
                        className="flex items-center space-x-1 px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Hinzufügen</span>
                      </button>
                    </div>
                    <div className="space-y-3 max-h-40 overflow-y-auto">
                      {stockTargets.map((target, index) => (
                        <EditStockTargetItem
                          key={index} // Index as key is acceptable here due to stable array management
                          target={target}
                          index={index}
                          onUpdateStockTarget={updateStockTarget}
                          onRemoveStockTarget={removeStockTarget}
                          darkMode={darkMode}
                        />
                      ))}
                      {stockTargets.length === 0 && (
                        <div className={`text-center py-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          Keine Zielpreise definiert. Klicken Sie "Hinzufügen" um einen Zielpreis festzulegen.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            {/* Changed from editedItem.type !== 'stock' to always show for assets */}
            {type === 'asset' && (
              <div>
                <label className={`block text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  {getTranslation('distributionFrequency', language)}
                </label>
                <select
                  value={localDistributionFrequency}
                  onChange={(e) => setLocalDistributionFrequency(e.target.value as DistributionFrequency)}
                  className={`w-full px-4 py-3 border ${darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white'} rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent`}
                >
                  <option value="monthly">{getTranslation('monthly', language)}</option>
                  <option value="quarterly">{getTranslation('quarterly', language)}</option>
                  <option value="yearly">{getTranslation('yearly', language)}</option>
                </select>
              </div>
            )}
          </>
        );

      case 'liability':
        return (
          <>
            <div>
              <label className={`block text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                {getTranslation('debtName', language)}
              </label>
              <input
                type="text"
                value={editedItem.name || ''}
                onChange={(e) => setEditedItem({ ...editedItem, name: e.target.value })}
                className={`w-full px-4 py-3 border ${darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white'} rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent`}
                placeholder={getTranslation('placeholderStudentLoan', language)}
              />
            </div>
            
            <div>
              <label className={`block text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                {getTranslation('currentBalance', language)}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={localBalance}
                  onChange={(e) => setLocalBalance(e.target.value)}
                  onBlur={() => {
                    const value = localBalance.replace(',', '.');
                    const parsed = parseFloat(value);
                    setEditedItem({ ...editedItem, balance: isNaN(parsed) ? 0 : parsed });
                    setLocalBalance((isNaN(parsed) ? 0 : parsed).toString().replace('.', ','));
                  }}
                  className={`w-full px-4 py-3 border ${darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white'} rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent`}
                  placeholder="0,00"
                />
                <span className={`absolute right-4 top-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>€</span>
              </div>
            </div>

            <div>
              <label className={`block text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                {getTranslation('monthlyPayment', language)}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={localMinimumPayment}
                  onChange={(e) => setLocalMinimumPayment(e.target.value)}
                  onBlur={() => {
                    const value = localMinimumPayment.replace(',', '.');
                    const parsed = parseFloat(value);
                    setEditedItem({ ...editedItem, minimumPayment: isNaN(parsed) ? 0 : parsed });
                    setLocalMinimumPayment((isNaN(parsed) ? 0 : parsed).toString().replace('.', ','));
                  }}
                  className={`w-full px-4 py-3 border ${darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white'} rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent`}
                  placeholder="0,00"
                />
                <span className={`absolute right-4 top-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>€</span>
              </div>
            </div>

            <div>
              <label className={`block text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                {getTranslation('interestRate', language)} (p.a.)
              </label>
              <input
                type="text"
                value={localInterestRate}
                onChange={(e) => setLocalInterestRate(e.target.value)}
                onBlur={() => {
                  const value = localInterestRate.replace(',', '.');
                  const parsed = parseFloat(value);
                  setEditedItem({ ...editedItem, interestRate: isNaN(parsed) ? 0 : parsed });
                  setLocalInterestRate((isNaN(parsed) ? 0 : parsed).toString().replace('.', ','));
                }}
                className={`w-full px-4 py-3 border ${darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white'} rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent`}
                placeholder="5,5"
              />
            </div>
          </>
        );

      case 'income':
        return (
          <>
            <div>
              <label className={`block text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                {getTranslation('incomeSource', language)}
              </label>
              <input
                type="text"
                value={editedItem.source || ''}
                onChange={(e) => setEditedItem({ ...editedItem, source: e.target.value })}
                className={`w-full px-4 py-3 border ${darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white'} rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                placeholder={getTranslation('placeholderSalary', language)}
              />
            </div>
            
            <div>
              <label className={`block text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                {getTranslation('monthlyAmount', language)}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={localMonthlyAmount}
                  onChange={(e) => setLocalMonthlyAmount(e.target.value)}
                  onBlur={() => {
                    const value = localMonthlyAmount.replace(',', '.');
                    const parsed = parseFloat(value);
                    setEditedItem({ ...editedItem, monthlyAmount: isNaN(parsed) ? 0 : parsed });
                    setLocalMonthlyAmount((isNaN(parsed) ? 0 : parsed).toString().replace('.', ','));
                  }}
                  className={`w-full px-4 py-3 border ${darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white'} rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                  placeholder="0,00"
                />
                <span className={`absolute right-4 top-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>€</span>
              </div>
            </div>

            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={editedItem.hasDateRange || false}
                  onChange={(e) => setEditedItem({ ...editedItem, hasDateRange: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-orange-500"
                />
                <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Zeitraum festlegen
                </span>
              </label>
            </div>

            {editedItem.hasDateRange && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                    Startdatum
                  </label>
                  <input
                    type="date"
                    value={editedItem.startDate || ''}
                    onChange={(e) => setEditedItem({ ...editedItem, startDate: e.target.value })}
                    className={`w-full px-4 py-3 border ${darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white'} rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                    Enddatum
                  </label>
                  <input
                    type="date"
                    value={editedItem.endDate || ''}
                    onChange={(e) => setEditedItem({ ...editedItem, endDate: e.target.value })}
                    className={`w-full px-4 py-3 border ${darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white'} rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent`}
                  />
                </div>
              </div>
            )}

          </>
        );

      case 'expense':
        return (
          <>
            <div>
              <label className={`block text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                {getTranslation('expenseCategory', language)}
              </label>
              <input
                type="text"
                value={editedItem.category || ''}
                onChange={(e) => setEditedItem({ ...editedItem, category: e.target.value })}
                className={`w-full px-4 py-3 border ${darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white'} rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent`}
                placeholder={getTranslation('placeholderLivingExpenses', language)}
              />
            </div>
            
            <div>
              <label className={`block text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                {getTranslation('monthlyAmount', language)}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={localMonthlyAmount}
                  onChange={(e) => setLocalMonthlyAmount(e.target.value)}
                  onBlur={() => {
                    const value = localMonthlyAmount.replace(',', '.');
                    const parsed = parseFloat(value);
                    setEditedItem({ ...editedItem, monthlyAmount: isNaN(parsed) ? 0 : parsed });
                    setLocalMonthlyAmount((isNaN(parsed) ? 0 : parsed).toString().replace('.', ','));
                  }}
                  className={`w-full px-4 py-3 border ${darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white'} rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent`}
                  placeholder="0,00"
                />
                <span className={`absolute right-4 top-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>€</span>
              </div>
            </div>

          </>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" style={{ fontFamily: 'Arial, sans-serif' }}>
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-3xl shadow-2xl p-8 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{getTitle()}</h2>
          <button
            onClick={onClose}
            className={`p-2 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} rounded-xl transition-colors`}
          >
            <X className={`w-6 h-6 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
          </button>
        </div>

        <div className="space-y-6">
          {getFields()}
        </div>

        <div className="flex space-x-4 mt-8">
          <button
            onClick={onClose}
            className={`flex-1 py-3 px-6 border-2 ${darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'} rounded-xl transition-colors font-semibold`}
          >
            {getTranslation('cancel', language)}
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-3 px-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all font-semibold"
          >
            {getTranslation('saveChanges', language)}
          </button>
        </div>
      </div>
    </div>
  );
}