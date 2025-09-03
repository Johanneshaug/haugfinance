const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface StockPrice {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
}

let EXCHANGE_RATES: Record<string, number> = { 'USD': 1.0 }; // Initialize with USD only

async function fetchLiveExchangeRates(): Promise<void> {
  try {
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    const data = await response.json();

    if (data.rates) {
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
      console.log('Edge Function: Currency rates updated live.');
    } else {
      console.warn('Edge Function: No rates data received from exchangerate-api.com');
    }
  } catch (error) {
    console.error('Edge Function: Failed to fetch live currency rates:', error);
  }
}

// Initial fetch of exchange rates when the Edge Function starts
// This will be called once per cold start of the function.
await fetchLiveExchangeRates();

function convertCurrency(amount: number, fromCurrency: string, toCurrency: string): number {
  if (fromCurrency === toCurrency) return amount;
  
  // Ensure rates are available before conversion
  if (!EXCHANGE_RATES[fromCurrency] || !EXCHANGE_RATES[toCurrency]) {
    console.warn(`Edge Function: Missing exchange rate for ${fromCurrency} or ${toCurrency}. Using USD as fallback.`);
    // Fallback to direct USD conversion if rate is missing
    if (fromCurrency === 'USD') return amount * (EXCHANGE_RATES[toCurrency] || 1); // If target currency is missing, assume 1
    if (toCurrency === 'USD') return amount / (EXCHANGE_RATES[fromCurrency] || 1); // If from currency is missing, assume 1
    return amount; // Cannot convert without rates, return original amount
  }

  const usdAmount = amount / EXCHANGE_RATES[fromCurrency];
  return usdAmount * EXCHANGE_RATES[toCurrency];
}

async function fetchStockPrice(symbol: string, targetCurrency: string = 'USD'): Promise<StockPrice | null> {
  try {
    // Try Yahoo Finance API first
    const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`);
    const data = await response.json();

    console.log(`Raw Yahoo Finance data for ${symbol}:`, JSON.stringify(data, null, 2));

    if (data.chart && data.chart.result && data.chart.result[0]) {
      const result = data.chart.result[0];
      const meta = result.meta;
      const basePrice = meta.regularMarketPrice || meta.previousClose;
      const previousClose = meta.previousClose || meta.chartPreviousClose;
      const change = basePrice - previousClose;

      if (basePrice) {
        console.log(`Real ${symbol} price: $${basePrice} USD`);

        const convertedPrice = convertCurrency(basePrice, 'USD', targetCurrency);
        const convertedChange = convertCurrency(change, 'USD', targetCurrency);

        return {
          symbol: symbol.toUpperCase(),
          price: convertedPrice,
          change: convertedChange,
          changePercent: previousClose ? (change / previousClose) * 100 : 0
        };
      }
    }

    throw new Error('No valid price data found');
  } catch (error) {
    console.warn(`Error fetching real-time price for ${symbol}:`, error);

    return null; // Return null if no live data is found
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const url = new URL(req.url);
    const symbol = url.searchParams.get('symbol');
    const currency = url.searchParams.get('currency') || 'USD';

    if (!symbol) {
      return new Response(
        JSON.stringify({ error: 'Symbol parameter is required' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }

    const stockPrice = await fetchStockPrice(symbol, currency);

    if (!stockPrice) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch stock price' }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }

    return new Response(
      JSON.stringify(stockPrice),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    console.error('Error in stock-price function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
});