import test from 'node:test';
import assert from 'node:assert/strict';
import {paperFormat,scannerValue,printStyles} from '../web/device-tools.mjs';
import {printerRequest} from '../desktop/printer-policy.mjs';
test('Paper defaults to 80mm and rejects unknown/prototype names',()=>{for(const v of [null,undefined,'unknown','constructor','__proto__'])assert.equal(paperFormat(v),'thermal80');assert.equal(paperFormat('thermal58'),'thermal58');});
test('Scanner strips terminators without changing leading zeroes',()=>{assert.equal(scannerValue('001234\r\n'),'001234');assert.equal(scannerValue('zen-test-001\t'),'ZEN-TEST-001');});
test('Receipt styles have physical paper sizes and readable narrow tables',()=>{assert.match(printStyles('thermal58'),/size:58mm 297mm/);assert.match(printStyles('thermal80'),/max-width:72mm/);assert.match(printStyles('a4'),/size:210mm 297mm/);});
test('Native print request allows only known installed printers and sizes',()=>{assert.throws(()=>printerRequest({format:'unknown'},[]));assert.throws(()=>printerRequest({format:'thermal80',printer:'uninstalled'},[]));assert.throws(()=>printerRequest({format:'__proto__'},[]));assert.equal(printerRequest({format:'thermal80',printer:'Receipt'},[{name:'Receipt'}]).pageSize.width,80000);assert.equal(printerRequest({format:'a4'},[]).silent,false);});

import {portableArgon2} from '../server/security.mjs';
import {argon2} from 'node:crypto';
import {promisify} from 'node:util';
test('Portable Argon2 matches native password and backup keys byte-for-byte',async()=>{for(const [memory,passes] of [[19456,2],[65536,3]]){const options={message:'Existing password — Urdu-compatible UTF-8',nonce:Buffer.from('0123456789abcdef'),parallelism:1,tagLength:32,memory,passes};assert.deepEqual(await portableArgon2(options),await promisify(argon2)('argon2id',options));}});
