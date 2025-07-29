// frontend/src/utils/formatter.js
export const formatCurrency = (value, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(value);
};

export const formatPercentage = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value / 100);
};

export const truncateAddress = (address, length = 6) => {
  if (!address) return '';
  return `${address.substring(0, length)}...${address.substring(address.length - length)}`;
};

export const formatDate = (date, format = 'medium') => {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: format,
    timeStyle: format
  }).format(new Date(date));
};