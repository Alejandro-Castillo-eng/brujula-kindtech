import { env } from 'cloudflare:workers';
import { z } from 'zod';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { CATALOG } from '@/lib/catalog';
import { DEMO_MENTORS } from '@/lib/demo-mentors';
import { safeUrl, AREAS, buildRoute } from '@/lib/logic';
import type { Opportunity, Profile } from '@/lib/types';

export const dynamic='force-dynamic';
const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
const now=()=>new Date().toISOString();
const text=z.string().trim().max(500);
const profileSchema=z.object({name:z.string().trim().min(2).max(60),career:z.string().trim().min(2).max(100),university:z.string().trim().max(100),cycle:z.number().int().min(1).max(14),target:z.string().refine(x=>AREAS.includes(x)),skills:z.array(z.string().max(60)).max(20),hours:z.number().int().min(1).max(40),bio:text});
const opportunitySchema=z.object({title:z.string().trim().min(5).max(140),organization:z.string().trim().min(2).max(100),type:z.enum(['curso','voluntariado','programa','evento','práctica']),url:z.string().max(2000).refine(safeUrl),description:z.string().trim().min(20).max(1500),skills:z.array(z.string().trim().min(1).max(60)).max(15),categories:z.array(z.string().max(80)).max(10),costLabel:z.string().trim().min(2).max(100),format:z.enum(['Virtual','Presencial','Híbrido']),location:z.string().trim().min(2).max(100),deadline:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v=>!isNaN(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v).nullable(),availability:z.enum(['permanente','verificar convocatoria']),lastVerified:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),status:z.enum(['draft','published'])});
function database(){if(!env.DB)throw new Error('DATABASE_UNAVAILABLE');return env.DB;}
async function seed(db:D1Database){
 const count=await db.prepare('SELECT COUNT(*) AS n FROM opportunities WHERE owner_id IS NULL').first<{n:number}>();
 if((count?.n||0)<CATALOG.length) await db.batch(CATALOG.map(o=>db.prepare('INSERT OR IGNORE INTO opportunities (id,owner_id,data,status,created_at) VALUES (?,NULL,?,\'published\',?)').bind(o.id,JSON.stringify(o),now())));
}
async function visibleOpportunity(db:D1Database,user:string,id:string){
 return db.prepare('SELECT id,owner_id,data,status FROM opportunities WHERE id=? AND (owner_id IS NULL OR owner_id=?)').bind(id,user).first<{id:string;owner_id:string|null;data:string;status:string}>();
}
async function bootstrap(db:D1Database,user:{userId:string;displayName:string;email:string}){
 await seed(db);
 const [profile,opps,saves,steps,mentors,requests,checks,feedback]=await Promise.all([
  db.prepare('SELECT data FROM profiles WHERE user_id=?').bind(user.userId).first<{data:string}>(),
  db.prepare('SELECT id,owner_id,data,status FROM opportunities WHERE owner_id IS NULL OR owner_id=? ORDER BY created_at,id').bind(user.userId).all<{id:string;owner_id:string|null;data:string;status:string}>(),
  db.prepare('SELECT opportunity_id,stage,created_at FROM saved WHERE user_id=? ORDER BY created_at DESC').bind(user.userId).all(),
  db.prepare('SELECT task_id,done FROM progress WHERE user_id=?').bind(user.userId).all<{task_id:string;done:number}>(),
  db.prepare('SELECT user_id,data FROM mentors').all<{user_id:string;data:string}>(),
  db.prepare('SELECT * FROM mentor_requests WHERE user_id=? OR mentor_id=? ORDER BY created_at DESC').bind(user.userId,user.userId).all<{mentor_id:string}>(),
  db.prepare('SELECT * FROM source_checks').all<{opportunity_id:string;code:number;checked_at:string}>(),
  db.prepare('SELECT COUNT(*) AS n FROM feedback WHERE user_id=?').bind(user.userId).first<{n:number}>(),
 ]);
 const checkMap=new Map(checks.results.map(c=>[c.opportunity_id,{code:c.code,checkedAt:c.checked_at}]));
 return {user:{id:user.userId,name:user.displayName,email:user.email},profile:profile?JSON.parse(profile.data):null,opportunities:opps.results.map(o=>({...JSON.parse(o.data),id:o.id,own:o.owner_id===user.userId,status:o.status,linkCheck:checkMap.get(o.id)})),saved:saves.results,progress:Object.fromEntries(steps.results.map(s=>[s.task_id,!!s.done])),mentors:[...mentors.results.map(m=>({...JSON.parse(m.data),id:m.user_id,demo:false,own:m.user_id===user.userId})),...DEMO_MENTORS],requests:requests.results.map(r=>({...r,incoming:r.mentor_id===user.userId})),feedbackCount:feedback?.n||0};
}
export async function GET(){
 const user=await getChatGPTUser();if(!user)return json({error:'Inicia sesión para acceder a tu espacio.'},401);
 try{return json(await bootstrap(database(),user));}catch(e){console.error('Bootstrap failure',e instanceof Error?e.message:'unknown');return json({error:'No pudimos cargar tu espacio. Intenta nuevamente.'},503);}
}
export async function POST(request:Request){
 const user=await getChatGPTUser();if(!user)return json({error:'Inicia sesión para continuar.'},401);
 const origin=request.headers.get('origin');if(origin&&origin!==new URL(request.url).origin)return json({error:'Origen no permitido.'},403);
 if(!request.headers.get('content-type')?.includes('application/json'))return json({error:'Formato no válido.'},415);
 try{
  const raw=await request.text();if(raw.length>20000)return json({error:'La solicitud es demasiado extensa.'},413);
  const b=JSON.parse(raw);const db=database();const uid=user.userId;const stamp=now();
  switch(b.action){
   case 'profile':{
    const p=profileSchema.parse(b.profile);await db.prepare('INSERT INTO profiles (user_id,data,updated_at) VALUES (?,?,?) ON CONFLICT(user_id) DO UPDATE SET data=excluded.data,updated_at=excluded.updated_at').bind(uid,JSON.stringify(p),stamp).run();break;
   }
   case 'save':{
    const id=z.string().max(100).parse(b.id);if(!await visibleOpportunity(db,uid,id))return json({error:'Oportunidad no disponible.'},404);
    if(b.saved===false)await db.prepare('DELETE FROM saved WHERE user_id=? AND opportunity_id=?').bind(uid,id).run();
    else{const stage=z.enum(['guardada','en proceso','postulada','completada']).parse(b.stage||'guardada');await db.prepare('INSERT INTO saved (user_id,opportunity_id,stage,created_at) VALUES (?,?,?,?) ON CONFLICT(user_id,opportunity_id) DO UPDATE SET stage=excluded.stage').bind(uid,id,stage,stamp).run();}break;
   }
   case 'progress':{
    const id=z.string().max(200).parse(b.id);const done=z.boolean().parse(b.done);
    const p=await db.prepare('SELECT data FROM profiles WHERE user_id=?').bind(uid).first<{data:string}>();
    if(!p)return json({error:'Completa primero tu perfil.'},400);
    const catalog=(await db.prepare('SELECT data FROM opportunities WHERE (owner_id IS NULL OR owner_id=?) AND status=\'published\'').bind(uid).all<{data:string}>()).results.map(x=>JSON.parse(x.data) as Opportunity);
    if(!buildRoute(JSON.parse(p.data),catalog).some(t=>t.id===id))return json({error:'Este paso ya no pertenece a tu ruta. Actualiza la página.'},409);
    await db.prepare('INSERT INTO progress (user_id,task_id,done,updated_at) VALUES (?,?,?,?) ON CONFLICT(user_id,task_id) DO UPDATE SET done=excluded.done,updated_at=excluded.updated_at').bind(uid,id,done?1:0,stamp).run();break;
   }
   case 'catalog':{
    const op=opportunitySchema.parse(b.opportunity);const id=b.id?z.string().max(100).parse(b.id):crypto.randomUUID();
    if(b.id){const existing=await visibleOpportunity(db,uid,id);if(!existing||existing.owner_id!==uid)return json({error:'Solo puedes editar oportunidades añadidas por ti.'},403);await db.prepare('UPDATE opportunities SET data=?,status=? WHERE id=? AND owner_id=?').bind(JSON.stringify({...op,id}),op.status,id,uid).run();}
    else await db.prepare('INSERT INTO opportunities (id,owner_id,data,status,created_at) VALUES (?,?,?,?,?)').bind(id,uid,JSON.stringify({...op,id}),op.status,stamp).run();break;
   }
   case 'delete-opportunity':{
    const id=z.string().max(100).parse(b.id);const op=await visibleOpportunity(db,uid,id);if(!op||op.owner_id!==uid)return json({error:'No puedes eliminar esta oportunidad.'},403);
    await db.batch([db.prepare('DELETE FROM opportunities WHERE id=? AND owner_id=?').bind(id,uid),db.prepare('DELETE FROM saved WHERE opportunity_id=? AND user_id=?').bind(id,uid)]);break;
   }
   case 'mentor-profile':{
    if(b.enabled===false){await db.prepare('DELETE FROM mentors WHERE user_id=?').bind(uid).run();break;}
    const p=await db.prepare('SELECT data FROM profiles WHERE user_id=?').bind(uid).first<{data:string}>();if(!p)return json({error:'Completa primero tu perfil.'},400);
    const profile=JSON.parse(p.data) as Profile;
    const details=z.object({role:z.string().trim().min(3).max(80),bio:z.string().trim().min(20).max(500),topics:z.array(z.string().max(60)).min(1).max(6)}).parse(b.mentor);
    const m={...details,name:profile.name,organization:profile.university||'Comunidad Brújula',area:profile.target};
    await db.prepare('INSERT INTO mentors (user_id,data,created_at) VALUES (?,?,?) ON CONFLICT(user_id) DO UPDATE SET data=excluded.data').bind(uid,JSON.stringify(m),stamp).run();break;
   }
   case 'mentor-request':{
    const id=z.string().max(100).parse(b.id);const message=z.string().trim().min(15).max(800).parse(b.message);
    if(id===uid)return json({error:'Este es tu propio perfil.'},400);
    const demo=DEMO_MENTORS.some(m=>m.id===id);const mentor=demo||await db.prepare('SELECT user_id FROM mentors WHERE user_id=?').bind(id).first();if(!mentor)return json({error:'Este perfil ya no está disponible.'},404);
    const duplicate=await db.prepare('SELECT id FROM mentor_requests WHERE user_id=? AND mentor_id=? AND status IN (\'pendiente\',\'aceptada\')').bind(uid,id).first();if(duplicate)return json({error:'Ya tienes una solicitud activa con esta persona.'},409);
    const p=await db.prepare('SELECT data FROM profiles WHERE user_id=?').bind(uid).first<{data:string}>();
    if(!p)return json({error:'Completa tu perfil antes de solicitar orientación.'},400);
    await db.prepare('INSERT INTO mentor_requests (id,user_id,mentor_id,sender_name,message,status,is_demo,created_at) VALUES (?,?,?,?,?,\'pendiente\',?,?)').bind(crypto.randomUUID(),uid,id,JSON.parse(p.data).name,message,demo?1:0,stamp).run();break;
   }
   case 'request-status':{
    const id=z.string().max(100).parse(b.id);const status=z.enum(['aceptada','rechazada','cancelada']).parse(b.status);
    const row=await db.prepare('SELECT user_id,mentor_id,is_demo,status FROM mentor_requests WHERE id=?').bind(id).first<{user_id:string;mentor_id:string;is_demo:number;status:string}>();
    if(!row)return json({error:'Solicitud no encontrada.'},404);
    if(status==='cancelada'?row.user_id!==uid:(row.mentor_id!==uid&&!(row.is_demo&&row.user_id===uid)))return json({error:'No tienes permiso para cambiar esta solicitud.'},403);
    if(row.status!=='pendiente'&&status!=='cancelada')return json({error:'La solicitud ya fue respondida.'},409);
    await db.prepare('UPDATE mentor_requests SET status=? WHERE id=?').bind(status,id).run();break;
   }
   case 'check-sources':{
    // Only fetch pre-reviewed seed URLs. Never turn user-provided URLs into server requests.
    for(let index=0;index<CATALOG.length;index+=3){await Promise.all(CATALOG.slice(index,index+3).map(async o=>{
     const prior=await db.prepare('SELECT checked_at FROM source_checks WHERE opportunity_id=?').bind(o.id).first<{checked_at:string}>();
     if(prior&&Date.now()-Date.parse(prior.checked_at)<15*60*1000)return;
     let code=0;try{const r=await fetch(o.url,{method:'GET',redirect:'manual',signal:AbortSignal.timeout(5000),headers:{Accept:'text/html','User-Agent':'Brujula-LinkCheck/1.0'}});code=r.status;await r.body?.cancel();}catch{code=0;}
     await db.prepare('INSERT INTO source_checks (opportunity_id,code,checked_at) VALUES (?,?,?) ON CONFLICT(opportunity_id) DO UPDATE SET code=excluded.code,checked_at=excluded.checked_at').bind(o.id,code,now()).run();
    }));}break;
   }
   case 'feedback':{
    const v=z.object({rating:z.number().int().min(1).max(5),message:z.string().trim().min(3).max(1500)}).parse(b);
    await db.prepare('INSERT INTO feedback (id,user_id,rating,message,created_at) VALUES (?,?,?,?,?)').bind(crypto.randomUUID(),uid,v.rating,v.message,stamp).run();break;
   }
   case 'delete-account':{
    await db.batch(['profiles','saved','progress','mentors','feedback'].map(t=>db.prepare(`DELETE FROM ${t} WHERE user_id=?`).bind(uid)).concat([db.prepare('DELETE FROM mentor_requests WHERE user_id=? OR mentor_id=?').bind(uid,uid),db.prepare('DELETE FROM opportunities WHERE owner_id=?').bind(uid)]));break;
   }
   default:return json({error:'Acción no disponible.'},400);
  }
  return json({ok:true});
 }catch(e){
  if(e instanceof z.ZodError)return json({error:'Revisa los campos del formulario.',fields:e.issues.map(i=>({field:i.path.join('.'),message:i.message}))},400);
  if(e instanceof SyntaxError)return json({error:'El formato de la solicitud no es válido.'},400);
  console.error('Action failure',e instanceof Error?e.message:'unknown');return json({error:'No pudimos guardar los cambios. Inténtalo nuevamente.'},503);
 }
}
