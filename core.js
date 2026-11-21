// Инструмент «Core»: сохранение отредактированного core (XML) на диск. Остальная логика (поиск, правка) живёт в окне, src/tool-core.js.
const fs = require('fs');
const path = require('path');

const MAX_LEN = 300 * 1024 * 1024;

function init({ ipcMain, dialog, getWin, log }) {
  ipcMain.handle('core:save', async (_e, req) => {
    try {
      if (!req || typeof req.text !== 'string' || !req.text.length || req.text.length > MAX_LEN) return { ok: false, error: 'bad data' };
      if (req.text.indexOf('<ParticleEffectsList') < 0) return { ok: false, error: 'not a core' };
      const base = String(req.name || 'core.xml').replace(/[\\/:*?"<>|]/g, '_').slice(0, 120) || 'core.xml';
      const r = await dialog.showSaveDialog(getWin(), { defaultPath: path.join(require('electron').app.getPath('downloads'), base), filters: [{ name: 'XML', extensions: ['xml'] }] });
      if (r.canceled || !r.filePath) return { ok: false, error: 'cancel' };
      const dst = /\.xml$/i.test(r.filePath) ? r.filePath : r.filePath + '.xml';
      await fs.promises.writeFile(dst, req.text, 'utf8');
      return { ok: true, path: dst, size: Buffer.byteLength(req.text, 'utf8') };
    } catch (e) { try { log && log('core:save ' + (e.stack || e)); } catch (x) { /* */ } return { ok: false, error: String(e.message || e) }; }
  });
}

module.exports = { init };
