// Чистые функции для PNG -> SVG (без electron): аргументы vtracer CLI и постобработка SVG.
// Движок: https://github.com/visioncortex/vtracer (vtracer.exe, CLI 1.0).

const PRESET_ARGS = {
  sharp: ['-f', '4', '-p', '6', '-g', '24'],
  balanced: ['-f', '3', '-p', '7', '-g', '16'],
  detailed: ['-f', '2', '-p', '8', '-g', '8'],
  bw: ['--clustering', 'bw', '-f', '4']
};

// scale — во сколько раз вход увеличен перед трассировкой (допуск упрощения задан в px исходника)
function buildArgs(input, output, o) {
  const pre = PRESET_ARGS[o.preset] ? o.preset : 'balanced';
  const a = [input, output].concat(PRESET_ARGS[pre], ['--mode', 'spline', '--path-precision', '2']);
  if (o.blender) a.push('--hierarchical', 'cutout', '--optimize', '0');
  if (o.simplify !== false) {
    const t = Math.min(5, Math.max(0.1, (Number(o.tol) || 0.35) * (o.scale || 1)));
    a.push('--simplify', String(Math.round(t * 100) / 100));
  }
  return a;
}

const fmt = (v) => v.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');

function bakeTransforms(svg) {
  return svg.replace(/<path[^>]*>/g, (tag) => {
    const t = tag.match(/\s*transform="translate\(\s*([-\d.]+)[ ,]+([-\d.]+)\s*\)"/);
    const d = tag.match(/ d="([^"]+)"/);
    if (!t || !d || /[a-df-ln-yA-DF-KN-Y]/.test(d[1].replace(/[MCLZ]/g, ''))) return tag; // относительные команды не трогаем
    const dx = parseFloat(t[1]), dy = parseFloat(t[2]);
    const nd = d[1].replace(/([MCL])([^MCLZ]*)/g, (m, c, rest) => {
      const nums = rest.trim().split(/[\s,]+/).filter(Boolean).map(Number);
      return c + nums.map((v, i) => fmt(v + (i % 2 ? dy : dx))).join(' ') + ' ';
    });
    return tag.replace(t[0], '').replace(d[0], ' d="' + nd.trim() + '"');
  });
}

// ow/oh — исходные размеры; fb* — размеры отправленной в vtracer картинки (запасной вариант)
function fixSvg(svg, ow, oh, fbw, fbh, blender) {
  const m = svg.match(/<svg[^>]*>/);
  if (!m) throw new Error('vtracer вернул некорректный SVG');
  const tag = m[0];
  const vb = tag.match(/viewBox="\s*[-\d.]+[ ,]+[-\d.]+[ ,]+([\d.]+)[ ,]+([\d.]+)\s*"/);
  const w = tag.match(/\swidth="([\d.]+)/), h = tag.match(/\sheight="([\d.]+)/);
  const tw = vb ? vb[1] : (w ? w[1] : String(fbw)), th = vb ? vb[2] : (h ? h[1] : String(fbh));
  let out = svg.replace(tag, '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="' + ow + '" height="' + oh + '" viewBox="0 0 ' + tw + ' ' + th + '">');
  out = out.replace(/<path\s+d=""[^>]*\/>\s*/g, '').split(' transform="translate(0,0)"').join('');
  if (blender) out = bakeTransforms(out);
  return out;
}

module.exports = { buildArgs, fixSvg, bakeTransforms, PRESET_ARGS };
