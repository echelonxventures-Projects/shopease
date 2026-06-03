/**
 * Global Stock Exchanges & Market Types Configuration
 * 
 * Comprehensive, configurable, infinitely expandable.
 * Add new exchanges by appending to the EXCHANGES array.
 */

export interface ExchangeConfig {
  code: string;
  name: string;
  country: string;
  region: string;
  timezone: string;
  currency: string;
  marketType: string;
  openTime?: string;
  closeTime?: string;
  preMarketOpen?: string;
  postMarketClose?: string;
  tradingDays?: string[];
  mic?: string;
  suffix?: string;
  website?: string;
  logoUrl?: string;
  description?: string;
}

export const MARKET_TYPES = [
  "EQUITY", "COMMODITY", "DERIVATIVES", "CRYPTO", "FOREX", "BOND", "ETF", "FUTURES", "OPTIONS", "MONEY_MARKET",
] as const;

export const REGIONS = [
  "ASIA", "AMERICAS", "EUROPE", "AFRICA", "OCEANIA", "MIDDLE_EAST",
] as const;

// ── INDIA ───────────────────────────────────────────────────────────────────
export const INDIA_EXCHANGES: ExchangeConfig[] = [
  { code: "NSE", name: "National Stock Exchange of India", country: "IN", region: "ASIA", timezone: "Asia/Kolkata", currency: "INR", marketType: "EQUITY", openTime: "09:15", closeTime: "15:30", preMarketOpen: "09:00", postMarketClose: "16:00", mic: "XNSE", suffix: ".NS", website: "https://www.nseindia.com" },
  { code: "BSE", name: "Bombay Stock Exchange", country: "IN", region: "ASIA", timezone: "Asia/Kolkata", currency: "INR", marketType: "EQUITY", openTime: "09:15", closeTime: "15:30", mic: "XBOM", suffix: ".BO", website: "https://www.bseindia.com" },
  { code: "MCX", name: "Multi Commodity Exchange", country: "IN", region: "ASIA", timezone: "Asia/Kolkata", currency: "INR", marketType: "COMMODITY", openTime: "09:00", closeTime: "23:30", mic: "XMCE", website: "https://www.mcxindia.com" },
  { code: "NCDEX", name: "National Commodity & Derivatives Exchange", country: "IN", region: "ASIA", timezone: "Asia/Kolkata", currency: "INR", marketType: "COMMODITY", openTime: "10:00", closeTime: "23:30", website: "https://www.ncdex.com" },
  { code: "NSE_FO", name: "NSE Futures & Options", country: "IN", region: "ASIA", timezone: "Asia/Kolkata", currency: "INR", marketType: "DERIVATIVES", openTime: "09:15", closeTime: "15:30", mic: "XNSE" },
  { code: "IEX", name: "Indian Energy Exchange", country: "IN", region: "ASIA", timezone: "Asia/Kolkata", currency: "INR", marketType: "COMMODITY", website: "https://www.iexindia.com" },
];

