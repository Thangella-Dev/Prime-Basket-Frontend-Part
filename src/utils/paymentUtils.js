export const validateLuhn = (number) => {
  const digits = number.replace(/\D/g, "");
  if (!digits) return false;
  let sum = 0;
  let isEven = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits.charAt(i), 10);
    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    isEven = !isEven;
  }
  return sum % 10 === 0;
};

export const detectCardType = (number) => {
  const digits = number.replace(/\D/g, "");
  
  if (/^4/.test(digits)) return "visa";
  if (/^(5[1-5]|2[2-7])/.test(digits)) return "mastercard";
  if (/^6/.test(digits) && !/^62/.test(digits)) return "rupay"; // Basic Rupay detection
  if (/^3[47]/.test(digits)) return "amex";
  if (/^62/.test(digits)) return "unionpay";
  
  return "unknown";
};

export const formatCardNumber = (v, type) => {
  const digits = v.replace(/\D/g, "");
  if (type === "amex") {
    // Amex format: 4 6 5
    const parts = [];
    if (digits.length > 0) parts.push(digits.slice(0, 4));
    if (digits.length > 4) parts.push(digits.slice(4, 10));
    if (digits.length > 10) parts.push(digits.slice(10, 15));
    return parts.join(" ").trim();
  } else {
    // Standard format: 4 4 4 4
    return digits.slice(0, 19).replace(/(.{4})/g, "$1 ").trim();
  }
};

export const formatExpiry = (v) => {
  const digits = v.replace(/\D/g, "").slice(0, 4);
  if (digits.length > 2) {
    return digits.slice(0, 2) + "/" + digits.slice(2);
  }
  return digits;
};

export const validateExpiry = (expiry) => {
  if (expiry.length < 5) return false;
  const [month, year] = expiry.split("/");
  const m = parseInt(month, 10);
  const y = parseInt(year, 10) + 2000;
  
  if (m < 1 || m > 12) return false;
  
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  
  if (y < currentYear) return false;
  if (y === currentYear && m < currentMonth) return false;
  
  return true;
};

export const validateUPI = (upiId) => {
  return /^[\w.\-]+@[\w]+$/.test(upiId.trim());
};

export const validateMPesa = (phone) => {
  const digits = phone.replace(/\D/g, "");
  // Safaricom M-Pesa format: 2547XXXXXXXX or 07XXXXXXXX or 01XXXXXXXX
  return /^(?:254|\+254|0)?([71]\d{8})$/.test(digits);
};
