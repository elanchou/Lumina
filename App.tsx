
import React, { useState } from 'react';
import { ViewState, Asset } from './types';
import { MOCK_ASSETS } from './constants';
import Dashboard from './components/Dashboard';
import Market from './components/Market';
import ChatInterface from './components/ChatInterface';
import Analysis from './components/Analysis';
import Modal from './components/Modal';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ViewState>('dashboard');
  const [assets, setAssets] = useState<Asset[]>(MOCK_ASSETS);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const [settings, setSettings] = useState({
      notifications: true,
      currency: 'USD',
      theme: 'Dark',
      highContrast: false
  });

  return (
    <div className="min-h-screen w-full bg-lumina-bg text-slate-200 font-sans selection:bg-lumina-accent/30 bg-gradient-to-br from-lumina-bg via-[#050b1a] to-[#02040a]">
      
      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
           <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-blue-900/10 rounded-full blur-[120px]"></div>
           <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-indigo-900/10 rounded-full blur-[120px]"></div>
      </div>

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 w-full border-b border-glass-border bg-lumina-bg/70 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-lumina-accent to-blue-700 flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                 <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
              </div>
              <span className="font-bold text-xl text-white tracking-tight">Lumina</span>
            </div>

            {/* Navigation Tabs */}
            <nav className="hidden md:flex items-center gap-1">
                {(['dashboard', 'market', 'analysis'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      activeTab === tab 
                        ? 'bg-white/10 text-white shadow-inner' 
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-3">
                 <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full border border-glass-border bg-glass-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-[10px] text-gray-300 font-mono">GEMINI CONNECTED</span>
                </div>
                
                <button 
                    onClick={() => setIsSettingsOpen(true)}
                    className="p-2 text-gray-400 hover:text-white transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Nav (Bottom) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-lumina-panel/90 backdrop-blur-lg border-t border-glass-border z-40 px-4 py-2 flex justify-around">
           {(['dashboard', 'market', 'analysis'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`p-2 rounded-lg flex flex-col items-center gap-1 ${activeTab === tab ? 'text-lumina-accent' : 'text-gray-500'}`}
              >
                 <span className="text-[10px] uppercase tracking-wider">{tab}</span>
              </button>
            ))}
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8 relative z-10">
         <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
             
             {/* Primary View */}
             <div className="lg:col-span-8 space-y-6">
                {activeTab === 'dashboard' && <Dashboard assets={assets} setAssets={setAssets} />}
                {activeTab === 'market' && <Market />}
                {activeTab === 'analysis' && <Analysis assets={assets} />}
             </div>

             {/* Sidebar Chat - Always Visible on Desktop */}
             <div className="hidden lg:block lg:col-span-4">
                 <div className="sticky top-24 h-[calc(100vh-8rem)]">
                    <div className="h-full rounded-2xl bg-glass-100 border border-glass-border backdrop-blur-md overflow-hidden flex flex-col shadow-xl">
                        <div className="px-4 py-3 border-b border-glass-border bg-white/5 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-lumina-accent animate-pulse"></div>
                            <span className="text-sm font-semibold text-white">Lumina Assistant</span>
                        </div>
                        <div className="flex-1 min-h-0">
                            <ChatInterface />
                        </div>
                    </div>
                 </div>
             </div>

             {/* Mobile Chat Floating Action Button */}
             <button className="lg:hidden fixed bottom-20 right-4 w-12 h-12 bg-lumina-accent rounded-full shadow-lg shadow-blue-500/40 flex items-center justify-center text-white z-50 hover:scale-105 transition-transform">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
             </button>
         </div>
      </main>

      {/* Settings Modal */}
      <Modal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} title="Preferences" size="sm">
            <div className="space-y-6">
                <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
                    <div>
                        <div className="text-sm font-medium text-white">Push Notifications</div>
                        <div className="text-xs text-gray-500">Market alerts</div>
                    </div>
                    <button 
                        onClick={() => setSettings({...settings, notifications: !settings.notifications})}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.notifications ? 'bg-lumina-accent' : 'bg-gray-700'}`}
                    >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.notifications ? 'translate-x-6' : 'translate-x-1'}`}/>
                    </button>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
                    <div>
                        <div className="text-sm font-medium text-white">Currency</div>
                    </div>
                    <select 
                        value={settings.currency}
                        onChange={(e) => setSettings({...settings, currency: e.target.value})}
                        className="bg-black/30 border border-white/10 rounded px-2 py-1 text-sm text-white outline-none"
                    >
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="BTC">BTC (₿)</option>
                    </select>
                </div>
            </div>
      </Modal>
    </div>
  );
};

export default App;
