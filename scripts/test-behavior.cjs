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
const {getProductsFromJSON, getProductBySlug} = require('../lib/local-products.ts');
const {productGroups, catalogLabel} = require('../lib/product-taxonomy.ts');
const {generateProductSlug} = require('../lib/utils.ts');
const {productContent} = require('../lib/product-content.ts');
const {inquiryLinks} = require('../lib/inquiry.ts');
const products = getProductsFromJSON();

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
