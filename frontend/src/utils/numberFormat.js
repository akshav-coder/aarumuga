// Format number in Indian numbering system (lakhs/crores)
export const formatIndianNumber = (value) => {
  if (!value && value !== 0) return "";

  // Convert to string and remove any existing commas
  const numStr = value.toString().replace(/,/g, "");
  const num = parseFloat(numStr);

  if (isNaN(num)) return "";

  // Split into integer and decimal parts
  const parts = numStr.split(".");
  const integerPart = parts[0];
  const decimalPart = parts[1] ? "." + parts[1] : "";

  // Apply Indian numbering system
  // First 3 digits from right, then pairs of 2
  if (integerPart.length <= 3) {
    return integerPart + decimalPart;
  }

  // Get last 3 digits
  const lastThree = integerPart.slice(-3);
  // Get remaining digits
  const remaining = integerPart.slice(0, -3);

  // Group remaining digits in pairs of 2 from right
  let formatted = remaining.replace(/\B(?=(\d{2})+(?!\d))/g, ",");
  formatted = formatted + "," + lastThree;

  return formatted + decimalPart;
};

// Parse formatted number back to numeric value
export const parseFormattedNumber = (value) => {
  if (!value) return "";
  // Remove all commas and return
  return value.toString().replace(/,/g, "");
};

// Format currency in Indian style
export const formatIndianCurrency = (value) => {
  if (!value && value !== 0) return "₹0";
  const formatted = formatIndianNumber(value);
  return `₹${formatted}`;
};
