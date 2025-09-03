import React from 'react';
import { Calculator, TrendingUp, PieChart, BarChart3, ArrowRight, Shield, Zap, Globe } from 'lucide-react';

interface LandingPageProps {
  onEnterApp: () => void;
  darkMode: boolean;
}

export function LandingPage({ onEnterApp, darkMode }: LandingPageProps) {
  return (
    <div className={`min-h-screen transition-all duration-700 ${
      darkMode 
        ? 'bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900' 
        : 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50'
    }`} style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
      
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, ${darkMode ? '#3B82F6' : '#6366F1'} 0%, transparent 50%), radial-gradient(circle at 75% 75%, ${darkMode ? '#8B5CF6' : '#8B5CF6'} 0%, transparent 50%)`
          }}></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-6 py-24">
          <div className="text-center">
            {/* Logo/Brand */}
            <div className="mb-8">
              <div className="flex justify-center mb-6">
                <div className={`p-4 rounded-2xl ${darkMode ? 'bg-blue-500/20 border border-blue-400/30' : 'bg-blue-500/10 border border-blue-400/20'} backdrop-blur-sm`}>
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">H</span>
                  </div>
                </div>
              </div>
              <h1 className={`text-5xl md:text-6xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'} mb-4 tracking-tight`}>
                HaugFinance
              </h1>
              <div className="flex justify-center space-x-3 mb-8">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                <div className="w-3 h-3 bg-indigo-500 rounded-full animate-pulse delay-100"></div>
                <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse delay-200"></div>
              </div>
            </div>

            {/* Headline */}
            <h2 className={`text-4xl md:text-6xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'} mb-8 leading-tight tracking-tight`}>
              Ihre finanzielle Zukunft
              <br />
              <span className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 bg-clip-text text-transparent">
                präzise geplant
              </span>
            </h2>

            {/* Subtitle */}
            <p className={`text-xl md:text-2xl ${darkMode ? 'text-slate-300' : 'text-slate-600'} mb-12 max-w-4xl mx-auto leading-relaxed font-medium`}>
              Berechnen Sie Ihr Nettovermögen, projizieren Sie Ihre finanzielle Entwicklung 
              und treffen Sie fundierte Entscheidungen für Ihre Zukunft.
            </p>

            {/* CTA Button */}
            <button
              onClick={onEnterApp}
              className="group relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white px-12 py-6 rounded-2xl text-xl font-bold shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 flex items-center space-x-4 mx-auto overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex items-center space-x-4">
              <Calculator className="w-7 h-7" />
              <span>Vermögensrechner starten</span>
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h3 className={`text-3xl md:text-4xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'} mb-6 tracking-tight`}>
            Professionelle Finanzplanung
          </h3>
          <p className={`text-lg ${darkMode ? 'text-slate-300' : 'text-slate-600'} max-w-2xl mx-auto font-medium`}>
            Modernste Tools für Ihre finanzielle Zukunft
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className={`${darkMode ? 'bg-slate-800/60 border-slate-700/50' : 'bg-white/80 border-slate-200/50'} backdrop-blur-xl rounded-3xl p-8 border shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105 group`}>
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-4 rounded-2xl w-fit mb-6 group-hover:scale-110 transition-transform duration-300">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
            <h3 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'} mb-4 tracking-tight`}>
              Präzise Projektionen
            </h3>
            <p className={`${darkMode ? 'text-slate-300' : 'text-slate-600'} leading-relaxed text-lg`}>
              Berechnen Sie Ihr zukünftiges Nettovermögen basierend auf Ihren aktuellen 
              Vermögenswerten, Schulden und Cashflow-Prognosen.
            </p>
          </div>

          {/* Feature 2 */}
          <div className={`${darkMode ? 'bg-slate-800/60 border-slate-700/50' : 'bg-white/80 border-slate-200/50'} backdrop-blur-xl rounded-3xl p-8 border shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105 group`}>
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-4 rounded-2xl w-fit mb-6 group-hover:scale-110 transition-transform duration-300">
              <PieChart className="w-8 h-8 text-white" />
            </div>
            <h3 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'} mb-4 tracking-tight`}>
              Vollständige Übersicht
            </h3>
            <p className={`${darkMode ? 'text-slate-300' : 'text-slate-600'} leading-relaxed text-lg`}>
              Verwalten Sie alle Ihre Vermögenswerte, Schulden, Einkommen und Ausgaben 
              an einem zentralen Ort mit intuitivem Design.
            </p>
          </div>

          {/* Feature 3 */}
          <div className={`${darkMode ? 'bg-slate-800/60 border-slate-700/50' : 'bg-white/80 border-slate-200/50'} backdrop-blur-xl rounded-3xl p-8 border shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105 group`}>
            <div className="bg-gradient-to-br from-purple-500 to-pink-600 p-4 rounded-2xl w-fit mb-6 group-hover:scale-110 transition-transform duration-300">
              <BarChart3 className="w-8 h-8 text-white" />
            </div>
            <h3 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'} mb-4 tracking-tight`}>
              Interaktive Charts
            </h3>
            <p className={`${darkMode ? 'text-slate-300' : 'text-slate-600'} leading-relaxed text-lg`}>
              Visualisieren Sie Ihre finanzielle Entwicklung mit detaillierten, 
              interaktiven Diagrammen über mehrere Jahre hinweg.
            </p>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className={`${darkMode ? 'bg-slate-800/30' : 'bg-white/40'} backdrop-blur-xl py-24 border-y ${darkMode ? 'border-slate-700/50' : 'border-slate-200/50'}`}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h3 className={`text-3xl md:text-4xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'} mb-6 tracking-tight`}>
              Warum HaugFinance?
            </h3>
            <p className={`text-xl ${darkMode ? 'text-slate-300' : 'text-slate-600'} max-w-2xl mx-auto font-medium`}>
              Die moderne Lösung für Ihre Finanzplanung
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-4 rounded-full w-fit mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h4 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'} mb-3 tracking-tight`}>
                100% Privat
              </h4>
              <p className={`${darkMode ? 'text-slate-300' : 'text-slate-600'} text-lg leading-relaxed`}>
                Alle Daten bleiben lokal in Ihrem Browser. Keine Übertragung an externe Server.
              </p>
            </div>

            <div className="text-center group">
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-4 rounded-full w-fit mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h4 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'} mb-3 tracking-tight`}>
                Blitzschnell
              </h4>
              <p className={`${darkMode ? 'text-slate-300' : 'text-slate-600'} text-lg leading-relaxed`}>
                Sofortige Berechnungen und Aktualisierungen in Echtzeit ohne Wartezeiten.
              </p>
            </div>

            <div className="text-center group">
              <div className="bg-gradient-to-br from-purple-500 to-pink-600 p-4 rounded-full w-fit mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <Globe className="w-8 h-8 text-white" />
              </div>
              <h4 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'} mb-3 tracking-tight`}>
                Multi-Währung
              </h4>
              <p className={`${darkMode ? 'text-slate-300' : 'text-slate-600'} text-lg leading-relaxed`}>
                Unterstützung für alle wichtigen Währungen mit aktuellen Wechselkursen.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center">
          <p className={`${darkMode ? 'text-slate-400' : 'text-slate-500'} text-base font-medium`}>
            © 2025 HaugFinance. Entwickelt für Ihre finanzielle Zukunft.
          </p>
        </div>
      </div>
    </div>
  );
}