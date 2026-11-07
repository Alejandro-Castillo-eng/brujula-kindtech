import test from 'node:test';
import assert from 'node:assert/strict';
import {CAREERS,TRANSVERSAL_AREAS,areasForCareer} from '../lib/careers.ts';
import {AREAS} from '../lib/logic.ts';

test('Cada carrera usa áreas existentes',()=>{for(const c of CAREERS){assert.ok(c.areas.length>=2,c.name);for(const a of c.areas)assert.ok(AREAS.includes(a),`${c.name}: ${a}`)}for(const a of TRANSVERSAL_AREAS)assert.ok(AREAS.includes(a))});
test('Reconoce la carrera sin importar tildes, mayúsculas o un nombre más largo',()=>{assert.deepEqual(areasForCareer('ingenieria de sistemas'),areasForCareer('Ingeniería de Sistemas'));assert.ok(areasForCareer('Administración de Empresas'));assert.ok(!areasForCareer('Contabilidad').includes('Diseño y creatividad'))});
test('Carreras aún no cubiertas devuelven null',()=>{for(const c of ['Ingeniería Mecánica','Psicología','Medicina','','Ingeniería'])assert.equal(areasForCareer(c),null,c)});
import {skillsForCareer,TRANSVERSAL_SKILLS} from '../lib/careers.ts';
import {relevance,DEFAULT_PROFILE} from '../lib/logic.ts';
import catalog from '../lib/catalog.json' with {type:'json'};
const SOFT=['Liderazgo','Trabajo en equipo','Comunicación','Negociación','Oratoria','Adaptabilidad'];
test('Cada carrera tiene sus propios conocimientos técnicos, sin habilidades blandas',()=>{for(const c of CAREERS){assert.ok(c.skills.length>=8,c.name);assert.equal(new Set(c.skills).size,c.skills.length,c.name);for(const s of c.skills){assert.ok(s.length<=60,s);assert.ok(!SOFT.includes(s),`${c.name}: ${s}`)}}for(const s of TRANSVERSAL_SKILLS)assert.ok(!SOFT.includes(s),s)});
test('Las habilidades cambian según la carrera',()=>{assert.ok(skillsForCareer('Ingeniería de Sistemas').includes('Git y GitHub'));assert.ok(!skillsForCareer('Marketing').includes('Git y GitHub'));assert.notDeepEqual(skillsForCareer('Diseño Gráfico'),skillsForCareer('Contabilidad'));assert.deepEqual(skillsForCareer('Psicología'),TRANSVERSAL_SKILLS)});
test('La carrera ordena las recomendaciones dentro de un área',()=>{const p={...DEFAULT_PROFILE,name:'A',career:'Ingeniería de Sistemas',target:'Tecnología'};const top=[...catalog].sort((a,b)=>relevance(b,p)-relevance(a,p)).slice(0,5).map(o=>o.id);assert.ok(top.includes('python-essentials')||top.includes('google-summer-of-code'),top.join(','));assert.ok(!top.includes('hubspot-social'),top.join(','))});
import {referentSearches} from '../lib/careers.ts';
test('Referentes: 5 trayectorias por carrera, enlaces a LinkedIn y egresados si hay universidad',()=>{for(const c of CAREERS)assert.equal(c.roles.length,5,c.name);const r=referentSearches({career:'Ingeniería Industrial',university:'Universidad San Ignacio de Loyola (USIL)'});assert.equal(r.length,6);assert.equal(r[0].title,'Egresados de USIL');for(const x of r)assert.ok(x.url.startsWith('https://www.linkedin.com/search/results/people/?keywords='),x.url);assert.ok(decodeURIComponent(r[1].url).includes('Analista de operaciones Ingeniería Industrial Perú'));assert.equal(referentSearches({career:'Psicología'}).length,5)});
