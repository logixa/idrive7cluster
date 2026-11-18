'use strict';
/**
 * pages.js - Cluster Tiles' page: what goes in the centre of the factory cluster (the map area, 1088x480,
 * between the stock dials), as pieces the cluster draws (engine.js, shaders.js). Every page is built once, as
 * a group; switching pages only shows one group and hides the last. Pieces without a group (the background,
 * the shift light with the gear and the cool-down countdown) show on every page.
 *
 * The look: a dark background with a soft glow of the accent colour and a fine dot grid, glass cards, an icon
 * by every reading, a trend line of its last two minutes, glowing bars and arcs with a mark where a reading
 * turns too hot and a round-light shift light. Everything sits in the middle (BOX):
 * the stock dials' edges and their own figures overlap the map area's sides.
 * o: { look ('native' | 'modern'), pages, style, accent, size ('normal' | 'large'), units, warn, slots }.
 */
const { view, READINGS } = require('./readings');

const W = 1088, H = 480;
const BOX = { x: 176, y: 30, w: 736, h: 420 };
const BODY = { x: BOX.x, y: 104, w: BOX.w, h: BOX.y + BOX.h - 104 };
const isNum = (v) => typeof v === 'number' && isFinite(v);

const ACCENTS = { blue: '#3fa6ff', white: '#dfe8f2', orange: '#ff8a2a', red: '#ff3b30', green: '#2fd27a' };
/*
 * Two looks. 'native' blends into the stock iDrive 7 cluster: readings float on a dark blue-black that fades
 * into the cluster at its sides, no boxes but hairline dividers, thin numerals, thin bars and arcs, outlined
 * icons, little glow, cool white and blue with orange for warnings. 'modern': glass cards, bold numerals,
 * glowing bars and arcs, filled icons.
 */
const STYLES = {
    native: { card: false, sep: true, glow: 0.25, barT: 0.3, arcK: 0.5, soft: 1, iconLine: 1.6, ledK: 0.75, ledShape: 1, bg: [0.35, 0, 0.15, 22], feather: 0, title: 'dim' },
    modern: { card: true, sep: false, glow: 1, barT: 0.42, arcK: 1, soft: 0, iconLine: 0, ledK: 1, ledShape: 0, bg: [1, 1, 1, 22], feather: 0, title: 'accent' },
};
let ST = STYLES.native;          // the look being built (pieces() sets it)
function palette(accent, look) {
    const a = ACCENTS[accent] || ACCENTS.blue;
    if (look !== 'modern') {
        return {
            bgTop: '#070b11', bgBottom: '#020306', cardTop: '#0d131a', cardBottom: '#070a0e', edge: '#1c2631',
            text: '#ffffff', dim: '#bac4ce', faint: '#2a3542', accent: a, accentDim: '#2a3a4c', warn: '#ff8a1e', cold: '#5aa8f0',
            track: '#1c2531', ev: '#4aa8f5', regen: '#3ccf8e', green: '#3ccf8e', yellow: '#ffb020', body: '#121a23', wheel: '#090d12', hair: '#1f2a36',
        };
    }
    return {
        bgTop: '#0a0e14', bgBottom: '#020305', cardTop: mix('#121922', a, 0.05), cardBottom: '#070a0e', edge: mix('#1e2833', a, 0.25),
        text: '#ffffff', dim: '#b6bec6', faint: '#3a4654', accent: a, accentDim: mix('#000000', a, 0.35), warn: '#ff3b30', cold: '#4aa3ff',
        track: '#1a222c', ev: '#3fb6ff', regen: '#2fd27a', green: '#2fd27a', yellow: '#ffc533', body: '#18212b', wheel: '#0b0f14', hair: '#1e2833',
    };
}
const levelColour = (t, level) => (level === 'warn' ? t.warn : level === 'cold' ? t.cold : level === 'none' ? t.dim : t.text);
const levelAccent = (t, level) => (level === 'warn' ? t.warn : level === 'cold' ? t.cold : t.accent);

