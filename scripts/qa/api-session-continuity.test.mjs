import test from 'node:test'
import assert from 'node:assert/strict'
import { registerHooks, stripTypeScriptTypes } from 'node:module'
import '../uji/typescript-resolver.mjs'
// Inject only Vite's build-time API origin; execute the actual client and error parser.
registerHooks({load(url,context,nextLoad){const result=nextLoad(url,context);
  if(/\/src\/lib\/(api|galatApi)\.ts/.test(url))return {...result,format:'module',source:stripTypeScriptTypes(String(result.source).replace('import.meta.env.VITE_API_URL',JSON.stringify('https://example.invalid')),{mode:'transform'})};
  return result}})
const memory=new Map()
globalThis.localStorage={getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,String(v)),removeItem:k=>memory.delete(k)}
const originalFetch=globalThis.fetch
let calls,client,serial=0
const deferred=()=>{let resolve;
  const promise=new Promise(r=>resolve=r);
  return {promise,resolve}}
const response=(body,status=200)=>({ok:status===200,status,headers:new Headers(),json:async()=>body})
test.beforeEach(async () => {
  memory.clear();
  memory.set('pmd-token','token-A');
  memory.set('panaceamed.session.v1','session-A');
  calls=[];
  globalThis.fetch=async(url,options)=>{calls.push({url,options});
  return response({profile:{weightKg:61}})};
  client=await import(`../../src/lib/api.ts?session-test=${serial++}`)})
test.after(()=>{globalThis.fetch=originalFetch})

test('current request uses the current bearer and returns its own response',async () => {
  assert.deepEqual(await client.api.getHealthProfile(),{weightKg:61});
  assert.equal(calls.length,1);
  assert.equal(calls[0].options.headers.authorization,'Bearer token-A')
})

test('cross-tab token replacement fails before sending a request',async () => {
  memory.set('pmd-token','token-B');
  await assert.rejects(client.api.getHealthProfile());
  assert.equal(calls.length,0)
})

test('late response is rejected after same-tab login replacement',async () => {
  const wait=deferred();
  globalThis.fetch=()=>wait.promise;
  const running=client.api.getHealthProfile();
  client.setAuthToken('token-B');
  memory.set('panaceamed.session.v1','session-B');
  wait.resolve(response({profile:{weightKg:61}}));
  await assert.rejects(running);
  assert.equal(memory.get('pmd-token'),'token-B')
})

test('response body decoding cannot outlive a session replacement',async () => {
  const wait=deferred();
  globalThis.fetch=async()=>({...response({}),json:()=>wait.promise});
  const running=client.api.getHealthProfile();
  await new Promise(r=>setImmediate(r));
  memory.set('panaceamed.session.v1','session-B');
  wait.resolve({profile:{weightKg:61}});
  await assert.rejects(running)})

test('renewing the same token invalidates the old request generation',async () => {
  const wait=deferred();
  globalThis.fetch=()=>wait.promise;
  const running=client.api.getHealthProfile();
  client.setAuthToken('token-A');
  wait.resolve(response({profile:{weightKg:61}}));
  await assert.rejects(running)})

test('late logout cannot clear a replacement login',async () => {
  const wait=deferred();
  globalThis.fetch=()=>wait.promise;
  const running=client.api.logout();
  client.setAuthToken('token-B');
  memory.set('panaceamed.session.v1','session-B');
  wait.resolve(response({ok:true}));
  await assert.rejects(running);
  assert.equal(memory.get('pmd-token'),'token-B');
  globalThis.fetch=async()=>response({profile:{weightKg:81}});
  assert.deepEqual(await client.api.getHealthProfile(),{weightKg:81})
})

test('current logout clears its own token even when the server fails',async () => {
  globalThis.fetch=async () => {
  throw new Error('offline')};
  await assert.rejects(client.api.logout(),/offline/);
  assert.equal(memory.has('pmd-token'),false)
})

test('stale cross-tab logout cannot clear the remembered replacement token',async () => {
  memory.set('pmd-token','token-B');
  await assert.rejects(client.api.logout());
  assert.equal(memory.get('pmd-token'),'token-B');
  assert.equal(calls.length,0)
})

test('unavailable session storage fails closed before network IO',async t=>{t.mock.method(localStorage,'getItem',()=>{throw new Error('storage unavailable')});
  await assert.rejects(client.api.getHealthProfile());
  assert.equal(calls.length,0)
})

test('current login installs its token and subsequent requests use it',async () => {
  globalThis.fetch=async(url,options)=>{calls.push({url,options});
  return url.endsWith('/api/auth/dev-login')?response({user:{id:'B',email:'b@example.invalid',name:'B',role:'pasien'},token:'token-B'}):response({profile:{weightKg:81}})};
  const account=await client.api.devLogin('b@example.invalid','B','pasien');
  assert.equal(account.id,'B');
  assert.equal(memory.get('pmd-token'),'token-B');
  memory.set('panaceamed.session.v1','session-B');
  assert.deepEqual(await client.api.getHealthProfile(),{weightKg:81});
  assert.equal(calls.at(-1).options.headers.authorization,'Bearer token-B')
})

test('current successful logout clears only its own token',async () => {
  globalThis.fetch=async()=>response({ok:true});
  assert.deepEqual(await client.api.logout(),{ok:true});
  assert.equal(memory.has('pmd-token'),false)
})

test('an offline old logout cannot erase a newer token',async () => {
  let reject;
  globalThis.fetch=()=>new Promise((_,r)=>reject=r);
  const running=client.api.logout();
  client.setAuthToken('token-B');
  reject(new Error('offline'));
  await assert.rejects(running,/offline/);
  assert.equal(memory.get('pmd-token'),'token-B')
})

test('current HTTP failures retain the existing structured error and request identifier',async () => {
  globalThis.fetch=async()=>({...response({error:'denied'},403),headers:new Headers({'x-request-id':'test-request'})});
  await assert.rejects(client.api.getHealthProfile(),error=>error.status===403&&error.requestId==='test-request')
})

test('anonymous public requests remain usable without a bearer token',async () => {
  client.setAuthToken(null);
  memory.delete('panaceamed.session.v1');
  globalThis.fetch=async(url,options)=>{calls.push({url,options});
  return response({ok:true})};
  assert.deepEqual(await client.api.health(),{ok:true});
  assert.equal(calls[0].options.headers.authorization,undefined)
})

test('Shell-style immediate local logout still clears its original bearer', async () => {
  const wait = deferred()
  globalThis.fetch = () => wait.promise
  const running = client.api.logout()
  memory.delete('panaceamed.session.v1')
  wait.resolve(response({ ok: true }))
  await assert.rejects(running, /Session/)
  assert.equal(memory.has('pmd-token'), false)
})

test('same-token cross-tab remembered login replacement is not erased by old logout', async () => {
  const wait = deferred()
  globalThis.fetch = () => wait.promise
  const running = client.api.logout()
  memory.set('panaceamed.session.v1', 'renewed-session-A')
  wait.resolve(response({ ok: true }))
  await assert.rejects(running, /Session/)
  assert.equal(memory.get('pmd-token'), 'token-A')
})
