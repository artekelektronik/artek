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
  const {blogPosts, renderBlogMarkdown, blogStructuredData, productGuideSlug} = require('../lib/blog.ts');
  assert.equal(blogPosts.length, 4);
  assert.equal(new Set(blogPosts.map(post => post.slug)).size, 4);
  for (const post of blogPosts) {
    const ids = [...post.html.matchAll(/id="([^"]+)"/g)].map(match => match[1]);
    assert.equal(new Set(ids).size, ids.length);
    for (const match of post.html.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.includes(match[1]), `${post.slug}: ${match[1]}`);
    assert.doesNotMatch(post.html, /onay bekleyen|noindex|javascript:|<script/i);
    const graph = blogStructuredData(post, 'https://www.ferritnuve.com')['@graph'];
    assert.equal(graph[0].mainEntityOfPage['@id'], `https://www.ferritnuve.com/blog/${post.slug}`);
    assert.equal(graph[0].inLanguage, 'tr-TR');
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
