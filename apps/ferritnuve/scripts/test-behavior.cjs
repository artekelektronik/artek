/* eslint-disable @typescript-eslint/no-require-imports */
// Runs against the implementation using the project's existing TypeScript compiler.
const fs = require('node:fs');
const ts = require('typescript');
const assert = require('node:assert/strict');
const {test} = require('node:test');
require.extensions['.ts'] = (module, filename) => {
  const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
  module._compile(source, filename);
};
const {toSiteProducts, findProductBySlug} = require('../lib/catalog.ts');
const {productGroups, catalogLabel} = require('../lib/product-taxonomy.ts');
const {generateProductSlug} = require('../lib/utils.ts');
const {productContent} = require('../lib/product-content.ts');
const {inquiryLinks} = require('../lib/inquiry.ts');
// A saved response of the stok app's public catalog API, so the tests don't need the network.
const products = toSiteProducts(require('./catalog-fixture.json').products);
const getProductBySlug = slug => findProductBySlug(products, slug);

test('every catalog group targets matching records; empty groups use introductions', () => {
  assert.equal(productGroups.find(g=>g.key==='bobbins').href,'/bobin');
  assert.equal(productGroups.find(g=>g.key==='transformers').href,'/transformator');
  assert.equal(productGroups.find(g=>g.key==='inductors').href,'/bobin#applications');
  for (const group of productGroups.filter(g=>g.href.startsWith('/products?'))) {
    const category = new URL(group.href,'https://test.invalid').searchParams.get('categories');
    const matches = products.filter(p=>p.fields.Category===category);
    assert.ok(matches.length > 0);
    if(group.key==='emi') assert.ok(matches.every(p=>/filter/i.test(p.fields['Product Name'])));
  }
});
test('all product slugs resolve uniquely without changing existing IDs', () => {
  const slugs = products.map(p=>generateProductSlug(p.fields['Product Name'],p.id));
  assert.equal(new Set(slugs).size,products.length);
  for (let i=0;i<products.length;i++) assert.equal(getProductBySlug(slugs[i]).id,products[i].id);
  assert.equal(getProductBySlug('unknown-999999'),undefined);
});
test('all existing descriptions have English counterparts; codes and brands remain unchanged', () => {
  for(const product of products) {
    const before=JSON.stringify(product);
    const content=productContent(product,'en');
    assert.ok(content.name);
    if(product.fields.Description) assert.ok(content.description, product.id);
    assert.equal(JSON.stringify(product),before);
  }
  assert.equal(catalogLabel('YUVARLAK','en'),'Round');
  assert.equal(catalogLabel('EE','en'),'EE');
  assert.ok(productContent(products[10],'en').reviewRequired);
  assert.match(productContent(products[2],'en').description,/Dimensions: 52 x 44 x 29\n/);
});
test('WhatsApp and email drafts contain name, unchanged code and localized product URL', () => {
  for(const locale of ['tr','en']) {
    const product=products[2];
    const name=productContent(product,locale).name;
    const url=`https://www.ferritnuve.com/${locale==='en'?'en/':''}products/example-000003`;
    const links=inquiryLinks(name,product.fields['Product Code'],url,locale);
    const whatsapp=new URL(links.whatsapp);
    const email=new URL(links.email);
    assert.equal(whatsapp.hostname,'wa.me');
    assert.notEqual(whatsapp.pathname,'/905551234567');
    for(const body of [whatsapp.searchParams.get('text'),email.searchParams.get('body')]) {
      assert.ok(body.includes(name));assert.ok(body.includes(product.fields['Product Code']));assert.ok(body.includes(url));
    }
  }
});
test('catalog products keep their old ids, so existing URLs and translations still work', () => {
  assert.equal(products.length, 92);
  products.forEach((p, i) => assert.equal(p.id, 'rec' + String(i + 1).padStart(14, '0')));
  assert.equal(getProductBySlug('power-filter-000001').fields['Product Name'], 'POWER FILTER');
});
test('the site receives no stock, prices or internal fields from the catalog', () => {
  const internal = ['Stock Quantity', 'Stock (Karakoy)', 'Stock (Cekmekoy)', 'Total Stock Value', 'Unit Price', 'Alış Fiyatı', 'Toptan Fiyatı', 'Parakende Fiyatı', 'Supplier'];
  for (const product of products) for (const field of internal) assert.equal(product.fields[field], undefined, field);
});

