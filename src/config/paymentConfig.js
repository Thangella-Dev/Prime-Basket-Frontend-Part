export const PAYMENT_CONFIG = {
  in: {
    methods: [
      { id: "upi", icon: "fa-mobile-alt", defaultActive: true },
      { id: "card", icon: "fa-credit-card" },
      { id: "netbanking", icon: "fa-university" },
      { id: "wallet", icon: "fa-wallet" },
      { id: "cod", icon: "fa-money-bill-wave" }
    ],
    cards: ["visa", "mastercard", "rupay", "amex"],
    currency: "INR",
    currencySymbol: "\u20B9",
    upiApps: [
      { id: "gpay", label: "Google Pay", logo: "https://upload.wikimedia.org/wikipedia/commons/f/f2/Google_Pay_Logo.svg" },
      { id: "phonepe", label: "PhonePe", logo: "https://upload.wikimedia.org/wikipedia/commons/7/71/PhonePe_Logo.svg" },
      { id: "paytm", label: "Paytm", logo: "https://commons.wikimedia.org/wiki/Special:FilePath/Paytm_Logo_(standalone).svg" },
      { id: "bhim", label: "BHIM", logo: "https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo-vector.svg" },
    ],
    wallets: [
      { id: "paytm", label: "Paytm", logo: "https://commons.wikimedia.org/wiki/Special:FilePath/Paytm_Logo_(standalone).svg" },
      { id: "amazon", label: "Amazon Pay", logo: "https://m.media-amazon.com/images/G/01/amazonpayments/documentation/AmazonPay_BrandAssets/Logos/amazonpay-secondary-logo-rgb_clr.png" },
      { id: "free", label: "Freecharge", logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSWd7gE_EU9okxdsbO0WMiR2Xt3I2qbMlb7Ng&s" },
      { id: "jiop", label: "JioPay", logo: "https://cdn.theorg.com/ee5f2b88-1ed8-40b1-8f31-5b321c65a61c_medium.jpg" },
    ],
    banks: [
      "State Bank of India", "HDFC Bank", "ICICI Bank", "Axis Bank",
      "Kotak Mahindra Bank", "Punjab National Bank", "Bank of Baroda", "Canara Bank"
    ]
  },
  ke: {
    methods: [
      { id: "mpesa", icon: "fa-mobile-alt", defaultActive: true, overrideLabel: "M-Pesa", overrideDesc: "Pay securely via Safaricom M-Pesa" },
      { id: "card", icon: "fa-credit-card", overrideDesc: "Visa, Mastercard, Amex, UnionPay" },
      { id: "netbanking", icon: "fa-university" },
      { id: "wallet", icon: "fa-wallet", overrideLabel: "Wallet", overrideDesc: "M-Pesa & Airtel Money" },
      { id: "cod", icon: "fa-money-bill-wave" }
    ],
    cards: ["visa", "mastercard", "amex", "unionpay"],
    currency: "KES",
    currencySymbol: "KES ",
    upiApps: [],
    wallets: [
      { id: "mpesa", label: "M-Pesa", logo: "https://upload.wikimedia.org/wikipedia/commons/1/15/M-PESA_LOGO-01.svg" },
      { id: "airtel", label: "Airtel Money", logo: "https://www.pngall.com/wp-content/uploads/17/Airtel-Money-Logo-PNG-thumb.png" },
    ],
    banks: [
      "KCB Bank", "Equity Bank", "Co-operative Bank", "Absa Bank Kenya",
      "Standard Chartered Kenya", "I&M Bank", "Stanbic Bank Kenya", "NCBA Bank"
    ]
  }
};

