import React, { useState, useEffect } from 'react';
import { X, DollarSign, ArrowRightLeft, CreditCard, AlertCircle, Coins, Sparkles } from 'lucide-react';

export default function CurrencyCalculatorModal({ isOpen, onClose, destinationData, travellerProfile }) {
  const [homeCurrency, setHomeCurrency] = useState(() => {
    try {
      const saved = localStorage.getItem('sakhi_home_currency') || localStorage.getItem('aura_home_currency');
      if (saved) return saved;
    } catch {}
    return travellerProfile?.preferredCurrency || (travellerProfile?.homeCountry === 'United Kingdom' ? 'GBP' : 'USD');
  });
  const [homeAmount, setHomeAmount] = useState('50');

  // Keep homeCurrency synchronized if travellerProfile changes
  useEffect(() => {
    if (travellerProfile?.preferredCurrency) {
      setHomeCurrency(travellerProfile.preferredCurrency);
    }
  }, [travellerProfile?.preferredCurrency]);

  const handleCurrencyChange = (newCurr) => {
    setHomeCurrency(newCurr);
    try {
      localStorage.setItem('sakhi_home_currency', newCurr);
    } catch {}
  };

  if (!isOpen || !destinationData) return null;

  const destCode = destinationData.currencyCode || 'USD';
  const destSymbol = destinationData.currency || '$';
  const rateToUSD = destinationData.exchangeRateToUSD || 1.0;

  // Home currency rates relative to USD
  const homeRates = {
    USD: 1.0,
    EUR: 0.92,
    GBP: 0.78,
    CAD: 1.36,
    AUD: 1.52,
    JPY: 154.5
  };

  const homeSymbols = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    CAD: 'CA$',
    AUD: 'A$',
    JPY: '¥'
  };

  const currentHomeRate = homeRates[homeCurrency] || 1.0;
  const homeSymbol = homeSymbols[homeCurrency] || '$';
  
  // Calculate destination amount: (homeAmount / homeRate) * rateToUSD
  const numHome = parseFloat(homeAmount) || 0;
  const numUSD = numHome / currentHomeRate;
  const numDest = Math.round(numUSD * rateToUSD);

  const handleHomeChange = (val) => {
    setHomeAmount(val);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-100 relative space-y-4 max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shadow-xs">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Live Travel Currency Calculator</h3>
            <p className="text-xs text-slate-500">Instant conversion to {destinationData.cityName} local currency ({destCode})</p>
          </div>
        </div>

        {/* Currency Converter Card */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
          {/* Home Currency Input */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs font-bold text-slate-600">
              <span>Home Currency</span>
              <select
                value={homeCurrency}
                onChange={(e) => handleCurrencyChange(e.target.value)}
                className="px-2 py-0.5 rounded-lg border border-slate-300 bg-white font-bold text-slate-800 text-xs focus:outline-none"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="CAD">CAD ($)</option>
                <option value="AUD">AUD ($)</option>
                <option value="JPY">JPY (¥)</option>
              </select>
            </div>
            <div className="relative">
              <input
                type="number"
                value={homeAmount}
                onChange={(e) => handleHomeChange(e.target.value)}
                placeholder="Enter amount"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-black text-slate-900 text-base focus:outline-none focus:border-terracotta-500"
              />
              <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">
                {homeCurrency}
              </span>
            </div>
          </div>

          <div className="flex justify-center my-1">
            <div className="w-8 h-8 rounded-full bg-violet-50 text-violet-600 flex items-center justify-center">
              <ArrowRightLeft className="w-4 h-4 rotate-90" />
            </div>
          </div>

          {/* Destination Currency Result */}
          <div className="space-y-1">
            <div className="text-xs font-bold text-slate-600">
              Destination Amount ({destinationData.cityName})
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-700 text-white flex items-center justify-between shadow-xs">
              <span className="text-2xl font-black">{numDest.toLocaleString()}</span>
              <span className="text-xs font-bold bg-white/20 px-2.5 py-1 rounded-lg">
                {destSymbol}
              </span>
            </div>
          </div>

          <div className="text-[10px] text-slate-500 text-center font-medium">
            Exchange Rate: 1 {homeCurrency} ≈ {Math.round((rateToUSD / currentHomeRate) * 10) / 10} {destCode}
          </div>
        </div>

        {/* Quick Amount Preset Pills */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Quick Presets</span>
          <div className="grid grid-cols-5 gap-1.5">
            {[10, 25, 50, 100, 200].map((amt) => (
              <button
                key={amt}
                onClick={() => setHomeAmount(amt.toString())}
                className="py-1.5 rounded-xl border border-slate-200 hover:border-violet-400 bg-white text-xs font-bold text-slate-700 hover:text-violet-600 transition-colors cursor-pointer"
              >
                {homeSymbol}{amt}
              </button>
            ))}
          </div>
        </div>

        {/* Local Cash Warning Reminder */}
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-black">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            Solo Female Travel Cash Tip ({destinationData.cityName})
          </div>
          <p className="text-[11px] text-slate-700 font-medium leading-relaxed">
            While major hotels & cafes accept credit cards, traditional park kiosks, street food stalls, and public restrooms in {destinationData.cityName} require local cash ({destSymbol}). Keep a small pouch of cash ready!
          </p>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs transition-colors cursor-pointer shadow-xs"
        >
          Close Calculator
        </button>
      </div>
    </div>
  );
}
