import React from 'react';
import { TrendingUp, DollarSign, PiggyBank, CreditCard, Briefcase } from 'lucide-react';
import { FinancialData, ProjectionResult } from '../types/financial';
import { calculateCurrentNetWorth, calculateMonthlyNet } from '../utils/calculations';
import { formatCurrency } from '../utils/currencies';
import { getTranslation } from '../utils/languages';

interface SummaryCardsProps {
  data: FinancialData;
  projections: ProjectionResult[];
  projectionYears: number;
  currency: string;
  language: string;
  darkMode: boolean;
}

export function SummaryCards({ data, projections, projectionYears, currency, language, darkMode }: SummaryCardsProps) {
  const currentNetWorth = calculateCurrentNetWorth(data);
  const monthlyNet = calculateMonthlyNet(data);
  const futureNetWorth = projections[projections.length - 1]?.netWorth || 0;
  const visibleAssets = data.assets.filter(a => a.id !== 'automatic-investment');
  const totalAssets = visibleAssets.reduce((sum, asset) => sum + asset.value, 0);
  const totalLiabilities = data.liabilities.reduce((sum, liability) => sum + liability.balance, 0);
  const monthlyLoanPayments = data.liabilities.reduce((sum, liability) => sum + liability.minimumPayment, 0);
  const monthlyLoanInterest = data.liabilities.reduce((sum, liability) => sum + ((liability.balance * liability.interestRate / 100) / 12), 0);
  const totalMonthlyExpenses = data.expenses.reduce((sum, expense) => sum + expense.monthlyAmount, 0) + monthlyLoanPayments + monthlyLoanInterest;

  // Create assets summary
  const assetsDescription = visibleAssets.length === 0 
    ? (language === 'de' ? 'Keine Vermögenswerte' : 'No assets')
    : visibleAssets.map(asset => {
        if (asset.type === 'stock' && asset.stockSymbol && asset.quantity) {
          return `${Math.round(asset.quantity)}x ${asset.stockSymbol}`;
        } else {
          return asset.name || (language === 'de' ? 'Unbenannt' : 'Unnamed');
        }
      }).slice(0, 3).join(', ') + (visibleAssets.length > 3 ? '...' : '');

  const cards = [
    {
      title: getTranslation('currentNetWorth', language),
      value: formatCurrency(currentNetWorth, currency),
      icon: DollarSign,
      color: currentNetWorth >= 0 ? 'text-emerald-600' : 'text-red-600',
      bgColor: currentNetWorth >= 0 
        ? darkMode ? 'bg-emerald-900/20' : 'bg-emerald-50'
        : darkMode ? 'bg-red-900/20' : 'bg-red-50',
      description: `${getTranslation('assets', language)}: ${formatCurrency(totalAssets, currency)} - ${getTranslation('liabilities', language)}: ${formatCurrency(totalLiabilities, currency)}`
    },
    {
      title: getTranslation('monthlyCashFlow', language),
      value: formatCurrency(monthlyNet, currency),
      icon: TrendingUp,
      color: monthlyNet >= 0 ? 'text-emerald-600' : 'text-red-600',
      bgColor: monthlyNet >= 0 
        ? darkMode ? 'bg-emerald-900/20' : 'bg-emerald-50'
        : darkMode ? 'bg-red-900/20' : 'bg-red-50',
      description: monthlyNet >= 0 ? getTranslation('surplusForInvestments', language) : getTranslation('monthlyDeficit', language)
    },
    {
      title: language === 'de' ? 'Vermögenswerte' : 'Assets',
      value: `${visibleAssets.length}`,
      icon: Briefcase,
      color: 'text-blue-600',
      bgColor: darkMode ? 'bg-blue-900/20' : 'bg-blue-50',
      description: assetsDescription,
      isCount: true
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
      {cards.map((card, index) => (
        <div key={index} className={`${darkMode ? 'bg-slate-800/60 border-slate-700/50' : 'bg-white/80 border-slate-200/50'} rounded-2xl shadow-2xl p-6 hover:shadow-3xl transition-all duration-500 border backdrop-blur-xl transform hover:scale-105 group`}>
          <div className={`inline-flex p-3 rounded-xl ${card.bgColor} mb-4 group-hover:scale-110 transition-transform duration-300`}>
            <card.icon className={`w-4 h-4 ${card.color}`} />
          </div>
          <h3 className={`text-sm font-bold ${darkMode ? 'text-slate-300' : 'text-slate-500'} mb-2 tracking-tight uppercase`}>{card.title}</h3>
          <p className={`text-xl font-bold ${card.color} mb-2 tracking-tight`}>
            {card.isCount ? (
              <span>{card.value} {card.value === '1' ? (language === 'de' ? 'Asset' : 'Asset') : (language === 'de' ? 'Assets' : 'Assets')}</span>
            ) : card.value}
          </p>
          <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'} leading-relaxed font-medium`}>{card.description}</p>
        </div>
      ))}
    </div>
  );
}