/* ---------- piece makers ---------- */
const text = (key, group, x, y, w, h, txt, colors, extra) => Object.assign({ key, group, kind: 'text', x, y, w, h, text: txt, colors, align: 0.5 }, extra || {});
const card = (key, group, x, y, w, h, r) => (ST.card ? { key, group, kind: 'panel', x, y, w, h, params: { u_box: [r || 18, 1.5, 1, 0.94] }, colors: (t) => ({ top: t.cardTop, bottom: t.cardBottom, border: t.edge }) } : null);
const hair = (key, group, x, y, w, h) => ({ key, group, kind: 'flat', x: Math.round(x), y: Math.round(y), w: Math.max(1, Math.round(w)), h: Math.max(1, Math.round(h)), colors: (t) => ({ color: [t.hair, 1] }) });
const icon = (key, group, x, y, size, id, colour) => ({ key, group, kind: 'icon', x, y, w: size, h: size, params: { u_icon: [typeof id === 'function' ? 0 : id], u_line: [ST.iconLine * (size >= 40 ? 2 : 1)] },
    dyn: typeof id === 'function' ? (d) => ({ u_icon: [id(d)] }) : undefined, colors: (t, d) => ({ color: [typeof colour === 'function' ? colour(t, d) : t[colour], 1] }) });
const bar = (key, group, x, y, w, h, value, colors, opts) => ({
    key, group, kind: 'band', x, y, w, h, value, max: 1, sweep: true,
    params: { u_geo: [Math.max(6, h * 0.5), h / 2, 0, Math.max(3, h * ST.barT)], u_span: [opts && opts.fromRight ? -1 : 0, 0, (opts && opts.segments) || 0, 0.22], u_marks: [0, 0, 0, 0], u_soft: [ST.soft] },
    dyn: opts && opts.mark ? (d) => ({ u_red: [opts.mark(d)] }) : () => ({ u_red: [2] }),
    colors,
});
const arc = (key, group, x, y, w, h, cx, cy, R, T, a0, a1, value, colors, opts) => ({
    key, group, kind: 'band', x, y, w, h, value, max: 1, sweep: true,
    params: { u_geo: [cx, cy, R, Math.max(4, T * ST.arcK)], u_span: [a0, a1, ST.card ? (opts && opts.segments) || 0 : 0, 0.3], u_marks: [0, 0, 0, 0], u_soft: [ST.soft] },
    dyn: opts && opts.mark ? (d) => ({ u_red: [opts.mark(d)] }) : () => ({ u_red: [2] }),
    colors,
});
const spark = (key, group, x, y, w, h, sample, colour) => ({ key, group, kind: 'spark', x, y, w, h, sample, every: 2000,
    colors: (t, d) => { const c = typeof colour === 'function' ? colour(t, d) : t[colour]; return { line: ST.card ? c : mix('#000000', c, 0.8), fill: mix('#000000', c, ST.card ? 0.55 : 0.3) }; } });
const plain = (c) => (t) => ({ color: [typeof c === 'function' ? c(t) : t[c], 1], glow: [t.accent, 0] });
const glowing = (c, g) => (t) => ({ color: [t[c], 1], glow: [t[c] === t.text ? t.accent : t[c], g * ST.glow] });
const barColours = (fill) => (t, d) => { const f = typeof fill === 'function' ? fill(t, d) : t[fill]; return { track: t.track, fill0: mix('#000000', f, 0.72), fill1: f, redc: t.warn, tip: mix(f, '#ffffff', 0.35), tick: t.dim, num: t.text }; };
const label = (key, group, x, y, w, txt, extra) => { const e = Object.assign({ align: 0, tracking: 0.18 }, extra || {}), h = e.h || 14; delete e.h; return text(key, group, x, y, w, h, txt, plain('dim'), e); };

/**
 * A tile showing one reading: its glass card, icon and name, the unit, the value, then (style 'bar') the last
 * two minutes as a trend line and a glowing bar with the warning mark; (style 'number') a larger trend line;
 * (style 'arc') an arc gauge round the value.
 */
