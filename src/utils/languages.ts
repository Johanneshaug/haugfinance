export interface Language {
  code: string;
  name: string;
  flag: string;
}

export const languages: Language[] = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
];

export interface Translations {
  // Header
  netWorthCalculator: string;
  projectFinancialFuture: string;
  
  // Summary Cards
  currentNetWorth: string;
  monthlyCashFlow: string;
  netWorthInYears: string;
  totalDebt: string;
  assets: string;
  liabilities: string;
  surplusForInvestments: string;
  monthlyDeficit: string;
  growthOf: string;
  activeLoans: string;
  
  // Chart
  yourFinancialJourney: string;
  years: string;
  amount: string;
  totalAssets: string;
  totalLiabilities: string;
  
  // Financial Overview
  yourFinancialOverview: string;
  addAsset: string;
  addDebt: string;
  addIncome: string;
  addExpense: string;
  
  // Asset Types
  cash: string;
  investment: string;
  property: string;
  stock: string;
  
  // Liability Types
  mortgage: string;
  auto: string;
  creditCard: string;
  student: string;
  other: string;
  
  // Edit Modal
  editAsset: string;
  editDebt: string;
  editIncome: string;
  editExpense: string;
  assetType: string;
  assetName: string;
  currentValue: string;
  stockSymbol: string;
  numberOfShares: string;
  updateStockPrice: string;
  annualGrowthRate: string;
  debtName: string;
  currentBalance: string;
  monthlyPayment: string;
  interestRate: string;
  incomeSource: string;
  monthlyAmount: string;
  expenseCategory: string;
  cancel: string;
  saveChanges: string;
  
  // Settings
  settings: string;
  theme: string;
  darkMode: string;
  lightMode: string;
  currency: string;
  language: string;
  saveSettings: string;
  betaFeatures: string; // New translation key
  distributionFrequency: string; // New translation key
  monthly: string; // New translation key
  quarterly: string; // New translation key
  semiannual: string; // New translation key
  yearly: string; // New translation key
  
  // Projection
  projectFor: string;
  
  // Footer
  disclaimerText: string;
  consultAdvisor: string;
  
  // Empty state
  noFinancialItemsAdded: string;
  
  // Placeholders
  placeholderSavingsAccount: string;
  placeholderStudentLoan: string;
  placeholderSalary: string;
  placeholderLivingExpenses: string;
}

