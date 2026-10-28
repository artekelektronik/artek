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
  assert.equal(blogPosts.length, 8);
  assert.equal(new Set(blogPosts.map(post => post.slug)).size, 8);
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
  for (const [category, type] of [['PEM', undefined], ['IRON-POWDER', undefined], ['Ferrit', ['ETD']], ['Ferrit', ['YUVARLAK']]]) {
    assert.ok(blogPosts.some(post => post.slug === productGuideSlug(category, type)));
  }
});
test('every blog guide lists its own catalog products and links to them in the catalog', () => {
  const {blogPosts, productGuideSlug, relatedProducts} = require('../lib/blog.ts');
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