function tile(group, key, x, y, w, h, reading, style, o, sub) {
    const id = group + '.' + key, k = o.size === 'large' ? 1.2 : 1, r = READINGS[reading] || {};
    const v = (d) => view(reading, d, o.units, o.warn);
    const accentOf = (t, d) => levelAccent(t, v(d).level);
    // sized to be read at a glance while driving: the page is shrunk to fit between the stock readouts (0.76)
    const out = [card(id + '.card', group, x, y, w, h),
        icon(id + '.icon', group, x + 12, y + 11, 26, reading === 'consumption' ? (d) => v(d).icon : r.icon || 0, accentOf),
        label(id + '.lbl', group, x + 46, y + 14, w * 0.62, reading === 'consumption' ? (d) => v(d).short : r.short || reading, { h: 20, tracking: 0.1 })];
    if (style === 'arc') {
        // the arc's ends dip below its centre (by R cos 62°): R and the centre keep all of it in the card
        const ah = h - 34, R = Math.min(w / 2 - 26, (ah - 26) / 1.47), cy = 14 + R, T = Math.max(10, R * 0.15);
        out.push(arc(id + '.arc', group, x, y + 34, w, h - 34, w / 2, cy, R, T, -118, 118, (d) => v(d).frac, barColours(accentOf), { segments: 0, mark: (d) => v(d).warnAt }));
        // a tile with a line under its value (the consumption's regeneration) lifts the value to make room for it
        const valH = Math.round(Math.min(R * 0.58, 60) * k), vy = y + 34 + cy - valH * 0.62 - (sub ? 10 : 0);
        out.push(text(id + '.val', group, x, vy, w, valH, (d) => v(d).text, (t, d) => ({ color: [levelColour(t, v(d).level), 1], glow: [accentOf(t, d), 0.35 * ST.glow] })));
        out.push(text(id + '.unit', group, x, vy + valH + (sub ? 4 : 6), w, 14, (d) => v(d).unit, plain('dim'), { tracking: 0.16 }));
        if (sub) out.push(text(id + '.sub', group, x, vy + valH + 24, w, 14, sub, plain('dim'), { tracking: 0.08 }));
        return out;
    }
    out.push(text(id + '.unit', group, x + w * 0.62, y + 14, w * 0.38 - 14, 20, (d) => v(d).unit, plain('dim'), { align: 1, tracking: 0.08 }));
    const big = style === 'number';
    const valH = Math.round(Math.min(h * (big ? 0.5 : 0.44), big ? 120 : 96) * k);
    const vy = y + 44;
    out.push(text(id + '.val', group, x + 14, vy, w - 28, valH, (d) => v(d).text, (t, d) => ({ color: [levelColour(t, v(d).level), 1], glow: [accentOf(t, d), 0.3 * ST.glow] }), { align: 0 }));
    if (sub) out.push(text(id + '.sub', group, x + 14, vy + valH + 6, w - 28, 18, sub, plain('dim'), { align: 0, tracking: 0.08 }));
    const sy = vy + valH + (sub ? 30 : 8), sh = y + h - (big ? 10 : 26) - sy;
    if (sh >= 18) out.push(spark(id + '.spark', group, x + 10, sy, w - 20, sh, (d) => (v(d).value === null ? null : v(d).frac), accentOf));
    if (!big) out.push(bar(id + '.bar', group, x + 10, y + h - 22, w - 20, 14, (d) => v(d).frac, barColours(accentOf), { mark: (d) => v(d).warnAt }));
    return out;
}

/** Rectangles for n slots in the body (1, 2, 3, 4 or 6). */
function grid(n, area) {
    const a = area || BODY, gap = 12;
    const cols = n <= 3 ? n : n === 4 ? 2 : 3, rows = n <= 3 ? 1 : 2;
    const w = (a.w - gap * (cols - 1)) / cols, h = (a.h - gap * (rows - 1)) / rows;
    const out = [];
    for (let i = 0; i < n; i++) out.push({ x: Math.round(a.x + (i % cols) * (w + gap)), y: Math.round(a.y + Math.floor(i / cols) * (h + gap)), w: Math.round(w), h: Math.round(h) });
    return out;
}
function slotted(group, keys, style, o, subs) {
    const rects = grid(keys.length), out = [].concat(...rects.map((r, i) => tile(group, 's' + i, r.x, r.y, r.w, r.h, keys[i], style, o, subs && subs[i])));
    if (ST.sep) {
        // hairlines between the tiles instead of boxes round them
        rects.forEach((r, i) => {
            if (r.x > BODY.x + 1) out.push(hair(group + '.sv' + i, group, r.x - 6, r.y + 10, 1, r.h - 20));
            if (r.y > BODY.y + 1) out.push(hair(group + '.sh' + i, group, r.x + 10, r.y - 6, r.w - 20, 1));
        });
    }
    return out;
}

