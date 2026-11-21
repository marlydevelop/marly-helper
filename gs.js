// Инструмент «Settings»: запись отредактированного settings.xml (GTA V). Всё остальное (разбор, правка по тексту) живёт в окне, src/tool-gs.js.
const fs = require('fs');
const path = require('path');

const MAX_LEN = 1024 * 1024;
const NAME_RE = /^[A-Za-z0-9_. -]{1,60}\.xml$/;

function str(x, n) { return typeof x === 'string' ? x.slice(0, n) : ''; }

function init({ ipcMain, dialog, getWin, log }) {
  ipcMain.handle('gs:save', async (_e, req) => {
    try {
      const name = req && req.name, text = req && req.text;
      if (typeof name !== 'string' || !NAME_RE.test(name)) return { ok: false, error: 'bad name' };
      if (typeof text !== 'string' || !text.length || text.length > MAX_LEN || text.indexOf('<Settings') < 0) return { ok: false, error: 'bad data' };
      const { app } = require('electron');
      let start = app.getPath('downloads');
      try { const g = path.join(app.getPath('documents'), 'Rockstar Games', 'GTA V'); if (fs.existsSync(g)) start = g; } catch (x) { /* */ }
      const lb = (req && req.labels) || {};
      const r = await dialog.showSaveDialog(getWin(), {
        title: str(lb.pick, 120) || undefined,
        defaultPath: path.join(start, name),
        filters: [{ name: 'XML', extensions: ['xml'] }]
      });
      if (r.canceled || !r.filePath) return { ok: false, error: 'cancel' };
      const target = r.filePath;
      await fs.promises.writeFile(target, text, 'utf8');
      return { ok: true, path: target };
    } catch (e) { try { log && log('gs:save ' + (e.stack || e)); } catch (x) { /* */ } return { ok: false, error: String(e.message || e) }; }
  });
}

module.exports = { init };
