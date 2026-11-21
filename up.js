// Инструмент «Улучшение фото»: выбор, чтение и сохранение файлов (обработка идёт в окне, в src/lib/upcore.js)
const fs = require('fs');
const path = require('path');

const IN_EXT = new Set(['.png', '.jpg', '.jpeg', '.jfif', '.webp', '.bmp', '.gif', '.avif']);
const OUT_EXT = new Set(['.png', '.jpg', '.webp']);
const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.jfif': 'image/jpeg', '.webp': 'image/webp', '.bmp': 'image/bmp', '.gif': 'image/gif', '.avif': 'image/avif' };
const cleanName = (s) => String(s || '').replace(/[\\/:*?"<>|\u0000-\u001f]/g, '').slice(0, 60);

function init({ ipcMain, dialog, getWin, log }) {
  const used = new Map();
  const okIn = (p) => typeof p === 'string' && path.isAbsolute(p) && IN_EXT.has(path.extname(p).toLowerCase());

  ipcMain.handle('up:pick-files', async () => {
    const r = await dialog.showOpenDialog(getWin(), { properties: ['openFile', 'multiSelections'], filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'jfif', 'webp', 'bmp', 'gif', 'avif'] }] });
    return r.canceled ? [] : r.filePaths;
  });
  ipcMain.handle('up:read', async (_e, p) => {
    if (!okIn(p)) return { ok: false, error: 'bad path' };
    try {
      const st = fs.statSync(p);
      if (st.size > 120 * 1024 * 1024) return { ok: false, error: 'too big' };
      const buf = fs.readFileSync(p);
      return { ok: true, size: st.size, url: 'data:' + MIME[path.extname(p).toLowerCase()] + ';base64,' + buf.toString('base64') };
    } catch (e) { return { ok: false, error: String(e.message || e) }; }
  });
  // req: { item: { input, ext, data }, outDir, px, sx, lc, ow, reset }
  ipcMain.handle('up:save', async (_e, req) => {
    const r = { success: false, error: '' };
    try {
      if (!req || !req.item) throw new Error('bad request');
      if (req.reset) used.clear();
      const it = req.item;
      if (!okIn(it.input)) throw new Error('bad path');
      const ext = String(it.ext || '').toLowerCase();
      if (!OUT_EXT.has(ext)) throw new Error('bad ext');
      const buf = Buffer.from(it.data);
      if (buf.length < 16 || buf.length > 512 * 1024 * 1024) throw new Error('bad data');
      const out = req.outDir && path.isAbsolute(req.outDir) ? req.outDir : path.dirname(it.input);
      fs.mkdirSync(out, { recursive: true });
      const base = cleanName(req.px) + path.basename(it.input, path.extname(it.input)) + cleanName(req.sx);
      const key = (out + '|' + base + ext).toLowerCase();
      const n = used.get(key) || 0; used.set(key, n + 1);
      let name = base + (n ? '_' + n : '') + ext;
      if (req.lc) name = name.toLowerCase();
      const file = path.join(out, name);
      if (!req.ow && fs.existsSync(file)) { r.error = 'exists'; }
      else { fs.writeFileSync(file, buf); r.success = true; r.output = file; r.size = buf.length; }
    } catch (ex) { r.error = String(ex.message || ex).slice(0, 200); if (log) log('up:save ' + r.error); }
    return r;
  });
}

module.exports = { init };
