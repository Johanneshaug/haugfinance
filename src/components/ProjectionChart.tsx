import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { ProjectionResult } from '../types/financial';
import { getTranslation } from '../utils/languages';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ProjectionChartProps {
  projections: ProjectionResult[];
  language: string;
  darkMode: boolean;
}

export function ProjectionChart({ projections, language, darkMode }: ProjectionChartProps) {
  // Don't render chart if no projections data
  if (!projections || projections.length === 0) {
    return (
      <div className={`${darkMode ? 'bg-slate-800/60 border-slate-700/50' : 'bg-white/80 border-slate-200/50'} rounded-3xl shadow-2xl p-12 border backdrop-blur-xl`} style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
        <div className={`text-center py-16 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          <p className="text-xl font-semibold tracking-tight">
            {getTranslation('addFinancialDataToSeeChart', language)}
          </p>
        </div>
      </div>
    );
  }

  const currentYear = new Date().getFullYear();
  const currentDate = new Date();

  const data = {
    labels: projections.map(p => {
      const year = currentYear + Math.floor(p.year);
      const quarter = Math.round((p.year % 1) * 4);
      // Only show year labels, hide quarter labels
      if (quarter === 0) {
        return `${year}`;
      } else {
        return '';
      }
    }),
    datasets: [
      {
        label: getTranslation('currentNetWorth', language),
        data: projections.map(p => p.netWorth),
        borderColor: darkMode ? 'rgb(99, 102, 241)' : 'rgb(79, 70, 229)',
        backgroundColor: darkMode ? 'rgba(99, 102, 241, 0.1)' : 'rgba(79, 70, 229, 0.1)',
        fill: true,
        tension: 0.4,
        borderWidth: 4,
      },
      {
        label: getTranslation('totalAssets', language),
        data: projections.map(p => p.totalAssets),
        borderColor: darkMode ? 'rgb(34, 197, 94)' : 'rgb(22, 163, 74)',
        backgroundColor: darkMode ? 'rgba(34, 197, 94, 0.1)' : 'rgba(22, 163, 74, 0.1)',
        fill: false,
        tension: 0.4,
        borderWidth: 4,
      },
      {
        label: getTranslation('totalLiabilities', language),
        data: projections.map(p => p.totalLiabilities),
        borderColor: darkMode ? 'rgb(239, 68, 68)' : 'rgb(220, 38, 38)',
        backgroundColor: darkMode ? 'rgba(239, 68, 68, 0.1)' : 'rgba(220, 38, 38, 0.1)',
        fill: false,
        tension: 0.4,
        borderWidth: 4,
      }
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: darkMode ? '#F1F5F9' : '#334155',
          font: {
            size: 16,
            weight: 'bold' as const,
            family: 'Inter, system-ui, -apple-system, sans-serif'
          },
          padding: 24,
        }
      },
      title: {
        display: true,
        text: getTranslation('yourFinancialJourney', language),
        color: darkMode ? '#F8FAFC' : '#0F172A',
        font: {
          size: 28,
          weight: 'bold' as const,
          family: 'Inter, system-ui, -apple-system, sans-serif'
        },
        padding: 36,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: darkMode ? '#0F172A' : '#FFFFFF',
        titleColor: darkMode ? '#F8FAFC' : '#0F172A',
        bodyColor: darkMode ? '#F1F5F9' : '#334155',
        borderColor: darkMode ? '#334155' : '#E2E8F0',
        borderWidth: 1,
        cornerRadius: 16,
        padding: 16,
        titleFont: {
          size: 16,
          weight: 'bold',
          family: 'Inter, system-ui, -apple-system, sans-serif'
        },
        bodyFont: {
          size: 14,
          family: 'Inter, system-ui, -apple-system, sans-serif'
        },
        callbacks: {
          label: function(context: any) {
            return `${context.dataset.label}: ${context.parsed.y.toLocaleString()}`;
          },
          title: function(context: any) {
            if (context.length > 0) {
              const dataIndex = context[0].dataIndex;
              const projection = projections[dataIndex];
              if (projection) {
               // Show "Heute" for the first data point
               if (dataIndex === 0) {
                 return language === 'de' ? 'Heute' : 'Today';
               }
               
                const year = currentYear + Math.floor(projection.year);
                const quarter = Math.round((projection.year % 1) * 4);
                if (quarter === 0) {
                  return `${year}`;
                } else {
                  return `${year} Q${quarter}`;
                }
              }
            }
            return '';
          }
        }
      },
    },
    hover: {
      mode: 'nearest' as const,
      intersect: true,
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: getTranslation('years', language),
          color: darkMode ? '#F1F5F9' : '#334155',
          font: {
            size: 18,
            weight: 'bold' as const,
            family: 'Inter, system-ui, -apple-system, sans-serif'
          }
        },
        ticks: {
          color: darkMode ? '#CBD5E1' : '#64748B',
          font: {
            size: 14,
            weight: 'bold' as const,
            family: 'Inter, system-ui, -apple-system, sans-serif'
          }
        },
        grid: {
          color: darkMode ? '#334155' : '#E2E8F0',
          lineWidth: 1,
        }
      },
      y: {
        display: true,
        title: {
          display: true,
          text: getTranslation('amount', language),
          color: darkMode ? '#F1F5F9' : '#334155',
          font: {
            size: 18,
            weight: 'bold' as const,
            family: 'Inter, system-ui, -apple-system, sans-serif'
          }
        },
        ticks: {
          color: darkMode ? '#CBD5E1' : '#64748B',
          font: {
            size: 14,
            weight: 'bold' as const,
            family: 'Inter, system-ui, -apple-system, sans-serif'
          },
          callback: function(value: any) {
            return value.toLocaleString();
          }
        },
        grid: {
          color: darkMode ? '#334155' : '#E2E8F0',
          lineWidth: 1,
        }
      },
    },
  };

  // Generate quarter date labels
  const quarterDates = projections.map(p => {
    const year = currentYear + Math.floor(p.year);
    const quarter = Math.round((p.year % 1) * 4);
    
    // Quarter start dates: Q1=Jan 1, Q2=Apr 1, Q3=Jul 1, Q4=Oct 1
    const quarterStartMonths = [0, 3, 6, 9]; // January=0, April=3, July=6, October=9
    const month = quarterStartMonths[quarter] || 0;
    
    return `01.${(month + 1).toString().padStart(2, '0')}`;
  });

  return (
    <div className={`${darkMode ? 'bg-slate-800/60 border-slate-700/50' : 'bg-white/80 border-slate-200/50'} rounded-3xl shadow-2xl p-10 border backdrop-blur-xl`} style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
      <div style={{ height: '500px' }}>
        <Line data={data} options={options} />
      </div>
      
      {/* Quarter explanation */}
      <div className="mt-8 text-center">
        <div className={`text-sm ${darkMode ? 'text-slate-500' : 'text-slate-400'} space-y-2 font-medium`}>
          <div>1. Quartal – 01. Januar</div>
          <div>2. Quartal – 01. April</div>
          <div>3. Quartal – 01. Juli</div>
          <div>4. Quartal – 01. Oktober</div>
        </div>
      </div>
    </div>
  );
}