// ── UNITED STATES ───────────────────────────────────────────────────────────
export const US_EXCHANGES: ExchangeConfig[] = [
  { code: "NYSE", name: "New York Stock Exchange", country: "US", region: "AMERICAS", timezone: "America/New_York", currency: "USD", marketType: "EQUITY", openTime: "09:30", closeTime: "16:00", preMarketOpen: "04:00", postMarketClose: "20:00", mic: "XNYS", website: "https://www.nyse.com" },
  { code: "NASDAQ", name: "NASDAQ Stock Market", country: "US", region: "AMERICAS", timezone: "America/New_York", currency: "USD", marketType: "EQUITY", openTime: "09:30", closeTime: "16:00", preMarketOpen: "04:00", postMarketClose: "20:00", mic: "XNAS", website: "https://www.nasdaq.com" },
  { code: "AMEX", name: "NYSE American (AMEX)", country: "US", region: "AMERICAS", timezone: "America/New_York", currency: "USD", marketType: "EQUITY", openTime: "09:30", closeTime: "16:00", mic: "XASE" },
  { code: "CBOE", name: "Chicago Board Options Exchange", country: "US", region: "AMERICAS", timezone: "America/Chicago", currency: "USD", marketType: "OPTIONS", openTime: "08:30", closeTime: "15:15", mic: "XCBO", website: "https://www.cboe.com" },
  { code: "CME", name: "Chicago Mercantile Exchange", country: "US", region: "AMERICAS", timezone: "America/Chicago", currency: "USD", marketType: "FUTURES", openTime: "17:00", closeTime: "16:00", mic: "XCME", website: "https://www.cmegroup.com" },
  { code: "NYMEX", name: "New York Mercantile Exchange", country: "US", region: "AMERICAS", timezone: "America/New_York", currency: "USD", marketType: "COMMODITY", mic: "XNYM" },
  { code: "COMEX", name: "COMEX (Metals)", country: "US", region: "AMERICAS", timezone: "America/New_York", currency: "USD", marketType: "COMMODITY", mic: "XCEC" },
  { code: "OTC", name: "OTC Markets (Pink Sheets)", country: "US", region: "AMERICAS", timezone: "America/New_York", currency: "USD", marketType: "EQUITY", openTime: "09:30", closeTime: "16:00" },
  { code: "BATS", name: "BATS Global Markets", country: "US", region: "AMERICAS", timezone: "America/New_York", currency: "USD", marketType: "EQUITY", mic: "BATS" },
];

