// Сборка rpfenc.bin из файлов GTA5 Archive Fix: gtav_ng_encrypt_tables.dat + gtav_ng_encrypt_luts.dat.
// Запуск: node tools/make-rpfenc.js "<папка GTA5 Archive Fix>" [выход]
// Формат: 'MHE1' + deflateRaw( таблицы 17*16*256 uint32 LE | LUT раундов 2..15: 14*16*196608 байт ).
// В LUT каждого (раунд, k): LUT0[256][256], LUT1[256][256], Indices[65536]. Раунды 0, 1, 16 в файле нулевые и не нужны.
const fs = require('fs'), path = require('path'), zlib = require('zlib');
const dir = process.argv[2], out = process.argv[3] || path.join(__dirname, '..', 'rpfenc.bin');
if (!dir) { console.log('usage: node tools/make-rpfenc.js <dir> [out]'); process.exit(1); }
const tb = fs.readFileSync(path.join(dir, 'gtav_ng_encrypt_tables.dat'));
const lu = fs.readFileSync(path.join(dir, 'gtav_ng_encrypt_luts.dat'));
const S = 196608;
if (tb.length !== 17 * 16 * 1024 || lu.length !== 17 * 16 * S) throw new Error('bad input sizes');
const body = Buffer.concat([tb, lu.subarray(2 * 16 * S, 16 * 16 * S)]);
fs.writeFileSync(out, Buffer.concat([Buffer.from('MHE1'), zlib.deflateRawSync(body, { level: 9 })]));
console.log('written', out, fs.statSync(out).size);