/* ---------- the page ---------- */
/* What the engine unit has to be asked for (data.js want(): the keys it reads fast) for a reading on a tile. */
const NEEDS = {
    iat: ['iat'], iatRise: ['iat'], gearbox: ['gearbox'], hpfp: ['hpfp'], lpfp: ['lpfp'], boostActual: ['boostActual'], boostTarget: ['boostTarget'],
    timing: ['timing'], consumption: ['fuelRate'], fuelCons: ['fuelRate'], fuelRate: ['fuelRate'], maf: ['maf'],
    loadActual: ['loadActual'], loadTarget: ['loadTarget'], throttle: ['throttle'],
};
const needsOf = (slots) => Array.from(new Set([].concat(...slots.map((k) => NEEDS[k] || (/^[sd]:/.test(k) ? [k] : [])))));

/* Under the value of the consumption tile: while electric, how much is being recuperated (the battery power
 * below zero, else the car's own power meter); while the engine runs, the fuel flow. */
const consSub = (d) => {
    if (d.consumptionKind === 'electric') {
        if (isNum(d.regen)) return d.regen > 0.3 ? 'REGEN ' + d.regen.toFixed(1) + ' KW' : 'NO REGEN';
        if (isNum(d.regenPct)) return d.regenPct > 0 ? 'REGEN ' + Math.round(d.regenPct) + ' %' : 'NO REGEN';
        return '';
    }
    return isNum(d.fuelRate) ? d.fuelRate.toFixed(1) + ' L/H' : '';
};

const PAGES = {
    tiles: {
        title: 'LIVE DATA', needs: [],
        // the six tiles, as the settings pick them (a tile set to 'Nothing' leaves a gap-free grid of the rest)
        build: (o, g) => {
            const slots = (o.slots && o.slots.length ? o.slots : ['oil', 'coolant', 'gearbox', 'consumption', 'iat', 'outside']);
            return slotted(g, slots, o.style, o, slots.map((k) => (k === 'consumption' ? consSub : null)));
        },
        needsOf: (o) => needsOf((o.slots && o.slots.length) ? o.slots : []),
    },
};

/** '#rrggbb' a..b by f. */
function mix(a, b, f) {
    const p = (s, i) => parseInt(s.slice(1 + i * 2, 3 + i * 2), 16);
    return '#' + [0, 1, 2].map((i) => { const v = Math.round(p(a, i) + (p(b, i) - p(a, i)) * Math.max(0, Math.min(1, f))); return (v < 16 ? '0' : '') + v.toString(16); }).join('');
}

/** Every piece: the background, and the page (its group the page's id) with its title. */
function pieces(o) {
    ST = STYLES[o.look] || STYLES.native;
    const list = [{ key: 'bg', kind: 'bg', x: 0, y: 0, w: W, h: H, params: { u_look: ST.bg, u_feather: [ST.feather] }, colors: (t) => ({ top: t.bgTop, bottom: t.bgBottom, accent: t.accent }) }];
    o.pages.forEach((id) => {
        const pg = PAGES[id];
        if (!pg) return;
        const tw = pg.title.length * 12 + 24;
        list.push(text(id + '.title', id, BOX.x, 70, BOX.w, 22, pg.title, ST.title === 'accent' ? glowing('accent', 0.5) : plain('dim'), { tracking: 0.3 }));
        list.push({ key: id + '.tl', group: id, kind: 'flat', x: Math.round(W / 2 - tw - 120), y: 82, w: 120, h: 1, colors: (t) => ({ color: [t.accentDim, 1] }) });
        list.push({ key: id + '.tr', group: id, kind: 'flat', x: Math.round(W / 2 + tw), y: 82, w: 120, h: 1, colors: (t) => ({ color: [t.accentDim, 1] }) });
        list.push(...pg.build(o, id));
    });
    const fit = FITS[o.fit] || FITS.clear;
    // the free/open-source credit is shown on the app's own screen (main.js), not drawn on the cluster glass
    return list.filter(Boolean).map((p) => (p.key === 'bg' || fit.k === 1 ? p : scaled(p, fit))).map(legible);
}

