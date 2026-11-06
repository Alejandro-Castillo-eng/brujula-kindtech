import assert from 'node:assert/strict';
const origin='http://127.0.0.1:5174';
const uid='brujula-test-'+Date.now(),uid2=uid+'-other';
const headers=id=>({'Content-Type':'application/json','oai-authenticated-user-id':id,'oai-authenticated-user-email':id+'@example.test',origin});
async function get(id=uid){const r=await fetch(origin+'/api/app',{headers:headers(id)});assert.equal(r.status,200);return r.json()}
async function post(body,id=uid,status=200){const r=await fetch(origin+'/api/app',{method:'POST',headers:headers(id),body:JSON.stringify(body)});const value=await r.json();assert.equal(r.status,status,JSON.stringify(value));return value}
try{
 const unauthorized=await fetch(origin+'/api/app');assert.equal(unauthorized.status,401);
 let state=await get();assert.ok(state.opportunities.length>=14);assert.equal(state.profile,null);
 const profile={name:'Prueba QA',career:'Marketing',university:'Universidad de prueba',cycle:6,target:'Marketing y comunicación',skills:['Excel'],hours:4,bio:''};
 await post({action:'profile',profile});assert.equal((await get()).profile.name,'Prueba QA');assert.equal((await get(uid2)).profile,null);
 await post({action:'save',id:state.opportunities[0].id,stage:'guardada'});assert.equal((await get()).saved.length,1);assert.equal((await get(uid2)).saved.length,0);
 await post({action:'save',id:state.opportunities[0].id,stage:'postulada'});assert.equal((await get()).saved[0].stage,'postulada');
 await post({action:'progress',id:'invented',done:true},uid,409);
 const opportunity={title:'Oportunidad QA de prueba',organization:'Pruebas',type:'curso',url:'https://example.org/qa',description:'Registro temporal para comprobar el aislamiento de los catálogos.',skills:['Excel'],categories:['Negocios y gestión'],costLabel:'Gratis',format:'Virtual',location:'Perú',deadline:null,availability:'permanente',lastVerified:'2026-11-06',status:'draft'};
 await post({action:'catalog',opportunity});state=await get();const custom=state.opportunities.find(o=>o.title===opportunity.title);assert.ok(custom.own);assert.equal(custom.status,'draft');assert.ok(!(await get(uid2)).opportunities.some(o=>o.id===custom.id));
 await post({action:'catalog',id:custom.id,opportunity:{...opportunity,status:'published'}});assert.equal((await get()).opportunities.find(o=>o.id===custom.id).status,'published');
 await post({action:'catalog',id:custom.id,opportunity},uid2,403);
 await post({action:'catalog',opportunity:{...opportunity,url:'javascript:alert(1)'}},uid,400);
 await post({action:'mentor-request',id:'demo-valeria',message:'Hola, esta es una solicitud de prueba para revisar el flujo.'});state=await get();assert.equal(state.requests[0].is_demo,1);
 await post({action:'request-status',id:state.requests[0].id,status:'aceptada'},uid2,403);
 await post({action:'request-status',id:state.requests[0].id,status:'aceptada'});assert.equal((await get()).requests[0].status,'aceptada');
 await post({action:'feedback',rating:5,message:'Opinión QA de prueba.'});assert.equal((await get()).feedbackCount,1);
 const csrf=await fetch(origin+'/api/app',{method:'POST',headers:{...headers(uid),origin:'https://different.example'},body:JSON.stringify({action:'profile',profile})});assert.equal(csrf.status,403);
 console.log('PASS: autenticación, persistencia, aislamiento entre usuarios, guardados, seguimiento, borradores/publicación, validación de URLs, mentoría simulada, opiniones y origen CSRF.');
}finally{await post({action:'delete-account'},uid);await post({action:'delete-account'},uid2);console.log('Datos de QA eliminados del entorno local.');}
