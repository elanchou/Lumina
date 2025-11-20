
import { MarketTicker } from '../types';

// Binance WebSocket URL
const BINANCE_WS_URL = 'wss://stream.binance.com:9443/ws';
const INITIAL_STREAMS = ['btcusdt@trade', 'ethusdt@trade', 'solusdt@trade', 'bnbusdt@trade'];

// Initial Stocks (Fallback/Hybrid)
const DEFAULT_STOCK_TICKERS: MarketTicker[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', price: 189.45, change: 1.25, changePercent: 0.66, type: 'US', dataPoints: [], volume: '45.2M' },
  { symbol: 'NVDA', name: 'NVIDIA Corp', price: 875.30, change: 15.40, changePercent: 1.79, type: 'US', dataPoints: [], volume: '32.1M' },
  { symbol: 'MSFT', name: 'Microsoft', price: 420.10, change: -2.10, changePercent: -0.50, type: 'US', dataPoints: [], volume: '18.5M' },
];

type TickerUpdateCallback = (tickers: MarketTicker[]) => void;

interface CoinData {
    symbol: string;
    name: string;
    type: string;
    current_price: number;
    total_volume: number;
}

class MarketService {
  private ws: WebSocket | null = null;
  private stockInterval: number | null = null;
  private tickers: MarketTicker[] = [];
  private subscribers: TickerUpdateCallback[] = [];
  private activeStreams: Set<string> = new Set(INITIAL_STREAMS);
  public availableCoins: CoinData[] = [];

  constructor() {
    // Initialize empty, will be populated by fetch or defaults
    this.tickers = [...DEFAULT_STOCK_TICKERS.map(t => this.initTickerHistory(t))];
    this.initStocks();
    this.initBinance();
    this.fetchTopCrypto();
  }

  // Connect to CoinGecko to get top 50 coins for the search bar AND real initial prices
  private async fetchTopCrypto() {
      try {
        const response = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false');
        if (response.ok) {
            const data = await response.json();
            this.availableCoins = data.map((coin: any) => ({
                symbol: coin.symbol.toUpperCase() + '-USD',
                name: coin.name,
                type: 'CRYPTO',
                current_price: coin.current_price,
                total_volume: coin.total_volume
            }));

            // Update existing crypto tickers with real data if they are currently showing dummy data
            this.tickers = this.tickers.map(t => {
                if (t.type === 'CRYPTO') {
                    const coinData = this.availableCoins.find(c => c.symbol === t.symbol);
                    if (coinData && Math.abs(t.price - coinData.current_price) / coinData.current_price > 0.1) {
                        // Price mismatch > 10%, reset history with real price
                        return this.initTickerHistory({
                            ...t,
                            price: coinData.current_price,
                            volume: this.formatVolume(coinData.total_volume)
                        });
                    }
                }
                return t;
            });
            this.notifySubscribers();

            // If we don't have any crypto tickers yet (first load), add top 3
            const cryptoTickers = this.tickers.filter(t => t.type === 'CRYPTO');
            if (cryptoTickers.length === 0) {
                 const top3 = this.availableCoins.slice(0, 3);
                 top3.forEach(c => this.addTicker(c.symbol, 'CRYPTO'));
            }

        }
      } catch (error) {
          console.warn("Failed to fetch CoinGecko data, using defaults", error);
          this.availableCoins = [
              { symbol: 'BTC-USD', name: 'Bitcoin', type: 'CRYPTO', current_price: 90000, total_volume: 0 },
              { symbol: 'ETH-USD', name: 'Ethereum', type: 'CRYPTO', current_price: 3000, total_volume: 0 },
              { symbol: 'SOL-USD', name: 'Solana', type: 'CRYPTO', current_price: 150, total_volume: 0 }
          ];
          // Only add defaults if list is empty
          if (this.tickers.filter(t => t.type === 'CRYPTO').length === 0) {
             this.availableCoins.forEach(c => this.addTicker(c.symbol, 'CRYPTO'));
          }
      }
  }

  private formatVolume(num: number): string {
      if (num >= 1.0e+9) return (num / 1.0e+9).toFixed(2) + "B";
      if (num >= 1.0e+6) return (num / 1.0e+6).toFixed(2) + "M";
      if (num >= 1.0e+3) return (num / 1.0e+3).toFixed(2) + "K";
      return num.toString();
  }

  // Generate realistic history so charts aren't empty on load
  private initTickerHistory(ticker: MarketTicker): MarketTicker {
    const dataPoints = [];
    let currentPrice = ticker.price;
    const now = Date.now();
    
    // Generate 50 minutes of history
    for (let i = 50; i >= 0; i--) {
        const volatility = currentPrice * 0.001; // 0.1% volatility per minute
        const change = (Math.random() - 0.5) * volatility;
        dataPoints.unshift({
            time: new Date(now - i * 60000).toISOString(), 
            value: currentPrice
        });
        currentPrice -= change; 
    }
    
    // Set the oldest point as the Open Price reference for "Day Change"
    const openPrice = dataPoints[0].value;

    return {
        ...ticker,
        openPrice: openPrice, 
        dataPoints: dataPoints,
        change: ticker.price - openPrice,
        changePercent: ((ticker.price - openPrice) / openPrice) * 100
    };
  }