// ── UNITED KINGDOM & EUROPE ─────────────────────────────────────────────────
export const EUROPE_EXCHANGES: ExchangeConfig[] = [
  { code: "LSE", name: "London Stock Exchange", country: "GB", region: "EUROPE", timezone: "Europe/London", currency: "GBP", marketType: "EQUITY", openTime: "08:00", closeTime: "16:30", mic: "XLON", suffix: ".L", website: "https://www.londonstockexchange.com" },
  { code: "AIM", name: "AIM (Alternative Investment Market)", country: "GB", region: "EUROPE", timezone: "Europe/London", currency: "GBP", marketType: "EQUITY", openTime: "08:00", closeTime: "16:30" },
  { code: "EURONEXT", name: "Euronext (Paris)", country: "FR", region: "EUROPE", timezone: "Europe/Paris", currency: "EUR", marketType: "EQUITY", openTime: "09:00", closeTime: "17:30", mic: "XPAR", suffix: ".PA", website: "https://www.euronext.com" },
  { code: "EURONEXT_AMS", name: "Euronext Amsterdam", country: "NL", region: "EUROPE", timezone: "Europe/Amsterdam", currency: "EUR", marketType: "EQUITY", openTime: "09:00", closeTime: "17:30", mic: "XAMS", suffix: ".AS" },
  { code: "EURONEXT_BRU", name: "Euronext Brussels", country: "BE", region: "EUROPE", timezone: "Europe/Brussels", currency: "EUR", marketType: "EQUITY", openTime: "09:00", closeTime: "17:30", mic: "XBRU", suffix: ".BR" },
  { code: "EURONEXT_LIS", name: "Euronext Lisbon", country: "PT", region: "EUROPE", timezone: "Europe/Lisbon", currency: "EUR", marketType: "EQUITY", openTime: "08:00", closeTime: "16:30", mic: "XLIS", suffix: ".LS" },
  { code: "XETRA", name: "Deutsche Börse (XETRA)", country: "DE", region: "EUROPE", timezone: "Europe/Berlin", currency: "EUR", marketType: "EQUITY", openTime: "09:00", closeTime: "17:30", mic: "XETR", suffix: ".DE", website: "https://www.deutsche-boerse.com" },
  { code: "FWB", name: "Frankfurt Stock Exchange", country: "DE", region: "EUROPE", timezone: "Europe/Berlin", currency: "EUR", marketType: "EQUITY", openTime: "08:00", closeTime: "20:00", mic: "XFRA", suffix: ".F" },
  { code: "SIX", name: "SIX Swiss Exchange", country: "CH", region: "EUROPE", timezone: "Europe/Zurich", currency: "CHF", marketType: "EQUITY", openTime: "09:00", closeTime: "17:30", mic: "XSWX", suffix: ".SW", website: "https://www.six-group.com" },
  { code: "BME", name: "Bolsa de Madrid", country: "ES", region: "EUROPE", timezone: "Europe/Madrid", currency: "EUR", marketType: "EQUITY", openTime: "09:00", closeTime: "17:30", mic: "XMAD", suffix: ".MC" },
  { code: "BORSA", name: "Borsa Italiana (Milan)", country: "IT", region: "EUROPE", timezone: "Europe/Rome", currency: "EUR", marketType: "EQUITY", openTime: "09:00", closeTime: "17:30", mic: "XMIL", suffix: ".MI" },
  { code: "OMX_STO", name: "Nasdaq Stockholm", country: "SE", region: "EUROPE", timezone: "Europe/Stockholm", currency: "SEK", marketType: "EQUITY", openTime: "09:00", closeTime: "17:30", mic: "XSTO", suffix: ".ST" },
  { code: "OMX_HEL", name: "Nasdaq Helsinki", country: "FI", region: "EUROPE", timezone: "Europe/Helsinki", currency: "EUR", marketType: "EQUITY", openTime: "10:00", closeTime: "18:30", mic: "XHEL", suffix: ".HE" },
  { code: "OMX_CPH", name: "Nasdaq Copenhagen", country: "DK", region: "EUROPE", timezone: "Europe/Copenhagen", currency: "DKK", marketType: "EQUITY", openTime: "09:00", closeTime: "17:00", mic: "XCSE", suffix: ".CO" },
  { code: "OSE", name: "Oslo Stock Exchange", country: "NO", region: "EUROPE", timezone: "Europe/Oslo", currency: "NOK", marketType: "EQUITY", openTime: "09:00", closeTime: "16:20", mic: "XOSL", suffix: ".OL" },
  { code: "WSE", name: "Warsaw Stock Exchange", country: "PL", region: "EUROPE", timezone: "Europe/Warsaw", currency: "PLN", marketType: "EQUITY", openTime: "09:00", closeTime: "17:00", mic: "XWAR", suffix: ".WA" },
  { code: "ATHEX", name: "Athens Stock Exchange", country: "GR", region: "EUROPE", timezone: "Europe/Athens", currency: "EUR", marketType: "EQUITY", openTime: "10:00", closeTime: "17:20", mic: "XATH", suffix: ".AT" },
  { code: "ISE", name: "Irish Stock Exchange (Euronext Dublin)", country: "IE", region: "EUROPE", timezone: "Europe/Dublin", currency: "EUR", marketType: "EQUITY", mic: "XDUB", suffix: ".IR" },
  { code: "WBAG", name: "Vienna Stock Exchange", country: "AT", region: "EUROPE", timezone: "Europe/Vienna", currency: "EUR", marketType: "EQUITY", openTime: "09:00", closeTime: "17:30", mic: "XWBO", suffix: ".VI" },
  { code: "MOEX", name: "Moscow Exchange", country: "RU", region: "EUROPE", timezone: "Europe/Moscow", currency: "RUB", marketType: "EQUITY", openTime: "10:00", closeTime: "18:50", mic: "XMOS", suffix: ".ME" },
  { code: "IST", name: "Borsa Istanbul", country: "TR", region: "EUROPE", timezone: "Europe/Istanbul", currency: "TRY", marketType: "EQUITY", openTime: "10:00", closeTime: "18:00", mic: "XIST", suffix: ".IS" },
  { code: "PSE", name: "Prague Stock Exchange", country: "CZ", region: "EUROPE", timezone: "Europe/Prague", currency: "CZK", marketType: "EQUITY", mic: "XPRA", suffix: ".PR" },
  { code: "BVB", name: "Bucharest Stock Exchange", country: "RO", region: "EUROPE", timezone: "Europe/Bucharest", currency: "RON", marketType: "EQUITY", mic: "XBSE" },
  { code: "ICE_EU", name: "ICE Futures Europe", country: "GB", region: "EUROPE", timezone: "Europe/London", currency: "USD", marketType: "FUTURES", mic: "IFEU" },
  { code: "LME", name: "London Metal Exchange", country: "GB", region: "EUROPE", timezone: "Europe/London", currency: "USD", marketType: "COMMODITY", website: "https://www.lme.com" },
  { code: "EUREX", name: "Eurex Exchange", country: "DE", region: "EUROPE", timezone: "Europe/Berlin", currency: "EUR", marketType: "DERIVATIVES", mic: "XEUR", website: "https://www.eurex.com" },
];

