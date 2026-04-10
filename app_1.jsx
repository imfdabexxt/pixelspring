const { useState, useEffect, useRef, useMemo, useCallback } = React;
const Recharts = window.Recharts || window.recharts;
const ChartFallback = ({ children, style }) => React.createElement("div", { style: style || {} }, children || null);
const ChartNull = () => null;
const {
  PieChart = ChartFallback,
  Pie = ChartFallback,
  Cell = ChartNull,
  BarChart = ChartFallback,
  Bar = ChartNull,
  XAxis = ChartNull,
  YAxis = ChartNull,
  Tooltip = ChartNull,
  ResponsiveContainer = ChartFallback,
  LineChart = ChartFallback,
  Line = ChartNull,
  CartesianGrid = ChartNull,
  Legend = ChartNull,
  AreaChart = ChartFallback,
  Area = ChartNull
} = Recharts || {};

// ─── Utility helpers ───
const uid = () => Math.random().toString(36).slice(2, 10);
const today = () => new Date().toISOString().split("T")[0];
const nowTime = () => {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
};
const toTimestamp = (dateStr, timeStr) => {
  try {
    if (!dateStr) return Date.now();
    const time = timeStr || "00:00";
    const dt = new Date(`${dateStr}T${time}:00`);
    if (isNaN(dt.getTime())) return Date.now();
    return dt.getTime();
  } catch (_e) {
    return Date.now();
  }
};
const fmt = (n) => Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
const moneyFormat = (currency = "RWF") => {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      currencyDisplay: "symbol",
      maximumFractionDigits: 2,
    });
  } catch (_e) {
    return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });
  }
};
const fmtCur = (n, currency) => {
  try {
    const c = (currency ?? (typeof window !== "undefined" && window.__zt_currency) ?? "RWF");
    const rate = (typeof window !== "undefined" && typeof window.__zt_fxRate === "number") ? window.__zt_fxRate : 1;
    const nf = moneyFormat(c);
    return nf.format(Number(n || 0) * rate);
  } catch (_e) {
    return String(n ?? 0);
  }
};
// Convert a display-currency amount back into base currency.
// Base currency is the internal storage/calc currency for products/transactions.
const toBaseMoney = (amount) => {
  const n = Number(amount || 0);
  if (!Number.isFinite(n)) return 0;
  try {
    const rate = (typeof window !== "undefined" && typeof window.__zt_fxRate === "number") ? window.__zt_fxRate : 1;
    const r = Number(rate || 1);
    if (!Number.isFinite(r) || r <= 0) return n;
    return n / r;
  } catch (_e) {
    return n;
  }
};
// Auto-scale font size for money inputs — shrinks as value grows longer
const moneyFontSize = (val) => {
  const len = String(val || "").replace(/[.\-,]/g, "").length;
  if (len <= 6)  return 18;
  if (len <= 9)  return 15;
  if (len <= 12) return 12;
  return 10;
};
// Scale displayed (non-input) money values — shrinks as digits increase
const dispFontSize = (val) => {
  const len = String(Math.round(Math.abs(Number(val) || 0))).length;
  if (len <= 5)  return 22;
  if (len <= 8)  return 17;
  if (len <= 11) return 13;
  return 11;
};
// Ensure default currency is RWF even before React runs.
if (typeof window !== "undefined") {
  window.__zt_currency = "RWF";
  if (typeof window.__zt_fxRate !== "number") window.__zt_fxRate = 1;
}
const daysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 864e5);
const parseDate = (d) => new Date(d + "T00:00:00");
const isToday = (d) => d === today();
const isThisWeek = (d) => daysBetween(d, today()) <= 7 && daysBetween(d, today()) >= 0;
const isThisMonth = (d) => { const t = new Date(); const dd = parseDate(d); return dd.getMonth() === t.getMonth() && dd.getFullYear() === t.getFullYear(); };
const isThisYear = (d) => parseDate(d).getFullYear() === new Date().getFullYear();

const UNIT_DEFS = {
  kg: { type: "mass", factor: 1000 },
  hg: { type: "mass", factor: 100 },
  dag: { type: "mass", factor: 10 },
  g: { type: "mass", factor: 1 },
  dg: { type: "mass", factor: 0.1 },
  cg: { type: "mass", factor: 0.01 },
  mg: { type: "mass", factor: 0.001 },
  l: { type: "volume", factor: 1000 },
  dl: { type: "volume", factor: 100 },
  cl: { type: "volume", factor: 10 },
  ml: { type: "volume", factor: 1 },
  piece: { type: "count", factor: 1 },
  dozen: { type: "count", factor: 12 },
  bag: { type: "count", factor: 1 },
  box: { type: "count", factor: 1 },
  bottle: { type: "count", factor: 1 },
  packet: { type: "count", factor: 1 },
};
const UNITS = Object.keys(UNIT_DEFS);
const UNIT_FULL_NAMES = {
  kg: "kilogram",
  hg: "hectogram",
  dag: "decagram",
  g: "gram",
  dg: "decigram",
  cg: "centigram",
  mg: "milligram",
  l: "liter",
  dl: "deciliter",
  cl: "centiliter",
  ml: "milliliter",
  piece: "piece",
  dozen: "dozen",
  bag: "bag",
  box: "box",
  bottle: "bottle",
  packet: "packet",
};
const UNIT_ALIASES = {
  // Mass full forms
  kilogram: "kg", kilograms: "kg",
  hectogram: "hg", hectograms: "hg",
  decagram: "dag", decagrams: "dag",
  gram: "g", grams: "g",
  decigram: "dg", decigrams: "dg",
  centigram: "cg", centigrams: "cg",
  milligram: "mg", milligrams: "mg",

  // Volume full forms
  liter: "l", liters: "l", litre: "l", litres: "l",
  deciliter: "dl", deciliters: "dl",
  centiliter: "cl", centiliters: "cl",
  milliliter: "ml", milliliters: "ml",

  // Count forms
  piece: "piece", pieces: "piece", pcs: "piece",
  dozen: "dozen", dozens: "dozen",
  bag: "bag", bags: "bag",
  box: "box", boxes: "box",
  bottle: "bottle", bottles: "bottle",
  packet: "packet", packets: "packet",

  // Keep existing aliases
  liters: "l",
};
const normalizeUnit = (u = "") => {
  const unit = String(u).trim().toLowerCase().replace(/[^a-z]/g, "");
  return UNIT_ALIASES[unit] || unit;
};
const unitFull = (u) => UNIT_FULL_NAMES[normalizeUnit(u)] || normalizeUnit(u);
const LANGS = {
  en: "English",
  sw: "Kiswahili",
  rw: "Kinyarwanda",
  fr: "Français",
  zh: "中文",
};
const LOCALE_BY_LANG = { en: "en", sw: "sw", rw: "rw", fr: "fr", zh: "zh-CN" };
const localeForLang = (lang) => LOCALE_BY_LANG[lang] || "en";
const I18N = {
  en: {
    "common.language": "Language",
    "common.logout": "Log Out",
    "common.save": "Save",
    "common.saving": "Saving...",
    "common.saved": "Saved",
    "common.saveFailed": "Save failed",
    "common.saveTitle": "Save data to this device",
    "common.loading": "Loading...",
    "common.noDataDash.title": "Welcome to ZuriTrack!",
    "common.noDataDash.body1": "Your inventory is empty. Head to",
    "common.noDataDash.body2": "in the sidebar to add your first products.",
    "common.noDataDash.body3": "Products are created automatically — just type a name, enter quantity and cost, and you're done.",
    "common.orders": "orders",
    "common.entries": "entries",
    "common.unitsTotal": "units total",
    "common.margin": "margin",
    "common.totalInStock": "Total in stock",
    "common.noStockYet": "No stock yet. Add products to populate this chart.",
    "common.totalValue": "Total Value",
    "nav.dashboard": "Dashboard",
    "nav.uptime": "Uptime",
    "nav.stockIn": "Add Stock",
    "nav.stockOut": "Sell Product",
    "nav.inventory": "Inventory",
    "nav.reports": "Reports",
    "period.today": "Today",
    "period.weekly": "Weekly",
    "period.monthly": "Monthly",
    "period.yearly": "Yearly",
    "dashboard.salesPurchases": "Sales & Purchases",
    "dashboard.stockDistribution": "Stock Distribution",
    "dashboard.totalSales": "Total Sales",
    "dashboard.totalPurchases": "Total Purchases",
    "dashboard.netProfit": "Net Profit",
    "dashboard.itemsSold": "Items Sold",
    "dashboard.topSellingProducts": "Top Selling Products",
    "dashboard.lowStockAlerts": "Low Stock Alerts",
    "dashboard.recentTransactions": "Recent Transactions",
    "common.searchProducts": "Search products...",
    "common.sort.name": "Sort by Name",
    "common.sort.stock": "Sort by Stock",
    "common.sort.value": "Sort by Value",
    "reports.filters.from": "From",
    "reports.filters.to": "To",
    "reports.filters.product": "Product",
    "reports.filters.type": "Type",
    "reports.filters.allProducts": "All products",
    "reports.type.all": "All",
    "reports.type.in": "Stock In",
    "reports.type.out": "Sales",
    "reports.summary.itemsIn": "Items In",
    "reports.summary.itemsOut": "Items Out",
    "reports.summary.totalCost": "Total Cost",
    "reports.summary.revenue": "Revenue",
    "reports.summary.profit": "Profit",
    "reports.transactions": "Transactions",
    "reports.table.product": "Product",
    "reports.table.type": "Type",
    "reports.table.qty": "Qty",
    "reports.table.costUnit": "Cost/unit",
    "reports.table.saleUnit": "Sale/unit",
    "reports.table.total": "Total",
    "reports.table.profit": "Profit",
    "reports.table.date": "Date",
    "reports.table.time": "Time",
    "reports.badge.in": "IN",
    "reports.badge.sale": "SALE",
    "reports.importError": "Could not import file. Use a valid JSON backup.",
    "reports.invalidBackupFile": "Invalid backup file",
    "reports.importedData": "Imported {products} products and {transactions} transactions",
    "common.exportCSV": "Export CSV",
    "common.exportBackup": "Export Full Backup",
    "common.importBackup": "Import Backup",
    "common.undoDelete": "Undo Delete",
    "common.remove": "Remove",
    "stockIn.singleItem": "Single Item",
    "stockIn.multiItem": "Multi Item",
    "stockIn.productName": "Product Name",
    "stockIn.startTypingProduct": "Start typing product name...",
    "stockIn.quantity": "Quantity",
    "stockIn.unit": "Unit",
    "stockIn.enterMultiple": "Enter multiple items (e.g.,",
    "stockIn.multiPlaceholder": "Potato 10kg RWF 300, Maize 30kg RWF 300",
    "stockIn.defaultCost": "Default Cost (RWF/unit) (optional)",
    "stockIn.defaultSale": "Default Sale (RWF/unit) (optional)",
    "stockIn.preview": "Preview",
    "stockIn.addAllItems": "Add All Items",
    "stockIn.quickTemplates": "Quick Templates",
    "stockIn.timestampAuto": "Date and time are added automatically",
    "stockIn.addStock": "Add Stock",
    "stockIn.parseError": "Could not parse input. Use format: Potato 10kg RWF 300, Maize 30kg RWF 300",
    "stockIn.addedItems": "Added {count} items to stock",
    "stockIn.costFromPriceTag": "Cost from price tag",
    "stockIn.enterDate": "Date",
    "stockIn.enterTime": "Time",
    "stockIn.costPrompt": "How do you want to enter cost?",
    "stockIn.costMode.total": "I paid total amount",
    "stockIn.costMode.perUnit": "I know price per {unit}",
    "stockIn.totalPaid": "Total Amount Paid (RWF)",
    "stockIn.totalPaidPlaceholder": "e.g. 1200 for the whole batch",
    "stockIn.pricePerUnit": "Price per {unit} (RWF)",
    "stockIn.pricePerUnitPlaceholder": "e.g. 1.50 per {unit}",
    "stockIn.salePriceOptional": "Sale price per {unit} (RWF/unit) (optional)",
    "stockIn.salePriceOptionalPlaceholder": "e.g. 2.99 per {unit} (optional)",
    "stockIn.autoBreakdown": "Auto-Calculated Breakdown",
    "stockIn.costPer": "Cost per {unit}",
    "stockIn.totalCost": "Total Cost",
    "stockOut.startTyping": "Start typing to find product...",
    "stockOut.inStock": "In Stock",
    "stockOut.costPrice": "Cost Price",
    "stockOut.lastSalePrice": "Last Sale Price",
    "stockOut.howEnterSalePrice": "How do you want to enter the sale price?",
    "stockOut.pricePer": "Price per {unit}",
    "stockOut.totalReceived": "Total received",
    "stockOut.salePricePer": "Sale price per {unit} (RWF)",
    "stockOut.totalAmountReceived": "Total amount received (RWF)",
    "stockOut.completeSale": "Complete Sale",
    "stockOut.quickSell": "Quick Sell — Frequent Products",
    "stockOut.noProducts": "No products to sell",
    "stockOut.addStockFirst": "Add products through {addStock} first, then come back here to sell.",
    "common.inventoryManager": "Inventory Manager",
    "common.myShop": "My Shop",
    "common.admin": "admin",
    "stockIn.error.nameQty": "Please enter product name and quantity",
    "stockIn.error.validCost": "Please enter a valid cost",
    "stockIn.error.unitNotCompatible": "Unit \"{unit}\" is not compatible with \"{productUnit}\"",
    "stockIn.success.added": "Added {qty} {unit} of {name} ({stockQty} {productUnit} in stock)",
    "stockOut.error.selectProduct": "Please select a product",
    "stockOut.error.enterQuantity": "Please enter quantity",
    "stockOut.error.validSalePrice": "Please enter a valid sale price",
    "stockOut.error.unitNotCompatible": "Selected unit is not compatible with product unit",
    "stockOut.error.notEnoughStock": "Not enough stock!",
    "stockOut.sellingBelow": "Selling below cost — you are losing {amount} on this sale",
    "stockOut.lowStock": "Only {stock} {unit} in stock — not enough",
    "stockOut.totalSale": "Total Sale",
    "stockOut.profit": "Profit",
    "stockOut.salePricePerColon": "Sale price per {unit}:",
    "stockOut.totalReceived2": "total received",
    "stockOut.success.sold": "Sold {qty} {unit} of {name}. Remaining: {remaining} {productUnit}",
    "inventory.error.invalidCostPrice": "Invalid cost price",
    "inventory.error.invalidSalePrice": "Invalid sale price",
    "inventory.success.updatedPrices": "Updated prices for {name}: Cost {cost}/{unit}, Sale {sale}/{unit}",
    "common.productRemovedUndo": "\"{name}\" removed. You can undo.",
    "common.productRestored": "Restored \"{name}\"",
    "common.level.low": "Low",
    "common.level.medium": "Medium",
    "common.level.good": "Good",
    "inventory.price": "Price",
    "inventory.base": "base",
    "dashboard.allWellStocked": "All products are well-stocked!",
    "unit.piece": "piece",
    "unit.kg": "kg",
    "unit.g": "g",
    "unit.l": "l",
    "unit.ml": "ml",
    "unit.mg": "mg",
    "unit.ton": "ton",
    "unit.dozen": "dozen",
    "unitFull.kg": "kilogram",
    "unitFull.g": "gram",
    "unitFull.mg": "milligram",
    "unitFull.l": "liter",
    "unitFull.ml": "milliliter",
    "unitFull.piece": "piece",
    "unitFull.dozen": "dozen",
    "unitFull.ton": "ton",
  },
  sw: {
    "common.language": "Lugha",
    "common.logout": "Toka",
    "common.save": "Hifadhi",
    "common.saving": "Inahifadhi...",
    "common.saved": "Imehifadhiwa",
    "common.saveFailed": "Imeshindikana kuhifadhi",
    "common.saveTitle": "Hifadhi data kwenye kifaa hiki",
    "common.loading": "Inapakia...",
    "common.noDataDash.title": "Karibu ZuriTrack!",
    "common.noDataDash.body1": "Huna bidhaa kwenye orodha. Nenda",
    "common.noDataDash.body2": "kwenye upande wa kushoto kuongeza bidhaa zako za kwanza.",
    "common.noDataDash.body3": "Bidhaa huundwa kiotomatiki — andika jina, weka kiasi na gharama, na umemaliza.",
    "common.orders": "oda",
    "common.entries": "maingizo",
    "common.unitsTotal": "jumla ya vipimo",
    "common.margin": "faida",
    "common.totalInStock": "Jumla kwenye stock",
    "common.noStockYet": "Hakuna stock bado. Ongeza bidhaa ili chati ijazwe.",
    "common.totalValue": "Thamani Jumla",
    "nav.dashboard": "Dashibodi",
    "nav.stockIn": "Ongeza Hisa",
    "nav.stockOut": "Uza Bidhaa",
    "nav.inventory": "Hesabu",
    "nav.reports": "Ripoti",
    "period.today": "Leo",
    "period.weekly": "Kila wiki",
    "period.monthly": "Kila mwezi",
    "period.yearly": "Kila mwaka",
    "dashboard.salesPurchases": "Mauzo na Manunuzi",
    "dashboard.stockDistribution": "Gawanyo la Hisa",
    "dashboard.totalSales": "Jumla ya Mauzo",
    "dashboard.totalPurchases": "Jumla ya Manunuzi",
    "dashboard.netProfit": "Faida Halisi",
    "dashboard.itemsSold": "Bidhaa Zilizouzwa",
    "dashboard.topSellingProducts": "Bidhaa Zinazouzwa Zaidi",
    "dashboard.lowStockAlerts": "Tahadhari za Hisa Ndogo",
    "dashboard.recentTransactions": "Miamala ya Hivi Karibuni",
    "common.searchProducts": "Tafuta bidhaa...",
    "common.sort.name": "Panga kwa Jina",
    "common.sort.stock": "Panga kwa Hisa",
    "common.sort.value": "Panga kwa Thamani",
    "reports.filters.from": "Kuanzia",
    "reports.filters.to": "Hadi",
    "reports.filters.product": "Bidhaa",
    "reports.filters.type": "Aina",
    "reports.filters.allProducts": "Bidhaa zote",
    "reports.type.all": "Zote",
    "reports.type.in": "Stock In",
    "reports.type.out": "Mauzo",
    "reports.summary.itemsIn": "Vilivyoingizwa",
    "reports.summary.itemsOut": "Vilivyotoka",
    "reports.summary.totalCost": "Gharama Jumla",
    "reports.summary.revenue": "Mapato",
    "reports.summary.profit": "Faida",
    "reports.transactions": "Miamala",
    "reports.table.product": "Bidhaa",
    "reports.table.type": "Aina",
    "reports.table.qty": "Kiasi",
    "reports.table.costUnit": "Gharama/kipimo",
    "reports.table.saleUnit": "Bei/kipimo",
    "reports.table.total": "Jumla",
    "reports.table.profit": "Faida",
    "reports.table.date": "Tarehe",
    "reports.table.time": "Muda",
    "reports.badge.in": "INGIZA",
    "reports.badge.sale": "MAUZO",
    "reports.importError": "Imeshindikana kuingiza faili. Tumia nakala ya JSON sahihi.",
    "reports.invalidBackupFile": "Faili ya nakala si sahihi",
    "reports.importedData": "Imeingiza bidhaa {products} na miamala {transactions}",
    "common.exportCSV": "Hamisha CSV",
    "common.exportBackup": "Hamisha Nakala Kamili",
    "common.importBackup": "Ingiza Nakala",
    "common.undoDelete": "Tendua Kufuta",
    "common.remove": "Ondoa",
    "stockIn.singleItem": "Kitu kimoja",
    "stockIn.multiItem": "Bidhaa nyingi",
    "stockIn.productName": "Jina la Bidhaa",
    "stockIn.startTypingProduct": "Anza kuandika jina la bidhaa...",
    "stockIn.quantity": "Kiasi",
    "stockIn.unit": "Kitengo",
    "stockIn.enterMultiple": "Ingiza bidhaa nyingi (mfano,",
    "stockIn.multiPlaceholder": "Viazi 10kg RWF 300, Mahindi 30kg RWF 300",
    "stockIn.defaultCost": "Gharama chaguomsingi (RWF/kitengo) (hiari)",
    "stockIn.defaultSale": "Bei ya kuuza chaguomsingi (RWF/kitengo) (hiari)",
    "stockIn.preview": "Hakikisho",
    "stockIn.addAllItems": "Ongeza Bidhaa Zote",
    "stockIn.quickTemplates": "Mifano ya Haraka",
    "stockIn.timestampAuto": "Tarehe na muda vinaongezwa moja kwa moja",
    "stockIn.addStock": "Ongeza Hisa",
    "stockIn.parseError": "Imeshindikana kusoma maandishi. Tumia muundo: Viazi 10kg RWF 300, Mahindi 30kg RWF 300",
    "stockIn.addedItems": "Bidhaa {count} zimeongezwa kwenye hisa",
    "stockIn.costFromPriceTag": "Gharama kutoka bei iliyoandikwa",
    "stockIn.enterDate": "Tarehe",
    "stockIn.enterTime": "Muda",
    "stockIn.costPrompt": "Unataka kuingiza gharama vipi?",
    "stockIn.costMode.total": "Nimelipa jumla ya kiasi",
    "stockIn.costMode.perUnit": "Najua bei kwa {unit}",
    "stockIn.totalPaid": "Jumla Iliyolipwa (RWF)",
    "stockIn.totalPaidPlaceholder": "mf. 1200 kwa mzigo wote",
    "stockIn.pricePerUnit": "Bei kwa {unit} (RWF)",
    "stockIn.pricePerUnitPlaceholder": "mf. 1.50 kwa {unit}",
    "stockIn.salePriceOptional": "Bei ya kuuza kwa {unit} (RWF/kitengo) (hiari)",
    "stockIn.salePriceOptionalPlaceholder": "mf. 2.99 kwa {unit} (hiari)",
    "stockIn.autoBreakdown": "Muhtasari wa Hesabu Kiotomatiki",
    "stockIn.costPer": "Gharama kwa {unit}",
    "stockIn.totalCost": "Gharama Jumla",
    "stockOut.startTyping": "Anza kuandika kutafuta bidhaa...",
    "stockOut.inStock": "Hisa Iliyopo",
    "stockOut.costPrice": "Bei ya Gharama",
    "stockOut.lastSalePrice": "Bei ya Mwisho ya Uuzaji",
    "stockOut.howEnterSalePrice": "Unataka kuingiza bei ya uuzaji vipi?",
    "stockOut.pricePer": "Bei kwa {unit}",
    "stockOut.totalReceived": "Jumla iliyopokelewa",
    "stockOut.salePricePer": "Bei ya kuuza kwa {unit} (RWF)",
    "stockOut.totalAmountReceived": "Jumla ya fedha iliyopokelewa (RWF)",
    "stockOut.completeSale": "Kamilisha Uuzaji",
    "stockOut.quickSell": "Uuzaji wa Haraka — Bidhaa za Mara kwa Mara",
    "stockOut.noProducts": "Hakuna bidhaa ya kuuza",
    "stockOut.addStockFirst": "Ongeza bidhaa kupitia {addStock} kwanza, kisha urudi hapa kuuza.",
    "common.inventoryManager": "Msimamizi wa Hisa",
    "common.myShop": "Duka Langu",
    "common.admin": "msimamizi",
    "stockIn.error.nameQty": "Tafadhali weka jina la bidhaa na kiasi",
    "stockIn.error.validCost": "Tafadhali weka gharama halali",
    "stockIn.error.unitNotCompatible": "Kipimo \"{unit}\" hakiendani na \"{productUnit}\"",
    "stockIn.success.added": "Imeongezwa {qty} {unit} ya {name} ({stockQty} {productUnit} kwenye hisa)",
    "stockOut.error.selectProduct": "Tafadhali chagua bidhaa",
    "stockOut.error.enterQuantity": "Tafadhali weka kiasi",
    "stockOut.error.validSalePrice": "Tafadhali weka bei halali ya kuuza",
    "stockOut.error.unitNotCompatible": "Kipimo ulichochagua hakiendani na kipimo cha bidhaa",
    "stockOut.error.notEnoughStock": "Hisa haitoshi!",
    "stockOut.sellingBelow": "Unauza chini ya gharama — unapoteza {amount} kwenye uuzaji huu",
    "stockOut.lowStock": "Ni {stock} {unit} tu zilizobaki — haitoshi",
    "stockOut.totalSale": "Jumla ya Uuzaji",
    "stockOut.profit": "Faida",
    "stockOut.salePricePerColon": "Bei ya kuuza kwa {unit}:",
    "stockOut.totalReceived2": "jumla iliyopokelewa",
    "stockOut.success.sold": "Umeuza {qty} {unit} ya {name}. Iliyobaki: {remaining} {productUnit}",
    "inventory.error.invalidCostPrice": "Bei ya gharama si sahihi",
    "inventory.error.invalidSalePrice": "Bei ya kuuza si sahihi",
    "inventory.success.updatedPrices": "Bei zimesasishwa kwa {name}: Gharama {cost}/{unit}, Uuzaji {sale}/{unit}",
    "common.productRemovedUndo": "\"{name}\" imeondolewa. Unaweza kutengua.",
    "common.productRestored": "Imerejeshwa \"{name}\"",
    "common.level.low": "Hisa Ndogo",
    "common.level.medium": "Wastani",
    "common.level.good": "Nzuri",
    "inventory.price": "Bei",
    "inventory.base": "msingi",
    "dashboard.allWellStocked": "Bidhaa zote zina hisa ya kutosha!",
    "unit.piece": "kipande",
    "unit.kg": "kg",
    "unit.g": "g",
    "unit.l": "lita",
    "unit.ml": "ml",
    "unit.mg": "mg",
    "unit.ton": "tani",
    "unit.dozen": "dazeni",
    "unitFull.kg": "kilogramu",
    "unitFull.g": "gramu",
    "unitFull.mg": "miligramu",
    "unitFull.l": "lita",
    "unitFull.ml": "mililita",
    "unitFull.piece": "kipande",
    "unitFull.dozen": "dazeni",
    "unitFull.ton": "tani",
  },
  rw: {
    "common.language": "Ururimi",
    "common.logout": "Sohoka",
    "common.save": "Bika",
    "common.saving": "Birabika...",
    "common.saved": "Byabitswe",
    "common.saveFailed": "Kubika byanze",
    "common.saveTitle": "Bika amakuru kuri iki gikoresho",
    "common.loading": "Birimo gutangizwa...",
    "common.noDataDash.title": "Murakaza neza kuri ZuriTrack!",
    "common.noDataDash.body1": "Ububiko bwawe burimo ubusa. Jya kuri",
    "common.noDataDash.body2": "ku ruhande wongere ibicuruzwa bya mbere.",
    "common.noDataDash.body3": "Ibicuruzwa bihanwa bihita — andika izina, andika ingano n'igiciro, urarangiza.",
    "common.orders": "amategeko",
    "common.entries": "inyandiko",
    "common.unitsTotal": "ingano zose",
    "common.margin": "inyungu",
    "common.totalInStock": "Igiteranyo mu bubiko",
    "common.noStockYet": "Nta bubiko buriho. Ongeramo ibicuruzwa kugira ngo igishushanyo kigaragare.",
    "common.totalValue": "Agaciro kose",
    "nav.dashboard": "Ikibaho",
    "nav.stockIn": "Ongeramo Stock",
    "nav.stockOut": "Kugurisha",
    "nav.inventory": "Ububiko",
    "nav.reports": "Raporo",
    "period.today": "Uyu munsi",
    "period.weekly": "Icyumweru",
    "period.monthly": "Ukwezi",
    "period.yearly": "Umwaka",
    "dashboard.salesPurchases": "Kugurisha no Kugura",
    "dashboard.stockDistribution": "Ibwiciro by'Ububiko",
    "dashboard.totalSales": "Igurishwa Ryose",
    "dashboard.totalPurchases": "Ibitugu byose (Kugura)",
    "dashboard.netProfit": "Aho inyungu ihagaze",
    "dashboard.itemsSold": "Ibicuruzwa byagurishijwe",
    "dashboard.topSellingProducts": "Ibicuruzwa Byagurishijwe Cyane",
    "dashboard.lowStockAlerts": "Iburira ry'Ububiko Buke",
    "dashboard.recentTransactions": "Ibyakozwe Vuba",
    "common.searchProducts": "Shakisha ibicuruzwa...",
    "common.sort.name": "Rondora ku izina",
    "common.sort.stock": "Rondora ku stock",
    "common.sort.value": "Rondora ku gaciro",
    "reports.filters.from": "Bivuye",
    "reports.filters.to": "Kugeza",
    "reports.filters.product": "Ibicuruzwa",
    "reports.filters.type": "Ubwoko",
    "reports.filters.allProducts": "Ibicuruzwa byose",
    "reports.type.all": "Byose",
    "reports.type.in": "Byinjijwe",
    "reports.type.out": "Byagurishijwe",
    "reports.summary.itemsIn": "Ibyinjijwe",
    "reports.summary.itemsOut": "Ibyasohotse",
    "reports.summary.totalCost": "Ikiguzi cyose",
    "reports.summary.revenue": "Amafaranga yinjiye",
    "reports.summary.profit": "Inyungu",
    "reports.transactions": "Ibyakozwe",
    "reports.table.product": "Igicuruzwa",
    "reports.table.type": "Ubwoko",
    "reports.table.qty": "Ingano",
    "reports.table.costUnit": "Ikiguzi/igipimo",
    "reports.table.saleUnit": "Igurishwa/igipimo",
    "reports.table.total": "Igiteranyo",
    "reports.table.profit": "Inyungu",
    "reports.table.date": "Itariki",
    "reports.table.time": "Igihe",
    "reports.badge.in": "IN",
    "reports.badge.sale": "SALE",
    "reports.importError": "Ntibishoboye kwinjiza dosiye. Koresha backup ya JSON yemewe.",
    "reports.invalidBackupFile": "Backup file siyo",
    "reports.importedData": "Yinjijwe ibicuruzwa {products} n'ibyakozwe {transactions}",
    "common.exportCSV": "Ohereza CSV",
    "common.exportBackup": "Ohereza Backup Nto",
    "common.importBackup": "Shyiramo Backup",
    "common.undoDelete": "Tweza Gusiba",
    "common.remove": "Siba",
    "stockIn.singleItem": "Ikintu kimwe",
    "stockIn.multiItem": "Ibintu byinshi",
    "stockIn.productName": "Izina ry'Igicuruzwa",
    "stockIn.startTypingProduct": "Tangira wandike izina ry'igicuruzwa...",
    "stockIn.quantity": "Ingano",
    "stockIn.unit": "Igipimo",
    "stockIn.enterMultiple": "Andika ibicuruzwa byinshi (urugero,",
    "stockIn.multiPlaceholder": "Ibirayi 10kg RWF 300, Ibigori 30kg RWF 300",
    "stockIn.defaultCost": "Igiciro fatizo (RWF/igipimo) (si ngombwa)",
    "stockIn.defaultSale": "Igiciro cyo kugurisha fatizo (RWF/igipimo) (si ngombwa)",
    "stockIn.preview": "Ibanze kureba",
    "stockIn.addAllItems": "Ongeramo Ibintu Byose",
    "stockIn.quickTemplates": "Ingero Zihuse",
    "stockIn.timestampAuto": "Itariki n'igihe byongerwaho ako kanya",
    "stockIn.addStock": "Ongeramo Stock",
    "stockIn.parseError": "Ntibyasomye neza inyandiko. Koresha: Ibirayi 10kg RWF 300, Ibigori 30kg RWF 300",
    "stockIn.addedItems": "Ibintu {count} byongewe muri stock",
    "stockIn.costFromPriceTag": "Ikiguzi gikuwe ku giciro",
    "stockIn.enterDate": "Itariki",
    "stockIn.enterTime": "Igihe",
    "stockIn.costPrompt": "Ushaka kwinjiza ikiguzi ute?",
    "stockIn.costMode.total": "Nishyuye amafaranga yose",
    "stockIn.costMode.perUnit": "Nzi igiciro kuri {unit}",
    "stockIn.totalPaid": "Amafaranga Yose Yishyuwe (RWF)",
    "stockIn.totalPaidPlaceholder": "urug. 1200 ku bipimo byose",
    "stockIn.pricePerUnit": "Igiciro kuri {unit} (RWF)",
    "stockIn.pricePerUnitPlaceholder": "urug. 1.50 kuri {unit}",
    "stockIn.salePriceOptional": "Igiciro cyo kugurisha kuri {unit} (RWF/igipimo) (si ngombwa)",
    "stockIn.salePriceOptionalPlaceholder": "urug. 2.99 kuri {unit} (si ngombwa)",
    "stockIn.autoBreakdown": "Ibisobanuro by'ibaruramari (byikora)",
    "stockIn.costPer": "Ikiguzi kuri {unit}",
    "stockIn.totalCost": "Ikiguzi cyose",
    "stockOut.startTyping": "Tangira wandike ushaka igicuruzwa...",
    "stockOut.inStock": "Muri Stock",
    "stockOut.costPrice": "Igiciro cy'ikiguzi",
    "stockOut.lastSalePrice": "Igiciro cya nyuma cyagurishijweho",
    "stockOut.howEnterSalePrice": "Ushaka kwinjiza igiciro cyo kugurisha ute?",
    "stockOut.pricePer": "Igiciro kuri {unit}",
    "stockOut.totalReceived": "Amafaranga yose yakiriwe",
    "stockOut.salePricePer": "Igiciro cyo kugurisha kuri {unit} (RWF)",
    "stockOut.totalAmountReceived": "Amafaranga yose yakiriwe (RWF)",
    "stockOut.completeSale": "Rangiza Igurisha",
    "stockOut.quickSell": "Igurisha Ryihuse — Ibicuruzwa Bikunze",
    "stockOut.noProducts": "Nta bicuruzwa byo kugurisha",
    "stockOut.addStockFirst": "Banza wongere ibicuruzwa ukoresheje {addStock}, hanyuma ugaruke hano kugurisha.",
    "common.inventoryManager": "Umuyobozi w'Ububiko",
    "common.myShop": "Iduka Ryanjye",
    "common.admin": "admin",
    "stockIn.error.nameQty": "Andika izina ry'igicuruzwa n'ingano",
    "stockIn.error.validCost": "Andika ikiguzi gifite agaciro",
    "stockIn.error.unitNotCompatible": "Igipimo \"{unit}\" ntigihuye na \"{productUnit}\"",
    "stockIn.success.added": "Hongewe {qty} {unit} bya {name} ({stockQty} {productUnit} biri muri stock)",
    "stockOut.error.selectProduct": "Hitamo igicuruzwa",
    "stockOut.error.enterQuantity": "Andika ingano",
    "stockOut.error.validSalePrice": "Andika igiciro cyo kugurisha gifite agaciro",
    "stockOut.error.unitNotCompatible": "Igipimo wahisemo ntigihuye n'igipimo cy'igicuruzwa",
    "stockOut.error.notEnoughStock": "Stock ntihagije!",
    "stockOut.sellingBelow": "Ugurisha hasi y'ikiguzi — uratakaza {amount} kuri iki gurisha",
    "stockOut.lowStock": "Hari {stock} {unit} gusa muri stock — ntihagije",
    "stockOut.totalSale": "Amafaranga Yose y'Igurisha",
    "stockOut.profit": "Inyungu",
    "stockOut.salePricePerColon": "Igiciro cyo kugurisha kuri {unit}:",
    "stockOut.totalReceived2": "amafaranga yose yakiriwe",
    "stockOut.success.sold": "Wagurishije {qty} {unit} bya {name}. Hasigaye: {remaining} {productUnit}",
    "inventory.error.invalidCostPrice": "Igiciro cy'ikiguzi si cyo",
    "inventory.error.invalidSalePrice": "Igiciro cyo kugurisha si cyo",
    "inventory.success.updatedPrices": "Ibiciro byavuguruwe kuri {name}: Ikiguzi {cost}/{unit}, Igurisha {sale}/{unit}",
    "common.productRemovedUndo": "\"{name}\" cyasibwe. Ushobora gusubiza inyuma.",
    "common.productRestored": "\"{name}\" cyagaruwe",
    "common.level.low": "Nto",
    "common.level.medium": "Hagati",
    "common.level.good": "Ni byiza",
    "inventory.price": "Igiciro",
    "inventory.base": "shingiro",
    "dashboard.allWellStocked": "Ibicuruzwa byose bifite stock ihagije!",
    "unit.piece": "agace",
    "unit.kg": "kg",
    "unit.g": "g",
    "unit.l": "l",
    "unit.ml": "ml",
    "unit.mg": "mg",
    "unit.ton": "toni",
    "unit.dozen": "duzine",
    "unitFull.kg": "kilogarama",
    "unitFull.g": "garama",
    "unitFull.mg": "miligarama",
    "unitFull.l": "litiro",
    "unitFull.ml": "mililitiro",
    "unitFull.piece": "agace",
    "unitFull.dozen": "duzine",
    "unitFull.ton": "toni",
  },
  fr: {
    "common.language": "Langue",
    "common.logout": "Déconnexion",
    "common.save": "Enregistrer",
    "common.saving": "Enregistrement...",
    "common.saved": "Enregistré",
    "common.saveFailed": "Échec de l’enregistrement",
    "common.saveTitle": "Enregistrer les données sur cet appareil",
    "common.loading": "Chargement...",
    "common.noDataDash.title": "Bienvenue sur ZuriTrack !",
    "common.noDataDash.body1": "Votre inventaire est vide. Allez dans",
    "common.noDataDash.body2": "dans la barre latérale pour ajouter vos premiers produits.",
    "common.noDataDash.body3": "Les produits sont créés automatiquement — saisissez un nom, une quantité et un coût, et c’est fait.",
    "common.orders": "commandes",
    "common.entries": "entrées",
    "common.unitsTotal": "unités au total",
    "common.margin": "marge",
    "common.totalInStock": "Total en stock",
    "common.noStockYet": "Aucun stock pour l’instant. Ajoutez des produits pour remplir ce graphique.",
    "common.totalValue": "Valeur totale",
    "nav.dashboard": "Tableau de bord",
    "nav.stockIn": "Ajouter du stock",
    "nav.stockOut": "Vendre le produit",
    "nav.inventory": "Inventaire",
    "nav.reports": "Rapports",
    "period.today": "Aujourd'hui",
    "period.weekly": "Hebdomadaire",
    "period.monthly": "Mensuel",
    "period.yearly": "Annuel",
    "dashboard.salesPurchases": "Ventes et Achats",
    "dashboard.stockDistribution": "Répartition du stock",
    "dashboard.totalSales": "Ventes totales",
    "dashboard.totalPurchases": "Achats totaux",
    "dashboard.netProfit": "Bénéfice net",
    "dashboard.itemsSold": "Articles vendus",
    "dashboard.topSellingProducts": "Produits les plus vendus",
    "dashboard.lowStockAlerts": "Alerte stock faible",
    "dashboard.recentTransactions": "Transactions récentes",
    "common.searchProducts": "Rechercher des produits...",
    "common.sort.name": "Trier par nom",
    "common.sort.stock": "Trier par stock",
    "common.sort.value": "Trier par valeur",
    "reports.filters.from": "De",
    "reports.filters.to": "À",
    "reports.filters.product": "Produit",
    "reports.filters.type": "Type",
    "reports.filters.allProducts": "Tous les produits",
    "reports.type.all": "Tous",
    "reports.type.in": "Entrées stock",
    "reports.type.out": "Ventes",
    "reports.summary.itemsIn": "Articles entrants",
    "reports.summary.itemsOut": "Articles sortants",
    "reports.summary.totalCost": "Coût total",
    "reports.summary.revenue": "Revenu",
    "reports.summary.profit": "Bénéfice",
    "reports.transactions": "Transactions",
    "reports.table.product": "Produit",
    "reports.table.type": "Type",
    "reports.table.qty": "Qté",
    "reports.table.costUnit": "Coût/unité",
    "reports.table.saleUnit": "Vente/unité",
    "reports.table.total": "Total",
    "reports.table.profit": "Bénéfice",
    "reports.table.date": "Date",
    "reports.table.time": "Heure",
    "reports.badge.in": "ENTRÉE",
    "reports.badge.sale": "VENTE",
    "reports.importError": "Impossible d’importer le fichier. Utilisez une sauvegarde JSON valide.",
    "reports.invalidBackupFile": "Fichier de sauvegarde invalide",
    "reports.importedData": "{products} produits et {transactions} transactions importés",
    "common.exportCSV": "Exporter CSV",
    "common.exportBackup": "Exporter une sauvegarde complète",
    "common.importBackup": "Importer une sauvegarde",
    "common.undoDelete": "Annuler la suppression",
    "common.remove": "Supprimer",
    "stockIn.singleItem": "Article unique",
    "stockIn.multiItem": "Articles multiples",
    "stockIn.productName": "Nom du produit",
    "stockIn.startTypingProduct": "Commencez à saisir le nom du produit...",
    "stockIn.quantity": "Quantité",
    "stockIn.unit": "Unité",
    "stockIn.enterMultiple": "Entrez plusieurs articles (ex.,",
    "stockIn.multiPlaceholder": "Pomme de terre 10kg RWF 300, Maïs 30kg RWF 300",
    "stockIn.defaultCost": "Coût par défaut (RWF/unité) (optionnel)",
    "stockIn.defaultSale": "Vente par défaut (RWF/unité) (optionnel)",
    "stockIn.preview": "Aperçu",
    "stockIn.addAllItems": "Ajouter tous les articles",
    "stockIn.quickTemplates": "Modèles rapides",
    "stockIn.timestampAuto": "La date et l'heure sont ajoutées automatiquement",
    "stockIn.addStock": "Ajouter du stock",
    "stockIn.parseError": "Impossible d'analyser la saisie. Utilisez : Pomme de terre 10kg RWF 300, Maïs 30kg RWF 300",
    "stockIn.addedItems": "{count} articles ajoutés au stock",
    "stockIn.costFromPriceTag": "Coût depuis le prix saisi",
    "stockIn.enterDate": "Date",
    "stockIn.enterTime": "Heure",
    "stockIn.costPrompt": "Comment voulez-vous saisir le coût ?",
    "stockIn.costMode.total": "J’ai payé le montant total",
    "stockIn.costMode.perUnit": "Je connais le prix par {unit}",
    "stockIn.totalPaid": "Montant total payé (RWF)",
    "stockIn.totalPaidPlaceholder": "ex. 1200 pour tout le lot",
    "stockIn.pricePerUnit": "Prix par {unit} (RWF)",
    "stockIn.pricePerUnitPlaceholder": "ex. 1,50 par {unit}",
    "stockIn.salePriceOptional": "Prix de vente par {unit} (RWF/unité) (optionnel)",
    "stockIn.salePriceOptionalPlaceholder": "ex. 2,99 par {unit} (optionnel)",
    "stockIn.autoBreakdown": "Répartition calculée automatiquement",
    "stockIn.costPer": "Coût par {unit}",
    "stockIn.totalCost": "Coût total",
    "stockOut.startTyping": "Commencez à saisir pour trouver un produit...",
    "stockOut.inStock": "En stock",
    "stockOut.costPrice": "Prix de revient",
    "stockOut.lastSalePrice": "Dernier prix de vente",
    "stockOut.howEnterSalePrice": "Comment voulez-vous saisir le prix de vente ?",
    "stockOut.pricePer": "Prix par {unit}",
    "stockOut.totalReceived": "Total reçu",
    "stockOut.salePricePer": "Prix de vente par {unit} (RWF)",
    "stockOut.totalAmountReceived": "Montant total reçu (RWF)",
    "stockOut.completeSale": "Finaliser la vente",
    "stockOut.quickSell": "Vente rapide — Produits fréquents",
    "stockOut.noProducts": "Aucun produit à vendre",
    "stockOut.addStockFirst": "Ajoutez d'abord des produits via {addStock}, puis revenez ici pour vendre.",
    "common.inventoryManager": "Gestionnaire d'inventaire",
    "common.myShop": "Ma boutique",
    "common.admin": "admin",
    "stockIn.error.nameQty": "Veuillez saisir le nom du produit et la quantité",
    "stockIn.error.validCost": "Veuillez saisir un coût valide",
    "stockIn.error.unitNotCompatible": "L'unité \"{unit}\" n'est pas compatible avec \"{productUnit}\"",
    "stockIn.success.added": "{qty} {unit} de {name} ajouté(s) ({stockQty} {productUnit} en stock)",
    "stockOut.error.selectProduct": "Veuillez sélectionner un produit",
    "stockOut.error.enterQuantity": "Veuillez saisir une quantité",
    "stockOut.error.validSalePrice": "Veuillez saisir un prix de vente valide",
    "stockOut.error.unitNotCompatible": "L'unité sélectionnée n'est pas compatible avec l'unité du produit",
    "stockOut.error.notEnoughStock": "Stock insuffisant !",
    "stockOut.sellingBelow": "Vente en dessous du coût — vous perdez {amount} sur cette vente",
    "stockOut.lowStock": "Seulement {stock} {unit} en stock — pas assez",
    "stockOut.totalSale": "Total des ventes",
    "stockOut.profit": "Bénéfice",
    "stockOut.salePricePerColon": "Prix de vente par {unit} :",
    "stockOut.totalReceived2": "total reçu",
    "stockOut.success.sold": "{qty} {unit} de {name} vendu(s). Reste : {remaining} {productUnit}",
    "inventory.error.invalidCostPrice": "Prix de revient invalide",
    "inventory.error.invalidSalePrice": "Prix de vente invalide",
    "inventory.success.updatedPrices": "Prix mis à jour pour {name} : Coût {cost}/{unit}, Vente {sale}/{unit}",
    "common.productRemovedUndo": "\"{name}\" supprimé. Vous pouvez annuler.",
    "common.productRestored": "\"{name}\" restauré",
    "common.level.low": "Faible",
    "common.level.medium": "Moyen",
    "common.level.good": "Bon",
    "inventory.price": "Prix",
    "inventory.base": "base",
    "dashboard.allWellStocked": "Tous les produits sont bien approvisionnés !",
    "unit.piece": "pièce",
    "unit.kg": "kg",
    "unit.g": "g",
    "unit.l": "l",
    "unit.ml": "ml",
    "unit.mg": "mg",
    "unit.ton": "tonne",
    "unit.dozen": "douzaine",
    "unitFull.kg": "kilogramme",
    "unitFull.g": "gramme",
    "unitFull.mg": "milligramme",
    "unitFull.l": "litre",
    "unitFull.ml": "millilitre",
    "unitFull.piece": "pièce",
    "unitFull.dozen": "douzaine",
    "unitFull.ton": "tonne",
  },
  zh: {
    "common.language": "语言",
    "common.logout": "退出登录",
    "common.save": "保存",
    "common.saving": "正在保存…",
    "common.saved": "已保存",
    "common.saveFailed": "保存失败",
    "common.saveTitle": "将数据保存到本设备",
    "common.loading": "加载中…",
    "common.noDataDash.title": "欢迎使用 ZuriTrack！",
    "common.noDataDash.body1": "你的库存为空。请在侧边栏进入",
    "common.noDataDash.body2": "以添加你的第一批产品。",
    "common.noDataDash.body3": "产品会自动创建——输入名称、数量和成本即可完成。",
    "common.orders": "订单",
    "common.entries": "条目",
    "common.unitsTotal": "单位合计",
    "common.margin": "利润率",
    "common.totalInStock": "库存总计",
    "common.noStockYet": "暂无库存。请添加产品以填充该图表。",
    "common.totalValue": "总价值",
    "nav.dashboard": "仪表盘",
    "nav.stockIn": "添加库存",
    "nav.stockOut": "销售商品",
    "nav.inventory": "库存",
    "nav.reports": "报表",
    "period.today": "今天",
    "period.weekly": "每周",
    "period.monthly": "每月",
    "period.yearly": "每年",
    "dashboard.salesPurchases": "销售与采购",
    "dashboard.stockDistribution": "库存分布",
    "dashboard.totalSales": "销售总额",
    "dashboard.totalPurchases": "采购总额",
    "dashboard.netProfit": "净利润",
    "dashboard.itemsSold": "已售商品",
    "dashboard.topSellingProducts": "热门畅销品",
    "dashboard.lowStockAlerts": "低库存提醒",
    "dashboard.recentTransactions": "最近交易",
    "common.searchProducts": "搜索产品...",
    "common.sort.name": "按名称排序",
    "common.sort.stock": "按库存排序",
    "common.sort.value": "按价值排序",
    "reports.filters.from": "从",
    "reports.filters.to": "到",
    "reports.filters.product": "产品",
    "reports.filters.type": "类型",
    "reports.filters.allProducts": "全部产品",
    "reports.type.all": "全部",
    "reports.type.in": "入库",
    "reports.type.out": "销售",
    "reports.summary.itemsIn": "入库数量",
    "reports.summary.itemsOut": "出库数量",
    "reports.summary.totalCost": "总成本",
    "reports.summary.revenue": "收入",
    "reports.summary.profit": "利润",
    "reports.transactions": "交易",
    "reports.table.product": "产品",
    "reports.table.type": "类型",
    "reports.table.qty": "数量",
    "reports.table.costUnit": "成本/单位",
    "reports.table.saleUnit": "售价/单位",
    "reports.table.total": "合计",
    "reports.table.profit": "利润",
    "reports.table.date": "日期",
    "reports.table.time": "时间",
    "reports.badge.in": "入库",
    "reports.badge.sale": "销售",
    "reports.importError": "无法导入文件。请使用有效的 JSON 备份。",
    "reports.invalidBackupFile": "备份文件无效",
    "reports.importedData": "已导入 {products} 个产品和 {transactions} 条交易",
    "common.exportCSV": "导出 CSV",
    "common.exportBackup": "导出完整备份",
    "common.importBackup": "导入备份",
    "common.undoDelete": "撤销删除",
    "common.remove": "删除",
    "stockIn.singleItem": "单个商品",
    "stockIn.multiItem": "多个商品",
    "stockIn.productName": "商品名称",
    "stockIn.startTypingProduct": "开始输入商品名称...",
    "stockIn.quantity": "数量",
    "stockIn.unit": "单位",
    "stockIn.enterMultiple": "输入多个商品（例如，",
    "stockIn.multiPlaceholder": "土豆 10kg RWF 300, 玉米 30kg RWF 300",
    "stockIn.defaultCost": "默认成本（RWF/单位）（可选）",
    "stockIn.defaultSale": "默认售价（RWF/单位）（可选）",
    "stockIn.preview": "预览",
    "stockIn.addAllItems": "添加全部商品",
    "stockIn.quickTemplates": "快捷模板",
    "stockIn.timestampAuto": "日期和时间会自动添加",
    "stockIn.addStock": "添加库存",
    "stockIn.parseError": "无法解析输入。请使用格式：土豆 10kg RWF 300, 玉米 30kg RWF 300",
    "stockIn.addedItems": "已添加 {count} 个商品到库存",
    "stockIn.costFromPriceTag": "按输入价格计算成本",
    "stockIn.enterDate": "日期",
    "stockIn.enterTime": "时间",
    "stockIn.costPrompt": "你希望如何输入成本？",
    "stockIn.costMode.total": "我输入总金额",
    "stockIn.costMode.perUnit": "我知道每{unit}价格",
    "stockIn.totalPaid": "总支付金额 (RWF)",
    "stockIn.totalPaidPlaceholder": "例如：整批 1200",
    "stockIn.pricePerUnit": "每{unit}价格 (RWF)",
    "stockIn.pricePerUnitPlaceholder": "例如：每{unit} 1.50",
    "stockIn.salePriceOptional": "每{unit}售价 (RWF/单位)（可选）",
    "stockIn.salePriceOptionalPlaceholder": "例如：每{unit} 2.99（可选）",
    "stockIn.autoBreakdown": "自动计算明细",
    "stockIn.costPer": "每{unit}成本",
    "stockIn.totalCost": "总成本",
    "stockOut.startTyping": "开始输入以查找商品...",
    "stockOut.inStock": "库存",
    "stockOut.costPrice": "成本价",
    "stockOut.lastSalePrice": "最近售价",
    "stockOut.howEnterSalePrice": "你希望如何输入售价？",
    "stockOut.pricePer": "每{unit}价格",
    "stockOut.totalReceived": "总收款",
    "stockOut.salePricePer": "每{unit}售价 (RWF)",
    "stockOut.totalAmountReceived": "总收款金额 (RWF)",
    "stockOut.completeSale": "完成销售",
    "stockOut.quickSell": "快速销售 — 常用商品",
    "stockOut.noProducts": "没有可销售商品",
    "stockOut.addStockFirst": "请先通过 {addStock} 添加商品，然后再回来销售。",
    "common.inventoryManager": "库存管理",
    "common.myShop": "我的店铺",
    "common.admin": "管理员",
    "stockIn.error.nameQty": "请输入商品名称和数量",
    "stockIn.error.validCost": "请输入有效成本",
    "stockIn.error.unitNotCompatible": "单位“{unit}”与“{productUnit}”不兼容",
    "stockIn.success.added": "已添加 {qty} {unit} 的 {name}（库存 {stockQty} {productUnit}）",
    "stockOut.error.selectProduct": "请选择商品",
    "stockOut.error.enterQuantity": "请输入数量",
    "stockOut.error.validSalePrice": "请输入有效售价",
    "stockOut.error.unitNotCompatible": "所选单位与商品单位不兼容",
    "stockOut.error.notEnoughStock": "库存不足！",
    "stockOut.sellingBelow": "低于成本销售 — 此次销售亏损 {amount}",
    "stockOut.lowStock": "库存仅剩 {stock} {unit} — 数量不足",
    "stockOut.totalSale": "销售总额",
    "stockOut.profit": "利润",
    "stockOut.salePricePerColon": "每{unit}售价：",
    "stockOut.totalReceived2": "总收款",
    "stockOut.success.sold": "已售出 {qty} {unit} 的 {name}。剩余：{remaining} {productUnit}",
    "inventory.error.invalidCostPrice": "成本价无效",
    "inventory.error.invalidSalePrice": "销售价无效",
    "inventory.success.updatedPrices": "已更新 {name} 的价格：成本 {cost}/{unit}，售价 {sale}/{unit}",
    "common.productRemovedUndo": "已删除“{name}”，可撤销。",
    "common.productRestored": "已恢复“{name}”",
    "common.level.low": "低",
    "common.level.medium": "中",
    "common.level.good": "良好",
    "inventory.price": "价格",
    "inventory.base": "基础",
    "dashboard.allWellStocked": "所有产品库存充足！",
    "unit.piece": "件",
    "unit.kg": "千克",
    "unit.g": "克",
    "unit.l": "升",
    "unit.ml": "毫升",
    "unit.mg": "毫克",
    "unit.ton": "吨",
    "unit.dozen": "打",
    "unitFull.kg": "千克",
    "unitFull.g": "克",
    "unitFull.mg": "毫克",
    "unitFull.l": "升",
    "unitFull.ml": "毫升",
    "unitFull.piece": "件",
    "unitFull.dozen": "打",
    "unitFull.ton": "吨",
  },
};
const tLang = (lang, key) => I18N[lang]?.[key] ?? I18N.en?.[key] ?? key;
const tFmtLang = (lang, key, vars = {}) => {
  let str = tLang(lang, key);
  Object.entries(vars).forEach(([k, v]) => {
    str = str.replaceAll(`{${k}}`, String(v));
  });
  return str;
};
const unitLabelLang = (lang, unit) => tLang(lang, `unit.${normalizeUnit(unit)}`);
const unitFullLang = (lang, unit) => tLang(lang, `unitFull.${normalizeUnit(unit)}`) || unitFull(unit);
const unitType = (u) => UNIT_DEFS[normalizeUnit(u)]?.type || "count";
const isConvertible = (from, to) => unitType(from) === unitType(to);
const UnitIcon = ({ unit, size = 14, style }) => {
  const u = normalizeUnit(unit);
  const t = unitType(u);
  // Icons8 "Fluency Systems Filled" set (filled, modern). Using PNG CDN for simplicity.
  const ICON8 = {
    mass: "https://img.icons8.com/fluency-systems-filled/48/weight.png",
    volume: "https://img.icons8.com/fluency-systems-filled/48/water.png",
    bottle: "https://img.icons8.com/fluency-systems-filled/48/wine-bottle.png",
    box: "https://img.icons8.com/fluency-systems-filled/48/box.png",
    bag: "https://img.icons8.com/fluency-systems-filled/48/shopping-bag.png",
    packet: "https://img.icons8.com/fluency-systems-filled/48/package.png",
    dozen: "https://img.icons8.com/fluency-systems-filled/48/stack.png",
    piece: "https://img.icons8.com/fluency-systems-filled/48/filled-circle.png",
    tag: "https://img.icons8.com/fluency-systems-filled/48/price-tag.png",
  };
  const src =
    (u === "bottle" ? ICON8.bottle
      : u === "box" ? ICON8.box
        : u === "bag" ? ICON8.bag
          : u === "packet" ? ICON8.packet
            : u === "dozen" ? ICON8.dozen
              : u === "piece" ? ICON8.piece
                : t === "mass" ? ICON8.mass
                  : t === "volume" ? ICON8.volume
                    : ICON8.tag);

  return (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      className="unit-ic"
      width={size}
      height={size}
      loading="lazy"
      referrerPolicy="no-referrer"
      style={{ display: "block", width: size, height: size, objectFit: "contain", filter: "var(--unit-icon-filter)", ...style }}
      onError={(e) => { try { e.currentTarget.style.display = "none"; } catch (_e) {} }}
    />
  );
};
const convertQty = (qty, from, to) => {
  const f = UNIT_DEFS[normalizeUnit(from)];
  const t = UNIT_DEFS[normalizeUnit(to)];
  if (!f || !t || f.type !== t.type) return null;
  return Number(qty || 0) * (f.factor / t.factor);
};
const convertPricePerUnit = (price, from, to) => {
  const f = UNIT_DEFS[normalizeUnit(from)];
  const t = UNIT_DEFS[normalizeUnit(to)];
  if (!f || !t || f.type !== t.type) return null;
  return Number(price || 0) * (t.factor / f.factor);
};
const unitsFor = (u) => {
  const type = unitType(u);
  return UNITS.filter(x => UNIT_DEFS[x].type === type);
};
const STOCK_COLORS = { high: "#22c55e", medium: "#f59e0b", low: "#ef4444" };
const LOGO_SRC = "./assets/llogo.png";
const POWERED_BY_LOGO_SRC = "./assets/pixel-spring.png";