/*
 * The smallest text on the glass, in the cluster's pixels: the factory cluster's own small print (its 'mi/kWh',
 * 'Power %') stands about 20 px. Smaller text is grown to it about its centre line, its box widened from the
 * side it is aligned to, so it isn't clipped.
 */
const MIN_TEXT = 20;
function legible(p) {
    if (p.kind !== 'text' || p.h >= MIN_TEXT) return p;
    // the factory's small print isn't spaced out: tracking down to 0.04, then the box only as wide as the
    // text needs (a fixed text's width estimated, ~0.55 of the height a letter)
    const tr = Math.min(p.tracking || 0, 0.04), a = p.align === undefined ? 0.5 : p.align;
    // (a changing text keeps its box: they are laid out wide enough)
    const need = typeof p.text === 'string' ? p.text.length * MIN_TEXT * (0.55 + tr) : p.w;
    const w = Math.min(W, Math.max(p.w, need)), x = Math.max(0, Math.min(W - w, p.x - (w - p.w) * a));
    return Object.assign({}, p, { tracking: tr, y: Math.round((p.y - (MIN_TEXT - p.h) / 2) * 100) / 100, h: MIN_TEXT,
        x: Math.round(x * 100) / 100, w: Math.round(w * 100) / 100 });
}

/*
 * Where the pages sit. The stock cluster draws its own readouts over the edges of the centre (the digital
 * speed and its line on the left, the efficiency gauge and the range on the right, its flanks at both
 * sides), so by default the pages are made smaller and sit between them: x about 290 to 850 of the 1088.
 * 'full' uses the whole middle (BOX) as designed.
 */
const FITS = { clear: { k: 0.76, cx: 570, cy: 236 }, full: { k: 1, cx: W / 2, cy: H / 2 } };
/* a piece's params that are pixels (by kind and index), scaled with it */
const PX = { panel: { u_box: [0, 1] }, band: { u_geo: [0, 1, 2, 3], u_marks: [2, 3] }, icon: { u_line: [0] }, dial: { u_arc: [2, 3], u_needle_dim: [0, 1, 2, 3], u_look: [3], u_look2: [0, 1] } };
function scaled(p, f) {
    const q = Object.assign({}, p);
    const x = f.cx + (p.x - W / 2) * f.k, y = f.cy + (p.y - H / 2) * f.k;
    q.x = Math.round(x * 100) / 100; q.y = Math.round(y * 100) / 100; q.w = Math.round(p.w * f.k * 100) / 100; q.h = Math.round(p.h * f.k * 100) / 100;
    const px = PX[p.kind];
    if (px && p.params) {
        q.params = Object.assign({}, p.params);
        Object.keys(px).forEach((u) => {
            if (!q.params[u]) return;
            q.params[u] = q.params[u].slice();
            px[u].forEach((i) => { if (typeof q.params[u][i] === 'number') q.params[u][i] = Math.round(q.params[u][i] * f.k * 1000) / 1000; });
        });
    }
    return q;
}
/** The gear for the top: P R N, or D / S / M and the gear. */
function gearOf(d) {
    if (d.stage === 'P' || d.stage === 'R' || d.stage === 'N') return d.stage;
    if (d.gear === -1) return 'R';
    const g = isNum(d.gear) && d.gear > 0 ? String(d.gear) : '';
    return (d.mode === 'S' || d.mode === 'M' ? d.mode : 'D') + g;
}

module.exports = { PAGES, pieces, palette, ACCENTS, STYLES, FITS, grid, W, H, BOX, BODY, gearOf, mix, needsOf, NEEDS };
