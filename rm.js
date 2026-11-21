// Инструмент «Удаление фона»: модели U2-Net (ONNX), скачивание и запуск нейросети без Python.
// Подготовка картинки и постобработка маски идут в окне (src/tool-rm.js), здесь только модель.
const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');

const BASE = 'https://github.com/danielgatis/rembg/releases/download/v0.0.0/';
const MODELS = {
  u2net: { size: 175997641, sha: '8d10d2f3bb75ae3b6d527c77944fc5e7dcd94b29809d47a739a7a728a912b491' }
};
const N = 320;

function init({ ipcMain, app, getWin, log }) {
  const dir = () => path.join(app.getPath('userData'), 'models');
  const file = (m) => path.join(dir(), m + '.onnx');
  const okName = (m) => typeof m === 'string' && Object.prototype.hasOwnProperty.call(MODELS, m);
  const has = (m) => { try { return fs.statSync(file(m)).size === MODELS[m].size; } catch (e) { return false; } };
  const downloads = new Map();
  let ort = null, sess = null, sessName = '', chain = Promise.resolve();

  function loadOrt() {
    if (ort) return ort;
    ort = require('onnxruntime-node');
    return ort;
  }

  function fetchTo(url, dest, m, left, onProg) {
    return new Promise((resolve, reject) => {
      const req = https.get(url, { headers: { 'User-Agent': 'MarlyHelper' } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          res.resume();
          if (left <= 0) return reject(new Error('too many redirects'));
          return resolve(fetchTo(new URL(res.headers.location, url).toString(), dest, m, left - 1, onProg));
        }
        if (res.statusCode !== 200) { res.resume(); return reject(new Error('HTTP ' + res.statusCode)); }
        const total = Number(res.headers['content-length']) || MODELS[m].size;
        const hash = crypto.createHash('sha256');
        const out = fs.createWriteStream(dest);
        let got = 0;
        res.on('data', (c) => { got += c.length; hash.update(c); onProg(got, total); });
        res.on('error', reject);
        out.on('error', reject);
        out.on('finish', () => resolve(hash.digest('hex')));
        res.pipe(out);
      });
      req.setTimeout(30000, () => req.destroy(new Error('timeout')));
      req.on('error', reject);
    });
  }

  ipcMain.handle('rm:status', async () => {
    const r = { models: {}, engine: true, error: '' };
    Object.keys(MODELS).forEach((m) => { r.models[m] = has(m); });
    try { loadOrt(); } catch (e) { r.engine = false; r.error = String(e.message || e).slice(0, 160); }
    return r;
  });

  ipcMain.handle('rm:download', async (_e, m) => {
    if (!okName(m)) return { ok: false, error: 'bad model' };
    if (has(m)) return { ok: true };
    if (downloads.has(m)) return downloads.get(m);
    const tmp = file(m) + '.part';
    const p = (async () => {
      try {
        fs.mkdirSync(dir(), { recursive: true });
        let last = 0;
        const sha = await fetchTo(BASE + m + '.onnx', tmp, m, 5, (got, total) => {
          const t = Date.now();
          if (t - last < 150 && got < total) return;
          last = t;
          const w = getWin(); if (w && !w.isDestroyed()) w.webContents.send('rm:dl', { name: m, got, total });
        });
        if (sha !== MODELS[m].sha) throw new Error('checksum mismatch');
        fs.renameSync(tmp, file(m));
        return { ok: true };
      } catch (ex) {
        try { fs.unlinkSync(tmp); } catch (x) {}
        const msg = String(ex.message || ex).slice(0, 160);
        if (log) log('rm:download ' + m + ' ' + msg);
        return { ok: false, error: msg };
      } finally { downloads.delete(m); }
    })();
    downloads.set(m, p);
    return p;
  });

  const toF32 = (x) => {
    let u8;
    if (x instanceof ArrayBuffer) u8 = new Uint8Array(x);
    else if (ArrayBuffer.isView(x)) u8 = new Uint8Array(x.buffer, x.byteOffset, x.byteLength);
    else return null;
    if (u8.length !== 3 * N * N * 4) return null;
    return new Float32Array(u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.length));
  };

  async function infer(m, data) {
    const o = loadOrt();
    if (!sess || sessName !== m) {
      if (sess) { try { await sess.release(); } catch (e) {} sess = null; sessName = ''; }
      sess = await o.InferenceSession.create(file(m), { executionProviders: ['cpu'], graphOptimizationLevel: 'all' });
      sessName = m;
    }
    const out = await sess.run({ [sess.inputNames[0]]: new o.Tensor('float32', data, [1, 3, N, N]) });
    const v = out[sess.outputNames[0]].data;
    let mn = Infinity, mx = -Infinity;
    for (let i = 0; i < v.length; i++) { const x = v[i]; if (x < mn) mn = x; if (x > mx) mx = x; }
    const k = mx - mn > 1e-6 ? 1 / (mx - mn) : 0, res = new Uint8Array(v.length);
    for (let i = 0; i < v.length; i++) res[i] = Math.max(0, Math.min(255, Math.round((v[i] - mn) * k * 255)));
    return res;
  }

  // req: { model, data: Float32Array 1x3x320x320 }; ответ: { ok, mask: Uint8Array 320x320 }
  ipcMain.handle('rm:infer', (_e, req) => {
    const job = chain.then(async () => {
      try {
        if (!req || !okName(req.model)) throw new Error('bad model');
        if (!has(req.model)) throw new Error('model missing');
        const d = toF32(req.data); if (!d) throw new Error('bad data');
        return { ok: true, mask: await infer(req.model, d) };
      } catch (ex) {
        const msg = String(ex.message || ex).slice(0, 200);
        if (log) log('rm:infer ' + msg);
        return { ok: false, error: msg };
      }
    });
    chain = job.then(() => {}, () => {});
    return job;
  });

  ipcMain.handle('rm:release', async () => {
    if (sess) { try { await sess.release(); } catch (e) {} sess = null; sessName = ''; }
    return true;
  });
}

module.exports = { init, MODELS };
