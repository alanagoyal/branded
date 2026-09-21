// Exercise the actual production Next server, with synthetic local Auth/REST.
// No production credentials, users, database writes, or provider calls are used.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { createServerClient } = require('@supabase/ssr');
const userId = '10000000-0000-4000-8000-000000000001';
const nameId = '20000000-0000-4000-8000-000000000001';
const user = { id: userId, aud: 'authenticated', role: 'authenticated', email: 'sample@example.invalid', app_metadata: { provider: 'email' }, user_metadata: {}, created_at: '2026-01-01T00:00:00Z' };
let supabaseUrl, writes = 0, nextServer;
const backend = http.createServer(async (req, res) => {
  const url = new URL(req.url, supabaseUrl);
  const body = []; for await (const chunk of req) body.push(chunk);
  const send = value => { res.setHeader('content-type','application/json'); res.end(JSON.stringify(value)); };
  if (url.pathname === '/auth/v1/user') return send(user);
  if (url.pathname === '/auth/v1/token') {
    const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
    const token = `${encode({alg:'HS256',typ:'JWT'})}.${encode({sub:userId,aud:'authenticated',iss:supabaseUrl+'/auth/v1',exp:Math.floor(Date.now()/1000)+3600})}.${Buffer.from('synthetic-signature').toString('base64url')}`;
    return send({access_token:token,refresh_token:'synthetic-refresh-token',expires_in:3600,token_type:'bearer',user});
  }
  if (url.pathname === '/rest/v1/rpc/reserve_provider_usage') return send('ok');
  if (url.pathname === '/rest/v1/names') return send([{ name: 'Café Orbit' }]);
  if (url.pathname === '/rest/v1/profiles') return send([{ name: 'Zoë García' }]);
  if (url.pathname === '/rest/v1/logos' || url.pathname === '/rest/v1/billing_accounts') return send([]);
  if (url.pathname === '/rest/v1/one_pagers') {
    if (req.method === 'GET') return send([]);
    const record = JSON.parse(Buffer.concat(body).toString());
    assert.equal(record.created_by,userId); assert.equal(record.name_id,nameId);
    assert.ok(record.pdf_url.startsWith('data:application/pdf;base64,'));
    writes++; res.statusCode=201; return send(null);
  }
  res.statusCode=404; send({error:'Unexpected mock backend path'});
});
function run(args, env) {
  return new Promise((resolve,reject) => {
    const child = spawn(process.execPath, [require.resolve('next/dist/bin/next'),...args], {env,stdio:'inherit'});
    child.on('error',reject); child.on('exit',code => code===0 ? resolve() : reject(Error(`Next ${args[0]} failed: ${code}`)));
  });
}
(async()=>{
  try {
    await new Promise(resolve=>backend.listen(0,'127.0.0.1',resolve));
    supabaseUrl=`http://127.0.0.1:${backend.address().port}`;
    const env={...process.env,NEXT_PUBLIC_SUPABASE_URL:supabaseUrl,NEXT_PUBLIC_SUPABASE_ANON_KEY:'synthetic-anon-key',SUPABASE_SERVICE_ROLE_KEY:'synthetic-service-key',OPENAI_API_KEY:'synthetic-openai-key',BRAINTRUST_API_KEY:'',STRIPE_SECRET_KEY:'sk_test_synthetic',NEXT_TELEMETRY_DISABLED:'1'};
    await run(['build'],env);
    const trace=JSON.parse(fs.readFileSync('.next/server/app/one-pager/route.js.nft.json','utf8'));
    for(const name of ['NotoSans-Regular.ttf','NotoSans-Bold.ttf']) assert.ok(trace.files.some(file=>file.endsWith('/'+name)),`Missing font ${name}`);
    const traced = new Set(trace.files.map(file => path.resolve('.next/server/app/one-pager', file)));
    function verifyDirectory(directory) {
      for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const file = path.join(directory, entry.name);
        if (entry.isDirectory()) verifyDirectory(file);
        else assert.ok(traced.has(path.resolve(file)), `Missing PDFKit runtime asset: ${file}`);
      }
    }
    verifyDirectory('node_modules/pdfkit/js/standard-fonts');
    verifyDirectory('node_modules/pdfkit/js/data');
    verifyDirectory('node_modules/react');
    // Next's request origin uses its configured port, so pass the chosen port
    // explicitly rather than port 0 (which makes same-origin checks fail).
    const portProbe = http.createServer();
    await new Promise(resolve => portProbe.listen(0, '127.0.0.1', resolve));
    const port = portProbe.address().port;
    await new Promise(resolve => portProbe.close(resolve));
    let serverOutput=''; let ready;
    const started=new Promise(resolve=>ready=resolve);
    nextServer=spawn(process.execPath,[require.resolve('next/dist/bin/next'),'start','--port',String(port),'--hostname','127.0.0.1'],{env,stdio:['ignore','pipe','pipe']});
    const collect=chunk=>{const text=chunk.toString();serverOutput+=text;process.stdout.write(text);if(serverOutput.includes('Ready in'))ready();};
    nextServer.stdout.on('data',collect);nextServer.stderr.on('data',collect);
    await Promise.race([started,new Promise((_,reject)=>setTimeout(()=>reject(Error('Next start timeout')),20000).unref())]);
    const origin=serverOutput.match(/http:\/\/127\.0\.0\.1:\d+/)?.[0]; assert.ok(origin,'Missing Next origin');
    const cookies=new Map();
    const client=createServerClient(supabaseUrl,'synthetic-anon-key',{cookies:{getAll:()=>Array.from(cookies,([name,value])=>({name,value})),setAll:values=>values.forEach(({name,value})=>cookies.set(name,value))}});
    const login=await client.auth.signInWithPassword({email:user.email,password:'synthetic-password'});assert.equal(login.error,null);
    const response=await fetch(origin+'/one-pager',{method:'POST',headers:{'Content-Type':'application/json',Cookie:Array.from(cookies,([key,value])=>`${key}=${value}`).join('; ')},body:JSON.stringify({nameId,content:'A thoughtful company with clear ideas, useful products, and careful execution.'}),signal:AbortSignal.timeout(20000)});
    const data=await response.json();assert.equal(response.status,200,JSON.stringify(data));
    const bytes=Buffer.from(data.link.split(',')[1],'base64');assert.equal(bytes.subarray(0,5).toString(),'%PDF-');assert.equal(writes,1);
    const output=path.join(require('node:os').tmpdir(),'branded-next-runtime.pdf');fs.writeFileSync(output,bytes);
    console.log(`Built Next HTTP PDF smoke passed: ${bytes.length} bytes; ${output}`);
  } finally {if(nextServer)nextServer.kill('SIGTERM');backend.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
