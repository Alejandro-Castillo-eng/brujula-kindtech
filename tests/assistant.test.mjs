import test from 'node:test';
import assert from 'node:assert/strict';
import {askCatalog,parseQuestion} from '../lib/assistant.ts';
import catalog from '../lib/catalog.json' with {type:'json'};

test('Interpreta tipo, costo, tema, ciudad y certificado',()=>{
 assert.deepEqual(parseQuestion('programas gratis de IA'),{type:'programa',free:true,topics:['IA']});
 assert.deepEqual(parseQuestion('cursos de astrología').keywords,['astrologia']);
 const e=parseQuestion('eventos en Lima');assert.equal(e.type,'evento');assert.equal(e.city,'lima');
 assert.equal(parseQuestion('cursos de datos con insignia').certificate,true);
 assert.equal(parseQuestion('voluntariados virtuales').virtual,true);
});
test('Responde solo con oportunidades del catálogo que cumplen las condiciones',()=>{
 const r=askCatalog(catalog,'eventos en Lima');assert.ok(r.items.length>0);for(const o of r.items){assert.equal(o.type,'evento');assert.ok(catalog.some(c=>c.id===o.id))}
 const c=askCatalog(catalog,'cursos de computación cuántica');assert.ok(c.items.length>0);assert.match(c.answer,/^No encontré cursos de computación cuántica.*se acerca/);
 const none=askCatalog(catalog,'cursos de astrología');assert.equal(none.items.length,0);assert.match(none.answer,/No encontré/);
 const ia=askCatalog(catalog,'programas gratis de IA');assert.ok(ia.items.length>0,ia.answer);
 const g=askCatalog(catalog,'programas de cuántica');assert.ok(g.items.some(o=>o.id==='qiskit-summer-school'));
 const one=askCatalog([catalog.find(o=>o.id==='python-essentials')],'cursos de python');assert.match(one.answer,/^Encontré 1 curso de Python\.$/);
});
