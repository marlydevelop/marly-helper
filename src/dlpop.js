/* v8.104: свой список подсказок вместо нативного datalist. Поле: <input data-dl="id datalist">. */
(function () {
  "use strict";
  var pop = null, inp = null, items = [], idx = -1, typed = false, quiet = false;
  function opts(id) {
    var d = document.getElementById(id), r = [];
    if (!d) return r;
    Array.prototype.forEach.call(d.options, function (o) { if (o.value) r.push(o.value); });
    return r;
  }
  function close() { if (pop) { pop.remove(); pop = null; } inp = null; items = []; idx = -1; }
  function place() {
    if (!pop || !inp) return;
    var r = inp.getBoundingClientRect(), W = window.innerWidth, H = window.innerHeight;
    var w = Math.max(r.width, 200), left = Math.min(Math.max(8, r.left), Math.max(8, W - w - 8));
    var below = H - r.bottom, above = r.top, up = below < 160 && above > below;
    pop.style.left = left + "px"; pop.style.width = w + "px";
    pop.style.maxHeight = Math.max(100, Math.min(260, (up ? above : below) - 12)) + "px";
    if (up) { pop.style.top = ""; pop.style.bottom = (H - r.top + 4) + "px"; }
    else { pop.style.bottom = ""; pop.style.top = (r.bottom + 4) + "px"; }
  }
  function mark() {
    if (!pop) return;
    Array.prototype.forEach.call(pop.children, function (c, k) { c.classList.toggle("on", k === idx); });
    var c = pop.children[idx]; if (c) c.scrollIntoView({ block: "nearest" });
  }
  function open(el, filter) {
    var all = opts(el.getAttribute("data-dl")), q = (el.value || "").toLowerCase();
    if (filter && q) {
      var a = [], b = [];
      all.forEach(function (x) { var l = x.toLowerCase(), p = l.indexOf(q); if (p === 0) a.push(x); else if (p > 0) b.push(x); });
      all = a.concat(b);
    }
    items = all.slice(0, 300);
    if (!items.length) { close(); return; }
    if (!pop) { pop = document.createElement("div"); pop.className = "dlp"; pop.setAttribute("role", "listbox"); document.body.appendChild(pop); }
    inp = el; idx = -1;
    pop.innerHTML = "";
    items.forEach(function (x, k) {
      var d = document.createElement("div"); d.className = "dlp-i"; d.setAttribute("role", "option"); d.setAttribute("data-k", k); d.textContent = x; d.title = x;
      if (x === el.value) { idx = k; d.classList.add("on"); }
      pop.appendChild(d);
    });
    place(); mark();
  }
  function pick(k) {
    var el = inp, v = items[k]; if (!el || v === undefined) return;
    el.value = v; close();
    quiet = true;
    try { el.dispatchEvent(new Event("input", { bubbles: true })); el.dispatchEvent(new Event("change", { bubbles: true })); } finally { quiet = false; }
  }
  function isDl(t) { return t && t.tagName === "INPUT" && t.hasAttribute("data-dl"); }
  document.addEventListener("focusin", function (e) { if (isDl(e.target)) { typed = false; open(e.target, false); } }, true);
  document.addEventListener("click", function (e) {
    if (isDl(e.target)) { if (!pop) { typed = false; open(e.target, false); } return; }
  }, true);
  document.addEventListener("input", function (e) { if (!quiet && isDl(e.target)) { typed = true; open(e.target, true); } }, true);
  document.addEventListener("mousedown", function (e) {
    var t = e.target;
    if (pop && pop.contains(t)) {
      e.preventDefault();
      var it = t.closest && t.closest(".dlp-i"); if (it) pick(+it.getAttribute("data-k"));
      return;
    }
    if (pop && t !== inp) close();
  }, true);
  document.addEventListener("keydown", function (e) {
    if (!pop || e.target !== inp) return;
    if (e.key === "ArrowDown") { e.preventDefault(); idx = Math.min(items.length - 1, idx + 1); mark(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); idx = Math.max(0, idx - 1); mark(); }
    else if (e.key === "Enter" && idx >= 0) { e.preventDefault(); e.stopPropagation(); pick(idx); }
    else if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); close(); }
    else if (e.key === "Tab") close();
  }, true);
  document.addEventListener("focusout", function (e) { if (isDl(e.target)) setTimeout(function () { if (document.activeElement !== inp) close(); }, 0); }, true);
  window.addEventListener("resize", close);
  window.addEventListener("scroll", function (e) { if (pop && !(e.target && pop.contains && pop.contains(e.target))) close(); }, true);
})();
