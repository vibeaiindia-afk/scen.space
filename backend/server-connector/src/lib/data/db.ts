import postgres from 'postgres';
let client:any;
export class DataConfigError extends Error{status=503}
export function db(){
  if(client)return client;
  const url=process.env.DATABASE_URL;
  if(!url)throw new DataConfigError('DATABASE_URL is not configured');
  const ssl=process.env.DATABASE_SSL==='disable'?false:'require';
  client=postgres(url,{ssl,max:Math.max(1,Math.min(20,Number(process.env.SCEN_DB_MAX_CONNECTIONS||5))),connect_timeout:Math.max(3,Math.min(30,Number(process.env.SCEN_DB_CONNECT_TIMEOUT_SECONDS||10))),idle_timeout:20,prepare:false,connection:{application_name:'scen-space'}});
  return client;
}
// Neon branches usually share a database name, so the host is the only thing
// that distinguishes them. Report the hostname only — never the credentials.
function dbHost(){try{return new URL(String(process.env.DATABASE_URL||'')).hostname}catch{return ''}}
export async function dbHealth(){const sql=db(),t=Date.now();const r=await sql`select current_database() as database, current_user as user, now() as now`;return {ok:true,latencyMs:Date.now()-t,database:r[0]?.database||'',user:r[0]?.user||'',host:dbHost()}}
