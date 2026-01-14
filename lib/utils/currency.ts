// lib/utils/currency.ts

export type Currency = "INR" | "USD";
export type CurrencySymbol = "₹" | "$";

export interface CurrencyInfo {
  code: Currency;
  symbol: CurrencySymbol;
  name: string;
}

const CURRENCY_MAP: Record<Currency, CurrencyInfo> = {
  INR: {
    code: "INR",
    symbol: "₹",
    name: "Indian Rupee",
  },
  USD: {
    code: "USD",
    symbol: "$",
    name: "US Dollar",
  },
};

// Exchange rate: 1 USD = 83 INR (approximate)
const USD_TO_INR_RATE = 83;

/**
 * Detect user's currency based on timezone and locale
 * This is a client-side detection method
 */
export function detectCurrency(): Currency {
  if (typeof window === "undefined") {
    return "USD"; // Default to USD for SSR
  }

  try {
    // Method 1: Check timezone
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (timezone.startsWith("Asia/Kolkata") || timezone.startsWith("Asia/Calcutta")) {
      return "INR";
    }

    // Method 2: Check browser language
    const language = navigator.language || (navigator as unknown as { userLanguage?: string }).userLanguage || "";
    if (language.startsWith("en-IN") || language.startsWith("hi")) {
      return "INR";
    }

    // Method 3: Check if currency format matches INR
    const sampleNumber = new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "INR",
    }).format(1000);

    if (sampleNumber.includes("₹")) {
      return "INR";
    }

    // Default to USD for international users
    return "USD";
  } catch (error) {
    console.error("Error detecting currency:", error);
    return "USD";
  }
}

/**
 * Get currency info by code
 */
export function getCurrencyInfo(currency: Currency): CurrencyInfo {
  return CURRENCY_MAP[currency];
}

/**
 * Format amount in the specified currency
 */
export function formatCurrency(amount: number, currency: Currency): string {
  const info = getCurrencyInfo(currency);

  // For display purposes
  if (currency === "INR") {
    return `${info.symbol}${amount.toLocaleString("en-IN")}`;
  } else {
    return `${info.symbol}${amount.toLocaleString("en-US")}`;
  }
}

/**
 * Convert INR to USD (for pricing)
 */
export function convertINRtoUSD(inrAmount: number): number {
  return Math.round(inrAmount / USD_TO_INR_RATE);
}

/**
 * Convert USD to INR (for pricing)
 */
export function convertUSDtoINR(usdAmount: number): number {
  return Math.round(usdAmount * USD_TO_INR_RATE);
}

/**
 * Get Razorpay amount (in smallest currency unit)
 * INR: paise (multiply by 100)
 * USD: cents (multiply by 100)
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function getRazorpayAmount(amount: number, currency: Currency): number {
  return amount * 100;
}

/**
 * Convert Razorpay amount back to main currency unit
 */
export function fromRazorpayAmount(razorpayAmount: number): number {
  return razorpayAmount / 100;
}
