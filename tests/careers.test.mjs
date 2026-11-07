import test from 'node:test';
import assert from 'node:assert/strict';
import {CAREERS,TRANSVERSAL_AREAS,areasForCareer} from '../lib/careers.ts';
import {AREAS} from '../lib/logic.ts';

test('Cada carrera usa áreas existentes',()=>{for(const c of CAREERS){assert.ok(c.areas.length>=2,c.name);for(const a of c.areas)assert.ok(AREAS.includes(a),`${c.name}: ${a}`)}for(const a of TRANSVERSAL_AREAS)assert.ok(AREAS.includes(a))});
test('Reconoce la carrera sin importar tildes, mayúsculas o un nombre más largo',()=>{assert.deepEqual(areasForCareer('ingenieria de sistemas'),areasForCareer('Ingeniería de Sistemas'));assert.ok(areasForCareer('Administración de Empresas'));assert.ok(!areasForCareer('Contabilidad').includes('Diseño y creatividad'))});
test('Carreras aún no cubiertas devuelven null',()=>{for(const c of ['Ingeniería Mecánica','Psicología','Medicina','','Ingeniería'])assert.equal(areasForCareer(c),null,c)});
