// constants/currencies.js
export const CURRENCIES = [
  {
    value: 'USD',
    label: 'USD',
    fullName: 'US Dollar',
    symbol: '$',
    flag: '🇺🇸',
    native: '$'
  },
  {
    value: 'EUR',
    label: 'EUR',
    fullName: 'Euro',
    symbol: '€',
    flag: '🇪🇺',
    native: '€'
  },
  {
    value: 'GBP',
    label: 'GBP',
    fullName: 'British Pound',
    symbol: '£',
    flag: '🇬🇧',
    native: '£'
  },
  {
    value: 'INR',
    label: 'INR',
    fullName: 'Indian Rupee',
    symbol: '₹',
    flag: '🇮🇳',
    native: '₹'
  },
  {
    value: 'JPY',
    label: 'JPY',
    fullName: 'Japanese Yen',
    symbol: '¥',
    flag: '🇯🇵',
    native: '¥'
  },
  {
    value: 'CNY',
    label: 'CNY',
    fullName: 'Chinese Yuan',
    symbol: '¥',
    flag: '🇨🇳',
    native: '¥'
  },
  {
    value: 'CAD',
    label: 'CAD',
    fullName: 'Canadian Dollar',
    symbol: 'C$',
    flag: '🇨🇦',
    native: 'C$'
  },
  {
    value: 'AUD',
    label: 'AUD',
    fullName: 'Australian Dollar',
    symbol: 'A$',
    flag: '🇦🇺',
    native: 'A$'
  }
];

export const getCurrencySymbol = (currencyCode) => {
  const currency = CURRENCIES.find(c => c.value === currencyCode);
  return currency?.symbol || currencyCode;
};

export const getCurrencyFlag = (currencyCode) => {
  const currency = CURRENCIES.find(c => c.value === currencyCode);
  return currency?.flag || '💰';
};

export const formatAmount = (amount, currencyCode) => {
  const currency = CURRENCIES.find(c => c.value === currencyCode);
  const symbol = currency?.symbol || currencyCode;
  return `${symbol}${amount.toFixed(2)}`;
};

export const formatAmountWithNative = (amount, currencyCode) => {
  const currency = CURRENCIES.find(c => c.value === currencyCode);
  if (currency) {
    return `${currency.flag} ${currency.symbol}${amount.toFixed(2)} (${currency.fullName})`;
  }
  return `${currencyCode} ${amount.toFixed(2)}`;
};