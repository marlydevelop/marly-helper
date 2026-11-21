// Инструмент PNG -> SVG: подготовка картинки и интерфейс в окне (src/tool-svg.js), векторизация здесь:
// запуск vtracer.exe (https://github.com/visioncortex/vtracer, CLI 1.0), запись результата на диск.
// vtracer.exe лежит в bin/ (get-vtracer.bat) или скачивается сам при первом запуске в userData/bin.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFile } = require('child_process');
const { app, nativeImage } = require('electron');
const { buildArgs, fixSvg } = require('./svgpost');

const IMG_EXT = new Set(['.png', '.jpg', '.jpeg', '.bmp']);
const cleanName = (s) => String(s || '').replace(/[\\/:*?"<>|\u0000-\u001f]/g, '').slice(0, 60);
const clamp = (v, a, b, d) => { v = Number(v); return Number.isFinite(v) ? Math.min(b, Math.max(a, v)) : d; };

// Релиз vtracer 1.0.0-alpha.3 (Windows x64). Те же URL и sha256 в tools/get-vtracer.ps1.
const VT_URL = 'https://github.com/visioncortex/vtracer/releases/download/1.0.0-alpha.3/vtracer-x86_64-pc-windows-msvc.zip';
const VT_SHA = '26fb07c440aa6dd0a9ac57a83db6ee2924ddf308bccf451e76b324bb61780dba';
const MIN_SIDE = 1000; // мелкие картинки увеличиваем перед трассировкой, SVG всё равно имеет исходный размер

const vtDirs = () => [path.join(app.isPackaged ? process.resourcesPath : __dirname, 'bin'), path.join(app.getPath('userData'), 'bin')];
function findVt() {
  for (const d of vtDirs()) { const p = path.join(d, 'vtracer.exe'); if (fs.existsSync(p)) return p; }
  return null;
}

let dlPromise = null;
function downloadVt(log) {
  const dest = path.join(app.getPath('userData'), 'bin');
  const ps = [
    "$ErrorActionPreference='Stop'; $ProgressPreference='SilentlyContinue'",
    '[Net.ServicePointManager]::SecurityProtocol=[Net.SecurityProtocolType]::Tls12',
    "$tmp=Join-Path $env:TEMP ('mh-vt-'+[guid]::NewGuid().ToString('N')); New-Item -ItemType Directory -Path $tmp | Out-Null",
    "$zip=Join-Path $tmp 'vt.zip'",
    "Invoke-WebRequest -Uri '" + VT_URL + "' -OutFile $zip -UseBasicParsing",
    "if ((Get-FileHash $zip -Algorithm SHA256).Hash.ToLower() -ne '" + VT_SHA + "') { throw 'sha256 mismatch' }",
    'Expand-Archive -Path $zip -DestinationPath $tmp -Force',
    "$exe=Get-ChildItem $tmp -Recurse -Filter 'vtracer*.exe' | Select-Object -First 1",
    "if (-not $exe) { throw 'vtracer.exe not found in archive' }",
    'New-Item -ItemType Directory -Path $env:MH_DEST -Force | Out-Null',
    "Copy-Item $exe.FullName (Join-Path $env:MH_DEST 'vtracer.exe') -Force",
    'Remove-Item $tmp -Recurse -Force'
  ].join('\n');
  const enc = Buffer.from(ps, 'utf16le').toString('base64');
  return new Promise((resolve) => {
    execFile('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-EncodedCommand', enc], {
      windowsHide: true, timeout: 180000, env: Object.assign({}, process.env, { MH_DEST: dest })
    }, (err, so, se) => { if (err && log) log('svg:download ' + String(se || err.message).slice(0, 400).replace(/\r?\n/g, ' / ')); resolve(!err); });
  });
}
async function ensureVt(log) {
  let p = findVt();
  if (p) return p;
  if (!dlPromise) dlPromise = downloadVt(log).finally(() => { dlPromise = null; });
  await dlPromise;
  return findVt();
}

// Увеличение мелкой картинки (как раньше в старом движке). Возвращает { png, w, h, scale } (w/h исходные).
function prepare(png, upscale) {
  let img = nativeImage.createFromBuffer(png);
  const sz = img.getSize();
  const ow = sz.width, oh = sz.height;
  if (!ow || !oh) throw new Error('bad image');
  let scale = 1;
  if (upscale !== false && Math.max(ow, oh) < MIN_SIDE) {
    scale = Math.min(4, Math.max(2, Math.round(MIN_SIDE / Math.max(ow, oh))));
    img = img.resize({ width: ow * scale, height: oh * scale, quality: 'best' });
    png = img.toPNG();
  }
  return { png, ow, oh, scale };
}

function init({ ipcMain, clipboard, log }) {
  const used = new Map();
  let chain = Promise.resolve(), previewSeq = 0, curPreview = null;

  function spawnEngine(exe, args, isPreview) {
    return new Promise((resolve) => {
      const ch = execFile(exe, args, { windowsHide: true, timeout: 180000, maxBuffer: 4 * 1024 * 1024, encoding: 'utf8' },
        (err, so, se) => { if (curPreview === ch) curPreview = null; resolve({ err, se: String(se || ''), killed: !!(ch && ch.__cancel) }); });
      if (isPreview) curPreview = ch;
    });
  }

  async function traceOne(req, isPreview, seq) {
    if (isPreview && seq !== previewSeq) return { ok: false, error: 'cancelled' };
    const exe = await ensureVt(log);
    if (!exe) return { ok: false, error: 'noengine' };
    if (isPreview && seq !== previewSeq) return { ok: false, error: 'cancelled' };
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mh-svg-'));
    try {
      const pr = prepare(Buffer.from(req.png), req.upscale);
      const input = path.join(dir, 'in.png'), output = path.join(dir, 'out.svg');
      fs.writeFileSync(input, pr.png);
      const args = buildArgs(input, output, { preset: req.preset, blender: !!req.blender, simplify: req.simplify !== false, tol: clamp(req.tol, 0.05, 3, 0.35), scale: pr.scale });
      const r = await spawnEngine(exe, args, isPreview);
      if (r.killed || (isPreview && seq !== previewSeq)) return { ok: false, error: 'cancelled' };
      if (r.err) {
        if (r.err.code === 'ENOENT') return { ok: false, error: 'noengine' };
        const cd = r.err.code, hx = typeof cd === 'number' ? ' (0x' + (cd >>> 0).toString(16).toUpperCase() + ')' : '';
        const last = (r.se.trim().split(/\r?\n/).pop() || ('vtracer exit ' + cd + hx + (r.err.signal ? ' ' + r.err.signal : ''))).slice(0, 200);
        if (log) log('svg:trace ' + last + ' | ' + args.slice(2).join(' ') + ' | ' + r.se.slice(-800).replace(/\r?\n/g, ' / '));
        return { ok: false, error: last };
      }
      if (!fs.existsSync(output)) return { ok: false, error: 'no output' };
      return { ok: true, svg: fixSvg(fs.readFileSync(output, 'utf8'), pr.ow, pr.oh, pr.ow * pr.scale, pr.oh * pr.scale, !!req.blender) };
    } finally { try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {} }
  }

  ipcMain.handle('svg:trace', (_e, req) => {
    if (!req || !req.png || (req.png.byteLength || req.png.length || 0) > 160 * 1024 * 1024) return { ok: false, error: 'bad request' };
    const isPreview = !!req.preview, seq = isPreview ? ++previewSeq : 0;
    if (isPreview && curPreview) { curPreview.__cancel = true; try { curPreview.kill(); } catch (e) {} }
    const job = () => traceOne(req, isPreview, seq).catch((ex) => ({ ok: false, error: String(ex && ex.message || ex).slice(0, 200) }));
    const p = chain.then(job, job);
    chain = p.then(() => {}, () => {});
    return p;
  });
  ipcMain.handle('svg:save', async (_e, req) => {
    const res = [];
    if (!req || !Array.isArray(req.items)) return res;
    if (req.reset) used.clear();
    for (let i = 0; i < req.items.length && i < 200; i++) {
      const it = req.items[i];
      const r = { input: it && it.input, success: false, error: '' };
      try {
        if (!it || typeof it.input !== 'string' || !path.isAbsolute(it.input) || !IMG_EXT.has(path.extname(it.input).toLowerCase())) throw new Error('bad path');
        if (typeof it.svg !== 'string' || it.svg.length < 10 || it.svg.length > 64 * 1024 * 1024 || !/^\s*(<\?xml[^>]*>\s*)?<svg[\s>]/i.test(it.svg)) throw new Error('bad svg');
        const out = req.outDir && path.isAbsolute(req.outDir) ? req.outDir : path.dirname(it.input);
        fs.mkdirSync(out, { recursive: true });
        const base = cleanName(req.px) + path.basename(it.input, path.extname(it.input)) + cleanName(req.sx);
        const key = (out + '|' + base).toLowerCase();
        const n = used.get(key) || 0; used.set(key, n + 1);
        let name = base + (n ? '_' + n : '') + '.svg';
        if (req.lc) name = name.toLowerCase();
        const file = path.join(out, name);
        if (!req.ow && fs.existsSync(file)) { r.error = 'exists'; }
        else { fs.writeFileSync(file, it.svg, 'utf8'); if (req.bl) { try { fs.writeFileSync(file.replace(/\.svg$/i, '') + '_blender.py', blenderPy(file), 'utf8'); } catch (e) { if (log) log('svg:save py ' + e.message); } } r.success = true; r.output = file; r.size = Buffer.byteLength(it.svg); }
      } catch (ex) { r.error = String(ex.message || ex).slice(0, 200); if (log) log('svg:save ' + r.error); }
      res.push(r);
    }
    return res;
  });
  ipcMain.handle('svg:copy', (_e, text) => {
    try { if (typeof text === 'string' && text.length < 64 * 1024 * 1024) { clipboard.writeText(text); return true; } } catch (e) {}
    return false;
  });
}


function blenderPy(svgPath) {
  const p = JSON.stringify(svgPath);
  return `# Marly Helper: import SVG into Blender as ONE mesh, colors in Color Attribute "Col" (no per-color materials).
# Blender: Scripting tab -> Open this file -> Run Script.
import bpy, os

SVG = ${p}
if not os.path.exists(SVG):
    SVG = os.path.join(os.path.dirname(bpy.data.filepath or __file__), os.path.basename(SVG))

def mat_color(mat):
    if mat is None:
        return (1.0, 1.0, 1.0, 1.0)
    if mat.use_nodes and mat.node_tree:
        for n in mat.node_tree.nodes:
            if n.type == 'BSDF_PRINCIPLED':
                return tuple(n.inputs['Base Color'].default_value)
    return tuple(mat.diffuse_color)

before = set(bpy.data.objects)
bpy.ops.import_curve.svg(filepath=SVG)
objs = [o for o in bpy.data.objects if o not in before and o.type == 'CURVE']
dg = bpy.context.evaluated_depsgraph_get()

verts, faces, cols = [], [], []
for o in objs:
    col = mat_color(o.active_material)
    me = bpy.data.meshes.new_from_object(o.evaluated_get(dg))
    me.transform(o.matrix_world)
    base = len(verts)
    verts += [tuple(v.co) for v in me.vertices]
    for poly in me.polygons:
        faces.append([base + i for i in poly.vertices])
        cols.append(col)
    bpy.data.meshes.remove(me)

name = os.path.splitext(os.path.basename(SVG))[0]
mesh = bpy.data.meshes.new(name)
mesh.from_pydata(verts, [], faces)
mesh.update()
attr = mesh.color_attributes.new("Col", 'FLOAT_COLOR', 'CORNER')
flat = []
for poly, c in zip(mesh.polygons, cols):
    for _ in poly.loop_indices:
        flat += c
attr.data.foreach_set("color", flat)

mat = bpy.data.materials.new(name)
mat.use_nodes = True
nt = mat.node_tree
bsdf = next(n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED')
an = nt.nodes.new('ShaderNodeAttribute')
an.attribute_name = "Col"
nt.links.new(an.outputs['Color'], bsdf.inputs['Base Color'])
mesh.materials.append(mat)

old_mats = {s.material for o in objs for s in o.material_slots if s.material}
old_curves = [o.data for o in objs]
for o in objs:
    bpy.data.objects.remove(o)
for c in old_curves:
    bpy.data.curves.remove(c)
for m in old_mats:
    if m.users == 0:
        bpy.data.materials.remove(m)

obj = bpy.data.objects.new(name, mesh)
bpy.context.collection.objects.link(obj)
bpy.context.view_layer.objects.active = obj
obj.select_set(True)
print("Marly Helper: %d shapes -> 1 mesh, Color Attribute 'Col'" % len(objs))
`;
}

module.exports = { init };
