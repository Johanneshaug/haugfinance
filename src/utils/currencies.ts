import { Currency } from '../types/financial';

// Exchange rates (relative to USD) - will be updated in real-time
let EXCHANGE_RATES: Record<string, number> = {
  'USD': 1.0,
};

let lastCurrencyUpdate = 0;

export const currencies: Currency[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
];

export async function updateExchangeRates(): Promise<boolean> {
  try {
    // Use exchangerate-api.com (free tier: 1500 requests/month)
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    const data = await response.json();
    
    if (data.rates) {
      // Update exchange rates
      EXCHANGE_RATES = {
        'USD': 1.0,
        'EUR': data.rates.EUR,
        'GBP': data.rates.GBP,
        'JPY': data.rates.JPY,
        'CAD': data.rates.CAD,
        'AUD': data.rates.AUD,
        'CHF': data.rates.CHF,
        'CNY': data.rates.CNY,
        'INR': data.rates.INR,
        'BRL': data.rates.BRL,
      };
      
      lastCurrencyUpdate = Date.now();
      console.log('Currency rates updated:', new Date().toLocaleTimeString('de-DE'));
      console.log('API provided EUR rate:', data.rates.EUR); // Debug log
      return true;
    }
    
    throw new Error('No rates data received');
  } catch (error) {
    console.warn('Failed to update currency rates, using cached rates:', error);
    return false;
  }
}

export function getLastCurrencyUpdate(): number {
  return lastCurrencyUpdate;
}

export function formatCurrency(amount: number, currencyCode: string): string {
  const currency = currencies.find(c => c.code === currencyCode) || currencies[0];
  
  // For JPY and other currencies without decimal places
  const minimumFractionDigits = ['JPY', 'KRW'].includes(currencyCode) ? 0 : 2;
  const maximumFractionDigits = ['JPY', 'KRW'].includes(currencyCode) ? 0 : 2;
  
  // Use German number formatting manually to ensure comma for decimals
  const roundedAmount = Math.round(amount * 100) / 100;
  const parts = roundedAmount.toFixed(2).split('.');
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const decimalPart = parts[1];
  
  return `${integerPart},${decimalPart}${currency.symbol}`;
}

export function convertCurrency(amount: number, fromCurrency: string, toCurrency: string): number {
  if (fromCurrency === toCurrency) return amount;
  
  console.log(`Converting ${amount} ${fromCurrency} to ${toCurrency}. Current ${fromCurrency} rate: ${EXCHANGE_RATES[fromCurrency]}, Current ${toCurrency} rate: ${EXCHANGE_RATES[toCurrency]}`); // Debug log

  // Convert to USD first, then to target currency
  const usdAmount = amount / EXCHANGE_RATES[fromCurrency];
  return usdAmount * EXCHANGE_RATES[toCurrency];
}

export function getExchangeRate(fromCurrency: string, toCurrency: string): number {
  if (fromCurrency === toCurrency) return 1;
  return EXCHANGE_RATES[toCurrency] / EXCHANGE_RATES[fromCurrency];
}