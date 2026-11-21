// Собирает файл обновления для GitHub Releases: dist/update/Marly-Helper-update.zip (содержимое dist/win-unpacked в корне) + .sha256.
// Перед запуском: поднять "version" в package.json и выполнить npm run dist:dir (это делает make-update.bat).
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const root = path.join(__dirname, '..');
const src = path.join(root, 'dist', 'win-unpacked');
const outDir = path.join(root, 'dist', 'update');
const name = 'Marly-Helper-update.zip';
if (!fs.existsSync(path.join(src, 'Marly Helper.exe')) || !fs.existsSync(path.join(src, 'resources', 'app.asar'))) { console.error('dist\\win-unpacked is not built. Run npm run dist:dir first.'); process.exit(1); }
const ver = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).version;
fs.rmSync(outDir, { recursive: true, force: true }); fs.mkdirSync(outDir, { recursive: true });
const zip = path.join(outDir, name);
execFileSync('tar', ['-a', '-c', '-f', zip, '-C', src, '.'], { stdio: 'inherit' });
const sha = crypto.createHash('sha256').update(fs.readFileSync(zip)).digest('hex');
fs.writeFileSync(zip + '.sha256', sha + '  ' + name + '\n');
console.log('\nOK  version ' + ver + '\n' + zip + '  (' + (fs.statSync(zip).size / 1048576).toFixed(1) + ' MB)\nsha256 ' + sha);
console.log('\nGitHub: create a release with tag v' + ver + ' and attach both files from dist\\update.');
