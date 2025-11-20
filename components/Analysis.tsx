import React, { useState, useEffect } from 'react';
import { Asset, AnalysisReport } from '../types';
import { analyzePortfolioRisk } from '../services/geminiService';
import GlassCard from './GlassCard';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

interface AnalysisProps {
  assets: Asset[];
}

const Analysis: React.FC<AnalysisProps> = ({ assets }) => {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [scenario, setScenario] = useState<string | null>(null);

  const handleAnalysis = async () => {
    setLoading(true);
    // Prepare data for AI
    const portfolioSummary = JSON.stringify(assets.map(a => ({ name: a.name, type: a.type, allocation: a.allocation, value: a.value })));
    
    const resultJson = await analyzePortfolioRisk(portfolioSummary);
    try {
        const data = JSON.parse(resultJson);
        setReport(data);
    } catch (e) {
        console.error("Failed to parse AI response", e);
    } finally {
        setLoading(false);
    }
  };
  
  // Auto-run analysis on mount if not present
  useEffect(() => {
      if (!report) {
          handleAnalysis();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assets]);

  const scenarios = [
      { id: 'crash', label: 'Market Crash', change: -0.25, color: 'text-red-400', desc: 'S&P 500 drops 25%' },
      { id: 'rally', label: 'Tech Rally', change: 0.15, color: 'text-emerald-400', desc: 'Tech sector gains 15%' },
      { id: 'inflation', label: 'Inflation Spike', change: -0.08, color: 'text-orange-400', desc: 'Rates hike, bonds drop' }
  ];

  const mockRadarData = [
    { subject: 'Diversification', A: 80, fullMark: 100 },
    { subject: 'Volatility', A: report?.volatility === 'High' ? 40 : 85, fullMark: 100 },
    { subject: 'Liquidity', A: 90, fullMark: 100 },
    { subject: 'Growth', A: 75, fullMark: 100 },
    { subject: 'Stability', A: 60, fullMark: 100 },
    { subject: 'Yield', A: 50, fullMark: 100 },
  ];

  // Calculate simulated value based on scenario (Very rough heuristic)
  const getSimulatedTotal = () => {
      const total = assets.reduce((s, a) => s + a.value, 0);
      if (!scenario) return total;
      
      const sObj = scenarios.find(s => s.id === scenario);
      if (!sObj) return total;

      // Apply simple impact factors based on asset type
      let impact = 0;
      assets.forEach(a => {
          let factor = 1;
          if (a.type === 'Stock') factor = 1.2; // Stocks move more than market
          if (a.type === 'Crypto') factor = 2.5; // Crypto moves way more
          if (a.type === 'Cash') factor = 0;
          
          impact += a.value * (sObj.change * factor);
      });
      
      return total + impact;
  };

  const simulatedTotal = getSimulatedTotal();
  const currentTotal = assets.reduce((s, a) => s + a.value, 0);
  const scenarioDiff = simulatedTotal - currentTotal;

  // Circular Progress Calc
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const score = report ? 100 - report.riskScore : 0;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in pb-10">
      {/* Left Column: Radar Chart & Score */}
      <div className="lg:col-span-1 space-y-6">
        <GlassCard className="p-6 flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-blue-500/5 pointer-events-none"></div>
          <h3 className="text-gray-400 text-xs uppercase tracking-widest mb-6 font-semibold z-10">Portfolio Health</h3>
          
          <div className="relative w-40 h-40 flex items-center justify-center z-10">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 128 128">
               {/* Background Circle */}
               <circle 
                 cx="64" cy="64" r={radius} 
                 stroke="rgba(255,255,255,0.05)" 
                 strokeWidth="8" 
                 fill="transparent" 
               />
               {/* Progress Circle */}
               <circle 
                 cx="64" cy="64" r={radius} 
                 stroke="#3b82f6" 
                 strokeWidth="8" 
                 fill="transparent"
                 strokeLinecap="round"
                 strokeDasharray={circumference}
                 strokeDashoffset={strokeDashoffset}
                 className="transition-all duration-1000 ease-out drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]"
               />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold text-white font-mono">{score || '--'}</span>
                <span className="text-[10px] text-blue-400 uppercase tracking-wider mt-1">Score</span>
            </div>
          </div>
          
          <div className="mt-6 w-full">
             <div className="flex justify-between text-xs text-gray-500 mb-1 px-2">
                <span>Risk</span>
                <span>Stability</span>
             </div>
             <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 h-full" style={{ width: '100%' }}></div>
             </div>
             <div className="relative w-full h-2 mt-1">
                 <div 
                    className="absolute top-0 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[6px] border-b-white transform -translate-x-1/2 transition-all duration-700"
                    style={{ left: `${score}%` }}
                 ></div>
             </div>
             <p className="text-xs text-gray-300 mt-3 font-medium">
                {report?.volatility === 'High' ? '⚠️ High Volatility Detected' : '✅ Balanced Profile'}
             </p>
          </div>
        </GlassCard>

        <GlassCard className="p-4 h-[300px]">
            <div className="text-center text-gray-400 text-xs uppercase tracking-wider mb-2">Metrics Radar</div>
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={mockRadarData}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar
                    name="Portfolio"
                    dataKey="A"
                    stroke="#38bdf8"
                    strokeWidth={2}
                    fill="#38bdf8"
                    fillOpacity={0.3}
                />
                </RadarChart>
            </ResponsiveContainer>
        </GlassCard>

        {/* Scenario Simulator */}
        <GlassCard className="p-5">
            <h3 className="text-white font-semibold mb-4 text-sm">Stress Testing Simulator</h3>
            <div className="space-y-2 mb-4">
                {scenarios.map(s => (
                    <button 
                        key={s.id}
                        onClick={() => setScenario(scenario === s.id ? null : s.id)}
                        className={`w-full p-3 rounded-lg border text-left transition-all ${scenario === s.id ? 'bg-lumina-accent/20 border-lumina-accent shadow-[0_0_15px_rgba(59,130,246,0.2)]' : 'bg-white/5 border-white/5 hover:border-white/20'}`}
                    >
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-200">{s.label}</span>
                            <span className={`text-xs font-mono ${s.change > 0 ? 'text-green-400' : 'text-red-400'}`}>{s.change > 0 ? '+' : ''}{s.change * 100}%</span>
                        </div>
                        <div className="text-[10px] text-gray-500 mt-1">{s.desc}</div>
                    </button>
                ))}
            </div>
            
            {scenario && (
                <div className="p-3 bg-black/40 rounded border border-white/10 animate-fade-in">
                    <div className="text-xs text-gray-400 mb-1">Projected Impact</div>
                    <div className="flex justify-between items-end">
                        <div className="text-lg font-mono font-bold text-white">${simulatedTotal.toLocaleString()}</div>
                        <div className={`text-xs font-mono ${scenarioDiff >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                             {scenarioDiff >= 0 ? '▲' : '▼'} ${Math.abs(scenarioDiff).toLocaleString()}
                        </div>
                    </div>
                </div>
            )}
        </GlassCard>
      </div>

      {/* Right Column: Text Analysis */}
      <div className="lg:col-span-2">
        <GlassCard className="p-8 h-full flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">AI Deep Analysis</h2>
                <p className="text-xs text-gray-500 mt-1">Powered by Gemini 1.5 Pro • Real-time Assessment</p>
            </div>
            <button 
                onClick={handleAnalysis}
                disabled={loading}
                className={`px-4 py-2 rounded-lg bg-lumina-accent/10 hover:bg-lumina-accent/20 border border-lumina-accent/20 text-blue-300 text-sm transition-all flex items-center gap-2 ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-[0_0_15px_rgba(59,130,246,0.3)]'}`}
            >
                {loading ? (
                    <span className="animate-spin h-4 w-4 border-2 border-blue-400 border-t-transparent rounded-full"></span>
                ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                )}
                Refresh Analysis
            </button>
          </div>

          {loading && !report ? (
              <div className="flex flex-col items-center justify-center flex-1 text-gray-400">
                  <div className="relative w-16 h-16 mb-4">
                      <div className="absolute inset-0 border-t-2 border-blue-500 rounded-full animate-spin"></div>
                      <div className="absolute inset-2 border-t-2 border-purple-500 rounded-full animate-spin" style={{animationDirection: 'reverse'}}></div>
                  </div>
                  <div className="animate-pulse font-mono text-sm">Accessing Neural Finance Models...</div>
                  <div className="text-xs text-gray-600 mt-2">Analyzing correlations and volatility matrices</div>
              </div>
          ) : report ? (
            <div className="space-y-8 animate-fade-in flex-1">
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                        <div className="text-gray-400 text-[10px] uppercase tracking-widest mb-1">Volatility Index</div>
                        <div className={`text-xl font-mono font-bold ${report.volatility === 'High' ? 'text-red-400' : 'text-emerald-400'}`}>{report.volatility}</div>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                        <div className="text-gray-400 text-[10px] uppercase tracking-widest mb-1">Max Drawdown (Est)</div>
                        <div className="text-xl font-mono font-bold text-orange-400">{report.maxDrawdown}</div>
                    </div>
                </div>

                <div className="prose prose-invert max-w-none">
                    <h3 className="text-lg text-blue-300 font-medium mb-3 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                        Executive Summary
                    </h3>
                    <p className="text-gray-300 leading-relaxed bg-gradient-to-r from-white/5 to-transparent p-6 rounded-lg border-l-2 border-blue-500 text-sm font-light tracking-wide">
                        {report.summary}
                    </p>
                </div>

                <div className="mt-auto">
                    <h3 className="text-lg text-purple-300 font-medium mb-4 flex items-center gap-2">
                         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                        Strategic Actions
                    </h3>
                    <div className="space-y-3">
                        {report.recommendations?.map((rec, i) => (
                            <div key={i} className="flex items-start gap-4 text-gray-300 bg-white/5 p-4 rounded-lg border border-white/5 hover:border-purple-500/30 transition-colors group">
                                <span className="flex-shrink-0 w-6 h-6 rounded bg-purple-500/20 text-purple-300 flex items-center justify-center text-xs font-bold mt-0.5 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                                    {i + 1}
                                </span>
                                <span className="text-sm">{rec}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
          ) : (
             <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                Click 'Refresh Analysis' to generate a new report.
             </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
};

export default Analysis;