test('published blog guides have working source anchors and safe rendered markup', () => {
  const {blogPosts, englishBlogPosts, getBlogPost, renderBlogMarkdown, blogStructuredData, productGuideSlug} = require('../lib/blog.ts');
  assert.equal(blogPosts.length, 24);
  assert.equal(new Set(blogPosts.map(post => post.slug)).size, 24);
  for (const post of [...blogPosts, ...englishBlogPosts]) {
    const ids = [...post.html.matchAll(/id="([^"]+)"/g)].map(match => match[1]);
    assert.equal(new Set(ids).size, ids.length);
    for (const match of post.html.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.includes(match[1]), `${post.slug}: ${match[1]}`);
    assert.doesNotMatch(post.html, /onay bekleyen|noindex|javascript:|<script/i);
    const graph = blogStructuredData(post, 'https://www.ferritnuve.com')['@graph'];
    assert.equal(graph[0].mainEntityOfPage['@id'], `https://www.ferritnuve.com${post.locale === 'en' ? '/en' : ''}/blog/${post.slug}`);
    assert.equal(graph[0].inLanguage, post.locale === 'en' ? 'en' : 'tr-TR');
    for (const locale of ['tr', 'en']) assert.ok(getBlogPost(post.translations[locale], locale));
    if (post.locale === 'en') {
      assert.match(post.html, /aria-label="Source /);
      assert.match(post.html, /href="\/en\/contact"/);
    }
    assert.equal(graph[1].itemListElement.at(-1).item, graph[0].mainEntityOfPage['@id']);
  }
  const sample = renderBlogMarkdown('# Başlık\n\nGiriş\n\n## Bölüm\n\n<img src=x onerror=alert(1)> [yerel](https://www.ferritnuve.com/contact)');
  assert.doesNotMatch(sample.html, /<img/);
  assert.match(sample.html, /&lt;img/);
  assert.match(sample.html, /href="\/contact"/);
  for (const [category, type] of [['PEM', undefined], ['IRON-POWDER', undefined], ['Ferrit', ['ETD']], ['Ferrit', ['YUVARLAK']], ['Ferrit', ['YASSI']], ['Ferrit', ['TOROID']], ['Ferrit', ['CUBUK']]]) {
    assert.ok(blogPosts.some(post => post.slug === productGuideSlug(category, type)));
  }
});
test('the guides read as one library: every guide sits in exactly one chapter, with previous and next in reading order', () => {
  const {blogPosts, englishBlogPosts, libraryChapters, readingNeighbours} = require('../lib/blog.ts');
  for (const [locale, posts] of [['tr', blogPosts], ['en', englishBlogPosts]]) {
    const chapters = libraryChapters(locale);
    const order = chapters.flatMap(chapter => chapter.posts);
    assert.deepEqual(order.map(post => post.slug).sort(), posts.map(post => post.slug).sort());
    assert.deepEqual(chapters.map(chapter => chapter.number), chapters.map((_, index) => index + 1));
    for (const chapter of chapters) assert.ok(chapter.posts.length > 0 && chapter.title && chapter.intro, chapter.key);
    assert.equal(readingNeighbours(order[0].slug, locale).previous, undefined);
    assert.equal(readingNeighbours(order.at(-1).slug, locale).next, undefined);
    for (const [index, post] of order.entries()) {
      const {previous, next, chapter} = readingNeighbours(post.slug, locale);
      assert.equal(previous?.slug, order[index - 1]?.slug);
      assert.equal(next?.slug, order[index + 1]?.slug);
      assert.ok(chapter.posts.includes(post));
    }
  }
  // The book opens with what a ferrite core is, then the overview of shapes.
  assert.deepEqual(libraryChapters('tr')[0].posts.map(post => post.slug).slice(0, 2), ['ferrit-nuve-nedir', 'ferrit-nuve-cesitleri']);
  assert.equal(readingNeighbours('what-is-a-ferrite-core', 'en').next.slug, 'ferrite-core-shapes');
});
test('every blog guide lists its own catalog products and links to them in the catalog', () => {
  const {blogPosts, productGuideSlug, relatedProducts, guideShapes} = require('../lib/blog.ts');
  for (const post of blogPosts) {
    const related = relatedProducts(products, post.slug);
    assert.ok(related.products.length > 0 && related.products.length <= 4, post.slug);
    for (const product of related.products) {
      if (post.slug === 'ozel-trafo-teklif-rehberi') {
        assert.equal(product.fields.Category, 'Ferrit');
        assert.ok(product.fields['Ürün Tipi'].some(type => ['EE', 'ETD'].includes(type)));
      } else if (post.slug === '26-52-toroid-karsilastirmasi') {
        assert.equal(product.fields.Category, 'IRON-POWDER');
        assert.match(product.fields['Product Name'], /-\s*(26|52)\s*$/);
      } else if (post.slug === 'ferrit-demir-tozu-toroid' || post.slug === 'toroid-nuve-renkleri') {
        assert.ok(product.fields.Category === 'IRON-POWDER' || product.fields['Ürün Tipi'].includes('TOROID'));
      } else if (post.slug === 'cf-ferrit-malzeme-kodlari') {
        assert.match(product.fields['Product Name'], /CF\s?\d{3}/);
      } else if (post.slug === 'ozel-induktor-teklif-rehberi') {
        assert.ok(product.fields.Category === 'IRON-POWDER' || product.fields['Ürün Tipi'].some(type => ['TOROID', 'CUBUK'].includes(type)));
      } else if (guideShapes[post.slug]) {
        assert.equal(product.fields.Category, 'Ferrit');
        assert.ok(guideShapes[post.slug].includes(product.fields['Ürün Tipi'][0]));
      } else if (post.slug === 'emi-emc-rfi-nedir') {
        assert.equal(product.fields.Category, 'PEM');
      } else assert.equal(productGuideSlug(product.fields.Category, product.fields['Ürün Tipi'], product.fields['Product Name']), post.slug);
    }
    const query = new URL(related.catalogHref, 'https://test.invalid').searchParams;
    const categories = query.get('categories').split(',');
    const types = query.get('productTypes')?.split(',');
    for (const product of related.products) {
      assert.ok(categories.includes(product.fields.Category));
      if (types) assert.ok(types.includes(product.fields['Ürün Tipi'][0]));
    }
  }
  // A comparison guide shows both sides, not just the first category in catalog order.
  const toroids = relatedProducts(products, 'ferrit-demir-tozu-toroid').products;
  assert.deepEqual(new Set(toroids.map(p => p.fields.Category)), new Set(['Ferrit', 'IRON-POWDER']));
  const transformerCores = relatedProducts(products, 'ozel-trafo-teklif-rehberi').products;
  assert.deepEqual(new Set(transformerCores.flatMap(p => p.fields['Ürün Tipi'])), new Set(['EE', 'ETD']));
  const eeCores = relatedProducts(products, 'ee-nuve-secimi').products;
  assert.ok(eeCores.some(p => p.fields['Product Name'].startsWith('EE 25')));
  assert.ok(eeCores.some(p => p.fields['Product Name'].startsWith('EE 42')));
  const powderCores = relatedProducts(products, '26-52-toroid-karsilastirmasi').products;
  assert.deepEqual(new Set(powderCores.map(p => p.fields['Product Name'].match(/(26|52)\s*$/)[1])), new Set(['26', '52']));
  // UU cores have no Ürün Tipi in the catalog, so the guide finds them by name and shows both leg shapes.
  const uuCores = relatedProducts(products, 'uu-nuve-secimi').products;
  assert.deepEqual(new Set(uuCores.map(p => p.fields['Product Name'].split(' ')[0])), new Set(['UU', 'UUR']));
  assert.equal(productGuideSlug('Ferrit', undefined, 'UY 5858'), undefined);
  // Ferrite toroids, rods and drum cores each have their own guide; drum cores are found by name.
  assert.equal(productGuideSlug('Ferrit', ['TOROID']), 'ferrit-toroid-nuve-secimi');
  assert.equal(productGuideSlug('IRON-POWDER', ['TOROID']), 'ferrit-demir-tozu-toroid');
  assert.equal(relatedProducts(products, 'ferrit-cubuk-nuve-secimi').catalogHref, '/products?categories=Ferrit&productTypes=CUBUK');
  const drums = relatedProducts(products, 'makara-ferrit-nuve-secimi').products;
  assert.equal(drums.length, 3);
  for (const drum of drums) assert.match(drum.fields['Product Name'], /^MAKARA /);
  // The material guide shows a different material marking on each card.
  const marks = relatedProducts(products, 'cf-ferrit-malzeme-kodlari').products.map(p => p.fields['Product Name'].match(/CF\s?(\d{3})/)[1]);
  assert.equal(new Set(marks).size, marks.length);
  assert.ok(marks.includes('139') && marks.includes('297'));
  // The inductor enquiry guide shows the core families a wound inductor can be built on.
  const inductorCores = relatedProducts(products, 'ozel-induktor-teklif-rehberi').products;
  assert.ok(inductorCores.some(p => p.fields.Category === 'IRON-POWDER'));
  assert.ok(inductorCores.some(p => p.fields['Ürün Tipi'].includes('CUBUK')));
  // Explanatory guides show one core of each shape they talk about and link to exactly those shapes.
  for (const [slug, types] of Object.entries(guideShapes)) {
    const shapes = relatedProducts(products, slug);
    assert.deepEqual(new Set(shapes.products.map(p => p.fields['Ürün Tipi'][0])), new Set(types), slug);
    assert.deepEqual(new Set(new URL(shapes.catalogHref, 'https://test.invalid').searchParams.get('productTypes').split(',')), new Set(types), slug);
  }
  // Flat cable ferrites get their own guide, not the round cable one.
  const flat = relatedProducts(products, 'yassi-kablo-ferriti-secimi');
  assert.equal(flat.products.length, products.filter(p => p.fields['Ürün Tipi']?.includes('YASSI')).length);
  assert.equal(flat.catalogHref, '/products?categories=Ferrit&productTypes=YASSI');
  // An unrelated ferrite or an unclassified powder core must not enter this comparison.
  const unrelated = [{...products[0], fields: {...products[0].fields, Category: 'IRON-POWDER', 'Product Name': 'Unknown mix'}}];
  assert.deepEqual(relatedProducts(unrelated, '26-52-toroid-karsilastirmasi').products, []);
  for (const post of blogPosts) {
    assert.ok(products.some(p => p.fields.Photo?.some(photo => photo.url === post.image)), `${post.slug}: cover must be a catalog photo`);
    assert.ok(fs.existsSync(`public${post.image}`), post.image);
  }
});
test('guides expose their FAQ as FAQPage data and name Artek as one linked organisation', () => {
  const {blogPosts, englishBlogPosts, blogStructuredData} = require('../lib/blog.ts');
  for (const post of [...blogPosts, ...englishBlogPosts]) {
    assert.ok(post.faq.length > 0, post.slug);
    for (const {question, answer} of post.faq) {
      assert.ok(question.endsWith('?'), question);
      assert.ok(answer.length > 20, question);
      assert.doesNotMatch(answer, /\[\d+\]|\]\(|\*\*/, question);
    }
    const graph = blogStructuredData(post, 'https://www.ferritnuve.com')['@graph'];
    const faq = graph.find(node => node['@type'] === 'FAQPage');
    assert.deepEqual(faq.mainEntity.map(q => q.name), post.faq.map(q => q.question));
    assert.equal(graph[0].publisher['@id'], 'https://www.ferritnuve.com/#business');
  }
});
test('business data is structured and llms.txt lists every guide and the catalog', () => {
  const {businessStructuredData, company} = require('../lib/company.ts');
  const {llmsText} = require('../lib/llms.ts');
  const {blogPosts, englishBlogPosts} = require('../lib/blog.ts');
  const site = 'https://www.ferritnuve.com';
  const business = businessStructuredData(site, 'en', 'Catalog description');
  assert.equal(business['@id'], `${site}/#business`);
  assert.equal(business.address.addressCountry, 'TR');
  assert.ok(business.knowsAbout.includes('Ferrite Cores'));
  assert.equal(business.hasOfferCatalog.url, `${site}/en/products`);
  const text = llmsText(site);
  assert.match(text, /^# Artek Elektronik\n\n> /);
  assert.ok(text.includes(company.email));
  for (const post of blogPosts) assert.ok(text.includes(`${site}/blog/${post.slug}`), post.slug);
  for (const post of englishBlogPosts) assert.ok(text.includes(`${site}/en/blog/${post.slug}`), post.slug);
  assert.ok(text.includes(`${site}/en/products?categories=PEM`));
  assert.doesNotMatch(text, /fiyat|price:|stok adedi/i);
});
test('the glossary defines each term once per language, with a source, and links only to existing guides', () => {
  const {glossaryTerms, glossaryStructuredData} = require('../lib/glossary.ts');
  const {getBlogPost} = require('../lib/blog.ts');
  const {llmsText} = require('../lib/llms.ts');
  const counts = [];
  for (const locale of ['tr', 'en']) {
    const terms = glossaryTerms(locale);
    counts.push(terms.length);
    assert.ok(terms.length >= 30, `${locale}: ${terms.length} terms`);
    assert.equal(new Set(terms.map(term => term.id)).size, terms.length);
    assert.deepEqual(terms.map(term => term.term), [...terms.map(term => term.term)].sort((a, b) => a.localeCompare(b, locale)));
    for (const term of terms) {
      const words = term.definition.split(/\s+/).length;
      assert.ok(words >= 25 && words <= 90, `${term.term}: ${words} words`);
      assert.doesNotMatch(term.definition, /\[\d+\]|\]\(|\*\*|<|\n|üretiyoruz|we manufacture|fiyat|price/i, term.term);
      assert.match(term.source.href, /^https:\/\//);
      assert.ok(term.source.label.length > 5, term.term);
      if (term.guide) assert.ok(getBlogPost(term.guide.href.replace('/blog/', ''), locale), `${term.term}: ${term.guide.href}`);
    }
    const data = glossaryStructuredData(terms, 'https://www.ferritnuve.com/sozluk', locale);
    assert.equal(data['@type'], 'DefinedTermSet');
    assert.deepEqual(data.hasDefinedTerm.map(term => term.name), terms.map(term => term.term));
  }
  assert.equal(counts[0], counts[1]);
  assert.ok(llmsText('https://www.ferritnuve.com').includes('https://www.ferritnuve.com/en/sozluk'));
});
test('FAQ page combines own questions with every guide FAQ and searches like a visitor types', () => {
  const {faqItems, faqStructuredData} = require('../lib/faq.ts');
  const {matchFaq, scrubSearch} = require('../lib/faq-search.ts');
  const {blogPosts, englishBlogPosts} = require('../lib/blog.ts');
  for (const [locale, posts] of [['tr', blogPosts], ['en', englishBlogPosts]]) {
    const items = faqItems(locale);
    assert.equal(new Set(items.map(item => item.id)).size, items.length);
    for (const item of items) {
      assert.ok(item.question.endsWith('?') && item.answer.length > 40, item.question);
      if (item.link) assert.match(item.link.href, /^\/(blog\/|products|contact|certificates)/);
      if (item.source) assert.match(item.source.href, /^https:\/\//);
    }
    // Every guide's FAQ appears, linking back to that guide in the same language.
    for (const post of posts) for (const {question} of post.faq) {
      const item = items.find(i => i.question === question);
      assert.equal(item.group, 'guides');
      assert.equal(item.link.href, `/blog/${post.slug}`);
    }
    // FAQPage markup only for questions not already marked up on a guide page.
    const data = faqStructuredData(items, 'https://www.ferritnuve.com/faq', locale);
    assert.equal(data.mainEntity.length, items.filter(i => i.group !== 'guides').length);
  }
  const tr = faqItems('tr');
  assert.ok(matchFaq(tr, 'ferrit nuve nedir').some(i => i.question === 'Ferrit nüve nedir?'));
  assert.ok(matchFaq(tr, 'HAVA ARALIĞI').length >= 1);
  assert.equal(matchFaq(tr, '').length, tr.length);
  assert.equal(matchFaq(tr, 'pizza teslimatı').length, 0);
  assert.equal(scrubSearch(' Ali  0532 718 33 64 ali@firma.com etd39 '), 'Ali [tel] [e-posta] etd39');
});
test('cookie choice is remembered, and anything else counts as not answered', () => {
  const store = new Map();
  globalThis.localStorage = {getItem: k => store.get(k) ?? null, setItem: (k, v) => store.set(k, v), removeItem: k => store.delete(k)};
  const {readConsent, setConsent} = require('../lib/consent.ts');
  assert.equal(readConsent(), null);
  setConsent('granted'); assert.equal(readConsent(), 'granted');
  setConsent('denied'); assert.equal(store.get('artek-consent'), 'denied');
  store.set('artek-consent', 'yes'); setConsent(null); assert.equal(readConsent(), null);
  delete globalThis.localStorage;
  setConsent('denied'); assert.equal(readConsent(), 'denied');
});