// ── ASIA-PACIFIC ────────────────────────────────────────────────────────────
export const ASIA_EXCHANGES: ExchangeConfig[] = [
  { code: "TSE", name: "Tokyo Stock Exchange", country: "JP", region: "ASIA", timezone: "Asia/Tokyo", currency: "JPY", marketType: "EQUITY", openTime: "09:00", closeTime: "15:00", mic: "XJPX", suffix: ".T", website: "https://www.jpx.co.jp" },
  { code: "OSE_JP", name: "Osaka Exchange (Derivatives)", country: "JP", region: "ASIA", timezone: "Asia/Tokyo", currency: "JPY", marketType: "DERIVATIVES", mic: "XOSE" },
  { code: "HKEX", name: "Hong Kong Stock Exchange", country: "HK", region: "ASIA", timezone: "Asia/Hong_Kong", currency: "HKD", marketType: "EQUITY", openTime: "09:30", closeTime: "16:00", mic: "XHKG", suffix: ".HK", website: "https://www.hkex.com.hk" },
  { code: "SSE", name: "Shanghai Stock Exchange", country: "CN", region: "ASIA", timezone: "Asia/Shanghai", currency: "CNY", marketType: "EQUITY", openTime: "09:30", closeTime: "15:00", mic: "XSHG", suffix: ".SS", website: "http://www.sse.com.cn" },
  { code: "SZSE", name: "Shenzhen Stock Exchange", country: "CN", region: "ASIA", timezone: "Asia/Shanghai", currency: "CNY", marketType: "EQUITY", openTime: "09:30", closeTime: "15:00", mic: "XSHE", suffix: ".SZ" },
  { code: "KRX", name: "Korea Exchange (KOSPI)", country: "KR", region: "ASIA", timezone: "Asia/Seoul", currency: "KRW", marketType: "EQUITY", openTime: "09:00", closeTime: "15:30", mic: "XKRX", suffix: ".KS", website: "http://www.krx.co.kr" },
  { code: "KOSDAQ", name: "KOSDAQ", country: "KR", region: "ASIA", timezone: "Asia/Seoul", currency: "KRW", marketType: "EQUITY", openTime: "09:00", closeTime: "15:30", mic: "XKOS", suffix: ".KQ" },
  { code: "TWSE", name: "Taiwan Stock Exchange", country: "TW", region: "ASIA", timezone: "Asia/Taipei", currency: "TWD", marketType: "EQUITY", openTime: "09:00", closeTime: "13:30", mic: "XTAI", suffix: ".TW" },
  { code: "SGX", name: "Singapore Exchange", country: "SG", region: "ASIA", timezone: "Asia/Singapore", currency: "SGD", marketType: "EQUITY", openTime: "09:00", closeTime: "17:00", mic: "XSES", suffix: ".SI", website: "https://www.sgx.com" },
  { code: "SET", name: "Stock Exchange of Thailand", country: "TH", region: "ASIA", timezone: "Asia/Bangkok", currency: "THB", marketType: "EQUITY", openTime: "10:00", closeTime: "16:30", mic: "XBKK", suffix: ".BK" },
  { code: "IDX", name: "Indonesia Stock Exchange", country: "ID", region: "ASIA", timezone: "Asia/Jakarta", currency: "IDR", marketType: "EQUITY", openTime: "09:00", closeTime: "16:00", mic: "XIDX", suffix: ".JK" },
  { code: "KLSE", name: "Bursa Malaysia", country: "MY", region: "ASIA", timezone: "Asia/Kuala_Lumpur", currency: "MYR", marketType: "EQUITY", openTime: "09:00", closeTime: "17:00", mic: "XKLS", suffix: ".KL" },
  { code: "PSE_PH", name: "Philippine Stock Exchange", country: "PH", region: "ASIA", timezone: "Asia/Manila", currency: "PHP", marketType: "EQUITY", openTime: "09:30", closeTime: "15:30", mic: "XPHS" },
  { code: "HOSE", name: "Ho Chi Minh Stock Exchange", country: "VN", region: "ASIA", timezone: "Asia/Ho_Chi_Minh", currency: "VND", marketType: "EQUITY", openTime: "09:00", closeTime: "15:00", mic: "XSTC" },
  { code: "CSE_LK", name: "Colombo Stock Exchange", country: "LK", region: "ASIA", timezone: "Asia/Colombo", currency: "LKR", marketType: "EQUITY", mic: "XCOL" },
  { code: "DSE", name: "Dhaka Stock Exchange", country: "BD", region: "ASIA", timezone: "Asia/Dhaka", currency: "BDT", marketType: "EQUITY", mic: "XDHA" },
  { code: "NEPSE", name: "Nepal Stock Exchange", country: "NP", region: "ASIA", timezone: "Asia/Kathmandu", currency: "NPR", marketType: "EQUITY" },
  { code: "KSE_PK", name: "Pakistan Stock Exchange", country: "PK", region: "ASIA", timezone: "Asia/Karachi", currency: "PKR", marketType: "EQUITY", openTime: "09:30", closeTime: "15:30", mic: "XKAR" },
];