const levenshtein = (a, b) => {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1] : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
  return dp[m][n];
};

const normalize = (s) => s.toLowerCase().trim().replace(/s$/, "").replace(/ies$/, "y");

const fuzzyMatch = (input, products) => {
  if (!input) return [];
  const norm = normalize(input);
  return products
    .map(p => {
      const pn = normalize(p.name);
      const startsWith = pn.startsWith(norm);
      const includes = pn.includes(norm);
      const dist = levenshtein(norm, pn.slice(0, norm.length));
      let score = dist;
      if (startsWith) score -= 100;
      if (includes) score -= 50;
      score -= (p.frequency || 0) * 2;
      return { ...p, score };
    })
    .filter(p => p.score < 5)
    .sort((a, b) => a.score - b.score);
};

const parseMultiInput = (text) => {
  const items = text.split(",").map(s => s.trim()).filter(Boolean);
  return items.map(item => {
    // Supported:
    // "potato 10kg RWF 300", "maize 30 kg RWF 300", "beans 5l", "rice 20"
    const match = item.match(/^(.+?)\s+(\d+(?:\.\d+)?)\s*([a-zA-Z]+)?(?:\s*\$\s*(\d+(?:\.\d+)?))?$/i);
    if (match) {
      const parsedPrice = match[4] ? parseFloat(match[4]) : null;
      return {
        name: match[1].trim(),
        qty: parseFloat(match[2]),
        unit: normalizeUnit(match[3] || "piece"),
        totalPaid: Number.isFinite(parsedPrice) ? parsedPrice : null,
      };
    }
    return null;
  }).filter(Boolean);
};

// ─── SEED DATA (empty — user adds their own) ───
const SEED_PRODUCTS = [];
const genTransactions = () => [];

// ─── ICONS (inline SVG) ───
const Icons = {
  dashboard: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  stockIn: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12l7 7 7-7"/></svg>,
  stockOut: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 19V5M5 12l7-7 7 7"/></svg>,
  inventory: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>,
  reports: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>,
  search: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>,
  alert: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  plus: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  check: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>,
  x: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  trend: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  download: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  save: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
  edit: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  trash: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>,
  chevron: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>,
  menu: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  user: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  bell: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>,
  globe: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15 15 0 010 20"/><path d="M12 2a15 15 0 000 20"/></svg>,
  undo: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>,
  uptime: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v6l4 2"/><path d="M12 3V1"/></svg>,
};

// ─── Auto-suggest Input Component ───
function AutoInput({ value, onChange, products, placeholder, onSelect, style, t }) {
  const tt = t || ((k) => k);
  const [suggestions, setSuggestions] = useState([]);
  const [selIdx, setSelIdx] = useState(0);
  const [showSug, setShowSug] = useState(false);
  const ref = useRef();

  useEffect(() => {
    if (value.length > 0) {
      const matches = fuzzyMatch(value, products).slice(0, 6);
      setSuggestions(matches);
      setSelIdx(0);
      setShowSug(matches.length > 0);
    } else {
      setSuggestions([]);
      setShowSug(false);
    }
  }, [value, products]);

  const handleKey = (e) => {
    if (e.key === "Tab" && suggestions.length > 0) {
      e.preventDefault();
      const s = suggestions[selIdx];
      onChange(s.name);
      onSelect?.(s);
      setShowSug(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelIdx(i => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelIdx(i => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && suggestions.length > 0 && showSug) {
      e.preventDefault();
      const s = suggestions[selIdx];
      onChange(s.name);
      onSelect?.(s);
      setShowSug(false);
    }
  };

  const ghost = suggestions.length > 0 && value.length > 0 ? suggestions[selIdx]?.name : "";
  const ghostVisible = ghost && normalize(ghost).startsWith(normalize(value));

  return (
    <div style={{ position: "relative", ...style }}>
      {ghostVisible && (
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
          display: "flex", alignItems: "center", padding: "0 16px",
          color: "var(--text-ghost)", fontSize: 15, pointerEvents: "none", fontFamily: "inherit"
        }}>
          <span style={{ visibility: "hidden" }}>{value}</span>
          <span>{ghost.slice(value.length)}</span>
          <span style={{ marginLeft: 12, fontSize: 11, opacity: 0.4, background: "var(--bg-tag)", padding: "2px 6px", borderRadius: 4 }}>Tab</span>
        </div>
      )}
      <input
        ref={ref}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={handleKey}
        onFocus={() => value.length > 0 && suggestions.length > 0 && setShowSug(true)}
        onBlur={() => setTimeout(() => setShowSug(false), 200)}
        placeholder={placeholder}
        style={{
          width: "100%", padding: "12px 16px", borderRadius: 12, border: "2px solid var(--border)",
          fontSize: 15, fontFamily: "inherit", background: "transparent", color: "var(--text)",
          outline: "none", boxSizing: "border-box", transition: "border-color 0.2s",
        }}
        onFocusCapture={e => e.target.style.borderColor = "var(--primary)"}
        onBlurCapture={e => e.target.style.borderColor = "var(--border)"}
      />
      {showSug && suggestions.length > 0 && (
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50,
          background: "var(--popover-bg)", borderRadius: 12, marginTop: 6,
          boxShadow: "0 18px 50px rgba(0,0,0,0.22)", border: "1px solid var(--border)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          overflow: "hidden", maxHeight: 240, overflowY: "auto",
        }}>
          {suggestions.map((s, i) => (
            <div
              key={s.id}
              onMouseDown={() => { onChange(s.name); onSelect?.(s); setShowSug(false); }}
              style={{
                padding: "10px 16px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center",
                background: i === selIdx ? "var(--bg-hover)" : "transparent",
                borderBottom: i < suggestions.length - 1 ? "1px solid var(--border-light)" : "none",
              }}
            >
              <span style={{ fontWeight: 500, color: "var(--text)", display: "inline-flex", alignItems: "center", gap: 8 }}>
                <span style={{ display: "inline-flex", opacity: 0.85 }}><UnitIcon unit={s.unit} size={16} /></span>
                <span>{s.name}</span>
              </span>
              <span style={{ fontSize: 12, color: "var(--text-dim)", display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <span>{s.stock} {s.unit}</span>
                </span>
                <span style={{
                  padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                  background: s.stock < 25 ? "var(--low-bg)" : s.stock < 75 ? "var(--med-bg)" : "var(--good-bg)",
                  color: s.stock < 25 ? "var(--low-fg)" : s.stock < 75 ? "var(--med-fg)" : "var(--good-fg)",
                }}>{s.stock < 25 ? tt("common.level.low") : s.stock < 75 ? tt("common.level.medium") : tt("common.level.good")}</span>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Toast ───
function Toast({ message, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, []);
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, zIndex: 1000,
      padding: "14px 24px", borderRadius: 14,
      background: type === "success" ? "var(--toast-success)" : type === "error" ? "var(--toast-error)" : "var(--toast-info)",
      color: "#fff", fontSize: 14, fontWeight: 600, boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
      animation: "slideUp 0.3s ease", display: "flex", alignItems: "center", gap: 10,
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {type === "success" && Icons.check}
      {message}
    </div>
  );
}

// ─── Simple hash for passwords ───
// ─── Auth Page ───

// ─── Cursor-Repel Animated Background ───────────────────────────────────────

// ─── SVG icon definitions for trust / community / loyalty / money ─────────
const BG_ICONS = {
  trust: (color) => (
    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ width:"100%", height:"100%" }}>
      <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V7L12 2z"/>
      <polyline points="9 12 11 14 15 10"/>
    </svg>
  ),
  community: (color) => (
    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ width:"100%", height:"100%" }}>
      <circle cx="9"  cy="7"  r="3"/>
      <circle cx="15" cy="7"  r="3"/>
      <path d="M3 20c0-3.3 2.7-6 6-6h6c3.3 0 6 2.7 6 6"/>
      <path d="M12 14v6"/>
    </svg>
  ),
  loyalty: (color) => (
    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ width:"100%", height:"100%" }}>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      <polyline points="12 8 12 13 15 15"/>
    </svg>
  ),
  money: (color) => (
    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ width:"100%", height:"100%" }}>
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 6v12"/>
      <path d="M15 9.5a3 3 0 0 0-6 0c0 1.66 1.34 3 3 3s3 1.34 3 3a3 3 0 0 1-6 0"/>
    </svg>
  ),
};

// ─── All background floating items (logos + icons) ────────────────────────
const REPEL_ITEMS = [
  // Logo clones
  { type:"logo", size:115, pos:{ top:"5%",    left:"3%"    }, anim:"ztDrift1 22s ease-in-out infinite", delay:"0s"   },
  { type:"logo", size: 72, pos:{ top:"10%",   right:"5%"   }, anim:"ztDrift2 16s ease-in-out infinite", delay:"-4s"  },
  { type:"logo", size: 58, pos:{ top:"58%",   left:"1%"    }, anim:"ztFloat  12s ease-in-out infinite", delay:"-7s"  },
  { type:"logo", size:100, pos:{ bottom:"7%", right:"3%"   }, anim:"ztDrift1 28s ease-in-out infinite", delay:"-11s" },
  { type:"logo", size: 46, pos:{ top:"40%",   right:"9%"   }, anim:"ztPulse   9s ease-in-out infinite", delay:"-2s"  },
  { type:"logo", size: 68, pos:{ bottom:"20%",left:"7%"    }, anim:"ztDrift2 18s ease-in-out infinite", delay:"-6s"  },
  { type:"logo", size: 84, pos:{ bottom:"32%",right:"16%"  }, anim:"ztFloat  14s ease-in-out infinite", delay:"-9s"  },
  { type:"logo", size: 42, pos:{ top:"25%",   left:"14%"   }, anim:"ztDrift1 13s ease-in-out infinite", delay:"-3s"  },
  { type:"logo", size: 38, pos:{ top:"72%",   left:"28%"   }, anim:"ztFloat   9s ease-in-out infinite", delay:"-1s"  },
  { type:"logo", size: 62, pos:{ top:"48%",   left:"22%"   }, anim:"ztDrift1 17s ease-in-out infinite", delay:"-10s" },
  { type:"logo", size: 44, pos:{ bottom:"42%",right:"30%"  }, anim:"ztDrift2 12s ease-in-out infinite", delay:"-4s"  },
  // Trust icons
  { type:"trust",     size:52, pos:{ top:"15%",   left:"28%"   }, anim:"ztFloat  11s ease-in-out infinite", delay:"-3s"  },
  { type:"trust",     size:36, pos:{ bottom:"18%",right:"22%"  }, anim:"ztDrift1 19s ease-in-out infinite", delay:"-7s"  },
  { type:"trust",     size:44, pos:{ top:"68%",   right:"12%"  }, anim:"ztDrift2 14s ease-in-out infinite", delay:"-5s"  },
  // Community icons
  { type:"community", size:48, pos:{ top:"32%",   left:"36%"   }, anim:"ztDrift2 15s ease-in-out infinite", delay:"-6s"  },
  { type:"community", size:38, pos:{ bottom:"28%",left:"32%"   }, anim:"ztFloat   10s ease-in-out infinite",delay:"-9s"  },
  { type:"community", size:56, pos:{ top:"8%",    right:"22%"  }, anim:"ztDrift1 21s ease-in-out infinite", delay:"-2s"  },
  // Loyalty icons
  { type:"loyalty",   size:44, pos:{ top:"55%",   right:"24%"  }, anim:"ztPulse  13s ease-in-out infinite", delay:"-4s"  },
  { type:"loyalty",   size:34, pos:{ top:"78%",   left:"16%"   }, anim:"ztFloat   8s ease-in-out infinite", delay:"-8s"  },
  { type:"loyalty",   size:50, pos:{ bottom:"8%", left:"20%"   }, anim:"ztDrift2 16s ease-in-out infinite", delay:"-1s"  },
  // Money icons
  { type:"money",     size:46, pos:{ top:"20%",   right:"36%"  }, anim:"ztFloat  12s ease-in-out infinite", delay:"-5s"  },
  { type:"money",     size:40, pos:{ bottom:"50%",left:"44%"   }, anim:"ztDrift1 18s ease-in-out infinite", delay:"-12s" },
  { type:"money",     size:58, pos:{ top:"88%",   right:"8%"   }, anim:"ztDrift2 23s ease-in-out infinite", delay:"-6s"  },
];

