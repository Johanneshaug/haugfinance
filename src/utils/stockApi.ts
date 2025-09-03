import { StockPrice } from '../types/financial';
import { convertCurrency } from './currencies';

// Popular stock symbols for autocomplete
const POPULAR_STOCKS = [
  { symbol: 'AAPL', name: 'Apple Inc.' },
  { symbol: 'MSFT', name: 'Microsoft Corporation' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.' },
  { symbol: 'TSLA', name: 'Tesla Inc.' },
  { symbol: 'META', name: 'Meta Platforms Inc.' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation' },
  { symbol: 'NFLX', name: 'Netflix Inc.' },
  { symbol: 'DIS', name: 'The Walt Disney Company' },
  { symbol: 'PYPL', name: 'PayPal Holdings Inc.' },
  { symbol: 'ADBE', name: 'Adobe Inc.' },
  { symbol: 'CRM', name: 'Salesforce Inc.' },
  { symbol: 'ORCL', name: 'Oracle Corporation' },
  { symbol: 'IBM', name: 'International Business Machines' },
  { symbol: 'INTC', name: 'Intel Corporation' },
  { symbol: 'AMD', name: 'Advanced Micro Devices' },
  { symbol: 'UBER', name: 'Uber Technologies Inc.' },
  { symbol: 'SPOT', name: 'Spotify Technology S.A.' },
  { symbol: 'ZOOM', name: 'Zoom Video Communications' },
  { symbol: 'SQ', name: 'Block Inc.' },
  { symbol: 'MSTR', name: 'MicroStrategy Incorporated' },
  // German stocks
  { symbol: 'SAP', name: 'SAP SE' },
  { symbol: 'ASML', name: 'ASML Holding N.V.' },
  { symbol: 'SIE.DE', name: 'Siemens AG' },
  { symbol: 'BAS.DE', name: 'BASF SE' },
  { symbol: 'ALV.DE', name: 'Allianz SE' },
  { symbol: 'BMW.DE', name: 'Bayerische Motoren Werke AG' },
  { symbol: 'VOW3.DE', name: 'Volkswagen AG' },
  { symbol: 'ADS.DE', name: 'Adidas AG' },
  { symbol: 'DTE.DE', name: 'Deutsche Telekom AG' },
  { symbol: 'DB1.DE', name: 'Deutsche Börse AG' }
];

export function getStockNameBySymbol(symbol: string): string | undefined {
  const stock = POPULAR_STOCKS.find(stock => stock.symbol.toUpperCase() === symbol.toUpperCase());
  return stock?.name;
}

// Using Yahoo Finance API through a proxy service
const STOCK_API_BASE = 'https://api.polygon.io/v2/aggs/ticker/';
const FALLBACK_API = 'https://financialmodelingprep.com/api/v3/quote/';

export function searchStockSymbols(query: string): Array<{ symbol: string; name: string }> {
  if (!query || query.length < 1) return [];
  
  const searchTerm = query.toLowerCase();
  
  return POPULAR_STOCKS.filter(stock => 
    stock.symbol.toLowerCase().includes(searchTerm) ||
    stock.name.toLowerCase().includes(searchTerm)
  ).slice(0, 8); // Limit to 8 suggestions
}

// Cache for stock prices to limit API calls
interface CachedStockPrice {
  price: StockPrice | null;
  timestamp: number;
}

const stockPriceCache: Record<string, CachedStockPrice> = {};
const CACHE_DURATION = 30 * 1000; // 30 seconds in milliseconds

export async function fetchStockPrice(symbol: string, targetCurrency: string = 'USD'): Promise<StockPrice | null> {
  const cacheKey = `${symbol}-${targetCurrency}`.toUpperCase();
  const now = Date.now();

  // Check if price is in cache and not expired
  if (stockPriceCache[cacheKey] && (now - stockPriceCache[cacheKey].timestamp < CACHE_DURATION)) {
    console.log(`Returning cached price for ${symbol} (${targetCurrency})`);
    return stockPriceCache[cacheKey].price;
  }

  try {
    const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (!SUPABASE_ANON_KEY) {
      console.error('VITE_SUPABASE_ANON_KEY is not set in environment variables.');
      return null;
    }

    const response = await fetch(`/functions/v1/stock-price?symbol=${symbol}&currency=${targetCurrency}`, {
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });
    if (response.ok) {
      const stockData = await response.json();
      
      // Store fetched price in cache
      stockPriceCache[cacheKey] = {
        price: stockData,
        timestamp: now,
      };

      return stockData;
    } else {
      const errorData = await response.json();
      console.error('Supabase Edge Function error:', errorData);
      throw new Error(`Failed to fetch stock price from Supabase Edge Function: ${errorData.error || response.statusText}`);
    }
  } catch (error) {
    console.warn(`Error fetching real-time price for ${symbol}, returning null:`, error);
    
    return null; // Return null if no live data is found
  }
}

export async function fetchMultipleStockPrices(symbols: string[], targetCurrency: string = 'USD'): Promise<Record<string, StockPrice>> {
  const results: Record<string, StockPrice> = {};
  
  // Fetch all stocks in parallel
  const promises = symbols.map(async (symbol) => {
    const price = await fetchStockPrice(symbol, targetCurrency);
    if (price) {
      results[symbol.toUpperCase()] = price;
    }
  });
  
  await Promise.all(promises);
  return results;
}