// ── OCEANIA ─────────────────────────────────────────────────────────────────
export const OCEANIA_EXCHANGES: ExchangeConfig[] = [
  { code: "ASX", name: "Australian Securities Exchange", country: "AU", region: "OCEANIA", timezone: "Australia/Sydney", currency: "AUD", marketType: "EQUITY", openTime: "10:00", closeTime: "16:00", mic: "XASX", suffix: ".AX", website: "https://www.asx.com.au" },
  { code: "NZX", name: "New Zealand Exchange", country: "NZ", region: "OCEANIA", timezone: "Pacific/Auckland", currency: "NZD", marketType: "EQUITY", openTime: "10:00", closeTime: "16:45", mic: "XNZE", suffix: ".NZ" },
];

// ── MIDDLE EAST ─────────────────────────────────────────────────────────────
export const MIDDLE_EAST_EXCHANGES: ExchangeConfig[] = [
  { code: "TADAWUL", name: "Saudi Stock Exchange (Tadawul)", country: "SA", region: "MIDDLE_EAST", timezone: "Asia/Riyadh", currency: "SAR", marketType: "EQUITY", openTime: "10:00", closeTime: "15:00", mic: "XSAU", tradingDays: ["SUN", "MON", "TUE", "WED", "THU"], website: "https://www.saudiexchange.sa" },
  { code: "ADX", name: "Abu Dhabi Securities Exchange", country: "AE", region: "MIDDLE_EAST", timezone: "Asia/Dubai", currency: "AED", marketType: "EQUITY", openTime: "10:00", closeTime: "14:00", mic: "XADS", tradingDays: ["SUN", "MON", "TUE", "WED", "THU"] },
  { code: "DFM", name: "Dubai Financial Market", country: "AE", region: "MIDDLE_EAST", timezone: "Asia/Dubai", currency: "AED", marketType: "EQUITY", openTime: "10:00", closeTime: "14:00", mic: "XDFM", tradingDays: ["SUN", "MON", "TUE", "WED", "THU"] },
  { code: "QSE", name: "Qatar Stock Exchange", country: "QA", region: "MIDDLE_EAST", timezone: "Asia/Qatar", currency: "QAR", marketType: "EQUITY", mic: "DSMD", tradingDays: ["SUN", "MON", "TUE", "WED", "THU"] },
  { code: "KSE_KW", name: "Boursa Kuwait", country: "KW", region: "MIDDLE_EAST", timezone: "Asia/Kuwait", currency: "KWD", marketType: "EQUITY", mic: "XKUW", tradingDays: ["SUN", "MON", "TUE", "WED", "THU"] },
  { code: "MSM", name: "Muscat Securities Market", country: "OM", region: "MIDDLE_EAST", timezone: "Asia/Muscat", currency: "OMR", marketType: "EQUITY", tradingDays: ["SUN", "MON", "TUE", "WED", "THU"] },
  { code: "BSE_BH", name: "Bahrain Bourse", country: "BH", region: "MIDDLE_EAST", timezone: "Asia/Bahrain", currency: "BHD", marketType: "EQUITY", tradingDays: ["SUN", "MON", "TUE", "WED", "THU"] },
  { code: "TASE", name: "Tel Aviv Stock Exchange", country: "IL", region: "MIDDLE_EAST", timezone: "Asia/Jerusalem", currency: "ILS", marketType: "EQUITY", openTime: "09:59", closeTime: "17:15", mic: "XTAE", suffix: ".TA", tradingDays: ["SUN", "MON", "TUE", "WED", "THU"] },
  { code: "ASE_JO", name: "Amman Stock Exchange", country: "JO", region: "MIDDLE_EAST", timezone: "Asia/Amman", currency: "JOD", marketType: "EQUITY", tradingDays: ["SUN", "MON", "TUE", "WED", "THU"] },
  { code: "EGX", name: "Egyptian Exchange", country: "EG", region: "MIDDLE_EAST", timezone: "Africa/Cairo", currency: "EGP", marketType: "EQUITY", openTime: "10:00", closeTime: "14:30", mic: "XCAI", tradingDays: ["SUN", "MON", "TUE", "WED", "THU"] },
];

