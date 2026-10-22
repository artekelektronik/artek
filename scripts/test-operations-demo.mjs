import test from 'node:test';
import assert from 'node:assert/strict';
import { initialState, applyAction, available, reserved, planJobs } from '../public/yonetim-demo/model.mjs';

test('manual and web sales share stock; price changes preserve sales snapshots', () => {
 let s = initialState();
 const sale = {type:'sale', product:'ef25', warehouse:'karakoy', qty:10, price:24, customer:'Test müşteri', paid:false};
 s = applyAction(s, sale); s = applyAction(s, {...sale, channel:'Web demo'});
 assert.equal(available(s,'ef25','karakoy'),2380);
 s = applyAction(s,{type:'price',product:'ef25',price:30});
 assert.equal(s.sales[0].price,24); assert.equal(s.sales[0].total,240);
 assert.throws(()=>applyAction(s,{...sale,qty:2381}),/yetersiz/);
 s = applyAction(s,{type:'payment',id:s.sales[0].id});assert.equal(s.sales[0].paid,true);
});
test('reserved production stock cannot be sold or counted away; fractional kg allowed', () => {
 const s=initialState();
 assert.equal(reserved(s,'copper','cekmekoy'),18);
 assert.throws(()=>applyAction(s,{type:'sale',product:'copper',warehouse:'cekmekoy',qty:25,price:620,customer:'Test'}),/yetersiz/);
 assert.throws(()=>applyAction(s,{type:'count',product:'copper',warehouse:'cekmekoy',qty:17,reason:'Tekrar sayım'}),/ayrılmış/);
 assert.equal(applyAction(s,{type:'sale',product:'copper',warehouse:'cekmekoy',qty:.5,price:620,customer:'Test'}).products.find(p=>p.id==='copper').stock.cekmekoy,41.5);
 assert.throws(()=>applyAction(s,{type:'sale',product:'karkas',warehouse:'karakoy',qty:.5,price:8,customer:'Test'}),/tam sayı/);
});
test('transfer reserves, goes in transit, then arrives once without creating stock', () => {
 let s=applyAction(initialState(),{type:'transfer',product:'ef25',from:'karakoy',qty:100});
 const id=s.transfers[0].id;
 assert.equal(available(s,'ef25','karakoy'),2300);
 s=applyAction(s,{type:'transfer-next',id});
 assert.equal(s.products[0].stock.karakoy,2300);assert.equal(s.products[0].stock.cekmekoy,3200);
 s=applyAction(s,{type:'transfer-next',id});assert.equal(s.products[0].stock.cekmekoy,3300);
 assert.throws(()=>applyAction(s,{type:'transfer-next',id}),/tamamlanmış/);
});
test('production consumes once; failed test rework does not consume recipe twice; delivery creates receivable', () => {
 let s=initialState();const id=s.jobs[0].id;
 s=applyAction(s,{type:'job-next',id});assert.equal(s.jobs[0].stage,3);assert.equal(s.products[0].stock.cekmekoy,2200);
 s=applyAction(s,{type:'extra',id,product:'copper',qty:.5});assert.equal(s.jobs[0].extra.copper,.5);
 s=applyAction(s,{type:'job-next',id});assert.equal(s.jobs[0].stage,4);
 s=applyAction(s,{type:'test-fail',id});assert.equal(s.products[0].stock.cekmekoy,2200);
 s=applyAction(s,{type:'job-next',id});s=applyAction(s,{type:'job-next',id});
 assert.equal(s.jobs[0].stage,5);assert.equal(s.products.find(p=>p.id==='finished').stock.cekmekoy,1000);
 assert.equal(available(s,'finished','cekmekoy'),0);
 s=applyAction(s,{type:'job-next',id});assert.equal(s.jobs[0].stage,6);assert.equal(s.products.find(p=>p.id==='finished').stock.cekmekoy,0);
 assert.equal(s.sales[0].total,185000);assert.equal(s.sales[0].deposit,50000);
 assert.throws(()=>applyAction(s,{type:'job-next',id}),/teknik reçeteyi/);
});
test('new custom jobs require recipe and respect single-team capacity', () => {
 let s=applyAction(initialState(),{type:'job',name:'Özel bobin',customer:'Test',qty:100,days:2,unitPrice:90});
 const id=s.jobs.at(-1).id;
 assert.throws(()=>applyAction(s,{type:'job-next',id}),/teknik reçeteyi/);
 s=applyAction(s,{type:'recipe',id,recipe:{copper:2}});assert.equal(s.jobs.at(-1).stage,1);
 s=applyAction(s,{type:'job-next',id});s=applyAction(s,{type:'job-next',id:s.jobs[0].id});
 assert.throws(()=>applyAction(s,{type:'job-next',id}),/başka bir işte/);
});
test('count adjustments and receipt preserve movement evidence', () => {
 let s=applyAction(initialState(),{type:'count',product:'ef25',warehouse:'karakoy',qty:2395,reason:'Raf sayımı'});
 assert.equal(s.counts[0].diff,-5);assert.match(s.events[0].text,/Raf sayımı/);
 s=applyAction(s,{type:'receipt',product:'ef25',warehouse:'karakoy',qty:10});assert.equal(s.products[0].stock.karakoy,2405);
});
test('four inclusive workdays finish Thursday; queue additions skip weekend', () => {
 const s=initialState();const a=planJobs(s,0),b=planJobs(s,3);
 assert.equal(a[0].end.toISOString().slice(0,10),'2026-10-22');
 assert.equal(a[1].start.toISOString().slice(0,10),'2026-10-23');
 assert.equal(b[0].end.toISOString().slice(0,10),'2026-10-27');
 assert.equal(a[1].needsReview,true);
});