  private initBinance() {
    if (this.ws) {
        this.ws.close();
    }

    try {
        const streamString = Array.from(this.activeStreams).join('/');
        this.ws = new WebSocket(`${BINANCE_WS_URL}/${streamString}`);

        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            let tickerSymbol = '';
            const s = data.s.toLowerCase();
            
            if (s.endsWith('usdt')) {
                const base = s.replace('usdt', '').toUpperCase();
                tickerSymbol = `${base}-USD`;
            }

            if (tickerSymbol) {
                const price = parseFloat(data.p);
                this.updateTicker(tickerSymbol, price);
            }
        };
    } catch (e) {
        console.error("Failed to connect to Binance stream", e);
    }
  }

  private initStocks() {
    if (this.stockInterval) clearInterval(this.stockInterval);
    
    this.stockInterval = window.setInterval(() => {
      this.tickers = this.tickers.map(t => {
        if (t.type !== 'CRYPTO') {
            const volatility = t.price * 0.0005; 
            const randomMove = (Math.random() - 0.5) * volatility;
            const newPrice = Math.max(0.01, t.price + randomMove);
            return this.processUpdate(t, newPrice);
        }
        return t;
      });
      this.notifySubscribers();
    }, 2000); 
  }

  private updateTicker(symbol: string, newPrice: number) {
    const index = this.tickers.findIndex(t => t.symbol === symbol);
    if (index !== -1) {
      const t = this.tickers[index];
      this.tickers[index] = this.processUpdate(t, newPrice);
      this.notifySubscribers();
    }
  }

  private processUpdate(ticker: MarketTicker, newPrice: number): MarketTicker {
    // CRITICAL FIX: Check for massive price discontinuity.
    // If the new price is > 20% different from current, assume we had dummy data 
    // and we are now getting real data. Reset the history to match the new reality.
    if (ticker.price > 0 && Math.abs((newPrice - ticker.price) / ticker.price) > 0.2) {
        return this.initTickerHistory({
            ...ticker,
            price: newPrice
        });
    }

    const timestamp = new Date().toISOString();
    const newDataPoints = [...(ticker.dataPoints || []), { time: timestamp, value: newPrice }];
    if (newDataPoints.length > 50) newDataPoints.shift();
    
    const basePrice = ticker.openPrice || newDataPoints[0].value;
    const dailyChange = newPrice - basePrice;
    const dailyChangePercent = (dailyChange / basePrice) * 100;

    return {
        ...ticker,
        price: newPrice,
        openPrice: basePrice, // Keep openPrice stable
        change: dailyChange,
        changePercent: dailyChangePercent,
        dataPoints: newDataPoints
    };
  }

  public addTicker(symbol: string, type: 'US' | 'CRYPTO') {
    const normalizedSymbol = symbol.toUpperCase();
    if (this.tickers.find(t => t.symbol === normalizedSymbol)) return;

    // Try to find real initial data
    const coinData = this.availableCoins.find(c => c.symbol === normalizedSymbol);
    
    const startPrice = coinData ? coinData.current_price : (type === 'CRYPTO' ? 100 : 150);
    const startVolume = coinData ? this.formatVolume(coinData.total_volume) : '---';

    const newTicker: MarketTicker = this.initTickerHistory({
        symbol: normalizedSymbol,
        name: coinData ? coinData.name : normalizedSymbol,
        price: startPrice,
        change: 0,
        changePercent: 0,
        type: type,
        dataPoints: [],
        volume: startVolume
    });

    this.tickers.push(newTicker);

    if (type === 'CRYPTO') {
        const base = normalizedSymbol.replace('-USD', '').toLowerCase();
        const streamName = `${base}usdt@trade`;
        
        if (!this.activeStreams.has(streamName)) {
             this.activeStreams.add(streamName);
             this.initBinance(); // Re-init to pick up new stream
        }
    }
    
    this.notifySubscribers();
  }

  public removeTicker(symbol: string) {
    this.tickers = this.tickers.filter(t => t.symbol !== symbol);
    this.notifySubscribers();
  }

  public subscribe(callback: TickerUpdateCallback) {
    this.subscribers.push(callback);
    callback(this.tickers); 
    return () => {
      this.subscribers = this.subscribers.filter(s => s !== callback);
    };
  }

  private notifySubscribers() {
    this.subscribers.forEach(cb => cb([...this.tickers]));
  }
}

export const marketService = new MarketService();