// ── AFRICA ──────────────────────────────────────────────────────────────────
export const AFRICA_EXCHANGES: ExchangeConfig[] = [
  { code: "JSE", name: "Johannesburg Stock Exchange", country: "ZA", region: "AFRICA", timezone: "Africa/Johannesburg", currency: "ZAR", marketType: "EQUITY", openTime: "09:00", closeTime: "17:00", mic: "XJSE", suffix: ".JO", website: "https://www.jse.co.za" },
  { code: "NSE_NG", name: "Nigerian Stock Exchange", country: "NG", region: "AFRICA", timezone: "Africa/Lagos", currency: "NGN", marketType: "EQUITY", openTime: "10:00", closeTime: "14:30", mic: "XNSA" },
  { code: "NSE_KE", name: "Nairobi Securities Exchange", country: "KE", region: "AFRICA", timezone: "Africa/Nairobi", currency: "KES", marketType: "EQUITY", mic: "XNAI" },
  { code: "CASA", name: "Casablanca Stock Exchange", country: "MA", region: "AFRICA", timezone: "Africa/Casablanca", currency: "MAD", marketType: "EQUITY", mic: "XCAS" },
  { code: "GSE", name: "Ghana Stock Exchange", country: "GH", region: "AFRICA", timezone: "Africa/Accra", currency: "GHS", marketType: "EQUITY" },
  { code: "DSE_TZ", name: "Dar es Salaam Stock Exchange", country: "TZ", region: "AFRICA", timezone: "Africa/Dar_es_Salaam", currency: "TZS", marketType: "EQUITY" },
  { code: "USE", name: "Uganda Securities Exchange", country: "UG", region: "AFRICA", timezone: "Africa/Kampala", currency: "UGX", marketType: "EQUITY" },
  { code: "BRVM", name: "BRVM (West Africa Regional)", country: "CI", region: "AFRICA", timezone: "Africa/Abidjan", currency: "XOF", marketType: "EQUITY" },
  { code: "ZSE", name: "Zimbabwe Stock Exchange", country: "ZW", region: "AFRICA", timezone: "Africa/Harare", currency: "ZWL", marketType: "EQUITY" },
  { code: "LuSE", name: "Lusaka Securities Exchange", country: "ZM", region: "AFRICA", timezone: "Africa/Lusaka", currency: "ZMW", marketType: "EQUITY" },
];

