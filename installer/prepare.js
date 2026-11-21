// Готовит установщик: кладёт собранное приложение (dist/win-unpacked) в installer/payload и синхронизирует версию.
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const src = path.join(root, 'dist', 'win-unpacked');
const dst = path.join(__dirname, 'payload');
if (!fs.existsSync(path.join(src, 'Marly Helper.exe'))) { console.error('dist\\win-unpacked\\Marly Helper.exe not found. Build the app first.'); process.exit(1); }
const ver = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).version;
fs.rmSync(dst, { recursive: true, force: true });
fs.cpSync(src, dst, { recursive: true });
fs.writeFileSync(path.join(__dirname, 'src', 'info.json'), JSON.stringify({ version: ver }));
const pj = path.join(__dirname, 'package.json');
const p = JSON.parse(fs.readFileSync(pj, 'utf8'));
p.version = ver;
fs.writeFileSync(pj, JSON.stringify(p, null, 2) + '\n');
console.log('Payload ready, version ' + ver);
