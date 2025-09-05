import React from 'react';
import { X, Globe, Moon, Sun, Languages } from 'lucide-react';
import { Currency } from '../types/financial';
import { currencies } from '../utils/currencies';
import { languages, Language, getTranslation } from '../utils/languages';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCurrency: string;
  onCurrencyChange: (currency: string) => void;
  selectedLanguage: string;
  onLanguageChange: (language: string) => void;
  darkMode: boolean;
  onDarkModeToggle: () => void;
  showBetaFeatures: boolean;
  onToggleBetaFeatures: () => void;
}

export function SettingsPanel({ isOpen, onClose, selectedCurrency, onCurrencyChange, selectedLanguage, onLanguageChange, darkMode, onDarkModeToggle, showBetaFeatures, onToggleBetaFeatures }: SettingsPanelProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" style={{ fontFamily: 'Arial, sans-serif' }}>
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-3xl shadow-2xl p-8 w-full max-w-md mx-4 transform transition-all`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-green-400 to-blue-500 p-3 rounded-2xl">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{getTranslation('settings', selectedLanguage)}</h2>
          </div>
          <button
            onClick={onClose}
            className={`p-2 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} rounded-xl transition-colors`}
          >
            <X className={`w-6 h-6 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
          </button>
        </div>

        <div className="space-y-8">
          {/* Dark Mode Toggle */}
          <div>
            <label className={`block text-sm font-bold ${darkMode ? 'text-gray-200' : 'text-gray-700'} mb-4`}>
              {getTranslation('theme', selectedLanguage)}
            </label>
            <button
              onClick={onDarkModeToggle}
              className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                darkMode 
                  ? 'border-purple-500 bg-purple-900/20 text-purple-300' 
                  : 'border-yellow-400 bg-yellow-50 text-yellow-700'
              }`}
            >
              <div className="flex items-center space-x-3">
                {darkMode ? (
                  <Moon className="w-6 h-6" />
                ) : (
                  <Sun className="w-6 h-6" />
                )}
                <span className="font-bold">{darkMode ? getTranslation('darkMode', selectedLanguage) : getTranslation('lightMode', selectedLanguage)}</span>
              </div>
              <div className={`w-12 h-6 rounded-full transition-colors ${darkMode ? 'bg-purple-600' : 'bg-yellow-400'} relative`}>
                <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${darkMode ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </div>
            </button>
          </div>

          {/* Beta Features Toggle */}
          <div>
            <label className={`block text-sm font-bold ${darkMode ? 'text-gray-200' : 'text-gray-700'} mb-4`}>
              {getTranslation('betaFeatures', selectedLanguage)}
            </label>
            <button
              onClick={onToggleBetaFeatures}
              className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                showBetaFeatures 
                  ? 'border-blue-500 bg-blue-900/20 text-blue-300' 
                  : 'border-gray-400 bg-gray-50 text-gray-700'
              }`}
            >
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={showBetaFeatures}
                  readOnly // Managed by the button click
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-5 h-5"
                />
                <span className="font-bold">Beta-Features aktivieren</span>
              </div>
              <div className={`w-12 h-6 rounded-full transition-colors ${showBetaFeatures ? 'bg-blue-600' : 'bg-gray-400'} relative`}>
                <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${showBetaFeatures ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </div>
            </button>
          </div>

          {/* Language Selection */}
          <div>
            <label className={`block text-sm font-bold ${darkMode ? 'text-gray-200' : 'text-gray-700'} mb-4`}>
              {getTranslation('language', selectedLanguage)}
            </label>
            <div className="grid grid-cols-2 gap-3">
              {languages.map((language) => (
                <button
                  key={language.code}
                  onClick={() => onLanguageChange(language.code)}
                  className={`p-4 text-left rounded-2xl border-2 transition-all transform hover:scale-105 ${
                    selectedLanguage === language.code
                      ? darkMode 
                        ? 'border-blue-400 bg-blue-900/20 text-blue-300' 
                        : 'border-blue-500 bg-blue-50 text-blue-700'
                      : darkMode
                        ? 'border-gray-600 hover:border-gray-500 hover:bg-gray-700 text-gray-300'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-bold text-lg">{language.flag} {language.name}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={`block text-sm font-bold ${darkMode ? 'text-gray-200' : 'text-gray-700'} mb-4`}>
              {getTranslation('currency', selectedLanguage)}
            </label>
            <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto">
              {currencies.map((currency) => (
                <button
                  key={currency.code}
                  onClick={() => onCurrencyChange(currency.code)}
                  className={`p-4 text-left rounded-2xl border-2 transition-all transform hover:scale-105 ${
                    selectedCurrency === currency.code
                      ? darkMode 
                        ? 'border-green-400 bg-green-900/20 text-green-300' 
                        : 'border-green-500 bg-green-50 text-green-700'
                      : darkMode
                        ? 'border-gray-600 hover:border-gray-500 hover:bg-gray-700 text-gray-300'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-bold text-lg">{currency.symbol} {currency.code}</div>
                  <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{currency.name}</div>
                </button>
              ))}
            </div>
          </div>

        </div>

        <div className={`mt-8 pt-6 border-t ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-green-400 to-blue-500 text-white py-4 px-6 rounded-2xl hover:from-green-500 hover:to-blue-600 transition-all transform hover:scale-105 font-bold text-lg shadow-lg"
          >
            {getTranslation('saveSettings', selectedLanguage)}
          </button>
        </div>
      </div>
    </div>
  );
}