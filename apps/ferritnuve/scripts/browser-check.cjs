/* eslint-disable @typescript-eslint/no-require-imports */
/* Read-only end-to-end regression checks. Never submits the external form or sends messages.
 * Requires Playwright (PLAYWRIGHT_MODULE_PATH can point at a bundled installation).
 */
const {chromium} = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:3100';
const output = process.env.TEST_OUTPUT_DIR || '/tmp/artek-browser-results';
fs.mkdirSync(output,{recursive:true});
const evidence=[];
async function run() {
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
 try {
 for(const locale of ['tr','en']) {
  for(const width of [1280,390]) {
   const context=await browser.newContext({viewport:{width,height:850},locale:locale==='tr'?'tr-TR':'en-US'});
   const page=await context.newPage();
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   const prefix=locale==='en'?'/en':'';
   const home=base+(prefix||'/');
   const t=JSON.parse(fs.readFileSync(path.join(process.cwd(),'messages',locale+'.json')));
   async function check(label) {
    await page.locator('h1').waitFor();
    assert.equal(await page.locator('h1').count(),1,label+' H1');
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),label+' horizontal overflow');
    assert.equal(await page.locator('[data-nextjs-dialog]').count(),0);
    await page.screenshot({path:path.join(output,`${locale}-${width}-${label}.png`),fullPage:true});
   }
   await page.goto(home);await check('home');
   // Actual click path: homepage > category > product > contact.
   await page.locator(`main a[href="${prefix}/products?categories=Ferrit"]`).first().click();
   await page.waitForURL('**/products?categories=Ferrit');
   await page.getByRole('checkbox',{name:locale==='en'?'Ferrite':'Ferrit',exact:true}).waitFor();
   assert.equal(await page.getByRole('checkbox',{name:locale==='en'?'Ferrite':'Ferrit',exact:true}).getAttribute('data-state'),'checked');
   await page.getByRole('link',{name:t.productCard.viewDetails,exact:true}).first().waitFor();await check('catalog');
   await page.getByRole('link',{name:t.productCard.viewDetails,exact:true}).first().click();
   await page.waitForURL(/\/products\/.+/);await check('product');
   const productUrl=page.url(); const name=await page.locator('h1').innerText();
   const code=await page.locator('main strong').first().innerText();
   const wa=await page.locator('main a[href^="https://wa.me"]').getAttribute('href');
   const mail=await page.locator('main a[href^="mailto:"]').getAttribute('href');
   for(const [url,key] of [[wa,'text'],[mail,'body']]) {
    const draft=new URL(url).searchParams.get(key);assert.ok(draft.includes(name));assert.ok(draft.includes(code));assert.ok(draft.includes(new URL(productUrl).pathname));
   }
   await page.getByRole('link',{name:t.productDetail.enquire,exact:true}).click();await page.waitForURL('**/contact?product=*');
   assert.match(new URL(page.url()).search,/^\?product=rec\d+$/);
   await page.getByRole('heading',{name:t.contact.selectedProduct}).waitFor();assert.ok((await page.locator('#site-content').innerText()).includes(code));
   await check('contact');
   assert.ok(await page.locator('a[href^="tel:"]').first().isVisible());
   // Change language on the product-context contact page, retaining the ID.
   if(width<1024) await page.getByRole('button',{name:t.nav.openMenu,exact:true}).click();
   await page.getByRole('button',{name:t.language.switchTo,exact:true}).click();
   await page.getByRole('menuitem',{name:locale==='en'?'TR Türkçe':'EN English'}).click();
   await page.waitForURL(url=>url.pathname===(locale==='en'?'/contact':'/en/contact'));
   assert.match(new URL(page.url()).search,/^\?product=rec\d+$/);
   // Mobile menu keyboard and Escape recovery.
   await page.goto(home);
   if(width<1024) {
    const toggle=page.getByRole('button',{name:t.nav.openMenu,exact:true});await toggle.focus();await page.keyboard.press('Enter');
    assert.equal(await page.getByRole('button',{name:t.nav.closeMenu}).getAttribute('aria-expanded'),'true');
    await page.getByRole('button',{name:t.productNav.title,exact:true}).click();
    await page.locator('#mobile-navigation a').first().waitFor();
    await page.screenshot({path:path.join(output,`${locale}-${width}-menu.png`)});
    await page.keyboard.press('Escape');assert.equal(await toggle.getAttribute('aria-expanded'),'false');
   }
   // Search by actual product code via keyboard. No form interaction.
   await page.keyboard.press('Control+k');await page.getByRole('combobox',{name:t.search.placeholder}).fill('IH-0342-H');
   const option=page.getByRole('option').filter({hasText:'IH-0342-H'});await option.waitFor();
   await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');
   await page.waitForURL(/\/products\/power-filter-000002/);
   assert.ok((await page.locator('main').innerText()).includes('IH-0342-H'));
   // URL state, pagination, keyboard filters, sorting and empty recovery.
   await page.goto(base+prefix+'/products?categories=Ferrit');
   await page.getByRole('link',{name:t.pagination.next,exact:true}).click();
   await page.waitForURL(url=>url.searchParams.get('page')==='2');
   await page.reload();assert.equal(new URL(page.url()).searchParams.get('page'),'2');
   const ee=page.getByRole('checkbox',{name:'EE',exact:true});await ee.focus();await page.keyboard.press('Space');
   await page.waitForURL(url=>url.searchParams.get('productTypes')==='EE');
   assert.notEqual(new URL(page.url()).searchParams.get('page'),'2');
   await page.getByRole('combobox',{name:t.controls.sortBy,exact:true}).click();
   await page.getByRole('option',{name:t.controls.sort.nameDesc,exact:true}).click();
   await page.waitForURL(url=>url.searchParams.get('sort')==='name-desc');
   await page.goto(base+prefix+'/products?categories=unknown');
   await page.getByText(t.products.noProducts,{exact:true}).waitFor();
   assert.ok(await page.getByRole('link',{name:t.products.contact,exact:true}).isVisible());
   await page.getByRole('button',{name:t.filters.reset,exact:true}).last().click();
   await page.getByRole('link',{name:t.productCard.viewDetails,exact:true}).first().waitFor();
   // Empty numeric values never create an infinite or empty pagination view.
   await page.goto(base+prefix+'/products?perPage=0&page=-1');
   await page.getByRole('link',{name:t.productCard.viewDetails,exact:true}).first().waitFor();
   assert.equal(errors.length,0,errors.join('\n'));
   evidence.push({locale,width,status:'passed',productUrl,contactContext:true,consoleErrors:errors});
   await context.close();
  }
 }
 // Form network failure: direct contacts remain functional, no false success.
 const context=await browser.newContext({locale:'en-US'});const page=await context.newPage();
 await page.route('**/tally.so/**',route=>route.abort());
 await page.goto(base+'/en/contact?product=rec00000000000002');
 assert.ok(await page.locator('a[href^="tel:"]').first().isVisible());
 assert.ok(await page.locator('a[href^="mailto:"]').first().isVisible());
 assert.ok((await page.locator('body').innerText()).includes('If the form does not load'));
 evidence.push({externalFormBlocked:'passed'});await context.close();
 } finally {await browser.close();fs.writeFileSync(path.join(output,'results.json'),JSON.stringify(evidence,null,2));}
}
run().catch(e=>{console.error(e);process.exitCode=1;});
