import { initialState, applyAction, available, reserved, num, money, STAGES, STORE, warehouseNames, planJobs } from './model.mjs';

const icons = {
 grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
 box: '<path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="M3 8v9l9 5 9-5V8M12 13v9M7.5 5.5l9 5"/>',
 cart: '<path d="M3 3h2l3 13h10l3-9H6"/><circle cx="9" cy="21" r="1"/><circle cx="18" cy="21" r="1"/>',
 factory: '<path d="M3 21V10l6 3V8l6 4V3h4l2 18H3Z"/><path d="M7 17h1m4 0h1m4 0h1"/>',
 calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18m-13 4h2m4 0h2m-8 3h2"/>',
 transfer: '<path d="M3 7h17m-5-5 5 5-5 5M21 17H4m5-5-5 5 5 5"/>',
 tag: '<path d="M3 3h8l10 10-8 8L3 11V3Z"/><circle cx="7.5" cy="7.5" r="1"/>',
 clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
 search: '<circle cx="10.5" cy="10.5" r="7"/><path d="m16 16 5 5"/>',
 arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
 plus: '<path d="M12 5v14M5 12h14"/>',
 chevron: '<path d="m9 5 7 7-7 7"/>',
 check: '<path d="m5 12 4 4L19 6"/>',
 alert: '<path d="m12 3 10 18H2L12 3Z"/><path d="M12 9v5m0 3v.2"/>',
 scan: '<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5M7 8v8m3-8v8m4-8v8m3-8v8"/>',
 down: '<path d="m6 9 6 6 6-6"/>',
 close: '<path d="m6 6 12 12M6 18 18 6"/>',
 reset: '<path d="M3 10a9 9 0 1 1 2 8M3 3v7h7"/>',
 download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
 leaf: '<path d="M5 20C-1 4 13 3 21 3c0 13-5 21-16 17Zm0 0L16 9"/>',
};
const icon = (name, cls = '') => `<svg class="icon ${cls}" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.box}</svg>`;
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
let state = initialState();
let storageWarning = '';
try { const saved = JSON.parse(localStorage.getItem(STORE) || 'null'); if (saved?.version === 1 && Array.isArray(saved.products) && Array.isArray(saved.jobs) && Array.isArray(saved.sales) && Array.isArray(saved.events) && Array.isArray(saved.counts) && Array.isArray(saved.transfers)) state = saved; }
catch { storageWarning = 'Kayıtlı demo okunamadı. Başlangıç örnekleri açıldı.'; }
let view = 'overview', warehouse = 'all', search = '', selectedJob = state.jobs[0].id, queueDays = 0, toastTimer, previousFocus;
const nav = [ ['overview', 'grid', 'Genel bakış'], ['inventory', 'box', 'Stok & sayım'], ['sales', 'cart', 'Satışlar'], ['production', 'factory', 'Üretim & test'], ['planning', 'calendar', 'Teslim planı'], ['transfers', 'transfer', 'Depo transferleri'], ['prices', 'tag', 'Fiyat listesi'], ['activity', 'clock', 'İşlem geçmişi'] ];
const headings = { overview: ['İşlerin bütünü, tek bakışta.', 'Bugün Artek’te neler oluyor?'], inventory: ['Stok & sayım', 'Doğru ürün, doğru miktar, doğru konum.'], sales: ['Satışlar', 'Tezgahtan teslimata, her satış kayıt altında.'], production: ['Üretim & test', 'Teknik hazırlıktan test onayına kadar.'], planning: ['Teslim planı', 'İş yükünü gör, müşteriye gerçekçi bir süre ver.'], transfers: ['Depo transferleri', 'Karaköy ile Çekmeköy arasında izlenebilir hareketler.'], prices: ['Fiyat listesi', 'Ortak liste, tutarlı teklifler.'], activity: ['İşlem geçmişi', 'Her değişikliğin arkasında bir kayıt.'] };
const date = d => new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short', timeZone: 'Europe/Istanbul' }).format(d);
function badge(text, tone = '') { return `<span class="badge ${tone}"><i></i>${esc(text)}</span>`; }
function stageBadge(stage) { return badge(STAGES[stage], stage === 3 ? 'orange' : stage >= 5 ? 'green' : stage === 4 ? 'purple' : 'neutral'); }
function button(label, action, type = 'primary', symbol = 'plus', extra = '') { return `<button class="btn ${type}" data-action="${action}" ${extra}>${symbol ? icon(symbol) : ''}${label}</button>`; }
function empty(title, text) { return `<div class="empty">${icon('box')}<h3>${title}</h3><p>${text}</p></div>`; }
function matches(...values) { return values.join(' ').toLocaleLowerCase('tr').includes(search.toLocaleLowerCase('tr')); }
function relevantSales() { return state.sales.filter(s => (warehouse === 'all' || s.warehouse === warehouse) && matches(s.customer, s.label, s.id)); }
function activeJobs() { return state.jobs.filter(j => j.stage < 6); }
function shortages() { return state.products.filter(p => p.category !== 'Bitmiş ürün' && p.min > 0 && (warehouse === 'all' ? available(state, p.id, 'karakoy') + available(state, p.id, 'cekmekoy') : available(state, p.id, warehouse)) < p.min); }
function shell() {
  const [title, subtitle] = headings[view];
  document.getElementById('app').innerHTML = `
  <aside class="sidebar">
    <a href="#overview" class="brand" aria-label="Artek genel bakış"><span class="brand-mark">a<span>+</span></span><span>artek<span class="brand-caption">OPERASYON MERKEZİ</span></span></a>
    <div class="workspace"><span class="workspace-avatar">AE</span><span><strong>Artek Elektronik</strong><small>İki depo. Tek merkez.</small></span><span class="workspace-dot"></span></div>
    <div class="nav-label">ÇALIŞMA ALANI</div>
    <nav aria-label="Ana menü">${nav.map(([id, glyph, title]) => `<a href="#${id}" aria-label="${title}" title="${title}" class="nav-link ${id === view ? 'active' : ''}" ${id === view ? 'aria-current="page"' : ''}>${icon(glyph)}<span>${title}</span>${id === 'production' ? `<span class="nav-count">${activeJobs().length}</span>` : ''}</a>`).join('')}</nav>
    <div class="sidebar-bottom"><div class="demo-note"><span class="demo-dot"></span> İnteraktif demo<p>Örnek verilerle özgürce deneyin.<br>Değişiklikler bu tarayıcıda saklanır.</p><button data-action="reset">${icon('reset')} Demoyu sıfırla</button></div><div class="profile"><span class="avatar">AY</span><div><strong>Artek Yönetim</strong><small>Demo çalışma alanı</small></div></div></div>
  </aside>
  <div class="main-shell">
    <header class="topbar"><div class="breadcrumb">Çalışma alanı ${icon('chevron')} <strong>${nav.find(n => n[0] === view)[2]}</strong></div><div class="topbar-right"><button class="sample-label" data-action="reset" title="Demo verilerini sıfırla" aria-label="Demo verilerini sıfırla"><i></i> Örnek veriler</button><span class="topbar-date">19 Ekim 2026, Pazartesi</span><span class="avatar small">AY</span></div></header>
    <main id="main"><div class="page-heading"><div><div class="eyebrow">ARTEK / ${view === 'overview' ? 'GÜNLÜK ÖZET' : 'OPERASYON'}</div><h1>${title}</h1><p>${subtitle}</p></div><div class="heading-actions">${view === 'inventory' ? button('Sayım başlat', 'count', 'secondary', 'scan') + button('Mal kabulü', 'receipt') : view === 'transfers' ? button('Yeni transfer', 'transfer') : view === 'production' ? button('Yeni üretim işi', 'job') : view === 'sales' ? button('Hızlı satış', 'sale') : view === 'planning' ? '' : button('Hızlı satış', 'sale', 'secondary', 'cart') + button('Yeni sipariş', 'job')}</div></div>
    ${storageWarning ? `<div class="notice">${esc(storageWarning)}</div>` : ''}
    <div class="filterbar"><div class="warehouse-tabs" role="group" aria-label="Depo filtresi">${[['all','Tüm depolar'],['karakoy','Karaköy'],['cekmekoy','Çekmeköy']].map(([id,label]) => `<button class="${warehouse === id ? 'selected' : ''}" data-warehouse="${id}" aria-pressed="${warehouse === id}">${id !== 'all' ? '<i></i>' : ''}${label}</button>`).join('')}</div><label class="search">${icon('search')}<input id="search" aria-label="Ekranda ara" placeholder="${view === 'inventory' || view === 'prices' ? 'Ürün adı veya kodu ara…' : 'Müşteri, ürün veya iş ara…'}" value="${esc(search)}"><kbd>/</kbd></label></div>
    <div id="view-content">${content()}</div>
    <footer class="page-footer"><span><span class="status-dot"></span> Demo verileri · Canlı stok ve fiyatlar değildir.</span><span>Artek Elektronik <span class="footer-plus">✳</span> Birlikte, daha düzenli.</span></footer></main>
  </div>`;
}
function content() { return ({ overview: overview, inventory, sales, production, planning, transfers, prices, activity })[view](); }
function overview() {
  const jobs = warehouse === 'karakoy' ? [] : activeJobs().filter(j => matches(j.name, j.customer, j.id));
  const sales = relevantSales(), revenue = sales.reduce((s, x) => s + x.total, 0), debts = sales.reduce((s, x) => s + (x.paid ? 0 : x.total - (x.deposit || 0)), 0);
  const critical = shortages();
  return `<section class="metrics" aria-label="Özet göstergeler">
    ${metric('Aktif üretim işi', num(jobs.length), 'factory', `${warehouse === 'karakoy' ? 'Üretim Çekmeköy’de yürütülür' : 'Çekmeköy · 3 kişilik üretim ekibi'}`, 'green')}
    ${metric('Kayıtlı satış toplamı', money(revenue), 'cart', `${sales.length} satış · manuel ve web örnekleri`, '')}
    ${metric('Kritik stok', num(critical.length), 'box', critical.length ? 'Minimum seviyenin altında' : 'Stok seviyeleri uygun', critical.length ? 'orange' : 'green')}
    ${metric('Bekleyen tahsilat', money(debts), 'clock', 'Teslim edilen satışların açık bakiyesi', '')}
  </section>
  <section class="overview-grid"><div class="left-column">
    <div class="panel production-panel"><div class="panel-header"><div><span class="section-kicker">ÜRETİM TAKİBİ</span><h2>Atölyede gündem</h2></div><a href="#production" class="text-link">Tüm işler ${icon('arrow')}</a></div>
      ${jobs.length ? jobs.slice(0, 3).map((j, i) => `<button class="job-row" data-action="open-job" data-id="${esc(j.id)}"><span class="job-symbol ${i ? 'muted' : ''}">${icon(i === 2 ? 'leaf' : 'factory')}</span><span class="job-description"><small>${esc(j.id)}</small><strong>${esc(j.name)}</strong><span>${esc(j.customer)}</span></span><span class="job-quantity">${num(j.qty)}<small>adet</small></span><span class="job-status">${stageBadge(j.stage)}<small>${j.stage === 0 ? 'Erkan · Teknik hazırlık' : j.stage === 4 ? 'Erkan · Test' : j.stage === 5 ? 'Mehmet Ali · Teslimat' : 'Ahmet · Üretim'}</small></span><span class="job-end">${j.days} iş günü<small>referans süre</small></span>${icon('chevron')}</button>`).join('') : empty('Aktif üretim işi yok', 'Üretim Çekmeköy’de takip edilir. Yeni bir iş açabilir veya depo filtresini değiştirebilirsiniz.')}
      <div class="panel-bottom"><span class="status-dot"></span> İş aşamaları satış, mühendislik ve üretim arasında ortak görünür.</div>
    </div>
    <div class="panel"><div class="panel-header"><div><span class="section-kicker">İKİ DEPO, TEK STOK GÖRÜNÜMÜ</span><h2>Depoların durumu</h2></div><a href="#inventory" class="text-link">Stoklara git ${icon('arrow')}</a></div><div class="warehouse-cards">${Object.entries(warehouseNames).map(([id,name]) => `<a href="#inventory" data-depot-link="${id}" class="warehouse-card"><div class="depot-icon ${id}">${icon(id === 'karakoy' ? 'box' : 'factory')}</div><div><h3>${name}</h3><p>${id === 'karakoy' ? 'Hazır ürün satışı' : 'Üretim, test ve malzeme'}</p></div>${icon('arrow')}<div class="warehouse-stats"><span><strong>${state.products.filter(p => p.stock[id] > 0).length}</strong> stoklu ürün çeşidi</span><span class="depot-pill">${id === 'karakoy' ? 'Satış deposu' : 'Üretim merkezi'}</span></div></a>`).join('')}</div></div>
    <div class="panel"><div class="panel-header"><div><span class="section-kicker">HAREKETLER</span><h2>Son işlemler</h2></div><a href="#activity" class="text-link">Geçmişi gör ${icon('arrow')}</a></div>${eventsList(state.events.slice(0, 3))}</div>
  </div><aside class="right-column"><div class="focus-card"><div class="focus-top"><span class="light-eyebrow">BİR SONRAKİ ADIM</span>${icon('arrow')}</div><h2>Defterden<br>ortak bir düzene.</h2><p>Bir satış kaydedin. Stok değişimini görün. Bir üretim işini test onayına taşıyın.</p><button data-action="sale">Hızlı satışı deneyin ${icon('arrow')}</button><div class="focus-art" aria-hidden="true"><span></span><span></span><span></span><i></i></div></div>
    <div class="panel attention"><div class="panel-header"><h2>Dikkat gerektirenler</h2><span class="counter">${critical.length + state.jobs.filter(j => j.stage === 0).length}</span></div>${critical.map(p => `<button class="attention-item" data-action="stock-product" data-id="${p.id}"><span class="warning-icon">${icon('alert')}</span><span><strong>${esc(p.name)}</strong><small>Kullanılabilir: ${num(warehouse === 'all' ? available(state,p.id,'karakoy')+available(state,p.id,'cekmekoy') : available(state,p.id,warehouse))} ${p.unit} · Alt sınır ${num(p.min)}</small></span>${icon('chevron')}</button>`).join('')}${state.jobs.filter(j => j.stage === 0).slice(0,2).map(j => `<button class="attention-item" data-action="open-job" data-id="${j.id}"><span class="waiting-icon">${icon('clock')}</span><span><strong>${esc(j.name)}</strong><small>Teknik reçete onayı bekleniyor</small></span>${icon('chevron')}</button>`).join('')}</div>
    <div class="mini-note">${icon('calendar')}<div><strong>Teslim sözü, görünür iş yüküyle.</strong><p>Plan ekranında kuyruğa ek iş günü ekleyip teslim önerisinin değişimini deneyin.</p><a href="#planning">Teslim planını aç ${icon('arrow')}</a></div></div>
  </aside></section>`;
}
function metric(label, value, glyph, note, tone) { return `<article class="metric"><div class="metric-top"><span>${label}</span><span class="metric-icon ${tone}">${icon(glyph)}</span></div><strong>${value}</strong><small class="${tone}">${tone ? '<i></i>' : ''}${note}</small></article>`; }
function inventory() {
  const rows = state.products.filter(p => matches(p.name,p.code,p.category)).flatMap(p => Object.keys(warehouseNames).filter(w => warehouse === 'all' || warehouse === w).map(w => ({p,w})));
  return `<div class="panel"><div class="panel-header"><div><h2>Depo envanteri <span class="inline-count">${rows.length} kayıt</span></h2><p>Stoklar ürün ve birim bazında gösterilir. Farklı birimler toplanmaz.</p></div>${button('CSV indir','export','secondary','download')}</div><div class="table-scroll"><table><thead><tr><th>Ürün / kod</th><th>Depo / konum</th><th class="numeric">Fiziksel</th><th class="numeric">Ayrılmış</th><th class="numeric">Kullanılabilir</th><th>Durum</th><th></th></tr></thead><tbody>${rows.map(({p,w}) => `<tr><td><strong>${esc(p.name)}</strong><small>${p.code} · ${p.unit}</small></td><td>${warehouseNames[w]}<small>${esc(p.location[w])}</small></td><td class="numeric">${num(p.stock[w])}</td><td class="numeric">${num(reserved(state,p.id,w))}</td><td class="numeric"><strong>${num(available(state,p.id,w))}</strong></td><td>${badge(p.stock[w] === 0 ? 'Stok yok' : available(state,p.id,w) < p.min ? 'Düşük stok' : 'Uygun', p.stock[w] === 0 ? 'neutral' : available(state,p.id,w) < p.min ? 'orange' : 'green')}</td><td><button class="icon-button" data-action="count" data-id="${p.id}" data-w="${w}" aria-label="${esc(p.name)} ${warehouseNames[w]} sayımı">${icon('scan')}</button></td></tr>`).join('')}</tbody></table></div>${!rows.length ? empty('Ürün bulunamadı','Arama metnini değiştirin.') : ''}<div class="panel-bottom">${icon('box')} Ayrılmış stok; üretim reçeteleri ve henüz gönderilmemiş transferleri kapsar.</div></div>${state.counts.length ? `<div class="panel space-top"><div class="panel-header"><h2>Onaylanan sayımlar</h2></div><div class="table-scroll"><table><thead><tr><th>Ürün</th><th>Depo</th><th>Önceki</th><th>Sayılan</th><th>Fark</th><th>Açıklama</th></tr></thead><tbody>${state.counts.map(c=>`<tr><td>${esc(state.products.find(p=>p.id===c.product).name)}</td><td>${warehouseNames[c.warehouse]}</td><td>${num(c.before)}</td><td>${num(c.after)}</td><td>${num(c.diff)}</td><td>${esc(c.reason)}</td></tr>`).join('')}</tbody></table></div></div>` : ''}`;
}
function sales() {
  const list = relevantSales();
  return `<div class="notice soft">${icon('check')} Hızlı satış demoda anında teslim edilir ve stoktan düşer. Web siparişi düğmesi de aynı stok kontrolünü kullanan bir örnek oluşturur.</div><div class="panel"><div class="panel-header"><div><h2>Satış kayıtları</h2><p>Ödeme, kanal ve satış anındaki fiyat birlikte görünür.</p></div>${button('Web siparişi dene','web-sale','secondary','cart')}</div><div class="table-scroll"><table><thead><tr><th>Müşteri / satış</th><th>Ürün</th><th>Miktar</th><th>Depo / kanal</th><th class="numeric">Tutar</th><th>Ödeme</th><th></th></tr></thead><tbody>${list.map(s=>`<tr><td><strong>${esc(s.customer)}</strong><small>${esc(s.id)}</small></td><td>${esc(s.label)}<small>Birim fiyat: ${money(s.price)}</small></td><td>${num(s.qty)}</td><td>${warehouseNames[s.warehouse]}<small>${s.channel}</small></td><td class="numeric"><strong>${money(s.total)}</strong>${s.deposit ? `<small>Kapora: ${money(s.deposit)}</small>` : ''}</td><td>${badge(s.paid ? 'Ödendi' : 'Tahsilat bekliyor', s.paid ? 'green' : 'orange')}</td><td>${s.paid ? '' : `<button class="btn small-btn secondary" data-action="payment" data-id="${s.id}">Tahsil et</button>`}</td></tr>`).join('')}</tbody></table></div>${list.length ? '' : empty('Satış bulunamadı','Yeni bir satış kaydedin veya aramanızı değiştirin.')}</div>`;
}
function production() {
  if (warehouse === 'karakoy') return empty('Üretim Çekmeköy’de yürütülür','Üretim işlerini görmek için Çekmeköy veya Tüm depolar filtresini seçin.');
  const list = state.jobs.filter(j=>matches(j.name,j.customer,j.id));
  let j = list.find(j=>j.id===selectedJob) || list[0];
  if (!j) return empty('Üretim işi bulunamadı','Yeni iş açabilir veya arama metnini değiştirebilirsiniz.');
  selectedJob = j.id;
  const nextLabels = {1:'Üretim sırasına al',2:'Üretime başla',3:'Üretimi tamamla',4:'Testi onayla',5:'Teslimatı tamamla'};
  return `<div class="production-layout"><div class="job-list">${list.map(x=>`<button class="job-select ${x.id===j.id?'selected':''}" data-action="select-job" data-id="${x.id}"><small>${esc(x.id)}</small><strong>${esc(x.name)}</strong><span>${esc(x.customer)}</span><div>${stageBadge(x.stage)}<b>${num(x.qty)} adet</b></div></button>`).join('')}</div><div class="panel job-detail"><div class="panel-header"><div><span class="section-kicker">${esc(j.id)} · ÇEKMEKÖY</span><h2>${esc(j.name)}</h2><p>${esc(j.customer)} · ${num(j.qty)} adet · ${j.team} kişilik ekip</p></div>${stageBadge(j.stage)}</div><div class="job-body"><div class="stepper">${STAGES.map((label,i)=>`<div class="step ${i<j.stage?'done':i===j.stage?'current':''}"><span>${i<j.stage?icon('check'):i+1}</span><small>${label}</small></div>`).join('')}</div><div class="detail-note">${icon('factory')}<p>${esc(j.note)}</p></div><div class="detail-stats"><div><small>Referans süre</small><strong>${j.days} iş günü</strong></div><div><small>Sipariş tutarı</small><strong>${money(j.qty*j.unitPrice)}</strong></div><div><small>Teknik ve test</small><strong>Erkan</strong></div><div><small>Üretim sorumlusu</small><strong>Ahmet</strong></div></div><div class="subheading"><h3>İşe özel malzeme reçetesi</h3>${j.stage<=1?button('Reçeteyi düzenle','recipe','secondary','tag',`data-id="${j.id}"`):''}</div>${Object.keys(j.recipe).length?`<div class="table-scroll"><table><thead><tr><th>Malzeme</th><th class="numeric">Planlanan</th><th class="numeric">Ek tüketim</th><th>Durum</th></tr></thead><tbody>${Object.entries(j.recipe).map(([id,qty])=>{const p=state.products.find(p=>p.id===id);return `<tr><td><strong>${esc(p.name)}</strong><small>${p.code}</small></td><td class="numeric">${num(qty)} ${p.unit}</td><td class="numeric">${num(j.extra?.[id]||0)} ${p.unit}</td><td>${badge(j.started?'Üretime verildi':'İşe ayrıldı',j.started?'neutral':'green')}</td></tr>`;}).join('')}</tbody></table></div>`:empty('Teknik reçete hazırlanacak','Erkan Bey malzemeleri ve miktarlarını tanımladıktan sonra iş üretime alınabilir.')}<div class="job-actions">${j.stage===0?button('Teknik hazırlığı yap','recipe','primary','tag',`data-id="${j.id}"`):j.stage<6?button(nextLabels[j.stage],'job-next','primary',j.stage===4?'check':'arrow',`data-id="${j.id}"`):badge('Sipariş teslim edildi','green')}${j.stage===3?button('Ek malzeme tüketimi','extra','secondary','plus',`data-id="${j.id}"`):''}${j.stage===4?button('Düzeltmeye gönder','test-fail','secondary','reset',`data-id="${j.id}"`):''}</div><div class="hint">Test onayında bitmiş ürün stoğu oluşur. Teslimatta ürün çıkar ve satış kaydı açılır. Demo, işin tamamını tek parti olarak ilerletir.</div></div></div></div>`;
}
function planning() {
  const plan = warehouse === 'karakoy' ? [] : planJobs(state,queueDays).filter(p=>matches(p.job.name,p.job.customer,p.job.id));
  return `<div class="planning-hero"><div><span class="section-kicker">KAPASİTE SİMÜLASYONU</span><h2>İş kuyruğu değişirse teslim ne olur?</h2><p>Çekmeköy’de üç kişilik tek üretim ekibi varsayılır. Referans takvim: 19 Ekim 2026. Hafta sonları hariçtir.</p></div><label class="queue-control">Öne eklenecek bekleme<select id="queue-days">${[0,1,2,3,5,10].map(n=>`<option value="${n}" ${n===queueDays?'selected':''}>${n} iş günü</option>`).join('')}</select></label></div><div class="panel"><div class="panel-header"><div><h2>Önerilen iş sırası</h2><p>Süreler mühendislik referansıdır; sipariş miktarından otomatik ölçeklenmez.</p></div>${badge('İnsan onayı gerekli','orange')}</div><div class="plan-list">${plan.map(({job:j,start,end,needsReview},i)=>`<div class="plan-row"><span class="plan-number">${String(i+1).padStart(2,'0')}</span><div class="plan-job"><strong>${esc(j.name)}</strong><small>${esc(j.id)} · ${num(j.qty)} adet</small></div><div class="plan-dates"><small>${j.stage>=4?'Kontrol / teslim önerisi':'Başlangıç → bitiş'}</small><strong>${date(start)} ${j.stage>=4?'':`→ ${date(end)}`}</strong></div><div class="plan-bar"><span style="width:${Math.min(100,j.days*20)}%"></span><small>${j.stage>=4?'Üretim tamamlandı':`${j.days} iş günü · ${j.team} kişi`}</small></div>${badge(needsReview?'Teknik hazırlık bekliyor':j.stage>=4?'Test / teslim bekliyor':'Malzemesi ayrılmış',needsReview?'orange':'green')}</div>`).join('')}${plan.length?'':empty('Planlanacak iş yok','Depo filtresini veya aramayı değiştirin.')}</div><div class="panel-bottom">${icon('alert')} Bu bir senaryo hesabıdır. Tedarik, tatil, kısmi üretim ve müşteri onayı gerçek planlama sürümünde ayrıntılandırılacak.</div></div>`;
}
function transfers() {
  const list = state.transfers.filter(t=>(warehouse==='all'||t.from===warehouse||t.to===warehouse)&&matches(state.products.find(p=>p.id===t.product).name,t.id));
  return `<div class="notice soft">${icon('transfer')} Transfer açıldığında kaynak stok ayrılır. Gönderimde kaynak depodan çıkar, teslim alındığında hedef depoya eklenir.</div><div class="panel"><div class="panel-header"><h2>Depolar arası hareketler</h2><span class="inline-count">${list.length} transfer</span></div>${list.length?`<div class="table-scroll"><table><thead><tr><th>Ürün</th><th>Güzergâh</th><th>Miktar</th><th>Durum</th><th></th></tr></thead><tbody>${list.map(t=>{const p=state.products.find(p=>p.id===t.product);return `<tr><td><strong>${esc(p.name)}</strong><small>${t.id}</small></td><td>${warehouseNames[t.from]} → ${warehouseNames[t.to]}</td><td>${num(t.qty)} ${p.unit}</td><td>${badge(['Hazırlanıyor','Yolda','Teslim alındı'][t.stage],['neutral','orange','green'][t.stage])}</td><td>${t.stage<2?button(t.stage===0?'Gönder':'Teslim al','transfer-next','secondary','arrow',`data-id="${t.id}"`):''}</td></tr>`;}).join('')}</tbody></table></div>`:empty('Henüz transfer yok','Yeni transfer açarak iki depo arasındaki akışı deneyin.')}</div>`;
}
function prices() {
 const rows=state.products.filter(p=>p.category!=='Bitmiş ürün'&&matches(p.name,p.code));
 return `<div class="notice soft">${icon('tag')} Fiyatlar yalnızca demo içindir. Liste değişiklikleri geçmiş satışların fiyatını değiştirmez. Vergi hesabı bu demoya dahil değildir.</div><div class="panel"><div class="panel-header"><h2>Ortak ürün fiyatları</h2><span class="inline-count">TRY · Örnek fiyatlar</span></div><div class="table-scroll"><table><thead><tr><th>Ürün</th><th>Kategori</th><th>Birim</th><th class="numeric">Liste fiyatı</th><th></th></tr></thead><tbody>${rows.map(p=>`<tr><td><strong>${esc(p.name)}</strong><small>${p.code}</small></td><td>${p.category}</td><td>${p.unit}</td><td class="numeric"><strong>${money(p.price)}</strong></td><td>${button('Düzenle','price','secondary','tag',`data-id="${p.id}"`)}</td></tr>`).join('')}</tbody></table></div></div>`;
}
function eventsList(events) { return `<div class="events">${events.map(e=>`<div class="event"><span class="event-icon">${icon(['sale','payment'].includes(e.kind)?'cart':e.kind==='price'?'tag':e.kind==='production'||e.kind.startsWith('job')?'factory':'box')}</span><div><strong>${esc(e.text)}</strong><small>${esc(e.who)}</small></div><time>${esc(e.at)}</time></div>`).join('')}</div>`; }
function activity() { const events=state.events.filter(e=>matches(e.text,e.who)); return `<div class="panel"><div class="panel-header"><div><h2>İşlem kayıtları</h2><p>Bu tarayıcıdaki son 150 demo işlemi saklanır.</p></div><span class="inline-count">${events.length} kayıt</span></div>${events.length?eventsList(events):empty('Kayıt bulunamadı','Arama metnini değiştirin.')}</div>`; }
function toast(message, error=false) { const t=document.getElementById('toast'); t.textContent=message; t.className=`show ${error?'error':''}`; clearTimeout(toastTimer); toastTimer=setTimeout(()=>{t.className='';},4500); }
function commit(action) {
  try { const next=applyAction(state,action); state=next; try {localStorage.setItem(STORE,JSON.stringify(next));} catch {storageWarning='Tarayıcı kaydı kullanılamıyor. Bu oturumdaki değişiklikler sayfa yenilenince kaybolabilir.';} closeModal(); shell(); toast(state.events[0].text); return true; }
  catch(e) { const output=document.getElementById('form-error'); if(output) output.textContent=e.message; else toast(e.message,true); return false; }
}
function productOptions(selected='', finished=false) { return state.products.filter(p=>finished||p.category!=='Bitmiş ürün').map(p=>`<option value="${p.id}" ${p.id===selected?'selected':''}>${esc(p.name)} (${p.unit})</option>`).join(''); }
function warehouseOptions(selected='karakoy') { return Object.entries(warehouseNames).map(([id,name])=>`<option value="${id}" ${selected===id?'selected':''}>${name}</option>`).join(''); }
function field(label, input, full=false) { return `<label class="field ${full?'full':''}"><span>${label}</span>${input}</label>`; }
function input(name, value='', attrs='') { return `<input name="${name}" value="${esc(value)}" ${attrs}>`; }
function modal(title, description, body, submit='Kaydet', type='', id='') {
  previousFocus=document.activeElement;
  const m=document.getElementById('modal');
  m.innerHTML=`<div class="modal-top"><span class="section-kicker">ARTEK · DEMO İŞLEMİ</span><button class="icon-button" data-action="close-modal" aria-label="Pencereyi kapat">${icon('close')}</button></div><h2 id="modal-title">${title}</h2><p class="modal-description">${description}</p><form id="demo-form" data-type="${type}" data-id="${id}"><div class="form-grid">${body}</div><p id="form-error" role="alert"></p><div class="modal-actions"><button type="button" class="btn secondary" data-action="close-modal">Vazgeç</button><button type="submit" class="btn primary">${submit}${icon('arrow')}</button></div></form>`;
  m.showModal();
}
function closeModal() { const m=document.getElementById('modal'); if(m.open) m.close(); }
document.getElementById('modal').addEventListener('close',()=>previousFocus?.isConnected&&previousFocus.focus());
function openForm(type,id='',w='') {
  const p=state.products.find(p=>p.id===id)||state.products[0];
  const defaultW=w|| (warehouse==='all'?'karakoy':warehouse);
  const productField=field('Ürün',`<select name="product">${productOptions(p.id, type === 'count')}</select>`,true);
  const qtyField=field('Miktar',input('qty',1,'type="number" min="0.001" step="any" required'));
  const warehouseField=field('Depo',`<select name="warehouse">${warehouseOptions(defaultW)}</select>`);
  if(type==='sale'||type==='web-sale') {
    modal(type==='web-sale'?'Örnek web siparişi':'Hızlı hazır ürün satışı','Teslim edilen ürün stoktan düşer. Üretime ayrılan malzemeler korunur.',`${productField}${warehouseField}${qtyField}${field('Müşteri',input('customer',type==='web-sale'?'Örnek Web Müşterisi':'','required placeholder="Müşteri veya firma adı"'),true)}${field('Birim fiyat · ₺',input('price',p.price,'type="number" min="0.01" step="0.01" required'))}${field('Ödeme',`<select name="paid"><option value="true">Ödeme alındı</option><option value="false">Tahsilat bekliyor</option></select>`)}<div id="availability" class="form-hint full"></div>`,type==='web-sale'?'Web satışını oluştur':'Satışı tamamla',type); updateFormHint();
  } else if(type==='count') {
    modal('Stok sayımını onayla','Demoda sayım ve yönetici onayı tek adımda gösterilir. Ayrılmış stok korunur.',`${productField}${warehouseField}${field('Sayılan miktar',input('qty',p.stock[defaultW],'type="number" min="0" step="any" required'))}${field('Açıklama / fark nedeni',`<textarea name="reason" required placeholder="Örn. A-01 rafı tekrar sayıldı."></textarea>`,true)}<div id="availability" class="form-hint full"></div>`,'Sayımı onayla','count'); updateFormHint();
  } else if(type==='receipt') {
    modal('Mal kabulü','Teslim alınan miktar seçtiğiniz deponun fiziksel stoğuna eklenir.',`${productField}${warehouseField}${qtyField}`,'Stoğa ekle','receipt');
  } else if(type==='transfer') {
    modal('Yeni depo transferi','Malzemeler önce ayrılır; gönderim ve teslim alma ayrı adımlardır.',`${productField}${field('Kaynak depo',`<select name="from">${warehouseOptions(defaultW)}</select>`)}${qtyField}<div id="availability" class="form-hint full"></div>`,'Transferi oluştur','transfer'); updateFormHint();
  } else if(type==='price') {
    modal('Liste fiyatını düzenle',esc(p.name)+' · Önceki satışların fiyatları korunur.',`${field('Yeni birim fiyat · ₺',input('price',p.price,'type="number" min="0.01" step="0.01" required'),true)}`,'Fiyatı güncelle','price',p.id);
  } else if(type==='job') {
    modal('Müşteriye özel üretim siparişi','Yeni iş Erkan Bey’in teknik hazırlık listesine eklenir.',`${field('Müşteri',input('customer','','required placeholder="Firma adı"'),true)}${field('İş / ürün adı',input('name','','required placeholder="Örn. Özel sarım trafo"'),true)}${field('Sipariş miktarı · adet',input('qty',1000,'type="number" min="1" step="1" required'))}${field('Referans süre · iş günü',input('days',4,'type="number" min="1" step="1" required'))}${field('Teklif birim fiyatı · ₺',input('unitPrice',185,'type="number" min="0.01" step="0.01" required'))}${field('Üretim ekibi',input('team','3 kişi','disabled'))}${field('Teknik not',`<textarea name="note" placeholder="Müşterinin talebi veya teknik hazırlık notu"></textarea>`,true)}`,'Siparişi aç','job');
  } else if(type==='recipe') {
    const j=state.jobs.find(j=>j.id===id);
    modal('Teknik hazırlık & malzeme reçetesi',`${esc(j.name)} · ${num(j.qty)} adet. Miktarlar işin tamamı içindir; sıfır girilen malzeme kullanılmaz.`,state.products.filter(p=>p.category!=='Bitmiş ürün').map(p=>field(`${esc(p.name)} · ${p.unit}`,input(`recipe-${p.id}`,j.recipe[p.id]||0,'type="number" min="0" step="any" required'))).join('')+'<p class="form-hint full">Onaylandığında malzemeler Çekmeköy stoğundan bu işe ayrılır. Stok yetersizse önce mal kabulü veya transfer yapın.</p>','Teknik hazırlığı onayla','recipe',id);
  } else if(type==='extra') {
    modal('Ek üretim tüketimi','Üretim sırasında ortaya çıkan ek ihtiyaç Çekmeköy stoğundan düşer.',`${productField}${qtyField}`,'Tüketimi kaydet','extra',id);
  } else if(type==='reset') {
    modal('Demo başlangıcına dön','Bu tarayıcıda yaptığınız denemeler silinecek; örnek stoklar ve işler geri yüklenecek.','<p class="form-hint full">Canlı sistem veya gerçek şirket verisi etkilenmez.</p>','Demoyu sıfırla','reset');
  }
}
function updateFormHint() {
 const f=document.getElementById('demo-form'), hint=document.getElementById('availability'); if(!f||!hint)return;
 const p=state.products.find(p=>p.id===f.elements.product.value), w=f.elements.warehouse?.value||f.elements.from?.value;
 hint.textContent=`${warehouseNames[w]} · Fiziksel: ${num(p.stock[w])} ${p.unit} · Ayrılmış: ${num(reserved(state,p.id,w))} · Kullanılabilir: ${num(available(state,p.id,w))}`;
}
document.addEventListener('submit',event=>{
 if(event.target.id!=='demo-form')return; event.preventDefault();
 const f=event.target, data=Object.fromEntries(new FormData(f)), type=f.dataset.type;
 if(type==='reset') {state=initialState();storageWarning='';try{localStorage.removeItem(STORE);}catch{storageWarning='Tarayıcı depolamasına erişilemiyor.';}selectedJob=state.jobs[0].id;closeModal();shell();toast('Demo başlangıç verilerine döndü.');return;}
 const action={...data,type:type==='web-sale'?'sale':type,id:f.dataset.id,qty:Number(data.qty),price:Number(data.price),days:Number(data.days),unitPrice:Number(data.unitPrice),paid:data.paid==='true'};
 if(type==='web-sale')action.channel='Web demo';
 if(type==='price')action.product=f.dataset.id;
 if(type==='recipe')action.recipe=Object.fromEntries(Object.entries(data).filter(([key])=>key.startsWith('recipe-')).map(([key,value])=>[key.slice(7),Number(value)]));
 commit(action);
});
document.addEventListener('change',event=>{
 if(event.target.id==='queue-days'){queueDays=Number(event.target.value);document.getElementById('view-content').innerHTML=content();}
 const f=event.target.closest('#demo-form');
 if(f&&['product','warehouse','from'].includes(event.target.name)) {
  const p=state.products.find(p=>p.id===f.elements.product.value);
  if(event.target.name==='product'&&f.elements.price)f.elements.price.value=p.price;
  if(f.dataset.type==='count')f.elements.qty.value=p.stock[f.elements.warehouse.value];
  updateFormHint();
 }
});
document.addEventListener('input',event=>{if(event.target.id==='search'){search=event.target.value;document.getElementById('view-content').innerHTML=content();}});
document.addEventListener('click',event=>{
 const depot=event.target.closest('[data-depot-link]'); if(depot)warehouse=depot.dataset.depotLink;
 const filter=event.target.closest('[data-warehouse]'); if(filter){warehouse=filter.dataset.warehouse;shell();return;}
 const b=event.target.closest('[data-action]'); if(!b)return;
 const {action,id,w}=b.dataset;
 if(action==='close-modal'){closeModal();return;}
 if(action==='open-job'){selectedJob=id;warehouse='cekmekoy';search='';if(location.hash==='#production')shell();else location.hash='production';return;}
 if(action==='select-job'){selectedJob=id;document.getElementById('view-content').innerHTML=content();return;}
 if(action==='stock-product'){search=state.products.find(p=>p.id===id).code;location.hash='inventory';return;}
 if(['job-next','test-fail','transfer-next','payment'].includes(action)){commit({type:action,id});return;}
 if(action==='export'){exportCsv();return;}
 openForm(action,id,w);
});
document.addEventListener('keydown',event=>{if(event.key==='/'&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)&&!document.getElementById('modal').open){event.preventDefault();document.getElementById('search').focus();}});
function exportCsv() {
 const rows=[['Ürün kodu','Ürün','Depo','Konum','Birim','Fiziksel','Ayrılmış','Kullanılabilir']];
 state.products.filter(p=>matches(p.name,p.code,p.category)).forEach(p=>Object.keys(warehouseNames).filter(w=>warehouse==='all'||warehouse===w).forEach(w=>rows.push([p.code,p.name,warehouseNames[w],p.location[w],p.unit,p.stock[w],reserved(state,p.id,w),available(state,p.id,w)])));
 const safe=value=>{let s=String(value);if(/^[=+@-]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';};
 const url=URL.createObjectURL(new Blob(['\uFEFF'+rows.map(r=>r.map(safe).join(';')).join('\r\n')],{type:'text/csv;charset=utf-8'}));
 const a=document.createElement('a');a.href=url;a.download='artek-demo-stok.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Görüntülenen stok kayıtları CSV olarak indirildi.');
}
window.addEventListener('hashchange',()=>{view=nav.some(n=>n[0]===location.hash.slice(1))?location.hash.slice(1):'overview';shell();window.scrollTo(0,0);});
view=nav.some(n=>n[0]===location.hash.slice(1))?location.hash.slice(1):'overview';shell();
