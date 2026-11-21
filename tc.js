// Инструмент «Переименование таймциклов»: запись набора готовых XML-файлов в выбранную папку.
// Вся остальная логика (разбор файла, подстановка имени цикла) живёт в окне, src/tool-tc.js.
const fs = require('fs');
const path = require('path');

const MAX_FILES = 40;
const MAX_LEN = 20 * 1024 * 1024;
const NAME_RE = /^w_[a-z0-9]+\.xml$/;

function str(x, n) { return typeof x === 'string' ? x.slice(0, n) : ''; }

function init({ ipcMain, dialog, getWin, log }) {
  ipcMain.handle('tc:save', async (_e, req) => {
    try {
      const files = req && Array.isArray(req.files) ? req.files : null;
      if (!files || !files.length || files.length > MAX_FILES) return { ok: false, error: 'bad data' };
      const seen = new Set();
      for (const f of files) {
        if (!f || !NAME_RE.test(f.name) || seen.has(f.name)) return { ok: false, error: 'bad name' };
        if (typeof f.text !== 'string' || !f.text.length || f.text.length > MAX_LEN || f.text.indexOf('<cycle') < 0) return { ok: false, error: 'bad data' };
        seen.add(f.name);
      }
      const lb = (req && req.labels) || {};
      const r = await dialog.showOpenDialog(getWin(), {
        title: str(lb.pick, 120) || undefined,
        defaultPath: require('electron').app.getPath('downloads'),
        properties: ['openDirectory', 'createDirectory']
      });
      if (r.canceled || !r.filePaths || !r.filePaths[0]) return { ok: false, error: 'cancel' };
      const dir = r.filePaths[0];
      const exist = files.map((f) => f.name).filter((n) => fs.existsSync(path.join(dir, n)));
      if (exist.length) {
        const c = await dialog.showMessageBox(getWin(), {
          type: 'question',
          buttons: [str(lb.replace, 40) || 'Replace', str(lb.cancel, 40) || 'Cancel'],
          defaultId: 1, cancelId: 1, noLink: true,
          message: (str(lb.exists, 200) || 'Files already exist: {n}').replace('{n}', String(exist.length)),
          detail: exist.slice(0, 10).join('\n') + (exist.length > 10 ? '\n…' : '')
        });
        if (c.response !== 0) return { ok: false, error: 'cancel' };
      }
      for (const f of files) await fs.promises.writeFile(path.join(dir, f.name), f.text, 'utf8');
      return { ok: true, dir, count: files.length };
    } catch (e) { try { log && log('tc:save ' + (e.stack || e)); } catch (x) { /* */ } return { ok: false, error: String(e.message || e) }; }
  });
}

module.exports = { init };