// ── AMERICAS (excl. US) ─────────────────────────────────────────────────────
export const AMERICAS_EXCHANGES: ExchangeConfig[] = [
  { code: "TSX", name: "Toronto Stock Exchange", country: "CA", region: "AMERICAS", timezone: "America/Toronto", currency: "CAD", marketType: "EQUITY", openTime: "09:30", closeTime: "16:00", mic: "XTSE", suffix: ".TO", website: "https://www.tsx.com" },
  { code: "TSXV", name: "TSX Venture Exchange", country: "CA", region: "AMERICAS", timezone: "America/Toronto", currency: "CAD", marketType: "EQUITY", openTime: "09:30", closeTime: "16:00", mic: "XTSX", suffix: ".V" },
  { code: "BMV", name: "Bolsa Mexicana de Valores", country: "MX", region: "AMERICAS", timezone: "America/Mexico_City", currency: "MXN", marketType: "EQUITY", openTime: "08:30", closeTime: "15:00", mic: "XMEX", suffix: ".MX" },
  { code: "B3", name: "B3 (Brasil Bolsa Balcão)", country: "BR", region: "AMERICAS", timezone: "America/Sao_Paulo", currency: "BRL", marketType: "EQUITY", openTime: "10:00", closeTime: "17:00", mic: "BVMF", suffix: ".SA", website: "https://www.b3.com.br" },
  { code: "BCBA", name: "Buenos Aires Stock Exchange", country: "AR", region: "AMERICAS", timezone: "America/Argentina/Buenos_Aires", currency: "ARS", marketType: "EQUITY", mic: "XBUE", suffix: ".BA" },
  { code: "BCS", name: "Santiago Stock Exchange", country: "CL", region: "AMERICAS", timezone: "America/Santiago", currency: "CLP", marketType: "EQUITY", mic: "XSGO", suffix: ".SN" },
  { code: "BVL", name: "Lima Stock Exchange", country: "PE", region: "AMERICAS", timezone: "America/Lima", currency: "PEN", marketType: "EQUITY", mic: "XLIM" },
  { code: "BVC", name: "Colombia Stock Exchange", country: "CO", region: "AMERICAS", timezone: "America/Bogota", currency: "COP", marketType: "EQUITY", mic: "XBOG" },
  { code: "BVRD", name: "Dominican Republic Stock Exchange", country: "DO", region: "AMERICAS", timezone: "America/Santo_Domingo", currency: "DOP", marketType: "EQUITY" },
  { code: "JSE_JM", name: "Jamaica Stock Exchange", country: "JM", region: "AMERICAS", timezone: "America/Jamaica", currency: "JMD", marketType: "EQUITY" },
];

