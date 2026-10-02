import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {portAvailable,phpReady} from './dev-services.mjs';
test('occupied service is reused only when it identifies the project PHP API', async () => {
 let body={status:'ok'};
 const server=http.createServer((req,res)=>{res.setHeader('Content-Type','application/json');res.end(JSON.stringify(body));});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const port=server.address().port,origin=`http://127.0.0.1:${port}`;
 try {
  assert.equal(await portAvailable('127.0.0.1',port),false);
  assert.equal(await phpReady(origin),false);
  body={status:'ok',service:'thanh-y-cac-php'};
  assert.equal(await phpReady(origin),true);
 } finally {await new Promise(resolve=>server.close(resolve));}
 assert.equal(await portAvailable('127.0.0.1',port),true);
});
