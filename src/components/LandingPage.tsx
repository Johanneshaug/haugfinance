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
        ? 'bg-gradient-to-br from-slate-900 via-blue-900 to-amber-900' 
        : 'bg-gradient-to-br from-white via-blue-50 to-amber-50'
    }`} style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
      
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, ${darkMode ? '#3B82F6' : '#2563EB'} 0%, transparent 50%), radial-gradient(circle at 75% 75%, ${darkMode ? '#F59E0B' : '#D97706'} 0%, transparent 50%)`
          }}></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-6 py-24">
          <div className="text-center">
            {/* Logo/Brand */}
            <div className="mb-8">
              <div className="flex justify-center mb-6">
                <div className={`p-4 rounded-2xl ${darkMode ? 'bg-blue-500/20 border border-blue-400/30' : 'bg-blue-500/10 border border-blue-400/20'} backdrop-blur-sm`}>
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-amber-500 rounded-xl flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">H</span>
                  </div>
                </div>
              </div>
              <h1 className={`text-5xl md:text-6xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'} mb-4 tracking-tight`}>
                HaugFinance
              </h1>
              <div className="flex justify-center space-x-3 mb-8">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                <div className="w-3 h-3 bg-amber-500 rounded-full animate-pulse delay-100"></div>
                <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse delay-200"></div>
              </div>
            </div>

            {/* Headline */}
            <h2 className={`text-4xl md:text-6xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'} mb-8 leading-tight tracking-tight`}>
              Ihre finanzielle Zukunft
              <br />
              <span className="bg-gradient-to-r from-blue-500 via-amber-500 to-orange-500 bg-clip-text text-transparent">
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
              className="group relative bg-gradient-to-r from-blue-600 via-amber-600 to-orange-600 text-white px-12 py-6 rounded-2xl text-xl font-bold shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 flex items-center space-x-4 mx-auto overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-amber-500 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex items-center space-x-4">
              <Calculator className="w-7 h-7" />
              <span>Vermögensrechner starten</span>
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Mission Section */}
      <div className={`${darkMode ? 'bg-slate-800/20' : 'bg-white/30'} backdrop-blur-xl py-20 border-y ${darkMode ? 'border-slate-700/30' : 'border-slate-200/30'}`}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center">
            <div className={`inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500/10 to-amber-500/10 px-6 py-3 rounded-full border ${darkMode ? 'border-blue-400/20' : 'border-blue-400/10'} mb-8`}>
              <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-amber-500 rounded-full"></div>
              <span className={`text-sm font-semibold ${darkMode ? 'text-blue-300' : 'text-blue-600'}`}>
                Unsere Mission
              </span>
            </div>
            
            <h2 className={`text-4xl md:text-5xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'} mb-8 leading-tight tracking-tight`}>
              <span className="bg-gradient-to-r from-blue-500 via-amber-500 to-orange-500 bg-clip-text text-transparent">
                Ein Programm für finanzielle Ziele
              </span>
            </h2>
            
            <p className={`text-xl ${darkMode ? 'text-slate-300' : 'text-slate-600'} max-w-4xl mx-auto leading-relaxed font-medium`}>
              Mission: Ein Programm entwickeln, mit dem Menschen finanzielle Ziele erreichen können.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
              <div className="text-center group">
                <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 p-6 rounded-2xl w-fit mx-auto mb-4 group-hover:scale-105 transition-transform duration-300">
                  <span className="text-4xl">🎯</span>
                </div>
                <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'} mb-3`}>
                  Klare Ziele
                </h3>
                <p className={`${darkMode ? 'text-slate-300' : 'text-slate-600'} leading-relaxed`}>
                  Definieren Sie Ihre finanziellen Ziele und sehen Sie, wie Sie diese erreichen können.
                </p>
              </div>
              
              <div className="text-center group">
                <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/20 p-6 rounded-2xl w-fit mx-auto mb-4 group-hover:scale-105 transition-transform duration-300">
                  <span className="text-4xl">🚀</span>
                </div>
                <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'} mb-3`}>
                  Motivation
                </h3>
                <p className={`${darkMode ? 'text-slate-300' : 'text-slate-600'} leading-relaxed`}>
                  Erleben Sie die Freude am Sparen und Investieren mit visuellen Fortschritten.
                </p>
              </div>
              
              <div className="text-center group">
                <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/20 p-6 rounded-2xl w-fit mx-auto mb-4 group-hover:scale-105 transition-transform duration-300">
                  <span className="text-4xl">💡</span>
                </div>
                <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'} mb-3`}>
                  Verständlichkeit
                </h3>
                <p className={`${darkMode ? 'text-slate-300' : 'text-slate-600'} leading-relaxed`}>
                  Komplexe Finanzkonzepte einfach und verständlich erklärt.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h3 className={`text-3xl md:text-4xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'} mb-6 tracking-tight`}>
            Ihre Finanzen im Überblick
          </h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className={`${darkMode ? 'bg-slate-800/60 border-slate-700/50' : 'bg-white/80 border-slate-200/50'} backdrop-blur-xl rounded-3xl p-8 border shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105 group`}>
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-2xl w-fit mb-6 group-hover:scale-110 transition-transform duration-300">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
            <h3 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'} mb-4 tracking-tight`}>
              Zukunft berechnen
            </h3>
            <p className={`${darkMode ? 'text-slate-300' : 'text-slate-600'} leading-relaxed text-lg`}>
              Sehen Sie, wie sich Ihr Vermögen entwickelt.
            </p>
          </div>

          {/* Feature 2 */}
          <div className={`${darkMode ? 'bg-slate-800/60 border-slate-700/50' : 'bg-white/80 border-slate-200/50'} backdrop-blur-xl rounded-3xl p-8 border shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105 group`}>
            <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-4 rounded-2xl w-fit mb-6 group-hover:scale-110 transition-transform duration-300">
              <PieChart className="w-8 h-8 text-white" />
            </div>
            <h3 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'} mb-4 tracking-tight`}>
              Alles an einem Ort
            </h3>
            <p className={`${darkMode ? 'text-slate-300' : 'text-slate-600'} leading-relaxed text-lg`}>
              Vermögen, Schulden, Einkommen und Ausgaben verwalten.
            </p>
          </div>

          {/* Feature 3 */}
          <div className={`${darkMode ? 'bg-slate-800/60 border-slate-700/50' : 'bg-white/80 border-slate-200/50'} backdrop-blur-xl rounded-3xl p-8 border shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105 group`}>
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-4 rounded-2xl w-fit mb-6 group-hover:scale-110 transition-transform duration-300">
              <BarChart3 className="w-8 h-8 text-white" />
            </div>
            <h3 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'} mb-4 tracking-tight`}>
              Schöne Charts
            </h3>
            <p className={`${darkMode ? 'text-slate-300' : 'text-slate-600'} leading-relaxed text-lg`}>
              Ihre Finanzen als interaktive Diagramme.
            </p>
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