// ── CRYPTO EXCHANGES ────────────────────────────────────────────────────────
export const CRYPTO_EXCHANGES: ExchangeConfig[] = [
  { code: "BINANCE", name: "Binance", country: "GLOBAL", region: "ASIA", timezone: "UTC", currency: "USDT", marketType: "CRYPTO", openTime: "00:00", closeTime: "23:59", tradingDays: ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"], website: "https://www.binance.com" },
  { code: "COINBASE", name: "Coinbase", country: "US", region: "AMERICAS", timezone: "UTC", currency: "USD", marketType: "CRYPTO", tradingDays: ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"], website: "https://www.coinbase.com" },
  { code: "KRAKEN", name: "Kraken", country: "US", region: "AMERICAS", timezone: "UTC", currency: "USD", marketType: "CRYPTO", tradingDays: ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"], website: "https://www.kraken.com" },
  { code: "WAZIRX", name: "WazirX", country: "IN", region: "ASIA", timezone: "Asia/Kolkata", currency: "INR", marketType: "CRYPTO", tradingDays: ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"], website: "https://wazirx.com" },
  { code: "COINDCX", name: "CoinDCX", country: "IN", region: "ASIA", timezone: "Asia/Kolkata", currency: "INR", marketType: "CRYPTO", tradingDays: ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"] },
  { code: "BYBIT", name: "Bybit", country: "GLOBAL", region: "ASIA", timezone: "UTC", currency: "USDT", marketType: "CRYPTO", tradingDays: ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"] },
  { code: "OKX", name: "OKX", country: "GLOBAL", region: "ASIA", timezone: "UTC", currency: "USDT", marketType: "CRYPTO", tradingDays: ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"] },
  { code: "KUCOIN", name: "KuCoin", country: "GLOBAL", region: "ASIA", timezone: "UTC", currency: "USDT", marketType: "CRYPTO", tradingDays: ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"] },
];

// ── FOREX MARKETS ───────────────────────────────────────────────────────────
export const FOREX_EXCHANGES: ExchangeConfig[] = [
  { code: "FOREX_LONDON", name: "London Forex (Interbank)", country: "GB", region: "EUROPE", timezone: "Europe/London", currency: "USD", marketType: "FOREX", openTime: "08:00", closeTime: "16:00" },
  { code: "FOREX_NY", name: "New York Forex", country: "US", region: "AMERICAS", timezone: "America/New_York", currency: "USD", marketType: "FOREX", openTime: "08:00", closeTime: "17:00" },
  { code: "FOREX_TOKYO", name: "Tokyo Forex", country: "JP", region: "ASIA", timezone: "Asia/Tokyo", currency: "JPY", marketType: "FOREX", openTime: "09:00", closeTime: "15:00" },
  { code: "FOREX_SYDNEY", name: "Sydney Forex", country: "AU", region: "OCEANIA", timezone: "Australia/Sydney", currency: "AUD", marketType: "FOREX", openTime: "07:00", closeTime: "17:00" },
];

// ── ALL EXCHANGES ───────────────────────────────────────────────────────────
export const ALL_EXCHANGES: ExchangeConfig[] = [
  ...INDIA_EXCHANGES,
  ...US_EXCHANGES,
  ...EUROPE_EXCHANGES,
  ...ASIA_EXCHANGES,
  ...OCEANIA_EXCHANGES,
  ...MIDDLE_EAST_EXCHANGES,
  ...AFRICA_EXCHANGES,
  ...AMERICAS_EXCHANGES,
  ...CRYPTO_EXCHANGES,
  ...FOREX_EXCHANGES,
];

/** Get exchanges by region */
export function getExchangesByRegion(region: string): ExchangeConfig[] {
  return ALL_EXCHANGES.filter((e) => e.region === region);
}

/** Get exchanges by market type */
export function getExchangesByType(type: string): ExchangeConfig[] {
  return ALL_EXCHANGES.filter((e) => e.marketType === type);
}

/** Get exchanges by country */
export function getExchangesByCountry(country: string): ExchangeConfig[] {
  return ALL_EXCHANGES.filter((e) => e.country === country);
}

/** Check if exchange is currently open */
export function isExchangeOpen(exchange: ExchangeConfig): boolean {
  if (!exchange.openTime || !exchange.closeTime) return false;
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-US", { timeZone: exchange.timezone, hour: "2-digit", minute: "2-digit", hour12: false });
  const localTime = formatter.format(now);
  const dayFormatter = new Intl.DateTimeFormat("en-US", { timeZone: exchange.timezone, weekday: "short" });
  const localDay = dayFormatter.format(now).toUpperCase();
  const days = exchange.tradingDays || ["MON", "TUE", "WED", "THU", "FRI"];
  if (!days.includes(localDay)) return false;
  return localTime >= exchange.openTime && localTime <= exchange.closeTime;
}
