// Optional: install pngjs@7.0.0 and @zxing/library@0.21.3 outside the checkout.
const path=require('node:path');
const {createRequire}=require('node:module');
if(!process.env.ZEN_BARCODE_TOOL_DIR)throw Error('Set ZEN_BARCODE_TOOL_DIR to the external test-tool installation directory.');
const load=createRequire(path.join(path.resolve(process.env.ZEN_BARCODE_TOOL_DIR),'package.json'));
const {PNG}=load('pngjs');
const {RGBLuminanceSource,HybridBinarizer,BinaryBitmap,MultiFormatReader,DecodeHintType,BarcodeFormat}=load('@zxing/library');
const fs=require('fs'),assert=require('assert/strict');
const files=process.argv.slice(2);if(!files.length)throw Error('Pass one or more 203dpi test-receipt PNG paths.');
for(const file of files){const png=PNG.sync.read(fs.readFileSync(file));const grey=new Uint8ClampedArray(png.width*png.height);for(let i=0;i<grey.length;i++){const k=i*4;grey[i]=(png.data[k]+2*png.data[k+1]+png.data[k+2])/4;}const bitmap=new BinaryBitmap(new HybridBinarizer(new RGBLuminanceSource(grey,png.width,png.height)));const hints=new Map([[DecodeHintType.POSSIBLE_FORMATS,[BarcodeFormat.CODE_39]],[DecodeHintType.TRY_HARDER,true]]);const result=new MultiFormatReader().decode(bitmap,hints);assert.equal(result.getText(),'ZEN-TEST-001');console.log('PASS '+path.basename(file)+' barcode decoded: '+result.getText());}