const RepelBackground = React.memo(function RepelBackground({ isDark }) {
  const outerRefs   = useRef([]);
  const rawCursor   = useRef({ x: -9999, y: -9999 });
  const lagCursor   = useRef({ x: -9999, y: -9999 });
  const offsets     = useRef(REPEL_ITEMS.map(() => ({ x: 0, y: 0 })));
  const vels        = useRef(REPEL_ITEMS.map(() => ({ vx: 0, vy: 0 })));
  const rafRef      = useRef(null);

  useEffect(() => {
    const onMove = (e) => { rawCursor.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener("mousemove", onMove);

    const tick = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      // Slowly lerp lagged cursor toward real cursor — creates ~0.1s delay feel
      const lag = 0.04;
      lagCursor.current.x += (rawCursor.current.x - lagCursor.current.x) * lag;
      lagCursor.current.y += (rawCursor.current.y - lagCursor.current.y) * lag;

      REPEL_ITEMS.forEach((c, i) => {
        const el = outerRefs.current[i];
        if (!el) return;

        let bx, by;
        if ("left"   in c.pos) bx = parseFloat(c.pos.left)   / 100 * vw + c.size / 2;
        else                   bx = vw - parseFloat(c.pos.right)  / 100 * vw - c.size / 2;
        if ("top"    in c.pos) by = parseFloat(c.pos.top)    / 100 * vh + c.size / 2;
        else                   by = vh - parseFloat(c.pos.bottom) / 100 * vh - c.size / 2;

        const p  = offsets.current[i];
        const v  = vels.current[i];
        const cx = bx + p.x;
        const cy = by + p.y;

        // Use lagged cursor for very delayed reaction
        const dx   = cx - lagCursor.current.x;
        const dy   = cy - lagCursor.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const maxD = 180;

        let fx = 0, fy = 0;
        if (dist < maxD) {
          // Minimal, ultra-smooth repel
          const power = Math.pow(1 - dist / maxD, 1.2) * 12;
          fx = (dx / dist) * power;
          fy = (dy / dist) * power;
        }

        // Ultra-slow drift back
        const stiff = 0.007;
        const damp  = 0.97;
        v.vx = v.vx * damp + (fx - p.x * stiff);
        v.vy = v.vy * damp + (fy - p.y * stiff);
        p.x += v.vx;
        p.y += v.vy;

        el.style.transform = `translate(${p.x.toFixed(2)}px,${p.y.toFixed(2)}px)`;
      });

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const logoFilter = isDark
    ? "none"
    : "brightness(0) saturate(100%) invert(22%) sepia(78%) saturate(600%) hue-rotate(210deg) brightness(0.85)";
  const logoOp  = isDark ? 0.10 : 0.18;
  const iconOp  = isDark ? 0.12 : 0.20;
  const glowClr = isDark ? "rgba(59,130,246,0.4)" : "rgba(39,80,200,0.3)";
  const iconClr = isDark ? "#60a5fa" : "#3b52c0";

  return (
    <>
      {REPEL_ITEMS.map((c, i) => (
        <div
          key={i}
          ref={el => { outerRefs.current[i] = el; }}
          aria-hidden="true"
          style={{
            position: "fixed", zIndex: 0, pointerEvents: "none",
            width: c.size, height: c.size,
            ...c.pos,
            willChange: "transform",
          }}
        >
          <div style={{
            width: "100%", height: "100%",
            animation: c.anim,
            animationDelay: c.delay,
            opacity: c.type === "logo" ? logoOp : iconOp,
            filter: `drop-shadow(0 0 ${Math.round(c.size * 0.2)}px ${glowClr})`,
            transition: "opacity 0.4s, filter 0.4s",
          }}>
            {c.type === "logo" ? (
              <img
                src={LOGO_SRC} alt=""
                style={{ width:"100%", height:"100%", objectFit:"contain", filter: logoFilter, transition:"filter 0.4s" }}
                onError={e => { e.target.style.display = "none"; }}
              />
            ) : (
              BG_ICONS[c.type](iconClr)
            )}
          </div>
        </div>
      ))}
    </>
  );
});




function AuthPage({ onLogin, defaultMode = "login" }) {
  const [step, setStep] = useState("auth"); // "auth" | "reset"
  const [mode, setMode] = useState(defaultMode); // "login" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [shopName, setShopName] = useState("");
  const [resetNewPass, setResetNewPass] = useState("");
  const [resetConfirmPass, setResetConfirmPass] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const emailRef = useRef(null);

  const normalizeEmail = (e) => String(e || "").trim().toLowerCase();
  const [resetCode, setResetCode] = useState("");
  const resetKeyFor = (e) => `pwreset:${normalizeEmail(e)}`;

  const simpleHash = async (str) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(String(str || "") + "zurutracker_salt_2026");
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
  };
  const makeOtp = () => String(Math.floor(100000 + Math.random() * 900000));

  const sendRecoveryCode = async () => {
    setError("");
    const e = normalizeEmail(email);
    if (!e) return setError("Please enter your email"), void 0;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return setError("Please enter a valid email"), void 0;
    setLoading(true);
    try {
      const userKey = `user:${e}`;
      let result = null;
      try { result = await window.storage.get(userKey); } catch (_e) {}
      if (!result?.value) {
        setError("No account found with this email.");
        setLoading(false);
        return;
      }
      const code = makeOtp();
      const codeHash = await simpleHash(code);
      const expiresAt = Date.now() + 10 * 60 * 1000; // 10 min
      await window.storage.set(resetKeyFor(e), JSON.stringify({ codeHash, expiresAt }));

      const subject = encodeURIComponent("ZuriTrack password reset code");
      const body = encodeURIComponent(`Your ZuriTrack password reset code is: ${code}\n\nThis code expires in 10 minutes.\n\nIf you didn't request this, you can ignore this email.`);
      try { window.location.href = `mailto:${encodeURIComponent(e)}?subject=${subject}&body=${body}`; } catch (_e) {}

      setStep("reset");
      setResetCode("");
    } catch (_e) {
      setError("Could not send recovery code. Please try again.");
    }
    setLoading(false);
  };

  const applyPasswordReset = async () => {
    setError("");
    const e = normalizeEmail(email);
    if (!e) return setError("Please enter your email"), void 0;
    if (!resetCode.trim()) return setError("Enter the 6-digit code."), void 0;
    if (resetNewPass.length < 6) return setError("New password must be at least 6 characters."), void 0;
    if (resetNewPass !== resetConfirmPass) return setError("Passwords do not match."), void 0;
    setLoading(true);
    try {
      const rk = resetKeyFor(e);
      const saved = await window.storage.get(rk);
      const rec = JSON.parse(saved.value || "{}");
      if (!rec?.expiresAt || Date.now() > rec.expiresAt) {
        setError("Reset code expired. Please request a new code.");
        setLoading(false);
        return;
      }
      const inputHash = await simpleHash(resetCode.trim());
      if (inputHash !== rec.codeHash) {
        setError("Invalid code. Please try again.");
        setLoading(false);
        return;
      }
      const userKey = `user:${e}`;
      const userRes = await window.storage.get(userKey);
      const userData = JSON.parse(userRes.value || "{}");
      userData.passwordHash = await simpleHash(resetNewPass);
      userData.updatedAt = new Date().toISOString();
      await window.storage.set(userKey, JSON.stringify(userData));
      await window.storage.delete(rk);

      onLogin(userData);
    } catch (_e) {
      setError("Could not reset password. Please try again.");
    }
    setLoading(false);
  };

  const validate = () => {
    setError("");
    if (!email.trim()) return setError("Please enter your email"), false;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError("Please enter a valid email"), false;
    if (password.length < 6) return setError("Password must be at least 6 characters"), false;
    if (mode === "signup") {
      if (!shopName.trim()) return setError("Please enter your shop name"), false;
      if (password !== confirmPass) return setError("Passwords do not match"), false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    setError("");
    const e = normalizeEmail(email);

    try {
      if (mode === "signup") {
        const hashedPass = await simpleHash(password);
        const userKey = `user:${e}`;
        let existing = null;
        try { existing = await window.storage.get(userKey); } catch (_e) {}
        if (existing?.value) {
          setError("An account with this email already exists. Please log in.");
          setLoading(false);
          return;
        }
        const userData = {
          email: e,
          passwordHash: hashedPass,
          shopName: shopName.trim(),
          role: "stock_manager",
          avatarDataUrl: "",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await window.storage.set(userKey, JSON.stringify(userData));
        onLogin(userData);
      } else {
        const hashedPass = await simpleHash(password);
        const userKey = `user:${e}`;
        let result = null;
        try { result = await window.storage.get(userKey); } catch (_e) {}
        if (!result?.value) {
          setError("No account found with this email. Please sign up first.");
          setLoading(false);
          return;
        }
        const userData = JSON.parse(result.value || "{}");
        if (userData.passwordHash !== hashedPass) {
          setError("Incorrect password. Please try again.");
          setLoading(false);
          return;
        }
        onLogin(userData);
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    }
    setLoading(false);
  };


  const handleKeyDown = (e) => { if (e.key === "Enter") handleSubmit(); };

  const BLUE       = "#3b82f6";
  const BLUE_LIGHT = "#60a5fa";
  const BLUE_DEEP  = "#1d4ed8";
  const btnGrad    = `linear-gradient(135deg, ${BLUE} 0%, ${BLUE_DEEP} 100%)`;
  const btnShadow  = `0 4px 22px rgba(59,130,246,0.38)`;

  const t = isDark ? {
    bg:               "radial-gradient(ellipse 110% 90% at 50% 15%, #0b1a35 0%, #060e20 55%, #030810 100%)",
    card:             "rgba(255,255,255,0.055)",
    cardBorder:       "rgba(96,165,250,0.18)",
    shadow:           "0 24px 64px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.07)",
    text:             "#f1f5f9",
    textSub:          "rgba(241,245,249,0.48)",
    input:            "rgba(255,255,255,0.06)",
    inputBorder:      "rgba(96,165,250,0.22)",
    inputFocusBorder: "#60a5fa",
    inputFocusShadow: "0 0 0 3px rgba(96,165,250,0.14)",
    label:            "rgba(241,245,249,0.58)",
    toggleBg:         "rgba(255,255,255,0.06)",
    toggleBorder:     "rgba(255,255,255,0.09)",
    modeInactive:     "rgba(241,245,249,0.42)",
    modeActiveText:   "#fff",
    glow1:            "rgba(59,130,246,0.13)",
    glow2:            "rgba(29,78,216,0.09)",
    watermark:        "rgba(255,255,255,0.025)",
    footer:           "rgba(241,245,249,0.22)",
    errorBg:          "rgba(239,68,68,0.1)",
    errorBorder:      "rgba(239,68,68,0.25)",
    errorText:        "#fca5a5",
    resetBg:          "rgba(255,255,255,0.04)",
    resetBorder:      "rgba(255,255,255,0.09)",
    strengthEmpty:    "rgba(255,255,255,0.1)",
  } : {
    bg:               "radial-gradient(ellipse 110% 90% at 50% 15%, #dbeafe 0%, #eff6ff 55%, #f8faff 100%)",
    card:             "rgba(255,255,255,0.40)",
    cardBorder:       "rgba(59,130,246,0.22)",
    shadow:           "0 24px 64px rgba(37,99,235,0.1), inset 0 1px 0 rgba(255,255,255,0.9)",
    text:             "#0f172a",
    textSub:          "rgba(15,23,42,0.5)",
    input:            "rgba(255,255,255,0.85)",
    inputBorder:      "rgba(59,130,246,0.25)",
    inputFocusBorder: "#3b82f6",
    inputFocusShadow: "0 0 0 3px rgba(59,130,246,0.12)",
    label:            "rgba(15,23,42,0.6)",
    toggleBg:         "rgba(15,23,42,0.06)",
    toggleBorder:     "rgba(15,23,42,0.1)",
    modeInactive:     "rgba(15,23,42,0.42)",
    modeActiveText:   "#fff",
    glow1:            "rgba(59,130,246,0.14)",
    glow2:            "rgba(96,165,250,0.1)",
    watermark:        "rgba(15,23,42,0.032)",
    footer:           "rgba(15,23,42,0.36)",
    errorBg:          "rgba(239,68,68,0.07)",
    errorBorder:      "rgba(239,68,68,0.2)",
    errorText:        "#dc2626",
    resetBg:          "rgba(59,130,246,0.04)",
    resetBorder:      "rgba(59,130,246,0.12)",
    strengthEmpty:    "rgba(15,23,42,0.1)",
  };

  const inputStyle = {
    width: "100%", padding: "13px 16px", borderRadius: 10,
    border: `1.5px solid ${t.inputBorder}`,
    fontSize: 14, outline: "none",
    background: t.input, color: t.text,
    fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box",
    transition: "border-color 0.2s, box-shadow 0.2s, background 0.3s",
  };
  const labelStyle = {
    fontSize: 12, fontWeight: 600, color: t.label,
    marginBottom: 7, display: "block", letterSpacing: 0.3, transition: "color 0.3s",
  };


  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: t.bg, fontFamily: "'DM Sans', sans-serif",
      padding: "20px 20px 44px", position: "relative", overflow: "hidden",
      transition: "background 0.45s ease",
    }}>

      {/* Dark / Light toggle */}
      <button onClick={() => setIsDark(d => !d)} aria-label="Toggle theme" style={{
        position: "fixed", top: 16, right: 16, zIndex: 10,
        width: 42, height: 42, borderRadius: 12,
        border: `1px solid ${t.cardBorder}`,
        background: t.card, backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)",
        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        color: t.text, transition: "all 0.35s",
        boxShadow: "0 4px 18px rgba(0,0,0,0.18)",
        animation: "ztFadeIn 0.6s ease both",
      }}>
        {isDark ? (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="5"/>
            <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
            <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
          </svg>
        ) : (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
        )}
      </button>

      {/* Cursor-repel animated background */}
      <RepelBackground isDark={isDark} />
      {/* Ambient glow orbs */}
      <div aria-hidden="true" style={{
        position: "fixed", top: "-18%", left: "50%", transform: "translateX(-50%)",
        width: "70vw", height: "50vh",
        background: `radial-gradient(ellipse at center, ${t.glow1} 0%, transparent 70%)`,
        pointerEvents: "none", zIndex: 0, transition: "background 0.45s",
      }} />
      <div aria-hidden="true" style={{
        position: "fixed", bottom: "-10%", right: "-8%",
        width: "45vw", height: "45vh",
        background: `radial-gradient(ellipse at center, ${t.glow2} 0%, transparent 70%)`,
        pointerEvents: "none", zIndex: 0, transition: "background 0.45s",
      }} />

      {/* Watermark */}
      <div aria-hidden="true" style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
        fontSize: "clamp(72px, 16vw, 185px)", fontWeight: 900, letterSpacing: "-0.04em",
        color: t.watermark, whiteSpace: "nowrap", userSelect: "none", pointerEvents: "none",
        zIndex: 0, transition: "color 0.45s",
      }}>ZURITRACK</div>

      {/* Main content */}
      <div style={{ position: "relative", width: "100%", maxWidth: 440, animation: "ztFadeUp 0.55s ease both" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ marginBottom: 14, display: "flex", justifyContent: "center" }}>
            <div style={{
              width: 58, height: 58, borderRadius: 17,
              background: btnGrad,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: btnShadow,
              animation: "ztBounce 3.2s ease-in-out infinite",
            }}>
              <img src={LOGO_SRC} alt="ZuriTrack" style={{ width: 37, height: 37, objectFit: "contain" }}
                onError={e => { e.target.style.display = "none"; }} />
            </div>
          </div>
          <h1 style={{
            fontSize: "clamp(17px, 4vw, 22px)", fontWeight: 900, color: t.text,
            letterSpacing: "0.055em", textTransform: "uppercase",
            margin: "0 0 8px", lineHeight: 1.25, transition: "color 0.35s",
          }}>
            <span style={{ color: BLUE_LIGHT }}>Let's Connect</span>
            <span style={{ display: "block", fontSize: "0.87em" }}>with ZuriTrack</span>
          </h1>
          <p style={{ fontSize: 13, color: t.textSub, margin: 0, lineHeight: 1.55, transition: "color 0.35s" }}>
            Seamlessly manage your inventory &amp; sales
          </p>
        </div>

        {/* Glass card */}
        <div style={{
          background: t.card, border: `1px solid ${t.cardBorder}`,
          borderRadius: 20, padding: "28px 26px",
          backdropFilter: "blur(50px)", WebkitBackdropFilter: "blur(50px)",
          boxShadow: t.shadow,
          transition: "background 0.4s, border-color 0.4s, box-shadow 0.4s",
        }}>

          {/* Mode tabs */}
          <div style={{
            display: "flex", background: t.toggleBg, border: `1px solid ${t.toggleBorder}`,
            borderRadius: 12, padding: 3, marginBottom: 22, transition: "background 0.35s",
          }}>
            {["login", "signup"].map(m => (
              <button key={m} onClick={() => { setMode(m); setError(""); }}
                style={{
                  flex: 1, padding: "9px 0", border: "none", borderRadius: 10, cursor: "pointer",
                  fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
                  background: mode === m ? btnGrad : "transparent",
                  color: mode === m ? t.modeActiveText : t.modeInactive,
                  boxShadow: mode === m ? btnShadow : "none",
                  transition: "all 0.25s",
                }}>
                {m === "login" ? "Log In" : "Create Account"}
              </button>
            ))}
          </div>

          {/* Auth form */}
          {step === "auth" && (
            <>
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Email</label>
                <input ref={emailRef} type="email" value={email}
                  onChange={e => setEmail(e.target.value)} placeholder="Enter your email here"
                  style={inputStyle}
                  onKeyDown={e => { if (e.key === "Enter") handleSubmit(); }}
                  onFocus={e => { e.target.style.borderColor = t.inputFocusBorder; e.target.style.boxShadow = t.inputFocusShadow; }}
                  onBlur={e =>  { e.target.style.borderColor = t.inputBorder;      e.target.style.boxShadow = "none"; }}
                />
              </div>

              {mode === "signup" && (
                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>Shop Name</label>
                  <input value={shopName} onChange={e => setShopName(e.target.value)} onKeyDown={handleKeyDown}
                    placeholder="e.g. Mama's General Store" style={inputStyle}
                    onFocus={e => { e.target.style.borderColor = t.inputFocusBorder; e.target.style.boxShadow = t.inputFocusShadow; }}
                    onBlur={e =>  { e.target.style.borderColor = t.inputBorder;      e.target.style.boxShadow = "none"; }}
                  />
                </div>
              )}

              <div style={{ marginBottom: mode === "login" ? 2 : 14 }}>
                <label style={labelStyle}>Password</label>
                <div style={{ position: "relative" }}>
                  <input type={showPass ? "text" : "password"} value={password}
                    onChange={e => setPassword(e.target.value)} onKeyDown={handleKeyDown}
                    placeholder={mode === "signup" ? "At least 6 characters" : "Enter your password"}
                    style={{ ...inputStyle, paddingRight: 46 }}
                    onFocus={e => { e.target.style.borderColor = t.inputFocusBorder; e.target.style.boxShadow = t.inputFocusShadow; }}
                    onBlur={e =>  { e.target.style.borderColor = t.inputBorder;      e.target.style.boxShadow = "none"; }}
                  />
                  <button onClick={() => setShowPass(!showPass)} style={{
                    position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer", color: t.label, padding: 4,
                  }}>
                    {showPass ? (
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    ) : (
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    )}
                  </button>
                </div>
              </div>

              {mode === "login" && (
                <div style={{ textAlign: "right", marginBottom: 14 }}>
                  <button type="button" onClick={() => { setStep("reset"); setError(""); }}
                    style={{ border: "none", background: "transparent", color: BLUE_LIGHT, fontWeight: 600, cursor: "pointer", fontSize: 12 }}>
                    Forgot Password?
                  </button>
                </div>
              )}

              {mode === "signup" && (
                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>Confirm Password</label>
                  <input type={showPass ? "text" : "password"} value={confirmPass}
                    onChange={e => setConfirmPass(e.target.value)} onKeyDown={handleKeyDown}
                    placeholder="Re-enter your password" style={inputStyle}
                    onFocus={e => { e.target.style.borderColor = t.inputFocusBorder; e.target.style.boxShadow = t.inputFocusShadow; }}
                    onBlur={e =>  { e.target.style.borderColor = t.inputBorder;      e.target.style.boxShadow = "none"; }}
                  />
                </div>
              )}

              {mode === "signup" && password.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", gap: 4, marginBottom: 5 }}>
                    {[1,2,3,4].map(level => (
                      <div key={level} style={{
                        flex: 1, height: 3, borderRadius: 2,
                        background: password.length >= level * 3
                          ? password.length >= 12 ? "#22c55e" : password.length >= 8 ? "#f59e0b" : "#ef4444"
                          : t.strengthEmpty,
                        transition: "background 0.3s",
                      }} />
                    ))}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 500, color: password.length >= 12 ? "#22c55e" : password.length >= 8 ? "#f59e0b" : "#ef4444" }}>
                    {password.length >= 12 ? "Strong password" : password.length >= 8 ? "Good password" : password.length >= 6 ? "Fair password" : "Too short"}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Password recovery */}
          {step === "reset" && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, marginBottom: 14 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: t.text, transition: "color 0.35s" }}>Recover Password</div>
                <button type="button" onClick={() => { setStep("auth"); setError(""); }}
                  style={{ border: "none", background: "transparent", color: BLUE_LIGHT, fontWeight: 600, cursor: "pointer", fontSize: 12 }}>
                  Back
                </button>
              </div>
              <label style={labelStyle}>Email Address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" style={{ ...inputStyle, marginBottom: 12 }}
                onFocus={e => { e.target.style.borderColor = t.inputFocusBorder; e.target.style.boxShadow = t.inputFocusShadow; }}
                onBlur={e =>  { e.target.style.borderColor = t.inputBorder;      e.target.style.boxShadow = "none"; }}
              />
              <button type="button" onClick={sendRecoveryCode} disabled={loading} style={{
                width: "100%", padding: "12px 0", borderRadius: 10, border: "none",
                background: loading ? "rgba(59,130,246,0.38)" : btnGrad,
                color: "#fff", fontWeight: 700, cursor: loading ? "wait" : "pointer",
                fontSize: 14, marginBottom: 14, boxShadow: loading ? "none" : btnShadow,
              }}>
                Send Recovery Code
              </button>
              <div style={{ padding: 14, borderRadius: 12, background: t.resetBg, border: `1px solid ${t.resetBorder}` }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: t.label, marginBottom: 10 }}>Enter code &amp; new password</div>
                <div style={{ display: "grid", gap: 10 }}>
                  {[
                    { val: resetCode,        set: setResetCode,        ph: "6-digit code",        type: "text" },
                    { val: resetNewPass,     set: setResetNewPass,     ph: "New password",         type: showPass ? "text" : "password" },
                    { val: resetConfirmPass, set: setResetConfirmPass, ph: "Confirm new password", type: showPass ? "text" : "password" },
                  ].map(({ val, set, ph, type }, i) => (
                    <input key={i} type={type} value={val} onChange={e => set(e.target.value)}
                      placeholder={ph} style={inputStyle}
                      onFocus={e => { e.target.style.borderColor = t.inputFocusBorder; e.target.style.boxShadow = t.inputFocusShadow; }}
                      onBlur={e =>  { e.target.style.borderColor = t.inputBorder;      e.target.style.boxShadow = "none"; }}
                    />
                  ))}
                </div>
                <button type="button" onClick={applyPasswordReset} disabled={loading} style={{
                  width: "100%", marginTop: 12, padding: "12px 0", borderRadius: 10,
                  border: "1px solid rgba(59,130,246,0.28)",
                  background: "rgba(59,130,246,0.1)", color: BLUE_LIGHT, fontWeight: 700,
                  cursor: loading ? "wait" : "pointer", fontSize: 14,
                }}>
                  Reset Password
                </button>
                <div style={{ marginTop: 8, fontSize: 11, color: t.textSub }}>
                  A 6-digit code will be sent to your email (valid 10 min).
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{
              padding: "11px 14px", borderRadius: 10, marginBottom: 14,
              background: t.errorBg, border: `1px solid ${t.errorBorder}`,
              color: t.errorText, fontSize: 13, fontWeight: 500,
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
              {error}
            </div>
          )}

          {/* Submit */}
          <button onClick={handleSubmit} disabled={loading}
            style={{
              display: step === "auth" ? "block" : "none",
              width: "100%", padding: "14px 0", border: "none", borderRadius: 11,
              cursor: loading ? "wait" : "pointer", fontSize: 15, fontWeight: 700,
              fontFamily: "'DM Sans', sans-serif",
              background: loading ? "rgba(59,130,246,0.42)" : btnGrad,
              color: "#fff", letterSpacing: 0.3,
              boxShadow: loading ? "none" : btnShadow,
              transition: "all 0.22s",
            }}
            onMouseEnter={e => { if (!loading) { e.target.style.boxShadow = "0 8px 30px rgba(59,130,246,0.52)"; e.target.style.transform = "translateY(-1px)"; } }}
            onMouseLeave={e => { e.target.style.boxShadow = btnShadow; e.target.style.transform = "none"; }}
          >
            {loading ? (
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <svg width="17" height="17" viewBox="0 0 24 24" style={{ animation: "ztSpin 1s linear infinite" }}>
                  <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3" fill="none"/>
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round"/>
                </svg>
                {mode === "login" ? "Signing in..." : "Creating account..."}
              </span>
            ) : (
              mode === "login" ? "Sign In" : "Create Account"
            )}
          </button>

          <p style={{ textAlign: "center", fontSize: 13, color: t.textSub, marginTop: 16, marginBottom: 0, transition: "color 0.35s" }}>
            {mode === "login" ? (
              <>Don't have access yet?{" "}
                <span onClick={() => { setMode("signup"); setError(""); }}
                  style={{ color: BLUE_LIGHT, fontWeight: 600, cursor: "pointer" }}>Sign Up</span>
              </>
            ) : (
              <>Already have an account?{" "}
                <span onClick={() => { setMode("login"); setError(""); }}
                  style={{ color: BLUE_LIGHT, fontWeight: 600, cursor: "pointer" }}>Log In</span>
              </>
            )}
          </p>
        </div>

        <p style={{ textAlign: "center", fontSize: 11.5, color: t.footer, marginTop: 22, marginBottom: 0, transition: "color 0.35s" }}>
          Copyright &copy; 2025 ZuriTrack. All Rights Reserved.
        </p>
      </div>

      <style>{`
        @keyframes ztSpin   { to { transform: rotate(360deg); } }
        @keyframes ztFadeUp { from { opacity: 0; transform: translateY(22px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes ztFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes ztBounce { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-7px); } }
        @keyframes ztDrift1 {
          0%   { transform: translate(0px,   0px) rotate(0deg)   scale(1);    }
          25%  { transform: translate(30px, -42px) rotate(90deg)  scale(1.09); }
          50%  { transform: translate(-20px, 24px) rotate(180deg) scale(0.91); }
          75%  { transform: translate(15px,  32px) rotate(270deg) scale(1.06); }
          100% { transform: translate(0px,   0px) rotate(360deg) scale(1);    }
        }
        @keyframes ztDrift2 {
          0%   { transform: translate(0px,   0px) rotate(0deg)   scale(1);    }
          33%  { transform: translate(-34px, 26px) rotate(120deg) scale(1.13); }
          66%  { transform: translate(22px, -30px) rotate(240deg) scale(0.87); }
          100% { transform: translate(0px,   0px) rotate(360deg) scale(1);    }
        }
        @keyframes ztFloat {
          0%, 100% { transform: translateY(0px)  rotate(0deg)  scale(1);    }
          50%      { transform: translateY(-32px) rotate(22deg) scale(1.09); }
        }
        @keyframes ztPulse {
          0%, 100% { transform: scale(1)    rotate(0deg);   }
          50%      { transform: scale(1.28) rotate(180deg); }
        }
        input::placeholder { color: rgba(180,190,210,0.4) !important; }
      `}</style>
    </div>
  );
}


// ─── Root App with Auth Gate ───
// ─── Landing Page ──────────────────────────────────────────────────────────
function LandingPage({ onGetStarted, onLogin }) {
  const [activeSection, setActiveSection] = React.useState('hero');
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [isDark, setIsDark] = React.useState(false);
  const [lpLang, setLpLang] = React.useState('en');
  const [lpLangOpen, setLpLangOpen] = React.useState(false);
  const lpLangs = [
    { code:'en',  label:'English',     flag:'🇬🇧' },
    { code:'rw',  label:'Kinyarwanda', flag:'🇷🇼' },
    { code:'sw',  label:'Kiswahili',   flag:'🇹🇿' },
    { code:'fr',  label:'Français',    flag:'🇫🇷' },
  ];

  const lp = isDark ? {
    bg:'#0f172a', navBg:'rgba(15,23,42,0.92)', text:'#f8fafc', muted:'#94a3b8',
    sub:'#64748b', border:'rgba(255,255,255,0.08)', card:'rgba(30,41,59,0.85)',
    featBg:'#0f172a', innerCard:'#1e293b', innerBorder:'rgba(255,255,255,0.06)',
    badge:'rgba(124,58,237,0.18)', badgeBorder:'rgba(124,58,237,0.35)', badgeText:'#a78bfa',
    statsLine:'rgba(255,255,255,0.08)', footerBg:'#0a0f1e', inputBg:'#1e293b',
  } : {
    bg:'#ffffff', navBg:'rgba(255,255,255,0.88)', text:'#0f172a', muted:'#64748b',
    sub:'#94a3b8', border:'rgba(0,0,0,0.06)', card:'rgba(255,255,255,0.75)',
    featBg:'#f8fafc', innerCard:'#ffffff', innerBorder:'#f1f5f9',
    badge:'#f5f3ff', badgeBorder:'#ddd6fe', badgeText:'#7c3aed',
    statsLine:'#f1f5f9', footerBg:'#ffffff', inputBg:'#f8fafc',
  };

  React.useEffect(() => {
    const ids = ['lp-hero','lp-howitworks','lp-features','lp-africa','lp-cta'];
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) setActiveSection(e.target.id.replace('lp-','')); });
    }, { rootMargin:'-35% 0px -35% 0px' });
    ids.forEach(id => { const el = document.getElementById(id); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, []);

  React.useEffect(() => {
    const els = document.querySelectorAll('.lp-rv,.lp-rvl,.lp-rvr,.lp-rvs');
    const ro = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('lp-vis'); });
    }, { threshold: 0.10 });
    els.forEach(el => ro.observe(el));
    return () => ro.disconnect();
  }, [isDark]);

  // 3-D scroll parallax + card tilt
  React.useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const sy = window.scrollY;
        // Hero dashboard 3-D tilt on scroll
        const dash = document.getElementById('lp-dash');
        if (dash) {
          const rot = Math.min(sy * 0.018, 8);
          dash.style.transform = `perspective(900px) rotateX(${rot}deg) rotateY(${-rot * 0.3}deg) scale(${1 - rot * 0.004})`;
        }
        // Parallax blobs
        const blobs = document.querySelectorAll('.lp-blob');
        blobs.forEach((b, i) => {
          b.style.transform = `translateY(${sy * (i % 2 === 0 ? 0.07 : -0.05)}px)`;
        });
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // ── Vanilla Tilt 3D Parallax ──
  React.useEffect(() => {
    const MAX_TILT  = 14;
    const SCALE     = 1.045;
    const SPEED     = 400; // ms transition on enter/leave
    const GLARE_MAX = 0.32;
    const PERSPECTIVE = 900;

    const Z_DEPTH = 26; // px children lift toward viewer

    const initTilt = (card) => {
      // Ensure relative positioning for glare child
      const cs = getComputedStyle(card);
      if (cs.position === 'static') card.style.position = 'relative';
      card.style.overflow       = 'hidden';
      card.style.willChange     = 'transform';
      card.style.transformStyle = 'preserve-3d';

      // Inject glare layer
      let glare = card.querySelector('.vt-glare');
      if (!glare) {
        glare = document.createElement('div');
        glare.className = 'vt-glare';
        glare.style.cssText = [
          'position:absolute', 'inset:0', 'border-radius:inherit',
          'pointer-events:none', 'z-index:9', 'opacity:0',
          'transition:opacity 0.3s',
          'background:linear-gradient(135deg,rgba(255,255,255,0.28) 0%,rgba(255,255,255,0) 60%)',
        ].join(';');
        card.appendChild(glare);
      }

      // Direct children that should lift in Z (text-pull-forward effect)
      const getInners = () => Array.from(card.children).filter(c => !c.classList.contains('vt-glare'));

      const onEnter = () => {
        card.style.transition = `transform ${SPEED}ms cubic-bezier(.03,.98,.52,.99)`;
      };

      const onMove = (e) => {
        const r  = card.getBoundingClientRect();
        const nx = (e.clientX - r.left)  / r.width;   // 0→1
        const ny = (e.clientY - r.top)   / r.height;  // 0→1
        const dx = nx - 0.5;  // -0.5→0.5
        const dy = ny - 0.5;

        const rotX = -dy * MAX_TILT * 2;
        const rotY =  dx * MAX_TILT * 2;

        card.style.transition = 'transform 0.08s ease';
        card.style.transform  = `perspective(${PERSPECTIVE}px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale3d(${SCALE},${SCALE},${SCALE})`;

        // Lift inner content toward viewer (text pull-forward)
        getInners().forEach(child => {
          child.style.transform  = `translateZ(${Z_DEPTH}px)`;
          child.style.transition = 'transform 0.1s ease';
        });

        // Glare: angle follows mouse quadrant
        const angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
        const op    = Math.sqrt(dx*dx + dy*dy) * GLARE_MAX * 2;
        glare.style.opacity    = Math.min(op, GLARE_MAX);
        glare.style.background = `linear-gradient(${angle}deg, rgba(255,255,255,0.38) 0%, rgba(255,255,255,0) 65%)`;

        // Inner highlight shimmer
        card.style.boxShadow = `
          0 ${12 + rotX * 0.5}px ${32 + Math.abs(rotX)}px rgba(0,0,0,0.1),
          inset 0 1px 0 rgba(255,255,255,${0.12 + Math.abs(dy) * 0.12})
        `;
      };

      const onLeave = () => {
        card.style.transition = `transform ${SPEED}ms cubic-bezier(.03,.98,.52,.99), box-shadow ${SPEED}ms ease`;
        card.style.transform  = 'perspective(900px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)';
        card.style.boxShadow  = '';
        glare.style.opacity   = '0';
        // Reset children Z
        getInners().forEach(child => {
          child.style.transform  = 'translateZ(0)';
          child.style.transition = `transform ${SPEED}ms cubic-bezier(.03,.98,.52,.99)`;
        });
      };

      card.addEventListener('mouseenter', onEnter);
      card.addEventListener('mousemove',  onMove);
      card.addEventListener('mouseleave', onLeave);
      return { card, onEnter, onMove, onLeave };
    };

    const cards = document.querySelectorAll('.lp-tilt-card');
    const handlers = Array.from(cards).map(initTilt);

    return () => {
      handlers.forEach(({ card, onEnter, onMove, onLeave }) => {
        card.removeEventListener('mouseenter', onEnter);
        card.removeEventListener('mousemove',  onMove);
        card.removeEventListener('mouseleave', onLeave);
        card.style.transform = '';
        card.style.transition = '';
        card.style.boxShadow = '';
      });
    };
  }, [isDark]);

  // ── COUNT-UP ──
  React.useEffect(() => {
    const ease = t => 1 - Math.pow(1 - t, 4); // easeOutQuart
    const SLOT_POOL = ['USD','EUR','KES','UGX','TZS','GHS','NGN','ETB','ZAR','XAF','MZN','RWF'];
    const run = (el) => {
      if (el._cuDone) return;
      el._cuDone = true;
      const slot = el.dataset.cuSlot; // for non-numeric slot-machine
      if (slot) {
        // Slot-machine: cycle through currencies fast, then slow down and land on target
        const dur = 3000;
        const start = performance.now();
        const idx = SLOT_POOL.indexOf(slot);
        const target = idx >= 0 ? SLOT_POOL[idx] : slot;
        const tick = now => {
          const p = Math.min((now - start) / dur, 1);
          if (p < 1) {
            // Speed slows as p approaches 1 — interval widens with ease
            const interval = 60 + ease(p) * 220;
            const elapsed = now - start;
            const frame = Math.floor(elapsed / interval) % SLOT_POOL.length;
            el.textContent = SLOT_POOL[frame];
            requestAnimationFrame(tick);
          } else {
            el.textContent = target;
          }
        };
        requestAnimationFrame(tick);
        return;
      }
      const target  = parseFloat(el.dataset.cu);
      const suffix  = el.dataset.cuSfx || '';
      const decimal = String(el.dataset.cu).includes('.');
      const dur     = 3000;
      const start   = performance.now();
      const tick = now => {
        const p = Math.min((now - start) / dur, 1);
        const v = target * ease(p);
        el.textContent = (decimal ? v.toFixed(1) : Math.floor(v)) + suffix;
        if (p < 1) requestAnimationFrame(tick);
        else el.textContent = (decimal ? target.toFixed(1) : target) + suffix;
      };
      requestAnimationFrame(tick);
    };
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { run(e.target); obs.unobserve(e.target); } });
    }, { threshold: 0.4 });
    document.querySelectorAll('[data-cu],[data-cu-slot]').forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  // ── GOOGLE TRANSLATE INIT ──
  React.useEffect(() => {
    if (document.getElementById('lp-gt-script')) return;
    window.googleTranslateElementInit = () => {
      new window.google.translate.TranslateElement(
        { pageLanguage:'en', includedLanguages:'en,rw,sw,fr', autoDisplay:false },
        'lp-gt-el'
      );
    };
    const s = document.createElement('script');
    s.id  = 'lp-gt-script';
    s.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    s.async = true;
    document.head.appendChild(s);
  }, []);

  // ── APPLY LANGUAGE ──
  React.useEffect(() => {
    // Persist so MainApp picks it up when user navigates in
    try {
      const key = 'zuriTrack:lang:anonymous';
      if (window.storage?.set) window.storage.set(key, lpLang).catch(()=>{});
      localStorage.setItem(key, lpLang);
    } catch(_e) {}

    const apply = () => {
      if (lpLang === 'en') {
        // Clear translation cookie and reload to English
        document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/';
        document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${location.hostname}`;
        const sel = document.querySelector('.goog-te-combo');
        if (sel) { sel.value = 'en'; sel.dispatchEvent(new Event('change')); }
        return;
      }
      const sel = document.querySelector('.goog-te-combo');
      if (sel) {
        sel.value = lpLang;
        sel.dispatchEvent(new Event('change'));
      } else {
        // Widget not ready yet — set cookie and reload
        document.cookie = `/en/${lpLang}; path=/`;
        document.cookie = `googtrans=/en/${lpLang}; path=/`;
        document.cookie = `googtrans=/en/${lpLang}; path=/; domain=${location.hostname}`;
        location.reload();
      }
    };
    const t = setTimeout(apply, 400);
    return () => clearTimeout(t);
  }, [lpLang]);

  const scrollTo = id => {
    const el = document.getElementById('lp-' + id);
    if (el) el.scrollIntoView({ behavior:'smooth' });
    setMobileMenuOpen(false);
  };

  const sideItems = [
    { id:'hero',       label:'Home',         icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
    { id:'howitworks', label:'How It Works',  icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
    { id:'features',   label:'Features',     icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg> },
    { id:'africa',     label:'For Africa',   icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg> },
    { id:'cta',        label:'Get Started',  icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg> },
  ];

  const PlayBadge = ({ size='md' }) => (
    <div style={{ display:'inline-flex', alignItems:'center', gap: size==='sm'?8:10, background:'#0f172a', borderRadius: size==='sm'?10:12, padding: size==='sm'?'8px 14px':'11px 20px', cursor:'pointer', border:'1px solid #1e293b', transition:'transform 0.15s,box-shadow 0.15s', boxShadow:'0 4px 16px rgba(0,0,0,0.22)' }}
      onMouseOver={e=>{ e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 8px 24px rgba(0,0,0,0.32)'; }}
      onMouseOut={e=>{ e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='0 4px 16px rgba(0,0,0,0.22)'; }}>
      <svg width={size==='sm'?20:24} height={size==='sm'?20:24} viewBox="0 0 24 24" fill="none">
        <path d="M3.18 23.5c.34.19.74.2 1.1.02L17 14.93 13.08 11 3.18 23.5z" fill="#EA4335"/>
        <path d="M21.36 10.3L18.4 8.6l-3.86 3.4 3.86 3.42 2.98-1.7a1.6 1.6 0 0 0 0-3.42z" fill="#FBBC04"/>
        <path d="M3.18.5A1.6 1.6 0 0 0 2.5 1.8v20.4c0 .5.24.96.68 1.3L13.08 11 3.18.5z" fill="#4285F4"/>
        <path d="M3.18.5L13.08 11 17 7.07 4.28.48A1.6 1.6 0 0 0 3.18.5z" fill="#34A853"/>
      </svg>
      <div>
        <div style={{ fontSize:9.5, color:'#94a3b8', letterSpacing:'0.05em', lineHeight:1, marginBottom:2 }}>GET IT ON</div>
        <div style={{ fontSize: size==='sm'?13:15, fontWeight:800, color:'#fff', lineHeight:1 }}>Google Play</div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', background:lp.bg, fontFamily:"'DM Sans',sans-serif", overflowX:'hidden', position:'relative', transition:'background 0.35s' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');

        /* ── SIDEBAR ── */
        .lp-sidebar { display:flex !important; }

        /* ── NAV ── */
        .lp-navlinks { display:flex !important; }
        .lp-hamburger { display:none !important; }

        /* ── HERO ── */
        .lp-hero { flex-direction:row !important; padding-left:72px !important; padding-right:48px !important; min-height:100vh; }
        .lp-hero-left { width:clamp(320px,44vw,500px) !important; flex-shrink:0 !important; }
        .lp-hero-right { display:block !important; }

        /* ── GRIDS ── */
        .lp-features-grid { grid-template-columns:repeat(3,1fr) !important; }
        .lp-steps-grid { grid-template-columns:repeat(4,1fr) !important; }
        .lp-africa-grid { flex-direction:row !important; }

        /* ── MOBILE MENU ── */
        .lp-mmenu { display:none !important; }
        .lp-mmenu-open { display:flex !important; flex-direction:column; position:fixed; top:62px; left:0; right:0; z-index:198; padding:16px 20px 20px; gap:4px; border-bottom:1px solid rgba(0,0,0,0.07); backdrop-filter:blur(24px); -webkit-backdrop-filter:blur(24px); }
        .lp-mnav-item { padding:11px 14px; border-radius:10px; font-size:15px; font-weight:600; cursor:pointer; transition:background 0.15s,color 0.15s; }

        /* ── SCROLL REVEAL (keyframe-based — JS inline styles can freely override after animation) ── */
        .lp-rv  { opacity:0; }
        .lp-rvl { opacity:0; }
        .lp-rvr { opacity:0; }
        .lp-rvs { opacity:0; }
        .lp-rv.lp-vis  { animation: lp-au 0.8s  cubic-bezier(.16,1,.3,1) both; }
        .lp-rvl.lp-vis { animation: lp-al 0.8s  cubic-bezier(.16,1,.3,1) both; }
        .lp-rvr.lp-vis { animation: lp-ar 0.8s  cubic-bezier(.16,1,.3,1) both; }
        .lp-rvs.lp-vis { animation: lp-as 0.75s cubic-bezier(.16,1,.3,1) both; }
        @keyframes lp-au { from { opacity:0; transform:translateY(52px);              } to { opacity:1; transform:translateY(0);    } }
        @keyframes lp-al { from { opacity:0; transform:translateX(-56px);             } to { opacity:1; transform:translateX(0);    } }
        @keyframes lp-ar { from { opacity:0; transform:translateX(56px);              } to { opacity:1; transform:translateX(0);    } }
        @keyframes lp-as { from { opacity:0; transform:scale(0.86) translateY(28px);  } to { opacity:1; transform:scale(1);         } }
        @keyframes lp-bar-breathe { 0%,100% { transform:scaleY(1); opacity:1; } 50% { transform:scaleY(1.1); opacity:0.85; } }
        /* Hide Google Translate bar */
        .skiptranslate, #goog-gt-tt, .goog-te-banner-frame { display:none !important; }
        body { top:0 !important; }
        #lp-gt-el { display:none !important; }
        .lp-d1.lp-vis { animation-delay:0.08s; }
        .lp-d2.lp-vis { animation-delay:0.16s; }
        .lp-d3.lp-vis { animation-delay:0.24s; }
        .lp-d4.lp-vis { animation-delay:0.32s; }
        .lp-d5.lp-vis { animation-delay:0.40s; }
        .lp-d6.lp-vis { animation-delay:0.48s; }

        /* ── RESPONSIVE 1100px ── */
        @media (max-width:1100px) {
          .lp-sidebar { display:none !important; }
          .lp-hero { padding-left:36px !important; padding-right:28px !important; }
          .lp-features-grid { grid-template-columns:repeat(2,1fr) !important; }
          .lp-steps-grid { grid-template-columns:repeat(2,1fr) !important; }
        }

        /* ── RESPONSIVE 860px ── */
        @media (max-width:860px) {
          .lp-navlinks { display:none !important; }
          .lp-hamburger { display:flex !important; }
          .lp-hero { flex-direction:column !important; align-items:flex-start !important; padding:88px 20px 44px !important; gap:32px !important; min-height:unset !important; }
          .lp-hero-left { width:100% !important; max-width:100% !important; }
          .lp-hero-right { display:none !important; }
          .lp-africa-grid { flex-direction:column !important; }
          .lp-mmenu-open { display:flex !important; }
        }

        /* ── RESPONSIVE 560px ── */
        @media (max-width:560px) {
          .lp-features-grid { grid-template-columns:1fr !important; }
          .lp-steps-grid { grid-template-columns:1fr !important; }
          .lp-stats-row { flex-wrap:wrap !important; gap:20px !important; }
          .lp-trust-row { flex-wrap:wrap !important; gap:8px !important; }
          .lp-cta-btns { flex-direction:column !important; align-items:stretch !important; }
          .lp-hero-btns { flex-wrap:wrap !important; }
        }

        /* ── MOBILE NAV LOGO ── */
        @media (max-width:560px) {
          .lp-logo-icon { width:28px !important; height:28px !important; }
          .lp-logo-icon img { width:16px !important; height:16px !important; }
          .lp-logo-text { font-size:13px !important; }
          nav { padding:0 10px 0 14px !important; }
        }

        /* ── GLASS CARD ── */
        .lp-glass-card {
          transition: transform 0.25s cubic-bezier(.16,1,.3,1), box-shadow 0.25s, background 0.2s, backdrop-filter 0.2s !important;
          will-change: transform;
        }

        /* ── SCROLL TICKER ── */
        @keyframes lp-ticker {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .lp-ticker-track { animation: lp-ticker 28s linear infinite; display:flex; width:max-content; }
        .lp-ticker-track:hover { animation-play-state:paused; }

        /* ── PULSE DOT ── */
        @keyframes lp-pulse-ring {
          0%   { transform:scale(1); opacity:0.7; }
          100% { transform:scale(2.2); opacity:0; }
        }
        .lp-pulse::before { content:''; position:absolute; inset:-4px; border-radius:50%; border:2px solid #7c3aed; animation:lp-pulse-ring 1.8s ease-out infinite; }

        /* ── FLOAT BADGE ── */
        @keyframes lp-badge-pop { from { opacity:0; transform:scale(0.7) translateY(10px); } to { opacity:1; transform:scale(1) translateY(0); } }
        .lp-badge-pop { animation: lp-badge-pop 0.5s cubic-bezier(.16,1,.3,1) both; }

        /* ── MISC ── */
        button:focus-visible, a:focus-visible { outline:2px solid #7c3aed; outline-offset:2px; }
        .lp-tilt-card { transition: transform 0.12s ease, box-shadow 0.12s ease; will-change:transform; }
      `}</style>

      {/* BG blobs */}
      <div aria-hidden="true" className="lp-blob" style={{ position:'fixed', top:'-18%', right:'-12%', width:'52vw', height:'52vw', borderRadius:'50%', background:'radial-gradient(circle,#f9a8d4 0%,#ec4899 35%,transparent 70%)', opacity: isDark?0.12:0.26, pointerEvents:'none', zIndex:0, transition:'opacity 0.35s' }} />
      <div aria-hidden="true" className="lp-blob" style={{ position:'fixed', top:'-14%', left:'-16%', width:'48vw', height:'48vw', borderRadius:'50%', background:'radial-gradient(circle,#c4b5fd 0%,#7c3aed 40%,transparent 70%)', opacity: isDark?0.10:0.22, pointerEvents:'none', zIndex:0, transition:'opacity 0.35s' }} />
      <div aria-hidden="true" className="lp-blob" style={{ position:'fixed', bottom:'-10%', right:'4%', width:'32vw', height:'32vw', borderRadius:'50%', background:'radial-gradient(circle,#fed7aa 0%,#f97316 50%,transparent 78%)', opacity: isDark?0.08:0.18, pointerEvents:'none', zIndex:0, transition:'opacity 0.35s' }} />

      {/* ── NAV ── */}
      <nav style={{ position:'fixed', top:0, left:0, right:0, zIndex:200, height:62, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 20px 0 36px', background:lp.navBg, backdropFilter:'blur(22px)', WebkitBackdropFilter:'blur(22px)', borderBottom:`1px solid ${lp.border}`, transition:'background 0.35s,border-color 0.35s' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
          <div className="lp-logo-icon" style={{ width:34, height:34, borderRadius:10, background:'linear-gradient(135deg,#7c3aed,#6366f1)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 2px 8px rgba(0,0,0,0.15)', flexShrink:0 }}>
            <img src={LOGO_SRC} style={{ width:20, height:20, objectFit:'contain' }} onError={e=>e.target.style.display='none'} alt="" />
          </div>
          <span className="lp-logo-text" style={{ fontWeight:800, fontSize:16, color:lp.text, letterSpacing:'-0.02em', transition:'color 0.35s', whiteSpace:'nowrap' }}>ZuriTrack</span>
        </div>

        <div className="lp-navlinks" style={{ gap:28, fontSize:13.5, fontWeight:500, color:lp.muted, alignItems:'center', transition:'color 0.35s' }}>
          {[['How It Works','howitworks'],['Features','features'],['For Africa','africa'],['Get Started','cta']].map(([l,id])=>(
            <span key={l} onClick={()=>scrollTo(id)} style={{ cursor:'pointer', transition:'color 0.15s', whiteSpace:'nowrap', color: activeSection===id?'#7c3aed':lp.muted }}
              onMouseOver={e=>e.currentTarget.style.color='#7c3aed'}
              onMouseOut={e=>e.currentTarget.style.color=activeSection===id?'#7c3aed':lp.muted}>{l}</span>
          ))}
        </div>

        <div style={{ display:'flex', gap:8, alignItems:'center', flexShrink:0 }}>
          {/* Dark/Light toggle */}
          <button onClick={()=>setIsDark(d=>!d)} title={isDark?'Switch to Light Mode':'Switch to Dark Mode'}
            style={{ background: isDark?'rgba(255,255,255,0.08)':'rgba(0,0,0,0.05)', border:`1.5px solid ${lp.border}`, borderRadius:10, width:36, height:36, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', transition:'all 0.2s', color:lp.text, flexShrink:0 }}
            onMouseOver={e=>{e.currentTarget.style.background=isDark?'rgba(255,255,255,0.14)':'rgba(0,0,0,0.09)';}}
            onMouseOut={e=>{e.currentTarget.style.background=isDark?'rgba(255,255,255,0.08)':'rgba(0,0,0,0.05)';}}>
            {isDark
              ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
              : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            }
          </button>

          <button onClick={onLogin} className="lp-navlinks"
            style={{ background:'transparent', border:`1.5px solid ${lp.border}`, color:lp.muted, fontSize:13.5, fontWeight:600, cursor:'pointer', padding:'8px 18px', borderRadius:100, transition:'all 0.15s', whiteSpace:'nowrap' }}
            onMouseOver={e=>{e.currentTarget.style.borderColor='#7c3aed';e.currentTarget.style.color='#7c3aed';}}
            onMouseOut={e=>{e.currentTarget.style.borderColor=lp.border;e.currentTarget.style.color=lp.muted;}}>
            Sign In
          </button>
          <button onClick={onGetStarted}
            style={{ background:'linear-gradient(135deg,#7c3aed,#6366f1)', border:'none', color:'#fff', fontSize:13.5, fontWeight:700, cursor:'pointer', padding:'9px 20px', borderRadius:100, boxShadow:'0 2px 8px rgba(0,0,0,0.18)', transition:'transform 0.15s,box-shadow 0.15s', whiteSpace:'nowrap' }}
            onMouseOver={e=>{e.currentTarget.style.transform='translateY(-1px)';e.currentTarget.style.boxShadow='0 4px 14px rgba(0,0,0,0.22)';}}
            onMouseOut={e=>{e.currentTarget.style.transform='';e.currentTarget.style.boxShadow='0 2px 8px rgba(0,0,0,0.18)';}}>
            Get Started Free
          </button>
          {/* Hamburger */}
          <button className="lp-hamburger" onClick={()=>setMobileMenuOpen(o=>!o)}
            style={{ background:'transparent', border:`1.5px solid ${lp.border}`, borderRadius:10, padding:'7px 8px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:lp.text }}>
            {mobileMenuOpen
              ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            }
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <div className={mobileMenuOpen ? 'lp-mmenu-open' : 'lp-mmenu'} style={{ background:lp.navBg }}>
        {[['Home','hero'],['How It Works','howitworks'],['Features','features'],['For Africa','africa'],['Get Started','cta']].map(([l,id])=>(
          <div key={l} className="lp-mnav-item" onClick={()=>scrollTo(id)} style={{ color:lp.text }}
            onMouseOver={e=>{e.currentTarget.style.background='rgba(124,58,237,0.10)';e.currentTarget.style.color='#7c3aed';}}
            onMouseOut={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.color=lp.text;}}>{l}</div>
        ))}
        <div style={{ height:1, background:lp.border, margin:'8px 0' }} />
        <div className="lp-mnav-item" onClick={onLogin} style={{ color:'#7c3aed' }}>Sign In</div>
        <button onClick={onGetStarted} style={{ margin:'4px 0', background:'linear-gradient(135deg,#7c3aed,#6366f1)', border:'none', color:'#fff', fontSize:15, fontWeight:700, cursor:'pointer', padding:'13px 24px', borderRadius:12, width:'100%', boxShadow:'0 2px 8px rgba(0,0,0,0.15)' }}>
          Get Started Free
        </button>
      </div>

      {/* Google Translate mount point (hidden) */}
      <div id="lp-gt-el" />

      {/* ── HERO ── */}
      <div id="lp-hero" className="lp-hero" style={{ position:'relative', zIndex:1, display:'flex', alignItems:'center', paddingTop:62, gap:48 }}>

        {/* Sidebar nav */}
        <div className="lp-sidebar" style={{ position:'fixed', left:14, top:'50%', transform:'translateY(-50%)', zIndex:100, flexDirection:'column', alignItems:'center', gap:3, background: isDark?'rgba(15,23,42,0.92)':'rgba(255,255,255,0.92)', backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)', border:`1px solid ${lp.border}`, borderRadius:18, padding:'12px 8px', boxShadow: isDark?'0 4px 24px rgba(0,0,0,0.4)':'0 4px 24px rgba(0,0,0,0.07)', transition:'background 0.35s,border-color 0.35s' }}>
          {sideItems.map(({ id, label, icon }, i) => {
            const isAct = activeSection === id || (id==='howitworks' && activeSection==='howitworks');
            return (
              <div key={i} title={label} onClick={()=>scrollTo(id)}
                style={{ position:'relative', width:34, height:34, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color: isAct?'#7c3aed':'#94a3b8', background: isAct?'rgba(124,58,237,0.12)':'transparent', transition:'all 0.15s' }}
                onMouseOver={e=>{ e.currentTarget.style.background='rgba(124,58,237,0.12)'; e.currentTarget.style.color='#7c3aed'; const sp=e.currentTarget.querySelector('span'); if(sp){sp.style.opacity='1';sp.style.transform='translateX(0)';} }}
                onMouseOut={e=>{ e.currentTarget.style.background=isAct?'rgba(124,58,237,0.12)':'transparent'; e.currentTarget.style.color=isAct?'#7c3aed':'#94a3b8'; const sp=e.currentTarget.querySelector('span'); if(sp){sp.style.opacity='0';sp.style.transform='translateX(-4px)';} }}>
                {icon}
                <span style={{ position:'absolute', left:'115%', background:'#0f172a', color:'#fff', fontSize:11, fontWeight:600, padding:'4px 10px', borderRadius:7, whiteSpace:'nowrap', opacity:0, transform:'translateX(-4px)', transition:'all 0.15s', pointerEvents:'none', boxShadow:'0 2px 8px rgba(0,0,0,0.2)' }}>{label}</span>
              </div>
            );
          })}
          <div style={{ width:20, height:1, background:lp.border, margin:'4px 0' }} />
          {/* Theme mini-toggle in sidebar */}
          <div title={isDark?'Light mode':'Dark mode'} onClick={()=>setIsDark(d=>!d)}
            style={{ width:34, height:34, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#94a3b8', transition:'all 0.15s' }}
            onMouseOver={e=>{ e.currentTarget.style.background='rgba(124,58,237,0.12)'; e.currentTarget.style.color='#7c3aed'; }}
            onMouseOut={e=>{ e.currentTarget.style.background='transparent'; e.currentTarget.style.color='#94a3b8'; }}>
            {isDark
              ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/></svg>
              : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            }
          </div>

          {/* Language selector */}
          <div style={{ position:'relative' }}>
            <div title="Language" onClick={()=>setLpLangOpen(o=>!o)}
              style={{ width:34, height:34, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color: lpLangOpen?'#7c3aed':'#94a3b8', background: lpLangOpen?'rgba(124,58,237,0.12)':'transparent', transition:'all 0.15s' }}
              onMouseOver={e=>{ e.currentTarget.style.background='rgba(124,58,237,0.12)'; e.currentTarget.style.color='#7c3aed'; }}
              onMouseOut={e=>{ if(!lpLangOpen){ e.currentTarget.style.background='transparent'; e.currentTarget.style.color='#94a3b8'; } }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
            </div>
            {lpLangOpen && (
              <div style={{ position:'absolute', left:'115%', top:'50%', transform:'translateY(-50%)', background: isDark?'#1e293b':'#fff', border:`1px solid ${lp.border}`, borderRadius:12, padding:'6px 4px', boxShadow:'0 4px 20px rgba(0,0,0,0.13)', zIndex:200, minWidth:150, animation:'lp-au 0.18s ease both' }}>
                {lpLangs.map(l => (
                  <div key={l.code} onClick={()=>{ setLpLang(l.code); setLpLangOpen(false); }}
                    style={{ display:'flex', alignItems:'center', gap:9, padding:'8px 12px', borderRadius:8, cursor:'pointer', background: lpLang===l.code?(isDark?'rgba(124,58,237,0.15)':'#f5f3ff'):'transparent', color: lpLang===l.code?'#7c3aed':lp.text, fontSize:12.5, fontWeight: lpLang===l.code?700:500, transition:'background 0.12s,color 0.12s', whiteSpace:'nowrap' }}
                    onMouseOver={e=>{ if(lpLang!==l.code){ e.currentTarget.style.background=isDark?'rgba(255,255,255,0.05)':'#f8fafc'; } }}
                    onMouseOut={e=>{ if(lpLang!==l.code){ e.currentTarget.style.background='transparent'; } }}>
                    <span style={{ fontSize:15 }}>{l.flag}</span>
                    {l.label}
                    {lpLang===l.code && <svg style={{ marginLeft:'auto' }} width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Left content */}
        <div className="lp-hero-left" style={{ animation:'ztFadeUp 0.6s ease both' }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:lp.badge, border:`1px solid ${lp.badgeBorder}`, borderRadius:100, padding:'5px 14px', fontSize:12.5, color:lp.badgeText, fontWeight:600, marginBottom:20, transition:'background 0.35s,border-color 0.35s,color 0.35s' }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:'#7c3aed', display:'inline-block' }} />
            Inventory and Sales Manager for Africa
          </div>

          <h1 style={{ fontSize:'clamp(28px,3.4vw,50px)', fontWeight:900, lineHeight:1.1, margin:'0 0 18px', color:lp.text, letterSpacing:'-0.03em', transition:'color 0.35s' }}>
            Run Your Business<br/>
            <span style={{ background:'linear-gradient(135deg,#7c3aed,#ec4899)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>Smarter, Faster</span>
          </h1>

          <p style={{ fontSize:15.5, color:lp.muted, lineHeight:1.74, margin:'0 0 28px', maxWidth:420, transition:'color 0.35s' }}>
            ZuriTrack gives African entrepreneurs a complete toolkit to track every product, record every sale, generate receipts, and monitor their business in real time. No confusion, no spreadsheets, just clarity and control.
          </p>

          <div className="lp-hero-btns" style={{ display:'flex', gap:12, marginBottom:18, alignItems:'center' }}>
            <button onClick={onGetStarted}
              style={{ display:'flex', alignItems:'center', gap:8, background:'linear-gradient(135deg,#7c3aed,#6366f1)', border:'none', color:'#fff', fontSize:15, fontWeight:700, cursor:'pointer', padding:'13px 26px', borderRadius:12, boxShadow:'0 3px 12px rgba(0,0,0,0.2)', transition:'transform 0.15s,box-shadow 0.15s', whiteSpace:'nowrap' }}
              onMouseOver={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 6px 20px rgba(0,0,0,0.25)';}}
              onMouseOut={e=>{e.currentTarget.style.transform='';e.currentTarget.style.boxShadow='0 3px 12px rgba(0,0,0,0.2)';}}>
              Get Started Free
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
            <button onClick={onLogin}
              style={{ background:lp.inputBg, border:`1.5px solid ${lp.border}`, color:lp.muted, fontSize:15, fontWeight:600, cursor:'pointer', padding:'13px 22px', borderRadius:12, transition:'all 0.15s', whiteSpace:'nowrap' }}
              onMouseOver={e=>{e.currentTarget.style.borderColor='#7c3aed';e.currentTarget.style.color='#7c3aed';}}
              onMouseOut={e=>{e.currentTarget.style.borderColor=lp.border;e.currentTarget.style.color=lp.muted;}}>
              Sign In
            </button>
          </div>

          <PlayBadge size="sm" />

          <div className="lp-stats-row" style={{ display:'flex', gap:28, paddingTop:24, marginTop:22, borderTop:`1px solid ${lp.statsLine}`, transition:'border-color 0.35s' }}>
            {[['8','+','Active businesses'],['236','+','Products tracked'],['99.9','%','Platform uptime']].map(([n,sfx,l])=>(
              <div key={l} style={{ minWidth:0 }}>
                <div data-cu={n} data-cu-sfx={sfx} style={{ fontSize:22, fontWeight:900, color:'#7c3aed', letterSpacing:'-0.02em' }}>{n}{sfx}</div>
                <div style={{ fontSize:11.5, color:lp.sub, marginTop:2, whiteSpace:'nowrap', transition:'color 0.35s' }}>{l}</div>
              </div>
            ))}
          </div>

          <div className="lp-trust-row" style={{ display:'flex', alignItems:'center', gap:10, marginTop:18 }}>
            {/* 3 African avatar circles: female, male, female */}
            <div style={{ display:'flex' }}>
              {[
                /* African female 1 – natural hair, warm brown skin, happy */
                <svg key={0} width="30" height="30" viewBox="0 0 30 30" style={{ borderRadius:'50%', border:'2.5px solid '+(isDark?'#0f172a':'#fff'), marginLeft:0, display:'block', flexShrink:0, transition:'border-color 0.35s' }}>
                  <circle cx="15" cy="15" r="15" fill="#C68642"/>
                  {/* afro hair */}
                  <ellipse cx="15" cy="10" rx="10" ry="8" fill="#1a0800"/>
                  <ellipse cx="8" cy="14" rx="3.5" ry="5" fill="#1a0800"/>
                  <ellipse cx="22" cy="14" rx="3.5" ry="5" fill="#1a0800"/>
                  {/* face */}
                  <circle cx="15" cy="18" r="9" fill="#C68642"/>
                  {/* eyes */}
                  <circle cx="11.5" cy="17" r="1.4" fill="#1a0800"/>
                  <circle cx="18.5" cy="17" r="1.4" fill="#1a0800"/>
                  <circle cx="12" cy="16.5" r="0.5" fill="#fff" opacity="0.6"/>
                  <circle cx="19" cy="16.5" r="0.5" fill="#fff" opacity="0.6"/>
                  {/* happy smile */}
                  <path d="M11 20.5 Q15 24 19 20.5" stroke="#7a3a00" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
                  {/* cheek blush */}
                  <ellipse cx="10" cy="20" rx="2" ry="1.2" fill="#e0825a" opacity="0.3"/>
                  <ellipse cx="20" cy="20" rx="2" ry="1.2" fill="#e0825a" opacity="0.3"/>
                </svg>,
                /* African male – darker skin, short hair, big smile */
                <svg key={1} width="30" height="30" viewBox="0 0 30 30" style={{ borderRadius:'50%', border:'2.5px solid '+(isDark?'#0f172a':'#fff'), marginLeft:-9, display:'block', flexShrink:0, transition:'border-color 0.35s' }}>
                  <circle cx="15" cy="15" r="15" fill="#8B5E3C"/>
                  {/* short hair */}
                  <ellipse cx="15" cy="9" rx="8.5" ry="5.5" fill="#0d0600"/>
                  <rect x="6" y="9" width="18" height="5" fill="#0d0600" rx="1"/>
                  {/* face */}
                  <circle cx="15" cy="18" r="9" fill="#8B5E3C"/>
                  {/* eyes */}
                  <circle cx="11.5" cy="17" r="1.4" fill="#0d0600"/>
                  <circle cx="18.5" cy="17" r="1.4" fill="#0d0600"/>
                  <circle cx="12" cy="16.5" r="0.5" fill="#fff" opacity="0.7"/>
                  <circle cx="19" cy="16.5" r="0.5" fill="#fff" opacity="0.7"/>
                  {/* broad happy smile with teeth */}
                  <path d="M10.5 20.5 Q15 25 19.5 20.5" stroke="#5a2800" strokeWidth="1.3" fill="none" strokeLinecap="round"/>
                  <ellipse cx="15" cy="22" rx="3" ry="1" fill="#fff" opacity="0.5"/>
                </svg>,
                /* African female 2 – medium skin, braids, wide smile */
                <svg key={2} width="30" height="30" viewBox="0 0 30 30" style={{ borderRadius:'50%', border:'2.5px solid '+(isDark?'#0f172a':'#fff'), marginLeft:-9, display:'block', flexShrink:0, transition:'border-color 0.35s' }}>
                  <circle cx="15" cy="15" r="15" fill="#A0622A"/>
                  {/* braids */}
                  <ellipse cx="15" cy="8" rx="9" ry="6" fill="#1a0800"/>
                  <rect x="6" y="8" width="3.5" height="12" fill="#1a0800" rx="1.5"/>
                  <rect x="20.5" y="8" width="3.5" height="12" fill="#1a0800" rx="1.5"/>
                  <rect x="10" y="6" width="10" height="6" fill="#1a0800" rx="2"/>
                  {/* face */}
                  <circle cx="15" cy="18" r="9" fill="#A0622A"/>
                  {/* eyes */}
                  <circle cx="11.5" cy="17" r="1.4" fill="#1a0800"/>
                  <circle cx="18.5" cy="17" r="1.4" fill="#1a0800"/>
                  <circle cx="12" cy="16.5" r="0.5" fill="#fff" opacity="0.6"/>
                  <circle cx="19" cy="16.5" r="0.5" fill="#fff" opacity="0.6"/>
                  {/* happy smile */}
                  <path d="M11 20.5 Q15 24.5 19 20.5" stroke="#7a3a00" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
                  <ellipse cx="10" cy="20" rx="2" ry="1" fill="#cc6633" opacity="0.28"/>
                  <ellipse cx="20" cy="20" rx="2" ry="1" fill="#cc6633" opacity="0.28"/>
                </svg>,
              ]}
            </div>
            <span style={{ fontSize:12.5, color:lp.muted, whiteSpace:'nowrap', transition:'color 0.35s' }}>Trusted by <strong style={{ color:lp.text }}>13 businesses</strong></span>
            <div style={{ display:'flex', gap:1, flexShrink:0 }}>{[1,2,3,4,5].map(s=><span key={s} style={{ color:'#f59e0b', fontSize:12 }}>★</span>)}</div>
          </div>
        </div>

        {/* Right: Dashboard preview */}
        <div className="lp-hero-right" style={{ flex:1, position:'relative', animation:'ztFadeUp 0.65s 0.14s ease both', minWidth:0 }}>
          <div id="lp-dash" style={{ background: isDark?'rgba(30,41,59,0.85)':'rgba(255,255,255,0.75)', backdropFilter:'blur(28px)', WebkitBackdropFilter:'blur(28px)', border:`1px solid ${lp.border}`, borderRadius:24, padding:'20px 22px', boxShadow: isDark?'0 12px 40px rgba(0,0,0,0.28)':'0 8px 32px rgba(0,0,0,0.07), 0 1px 0 rgba(255,255,255,0.9) inset', position:'relative', zIndex:2, transition:'background 0.35s,border-color 0.35s,box-shadow 0.35s', transformOrigin:'top center' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:lp.text, transition:'color 0.35s' }}>ZuriTrack Dashboard</div>
                <div style={{ fontSize:11, color:lp.sub, marginTop:1, transition:'color 0.35s' }}>Today, April 2025</div>
              </div>
              <div style={{ display:'flex', gap:5 }}>
                {['#ef4444','#f59e0b','#22c55e'].map((c,i)=><div key={i} style={{ width:9, height:9, borderRadius:'50%', background:c }} />)}
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:9, marginBottom:16 }}>
              {[
                { label:'Revenue',    pre:'RWF ', num:48200, suf:'',       change:'+18%', icon:'💰' },
                { label:'In Stock',   pre:'',     num:236,   suf:' items',  change:'+12%', icon:'📦' },
                { label:'Sales Today',pre:'',     num:8,     suf:' orders', change:'+6%',  icon:'🧾' },
              ].map((s,i)=>(
                <div key={i} style={{ background: isDark?'rgba(255,255,255,0.04)':'#f8fafc', border:`1px solid ${lp.innerBorder}`, borderRadius:12, padding:'12px 12px', transition:'background 0.35s,border-color 0.35s' }}>
                  <div style={{ fontSize:17, marginBottom:5 }}>{s.icon}</div>
                  <div style={{ fontSize:10.5, color:lp.sub, marginBottom:2, transition:'color 0.35s' }}>{s.label}</div>
                  <div style={{ fontSize:13, fontWeight:800, color:lp.text, marginBottom:2, transition:'color 0.35s' }}>
                    {s.pre}<span data-cu={s.num} data-cu-sfx={s.suf}>{s.num.toLocaleString()}{s.suf}</span>
                  </div>
                  <div style={{ fontSize:10, color:'#22c55e', fontWeight:600 }}>{s.change} this week</div>
                </div>
              ))}
            </div>
            <div style={{ background: isDark?'rgba(255,255,255,0.04)':'#f8fafc', border:`1px solid ${lp.innerBorder}`, borderRadius:12, padding:'12px 14px', marginBottom:12, transition:'background 0.35s,border-color 0.35s' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                <div style={{ fontSize:11.5, fontWeight:700, color:lp.text, transition:'color 0.35s' }}>Revenue Overview</div>
                <div style={{ fontSize:9.5, color:lp.sub, background: isDark?'rgba(255,255,255,0.06)':'#fff', padding:'2px 9px', borderRadius:100, border:`1px solid ${lp.innerBorder}`, transition:'all 0.35s' }}>Last 7 days</div>
              </div>
              <div style={{ display:'flex', alignItems:'flex-end', gap:5, height:64 }}>
                {[38,58,30,72,50,88,65].map((h,i)=>(
                  <div key={i} style={{ flex:1, height:h*0.64+'px', borderRadius:4, background: i===5?'linear-gradient(180deg,#7c3aed,#6366f1)':i===6?'linear-gradient(180deg,#ec4899,#f43f5e)': isDark?'rgba(255,255,255,0.08)':'#e2e8f0', transformOrigin:'bottom', animation:`lp-bar-breathe ${2.8 + i * 0.28}s ${i * 0.22}s ease-in-out infinite` }} />
                ))}
              </div>
              <div style={{ display:'flex', gap:5, marginTop:5 }}>
                {['M','T','W','T','F','S','S'].map((d,i)=>(
                  <div key={i} style={{ flex:1, textAlign:'center', fontSize:8.5, color:lp.sub, transition:'color 0.35s' }}>{d}</div>
                ))}
              </div>
            </div>
            <div style={{ background: isDark?'rgba(255,255,255,0.04)':'#f8fafc', border:`1px solid ${lp.innerBorder}`, borderRadius:12, padding:'10px 12px', transition:'background 0.35s,border-color 0.35s' }}>
              <div style={{ fontSize:11, fontWeight:700, color:lp.text, marginBottom:8, transition:'color 0.35s' }}>Recent Sales</div>
              {[
                { name:'Phone Accessories', qty:'x3', amount:'RWF 9,000', pos:true },
                { name:'Office Supplies', qty:'x8', amount:'RWF 4,800', pos:true },
                { name:'Stock Restock', qty:'+20', amount:'RWF 2,500', pos:false },
              ].map((t,i)=>(
                <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'6px 0', borderBottom: i<2?`1px solid ${lp.innerBorder}`:'none', transition:'border-color 0.35s' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:7, minWidth:0 }}>
                    <div style={{ width:26, height:26, borderRadius:7, background: isDark?'rgba(124,58,237,0.2)':'#ede9fe', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, flexShrink:0, transition:'background 0.35s' }}>📦</div>
                    <div style={{ minWidth:0 }}>
                      <div style={{ fontSize:11, fontWeight:600, color:lp.text, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', transition:'color 0.35s' }}>{t.name}</div>
                      <div style={{ fontSize:9.5, color:lp.sub, transition:'color 0.35s' }}>{t.qty} units</div>
                    </div>
                  </div>
                  <div style={{ fontSize:11.5, fontWeight:700, color:t.pos?'#22c55e':'#ef4444', flexShrink:0, marginLeft:8 }}>{t.amount}</div>
                </div>
              ))}
            </div>
          </div>
          {/* Floating cards */}
          <div className="lp-tilt-card" style={{ position:'absolute', top:'-14px', right:'-16px', background: isDark?'#1e293b':'#fff', border:`1px solid ${lp.border}`, borderRadius:14, padding:'10px 14px', boxShadow: isDark?'0 4px 16px rgba(0,0,0,0.22)':'0 4px 16px rgba(0,0,0,0.07)', animation:'ztFloat 4.5s ease-in-out infinite', minWidth:180, zIndex:3, transition:'background 0.35s,border-color 0.35s' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ width:32, height:32, borderRadius:9, background:'linear-gradient(135deg,#f97316,#fb923c)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              </div>
              <div>
                <div style={{ fontSize:10, color:lp.sub, transition:'color 0.35s' }}>Low stock alert</div>
                <div style={{ fontSize:12, fontWeight:700, color:lp.text, transition:'color 0.35s' }}>2 items below min.</div>
              </div>
            </div>
          </div>
          <div className="lp-tilt-card" style={{ position:'absolute', bottom:'28px', left:'-22px', background: isDark?'#1e293b':'#fff', border:`1px solid ${lp.border}`, borderRadius:14, padding:'10px 14px', boxShadow: isDark?'0 4px 14px rgba(0,0,0,0.2)':'0 4px 14px rgba(0,0,0,0.06)', animation:'ztFloat 5.5s 1.3s ease-in-out infinite', zIndex:3, transition:'background 0.35s,border-color 0.35s' }}>
            <div style={{ fontSize:10, color:lp.sub, marginBottom:4, transition:'color 0.35s' }}>Customer Satisfaction</div>
            <div style={{ display:'flex', gap:1, marginBottom:3 }}>{[1,2,3,4,5].map(s=><span key={s} style={{ color:'#f59e0b', fontSize:15 }}>★</span>)}</div>
            <div style={{ fontSize:12.5, fontWeight:800, color:lp.text, transition:'color 0.35s' }}>4.9 / 5.0</div>
          </div>
        </div>
      </div>

      {/* ── HOW IT WORKS ── */}
      <div id="lp-howitworks" style={{ position:'relative', zIndex:1, padding:'80px 60px 72px', background: isDark?'rgba(15,23,42,0.96)':'rgba(248,250,252,0.9)', transition:'background 0.35s' }}>
        <div className="lp-rv" style={{ textAlign:'center', marginBottom:52 }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:6, background: isDark?'rgba(124,58,237,0.15)':'#f5f3ff', border:'1px solid #ddd6fe', borderRadius:100, padding:'5px 14px', fontSize:12.5, color:'#7c3aed', fontWeight:600, marginBottom:16 }}>
            How ZuriTrack Works
          </div>
          <h2 style={{ fontSize:'clamp(22px,2.8vw,36px)', fontWeight:900, color:lp.text, margin:'0 0 12px', letterSpacing:'-0.02em', transition:'color 0.35s' }}>From setup to growth in 4 steps</h2>
          <p style={{ fontSize:15.5, color:lp.muted, margin:'0 auto', maxWidth:520, lineHeight:1.7, transition:'color 0.35s' }}>
            ZuriTrack is built to be simple enough for any entrepreneur, powerful enough to scale with your business.
          </p>
        </div>
        <div className="lp-steps-grid" style={{ display:'grid', gap:20, maxWidth:1060, margin:'0 auto' }}>
          {[
            { step:'01', color:'#7c3aed', bg: isDark?'rgba(124,58,237,0.12)':'#f5f3ff', title:'Create Your Account', desc:'Sign up in under 2 minutes. No credit card. No complicated setup. Just your name, email and business name and you are ready to go.', icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg> },
            { step:'02', color:'#6366f1', bg: isDark?'rgba(99,102,241,0.12)':'#eef2ff', title:'Add Your Products', desc:'Enter your products with prices, quantities, and categories. Import from a spreadsheet or add them one by one. ZuriTrack organises everything automatically.', icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/></svg> },
            { step:'03', color:'#ec4899', bg: isDark?'rgba(236,72,153,0.12)':'#fdf2f8', title:'Record Sales Instantly', desc:'Tap to sell. ZuriTrack deducts stock automatically, calculates totals, applies discounts, and generates a professional receipt ready to share on WhatsApp.', icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/></svg> },
            { step:'04', color:'#0891b2', bg: isDark?'rgba(8,145,178,0.12)':'#ecfeff', title:'Track, Report and Grow', desc:'View your daily, weekly, and monthly revenue. Get automatic low-stock alerts. Understand your best-selling products and make smarter restocking decisions.', icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><path d="M2 20h20"/></svg> },
          ].map((s,i)=>(
            <div key={i} className={`lp-rvs lp-step-card lp-tilt-card lp-d${i+1}`}
              style={{ background: isDark?'rgba(30,41,59,0.7)':'#fff', border:`1px solid ${lp.innerBorder}`, borderRadius:20, padding:'28px 22px', boxShadow: isDark?'0 2px 10px rgba(0,0,0,0.18)':'0 2px 10px rgba(0,0,0,0.04)', transition:'transform 0.25s,box-shadow 0.25s,background 0.35s,border-color 0.35s', cursor:'default' }}
              onMouseOver={e=>{e.currentTarget.style.boxShadow=isDark?`0 8px 24px rgba(0,0,0,0.28)`:`0 8px 24px rgba(0,0,0,0.08)`;}}
              onMouseOut={e=>{e.currentTarget.style.boxShadow=isDark?'0 2px 10px rgba(0,0,0,0.18)':'0 2px 10px rgba(0,0,0,0.04)';}}>
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:18 }}>
                <div style={{ width:46, height:46, borderRadius:14, background:s.bg, color:s.color, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'background 0.35s' }}>{s.icon}</div>
                <span style={{ fontSize:28, fontWeight:900, color: isDark?'rgba(255,255,255,0.08)':'rgba(0,0,0,0.06)', letterSpacing:'-0.04em', lineHeight:1 }}>{s.step}</span>
              </div>
              <h3 style={{ fontSize:16, fontWeight:800, color:lp.text, margin:'0 0 10px', letterSpacing:'-0.01em', transition:'color 0.35s' }}>{s.title}</h3>
              <p style={{ fontSize:13.5, color:lp.muted, lineHeight:1.68, margin:0, transition:'color 0.35s' }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── FEATURES ── */}
      <div id="lp-features" style={{ position:'relative', zIndex:1, padding:'80px 60px 72px', background: isDark?'#0a0f1e':'#ffffff', transition:'background 0.35s' }}>
        <div className="lp-rv" style={{ textAlign:'center', marginBottom:48 }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:6, background: isDark?'rgba(124,58,237,0.15)':'#f5f3ff', border:'1px solid #ddd6fe', borderRadius:100, padding:'5px 14px', fontSize:12.5, color:'#7c3aed', fontWeight:600, marginBottom:16 }}>
            Everything You Need
          </div>
          <h2 style={{ fontSize:'clamp(22px,2.8vw,36px)', fontWeight:900, color:lp.text, margin:'0 0 12px', letterSpacing:'-0.02em', transition:'color 0.35s' }}>Powerful tools in one simple app</h2>
          <p style={{ fontSize:15.5, color:lp.muted, margin:'0 auto', maxWidth:500, lineHeight:1.7, transition:'color 0.35s' }}>
            Every feature is built around how African businesses actually operate, on mobile, on the go, and in dynamic markets.
          </p>
        </div>
        <div className="lp-features-grid" style={{ display:'grid', gap:16, maxWidth:1060, margin:'0 auto' }}>
          {[
            { c:'#7c3aed', bg: isDark?'rgba(124,58,237,0.12)':'#f5f3ff', title:'Real-Time Inventory', desc:'Always know what you have in stock. Set minimum quantities and get instant alerts before you run out. Never lose a sale to empty shelves again.', icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/></svg> },
            { c:'#ec4899', bg: isDark?'rgba(236,72,153,0.12)':'#fdf2f8', title:'Sales and Analytics', desc:'See your top-selling products, busiest hours, and revenue trends on visual charts. Understand your business at a glance and act on the numbers.', icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> },
            { c:'#0891b2', bg: isDark?'rgba(8,145,178,0.12)':'#ecfeff', title:'Multi-Currency Support', desc:'Operate in Rwandan Francs (RWF), US Dollars, Euros and more. ZuriTrack handles currency formatting so your records are always correct and professional.', icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v12M15 9.5a3 3 0 0 0-6 0c0 1.66 1.34 3 3 3s3 1.34 3 3a3 3 0 0 1-6 0"/></svg> },
            { c:'#f97316', bg: isDark?'rgba(249,115,22,0.12)':'#fff7ed', title:'WhatsApp Receipts', desc:'Generate a professional digital receipt for every sale in seconds. Share it directly on WhatsApp with your customer. No printer needed, no paper wasted.', icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/></svg> },
            { c:'#22c55e', bg: isDark?'rgba(34,197,94,0.12)':'#f0fdf4', title:'Low-Stock Alerts', desc:'ZuriTrack watches your stock levels 24/7. When any product drops below the minimum you set, you get an instant alert so you can restock before it becomes a problem.', icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg> },
            { c:'#6366f1', bg: isDark?'rgba(99,102,241,0.12)':'#eef2ff', title:'Daily Business Reports', desc:'End every day knowing exactly how much you earned, what you sold, and what your profit margin was. ZuriTrack compiles your full business report automatically.', icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg> },
          ].map((f,i)=>(
            <div key={i} className={`lp-rvs lp-feat-card lp-tilt-card lp-d${i+1}`}
              style={{ background: isDark?'rgba(30,41,59,0.6)':'#ffffff', border:`1px solid ${lp.innerBorder}`, borderRadius:18, padding:'24px 20px', boxShadow: isDark?'0 2px 10px rgba(0,0,0,0.16)':'0 1px 6px rgba(0,0,0,0.05)', transition:'transform 0.22s,box-shadow 0.22s,background 0.35s,border-color 0.35s', cursor:'default' }}
              onMouseOver={e=>{e.currentTarget.style.boxShadow=isDark?`0 8px 22px rgba(0,0,0,0.26)`:`0 6px 18px rgba(0,0,0,0.08)`;e.currentTarget.style.borderColor=isDark?f.c+'44':f.c+'30';}}
              onMouseOut={e=>{e.currentTarget.style.boxShadow=isDark?'0 2px 10px rgba(0,0,0,0.16)':'0 1px 6px rgba(0,0,0,0.05)';e.currentTarget.style.borderColor=lp.innerBorder;}}>
              <div style={{ width:44, height:44, borderRadius:12, background:f.bg, color:f.c, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:14, transition:'background 0.35s' }}>{f.icon}</div>
              <h3 style={{ fontSize:15, fontWeight:700, color:lp.text, margin:'0 0 8px', letterSpacing:'-0.01em', transition:'color 0.35s' }}>{f.title}</h3>
              <p style={{ fontSize:13.5, color:lp.muted, lineHeight:1.65, margin:0, transition:'color 0.35s' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── BUILT FOR AFRICA ── */}
      <div id="lp-africa" style={{ position:'relative', zIndex:1, padding:'80px 60px 80px', background: isDark?'rgba(15,23,42,0.98)':'#f8fafc', transition:'background 0.35s', overflow:'hidden' }}>
        <div style={{ maxWidth:1060, margin:'0 auto' }}>
          <div className="lp-rv" style={{ textAlign:'center', marginBottom:56 }}>
            <div style={{ display:'inline-flex', alignItems:'center', gap:6, background: isDark?'rgba(124,58,237,0.15)':'#f5f3ff', border:'1px solid #ddd6fe', borderRadius:100, padding:'5px 14px', fontSize:12.5, color:'#7c3aed', fontWeight:600, marginBottom:16 }}>
              Designed for African Entrepreneurs
            </div>
            <h2 style={{ fontSize:'clamp(22px,2.8vw,38px)', fontWeight:900, color:lp.text, margin:'0 0 14px', letterSpacing:'-0.02em', transition:'color 0.35s' }}>
              Built around how you<br/>
              <span style={{ background:'linear-gradient(135deg,#7c3aed,#ec4899)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>actually do business</span>
            </h2>
            <p style={{ fontSize:15.5, color:lp.muted, margin:'0 auto', maxWidth:560, lineHeight:1.72, transition:'color 0.35s' }}>
              ZuriTrack was built in Rwanda, for the unique realities of African markets. Whether you run a shop, a kiosk, a boutique, or a wholesale business, ZuriTrack fits how you work.
            </p>
          </div>

          <div className="lp-africa-grid" style={{ display:'flex', gap:40, alignItems:'flex-start' }}>
            {/* Left: value points */}
            <div style={{ flex:1, display:'flex', flexDirection:'column', gap:20 }}>
              {[
                { c:'#7c3aed', title:'Works on Any Android Phone', tilt:true, desc:'No expensive hardware required. ZuriTrack runs on any Android smartphone, even basic ones. Download it on Google Play and start managing your stock the same day.', icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg> },
                { c:'#ec4899', title:'RWF and Local Currency First', desc:'Built with Rwandan Francs as the default currency. Prices, receipts, and reports are all displayed in the way your customers and suppliers expect them.', icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
                { c:'#0891b2', title:'WhatsApp-Ready Receipts', desc:'Your customers are on WhatsApp. ZuriTrack generates clean, professional receipts you can share in one tap. No paper, no printer, no delays.', icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
                { c:'#f97316', title:'Simple Enough for Everyone', desc:'No accounting degree required. ZuriTrack is designed to be used by shop owners, market sellers, and entrepreneurs who need results, not complexity.', icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
              ].map((item, i)=>(
                <div key={i} className={`lp-rvl lp-tilt-card lp-d${i+1}`} style={{ display:'flex', gap:16, alignItems:'flex-start', background: isDark?'rgba(30,41,59,0.5)':'rgba(255,255,255,0.8)', border:`1px solid ${lp.innerBorder}`, borderRadius:16, padding:'18px 20px', transition:'background 0.35s,border-color 0.35s' }}>
                  <div style={{ width:42, height:42, borderRadius:12, background: isDark?`rgba(${item.c==='#7c3aed'?'124,58,237':item.c==='#ec4899'?'236,72,153':item.c==='#0891b2'?'8,145,178':'249,115,22'},0.15)`:item.c+'15', color:item.c, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{item.icon}</div>
                  <div style={{ minWidth:0 }}>
                    <h4 style={{ fontSize:15, fontWeight:700, color:lp.text, margin:'0 0 6px', transition:'color 0.35s' }}>{item.title}</h4>
                    <p style={{ fontSize:13.5, color:lp.muted, lineHeight:1.65, margin:0, transition:'color 0.35s' }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Right: stats block */}
            <div className="lp-rvr" style={{ flex:'0 0 auto', width:'clamp(240px,30%,320px)', display:'flex', flexDirection:'column', gap:16 }}>
              <div className="lp-tilt-card" style={{ background:'linear-gradient(135deg,#7c3aed,#6366f1)', borderRadius:20, padding:'28px 24px', color:'#fff', boxShadow:'0 6px 24px rgba(0,0,0,0.18)' }}>
                <div data-cu="13" data-cu-sfx="" style={{ fontSize:42, fontWeight:900, letterSpacing:'-0.04em', lineHeight:1 }}>13</div>
                <div style={{ fontSize:14, fontWeight:600, opacity:0.88, marginTop:4 }}>Businesses already trust ZuriTrack</div>
                <div style={{ fontSize:12, opacity:0.65, marginTop:6, lineHeight:1.5 }}>Across Kigali and growing fast across East Africa</div>
              </div>
              {[
                { v:'236+', n:'236', sfx:'+', l:'Products tracked and counting', c:'#ec4899' },
                { v:'8+',   n:'8',   sfx:'+', l:'Active businesses on the platform', c:'#0891b2' },
                { v:'99.9%',n:'99.9',sfx:'%', l:'App uptime you can rely on', c:'#22c55e' },
                { v:'RWF',  n:null,  sfx:'',  slot:'RWF', l:'Primary currency, with more supported', c:'#f97316' },
              ].map((s,i)=>(
                <div key={i} className="lp-tilt-card" style={{ background: isDark?'rgba(30,41,59,0.7)':'#fff', border:`1px solid ${lp.innerBorder}`, borderRadius:14, padding:'16px 18px', display:'flex', alignItems:'center', gap:14, transition:'background 0.35s,border-color 0.35s' }}>
                  <div {...(s.n ? {'data-cu':s.n, 'data-cu-sfx':s.sfx} : s.slot ? {'data-cu-slot':s.slot} : {})} style={{ fontSize:24, fontWeight:900, color:s.c, letterSpacing:'-0.03em', flexShrink:0, minWidth:56 }}>{s.v}</div>
                  <div style={{ fontSize:12.5, color:lp.muted, lineHeight:1.5, transition:'color 0.35s' }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── CTA ── */}
      <div id="lp-cta" style={{ position:'relative', zIndex:1, padding:'80px 24px', textAlign:'center', background: isDark?'#0a0f1e':'#fff', transition:'background 0.35s' }}>
        <div className="lp-rv" style={{ maxWidth:600, margin:'0 auto' }}>
          <h2 style={{ fontSize:'clamp(24px,3vw,40px)', fontWeight:900, color:lp.text, margin:'0 0 16px', letterSpacing:'-0.03em', lineHeight:1.15, transition:'color 0.35s' }}>
            Ready to take control of<br/>your business today?
          </h2>
          <p style={{ fontSize:16, color:lp.muted, margin:'0 0 36px', lineHeight:1.72, transition:'color 0.35s' }}>
            Join 13 businesses already using ZuriTrack to track stock, record sales, and grow their revenue. Free to start. Available now on Google Play.
          </p>
          <div className="lp-cta-btns" style={{ display:'flex', justifyContent:'center', gap:16, flexWrap:'wrap', alignItems:'center' }}>
            <button onClick={onGetStarted}
              style={{ background:'linear-gradient(135deg,#7c3aed,#6366f1)', border:'none', color:'#fff', fontSize:15.5, fontWeight:700, cursor:'pointer', padding:'15px 36px', borderRadius:12, boxShadow:'0 3px 12px rgba(0,0,0,0.2)', transition:'transform 0.15s,box-shadow 0.15s', whiteSpace:'nowrap' }}
              onMouseOver={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 6px 20px rgba(0,0,0,0.25)';}}
              onMouseOut={e=>{e.currentTarget.style.transform='';e.currentTarget.style.boxShadow='0 3px 12px rgba(0,0,0,0.2)';}}>
              Create Your Free Account
            </button>
            <PlayBadge size="md" />
          </div>
          <p style={{ fontSize:12.5, color:lp.sub, marginTop:20, transition:'color 0.35s' }}>No credit card required. Free to get started.</p>
        </div>
      </div>

      {/* ── SIGN IN FORM (end of page) ── */}
      <div id="lp-signin" style={{ position:'relative', zIndex:1, padding:'72px 24px 80px', background: isDark?'rgba(15,23,42,0.98)':'#f8fafc', transition:'background 0.35s' }}>
        <div className="lp-rv" style={{ maxWidth:440, margin:'0 auto' }}>
          {/* Glass card */}
          <div className="lp-tilt-card" style={{ background: isDark?'rgba(30,41,59,0.7)':'rgba(255,255,255,0.75)', backdropFilter:'blur(32px)', WebkitBackdropFilter:'blur(32px)', border:`1px solid ${isDark?'rgba(255,255,255,0.1)':'rgba(255,255,255,0.9)'}`, borderRadius:24, padding:'36px 32px', boxShadow: isDark?'0 10px 36px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.06)':'0 8px 32px rgba(0,0,0,0.07), inset 0 1px 0 rgba(255,255,255,0.9)' }}>
            <div style={{ textAlign:'center', marginBottom:28 }}>
              <div style={{ width:48, height:48, borderRadius:14, background:'linear-gradient(135deg,#7c3aed,#6366f1)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px', boxShadow:'0 3px 12px rgba(0,0,0,0.18)' }}>
                <img src={LOGO_SRC} style={{ width:28, height:28, objectFit:'contain' }} onError={e=>e.target.style.display='none'} alt="" />
              </div>
              <h3 style={{ fontSize:22, fontWeight:800, color:lp.text, margin:'0 0 6px', letterSpacing:'-0.02em', transition:'color 0.35s' }}>Welcome back</h3>
              <p style={{ fontSize:14, color:lp.muted, margin:0, transition:'color 0.35s' }}>Sign in to your ZuriTrack account</p>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {/* Email field */}
              <div>
                <label style={{ fontSize:12.5, fontWeight:600, color:lp.muted, display:'block', marginBottom:6, transition:'color 0.35s' }}>Email address</label>
                <div style={{ position:'relative' }}>
                  <span style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', color:'#94a3b8', pointerEvents:'none', display:'flex' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  </span>
                  <input type="email" placeholder="you@business.com"
                    style={{ width:'100%', padding:'12px 14px 12px 40px', borderRadius:11, border:`1.5px solid ${lp.border}`, background: isDark?'rgba(255,255,255,0.05)':'rgba(255,255,255,0.85)', color:lp.text, fontSize:14, outline:'none', boxSizing:'border-box', transition:'border-color 0.2s,background 0.35s,color 0.35s' }}
                    onFocus={e=>{e.target.style.borderColor='#7c3aed';e.target.style.boxShadow='0 0 0 3px rgba(124,58,237,0.15)';}}
                    onBlur={e=>{e.target.style.borderColor=lp.border;e.target.style.boxShadow='none';}} />
                </div>
              </div>
              {/* Password field */}
              <div>
                <label style={{ fontSize:12.5, fontWeight:600, color:lp.muted, display:'block', marginBottom:6, transition:'color 0.35s' }}>Password</label>
                <div style={{ position:'relative' }}>
                  <span style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', color:'#94a3b8', pointerEvents:'none', display:'flex' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  </span>
                  <input type="password" placeholder="••••••••"
                    style={{ width:'100%', padding:'12px 14px 12px 40px', borderRadius:11, border:`1.5px solid ${lp.border}`, background: isDark?'rgba(255,255,255,0.05)':'rgba(255,255,255,0.85)', color:lp.text, fontSize:14, outline:'none', boxSizing:'border-box', transition:'border-color 0.2s,background 0.35s,color 0.35s' }}
                    onFocus={e=>{e.target.style.borderColor='#7c3aed';e.target.style.boxShadow='0 0 0 3px rgba(124,58,237,0.15)';}}
                    onBlur={e=>{e.target.style.borderColor=lp.border;e.target.style.boxShadow='none';}} />
                </div>
              </div>
              <button onClick={onLogin}
                style={{ width:'100%', padding:'13px', background:'linear-gradient(135deg,#7c3aed,#6366f1)', border:'none', borderRadius:11, color:'#fff', fontSize:15, fontWeight:700, cursor:'pointer', boxShadow:'0 2px 10px rgba(0,0,0,0.18)', transition:'transform 0.15s,box-shadow 0.15s', marginTop:4, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}
                onMouseOver={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 5px 16px rgba(0,0,0,0.24)';}}
                onMouseOut={e=>{e.currentTarget.style.transform='';e.currentTarget.style.boxShadow='0 2px 10px rgba(0,0,0,0.18)';}}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
                Sign In
              </button>
            </div>
            <div style={{ textAlign:'center', marginTop:20, fontSize:13.5, color:lp.muted, transition:'color 0.35s' }}>
              No account yet?{' '}
              <span onClick={onGetStarted} style={{ color:'#7c3aed', fontWeight:700, cursor:'pointer', textDecoration:'underline', textDecorationColor:'rgba(124,58,237,0.3)' }}>Create one free</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer style={{ position:'relative', zIndex:1, padding:'20px 40px', borderTop:`1px solid ${lp.border}`, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:14, background:lp.footerBg, transition:'background 0.35s,border-color 0.35s' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:26, height:26, borderRadius:7, background:'linear-gradient(135deg,#7c3aed,#6366f1)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <img src={LOGO_SRC} style={{ width:15, height:15, objectFit:'contain' }} onError={e=>e.target.style.display='none'} alt="" />
          </div>
          <span style={{ fontWeight:800, fontSize:14, color:lp.text, transition:'color 0.35s' }}>ZuriTrack</span>
        </div>
        <div style={{ fontSize:12, color:lp.sub, transition:'color 0.35s' }}>2025 ZuriTrack. All rights reserved.</div>
        <div style={{ display:'flex', alignItems:'center', gap:5 }}>
          <span style={{ fontSize:12, color:lp.sub, transition:'color 0.35s' }}>Powered by</span>
          <img src={POWERED_BY_LOGO_SRC} style={{ height:16, objectFit:'contain', opacity: isDark?0.45:0.55 }} onError={e=>e.target.style.display='none'} alt="Pixelspring" />
          <span style={{ fontSize:12, fontWeight:700, color:lp.sub, transition:'color 0.35s' }}>Pixelspring</span>
        </div>
      </footer>
    </div>
  );
}



function App() {
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState("login");

  // Check for saved session on mount
  useEffect(() => {
    (async () => {
      try {
        const session = await window.storage.get("current_session");
        if (session) {
          const parsed = JSON.parse(session.value);
          setUser(parsed);
        }
      } catch (e) { /* no session */ }
      setCheckingAuth(false);
    })();
  }, []);

  const handleLogin = async (payload) => {
    const userData = (payload && payload.user && payload.token) ? payload.user : payload;
    if (!userData) return;
    setUser({
      ...userData,
      role: userData?.role || "stock_manager",
      avatarDataUrl: userData?.avatarDataUrl || "",
    });
    try {
      await window.storage.set("current_session", JSON.stringify({
        ...userData,
        role: userData?.role || "stock_manager",
        avatarDataUrl: userData?.avatarDataUrl || "",
      }));
    } catch (e) { /* storage might fail */ }
  };

  const handleUpdateUser = async (patch) => {
    try {
      setUser((prev) => {
        const next = { ...(prev || {}), ...(patch || {}) };
        window.storage.set("current_session", JSON.stringify(next)).catch(() => {});
        if (next?.email) {
          const userKey = `user:${String(next.email).trim().toLowerCase()}`;
          window.storage.set(userKey, JSON.stringify(next)).catch(() => {});
        }
        return next;
      });
    } catch (_e) {
      // ignore
    }
  };

  const handleLogout = async () => {
    setUser(null);
    try {
      await window.storage.delete("current_session");
    } catch (e) { /* ok */ }
  };

  if (checkingAuth) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "linear-gradient(135deg, #1e1b4b, #312e81)", fontFamily: "'DM Sans', sans-serif",
      }}>
        <div style={{ textAlign: "center", color: "#a5b4fc", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <img src={LOGO_SRC} alt="ZuriTrack" style={{ width: 64, height: 64, objectFit: "contain", marginBottom: 10 }} />
          <div style={{ fontSize: 18, fontWeight: 700, color: "#fff", letterSpacing: 0.5, marginBottom: 6 }}>ZuriTrack</div>
          <div style={{ fontSize: 15 }}>{tLang("en", "common.loading")}</div>
        </div>
      </div>
    );
  }

  if (!user && !showAuth) {
    return <LandingPage
      onGetStarted={() => { setAuthMode("signup"); setShowAuth(true); }}
      onLogin={() => { setAuthMode("login"); setShowAuth(true); }}
    />;
  }

  if (!user) {
    return <AuthPage onLogin={handleLogin} defaultMode={authMode} />;
  }

  return <MainApp user={user} onLogout={handleLogout} onUpdateUser={handleUpdateUser} />;
}

// ─── Main App ───
function MainApp({ user, onLogout, onUpdateUser }) {
  const [page, setPage] = useState("dashboard");
  const [products, setProducts] = useState(SEED_PRODUCTS);
  const [transactions, setTransactions] = useState(() => genTransactions());
  const [toast, setToast] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [period, setPeriod] = useState("today");
  const [lang, setLang] = useState("en");
  const [currency, setCurrency] = useState("RWF");
  const [theme, setTheme] = useState("light"); // "light" | "dark" | "system"
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [uptimeSec, setUptimeSec] = useState(0);
  const [uptimePoints, setUptimePoints] = useState([]); // [{ t: ms, v: sec }]
  const [uptimeLogs, setUptimeLogs] = useState([]); // [{ t: ms, msg }]
  const [lastDeleted, setLastDeleted] = useState(null);
  const [saveStatus, setSaveStatus] = useState("saved"); // "saved" | "saving" | "failed"
  const [hydrated, setHydrated] = useState(false);

  const dataKey = `zuriTrack:data:${user?.email || "anonymous"}`;
  const langKey = `zuriTrack:lang:${user?.email || "anonymous"}`;
  const currencyKey = `zuriTrack:currency:${user?.email || "anonymous"}`;
  const themeKey = `zuriTrack:theme:${user?.email || "anonymous"}`;
  const tr = (key) => tLang(lang, key);
  const trf = (key, vars) => tFmtLang(lang, key, vars);
  const isPhone = () => {
    try {
      return window.matchMedia ? window.matchMedia("(max-width: 720px)").matches : (window.innerWidth <= 720);
    } catch (_e) {
      return false;
    }
  };

  const currencyWrapRef = useRef(null);
  const langWrapRef = useRef(null);
  const profileImgInputRef = useRef(null);
  const pickProfileImage = () => profileImgInputRef.current?.click?.();
  const onProfileImageFile = (file) => {
    if (!file) return;
    if (!String(file.type || "").startsWith("image/")) { showToast("Please choose an image file.", "error"); return; }
    const r = new FileReader();
    r.onload = () => onUpdateUser?.({ avatarDataUrl: String(r.result || "") });
    r.onerror = () => showToast("Could not read that image. Try another one.", "error");
    r.readAsDataURL(file);
  };
  const CURRENCIES = [
    ["RWF", "Rwandan Franc"],
    ["USD", "US Dollar"],
    ["KES", "Kenyan Shilling"],
    ["TZS", "Tanzanian Shilling"],
    ["UGX", "Ugandan Shilling"],
    ["NGN", "Nigerian Naira"],
    ["GHS", "Ghanaian Cedi"],
    ["ZAR", "South African Rand"],
    ["XOF", "West African CFA"],
    ["XAF", "Central African CFA"],
    ["ETB", "Ethiopian Birr"],
    ["EGP", "Egyptian Pound"],
    ["MAD", "Moroccan Dirham"],
  ];
  const currencyLabel = (code) => (CURRENCIES.find(([c]) => c === code)?.[1] || code);

  useEffect(() => {
    const onDocDown = (e) => {
      if (currencyWrapRef.current && !currencyWrapRef.current.contains(e.target)) setCurrencyOpen(false);
      if (langWrapRef.current && !langWrapRef.current.contains(e.target)) setLangOpen(false);
    };
    document.addEventListener("mousedown", onDocDown);
    document.addEventListener("touchstart", onDocDown, { passive: true });
    return () => {
      document.removeEventListener("mousedown", onDocDown);
      document.removeEventListener("touchstart", onDocDown);
    };
  }, []);

  const LANG_OPTIONS = Object.entries(LANGS); // [code, label]

  useEffect(() => {
    // Mobile-first: start with drawer closed on small screens,
    // and auto-close it when resizing down.
    const mq = window.matchMedia ? window.matchMedia("(max-width: 720px)") : null;
    const apply = () => {
      const isSmall = mq ? mq.matches : (window.innerWidth <= 720);
      if (isSmall) setSidebarOpen(false);
    };
    apply();
    if (!mq) return;
    const handler = () => apply();
    if (mq.addEventListener) mq.addEventListener("change", handler);
    else mq.addListener(handler);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", handler);
      else mq.removeListener(handler);
    };
  }, []);

  // Uptime tracking for the current session
  useEffect(() => {
    const startedAt = Date.now();
    setUptimeLogs([{ t: startedAt, msg: "Session started" }]);
    setUptimePoints([{ t: startedAt, v: 0 }]);

    const tick = window.setInterval(() => {
      const sec = Math.floor((Date.now() - startedAt) / 1000);
      setUptimeSec(sec);
    }, 1000);

    const sample = window.setInterval(() => {
      const now = Date.now();
      const sec = Math.floor((now - startedAt) / 1000);
      setUptimePoints((prev) => {
        const next = [...prev, { t: now, v: sec }];
        return next.length > 720 ? next.slice(next.length - 720) : next;
      });
    }, 10_000);

    return () => {
      window.clearInterval(tick);
      window.clearInterval(sample);
    };
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const saved = await window.storage.get(langKey);
        const savedLang = saved?.value;
        if (savedLang && LANGS[savedLang]) { setLang(savedLang); return; }
      } catch (_e) {}
      // Fallback: read from localStorage (set by landing page lang picker)
      try {
        const lsLang = localStorage.getItem(langKey) || localStorage.getItem('zuriTrack:lang:anonymous');
        if (lsLang && LANGS[lsLang]) setLang(lsLang);
      } catch (_e) {}
    })();
  }, [langKey]);

  useEffect(() => {
    // Persist language choice for this device/user
    window.storage.set(langKey, lang).catch(() => {});
  }, [langKey, lang]);

  useEffect(() => {
    (async () => {
      try {
        const saved = await window.storage.get(themeKey);
        const v = saved?.value;
        if (v === "light" || v === "dark" || v === "system") setTheme(v);
      } catch (_e) {}
    })();
  }, [themeKey]);

  useEffect(() => {
    window.storage.set(themeKey, theme).catch(() => {});
  }, [themeKey, theme]);

  useEffect(() => {
    const root = document.documentElement;
    const mq = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;

    const apply = () => {
      const isSystemDark = mq ? mq.matches : false;
      const resolved = theme === "system" ? (isSystemDark ? "dark" : "light") : theme;
      root.setAttribute("data-theme", resolved);
    };

    apply();

    if (!mq) return;
    const handler = () => apply();
    if (mq.addEventListener) mq.addEventListener("change", handler);
    else mq.addListener(handler);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", handler);
      else mq.removeListener(handler);
    };
  }, [theme]);

  useEffect(() => {
    (async () => {
      try {
        const saved = await window.storage.get(currencyKey);
        const savedCurrency = saved?.value;
        if (savedCurrency) setCurrency(savedCurrency);
      } catch (_e) {}
    })();
  }, [currencyKey]);

  useEffect(() => {
    // Keep global formatter currency in sync with selection
    window.__zt_currency = currency || "RWF";
    if (typeof window.__zt_fxRate !== "number") window.__zt_fxRate = 1;
  }, [currency]);

  useEffect(() => {
    window.storage.set(currencyKey, currency).catch(() => {});
  }, [currencyKey, currency]);

  useEffect(() => {
    (async () => {
      try {
        const saved = await window.storage.get(dataKey);
        if (saved?.value) {
          const parsed = JSON.parse(saved.value);
          if (Array.isArray(parsed.products) && Array.isArray(parsed.transactions)) {
            setProducts(parsed.products.map(p => ({ ...p, unit: normalizeUnit(p.unit || "piece") })));
            setTransactions(parsed.transactions.map(t => ({ ...t, unit: normalizeUnit(t.unit || "piece") })));
          }
        }
      } catch (_e) {
        // No saved data yet (or storage unavailable)
      } finally {
        setHydrated(true);
      }
    })();
  }, [dataKey]);

  useEffect(() => {
    if (!hydrated) return;
    const t = setTimeout(async () => {
      try {
        await window.storage.set(dataKey, JSON.stringify({ products, transactions }));
        setSaveStatus("saved");
      } catch (_e) {
        setSaveStatus("failed");
      }
    }, 450);
    return () => clearTimeout(t);
  }, [products, transactions, hydrated, dataKey]);

  const saveNow = async () => {
    setSaveStatus("saving");
    try {
      await window.storage.set(dataKey, JSON.stringify({ products, transactions }));
      setSaveStatus("saved");
    } catch (_e) {
      setSaveStatus("failed");
    }
  };

  const showToast = (message, type = "success") => setToast({ message, type, key: Date.now() });

  const addTransaction = (txn) => {
    setTransactions(prev => [txn, ...prev]);
    setProducts(prev => prev.map(p => {
      if (p.id === txn.productId) {
        const qtyInProductUnit = txn.unit === p.unit ? txn.quantity : (convertQty(txn.quantity, txn.unit, p.unit) ?? txn.quantity);
        const updated = {
          ...p,
          stock: txn.type === "in" ? p.stock + qtyInProductUnit : p.stock - qtyInProductUnit,
          frequency: (p.frequency || 0) + 1,
        };
        // Auto-save cost price when adding stock, sale price when selling
        if (txn.type === "in" && txn.costPrice > 0) {
          updated.costPrice = txn.unit === p.unit ? txn.costPrice : (convertPricePerUnit(txn.costPrice, txn.unit, p.unit) ?? txn.costPrice);
        }
        if (txn.type === "out" && txn.salePrice > 0) {
          updated.salePrice = txn.unit === p.unit ? txn.salePrice : (convertPricePerUnit(txn.salePrice, txn.unit, p.unit) ?? txn.salePrice);
        }
        return updated;
      }
      return p;
    }));
  };

  const findOrCreateProduct = (name, unit, costPrice, salePrice) => {
    const existing = products.find(p => normalize(p.name) === normalize(name));
    if (existing) return existing;
    const baseUnit = normalizeUnit(unit || "piece");
    const newP = { id: uid(), name, unit: baseUnit, costPrice: costPrice || 0, salePrice: salePrice || 0, frequency: 0, stock: 0 };
    setProducts(prev => [...prev, newP]);
    return newP;
  };

  const updateProductPrice = (productId, newCostPrice, newSalePrice) => {
    setProducts(prev => prev.map(p => {
      if (p.id === productId) {
        return {
          ...p,
          costPrice: newCostPrice !== null && newCostPrice !== undefined ? newCostPrice : p.costPrice,
          salePrice: newSalePrice !== null && newSalePrice !== undefined ? newSalePrice : p.salePrice,
        };
      }
      return p;
    }));
  };

  const removeProduct = (productId) => {
    const product = products.find(p => p.id === productId);
    const deletedTxns = transactions.filter(t => t.productId === productId);
    setLastDeleted(product ? { product, transactions: deletedTxns } : null);
    setProducts(prev => prev.filter(p => p.id !== productId));
    setTransactions(prev => prev.filter(t => t.productId !== productId));
    if (product) showToast(trf("common.productRemovedUndo", { name: product.name }));
  };

  const undoRemoveProduct = () => {
    if (!lastDeleted?.product) return;
    setProducts(prev => [...prev, lastDeleted.product]);
    setTransactions(prev => [...lastDeleted.transactions, ...prev]);
    showToast(trf("common.productRestored", { name: lastDeleted.product.name }));
    setLastDeleted(null);
  };

  const importAppData = (payload) => {
    if (!payload || !Array.isArray(payload.products) || !Array.isArray(payload.transactions)) {
      showToast(tr("reports.invalidBackupFile"), "error");
      return;
    }
    setProducts(payload.products.map(p => ({ ...p, unit: normalizeUnit(p.unit || "piece") })));
    setTransactions(payload.transactions.map(t => ({ ...t, unit: normalizeUnit(t.unit || "piece") })));
    showToast(trf("reports.importedData", { products: payload.products.length, transactions: payload.transactions.length }));
  };

  const exportAppData = () => ({
    app: "ZuriTrack",
    exportedAt: new Date().toISOString(),
    user: { email: user?.email || "", shopName: user?.shopName || "" },
    products,
    transactions,
  });

  const stats = useMemo(() => {
    const filterByPeriod = (d) => {
      if (period === "today") return isToday(d);
      if (period === "weekly") return isThisWeek(d);
      if (period === "monthly") return isThisMonth(d);
      return isThisYear(d);
    };
    const filtered = transactions.filter(t => filterByPeriod(t.date));
    const sales = filtered.filter(t => t.type === "out");
    const purchases = filtered.filter(t => t.type === "in");
    const totalSales = sales.reduce((s, t) => s + t.salePrice * t.quantity, 0);
    const totalPurchases = purchases.reduce((s, t) => s + t.costPrice * t.quantity, 0);
    const totalProfit = sales.reduce((s, t) => s + t.profit, 0);
    const totalItems = sales.reduce((s, t) => s + t.quantity, 0);
    return { totalSales, totalPurchases, totalProfit, totalItems, salesCount: sales.length, purchaseCount: purchases.length };
  }, [transactions, period]);

  const lowStockProducts = products.filter(p => p.stock < 30).sort((a, b) => a.stock - b.stock);
  const topProducts = useMemo(() => {
    const map = {};
    transactions.filter(t => t.type === "out").forEach(t => {
      map[t.productName] = (map[t.productName] || 0) + t.quantity;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name, qty]) => ({ name, qty }));
  }, [transactions]);

  const chartData = useMemo(() => {
    const map = {};
    const orderedKeys = [];

    const addBucket = (key, label) => {
      if (!map[key]) map[key] = { date: label, sales: 0, purchases: 0, profit: 0 };
      return map[key];
    };

    const addTxToBucket = (bucketKey, t) => {
      const b = map[bucketKey];
      if (!b) return;
      if (t.type === "out") {
        b.sales += t.salePrice * t.quantity;
        b.profit += t.profit;
      } else {
        b.purchases += t.costPrice * t.quantity;
      }
    };

    if (period === "today") {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const buckets = 12; // every 2 hours
      const stepMs = (24 / buckets) * 60 * 60 * 1000;
      for (let i = 0; i < buckets; i++) {
        const bucketStart = new Date(start.getTime() + i * stepMs);
        const key = String(i);
        const label = bucketStart.toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" });
        addBucket(key, label);
        orderedKeys.push(key);
      }
      transactions.forEach(t => {
        const ts = t.timestamp || parseDate(t.date).getTime();
        const dt = new Date(ts);
        if (dt < start || dt >= new Date(start.getTime() + 24 * 60 * 60 * 1000)) return;
        const idx = Math.floor((dt.getTime() - start.getTime()) / stepMs);
        if (idx >= 0 && idx < buckets) addTxToBucket(String(idx), t);
      });
    } else if (period === "weekly") {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const ds = d.toISOString().split("T")[0];
        const label = d.toLocaleDateString("en", { weekday: "short" });
        addBucket(ds, label);
        orderedKeys.push(ds);
      }
      transactions.forEach(t => addTxToBucket(t.date, t));
    } else if (period === "monthly") {
      for (let i = 29; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const ds = d.toISOString().split("T")[0];
        const label = d.toLocaleDateString("en", { month: "short", day: "numeric" });
        addBucket(ds, label);
        orderedKeys.push(ds);
      }
      transactions.forEach(t => addTxToBucket(t.date, t));
    } else {
      // yearly: current year months
      const year = new Date().getFullYear();
      for (let m = 0; m < 12; m++) {
        const d = new Date(year, m, 1);
        const key = `${year}-${m + 1}`;
        const label = d.toLocaleDateString("en", { month: "short" });
        addBucket(key, label);
        orderedKeys.push(key);
      }
      transactions.forEach(t => {
        const ts = t.timestamp || parseDate(t.date).getTime();
        const d = new Date(ts);
        if (d.getFullYear() !== year) return;
        const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
        addTxToBucket(key, t);
      });
    }

    return orderedKeys.map(k => map[k]);
  }, [transactions, period]);

  const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#14b8a6"];

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=Space+Mono:wght@400;700&display=swap');
    :root {
      --primary: #6366f1;
      --primary-light: #818cf8;
      --primary-dark: #4f46e5;
      --primary-bg: #eef2ff;
      --bg: #f8f9fc;
      --bg-card: #ffffff;
      --bg-sidebar: #1e1b4b;
      --bg-hover: #f1f5f9;
      --bg-tag: #e2e8f0;
      --text: #000000;
      --text-dim: #000000;
      --text-ghost: #000000;
      --text-sidebar: #c7d2fe;
      --text-sidebar-active: #ffffff;
      --border: #e2e8f0;
      --border-light: #f1f5f9;
      --green: #059669;
      --green-bg: #ecfdf5;
      --red: #dc2626;
      --red-bg: #fef2f2;
      --orange: #d97706;
      --orange-bg: #fffbeb;
      --blue: #2563eb;
      --blue-bg: #eff6ff;
      --low-bg: #fef2f2;
      --low-fg: #dc2626;
      --med-bg: #fffbeb;
      --med-fg: #d97706;
      --good-bg: #ecfdf5;
      --good-fg: #059669;

      /* Responsive layout vars */
      --sidebar-w: 260px;
      --header-pad-x: 32px;
      --header-pad-y: 16px;
      --content-pad-x: 32px;
      --content-pad-y: 24px;

      /* Chart + toast theme vars */
      --chart-grid: rgba(148, 163, 184, 0.28);
      --chart-axis: rgba(148, 163, 184, 0.38);
      --chart-text: #94a3b8;
      --chart-donut-hole: #ffffff;
      --toast-success: #059669;
      --toast-error: #dc2626;
      --toast-info: #2563eb;
      --popover-bg: rgba(255, 255, 255, 0.96);
      --unit-icon-filter: grayscale(1) saturate(0) brightness(0);
      --header-glass: linear-gradient(180deg, rgba(255,255,255,0.70), rgba(255,255,255,0.46));
    }

    /* Dark theme overrides */
    [data-theme="dark"] {
      --primary-bg: rgba(99, 102, 241, 0.14);
      --bg: #0b1020;
      --bg-card: rgba(255, 255, 255, 0.06);
      --bg-sidebar: rgba(7, 11, 22, 0.78);
      --bg-hover: rgba(255, 255, 255, 0.08);
      --bg-tag: rgba(255, 255, 255, 0.10);
      --text: rgba(255, 255, 255, 0.96);
      --text-dim: rgba(255, 255, 255, 0.72);
      --text-ghost: rgba(255, 255, 255, 0.55);
      --text-sidebar: rgba(255, 255, 255, 0.78);
      --text-sidebar-active: rgba(255, 255, 255, 0.98);
      --border: rgba(255, 255, 255, 0.12);
      --border-light: rgba(255, 255, 255, 0.08);
      --green-bg: rgba(34, 197, 94, 0.14);
      --red-bg: rgba(239, 68, 68, 0.14);
      --orange-bg: rgba(245, 158, 11, 0.14);
      --blue-bg: rgba(59, 130, 246, 0.14);
      --low-bg: rgba(239, 68, 68, 0.14);
      --low-fg: rgba(248, 113, 113, 0.95);
      --med-bg: rgba(245, 158, 11, 0.14);
      --med-fg: rgba(251, 191, 36, 0.95);
      --good-bg: rgba(34, 197, 94, 0.14);
      --good-fg: rgba(74, 222, 128, 0.95);
      --chart-grid: rgba(255, 255, 255, 0.06);
      --chart-axis: rgba(255, 255, 255, 0.08);
      --chart-text: rgba(255, 255, 255, 0.55);
      --chart-donut-hole: rgba(255, 255, 255, 0.08);
      --popover-bg: rgba(10, 14, 28, 0.72);
      --unit-icon-filter: grayscale(1) saturate(0) brightness(0) invert(1);
      --header-glass: linear-gradient(180deg, rgba(7, 11, 22, 0.62), rgba(7, 11, 22, 0.44));
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'DM Sans', sans-serif; background: var(--bg); color: var(--text); }
    .unit-ic { filter: var(--unit-icon-filter); }
    input, select, button, textarea { font-family: 'DM Sans', sans-serif; }
    input, select, textarea, option {
      color: var(--text) !important;
      -webkit-text-fill-color: var(--text);
    }
    /* Placeholders: visibly lighter than typed text */
    input::placeholder,
    textarea::placeholder,
    input::-webkit-input-placeholder,
    textarea::-webkit-input-placeholder {
      color: rgba(0, 0, 0, 0.40) !important;
      -webkit-text-fill-color: rgba(0, 0, 0, 0.40) !important;
      opacity: 1 !important;
      font-weight: 500;
    }
    [data-theme="dark"] input::placeholder,
    [data-theme="dark"] textarea::placeholder,
    [data-theme="dark"] input::-webkit-input-placeholder,
    [data-theme="dark"] textarea::-webkit-input-placeholder {
      color: rgba(255, 255, 255, 0.40) !important;
      -webkit-text-fill-color: rgba(255, 255, 255, 0.40) !important;
    }
    select { background: var(--bg-card); color: var(--text) !important; -webkit-text-fill-color: var(--text); }
    option { background: var(--bg-card); color: var(--text) !important; }
    @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
    @keyframes chartRise {
      from { opacity: 0; transform: translateY(14px) scale(0.98); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    @keyframes chartDraw {
      from { stroke-dashoffset: 100; opacity: 0.35; }
      to { stroke-dashoffset: 0; opacity: 1; }
    }
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
    .stat-card { transition: transform 0.2s, box-shadow 0.2s; }
    .stat-card:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(0,0,0,0.08); }
    .nav-item { transition: all 0.2s; cursor: pointer; border-radius: 12px; }
    .nav-item:hover { background: rgba(255,255,255,0.08); }
    .btn { cursor: pointer; border: none; font-weight: 600; border-radius: 12px; transition: all 0.2s; font-family: 'DM Sans', sans-serif; }
    .btn:hover { transform: translateY(-1px); }
    .btn-primary { background: var(--primary); color: white; }
    .btn-primary:hover { background: var(--primary-dark); }
    .btn-outline { background: transparent; border: 2px solid var(--border); color: var(--text); }
    .btn-outline:hover { border-color: var(--primary); color: var(--primary); }

    /* Glass panels */
    .glass-panel {
      position: relative;
      overflow: hidden;
      border-radius: 16px;
      border: 1px solid var(--border);
      background: var(--bg-card);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      box-shadow: 0 18px 50px rgba(0,0,0,0.10);
    }
    [data-theme="dark"] .glass-panel {
      box-shadow: 0 24px 70px rgba(0,0,0,0.35);
    }
    .glass-panel::before {
      content: "";
      position: absolute;
      inset: -2px;
      background:
        radial-gradient(600px 220px at 20% 0%, rgba(99,102,241,0.12), transparent 62%),
        radial-gradient(560px 220px at 85% 10%, rgba(34,197,94,0.10), transparent 62%),
        linear-gradient(120deg, rgba(255,255,255,0.12), rgba(255,255,255,0.04));
      opacity: 0.65;
      pointer-events: none;
    }
    [data-theme="dark"] .glass-panel::before {
      background:
        radial-gradient(600px 220px at 20% 0%, rgba(99,102,241,0.16), transparent 62%),
        radial-gradient(560px 220px at 85% 10%, rgba(34,197,94,0.12), transparent 62%),
        linear-gradient(120deg, rgba(255,255,255,0.06), rgba(255,255,255,0.015));
      opacity: 0.8;
    }
    .glass-panel::after {
      content: none;
    }
    .glass-panel > * { position: relative; z-index: 1; }

    /* Forms (Stock In / Stock Out) */
    .page-centered {
      width: 100%;
      max-width: 720px;
      margin: 0 auto;
    }
    .card-pad {
      padding: clamp(16px, 3.6vw, 32px);
    }
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    .grid-qty {
      display: grid;
      grid-template-columns: 1fr 180px;
      gap: 12px;
    }
    @media (max-width: 720px) {
      .grid-2 { grid-template-columns: 1fr; }
      .grid-qty { grid-template-columns: 1fr; }
    }
    .zt-calc-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 16px;
    }
    @media (max-width: 560px) {
      .zt-calc-grid { grid-template-columns: 1fr !important; gap: 0 !important; }
      .zt-calc-grid > div { padding: 10px 0 !important; border-left: none !important; border-top: 1px solid rgba(148,163,184,0.25); }
      .zt-calc-grid > div:first-child { border-top: none; padding-top: 0 !important; }
    }

    /* App-wide responsiveness */
    .app-header { padding: var(--header-pad-y) var(--header-pad-x) !important; }
    .app-content { padding: var(--content-pad-y) var(--content-pad-x) !important; }
    .sidebar { width: var(--sidebar-w); }
    .sidebar { backdrop-filter: blur(25px); -webkit-backdrop-filter: blur(25px); }
    /* Stronger nav glass blur everywhere inside the sidebar */
    .sidebar .nav-select,
    .sidebar .glass-dd-btn,
    .sidebar .glass-dd-list {
      backdrop-filter: blur(25px);
      -webkit-backdrop-filter: blur(25px);
    }
    .nav-section { padding: 10px 12px; margin-top: 6px; }
    .nav-label {
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      color: rgba(255, 255, 255, 0.92);
      margin: 10px 8px 6px;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      line-height: 1;
    }
    .nav-label svg {
      width: 14px;
      height: 14px;
      display: block;
      transform: translateY(-0.5px);
    }
    .nav-select {
      width: 100%;
      padding: 11px 12px;
      border-radius: 12px;
      border: 1px solid rgba(255,255,255,0.26);
      background: linear-gradient(180deg, rgba(255,255,255,0.16), rgba(255,255,255,0.10));
      color: #fff;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      outline: none;
      transition: background 160ms ease, border-color 160ms ease, transform 160ms ease, box-shadow 160ms ease;
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      box-shadow: 0 14px 34px rgba(0, 0, 0, 0.22);
      appearance: none;
    }
    .nav-select:hover {
      background: linear-gradient(180deg, rgba(255,255,255,0.20), rgba(255,255,255,0.12));
      border-color: rgba(255,255,255,0.38);
      transform: translateY(-0.5px);
    }
    .nav-select:active { transform: translateY(0px); }
    .nav-select:focus {
      border-color: rgba(165, 180, 252, 0.95);
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.28), 0 14px 34px rgba(0, 0, 0, 0.22);
    }
    .nav-select option {
      background: #0b1020;
      color: #ffffff;
    }

    /* Custom glass dropdown (consistent across browsers) */
    .glass-dd { position: relative; width: 100%; }
    .glass-dd-btn {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      padding: 11px 12px;
      border-radius: 12px;
      border: 1px solid rgba(255,255,255,0.26);
      background: linear-gradient(180deg, rgba(255,255,255,0.16), rgba(255,255,255,0.10));
      color: #fff;
      font-size: 13px;
      font-weight: 800;
      cursor: pointer;
      outline: none;
      transition: background 160ms ease, border-color 160ms ease, transform 160ms ease, box-shadow 160ms ease;
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      box-shadow: 0 14px 34px rgba(0, 0, 0, 0.22);
    }
    .glass-dd-btn:hover {
      background: linear-gradient(180deg, rgba(255,255,255,0.20), rgba(255,255,255,0.12));
      border-color: rgba(255,255,255,0.38);
      transform: translateY(-0.5px);
    }
    .glass-dd-btn:active { transform: translateY(0px); }
    .glass-dd-btn:focus {
      border-color: rgba(165, 180, 252, 0.95);
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.28), 0 14px 34px rgba(0, 0, 0, 0.22);
    }
    .glass-dd-value { display: flex; align-items: baseline; gap: 8px; min-width: 0; }
    .glass-dd-sub { font-size: 11px; font-weight: 800; color: rgba(255,255,255,0.72); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .glass-dd-list {
      position: absolute;
      left: 0;
      right: 0;
      top: calc(100% + 8px);
      border-radius: 14px;
      border: 1px solid rgba(255,255,255,0.18);
      background: rgba(10, 14, 28, 0.72);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      box-shadow: 0 22px 60px rgba(0, 0, 0, 0.42);
      overflow: hidden;
      z-index: 2000;
    }
    .glass-dd-item {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      padding: 10px 12px;
      cursor: pointer;
      color: rgba(255,255,255,0.94);
      font-size: 13px;
      font-weight: 800;
      border: none;
      background: transparent;
      text-align: left;
      transition: background 120ms ease;
    }
    .glass-dd-item:hover { background: rgba(255,255,255,0.10); }
    .glass-dd-item small { color: rgba(255,255,255,0.72); font-weight: 800; font-size: 11px; }
    .glass-dd-item.is-active { background: rgba(99, 102, 241, 0.22); }

    /* Header language dropdown: same glass look */
    .header-dd { width: 180px; }
    .header-dd .glass-dd-btn {
      box-shadow: 0 12px 28px rgba(0, 0, 0, 0.12);
      border: 1px solid var(--border);
      background: linear-gradient(180deg, rgba(255,255,255,0.70), rgba(255,255,255,0.45));
      color: var(--text);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
    }
    [data-theme="dark"] .header-dd .glass-dd-btn {
      background: linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0.06));
      color: rgba(255,255,255,0.92);
      border-color: rgba(255,255,255,0.14);
      box-shadow: 0 14px 34px rgba(0, 0, 0, 0.28);
    }

    /* Inventory unit dropdown: compact, matches app theme */
    .inv-dd { width: auto; min-width: 120px; }
    .inv-dd .glass-dd-btn {
      padding: 6px 10px;
      border-radius: 10px;
      font-size: 12px;
      font-weight: 800;
      border: 1px solid var(--border);
      background: linear-gradient(180deg, rgba(255,255,255,0.70), rgba(255,255,255,0.46));
      color: var(--text);
      box-shadow: 0 12px 26px rgba(2, 6, 23, 0.10);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
    }
    [data-theme="dark"] .inv-dd .glass-dd-btn {
      background: linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0.06));
      color: rgba(255,255,255,0.92);
      border-color: rgba(255,255,255,0.14);
      box-shadow: 0 14px 34px rgba(0, 0, 0, 0.28);
    }
    .inv-dd .glass-dd-sub { color: rgba(15,23,42,0.60); font-weight: 800; }
    [data-theme="dark"] .inv-dd .glass-dd-sub { color: rgba(255,255,255,0.62); }
    .inv-dd .glass-dd-list {
      top: calc(100% + 8px);
      min-width: 180px;
      right: auto;
      left: 0;
      background: rgba(255,255,255,0.86);
      border: 1px solid rgba(148,163,184,0.35);
      box-shadow: 0 22px 60px rgba(2, 6, 23, 0.18);
    }
    [data-theme="dark"] .inv-dd .glass-dd-list {
      background: rgba(10, 14, 28, 0.78);
      border-color: rgba(255,255,255,0.14);
      box-shadow: 0 22px 60px rgba(0, 0, 0, 0.42);
    }
    .inv-dd .glass-dd-item { color: rgba(15,23,42,0.92); }
    [data-theme="dark"] .inv-dd .glass-dd-item { color: rgba(255,255,255,0.94); }
    .inv-dd .glass-dd-item:hover { background: rgba(99,102,241,0.10); }
    [data-theme="dark"] .inv-dd .glass-dd-item:hover { background: rgba(255,255,255,0.10); }

    @media (max-width: 1024px) {
      :root {
        --header-pad-x: 20px;
        --content-pad-x: 20px;
      }
      .dash-charts { grid-template-columns: 1fr !important; }
      .dash-bottom { grid-template-columns: 1fr !important; }
    }

    @media (max-width: 720px) {
      :root {
        --header-pad-x: 14px;
        --header-pad-y: 12px;
        --content-pad-x: 14px;
        --content-pad-y: 16px;
      }
      .app-header { flex-wrap: wrap; }
      .hide-sm { display: none !important; }
      .page-centered { max-width: 100%; }
      .table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
      .app-content { max-width: 100vw; overflow-x: hidden; }
      img, svg, canvas { max-width: 100%; height: auto; }
      table { width: 100%; }
      /* Any wide content becomes scrollable instead of overflowing */
      .app-content > div { max-width: 100%; }
      .app-content * { min-width: 0; }
    .recent-card { padding: 16px !important; }
    .recent-table th { padding: 8px 10px !important; font-size: 11px !important; }
    .recent-table td { padding: 10px 10px !important; font-size: 13px !important; }
    .chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 700;
      white-space: nowrap;
      line-height: 1;
    }
    .mono { font-family: 'Space Mono', monospace; }

      /* Mobile drawer sidebar */
      .sidebar {
        position: fixed !important;
        top: 0;
        bottom: 0;
        left: 0;
        width: min(var(--sidebar-w), 86vw) !important;
        transform: translateX(-102%);
        transition: transform 180ms ease, box-shadow 180ms ease;
        box-shadow: none;
        z-index: 120;
      }
      .sidebar.is-open {
        transform: translateX(0);
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.35);
      }
      .sidebar.is-open .nav-item {
        animation: navIn 160ms ease both;
      }
      .sidebar.is-open .nav-item:nth-child(1) { animation-delay: 10ms; }
      .sidebar.is-open .nav-item:nth-child(2) { animation-delay: 25ms; }
      .sidebar.is-open .nav-item:nth-child(3) { animation-delay: 40ms; }
      .sidebar.is-open .nav-item:nth-child(4) { animation-delay: 55ms; }
      .sidebar.is-open .nav-item:nth-child(5) { animation-delay: 70ms; }
      @keyframes navIn {
        from { opacity: 0; transform: translateX(-8px); }
        to { opacity: 1; transform: translateX(0); }
      }
      .backdrop {
        position: fixed;
        inset: 0;
        background: rgba(2, 6, 23, 0.5);
        z-index: 110;
      }
      .main {
        margin-left: 0 !important;
      }
    }
  `;

  return (
    <>
      <style>{css}</style>
      <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
        {sidebarOpen && <div className="backdrop" onClick={() => setSidebarOpen(false)} />}
        {/* Sidebar */}
        <aside
          className={`sidebar ${sidebarOpen ? "is-open" : ""}`}
          style={{
            width: sidebarOpen ? "var(--sidebar-w)" : 0,
            overflow: "hidden",
            transition: "width 0.3s",
            background: "var(--bg-sidebar)",
            display: "flex",
            flexDirection: "column",
            position: "fixed",
            left: 0,
            top: 0,
            bottom: 0,
            zIndex: 120,
          }}
        >
          <div style={{ padding: "24px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 38, height: 38,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <img src={LOGO_SRC} alt="ZuriTrack" style={{ width: 24, height: 24, objectFit: "contain" }} />
              </div>
              <div>
                <div style={{ color: "#fff", fontWeight: 700, fontSize: 17, letterSpacing: -0.5 }}>ZuriTrack</div>
                <div style={{ color: "var(--text-sidebar)", fontSize: 11 }}>{tr("common.inventoryManager")}</div>
              </div>
            </div>
          </div>
          <nav style={{ padding: "16px 12px", flex: 1 }}>
            {[
              { id: "dashboard", icon: Icons.dashboard, labelKey: "nav.dashboard" },
              { id: "stockIn", icon: Icons.stockIn, labelKey: "nav.stockIn" },
              { id: "stockOut", icon: Icons.stockOut, labelKey: "nav.stockOut" },
              { id: "inventory", icon: Icons.inventory, labelKey: "nav.inventory" },
              { id: "reports", icon: Icons.reports, labelKey: "nav.reports" },
              { id: "uptime", icon: Icons.uptime, labelKey: "nav.uptime" },
            ].map(item => (
              <div
                key={item.id}
                className="nav-item"
                onClick={() => { setPage(item.id); if (isPhone()) setSidebarOpen(false); }}
                style={{
                  padding: "12px 16px", display: "flex", alignItems: "center", gap: 12,
                  marginBottom: 4, color: page === item.id ? "var(--text-sidebar-active)" : "var(--text-sidebar)",
                  background: page === item.id ? "rgba(255,255,255,0.12)" : "transparent",
                  fontWeight: page === item.id ? 600 : 400, fontSize: 14,
                }}
              >
                {item.icon}
                {tr(item.labelKey)}
                {item.id === "inventory" && lowStockProducts.length > 0 && (
                  <span style={{
                    marginLeft: "auto", background: "#ef4444", color: "#fff", fontSize: 11,
                    padding: "2px 8px", borderRadius: 20, fontWeight: 700,
                  }}>{lowStockProducts.length}</span>
                )}
              </div>
            ))}

            {/* Currency (under Reports) */}
            <div className="nav-section">
              <div className="nav-label">
                <span style={{ display: "inline-flex", opacity: 0.95 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M3 7h18v10H3V7Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                    <path d="M6 10h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M6 14h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M16 10h2M16 14h2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </span>
                Currency
              </div>
              <div className="glass-dd" ref={currencyWrapRef}>
                <button
                  type="button"
                  className="glass-dd-btn"
                  onClick={() => setCurrencyOpen(v => !v)}
                  aria-haspopup="listbox"
                  aria-expanded={currencyOpen ? "true" : "false"}
                >
                  <span className="glass-dd-value">
                    <span>{currency}</span>
                    <span className="glass-dd-sub">{currencyLabel(currency)}</span>
                  </span>
                  <span aria-hidden="true" style={{ opacity: 0.9, display: "inline-flex" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                </button>

                {currencyOpen && (
                  <div className="glass-dd-list" role="listbox" aria-label="Currency options">
                    {CURRENCIES.map(([code, label]) => (
                      <button
                        type="button"
                        key={code}
                        className={`glass-dd-item ${currency === code ? "is-active" : ""}`}
                        onClick={() => { setCurrency(code); setCurrencyOpen(false); }}
                      >
                        <span>{label}</span>
                        <small>{code}</small>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Theme */}
            <div className="nav-section">
              <div className="nav-label">Theme</div>
              <div style={{ display: "flex", gap: 6, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.14)", borderRadius: 14, padding: 4 }}>
                {[
                  ["light", "Light"],
                  ["dark", "Dark"],
                  ["system", "System"],
                ].map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    className="btn"
                    onClick={() => setTheme(id)}
                    style={{
                      flex: 1,
                      padding: "9px 10px",
                      fontSize: 12,
                      fontWeight: 800,
                      borderRadius: 12,
                      background: theme === id ? "rgba(255,255,255,0.16)" : "transparent",
                      border: theme === id ? "1px solid rgba(255,255,255,0.22)" : "1px solid transparent",
                      color: "#fff",
                      cursor: "pointer",
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </nav>
          <div style={{ padding: "16px 20px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <button
                type="button"
                onClick={pickProfileImage}
                title="Change profile image"
                style={{
                  width: 36, height: 36, borderRadius: "50%",
                  background: "linear-gradient(135deg, #c084fc, #818cf8)",
                  display: "grid", placeItems: "center",
                  border: "1px solid rgba(255,255,255,0.18)",
                  overflow: "hidden",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                {user?.avatarDataUrl ? (
                  <img src={user.avatarDataUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <span style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>
                    {(user?.shopName || user?.email || "U").charAt(0).toUpperCase()}
                  </span>
                )}
              </button>
              <input
                ref={profileImgInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => onProfileImageFile(e.target.files?.[0])}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: "#fff", fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user?.shopName || tr("common.myShop")}
                </div>
                <div style={{ color: "var(--text-sidebar)", fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user?.email || tr("common.admin")} • {(user?.role === "admin") ? "Admin" : "Stock Manager"}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <button
                type="button"
                className="btn"
                onClick={() => onUpdateUser?.({ role: "stock_manager" })}
                style={{
                  flex: 1,
                  padding: "8px 10px",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.14)",
                  background: user?.role !== "admin" ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.06)",
                  color: "#fff",
                  fontWeight: 800,
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                Stock Manager
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => onUpdateUser?.({ role: "admin" })}
                style={{
                  flex: 1,
                  padding: "8px 10px",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.14)",
                  background: user?.role === "admin" ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.06)",
                  color: "#fff",
                  fontWeight: 800,
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                Admin
              </button>
            </div>
            <button onClick={onLogout} className="nav-item" style={{
              width: "100%", padding: "9px 14px", display: "flex", alignItems: "center", gap: 8,
              background: "rgba(239,68,68,0.1)", border: "none", color: "#fca5a5",
              fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              {tr("common.logout")}
            </button>
            <div style={{ marginTop: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 10, color: "var(--text-sidebar)" }}>
              <span>Powered by</span>
              <img src={POWERED_BY_LOGO_SRC} alt="PixelSpring" style={{ width: 14, height: 14, objectFit: "contain" }} />
              <span style={{ color: "#fff", fontWeight: 700 }}>PixelSpring</span>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="main" style={{ flex: 1, marginLeft: sidebarOpen ? "var(--sidebar-w)" : 0, transition: "margin-left 0.3s" }}>
          {/* Header */}
          <header style={{
            padding: "16px 32px",
            background: "var(--header-glass, linear-gradient(180deg, rgba(255,255,255,0.70), rgba(255,255,255,0.46)))",
            borderBottom: "1px solid var(--border)",
            display: "flex", alignItems: "center", gap: 16, position: "sticky", top: 0, zIndex: 50,
            backdropFilter: "blur(25px)",
            WebkitBackdropFilter: "blur(25px)",
          }} className="app-header">
            <button className="btn" onClick={() => setSidebarOpen(!sidebarOpen)} style={{ padding: 8, background: "transparent", color: "var(--text)" }}>
              {Icons.menu}
            </button>
            <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.5 }}>
              {page === "dashboard"
                ? tr("nav.dashboard")
                : page === "uptime"
                  ? tr("nav.uptime")
                : page === "stockIn"
                ? tr("nav.stockIn")
                : page === "stockOut"
                  ? tr("nav.stockOut")
                  : page === "inventory"
                    ? tr("nav.inventory")
                    : tr("nav.reports")}
            </h1>
            <div style={{ flex: 1 }} />
            <div className="hide-sm" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-dim)" }}>
              {new Date().toLocaleDateString(localeForLang(lang), { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 4px" }} title={tr("common.language")}>
              <span style={{ color: "var(--text-dim)", display: "inline-flex", alignItems: "center" }}>{Icons.globe}</span>
              <div className="glass-dd header-dd" ref={langWrapRef}>
                <button
                  type="button"
                  className="glass-dd-btn"
                  onClick={() => setLangOpen(v => !v)}
                  aria-haspopup="listbox"
                  aria-expanded={langOpen ? "true" : "false"}
                  style={{ padding: "9px 12px", borderRadius: 12, fontSize: 12 }}
                >
                  <span className="glass-dd-value">
                    <span style={{ fontFamily: "'Space Mono', monospace", fontWeight: 800 }}>{lang.toUpperCase()}</span>
                    <span className="glass-dd-sub" style={{ color: "inherit", opacity: 0.75 }}>{LANGS[lang]}</span>
                  </span>
                  <span aria-hidden="true" style={{ opacity: 0.8, display: "inline-flex" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                </button>

                {langOpen && (
                  <div className="glass-dd-list" role="listbox" aria-label="Language options" style={{ top: "calc(100% + 10px)" }}>
                    {LANG_OPTIONS.map(([code, label]) => (
                      <button
                        type="button"
                        key={code}
                        className={`glass-dd-item ${lang === code ? "is-active" : ""}`}
                        onClick={() => { setLang(code); setLangOpen(false); }}
                      >
                        <span>{label}</span>
                        <small>{code.toUpperCase()}</small>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={saveNow}
              disabled={saveStatus === "saving"}
              className="btn"
              style={{
                padding: "9px 12px",
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                color: "var(--text-dim)",
                borderRadius: 12,
                display: "flex",
                alignItems: "center",
                gap: 8,
                cursor: saveStatus === "saving" ? "wait" : "pointer",
                fontSize: 12,
                fontWeight: 700,
                opacity: saveStatus === "saving" ? 0.7 : 1,
              }}
              title={tr("common.saveTitle")}
            >
              {Icons.save} {saveStatus === "saving" ? tr("common.saving") : tr("common.save")}
            </button>
            <div style={{ position: "relative" }}>
              <div style={{ cursor: "pointer", color: "var(--text-dim)" }}>{Icons.bell}</div>
              {lowStockProducts.length > 0 && <div style={{ position: "absolute", top: -2, right: -2, width: 8, height: 8, borderRadius: "50%", background: "#ef4444" }} />}
            </div>
          </header>

          <div style={{ padding: "24px 32px", animation: "fadeIn 0.3s ease" }} className="app-content">
            {page === "dashboard" && <DashboardPage stats={stats} period={period} setPeriod={setPeriod} chartData={chartData} topProducts={topProducts} lowStockProducts={lowStockProducts} products={products} transactions={transactions} COLORS={COLORS} t={tr} currency={currency} />}
            {page === "uptime" && <UptimePage uptimeSec={uptimeSec} points={uptimePoints} logs={uptimeLogs} />}
            {page === "stockIn" && <StockInPage products={products} addTransaction={addTransaction} findOrCreateProduct={findOrCreateProduct} updateProductPrice={updateProductPrice} showToast={showToast} t={tr} tf={trf} lang={lang} currency={currency} />}
            {page === "stockOut" && <StockOutPage products={products} addTransaction={addTransaction} updateProductPrice={updateProductPrice} showToast={showToast} t={tr} tf={trf} lang={lang} currency={currency} />}
            {page === "inventory" && <InventoryPage products={products} updateProductPrice={updateProductPrice} removeProduct={removeProduct} undoRemoveProduct={undoRemoveProduct} hasUndo={!!lastDeleted} showToast={showToast} t={tr} />}
            {page === "reports" && <ReportsPage transactions={transactions} products={products} onImportData={importAppData} onExportData={exportAppData} showToast={showToast} t={tr} lang={lang} />}
          </div>
        </main>

        {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      </div>
    </>
  );
}

// ─── DASHBOARD ───
function DashboardPage({ stats, period, setPeriod, chartData, topProducts, lowStockProducts, products, transactions, COLORS, t, currency }) {
  const periodButtons = ["today", "weekly", "monthly", "yearly"];
  const recentTxns = transactions.slice(0, 8);
  const tt = t || ((k) => k);
  const unitByName = useMemo(() => {
    const m = {};
    (products || []).forEach((p) => { if (p && p.name) m[p.name] = p.unit; });
    return m;
  }, [products]);
  const [showCharts, setShowCharts] = useState(true);
  const [isSmall, setIsSmall] = useState(false);
  const stockDistribution = products
    .filter(p => p.stock > 0)
    .slice(0, 8)
    .map((p, i) => ({ name: p.name, value: p.stock, color: COLORS[i % COLORS.length] }));
  const totalStock = stockDistribution.reduce((sum, p) => sum + p.value, 0);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setShowCharts(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia ? window.matchMedia("(max-width: 720px)") : null;
    const apply = () => setIsSmall(mq ? mq.matches : (window.innerWidth <= 720));
    apply();
    if (!mq) return;
    const handler = () => apply();
    if (mq.addEventListener) mq.addEventListener("change", handler);
    else mq.addListener(handler);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", handler);
      else mq.removeListener(handler);
    };
  }, []);

  return (
    <div>
      {/* Welcome banner when empty */}
      {products.length === 0 && transactions.length === 0 && (
        <div style={{
          background: "linear-gradient(135deg, #eef2ff, #e0e7ff)", borderRadius: 20, padding: "36px 32px",
          marginBottom: 28, border: "1px solid #c7d2fe",
        }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#1e1b4b", marginBottom: 8 }}>
            {tt("common.noDataDash.title")} 🎉
          </div>
          <div style={{ fontSize: 15, color: "#4338ca", lineHeight: 1.6, maxWidth: 560 }}>
            {tt("common.noDataDash.body1")} <strong>{tt("nav.stockIn")}</strong> {tt("common.noDataDash.body2")}
            {" "}
            {tt("common.noDataDash.body3")}
          </div>
        </div>
      )}

      {/* Period selector */}
      <div style={{ display: "flex", gap: 6, marginBottom: 24 }}>
        {periodButtons.map(p => (
          <button key={p} className="btn" onClick={() => setPeriod(p)} style={{
            padding: "8px 20px", fontSize: 13, textTransform: "capitalize",
            background: period === p ? "var(--primary)" : "var(--bg-card)",
            color: period === p ? "#fff" : "var(--text-dim)", border: period === p ? "none" : "1px solid var(--border)",
          }}>{tt(`period.${p}`)}</button>
        ))}
      </div>

      {isSmall && (
        <>
          {/* Charts Row (phone first) */}
          <div className="dash-charts" style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20, marginBottom: 28 }}>
            <div className="glass-panel" style={{ padding: 24, overflow: "visible", animation: showCharts ? "chartRise 0.9s ease-out" : "none" }}>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>{tt("dashboard.salesPurchases")}</div>
              <SimpleTwoLineChart data={chartData} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div className="glass-panel" style={{ padding: 24, flex: 1, animation: showCharts ? "chartRise 0.9s ease-out" : "none" }}>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>{tt("dashboard.stockDistribution")}</div>
                <SimpleDonutChart data={stockDistribution} />
                <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: -4, marginBottom: 8 }}>
                  {tt("common.totalInStock")}: <strong style={{ color: "var(--text)" }}>{fmt(totalStock)}</strong>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
                  {stockDistribution.length === 0 ? (
                    <span style={{ fontSize: 12, color: "var(--text-dim)" }}>{tt("common.noStockYet")}</span>
                  ) : stockDistribution.map((s, i) => (
                    <span key={i} style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: s.color, display: "inline-block" }} />
                      {s.name} ({fmt(s.value)})
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Stat Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20, marginBottom: 28 }}>
            {[
              { label: tt("dashboard.totalSales"), value: fmtCur(stats.totalSales, currency), icon: Icons.trend, color: "#6366f1", bg: "var(--primary-bg)", sub: `${stats.salesCount} ${tt("common.orders")}` },
              { label: tt("dashboard.totalPurchases"), value: fmtCur(stats.totalPurchases, currency), icon: Icons.stockIn, color: "#059669", bg: "var(--green-bg)", sub: `${stats.purchaseCount} ${tt("common.entries")}` },
              { label: tt("dashboard.netProfit"), value: fmtCur(stats.totalProfit, currency), icon: Icons.trend, color: stats.totalProfit >= 0 ? "#059669" : "#dc2626", bg: stats.totalProfit >= 0 ? "var(--green-bg)" : "var(--red-bg)", sub: `${((stats.totalProfit / (stats.totalSales || 1)) * 100).toFixed(1)}% ${tt("common.margin")}` },
              { label: tt("dashboard.itemsSold"), value: fmt(stats.totalItems), icon: Icons.inventory, color: "#d97706", bg: "var(--orange-bg)", sub: tt("common.unitsTotal") },
            ].map((card, i) => (
              <div key={i} className="stat-card" style={{
                background: "var(--bg-card)", borderRadius: 16, padding: "22px 24px",
                border: "1px solid var(--border)", position: "relative", overflow: "hidden",
              }}>
                <div style={{ position: "absolute", top: 16, right: 16, width: 42, height: 42, borderRadius: 12, background: card.bg, display: "flex", alignItems: "center", justifyContent: "center", color: card.color }}>
                  {card.icon}
                </div>
                <div style={{ fontSize: 13, color: "var(--text-dim)", marginBottom: 8, fontWeight: 500 }}>{card.label}</div>
                <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -1, color: card.color, fontFamily: "'Space Mono', monospace" }}>{card.value}</div>
                <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 6 }}>{card.sub}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {!isSmall && (
        <>
          {/* Stat Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20, marginBottom: 28 }}>
            {[
              { label: tt("dashboard.totalSales"), value: fmtCur(stats.totalSales, currency), icon: Icons.trend, color: "#6366f1", bg: "var(--primary-bg)", sub: `${stats.salesCount} ${tt("common.orders")}` },
              { label: tt("dashboard.totalPurchases"), value: fmtCur(stats.totalPurchases, currency), icon: Icons.stockIn, color: "#059669", bg: "var(--green-bg)", sub: `${stats.purchaseCount} ${tt("common.entries")}` },
              { label: tt("dashboard.netProfit"), value: fmtCur(stats.totalProfit, currency), icon: Icons.trend, color: stats.totalProfit >= 0 ? "#059669" : "#dc2626", bg: stats.totalProfit >= 0 ? "var(--green-bg)" : "var(--red-bg)", sub: `${((stats.totalProfit / (stats.totalSales || 1)) * 100).toFixed(1)}% ${tt("common.margin")}` },
              { label: tt("dashboard.itemsSold"), value: fmt(stats.totalItems), icon: Icons.inventory, color: "#d97706", bg: "var(--orange-bg)", sub: tt("common.unitsTotal") },
            ].map((card, i) => (
              <div key={i} className="stat-card" style={{
                background: "var(--bg-card)", borderRadius: 16, padding: "22px 24px",
                border: "1px solid var(--border)", position: "relative", overflow: "hidden",
              }}>
                <div style={{ position: "absolute", top: 16, right: 16, width: 42, height: 42, borderRadius: 12, background: card.bg, display: "flex", alignItems: "center", justifyContent: "center", color: card.color }}>
                  {card.icon}
                </div>
                <div style={{ fontSize: 13, color: "var(--text-dim)", marginBottom: 8, fontWeight: 500 }}>{card.label}</div>
                <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -1, color: card.color, fontFamily: "'Space Mono', monospace" }}>{card.value}</div>
                <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 6 }}>{card.sub}</div>
              </div>
            ))}
          </div>

          {/* Charts Row */}
          <div className="dash-charts" style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20, marginBottom: 28 }}>
            <div className="glass-panel" style={{ padding: 24, overflow: "visible", animation: showCharts ? "chartRise 0.9s ease-out" : "none" }}>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>{tt("dashboard.salesPurchases")}</div>
              <SimpleTwoLineChart data={chartData} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div className="glass-panel" style={{ padding: 24, flex: 1, animation: showCharts ? "chartRise 0.9s ease-out" : "none" }}>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>{tt("dashboard.stockDistribution")}</div>
                <SimpleDonutChart data={stockDistribution} />
                <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: -4, marginBottom: 8 }}>
                  {tt("common.totalInStock")}: <strong style={{ color: "var(--text)" }}>{fmt(totalStock)}</strong>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
                  {stockDistribution.length === 0 ? (
                    <span style={{ fontSize: 12, color: "var(--text-dim)" }}>{tt("common.noStockYet")}</span>
                  ) : stockDistribution.map((s, i) => (
                    <span key={i} style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: s.color, display: "inline-block" }} />
                      {s.name} ({fmt(s.value)})
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Bottom Row */}
      <div className="dash-bottom" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Top Selling */}
        <div style={{ background: "var(--bg-card)", borderRadius: 16, padding: 24, border: "1px solid var(--border)" }}>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>{tt("dashboard.topSellingProducts")}</div>
          {topProducts.map((p, i) => {
            const maxQ = topProducts[0]?.qty || 1;
            return (
              <div key={p.name} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                <span style={{
                  width: 28, height: 28, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 700, background: i < 3 ? COLORS[i] : "var(--bg)", color: i < 3 ? "#fff" : "var(--text-dim)",
                }}>{i + 1}</span>
                <span style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <span style={{ display: "inline-flex", opacity: 0.9 }}><UnitIcon unit={unitByName[p.name] || "piece"} size={16} /></span>
                    <span>{p.name}</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: "var(--bg)", marginTop: 4, overflow: "hidden" }}>
                    <div style={{ height: "100%", borderRadius: 3, background: COLORS[i % COLORS.length], width: `${(p.qty / maxQ) * 100}%`, transition: "width 0.8s ease" }} />
                  </div>
                </span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-dim)", fontFamily: "'Space Mono', monospace" }}>{p.qty}</span>
              </div>
            );
          })}
        </div>

        {/* Low Stock Alerts */}
        <div style={{ background: "var(--bg-card)", borderRadius: 16, padding: 24, border: "1px solid var(--border)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 16, fontWeight: 700, marginBottom: 16 }}>
              <span style={{ color: "#ef4444" }}>{Icons.alert}</span> {tt("dashboard.lowStockAlerts")}
            </div>
          {lowStockProducts.length === 0 ? (
            <div style={{ textAlign: "center", padding: 32, color: "var(--text-dim)" }}>{tt("dashboard.allWellStocked")}</div>
          ) : lowStockProducts.slice(0, 6).map(p => (
            <div key={p.id} style={{
              display: "flex", alignItems: "center", gap: 12, marginBottom: 10, padding: "10px 14px",
              borderRadius: 10, background: p.stock < 15 ? "var(--low-bg)" : "var(--med-bg)",
            }}>
              <div style={{
                width: 10, height: 10, borderRadius: "50%",
                background: p.stock < 15 ? "var(--low-fg)" : "var(--med-fg)",
                animation: p.stock < 10 ? "pulse 2s infinite" : "none",
              }} />
              <span style={{ flex: 1, fontWeight: 500, fontSize: 14, display: "inline-flex", alignItems: "center", gap: 8 }}>
                <span style={{ display: "inline-flex", opacity: 0.9 }}><UnitIcon unit={p.unit} size={16} /></span>
                <span>{p.name}</span>
              </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: p.stock < 15 ? "var(--low-fg)" : "var(--med-fg)", fontFamily: "'Space Mono', monospace" }}>
                {p.stock} {p.unit}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="recent-card" style={{ background: "var(--bg-card)", borderRadius: 16, padding: 24, border: "1px solid var(--border)", marginTop: 20 }}>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>{tt("dashboard.recentTransactions")}</div>
        {recentTxns.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px 16px", color: "var(--text-dim)" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
            <div style={{ fontSize: 14 }}>No transactions yet. Add stock or sell products to see them here.</div>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="recent-table" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border)" }}>
                {["Product", "Type", "Qty", "Price/unit", "Total", "Profit", "Date"].map(h => (
                  <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentTxns.map(t => {
                const perUnit = t.type === "in" ? t.costPrice : t.salePrice;
                const total = perUnit * t.quantity;
                return (
                  <tr key={t.id} style={{ borderBottom: "1px solid var(--border-light)" }}>
                    <td style={{ padding: "12px", fontSize: 14, fontWeight: 500 }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                        <span style={{ display: "inline-flex", opacity: 0.9 }}><UnitIcon unit={t.unit} size={16} /></span>
                        <span>{t.productName}</span>
                      </span>
                    </td>
                    <td style={{ padding: "12px" }}>
                      <span
                        className="chip"
                        style={{
                          background: t.type === "in" ? "var(--green-bg)" : "var(--blue-bg)",
                          color: t.type === "in" ? "var(--green)" : "var(--blue)",
                        }}
                      >
                        {t.type === "in" ? Icons.stockIn : Icons.stockOut}
                        {t.type === "in" ? "Stock In" : "Sale"}
                      </span>
                    </td>
                    <td className="mono" style={{ padding: "12px", fontSize: 14, fontFamily: "'Space Mono', monospace" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <span style={{ display: "inline-flex", opacity: 0.85 }}><UnitIcon unit={t.unit} size={14} /></span>
                        <span>{t.quantity} {t.unit}</span>
                      </span>
                    </td>
                    <td className="mono" style={{ padding: "12px", fontSize: 13, fontFamily: "'Space Mono', monospace" }}>
                      {fmtCur(perUnit)}<span style={{ fontSize: 11, color: "var(--text-dim)" }}>/{t.unit}</span>
                    </td>
                    <td className="mono" style={{ padding: "12px", fontSize: 14, fontWeight: 600, fontFamily: "'Space Mono', monospace" }}>
                      {fmtCur(total)}
                    </td>
                    <td className="mono" style={{ padding: "12px", fontSize: 14, fontWeight: 600, fontFamily: "'Space Mono', monospace", color: t.profit > 0 ? "var(--green)" : "var(--text-dim)" }}>
                      {t.type === "out" ? fmtCur(t.profit) : "—"}
                    </td>
                    <td style={{ padding: "12px", fontSize: 13, color: "var(--text-dim)" }}>{t.date}</td>
                  </tr>
                );
              })}
            </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function UptimePage({ uptimeSec, points, logs }) {
  const fmtDur = (sec) => {
    const s = Math.max(0, Math.floor(sec || 0));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const ss = s % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
  };

  const data = (points || []).slice(-120); // last ~20min at 10s sampling
  // Show fewer bars for a cleaner modern look
  const BAR_COUNT = 36;
  const stride = Math.max(1, Math.floor(data.length / BAR_COUNT));
  const bars = data.filter((_, i) => i % stride === 0).slice(-BAR_COUNT);
  const maxV = Math.max(1, ...bars.map(d => Number(d.v || 0)));
  const width = 900;
  const height = 240;
  const pad = { top: 18, right: 16, bottom: 28, left: 52 };
  const chartW = width - pad.left - pad.right;
  const chartH = height - pad.top - pad.bottom;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <div style={{ width: 40, height: 40, borderRadius: 14, background: "var(--primary-bg)", display: "grid", placeItems: "center", color: "var(--primary)" }}>
          {Icons.uptime}
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.4 }}>System Uptime</div>
          <div style={{ fontSize: 12, color: "var(--text-dim)" }}>Tracks how long this session has been running.</div>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ padding: "10px 12px", borderRadius: 14, border: "1px solid var(--border)", background: "var(--bg-card)", fontFamily: "'Space Mono', monospace", fontWeight: 800, backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)" }}>
          {fmtDur(uptimeSec)}
        </div>
      </div>

      <div className="glass-panel" style={{ padding: 18, marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 900, color: "var(--text)" }}>Uptime (bar graph)</div>
          <div style={{ fontSize: 11, color: "var(--text-dim)" }}>Last ~20 minutes • sampled</div>
        </div>
        <div style={{ width: "100%", aspectRatio: `${width} / ${height}`, minHeight: 220 }}>
          <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%" preserveAspectRatio="xMidYMid meet" style={{ display: "block" }}>
            <defs>
              <linearGradient id="upBar" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#22c55e" stopOpacity="0.40" />
              </linearGradient>
              <linearGradient id="upGlow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
              </linearGradient>
              <filter id="barGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="b" />
                <feColorMatrix in="b" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.55 0" result="g" />
                <feMerge>
                  <feMergeNode in="g" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* grid */}
            {[...Array(5)].map((_, i) => {
              const y = pad.top + (i / 4) * chartH;
              return <line key={i} x1={pad.left} y1={y} x2={width - pad.right} y2={y} stroke="var(--chart-grid)" strokeWidth="1" />;
            })}
            <line x1={pad.left} y1={pad.top + chartH} x2={width - pad.right} y2={pad.top + chartH} stroke="var(--chart-axis)" />
            <line x1={pad.left} y1={pad.top} x2={pad.left} y2={pad.top + chartH} stroke="var(--chart-axis)" />

            {/* y labels */}
            {[...Array(5)].map((_, i) => {
              const v = Math.round(maxV - (i / 4) * maxV);
              const y = pad.top + (i / 4) * chartH;
              return (
                <text key={i} x={pad.left - 8} y={y + 4} textAnchor="end" fontSize="10" fill="var(--chart-text)">
                  {fmtDur(v)}
                </text>
              );
            })}

            {/* bars */}
            {(() => {
              const n = Math.max(1, bars.length);
              const gap = 6;
              const barW = Math.max(6, Math.min(18, (chartW - gap * (n - 1)) / n));
              const usedW = barW * n + gap * (n - 1);
              const x0 = pad.left + Math.max(0, (chartW - usedW) / 2);
              const baseY = pad.top + chartH;
              return bars.map((d, i) => {
                const v = Math.max(0, Number(d.v || 0));
                const h = (v / maxV) * chartH;
                const x = x0 + i * (barW + gap);
                const y = baseY - h;
                return (
                  <g key={d.t || i}>
                    <rect x={x} y={y} width={barW} height={h} rx="10" fill="url(#upBar)" filter="url(#barGlow)" opacity="0.9" />
                    <rect x={x} y={y} width={barW} height={Math.min(h, 26)} rx="10" fill="url(#upGlow)" opacity="0.9" />
                  </g>
                );
              });
            })()}

            {/* x labels (sparse) */}
            {bars.filter((_, i) => i === 0 || i === Math.floor(bars.length / 2) || i === bars.length - 1).map((d, idx) => {
              const n = Math.max(1, bars.length);
              const gap = 6;
              const barW = Math.max(6, Math.min(18, (chartW - gap * (n - 1)) / n));
              const usedW = barW * n + gap * (n - 1);
              const x0 = pad.left + Math.max(0, (chartW - usedW) / 2);
              const i = idx === 0 ? 0 : (idx === 1 ? Math.floor(bars.length / 2) : bars.length - 1);
              const x = x0 + i * (barW + gap) + barW / 2;
              const label = new Date(d.t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
              return (
                <text key={d.t || idx} x={x} y={height - 10} textAnchor="middle" fontSize="10" fill="var(--chart-text)">
                  {label}
                </text>
              );
            })}
          </svg>
        </div>
      </div>

      <div style={{ background: "var(--bg-card)", borderRadius: 16, padding: 18, border: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 800 }}>Logs</div>
          <div style={{ fontSize: 12, color: "var(--text-dim)" }}>Recent system events (this session)</div>
        </div>
        <div className="table-wrap">
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <th style={{ padding: "10px 12px", textAlign: "left", fontSize: 11, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: 0.5 }}>Time</th>
                <th style={{ padding: "10px 12px", textAlign: "left", fontSize: 11, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: 0.5 }}>Event</th>
              </tr>
            </thead>
            <tbody>
              {(logs || []).slice().reverse().slice(0, 30).map((l, i) => (
                <tr key={i} style={{ borderBottom: "1px solid var(--border-light)" }}>
                  <td style={{ padding: "10px 12px", fontSize: 12, color: "var(--text-dim)", fontFamily: "'Space Mono', monospace" }}>
                    {new Date(l.t).toLocaleTimeString()}
                  </td>
                  <td style={{ padding: "10px 12px", fontSize: 13, fontWeight: 600 }}>{l.msg}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SimpleTwoLineChart({ data }) {
  // Keep a single source of truth for line colors so the fade fill always matches.
  // (SVG gradient stops don't reliably resolve CSS variables across browsers.)
  const SALES_COLOR = "#6366f1";
  const PURCH_COLOR = "#22c55e";
  const width = 800;
  const height = 280;
  // Slightly larger padding so thick strokes/glow stay inside the frame.
  const pad = { top: 22, right: 22, bottom: 30, left: 60 };
  const chartW = width - pad.left - pad.right;
  const chartH = height - pad.top - pad.bottom;
  const maxY = Math.max(1, ...data.map(d => Math.max(0, Number(d.sales || 0), Number(d.purchases || 0))));
  const labelEvery = data.length <= 8 ? 1 : data.length <= 12 ? 2 : 3;
  const ticks = 4;

  const pointsFor = (key) => data.map((d, i) => {
    const x = pad.left + (i / Math.max(1, data.length - 1)) * chartW;
    const v = Math.max(0, Number(d[key] || 0));
    const yy = pad.top + (1 - v / maxY) * chartH;
    const y = Math.max(pad.top, Math.min(pad.top + chartH, yy));
    return [x, y];
  });

  const salesPts = pointsFor("sales");
  const purchPts = pointsFor("purchases");
  const mkSmoothPath = (pts, tension = 0.18) => {
    if (!pts || pts.length === 0) return "";
    if (pts.length === 1) return `M${pts[0][0].toFixed(2)},${pts[0][1].toFixed(2)}`;
    const t = Math.max(0, Math.min(0.5, tension));
    const yMin = pad.top;
    const yMax = pad.top + chartH;
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const c = (p0, p1, p2, p3) => {
      const x1 = p1[0] + (p2[0] - p0[0]) * t;
      const y1 = clamp(p1[1] + (p2[1] - p0[1]) * t, yMin, yMax);
      const x2 = p2[0] - (p3[0] - p1[0]) * t;
      const y2 = clamp(p2[1] - (p3[1] - p1[1]) * t, yMin, yMax);
      return [x1, y1, x2, y2];
    };
    let d = `M${pts[0][0].toFixed(2)},${pts[0][1].toFixed(2)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2] || p2;
      const [x1, y1, x2, y2] = c(p0, p1, p2, p3);
      d += ` C${x1.toFixed(2)},${y1.toFixed(2)} ${x2.toFixed(2)},${y2.toFixed(2)} ${p2[0].toFixed(2)},${p2[1].toFixed(2)}`;
    }
    return d;
  };
  const salesPath = mkSmoothPath(salesPts, 0.18);
  const purchPath = mkSmoothPath(purchPts, 0.18);
  const baseY = pad.top + chartH;
  const mkAreaPath = (linePath, pts) => {
    if (!linePath || !pts || pts.length < 2) return "";
    const last = pts[pts.length - 1];
    const first = pts[0];
    return `${linePath} L${last[0].toFixed(2)},${baseY.toFixed(2)} L${first[0].toFixed(2)},${baseY.toFixed(2)} Z`;
  };
  const salesArea = mkAreaPath(salesPath, salesPts);
  const purchArea = mkAreaPath(purchPath, purchPts);

  return (
    <div style={{ width: "100%", padding: 6 }}>
      <div style={{ width: "100%", overflow: "hidden", aspectRatio: `${width} / ${height}`, minHeight: 220 }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          width="100%"
          height="100%"
          preserveAspectRatio="xMidYMid meet"
          style={{ overflow: "hidden", display: "block" }}
        >
          <defs>
          <linearGradient id="salesGlow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={SALES_COLOR} stopOpacity="0.14" />
            <stop offset="100%" stopColor={SALES_COLOR} stopOpacity="0" />
          </linearGradient>
          <linearGradient id="purchGlow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={PURCH_COLOR} stopOpacity="0.12" />
            <stop offset="100%" stopColor={PURCH_COLOR} stopOpacity="0" />
          </linearGradient>
          <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feColorMatrix
              in="blur"
              type="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.8 0"
              result="glow"
            />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          </defs>

          {/* Soft gradient fills under lines */}
          {salesArea && <path d={salesArea} fill="url(#salesGlow)" stroke="none" />}
          {purchArea && <path d={purchArea} fill="url(#purchGlow)" stroke="none" />}

          {[...Array(ticks + 1)].map((_, i) => {
            const y = pad.top + (i / ticks) * chartH;
            return <line key={i} x1={pad.left} y1={y} x2={width - pad.right} y2={y} stroke="var(--chart-grid)" strokeWidth="1" />;
          })}

          <line x1={pad.left} y1={pad.top + chartH} x2={width - pad.right} y2={pad.top + chartH} stroke="var(--chart-axis)" />
          <line x1={pad.left} y1={pad.top} x2={pad.left} y2={pad.top + chartH} stroke="var(--chart-axis)" />

          {[...Array(ticks + 1)].map((_, i) => {
            const val = Math.max(0, Math.round(maxY - (i / ticks) * maxY));
            const y = pad.top + (i / ticks) * chartH;
            return (
              <text key={i} x={pad.left - 8} y={y + 4} textAnchor="end" fontSize="10" fill="var(--chart-text)">
                {fmt(val)}
              </text>
            );
          })}

          {data.filter((_, i) => i % labelEvery === 0).map((d, idx) => {
            const i = idx * labelEvery;
            const x = pad.left + (i / Math.max(1, data.length - 1)) * chartW;
            return (
              <text key={d.date + i} x={x} y={height - 8} textAnchor="middle" fontSize="10" fill="var(--chart-text)">
                {d.date}
              </text>
            );
          })}

          <path d={salesPath} fill="none" stroke={SALES_COLOR} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" opacity="0.16" filter="url(#softGlow)" />
          <path
            d={salesPath}
            fill="none"
            stroke={SALES_COLOR}
            strokeWidth="3.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength="100"
            strokeDasharray="100"
            strokeDashoffset="100"
            style={{ animation: "chartDraw 2.6s cubic-bezier(0.22, 1, 0.36, 1) forwards" }}
          />
          <path d={purchPath} fill="none" stroke={PURCH_COLOR} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" opacity="0.14" filter="url(#softGlow)" />
          <path
            d={purchPath}
            fill="none"
            stroke={PURCH_COLOR}
            strokeWidth="3.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength="100"
            strokeDasharray="100"
            strokeDashoffset="100"
            style={{ animation: "chartDraw 2.6s cubic-bezier(0.22, 1, 0.36, 1) 0.16s forwards" }}
          />
        </svg>
      </div>
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 10, fontSize: 12, color: "var(--text-dim)", flexWrap: "wrap" }}>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "6px 10px", borderRadius: 999,
          border: "1px solid rgba(99,102,241,0.28)",
          background: "rgba(99,102,241,0.10)",
          color: "var(--text)",
          fontWeight: 800,
        }}>
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#6366f1", display: "inline-block", boxShadow: "0 0 0 4px rgba(99,102,241,0.12)" }} />
          Sales
        </span>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "6px 10px", borderRadius: 999,
          border: "1px solid rgba(34,197,94,0.28)",
          background: "rgba(34,197,94,0.10)",
          color: "var(--text)",
          fontWeight: 800,
        }}>
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#22c55e", display: "inline-block", boxShadow: "0 0 0 4px rgba(34,197,94,0.12)" }} />
          Purchases
        </span>
        <span className="hide-sm" style={{ marginLeft: 6, fontSize: 11, color: "var(--text-dim)", opacity: 0.85 }}>
          Blue line = <strong>Sales</strong>, Green line = <strong>Purchases</strong>
        </span>
      </div>
    </div>
  );
}

function SimpleScatterCorrelation({ data, xKey, yKey, xLabel, yLabel, dotColor = "rgba(99,102,241,0.9)" }) {
  const width = 360;
  const height = 200;
  const pad = { top: 16, right: 12, bottom: 28, left: 44 };
  const pts = (Array.isArray(data) ? data : [])
    .map((d) => [Number(d?.[xKey] ?? 0), Number(d?.[yKey] ?? 0)])
    .filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y));

  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const minX = Math.min(...xs, 0);
  const maxX = Math.max(...xs, 1);
  const minY = Math.min(...ys, 0);
  const maxY = Math.max(...ys, 1);

  const safeRange = (a, b) => (b - a === 0 ? 1 : (b - a));
  const xRange = safeRange(minX, maxX);
  const yRange = safeRange(minY, maxY);

  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;
  const mapX = (x) => pad.left + ((x - minX) / xRange) * plotW;
  const mapY = (y) => pad.top + (1 - (y - minY) / yRange) * plotH;

  const pearsonR = (() => {
    if (pts.length < 2) return 0;
    const n = pts.length;
    const mean = (arr) => arr.reduce((s, v) => s + v, 0) / n;
    const mx = mean(xs);
    const my = mean(ys);
    let num = 0;
    let dx = 0;
    let dy = 0;
    for (let i = 0; i < n; i++) {
      const a = xs[i] - mx;
      const b = ys[i] - my;
      num += a * b;
      dx += a * a;
      dy += b * b;
    }
    const den = Math.sqrt(dx * dy);
    return den === 0 ? 0 : (num / den);
  })();

  return (
    <div style={{ width: "100%", height: 200 }}>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%" preserveAspectRatio="xMidYMid meet" style={{ display: "block" }}>
        <line x1={pad.left} y1={pad.top + plotH} x2={width - pad.right} y2={pad.top + plotH} stroke="var(--chart-axis)" />
        <line x1={pad.left} y1={pad.top} x2={pad.left} y2={pad.top + plotH} stroke="var(--chart-axis)" />
        {[0.25, 0.5, 0.75].map((t, i) => (
          <line key={i} x1={pad.left} y1={pad.top + t * plotH} x2={width - pad.right} y2={pad.top + t * plotH} stroke="var(--chart-grid)" />
        ))}
        {pts.slice(0, 220).map(([x, y], i) => (
          <circle key={i} cx={mapX(x)} cy={mapY(y)} r="3.2" fill={dotColor} opacity="0.85" />
        ))}
        <text x={width - pad.right} y={pad.top + 10} textAnchor="end" fontSize="11" fill="var(--chart-text)">
          r={pearsonR.toFixed(2)}
        </text>
        <text x={width / 2} y={height - 8} textAnchor="middle" fontSize="10" fill="var(--chart-text)">{xLabel}</text>
        <text x={12} y={height / 2} textAnchor="middle" fontSize="10" fill="var(--chart-text)" transform={`rotate(-90 12 ${height / 2})`}>{yLabel}</text>
      </svg>
    </div>
  );
}

function SimpleDonutChart({ data }) {
  const size = 160;
  const cx = size / 2;
  const cy = size / 2;
  const r = 52;
  const stroke = 22;
  const total = Math.max(1, data.reduce((s, d) => s + Number(d.value || 0), 0));
  let acc = 0;

  return (
    <div style={{ width: "100%", height: 160, display: "grid", placeItems: "center" }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--chart-grid)" strokeWidth={stroke} />
        {data.map((d, i) => {
          const frac = Number(d.value || 0) / total;
          const start = (acc / total) * Math.PI * 2 - Math.PI / 2;
          acc += Number(d.value || 0);
          const end = (acc / total) * Math.PI * 2 - Math.PI / 2;
          const x1 = cx + r * Math.cos(start);
          const y1 = cy + r * Math.sin(start);
          const x2 = cx + r * Math.cos(end);
          const y2 = cy + r * Math.sin(end);
          const large = frac > 0.5 ? 1 : 0;
          const dPath = `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
          return (
            <path
              key={d.name + i}
              d={dPath}
              fill="none"
              stroke={d.color}
              strokeWidth={stroke}
              strokeLinecap="butt"
              pathLength="100"
              strokeDasharray="100"
              strokeDashoffset="100"
              style={{ animation: `chartDraw 3s cubic-bezier(0.22, 1, 0.36, 1) ${i * 0.14}s forwards` }}
            />
          );
        })}
        <circle cx={cx} cy={cy} r={r - stroke / 2} fill="var(--chart-donut-hole)" />
      </svg>
    </div>
  );
}

// ─── STOCK IN ───
function StockInPage({ products, addTransaction, findOrCreateProduct, showToast, updateProductPrice, t, tf, lang, currency }) {
  const tt = t || ((k) => k);
  const ttf = tf || ((k, vars = {}) => {
    let str = tt(k);
    Object.entries(vars).forEach(([kk, vv]) => { str = str.replaceAll(`{${kk}}`, String(vv)); });
    return str;
  });
  const [name, setName] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [qty, setQty] = useState("");
  const [unit, setUnit] = useState("kg");
  const [date, setDate] = useState(today());
  const [time, setTime] = useState(nowTime());
  const [multiInput, setMultiInput] = useState("");
  const [mode, setMode] = useState("single");
  // Cost calculation mode: "total" = enter total paid, "perUnit" = enter price per unit
  const [costMode, setCostMode] = useState("total");
  const [totalPaid, setTotalPaid] = useState("");
  const [pricePerUnit, setPricePerUnit] = useState("");
  const [salePricePerUnitInput, setSalePricePerUnitInput] = useState("");

  // Multi-item defaults (optional): applied to each parsed item
  const [multiCostPerUnitInput, setMultiCostPerUnitInput] = useState("");
  const [multiSalePerUnitInput, setMultiSalePerUnitInput] = useState("");

  const calcCostPerUnit = costMode === "total"
    ? (totalPaid && qty ? parseFloat(totalPaid) / parseFloat(qty) : 0)
    : (pricePerUnit ? parseFloat(pricePerUnit) : 0);

  const calcTotalCost = costMode === "total"
    ? (totalPaid ? parseFloat(totalPaid) : 0)
    : (pricePerUnit && qty ? parseFloat(pricePerUnit) * parseFloat(qty) : 0);

  // Values are typed in current display currency. Convert to base before formatting,
  // because fmtCur() expects base values and applies currency formatting.
  const calcCostPerUnitBase = toBaseMoney(calcCostPerUnit);
  const calcTotalCostBase = toBaseMoney(calcTotalCost);

  const handleSelect = (p) => {
    setSelectedProduct(p);
    setUnit(p.unit);
    if (p.costPrice > 0) {
      setCostMode("perUnit");
      setPricePerUnit(p.costPrice.toString());
      setTotalPaid("");
    }
  };

  const handleAdd = () => {
    if (!name || !qty) { showToast(tt("stockIn.error.nameQty"), "error"); return; }
    if (calcCostPerUnit <= 0) { showToast(tt("stockIn.error.validCost"), "error"); return; }
    const normalizedUnit = normalizeUnit(unit);
    const cpp = calcCostPerUnit;
    const saleVal = parseFloat(salePricePerUnitInput);
    const salePerInputUnit = Number.isFinite(saleVal) && saleVal > 0 ? saleVal : 0;

    const product = selectedProduct || findOrCreateProduct(name, normalizedUnit, cpp, salePerInputUnit);
    if (selectedProduct && !isConvertible(normalizedUnit, selectedProduct.unit)) {
      showToast(ttf("stockIn.error.unitNotCompatible", { unit: normalizedUnit, productUnit: selectedProduct.unit }), "error");
      return;
    }
    // Also update product's stored cost per unit
    const costPerProductUnit = normalizedUnit === product.unit ? cpp : (convertPricePerUnit(cpp, normalizedUnit, product.unit) ?? cpp);
    const salePerProductUnit = salePerInputUnit === 0
      ? null
      : (normalizedUnit === product.unit ? salePerInputUnit : (convertPricePerUnit(salePerInputUnit, normalizedUnit, product.unit) ?? salePerInputUnit));
    if (updateProductPrice) updateProductPrice(product.id, costPerProductUnit, salePerProductUnit);
    const txn = {
      id: uid(), productId: product.id, productName: name, type: "in",
      quantity: parseFloat(qty), unit: normalizedUnit, costPrice: cpp,
      salePrice: 0, profit: 0, date, timestamp: toTimestamp(date, time),
    };
    addTransaction(txn);
    const qtyBase = convertQty(parseFloat(qty), normalizedUnit, product.unit) ?? parseFloat(qty);
    showToast(ttf("stockIn.success.added", {
      qty: fmt(parseFloat(qty)),
      unit: normalizedUnit,
      name,
      stockQty: fmt(qtyBase),
      productUnit: product.unit,
    }));
    setName(""); setQty(""); setTotalPaid(""); setPricePerUnit("");
    setSalePricePerUnitInput(""); setSelectedProduct(null);
  };

  const handleMultiAdd = () => {
    const items = parseMultiInput(multiInput);
    if (items.length === 0) { showToast(tt("stockIn.parseError"), "error"); return; }
    const hasCostDefault = multiCostPerUnitInput.trim() !== "";
    const hasSaleDefault = multiSalePerUnitInput.trim() !== "";
    const defaultCost = parseFloat(multiCostPerUnitInput);
    const defaultSale = parseFloat(multiSalePerUnitInput);
    const costPerUnit = hasCostDefault && Number.isFinite(defaultCost) ? defaultCost : 0;
    const salePerUnit = hasSaleDefault && Number.isFinite(defaultSale) ? defaultSale : 0;

    items.forEach(item => {
      const parsedCostPerUnit = item.totalPaid && item.qty > 0 ? (item.totalPaid / item.qty) : null;
      const effectiveCostPerUnit = parsedCostPerUnit ?? (hasCostDefault ? costPerUnit : 0);
      const product = findOrCreateProduct(item.name, item.unit, effectiveCostPerUnit, hasSaleDefault ? salePerUnit : 0);
      if (updateProductPrice && product) {
        if (effectiveCostPerUnit > 0) {
          const costInProductUnit = item.unit === product.unit ? effectiveCostPerUnit : (convertPricePerUnit(effectiveCostPerUnit, item.unit, product.unit) ?? effectiveCostPerUnit);
          updateProductPrice(product.id, costInProductUnit, undefined);
        }
        if (hasSaleDefault) {
          const saleInProductUnit = item.unit === product.unit ? salePerUnit : (convertPricePerUnit(salePerUnit, item.unit, product.unit) ?? salePerUnit);
          updateProductPrice(product.id, undefined, saleInProductUnit);
        }
      }
      addTransaction({
        id: uid(), productId: product.id, productName: item.name, type: "in",
        quantity: item.qty, unit: item.unit,
        costPrice: effectiveCostPerUnit,
        salePrice: 0, profit: 0,
        date: today(), timestamp: Date.now(),
      });
    });
    showToast(ttf("stockIn.addedItems", { count: items.length }));
    setMultiInput("");
  };

  const inputStyle = { width: "100%", padding: "12px 16px", borderRadius: 12, border: "2px solid var(--border)", fontSize: 15, outline: "none", background: "var(--bg)" };
  const labelStyle = { fontSize: 13, fontWeight: 600, color: "var(--text-dim)", marginBottom: 8, display: "block" };

  return (
    <div className="page-centered">
      <div style={{ display: "flex", gap: 8, marginBottom: 28 }}>
        <button className="btn" onClick={() => setMode("single")} style={{
          padding: "10px 24px", fontSize: 14,
          background: mode === "single" ? "var(--primary)" : "var(--bg-card)",
          color: mode === "single" ? "#fff" : "var(--text)", border: mode !== "single" ? "1px solid var(--border)" : "none",
        }}>{tt("stockIn.singleItem")}</button>
        <button className="btn" onClick={() => setMode("multi")} style={{
          padding: "10px 24px", fontSize: 14,
          background: mode === "multi" ? "var(--primary)" : "var(--bg-card)",
          color: mode === "multi" ? "#fff" : "var(--text)", border: mode !== "multi" ? "1px solid var(--border)" : "none",
        }}>{tt("stockIn.multiItem")}</button>
      </div>

      <div className="card-pad" style={{ background: "var(--bg-card)", borderRadius: 20, border: "1px solid var(--border)" }}>
        {mode === "single" ? (
          <>
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>{tt("stockIn.productName")}</label>
              <AutoInput value={name} onChange={setName} products={products} placeholder={tt("stockIn.startTypingProduct")} onSelect={handleSelect} t={tt} />
            </div>

            <div className="grid-2" style={{ marginBottom: 20 }}>
              <div>
                <label style={labelStyle}>{tt("stockIn.quantity")}</label>
                <input type="number" value={qty} onChange={e => setQty(e.target.value)} placeholder="0" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>{tt("stockIn.unit")}</label>
                <select value={unit} onChange={e => setUnit(e.target.value)}
                  style={{ ...inputStyle, cursor: "pointer" }}>
                  {UNITS.map(u => <option key={u} value={u}>{unitLabelLang(lang, u)} ({unitFull(u)})</option>)}
                </select>
              </div>
            </div>

            {/* Cost Mode Toggle */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ ...labelStyle, marginBottom: 10 }}>{tt("stockIn.costPrompt")}</label>
              <div style={{ display: "flex", gap: 6, background: "var(--bg)", borderRadius: 12, padding: 4, width: "fit-content" }}>
                <button className="btn" onClick={() => {
                  if (costMode !== "total") {
                    // switching to total: convert perUnit price × qty into totalPaid
                    const converted = pricePerUnit && qty ? (parseFloat(pricePerUnit) * parseFloat(qty)).toFixed(2) : pricePerUnit;
                    setCostMode("total");
                    if (converted) setTotalPaid(converted);
                  }
                }} style={{
                  padding: "8px 18px", fontSize: 13, borderRadius: 10,
                  background: costMode === "total" ? "var(--primary)" : "transparent",
                  color: costMode === "total" ? "#fff" : "var(--text-dim)",
                }}>{tt("stockIn.costMode.total")}</button>
                <button className="btn" onClick={() => {
                  if (costMode !== "perUnit") {
                    // switching to perUnit: convert totalPaid ÷ qty into pricePerUnit
                    const converted = totalPaid && qty ? (parseFloat(totalPaid) / parseFloat(qty)).toFixed(4) : totalPaid;
                    setCostMode("perUnit");
                    if (converted) setPricePerUnit(converted);
                  }
                }} style={{
                  padding: "8px 18px", fontSize: 13, borderRadius: 10,
                  background: costMode === "perUnit" ? "var(--primary)" : "transparent",
                  color: costMode === "perUnit" ? "#fff" : "var(--text-dim)",
                }}>{ttf("stockIn.costMode.perUnit", { unit })}</button>
              </div>
            </div>

            {costMode === "total" ? (
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>{tt("stockIn.totalPaid").replace("RWF", currency || "RWF")}</label>
                <input type="number" step="any" value={totalPaid} onChange={e => setTotalPaid(e.target.value)}
                  placeholder="e.g. 1200 for the whole batch" style={{ ...inputStyle, fontSize: moneyFontSize(totalPaid), fontWeight: 600, fontFamily: "'Space Mono', monospace", transition: "font-size 0.15s ease" }} />
              </div>
            ) : (
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>{ttf("stockIn.pricePerUnit", { unit }).replace("RWF", currency || "RWF")}</label>
                <input type="number" step="any" value={pricePerUnit} onChange={e => setPricePerUnit(e.target.value)}
                  placeholder={`e.g. 1.50 per ${unit}`} style={{ ...inputStyle, fontSize: moneyFontSize(pricePerUnit), fontWeight: 600, fontFamily: "'Space Mono', monospace", transition: "font-size 0.15s ease" }} />
              </div>
            )}

            <div style={{ marginBottom: 18 }}>
              <label style={labelStyle}>{ttf("stockIn.salePriceOptional", { unit }).replace(/RWF/g, currency || "RWF")}</label>
              <input type="number" step="any" value={salePricePerUnitInput} onChange={e => setSalePricePerUnitInput(e.target.value)}
                placeholder={`e.g. 2.99 ${currency || "RWF"} per ${unit} (optional)`} style={{ ...inputStyle, fontSize: moneyFontSize(salePricePerUnitInput), fontWeight: 600, fontFamily: "'Space Mono', monospace", transition: "font-size 0.15s ease" }} />
            </div>

            {/* ─── LIVE COST BREAKDOWN ─── */}
            {qty && (calcCostPerUnit > 0 || calcTotalCost > 0) && (
              <div style={{
                padding: "20px 24px", borderRadius: 16, marginBottom: 24,
                background: "linear-gradient(135deg, rgba(99,102,241,0.14), rgba(59,130,246,0.10))",
                border: "1px solid rgba(99,102,241,0.28)",
                boxShadow: "0 12px 28px rgba(2,6,23,0.12)",
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--primary)", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 14 }}>
                  {tt("stockIn.autoBreakdown")}
                </div>
                <div className="zt-calc-grid">
                  <div>
                    <div style={{ fontSize: 11, color: "var(--text-dim)", marginBottom: 4, fontWeight: 500 }}>{tt("stockIn.quantity")}</div>
                    <div style={{ fontSize: dispFontSize(qty), fontWeight: 700, fontFamily: "'Space Mono', monospace", color: "var(--text)", transition: "font-size 0.2s" }}>
                      {qty} <span style={{ fontSize: 13, fontWeight: 400, color: "var(--text-dim)" }}>{unit}</span>
                    </div>
                  </div>
                  <div style={{ borderLeft: "1px solid rgba(148,163,184,0.35)", paddingLeft: 16 }}>
                    <div style={{ fontSize: 11, color: "var(--text-dim)", marginBottom: 4, fontWeight: 500 }}>{ttf("stockIn.costPer", { unit })}</div>
                    <div style={{ fontSize: dispFontSize(calcCostPerUnitBase), fontWeight: 700, fontFamily: "'Space Mono', monospace", color: "var(--primary)", transition: "font-size 0.2s" }}>
                      {fmtCur(calcCostPerUnitBase)}
                    </div>
                  </div>
                  <div style={{ borderLeft: "1px solid rgba(148,163,184,0.35)", paddingLeft: 16 }}>
                    <div style={{ fontSize: 11, color: "var(--text-dim)", marginBottom: 4, fontWeight: 500 }}>{tt("stockIn.totalCost")}</div>
                    <div style={{ fontSize: dispFontSize(calcTotalCostBase), fontWeight: 700, fontFamily: "'Space Mono', monospace", color: "var(--green)", transition: "font-size 0.2s" }}>
                      {fmtCur(calcTotalCostBase)}
                    </div>
                  </div>
                </div>
                {costMode === "total" && (
                  <div style={{ marginTop: 12, fontSize: 12, color: "var(--text-dim)", fontStyle: "italic" }}>
                    {fmtCur(toBaseMoney(parseFloat(totalPaid || 0)))} ÷ {qty} {unit} = <strong style={{ color: "var(--primary)" }}>{fmtCur(calcCostPerUnitBase)}</strong> / {unit}
                  </div>
                )}
                {costMode === "perUnit" && (
                  <div style={{ marginTop: 12, fontSize: 12, color: "var(--text-dim)", fontStyle: "italic" }}>
                    {fmtCur(toBaseMoney(parseFloat(pricePerUnit || 0)))} × {qty} {unit} = <strong style={{ color: "#059669" }}>{fmtCur(calcTotalCostBase)}</strong> {tt("stockIn.totalCost").toLowerCase()}
                  </div>
                )}
              </div>
            )}

            <div className="grid-2" style={{ gap: 14, marginBottom: 24 }}>
              <div>
                <label style={labelStyle}>{tt("stockIn.enterDate")}</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)}
                  style={{ padding: "12px 16px", borderRadius: 12, border: "2px solid var(--border)", fontSize: 15, outline: "none", background: "var(--bg)" }} />
              </div>
              <div>
                <label style={labelStyle}>{tt("stockIn.enterTime")}</label>
                <input type="time" value={time} onChange={e => setTime(e.target.value)}
                  style={{ padding: "12px 16px", borderRadius: 12, border: "2px solid var(--border)", fontSize: 15, outline: "none", background: "var(--bg)" }} />
              </div>
            </div>
            {selectedProduct && (
              <div style={{ padding: "14px 18px", borderRadius: 12, background: "var(--primary-bg)", marginBottom: 20, fontSize: 13, display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
                <span style={{ fontWeight: 700 }}>{selectedProduct.name}</span>
                <span>Stock: <strong style={{ fontFamily: "'Space Mono', monospace" }}>{selectedProduct.stock} {selectedProduct.unit}</strong></span>
                <span>Current cost: <strong style={{ fontFamily: "'Space Mono', monospace", color: "var(--primary)" }}>{fmtCur(selectedProduct.costPrice)}/{selectedProduct.unit}</strong></span>
                {selectedProduct.salePrice > 0 && <span>Sale price: <strong style={{ fontFamily: "'Space Mono', monospace", color: "var(--green)" }}>{fmtCur(selectedProduct.salePrice)}/{selectedProduct.unit}</strong></span>}
              </div>
            )}
            <button className="btn btn-primary" onClick={handleAdd}
              style={{ padding: "14px 40px", fontSize: 16, display: "flex", alignItems: "center", gap: 10 }}>
              {Icons.plus} {tt("stockIn.addStock")}
            </button>
          </>
        ) : (
          <>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-dim)", marginBottom: 8, display: "block" }}>
                {tt("stockIn.enterMultiple")} <span style={{ fontFamily: "'Space Mono', monospace", color: "var(--primary)" }}>{`Potato 10kg ${currency || "RWF"} 300, Maize 30kg ${currency || "RWF"} 300`}</span>)
              </label>
              <textarea
                value={multiInput} onChange={e => setMultiInput(e.target.value)}
                placeholder={tt("stockIn.multiPlaceholder")}
                rows={4}
                style={{
                  width: "100%", padding: "16px", borderRadius: 12, border: "2px solid var(--border)",
                  fontSize: 15, outline: "none", background: "var(--bg)", resize: "vertical", fontFamily: "inherit",
                }}
              />
            </div>

            <div className="grid-2" style={{ gap: 14, marginBottom: 18 }}>
              <div>
                <label style={{ ...labelStyle, display: "flex", alignItems: "center", gap: 8 }}>
                  {Icons.stockIn} {tt("stockIn.defaultCost")}
                </label>
                <input type="number" step="any" value={multiCostPerUnitInput} onChange={e => setMultiCostPerUnitInput(e.target.value)}
                  placeholder="e.g. 1.50 per kg" style={{ ...inputStyle, fontSize: moneyFontSize(multiCostPerUnitInput), fontWeight: 600, fontFamily: "'Space Mono', monospace", transition: "font-size 0.15s ease" }} />
              </div>
              <div>
                <label style={{ ...labelStyle, display: "flex", alignItems: "center", gap: 8 }}>
                  {Icons.stockOut} {tt("stockIn.defaultSale")}
                </label>
                <input type="number" step="any" value={multiSalePerUnitInput} onChange={e => setMultiSalePerUnitInput(e.target.value)}
                  placeholder="e.g. 2.99 per kg" style={{ ...inputStyle, fontSize: moneyFontSize(multiSalePerUnitInput), fontWeight: 600, fontFamily: "'Space Mono', monospace", transition: "font-size 0.15s ease" }} />
              </div>
            </div>
            {multiInput && parseMultiInput(multiInput).length > 0 && (
              <div style={{ marginBottom: 20, padding: 16, borderRadius: 12, background: "var(--primary-bg)" }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--primary)", marginBottom: 8 }}>{tt("stockIn.preview")}</div>
                {parseMultiInput(multiInput).map((item, i) => (
                  <div key={i} style={{ fontSize: 14, marginBottom: 4 }}>
                    {Icons.check} <strong>{item.name}</strong> — {item.qty} {unitLabelLang(lang, item.unit)}{item.totalPaid ? ` • ${currency || "RWF"} ${fmt(item.totalPaid)} ${tt("stockIn.costFromPriceTag")}` : ""}
                  </div>
                ))}
              </div>
            )}
            <button className="btn btn-primary" onClick={handleMultiAdd}
              style={{ padding: "14px 40px", fontSize: 16, display: "flex", alignItems: "center", gap: 10 }}>
              {Icons.plus} {tt("stockIn.addAllItems")}
            </button>
            <div style={{ marginTop: 10, fontSize: 12, color: "var(--text-dim)" }}>
              {tt("stockIn.timestampAuto")}
            </div>
          </>
        )}
      </div>

      {/* Quick Templates */}
      <div style={{ background: "var(--bg-card)", borderRadius: 16, padding: 24, border: "1px solid var(--border)", marginTop: 20 }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>{tt("stockIn.quickTemplates")}</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {["Rice 100kg", "Sugar 50kg", "Oil 20liters", "Flour 50kg", "Beans 30kg", "Milk 20liters"].map(t => (
            <button key={t} className="btn btn-outline" onClick={() => { setMode("multi"); setMultiInput(t); }}
              style={{ padding: "8px 16px", fontSize: 13 }}>{t}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── STOCK OUT / SELL ───
function StockOutPage({ products, addTransaction, showToast, updateProductPrice, t, tf, lang, currency }) {
  const tt = t || ((k) => k);
  const ttf = tf || ((k, vars = {}) => {
    let str = tt(k);
    Object.entries(vars).forEach(([kk, vv]) => { str = str.replaceAll(`{${kk}}`, String(vv)); });
    return str;
  });
  const [name, setName] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [qty, setQty] = useState("");
  const [date, setDate] = useState(today());
  const [time, setTime] = useState(nowTime());
  // Sale price mode: "perUnit" = price per kg/liter/piece, "total" = total received
  const [saleMode, setSaleMode] = useState("perUnit");
  const [salePricePerUnit, setSalePricePerUnit] = useState("");
  const [totalReceived, setTotalReceived] = useState("");
  const [sellUnit, setSellUnit] = useState("piece");
  const prevSellUnitRef = useRef("piece");

  const unitLabel = selectedProduct ? unitLabelLang(lang, sellUnit) : tt("stockIn.unit").toLowerCase();

  const handleSelect = (p) => {
    setSelectedProduct(p);
    setSellUnit(p.unit);
    if (p.salePrice > 0) {
      setSaleMode("perUnit");
      setSalePricePerUnit((convertPricePerUnit(p.salePrice, p.unit, p.unit) ?? p.salePrice).toString());
      setTotalReceived("");
    }
  };

  const qtyNum = parseFloat(qty) || 0;
  const qtyInProductUnit = selectedProduct ? (convertQty(qtyNum, sellUnit, selectedProduct.unit) ?? 0) : 0;
  const costPerUnit = selectedProduct ? (convertPricePerUnit(selectedProduct.costPrice || 0, selectedProduct.unit, sellUnit) ?? 0) : 0;

  useEffect(() => {
    const prevUnit = prevSellUnitRef.current;
    if (selectedProduct && saleMode === "perUnit" && salePricePerUnit && prevUnit !== sellUnit) {
      const converted = convertPricePerUnit(parseFloat(salePricePerUnit) || 0, prevUnit, sellUnit);
      if (converted !== null) {
        const neat = Number.isFinite(converted) ? String(Number(converted.toFixed(6))) : salePricePerUnit;
        setSalePricePerUnit(neat);
      }
    }
    prevSellUnitRef.current = sellUnit;
  }, [sellUnit, selectedProduct, saleMode, salePricePerUnit]);

  // Calculate sale price per unit based on mode
  const calcSalePricePerUnit = saleMode === "perUnit"
    ? (parseFloat(salePricePerUnit) || 0)
    : (totalReceived && qtyNum > 0 ? parseFloat(totalReceived) / qtyNum : 0);

  const calcTotalSale = saleMode === "perUnit"
    ? ((parseFloat(salePricePerUnit) || 0) * qtyNum)
    : (parseFloat(totalReceived) || 0);

  const totalCostAmount = costPerUnit * qtyNum;
  // Values typed here are in the selected display currency. Convert to base before formatting/calculations,
  // because product prices and analytics are stored in base.
  const salePerUnitBase = toBaseMoney(calcSalePricePerUnit);
  const totalSaleBase = saleMode === "total"
    ? toBaseMoney(parseFloat(totalReceived) || 0)
    : (salePerUnitBase * qtyNum);
  const profitBase = totalSaleBase - totalCostAmount;
  const marginPct = totalSaleBase > 0 ? (profitBase / totalSaleBase) * 100 : 0;

  const handleSell = () => {
    if (!selectedProduct) { showToast(tt("stockOut.error.selectProduct"), "error"); return; }
    if (!qty || qtyNum <= 0) { showToast(tt("stockOut.error.enterQuantity"), "error"); return; }
    if (calcSalePricePerUnit <= 0) { showToast(tt("stockOut.error.validSalePrice"), "error"); return; }
    if (!isConvertible(sellUnit, selectedProduct.unit)) { showToast(tt("stockOut.error.unitNotCompatible"), "error"); return; }
    if (qtyInProductUnit > selectedProduct.stock) { showToast(tt("stockOut.error.notEnoughStock"), "error"); return; }
    const sppu = calcSalePricePerUnit;
    // Save the sale price per unit to the product for next time
    const salePriceInProductUnitDisplay = convertPricePerUnit(sppu, sellUnit, selectedProduct.unit) ?? sppu;
    const salePriceInProductUnitBase = toBaseMoney(salePriceInProductUnitDisplay);
    if (updateProductPrice) updateProductPrice(selectedProduct.id, null, salePriceInProductUnitBase);
    const txn = {
      id: uid(), productId: selectedProduct.id, productName: selectedProduct.name, type: "out",
      quantity: qtyNum, unit: sellUnit,
      costPrice: costPerUnit, salePrice: toBaseMoney(sppu),
      profit: profitBase,
      date, timestamp: toTimestamp(date, time),
    };
    addTransaction(txn);
    const remaining = selectedProduct.stock - qtyInProductUnit;
    showToast(ttf("stockOut.success.sold", {
      qty,
      unit: sellUnit,
      name: selectedProduct.name,
      remaining: fmt(remaining),
      productUnit: selectedProduct.unit,
    }));
    setName(""); setQty(""); setSalePricePerUnit(""); setTotalReceived(""); setSelectedProduct(null);
  };

  const inputStyle = { width: "100%", padding: "12px 16px", borderRadius: 12, border: "2px solid var(--border)", fontSize: 15, outline: "none", background: "var(--bg)" };
  const labelStyle = { fontSize: 13, fontWeight: 600, color: "var(--text-dim)", marginBottom: 8, display: "block" };

  return (
    <div className="page-centered">
      <div className="card-pad" style={{ background: "var(--bg-card)", borderRadius: 20, border: "1px solid var(--border)" }}>
        {/* Product Name */}
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>{tt("stockIn.productName")}</label>
          <AutoInput value={name} onChange={setName} products={products} placeholder={tt("stockOut.startTyping")} onSelect={handleSelect} t={tt} />
        </div>

        {/* Product info banner */}
        {selectedProduct && (
          <div style={{
            padding: "16px 20px", borderRadius: 14, background: "var(--primary-bg)", marginBottom: 20,
            border: "1px solid #c7d2fe", display: "flex", gap: 24, flexWrap: "wrap", alignItems: "center",
          }}>
            <div>
              <div style={{ fontSize: 11, color: "var(--text-dim)", fontWeight: 500 }}>{tt("stockOut.inStock")}</div>
              <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "'Space Mono', monospace", color: selectedProduct.stock < 20 ? "#dc2626" : "var(--text)" }}>
                {selectedProduct.stock} <span style={{ fontSize: 12, fontWeight: 400, color: "var(--text-dim)" }}>{selectedProduct.unit}</span>
              </div>
            </div>
            <div style={{ width: 1, height: 36, background: "#c7d2fe" }} />
            <div>
              <div style={{ fontSize: 11, color: "var(--text-dim)", fontWeight: 500 }}>{tt("stockOut.costPrice")}</div>
              <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "'Space Mono', monospace", color: "var(--primary)" }}>
                {fmtCur(costPerUnit)} <span style={{ fontSize: 12, fontWeight: 400, color: "var(--text-dim)" }}>/{selectedProduct.unit}</span>
              </div>
            </div>
            <div style={{ width: 1, height: 36, background: "#c7d2fe" }} />
            <div>
              <div style={{ fontSize: 11, color: "var(--text-dim)", fontWeight: 500 }}>{tt("stockOut.lastSalePrice")}</div>
              <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "'Space Mono', monospace", color: "var(--green)" }}>
                {selectedProduct.salePrice > 0 ? fmtCur(selectedProduct.salePrice) : "—"} <span style={{ fontSize: 12, fontWeight: 400, color: "var(--text-dim)" }}>/{selectedProduct.unit}</span>
              </div>
            </div>
          </div>
        )}

        {/* Quantity */}
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>{tt("stockIn.quantity")} ({unitLabel})</label>
          <div className="grid-qty">
            <input type="number" value={qty} onChange={e => setQty(e.target.value)} placeholder="0"
              style={{ ...inputStyle, fontSize: 18, fontWeight: 600, fontFamily: "'Space Mono', monospace" }} />
            <select value={sellUnit} onChange={e => setSellUnit(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }} disabled={!selectedProduct}>
              {(selectedProduct ? unitsFor(selectedProduct.unit) : UNITS).map(u => <option key={u} value={u}>{unitLabelLang(lang, u)} ({unitFull(u)})</option>)}
            </select>
          </div>
          {selectedProduct && sellUnit !== selectedProduct.unit && qtyNum > 0 && (
            <div style={{ marginTop: 8, fontSize: 12, color: "var(--text-dim)" }}>
              {fmt(qtyNum)} {sellUnit} = <strong style={{ color: "var(--primary)" }}>{fmt(qtyInProductUnit)} {selectedProduct.unit}</strong>
            </div>
          )}
        </div>

        {/* Sale Price Mode Toggle */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ ...labelStyle, marginBottom: 10 }}>{tt("stockOut.howEnterSalePrice")}</label>
          <div style={{ display: "flex", gap: 6, background: "var(--bg)", borderRadius: 12, padding: 4, width: "fit-content" }}>
            <button className="btn" onClick={() => {
              if (saleMode !== "perUnit") {
                // switching to perUnit: convert totalReceived ÷ qty into salePricePerUnit
                const converted = totalReceived && qtyNum > 0 ? (parseFloat(totalReceived) / qtyNum).toFixed(4) : totalReceived;
                setSaleMode("perUnit");
                if (converted) setSalePricePerUnit(converted);
              }
            }} style={{
              padding: "8px 18px", fontSize: 13, borderRadius: 10,
              background: saleMode === "perUnit" ? "var(--primary)" : "transparent",
              color: saleMode === "perUnit" ? "#fff" : "var(--text-dim)",
            }}>{ttf("stockOut.pricePer", { unit: unitLabel })}</button>
            <button className="btn" onClick={() => {
              if (saleMode !== "total") {
                // switching to total: convert salePricePerUnit × qty into totalReceived
                const converted = salePricePerUnit && qtyNum > 0 ? (parseFloat(salePricePerUnit) * qtyNum).toFixed(2) : salePricePerUnit;
                setSaleMode("total");
                if (converted) setTotalReceived(converted);
              }
            }} style={{
              padding: "8px 18px", fontSize: 13, borderRadius: 10,
              background: saleMode === "total" ? "var(--primary)" : "transparent",
              color: saleMode === "total" ? "#fff" : "var(--text-dim)",
            }}>{tt("stockOut.totalReceived")}</button>
          </div>
        </div>

        {/* Sale Price Input */}
        {saleMode === "perUnit" ? (
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>{ttf("stockOut.salePricePer", { unit: unitLabel }).replace("RWF", currency || "RWF")}</label>
            <input type="number" step="any" value={salePricePerUnit} onChange={e => setSalePricePerUnit(e.target.value)}
              placeholder={`e.g. ${(selectedProduct ? (selectedProduct.salePrice || selectedProduct.costPrice * 1.3) : 0).toFixed(2)} ${currency || "RWF"} per ${unitLabel}`}
              style={{ ...inputStyle, fontSize: moneyFontSize(salePricePerUnit), fontWeight: 600, fontFamily: "'Space Mono', monospace", transition: "font-size 0.15s ease" }} />
          </div>
        ) : (
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>{tt("stockOut.totalAmountReceived").replace("RWF", currency || "RWF")}</label>
            <input type="number" step="any" value={totalReceived} onChange={e => setTotalReceived(e.target.value)}
              placeholder={`e.g. 5000 ${currency || "RWF"} total for the batch`}
              style={{ ...inputStyle, fontSize: moneyFontSize(totalReceived), fontWeight: 600, fontFamily: "'Space Mono', monospace", transition: "font-size 0.15s ease" }} />
          </div>
        )}

        {/* ─── LIVE CALCULATION BREAKDOWN ─── */}
        {selectedProduct && qtyNum > 0 && calcSalePricePerUnit > 0 && (
          <div style={{
            borderRadius: 16, marginBottom: 24, overflow: "hidden",
            border: `1px solid ${profitBase >= 0 ? "rgba(34,197,94,0.35)" : "rgba(239,68,68,0.35)"}`,
            boxShadow: "0 14px 34px rgba(2,6,23,0.14)",
          }}>
            {/* Calculation formula bar */}
            <div style={{
              padding: "12px 20px", fontSize: 13, fontFamily: "'Space Mono', monospace",
              background: profitBase >= 0 ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.10)",
              color: "var(--text-dim)", display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap",
            }}>
              {saleMode === "total" && (
                <span style={{ marginRight: 8, fontSize: 12, color: "var(--primary)" }}>
                  {fmtCur(toBaseMoney(parseFloat(totalReceived || 0)))} ÷ {qty} {unitLabel} = {fmtCur(salePerUnitBase)}/{unitLabel}
                  <span style={{ margin: "0 8px", color: "var(--text-dim)" }}>→</span>
                </span>
              )}
              <span>({fmtCur(salePerUnitBase)} − {fmtCur(costPerUnit)})</span>
              <span>×</span>
              <span>{qty} {unitLabel}</span>
              <span>=</span>
              <strong style={{ color: profitBase >= 0 ? "var(--green)" : "var(--red)" }}>{fmtCur(profitBase)}</strong>
            </div>

            {/* Results grid */}
            <div style={{
              padding: "20px 24px",
              background: profitBase >= 0
                ? "linear-gradient(135deg, rgba(34,197,94,0.12), rgba(16,185,129,0.08))"
                : "linear-gradient(135deg, rgba(239,68,68,0.10), rgba(244,63,94,0.08))",
            }}>
              <div className="zt-calc-grid">
                <div>
                  <div style={{ fontSize: 11, color: "var(--text-dim)", marginBottom: 4, fontWeight: 500, textTransform: "uppercase", letterSpacing: 0.5 }}>{tt("stockOut.totalSale")}</div>
                  <div style={{ fontSize: dispFontSize(totalSaleBase), fontWeight: 700, fontFamily: "'Space Mono', monospace", color: "var(--blue)", transition: "font-size 0.2s" }}>
                    {fmtCur(totalSaleBase)}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 2 }}>{fmtCur(salePerUnitBase)} × {qty}</div>
                </div>
                <div style={{ borderLeft: "1px solid rgba(148,163,184,0.35)", paddingLeft: 16 }}>
                  <div style={{ fontSize: 11, color: "var(--text-dim)", marginBottom: 4, fontWeight: 500, textTransform: "uppercase", letterSpacing: 0.5 }}>{tt("stockIn.totalCost")}</div>
                  <div style={{ fontSize: dispFontSize(totalCostAmount), fontWeight: 700, fontFamily: "'Space Mono', monospace", color: "var(--orange)", transition: "font-size 0.2s" }}>
                    {fmtCur(totalCostAmount)}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 2 }}>{fmtCur(costPerUnit)} × {qty}</div>
                </div>
                <div style={{ borderLeft: "1px solid rgba(148,163,184,0.35)", paddingLeft: 16 }}>
                  <div style={{ fontSize: 11, color: "var(--text-dim)", marginBottom: 4, fontWeight: 500, textTransform: "uppercase", letterSpacing: 0.5 }}>{tt("stockOut.profit")}</div>
                  <div style={{ fontSize: dispFontSize(profitBase), fontWeight: 700, fontFamily: "'Space Mono', monospace", color: profitBase >= 0 ? "var(--green)" : "var(--red)", transition: "font-size 0.2s" }}>
                    {fmtCur(profitBase)}
                  </div>
                  <div style={{ fontSize: 11, color: profitBase >= 0 ? "var(--green)" : "var(--red)", marginTop: 2, fontWeight: 600 }}>
                    {marginPct.toFixed(1)}% {tt("common.margin")}
                  </div>
                </div>
              </div>
            </div>

            {/* Sale price per unit info when using total mode */}
            {saleMode === "total" && (
              <div style={{ padding: "10px 20px", background: profitBase >= 0 ? "rgba(34,197,94,0.10)" : "rgba(239,68,68,0.08)", fontSize: 12, color: "var(--text-dim)", fontStyle: "italic" }}>
                {ttf("stockOut.salePricePerColon", { unit: unitLabel })} <strong style={{ color: "var(--primary)", fontFamily: "'Space Mono', monospace" }}>{fmtCur(salePerUnitBase)}</strong>
                {" "}(from {fmtCur(toBaseMoney(parseFloat(totalReceived || 0)))} ÷ {qty} {unitLabel})
              </div>
            )}
            {saleMode === "perUnit" && (
              <div style={{ padding: "10px 20px", background: profitBase >= 0 ? "rgba(34,197,94,0.10)" : "rgba(239,68,68,0.08)", fontSize: 12, color: "var(--text-dim)", fontStyle: "italic" }}>
                {fmtCur(salePerUnitBase)} × {qty} {unitLabel} = <strong style={{ color: "var(--blue)", fontFamily: "'Space Mono', monospace" }}>{fmtCur(totalSaleBase)}</strong> {tt("stockOut.totalReceived2")}
              </div>
            )}

            {/* Warning if selling below cost */}
            {profitBase < 0 && (
              <div style={{ padding: "10px 20px", background: "var(--red-bg)", display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--red)", fontWeight: 600 }}>
                {Icons.alert} {ttf("stockOut.sellingBelow", { amount: fmtCur(Math.abs(profitBase)) })}
              </div>
            )}
            {/* Warning if not enough stock */}
            {qtyInProductUnit > selectedProduct.stock && (
              <div style={{ padding: "10px 20px", background: "var(--orange-bg)", display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--orange)", fontWeight: 600 }}>
                {Icons.alert} {ttf("stockOut.lowStock", { stock: selectedProduct.stock, unit: selectedProduct.unit })}
              </div>
            )}
          </div>
        )}

        {/* Date & Time */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 24 }}>
          <div>
            <label style={labelStyle}>{tt("stockIn.enterDate")}</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              style={{ padding: "12px 16px", borderRadius: 12, border: "2px solid var(--border)", fontSize: 15, outline: "none", background: "var(--bg)" }} />
          </div>
          <div>
            <label style={labelStyle}>{tt("stockIn.enterTime")}</label>
            <input type="time" value={time} onChange={e => setTime(e.target.value)}
              style={{ padding: "12px 16px", borderRadius: 12, border: "2px solid var(--border)", fontSize: 15, outline: "none", background: "var(--bg)" }} />
          </div>
        </div>

        <button className="btn btn-primary" onClick={handleSell}
          style={{ padding: "14px 40px", fontSize: 16, display: "flex", alignItems: "center", gap: 10, opacity: (qtyInProductUnit > (selectedProduct?.stock || 0)) ? 0.5 : 1 }}>
          {Icons.stockOut} {tt("stockOut.completeSale")}
        </button>
      </div>

      {/* Quick Sell */}
      {products.length > 0 && (
        <div style={{ background: "var(--bg-card)", borderRadius: 16, padding: 24, border: "1px solid var(--border)", marginTop: 20 }}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>{tt("stockOut.quickSell")}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {[...products].sort((a, b) => (b.frequency || 0) - (a.frequency || 0)).slice(0, 8).map(p => (
              <button key={p.id} className="btn btn-outline" onClick={() => { setName(p.name); handleSelect(p); }}
                style={{ padding: "8px 16px", fontSize: 13 }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <span style={{ display: "inline-flex", opacity: 0.85 }}><UnitIcon unit={p.unit} size={16} /></span>
                  <span>{p.name}</span>
                </span>{" "}
                <span style={{ opacity: 0.55, marginLeft: 6, display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <span>{p.stock}{p.unit}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {products.length === 0 && (
        <div style={{
          textAlign: "center", padding: "48px 20px", marginTop: 20,
          background: "var(--bg-card)", borderRadius: 16, border: "2px dashed var(--border)",
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🛒</div>
          <div style={{ fontSize: 17, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>{tt("stockOut.noProducts")}</div>
          <div style={{ fontSize: 13, color: "var(--text-dim)" }}>
            {ttf("stockOut.addStockFirst", { addStock: tt("stockIn.addStock") }).split(tt("stockIn.addStock"))[0]}
            <strong>{tt("stockIn.addStock")}</strong>
            {ttf("stockOut.addStockFirst", { addStock: tt("stockIn.addStock") }).split(tt("stockIn.addStock")).slice(1).join(tt("stockIn.addStock"))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── INVENTORY ───
function InventoryPage({ products, updateProductPrice, removeProduct, undoRemoveProduct, hasUndo, showToast, t }) {
  const tt = t || ((k) => k);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("name");
  const [editingId, setEditingId] = useState(null);
  const [editCost, setEditCost] = useState("");
  const [editSale, setEditSale] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [displayUnits, setDisplayUnits] = useState({});
  const [unitOpenId, setUnitOpenId] = useState(null);

  useEffect(() => {
    const onDocDown = (e) => {
      try {
        if (!e?.target?.closest?.(".inv-dd")) setUnitOpenId(null);
      } catch (_e) {}
    };
    document.addEventListener("mousedown", onDocDown);
    document.addEventListener("touchstart", onDocDown, { passive: true });
    return () => {
      document.removeEventListener("mousedown", onDocDown);
      document.removeEventListener("touchstart", onDocDown);
    };
  }, []);

  const startEdit = (p) => {
    setEditingId(p.id);
    setEditCost(p.costPrice.toString());
    setEditSale(p.salePrice.toString());
  };

  const saveEdit = (p) => {
    const newCost = parseFloat(editCost);
    const newSale = parseFloat(editSale);
    if (isNaN(newCost) || newCost < 0) { showToast(tt("inventory.error.invalidCostPrice"), "error"); return; }
    if (isNaN(newSale) || newSale < 0) { showToast(tt("inventory.error.invalidSalePrice"), "error"); return; }
    updateProductPrice(p.id, toBaseMoney(newCost), toBaseMoney(newSale));
    setEditingId(null);
    showToast(tt("inventory.success.updatedPrices")
      .replace("{name}", p.name)
      .replace("{cost}", fmtCur(toBaseMoney(newCost)))
      .replace("{sale}", fmtCur(toBaseMoney(newSale)))
      .replaceAll("{unit}", p.unit));
  };

  const cancelEdit = () => { setEditingId(null); };

  const filtered = products
    .filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "stock") return a.stock - b.stock;
      if (sort === "value") return (b.stock * b.costPrice) - (a.stock * a.costPrice);
      return 0;
    });

  const totalValue = products.reduce((s, p) => s + p.stock * p.costPrice, 0);

  const inlineInput = { padding: "6px 10px", borderRadius: 8, border: "2px solid var(--primary)", fontSize: 14, outline: "none", width: 80, fontFamily: "'Space Mono', monospace", fontWeight: 600, background: "#fff", textAlign: "center" };

  return (
    <div>
      <div style={{ display: "flex", gap: 12, marginBottom: 24, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 250 }}>
          <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-dim)" }}>{Icons.search}</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={tt("common.searchProducts")}
            style={{ width: "100%", padding: "12px 16px 12px 42px", borderRadius: 12, border: "2px solid var(--border)", fontSize: 14, outline: "none", background: "var(--bg-card)" }} />
        </div>
        <select value={sort} onChange={e => setSort(e.target.value)}
          style={{ padding: "12px 20px", borderRadius: 12, border: "2px solid var(--border)", fontSize: 14, outline: "none", background: "var(--bg-card)", cursor: "pointer" }}>
          <option value="name">{tt("common.sort.name")}</option>
          <option value="stock">{tt("common.sort.stock")}</option>
          <option value="value">{tt("common.sort.value")}</option>
        </select>
        <div style={{ padding: "10px 20px", borderRadius: 12, background: "var(--primary-bg)", fontSize: 14, fontWeight: 600, color: "var(--primary)" }}>
          {tt("common.totalValue")}: {fmtCur(totalValue)}
        </div>
        {hasUndo && (
          <button onClick={undoRemoveProduct} className="btn btn-outline" style={{ padding: "10px 16px", fontSize: 13, display: "flex", gap: 8, alignItems: "center" }}>
            {Icons.undo} {tt("common.undoDelete")}
          </button>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
        {filtered.map(p => {
          const viewUnit = displayUnits[p.id] || p.unit;
          const viewStock = convertQty(p.stock, p.unit, viewUnit) ?? p.stock;
          const viewCost = convertPricePerUnit(p.costPrice || 0, p.unit, viewUnit) ?? p.costPrice;
          const viewSale = convertPricePerUnit(p.salePrice || 0, p.unit, viewUnit) ?? p.salePrice;
          const level = p.stock < 15 ? "low" : p.stock < 50 ? "medium" : "high";
          const pct = Math.min((p.stock / 200) * 100, 100);
          const isEditing = editingId === p.id;
          const margin = p.salePrice > 0 ? ((p.salePrice - p.costPrice) / p.salePrice * 100) : 0;
          return (
            <div key={p.id} className="stat-card" style={{
              background: "var(--bg-card)", borderRadius: 16, padding: 20,
              border: `2px solid ${isEditing ? "var(--primary)" : level === "low" ? "#fecaca" : level === "medium" ? "#fde68a" : "var(--border)"}`,
              transition: "border-color 0.2s",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, gap: 10 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <span style={{ display: "inline-flex", opacity: 0.9 }}><UnitIcon unit={p.unit} size={18} /></span>
                    <span>{p.name}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 2, display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <span style={{ display: "inline-flex", opacity: 0.7 }}><UnitIcon unit={p.unit} size={14} /></span>
                      <span>{tt("inventory.base")} {p.unit}</span>
                    </span>
                    <div className="glass-dd inv-dd">
                      <button
                        type="button"
                        className="glass-dd-btn"
                        onClick={() => setUnitOpenId((v) => (v === p.id ? null : p.id))}
                        aria-haspopup="listbox"
                        aria-expanded={unitOpenId === p.id ? "true" : "false"}
                      >
                        <span className="glass-dd-value">
                          <span>{viewUnit}</span>
                          <span className="glass-dd-sub">{unitFull(viewUnit)}</span>
                        </span>
                        <span aria-hidden="true" style={{ opacity: 0.9, display: "inline-flex" }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </span>
                      </button>
                      {unitOpenId === p.id && (
                        <div className="glass-dd-list" role="listbox" aria-label="Unit options">
                          {unitsFor(p.unit).map((u) => (
                            <button
                              type="button"
                              key={u}
                              className={`glass-dd-item ${viewUnit === u ? "is-active" : ""}`}
                              onClick={() => { setDisplayUnits(prev => ({ ...prev, [p.id]: u })); setUnitOpenId(null); }}
                            >
                              <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                                <span style={{ display: "inline-flex", opacity: 0.9 }}><UnitIcon unit={u} size={16} /></span>
                                <span>{unitLabelLang("en", u) || u}</span>
                              </span>
                              <small>{u} • {unitFull(u)}</small>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end", maxWidth: 170 }}>
                  <span style={{
                    padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                    background: level === "low" ? "#fef2f2" : level === "medium" ? "#fffbeb" : "#ecfdf5",
                    color: STOCK_COLORS[level],
                  }}>{level === "low" ? tt("common.level.low") : level === "medium" ? tt("common.level.medium") : tt("common.level.good")}</span>
                  {!isEditing && (
                    <>
                      <button onClick={() => startEdit(p)} className="btn" style={{
                        padding: "4px 8px", background: "var(--bg)", color: "var(--text-dim)", borderRadius: 8,
                        display: "flex", alignItems: "center", gap: 4, fontSize: 11, flex: "0 0 auto", whiteSpace: "nowrap",
                      }}>{Icons.edit} {tt("inventory.price")}</button>
                      <button onClick={() => setConfirmDeleteId(p.id)} className="btn" style={{
                        padding: "4px 8px", background: "var(--red-bg)", color: "var(--red)", borderRadius: 8,
                        display: "flex", alignItems: "center", gap: 4, fontSize: 11, flex: "0 0 auto",
                      }}>{Icons.trash}</button>
                    </>
                  )}
                </div>
              </div>

              <div style={{ fontSize: 28, fontWeight: 700, fontFamily: "'Space Mono', monospace", color: STOCK_COLORS[level], marginBottom: 12 }}>
                {fmt(viewStock)} <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text-dim)" }}>{viewUnit}</span>
              </div>

              <div style={{ height: 8, borderRadius: 4, background: "var(--bg)", overflow: "hidden", marginBottom: 14 }}>
                <div style={{ height: "100%", borderRadius: 4, background: STOCK_COLORS[level], width: `${pct}%`, transition: "width 0.6s ease" }} />
              </div>

              {isEditing ? (
                <div style={{ background: "var(--primary-bg)", borderRadius: 12, padding: 16 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-dim)", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Cost per {p.unit}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <span style={{ fontSize: 12, color: "var(--text-dim)", fontWeight: 700 }}>{window.__zt_currency || "RWF"}</span>
                        <input type="number" step="any" value={editCost} onChange={e => setEditCost(e.target.value)}
                          style={{ ...inlineInput, fontSize: moneyFontSize(editCost), transition: "font-size 0.15s ease" }} autoFocus
                          onKeyDown={e => { if (e.key === "Enter") saveEdit(p); if (e.key === "Escape") cancelEdit(); }} />
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-dim)", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Sale per {p.unit}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <span style={{ fontSize: 12, color: "var(--text-dim)", fontWeight: 700 }}>{window.__zt_currency || "RWF"}</span>
                        <input type="number" step="any" value={editSale} onChange={e => setEditSale(e.target.value)}
                          style={{ ...inlineInput, fontSize: moneyFontSize(editSale), transition: "font-size 0.15s ease" }}
                          onKeyDown={e => { if (e.key === "Enter") saveEdit(p); if (e.key === "Escape") cancelEdit(); }} />
                      </div>
                    </div>
                  </div>
                  {editCost && editSale && parseFloat(editSale) > 0 && (
                    <div style={{ fontSize: 12, color: parseFloat(editSale) > parseFloat(editCost) ? "var(--green)" : "#dc2626", fontWeight: 600, marginBottom: 10 }}>
                      Margin: {fmtCur(parseFloat(editSale) - parseFloat(editCost))}/{p.unit} ({((parseFloat(editSale) - parseFloat(editCost)) / parseFloat(editSale) * 100).toFixed(1)}%)
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => saveEdit(p)} className="btn btn-primary" style={{ padding: "6px 16px", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
                      {Icons.check} Save
                    </button>
                    <button onClick={cancelEdit} className="btn btn-outline" style={{ padding: "6px 16px", fontSize: 12 }}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, fontSize: 12 }}>
                  <div style={{ background: "var(--bg)", borderRadius: 8, padding: "8px 10px", textAlign: "center" }}>
                    <div style={{ color: "var(--text-dim)", marginBottom: 2, fontSize: 10, fontWeight: 600, textTransform: "uppercase" }}>Cost</div>
                    <div style={{ fontWeight: 700, fontFamily: "'Space Mono', monospace", color: "var(--text)" }}>{fmtCur(viewCost)}</div>
                  </div>
                  <div style={{ background: "var(--bg)", borderRadius: 8, padding: "8px 10px", textAlign: "center" }}>
                    <div style={{ color: "var(--text-dim)", marginBottom: 2, fontSize: 10, fontWeight: 600, textTransform: "uppercase" }}>Sale</div>
                    <div style={{ fontWeight: 700, fontFamily: "'Space Mono', monospace", color: p.salePrice > 0 ? "var(--green)" : "var(--text-dim)" }}>{p.salePrice > 0 ? fmtCur(viewSale) : "—"}</div>
                  </div>
                  <div style={{ background: margin > 0 ? "var(--green-bg)" : "var(--bg)", borderRadius: 8, padding: "8px 10px", textAlign: "center" }}>
                    <div style={{ color: "var(--text-dim)", marginBottom: 2, fontSize: 10, fontWeight: 600, textTransform: "uppercase" }}>Margin</div>
                    <div style={{ fontWeight: 700, fontFamily: "'Space Mono', monospace", color: margin > 0 ? "var(--green)" : "var(--text-dim)" }}>{margin > 0 ? `${margin.toFixed(0)}%` : "—"}</div>
                  </div>
                </div>
              )}

              {/* Delete confirmation overlay */}
              {confirmDeleteId === p.id && (
                <div style={{
                  marginTop: 14, padding: "16px", borderRadius: 12,
                  background: "linear-gradient(135deg, #fef2f2, #fee2e2)",
                  border: "2px solid #fecaca",
                }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#dc2626", marginBottom: 4 }}>
                    Remove "{p.name}"?
                  </div>
                  <div style={{ fontSize: 12, color: "#991b1b", marginBottom: 12 }}>
                    This will permanently delete this product and all its transaction history.
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => { removeProduct(p.id); setConfirmDeleteId(null); }}
                      className="btn" style={{
                        padding: "8px 18px", fontSize: 12, fontWeight: 700,
                        background: "#dc2626", color: "#fff", borderRadius: 10,
                        display: "flex", alignItems: "center", gap: 6,
                      }}>
                      {Icons.trash} Yes, Remove
                    </button>
                    <button onClick={() => setConfirmDeleteId(null)}
                      className="btn btn-outline" style={{ padding: "8px 18px", fontSize: 12, borderRadius: 10 }}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {products.length === 0 && (
        <div style={{
          textAlign: "center", padding: "60px 20px",
          background: "var(--bg-card)", borderRadius: 20, border: "2px dashed var(--border)",
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📦</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>No products yet</div>
          <div style={{ fontSize: 14, color: "var(--text-dim)", maxWidth: 360, margin: "0 auto", lineHeight: 1.6 }}>
            Go to <strong>Add Stock</strong> to add your first product. Products are created automatically when you add stock for the first time.
          </div>
        </div>
      )}
    </div>
  );
}

// ─── REPORTS ───
function ReportsPage({ transactions, products, onImportData, onExportData, showToast, t, lang }) {
  const tt = t || ((k) => k);
  const [dateFrom, setDateFrom] = useState(() => { const d = new Date(); d.setMonth(d.getMonth() - 1); return d.toISOString().split("T")[0]; });
  const [dateTo, setDateTo] = useState(today());
  const [filterProduct, setFilterProduct] = useState("");
  const [filterType, setFilterType] = useState("all");

  const filtered = transactions.filter(t => {
    if (t.date < dateFrom || t.date > dateTo) return false;
    if (filterProduct && !t.productName.toLowerCase().includes(filterProduct.toLowerCase())) return false;
    if (filterType !== "all" && t.type !== filterType) return false;
    return true;
  });

  const summary = {
    totalIn: filtered.filter(t => t.type === "in").reduce((s, t) => s + t.quantity, 0),
    totalOut: filtered.filter(t => t.type === "out").reduce((s, t) => s + t.quantity, 0),
    totalCost: filtered.filter(t => t.type === "in").reduce((s, t) => s + t.costPrice * t.quantity, 0),
    totalRevenue: filtered.filter(t => t.type === "out").reduce((s, t) => s + t.salePrice * t.quantity, 0),
    totalProfit: filtered.filter(t => t.type === "out").reduce((s, t) => s + t.profit, 0),
  };

  const fmtTime = (ts) => {
    try {
      if (!ts) return "—";
      const d = new Date(ts);
      return d.toLocaleTimeString(localeForLang(lang), { hour: "2-digit", minute: "2-digit" });
    } catch (_e) {
      return "—";
    }
  };

  const exportCSV = () => {
    const headers = "Product,Type,Quantity,Unit,Cost Price,Sale Price,Profit,Date,Time\n";
    const rows = filtered.map(t => `${t.productName},${t.type},${t.quantity},${t.unit},${t.costPrice},${t.salePrice},${t.profit},${t.date},${fmtTime(t.timestamp)}`).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `report_${dateFrom}_${dateTo}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const exportBackupJSON = () => {
    const payload = onExportData ? onExportData() : { products, transactions };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `zuritrack_backup_${today()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importBackupJSON = async (file) => {
    if (!file) return;
    try {
      const txt = await file.text();
      const data = JSON.parse(txt);
      onImportData?.(data);
    } catch (_e) {
      showToast?.(tt("reports.importError"), "error");
    }
  };

  return (
    <div>
      {/* Filters */}
      <div style={{
        background: "var(--bg-card)", borderRadius: 16, padding: 24, border: "1px solid var(--border)", marginBottom: 24,
        display: "flex", gap: 14, flexWrap: "wrap", alignItems: "flex-end",
      }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-dim)", marginBottom: 6, display: "block" }}>{tt("reports.filters.from")}</label>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            style={{ padding: "10px 14px", borderRadius: 10, border: "2px solid var(--border)", fontSize: 13, outline: "none", background: "var(--bg)" }} />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-dim)", marginBottom: 6, display: "block" }}>{tt("reports.filters.to")}</label>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            style={{ padding: "10px 14px", borderRadius: 10, border: "2px solid var(--border)", fontSize: 13, outline: "none", background: "var(--bg)" }} />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-dim)", marginBottom: 6, display: "block" }}>{tt("reports.filters.product")}</label>
          <input value={filterProduct} onChange={e => setFilterProduct(e.target.value)} placeholder={tt("reports.filters.allProducts")}
            style={{ padding: "10px 14px", borderRadius: 10, border: "2px solid var(--border)", fontSize: 13, outline: "none", background: "var(--bg)", width: 160 }} />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-dim)", marginBottom: 6, display: "block" }}>{tt("reports.filters.type")}</label>
          <select value={filterType} onChange={e => setFilterType(e.target.value)}
            style={{ padding: "10px 14px", borderRadius: 10, border: "2px solid var(--border)", fontSize: 13, outline: "none", background: "var(--bg)", cursor: "pointer" }}>
            <option value="all">{tt("reports.type.all")}</option>
            <option value="in">{tt("reports.type.in")}</option>
            <option value="out">{tt("reports.type.out")}</option>
          </select>
        </div>
        <button className="btn btn-primary" onClick={exportCSV} style={{ padding: "10px 20px", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
          {Icons.download} {tt("common.exportCSV")}
        </button>
        <button className="btn btn-outline" onClick={exportBackupJSON} style={{ padding: "10px 20px", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
          {Icons.download} {tt("common.exportBackup")}
        </button>
        <label className="btn btn-outline" style={{ padding: "10px 20px", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
          {tt("common.importBackup")}
          <input type="file" accept="application/json" style={{ display: "none" }} onChange={e => importBackupJSON(e.target.files?.[0])} />
        </label>
      </div>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 24 }}>
        {[
          { label: tt("reports.summary.itemsIn"), value: fmt(summary.totalIn), color: "var(--green)", bg: "var(--green-bg)" },
          { label: tt("reports.summary.itemsOut"), value: fmt(summary.totalOut), color: "var(--blue)", bg: "var(--blue-bg)" },
          { label: tt("reports.summary.totalCost"), value: fmtCur(summary.totalCost), color: "var(--orange)", bg: "var(--orange-bg)" },
          { label: tt("reports.summary.revenue"), value: fmtCur(summary.totalRevenue), color: "var(--primary)", bg: "var(--primary-bg)" },
          { label: tt("reports.summary.profit"), value: fmtCur(summary.totalProfit), color: "var(--green)", bg: "var(--green-bg)" },
        ].map((c, i) => (
          <div key={i} style={{ background: "var(--bg-card)", borderRadius: 14, padding: "16px 20px", border: "1px solid var(--border)" }}>
            <div style={{ fontSize: 12, color: "var(--text-dim)", fontWeight: 500, marginBottom: 4 }}>{c.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: c.color, fontFamily: "'Space Mono', monospace" }}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Transactions Table */}
      <div style={{ background: "var(--bg-card)", borderRadius: 16, border: "1px solid var(--border)", overflow: "hidden" }}>
        <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 15, fontWeight: 700 }}>{filtered.length} {tt("reports.transactions")}</span>
        </div>
        <div style={{ maxHeight: 500, overflowY: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--bg)", position: "sticky", top: 0 }}>
                {[
                  tt("reports.table.product"),
                  tt("reports.table.type"),
                  tt("reports.table.qty"),
                  tt("reports.table.costUnit"),
                  tt("reports.table.saleUnit"),
                  tt("reports.table.total"),
                  tt("reports.table.profit"),
                  tt("reports.table.date"),
                ].map(h => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</th>
                ))}
                <th style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: 0.5 }}>{tt("reports.table.time")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 100).map(t => {
                const perUnit = t.type === "in" ? t.costPrice : t.salePrice;
                const total = perUnit * t.quantity;
                return (
                  <tr key={t.id} style={{ borderBottom: "1px solid var(--border-light)" }}>
                    <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 500 }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                        <span style={{ display: "inline-flex", opacity: 0.9 }}><UnitIcon unit={t.unit} size={15} /></span>
                        <span>{t.productName}</span>
                      </span>
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <span style={{
                        padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                        background: t.type === "in" ? "var(--green-bg)" : "var(--blue-bg)",
                        color: t.type === "in" ? "var(--green)" : "var(--blue)",
                      }}>{t.type === "in" ? tt("reports.badge.in") : tt("reports.badge.sale")}</span>
                    </td>
                    <td style={{ padding: "10px 14px", fontSize: 13, fontFamily: "'Space Mono', monospace" }}>
                      {t.quantity} <span style={{ fontSize: 11, color: "var(--text-dim)" }}>{t.unit}</span>
                    </td>
                    <td style={{ padding: "10px 14px", fontSize: 13, fontFamily: "'Space Mono', monospace" }}>
                      {fmtCur(t.costPrice)}<span style={{ fontSize: 10, color: "var(--text-dim)" }}>/{t.unit}</span>
                    </td>
                    <td style={{ padding: "10px 14px", fontSize: 13, fontFamily: "'Space Mono', monospace" }}>
                      {t.type === "out" ? <>{fmtCur(t.salePrice)}<span style={{ fontSize: 10, color: "var(--text-dim)" }}>/{t.unit}</span></> : "—"}
                    </td>
                    <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 600, fontFamily: "'Space Mono', monospace" }}>
                      {fmtCur(total)}
                    </td>
                    <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 600, fontFamily: "'Space Mono', monospace", color: t.profit > 0 ? "var(--green)" : "var(--text-dim)" }}>
                      {t.type === "out" ? fmtCur(t.profit) : "—"}
                    </td>
                    <td style={{ padding: "10px 14px", fontSize: 12, color: "var(--text-dim)" }}>{t.date}</td>
                    <td style={{ padding: "10px 14px", fontSize: 12, color: "var(--text-dim)" }}>{fmtTime(t.timestamp)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Mount after all declarations so any values are initialized.
ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(App));