export const translations: Record<string, Translations> = {
  en: {
    // Header
    netWorthCalculator: 'Net Worth Calculator',
    projectFinancialFuture: 'Project your financial future with precision',
    
    // Summary Cards
    currentNetWorth: 'Current Net Worth',
    monthlyCashFlow: 'Monthly Cash Flow',
    netWorthInYears: 'Net Worth in {years} Years',
    totalDebt: 'Total Debt',
    assets: 'Assets',
    liabilities: 'Liabilities',
    surplusForInvestments: 'Surplus for investments',
    monthlyDeficit: 'Monthly deficit',
    growthOf: 'Growth of',
    activeLoans: 'active loans',
    
    // Chart
    yourFinancialJourney: 'Your Financial Journey',
    years: 'Years',
    amount: 'Amount',
    totalAssets: 'Total Assets',
    totalLiabilities: 'Total Liabilities',
    
    // Financial Overview
    yourFinancialOverview: 'Your Financial Overview',
    addAsset: 'Add Asset',
    addDebt: 'Add Debt',
    addIncome: 'Add Income',
    addExpense: 'Add Expense',
    
    // Asset Types
    cash: 'Cash',
    investment: 'Investment',
    property: 'Property',
    stock: 'Stock',
    
    // Liability Types
    mortgage: 'Mortgage',
    auto: 'Auto Loan',
    creditCard: 'Credit Card',
    student: 'Student Loan',
    other: 'Other',
    
    // Edit Modal
    editAsset: 'Edit Asset',
    editDebt: 'Edit Debt',
    editIncome: 'Edit Income',
    editExpense: 'Edit Expense',
    assetType: 'Asset Type',
    assetName: 'Asset Name',
    currentValue: 'Current Value',
    stockSymbol: 'Stock Symbol',
    numberOfShares: 'Number of Shares',
    updateStockPrice: 'Update Stock Price',
    annualGrowthRate: 'Annual Growth Rate (% p.a.)',
    debtName: 'Debt Name',
    currentBalance: 'Current Balance',
    monthlyPayment: 'Monthly Payment',
    interestRate: 'Interest Rate (% p.a.)',
    incomeSource: 'Income Source',
    monthlyAmount: 'Monthly Amount',
    expenseCategory: 'Expense Category',
    cancel: 'Cancel',
    saveChanges: 'Save Changes',
    
    // Settings
    settings: 'Settings',
    theme: 'Theme',
    darkMode: 'Dark Mode',
    lightMode: 'Light Mode',
    currency: 'Currency',
    language: 'Language',
    saveSettings: 'Save Settings',
    betaFeatures: 'Beta Features', // New translation
    distributionFrequency: 'Distribution Frequency',
    monthly: 'Monthly',
    quarterly: 'Quarterly',
    semiannual: 'Semiannual',
    yearly: 'Yearly',
    
    // Projection
    projectFor: 'Project for:',
    
    // Footer
    disclaimerText: 'This calculator provides estimates based on your inputs. Actual results may vary.',
    consultAdvisor: 'Consult a financial advisor for professional advice.',
    
    // Empty state
    noFinancialItemsAdded: 'No financial items added yet. Click the buttons above to get started.',
    addFinancialDataToSeeChart: 'Add financial data to see your projection chart',
    
    // Placeholders
    placeholderSavingsAccount: 'e.g., Savings Account',
    placeholderStudentLoan: 'e.g., Student Loan',
    placeholderSalary: 'e.g., Salary',
    placeholderLivingExpenses: 'e.g., Living Expenses',
  },
  de: {
    // Header
    netWorthCalculator: 'Vermögensrechner',
    projectFinancialFuture: 'Projizieren Sie Ihre finanzielle Zukunft präzise',
    
    // Summary Cards
    currentNetWorth: 'Nettovermögen',
    monthlyCashFlow: 'Monatlicher Cashflow',
    netWorthInYears: 'Nettovermögen in {years} Jahren',
    totalDebt: 'Gesamtschulden',
    assets: 'Vermögenswerte',
    liabilities: 'Schulden',
    surplusForInvestments: 'Überschuss für Investitionen',
    monthlyDeficit: 'Monatliches Defizit',
    growthOf: 'Wachstum von',
    activeLoans: 'aktive Kredite',
    
    // Chart
    yourFinancialJourney: 'Ihre Finanzreise',
    years: 'Jahre',
    amount: 'Betrag',
    totalAssets: 'Gesamte Vermögenswerte',
    totalLiabilities: 'Gesamte Schulden',
    
    // Financial Overview
    yourFinancialOverview: 'Ihre Finanzübersicht',
    addAsset: 'Vermögenswert hinzufügen',
    addDebt: 'Schuld hinzufügen',
    addIncome: 'Einkommen hinzufügen',
    addExpense: 'Ausgabe hinzufügen',
    
    // Asset Types
    cash: 'Bargeld',
    investment: 'Investition',
    property: 'Immobilie',
    stock: 'Aktie',
    
    // Liability Types
    mortgage: 'Hypothek',
    auto: 'Autokredit',
    creditCard: 'Kreditkarte',
    student: 'Studienkredit',
    other: 'Sonstiges',
    
    // Edit Modal
    editAsset: 'Vermögen bearbeiten',
    editDebt: 'Schuld bearbeiten',
    editIncome: 'Einkommen bearbeiten',
    editExpense: 'Ausgabe bearbeiten',
    assetType: 'Vermögensart',
    assetName: 'Vermögensname',
    currentValue: 'Aktueller Wert',
    stockSymbol: 'Aktiensymbol',
    numberOfShares: 'Anzahl Aktien',
    updateStockPrice: 'Aktienkurs aktualisieren',
    annualGrowthRate: 'Jährliche Wachstumsrate (% p.a.)',
    debtName: 'Schuldname',
    currentBalance: 'Aktueller Saldo',
    monthlyPayment: 'Monatliche Zahlung',
    interestRate: 'Zinssatz (% p.a.)',
    incomeSource: 'Einkommensquelle',
    monthlyAmount: 'Monatlicher Betrag',
    expenseCategory: 'Ausgabenkategorie',
    cancel: 'Abbrechen',
    saveChanges: 'Änderungen speichern',
    
    // Settings
    settings: 'Einstellungen',
    theme: 'Design',
    darkMode: 'Dunkler Modus',
    lightMode: 'Heller Modus',
    currency: 'Währung',
    language: 'Sprache',
    saveSettings: 'Einstellungen speichern',
    betaFeatures: 'Beta-Features', // New translation
    distributionFrequency: 'Ausschüttungshäufigkeit',
    monthly: 'Monatlich',
    quarterly: 'Quartalsweise',
    semiannual: 'Halbjährlich',
    yearly: 'Jährlich',
    
    // Projection
    projectFor: 'Projektion für:',
    
    // Footer
    disclaimerText: 'Dieser Rechner liefert Schätzungen basierend auf Ihren Eingaben. Tatsächliche Ergebnisse können abweichen.',
    consultAdvisor: 'Konsultieren Sie einen Finanzberater für professionelle Beratung.',
    
    // Empty state
    noFinancialItemsAdded: 'Noch keine Finanzeinträge hinzugefügt. Klicken Sie auf die Schaltflächen oben, um zu beginnen.',
    addFinancialDataToSeeChart: 'Fügen Sie Finanzdaten hinzu, um Ihr Projektionsdiagramm zu sehen',
    
    // Placeholders
    placeholderSavingsAccount: 'z.B. Sparkonto',
    placeholderStudentLoan: 'z.B. Studienkredit',
    placeholderSalary: 'z.B. Gehalt',
    placeholderLivingExpenses: 'z.B. Lebenshaltungskosten',
  },
};

export function getTranslation(key: keyof Translations, language: string, replacements?: Record<string, string>): string {
  let text = translations[language]?.[key] || translations['en'][key] || key;
  
  if (replacements) {
    Object.entries(replacements).forEach(([placeholder, value]) => {
      text = text.replace(`{${placeholder}}`, value);
    });
  }
  
  return text;
}