import React, { useState, useEffect } from 'react';
import { Search, Filter, TrendingUp, TrendingDown, Volume2, RefreshCw } from 'lucide-react';
import { IBService, ScreenerResult } from '../services/IBService';
import { cn } from '../utils/cn';

const ScreenerTab: React.FC = () => {
  const [results, setResults] = useState<ScreenerResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    minPrice: '',
    maxPrice: '',
    minVolume: '',
    minMarketCap: '',
    maxPE: '',
    minRSI: '',
    maxRSI: '',
    priceAboveSMA20: false,
    priceAboveSMA50: false,
  });

  useEffect(() => {
    runScreener();
  }, []);

  const runScreener = async () => {
    setLoading(true);
    try {
      const data = await IBService.getScreenerResults(filters);
      setResults(data);
    } catch (error) {
      console.error('Failed to run screener:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  const formatMarketCap = (value: number) => {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(1)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
    return formatCurrency(value);
  };

  const formatVolume = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toString();
  };

  const getSwingTradingScore = (result: ScreenerResult): { score: number; signal: string; color: string } => {
    let score = 50; // Base score
    
    // RSI scoring (ideal range for swing trading: 30-70)
    if (result.rsi >= 30 && result.rsi <= 70) score += 20;
    else if (result.rsi < 30) score += 30; // Oversold - good for buying
    else score -= 20; // Overbought
    
    // Price vs moving averages
    if (result.price > result.sma20) score += 15;
    if (result.price > result.sma50) score += 10;
    if (result.sma20 > result.sma50) score += 15; // Uptrend
    
    // Volume (higher is better for swing trading)
    if (result.volume > 1000000) score += 10;
    else if (result.volume > 500000) score += 5;
    
    // Price momentum
    if (Math.abs(result.changePercent) > 2) score += 10; // Good volatility
    
    // Determine signal
    let signal = 'HOLD';
    let color = 'text-neutral-400';
    
    if (score >= 80) {
      signal = 'STRONG BUY';
      color = 'text-success-400';
    } else if (score >= 65) {
      signal = 'BUY';
      color = 'text-success-300';
    } else if (score <= 35) {
      signal = 'SELL';
      color = 'text-danger-400';
    } else if (score <= 50) {
      signal = 'WEAK';
      color = 'text-warning-400';
    }
    
    return { score: Math.max(0, Math.min(100, score)), signal, color };
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Swing Trading Screener</h2>
        <button onClick={runScreener} className="btn-primary" disabled={loading}>
          {loading ? (
            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Run Screener
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Filter className="h-5 w-5 mr-2" />
          Screening Criteria
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-1">Min Price</label>
            <input
              type="number"
              placeholder="e.g., 10"
              value={filters.minPrice}
              onChange={(e) => setFilters(prev => ({ ...prev, minPrice: e.target.value }))}
              className="input"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-1">Max Price</label>
            <input
              type="number"
              placeholder="e.g., 500"
              value={filters.maxPrice}
              onChange={(e) => setFilters(prev => ({ ...prev, maxPrice: e.target.value }))}
              className="input"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-1">Min Volume</label>
            <input
              type="number"
              placeholder="e.g., 100000"
              value={filters.minVolume}
              onChange={(e) => setFilters(prev => ({ ...prev, minVolume: e.target.value }))}
              className="input"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-1">Max P/E</label>
            <input
              type="number"
              placeholder="e.g., 25"
              value={filters.maxPE}
              onChange={(e) => setFilters(prev => ({ ...prev, maxPE: e.target.value }))}
              className="input"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-1">Min RSI</label>
            <input
              type="number"
              placeholder="e.g., 30"
              value={filters.minRSI}
              onChange={(e) => setFilters(prev => ({ ...prev, minRSI: e.target.value }))}
              className="input"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-1">Max RSI</label>
            <input
              type="number"
              placeholder="e.g., 70"
              value={filters.maxRSI}
              onChange={(e) => setFilters(prev => ({ ...prev, maxRSI: e.target.value }))}
              className="input"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="sma20"
              checked={filters.priceAboveSMA20}
              onChange={(e) => setFilters(prev => ({ ...prev, priceAboveSMA20: e.target.checked }))}
              className="rounded border-neutral-600 bg-neutral-800 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="sma20" className="text-sm text-neutral-400">Price > SMA 20</label>
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="sma50"
              checked={filters.priceAboveSMA50}
              onChange={(e) => setFilters(prev => ({ ...prev, priceAboveSMA50: e.target.checked }))}
              className="rounded border-neutral-600 bg-neutral-800 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="sma50" className="text-sm text-neutral-400">Price &gt; SMA 50</label>
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Screening Results ({results.length} stocks)</h3>
        
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-neutral-700 rounded shimmer"></div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-700">
                  <th className="text-left py-3 px-4 font-medium text-neutral-400">Symbol</th>
                  <th className="text-right py-3 px-4 font-medium text-neutral-400">Price</th>
                  <th className="text-right py-3 px-4 font-medium text-neutral-400">Change</th>
                  <th className="text-right py-3 px-4 font-medium text-neutral-400">Volume</th>
                  <th className="text-right py-3 px-4 font-medium text-neutral-400">Market Cap</th>
                  <th className="text-right py-3 px-4 font-medium text-neutral-400">P/E</th>
                  <th className="text-right py-3 px-4 font-medium text-neutral-400">RSI</th>
                  <th className="text-right py-3 px-4 font-medium text-neutral-400">SMA 20</th>
                  <th className="text-right py-3 px-4 font-medium text-neutral-400">SMA 50</th>
                  <th className="text-right py-3 px-4 font-medium text-neutral-400">Swing Score</th>
                </tr>
              </thead>
              <tbody>
                {results.map((result, index) => {
                  const swingAnalysis = getSwingTradingScore(result);
                  
                  return (
                    <tr key={index} className="border-b border-neutral-700/50 hover:bg-neutral-700/30 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-semibold text-primary-400">{result.symbol}</span>
                      </td>
                      <td className="text-right py-3 px-4 font-mono">
                        {formatCurrency(result.price)}
                      </td>
                      <td className={cn(
                        "text-right py-3 px-4 font-mono font-semibold",
                        result.change >= 0 ? "text-success-400" : "text-danger-400"
                      )}>
                        <div className="flex items-center justify-end space-x-1">
                          {result.change >= 0 ? 
                            <TrendingUp className="h-3 w-3" /> : 
                            <TrendingDown className="h-3 w-3" />
                          }
                          <span>{result.change >= 0 ? '+' : ''}{result.changePercent.toFixed(2)}%</span>
                        </div>
                      </td>
                      <td className="text-right py-3 px-4 font-mono">
                        <div className="flex items-center justify-end space-x-1">
                          <Volume2 className="h-3 w-3 text-neutral-400" />
                          <span>{formatVolume(result.volume)}</span>
                        </div>
                      </td>
                      <td className="text-right py-3 px-4 font-mono">
                        {formatMarketCap(result.marketCap)}
                      </td>
                      <td className="text-right py-3 px-4 font-mono">
                        {result.pe.toFixed(1)}
                      </td>
                      <td className={cn(
                        "text-right py-3 px-4 font-mono",
                        result.rsi > 70 ? "text-danger-400" : 
                        result.rsi < 30 ? "text-success-400" : "text-neutral-100"
                      )}>
                        {result.rsi.toFixed(1)}
                      </td>
                      <td className="text-right py-3 px-4 font-mono">
                        {formatCurrency(result.sma20)}
                      </td>
                      <td className="text-right py-3 px-4 font-mono">
                        {formatCurrency(result.sma50)}
                      </td>
                      <td className="text-right py-3 px-4">
                        <div className="flex flex-col items-end">
                          <span className={cn("font-bold text-sm", swingAnalysis.color)}>
                            {swingAnalysis.signal}
                          </span>
                          <span className="text-xs text-neutral-400">
                            {swingAnalysis.score}/100
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Swing Trading Tips */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Swing Trading Criteria</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          <div className="space-y-2">
            <h4 className="font-medium text-primary-400">Entry Signals</h4>
            <ul className="space-y-1 text-neutral-300">
              <li>• RSI between 30-40 (oversold bounce)</li>
              <li>• Price above SMA 20 (short-term trend)</li>
              <li>• Volume above average</li>
              <li>• Recent pullback to support</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium text-warning-400">Risk Management</h4>
            <ul className="space-y-1 text-neutral-300">
              <li>• Stop loss below recent swing low</li>
              <li>• Position size based on volatility</li>
              <li>• Risk/reward ratio minimum 1:2</li>
              <li>• Maximum 2-3% portfolio risk per trade</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium text-danger-400">Exit Signals</h4>
            <ul className="space-y-1 text-neutral-300">
              <li>• RSI above 70 (overbought)</li>
              <li>• Price hits resistance level</li>
              <li>• Volume declining on rallies</li>
              <li>• Break below SMA 20</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScreenerTab;