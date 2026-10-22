export const STAGES = ['Teknik hazırlık', 'Malzeme kontrolü', 'Üretim sırası', 'Üretimde', 'Test bekliyor', 'Teslimata hazır', 'Teslim edildi'];
export const STORE = 'artek-operations-demo-v1';
export const warehouseNames = { karakoy: 'Karaköy', cekmekoy: 'Çekmeköy' };
export const num = n => new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 }).format(n);
export const money = n => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 2 }).format(n);
export function initialState() {
  return {
    version: 1,
    products: [
      { id: 'ef25', code: 'FN-EF25', name: 'EF25 ferrit nüve takımı', category: 'Ferrit nüve', unit: 'takım', price: 24, min: 300, stock: { karakoy: 2400, cekmekoy: 3200 }, location: { karakoy: 'A-01', cekmekoy: 'H-01' } },
      { id: 'karkas', code: 'KR-EF25', name: 'EF25 karkas · 10 pin', category: 'Karkas', unit: 'adet', price: 8.5, min: 500, stock: { karakoy: 1800, cekmekoy: 2800 }, location: { karakoy: 'A-02', cekmekoy: 'H-02' } },
      { id: 'copper', code: 'BK-035', name: 'Emaye bakır tel · 0,35 mm', category: 'Hammadde', unit: 'kg', price: 620, min: 25, stock: { karakoy: 0, cekmekoy: 42 }, location: { karakoy: '—', cekmekoy: 'B-01' } },
      { id: 'tape', code: 'BT-019', name: 'Polyester bant · 19 mm', category: 'Sarf malzeme', unit: 'rulo', price: 95, min: 10, stock: { karakoy: 10, cekmekoy: 34 }, location: { karakoy: 'B-03', cekmekoy: 'B-02' } },
      { id: 'solder', code: 'LH-001', name: 'Pota lehimi', category: 'Sarf malzeme', unit: 'kg', price: 890, min: 5, stock: { karakoy: 0, cekmekoy: 4.5 }, location: { karakoy: '—', cekmekoy: 'B-03' } },
      { id: 'ee30', code: 'FN-EE30', name: 'EE30 ferrit nüve takımı', category: 'Ferrit nüve', unit: 'takım', price: 32, min: 200, stock: { karakoy: 860, cekmekoy: 450 }, location: { karakoy: 'A-03', cekmekoy: 'H-03' } },
      { id: 'finished', code: 'TR-26041', name: 'Çit trafosu · PRJ-26041', category: 'Bitmiş ürün', unit: 'adet', price: 185, min: 0, stock: { karakoy: 0, cekmekoy: 0 }, location: { karakoy: '—', cekmekoy: 'S-01' } },
    ],
    jobs: [
      { id: 'PRJ-26041', name: 'Çit trafosu', customer: 'Örnek Tarım Teknolojileri', qty: 1000, stage: 2, days: 4, team: 3, unitPrice: 185, deposit: 50000, recipe: { ef25: 1000, karkas: 1000, copper: 18, tape: 8, solder: 1.2 }, finished: 'finished', note: 'Müşteriye özel üretim · Rev. A. Teknik değerler ve malzeme miktarları demo içindir.', started: false },
      { id: 'PRJ-26042', name: 'Özel güç trafosu', customer: 'Örnek Otomasyon', qty: 250, stage: 0, days: 3, team: 3, unitPrice: 320, deposit: 0, recipe: {}, note: 'Teknik çizim ve malzeme reçetesi bekleniyor.', started: false },
      { id: 'PRJ-26043', name: 'Özel sarım bobin', customer: 'Örnek Enerji Sistemleri', qty: 600, stage: 0, days: 2, team: 3, unitPrice: 65, deposit: 0, recipe: {}, note: 'Tel özellikleri ve test kriterleri hazırlanacak.', started: false },
    ],
    sales: [ { id: 'SAT-1001', customer: 'Örnek Elektronik', product: 'ee30', qty: 40, price: 32, total: 1280, warehouse: 'karakoy', channel: 'Manuel', paid: true, label: 'EE30 ferrit nüve takımı' } ],
    transfers: [], counts: [],
    events: [ { text: 'PRJ-26041 için malzemeler Çekmeköy’de ayrıldı.', who: 'Erkan · Mühendislik', at: 'Örnek başlangıç kaydı', kind: 'production' }, { text: 'Açılış stokları ve örnek fiyat listesi oluşturuldu.', who: 'Sistem', at: 'Örnek başlangıç kaydı', kind: 'stock' } ],
  };
}
export function reserved(state, product, warehouse) {
  const jobs = warehouse === 'cekmekoy' ? state.jobs.filter(j => j.stage >= 1 && j.stage <= 2).reduce((sum, j) => sum + (j.recipe[product] || 0), 0) : 0;
  const finished = warehouse === 'cekmekoy' ? state.jobs.filter(j => j.stage === 5 && j.finished === product).reduce((sum, j) => sum + j.qty, 0) : 0;
  return jobs + finished + state.transfers.filter(t => t.from === warehouse && t.stage === 0 && t.product === product).reduce((s, t) => s + t.qty, 0);
}
export function available(state, product, warehouse) {
  return Math.round((state.products.find(p => p.id === product).stock[warehouse] - reserved(state, product, warehouse)) * 1000) / 1000;
}
const validQty = (p, qty) => Number.isFinite(qty) && qty > 0 && (!['adet', 'takım', 'rulo'].includes(p.unit) || Number.isInteger(qty));
function requireValue(test, message) { if (!test) throw Error(message); }
export function applyAction(current, action) {
  const s = structuredClone(current);
  let text = '', who = 'Yönetici';
  const p = s.products.find(p => p.id === action.product);
  const w = action.warehouse;
  if (action.type === 'sale') {
    requireValue(p && ['karakoy', 'cekmekoy'].includes(w), 'Ürün ve depo seçin.');
    requireValue(validQty(p, action.qty), 'Geçerli miktar girin; adet, takım ve rulo tam sayı olmalıdır.');
    requireValue(action.customer?.trim(), 'Müşteri adını girin.');
    requireValue(Number.isFinite(action.price) && action.price > 0, 'Geçerli bir satış fiyatı girin.');
    requireValue(available(s, p.id, w) >= action.qty, 'Kullanılabilir stok yetersiz. Ayrılmış malzemeler satılamaz.');
    p.stock[w] -= action.qty;
    const sale = { id: `SAT-${1001 + s.sales.length}`, customer: action.customer.trim(), product: p.id, label: p.name, qty: action.qty, price: action.price, total: Math.round(action.qty * action.price * 100) / 100, warehouse: w, channel: action.channel || 'Manuel', paid: action.paid };
    s.sales.unshift(sale);
    text = `${num(action.qty)} ${p.unit} ${p.name} satıldı · ${warehouseNames[w]} · ${money(sale.total)}`;
    who = 'Mehmet Ali · Satış';
  } else if (action.type === 'payment') {
    const sale = s.sales.find(x => x.id === action.id);
    requireValue(sale && !sale.paid, 'Bu satış için bekleyen tahsilat yok.');
    sale.paid = true; text = `${sale.customer} · ${money(sale.total)} tahsil edildi.`; who = 'Mehmet Ali · Satış';
  } else if (action.type === 'count') {
    requireValue(p && ['karakoy', 'cekmekoy'].includes(w), 'Ürün ve depo seçin.');
    requireValue(Number.isFinite(action.qty) && action.qty >= 0 && (action.qty === 0 || validQty(p, action.qty)), 'Geçerli bir sayım miktarı girin.');
    requireValue(action.reason?.trim(), 'Sayım farkı için açıklama girin.');
    requireValue(action.qty >= reserved(s, p.id, w), 'Sayım, ayrılmış miktarın altında. Önce ilgili rezervasyonları inceleyin.');
    const diff = Math.round((action.qty - p.stock[w]) * 1000) / 1000;
    s.counts.unshift({ product: p.id, warehouse: w, before: p.stock[w], after: action.qty, diff, reason: action.reason });
    p.stock[w] = action.qty;
    text = `${p.name} sayımı onaylandı · ${warehouseNames[w]} · fark: ${diff > 0 ? '+' : ''}${num(diff)} ${p.unit}. ${action.reason}`;
  } else if (action.type === 'receipt') {
    requireValue(p && ['karakoy', 'cekmekoy'].includes(w) && validQty(p, action.qty), 'Geçerli ürün, depo ve miktar girin.');
    p.stock[w] += action.qty; text = `${p.name} · ${num(action.qty)} ${p.unit} mal kabulü · ${warehouseNames[w]}`; who = 'Depo';
  } else if (action.type === 'transfer') {
    requireValue(p && ['karakoy', 'cekmekoy'].includes(action.from) && validQty(p, action.qty), 'Geçerli ürün ve transfer miktarı girin.');
    requireValue(available(s, p.id, action.from) >= action.qty, 'Kaynak depoda yeterli kullanılabilir stok yok.');
    s.transfers.unshift({ id: `TRF-${1001 + s.transfers.length}`, product: p.id, qty: action.qty, from: action.from, to: action.from === 'karakoy' ? 'cekmekoy' : 'karakoy', stage: 0 });
    text = `${p.name} · ${num(action.qty)} ${p.unit} transfer için ayrıldı.`; who = 'Depo';
  } else if (action.type === 'transfer-next') {
    const t = s.transfers.find(x => x.id === action.id);
    requireValue(t && t.stage < 2, 'Transfer zaten tamamlanmış.');
    const item = s.products.find(x => x.id === t.product);
    if (t.stage === 0) { item.stock[t.from] -= t.qty; text = `${item.name} transferi yola çıktı.`; }
    else { item.stock[t.to] += t.qty; text = `${item.name} · ${warehouseNames[t.to]} deposunda teslim alındı.`; }
    t.stage++; who = 'Depo';
  } else if (action.type === 'price') {
    requireValue(p && Number.isFinite(action.price) && action.price > 0, 'Geçerli fiyat girin.');
    const before = p.price; p.price = action.price;
    text = `${p.name} liste fiyatı: ${money(before)} → ${money(p.price)}. Önceki satış fiyatları korundu.`;
  } else if (action.type === 'job') {
    requireValue(action.customer?.trim() && action.name?.trim() && Number.isInteger(action.qty) && action.qty > 0, 'Müşteri, iş adı ve pozitif tam sayı miktar girin.');
    requireValue(Number.isFinite(action.days) && action.days >= 1 && Number.isFinite(action.unitPrice) && action.unitPrice > 0, 'Referans süre ve fiyat girin.');
    const id = `PRJ-${26041 + s.jobs.length}`;
    s.jobs.push({ id, name: action.name.trim(), customer: action.customer.trim(), qty: action.qty, stage: 0, days: action.days, team: 3, unitPrice: action.unitPrice, deposit: 0, recipe: {}, note: action.note || 'Teknik hazırlık bekleniyor.', started: false });
    text = `${action.name} · ${num(action.qty)} adet özel üretim siparişi açıldı.`; who = 'Mehmet Ali · Satış';
  } else if (action.type === 'recipe') {
    const j = s.jobs.find(x => x.id === action.id);
    requireValue(j && j.stage <= 1, 'Reçete üretim sırasına alınmadan düzenlenebilir.');
    const entries = Object.entries(action.recipe).filter(([, qty]) => qty > 0);
    requireValue(entries.length > 0, 'En az bir malzeme miktarı girin.');
    for (const [id, qty] of Object.entries(action.recipe)) { const product = s.products.find(p => p.id === id); requireValue(product && Number.isFinite(qty) && qty >= 0 && (qty === 0 || validQty(product, qty)), 'Reçetede geçersiz malzeme miktarı var.'); }
    // Release this job's existing reservation before checking a revised recipe.
    j.stage = 0;
    for (const [id, qty] of entries) requireValue(available(s, id, 'cekmekoy') >= qty, 'Çekmeköy stoğu reçete için yetersiz. Mal kabulü veya transfer yapın.');
    j.recipe = Object.fromEntries(entries); j.stage = 1;
    text = `${j.id} teknik hazırlığı onaylandı, malzemeler ayrıldı.`; who = 'Erkan · Mühendislik';
  } else if (action.type === 'extra') {
    const j = s.jobs.find(x => x.id === action.id);
    requireValue(j && j.stage === 3 && p && validQty(p, action.qty), 'Ek tüketim yalnızca üretimdeki işler için girilebilir.');
    requireValue(available(s, p.id, 'cekmekoy') >= action.qty, 'Ek tüketim için stok yetersiz.');
    p.stock.cekmekoy -= action.qty; j.extra = { ...j.extra, [p.id]: (j.extra?.[p.id] || 0) + action.qty };
    text = `${j.id} · ek tüketim: ${num(action.qty)} ${p.unit} ${p.name}`; who = 'Ahmet · Üretim';
  } else if (action.type === 'job-next') {
    const j = s.jobs.find(x => x.id === action.id);
    requireValue(j && j.stage > 0 && j.stage < 6, 'Önce teknik reçeteyi onaylayın.');
    if (j.stage === 2 && !j.started) {
      requireValue(!s.jobs.some(other => other.id !== j.id && other.stage === 3), 'Üç kişilik üretim ekibi başka bir işte çalışıyor. Önce o işi tamamlayın.');
      for (const [id, qty] of Object.entries(j.recipe)) { const item = s.products.find(x => x.id === id); requireValue(item.stock.cekmekoy >= qty, 'Üretim malzemesi eksik.'); item.stock.cekmekoy -= qty; }
      j.started = true;
    }
    if (j.stage === 4) {
      if (!j.finished) {
        j.finished = `finished-${j.id}`;
        s.products.push({ id: j.finished, code: j.id, name: `${j.name} · ${j.id}`, category: 'Bitmiş ürün', unit: 'adet', price: j.unitPrice, min: 0, stock: { karakoy: 0, cekmekoy: 0 }, location: { karakoy: '—', cekmekoy: 'S-01' } });
      }
      s.products.find(p => p.id === j.finished).stock.cekmekoy += j.qty;
    }
    if (j.stage === 5) {
      const item = s.products.find(p => p.id === j.finished);
      requireValue(item.stock.cekmekoy >= j.qty, 'Teslim edilecek bitmiş ürün stoğu yetersiz.'); item.stock.cekmekoy -= j.qty;
      s.sales.unshift({ id: `SAT-${1001 + s.sales.length}`, customer: j.customer, product: j.finished, label: j.name, qty: j.qty, price: j.unitPrice, total: j.qty * j.unitPrice, warehouse: 'cekmekoy', channel: 'Üretim', paid: false, deposit: j.deposit });
    }
    j.stage++; text = `${j.id} · ${STAGES[j.stage]}`; who = j.stage === 5 ? 'Erkan · Test onayı' : j.stage === 6 ? 'Mehmet Ali · Teslimat' : 'Ahmet · Üretim';
  } else if (action.type === 'test-fail') {
    const j = s.jobs.find(x => x.id === action.id);
    requireValue(j?.stage === 4, 'İş test aşamasında değil.');
    requireValue(!s.jobs.some(other => other.id !== j.id && other.stage === 3), 'Üretim ekibi meşgul. Düzeltme için ekibin boşalmasını bekleyin.');
    j.stage = 3; text = `${j.id} testten geçmedi, düzeltme için üretime döndü. Malzemeler tekrar düşülmedi.`; who = 'Erkan · Test';
  } else throw Error('Bilinmeyen işlem.');
  s.events.unshift({ text, who, kind: action.type, at: new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul', dateStyle: 'short', timeStyle: 'short' }) });
  s.events = s.events.slice(0, 150);
  return s;
}
export function addWorkdays(date, amount) {
  const result = new Date(date);
  let left = Math.ceil(amount);
  while (left > 0) { result.setUTCDate(result.getUTCDate() + 1); if (![0, 6].includes(result.getUTCDay())) left--; }
  return result;
}
export function planJobs(state, queueDays = 0) {
  // Monday-based illustrative calendar. Dates deliberately stay stable across refreshes.
  let cursor = addWorkdays(new Date('2026-10-19T09:00:00Z'), queueDays);
  return state.jobs.filter(j => j.stage < 6).map(j => {
    const start = new Date(cursor); const end = j.stage >= 4 ? new Date(start) : addWorkdays(start, Math.max(0, j.days - 1));
    const needsReview = j.stage === 0;
    if (j.stage < 4) cursor = addWorkdays(end, 1);
    return { job: j, start, end, needsReview };
  });
}
