'use strict';
/**
 * gen_extras.js - builds the list of every reading a tile can show beyond the curated ones (readings.js):
 *
 *   - the car's SOME/IP signals (shared/sig_catalog.js: Live Data's list with its scalings)  -> keys "s:<id>"
 *   - the engine unit's identifiers (tools/vendor: Live Data's "useful" list, the DME8FF_R catalog and the
 *     standard OBD-II PIDs)                                                                    -> keys "d:<did>"
 *
 * It writes shared/extras_data.js (what the app needs at run time, nothing to decode there), the tile settings'
 * option lists and the signals the manifest declares (apps/cluster_tiles/app.json), then run
 * node tools/sync_shared.js.
 *   node tools/gen_extras.js
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const SIG = require('../shared/sig_catalog');
const USEFUL = require('./vendor/useful');
const STD = require('./vendor/std');
const DME = JSON.parse(fs.readFileSync(path.join(__dirname, 'vendor', 'DME8FF_R.json'), 'utf8'));
const SIZE = { u8: 1, s8: 1, u16: 2, s16: 2, u32: 4, s32: 4 };

// signal values the curated readings already show
const SKIP_SIG = new Set(['instant', 'fuelRaw', 'rpm', 'torque', 'speed', 'gLat', 'gLong', 'steer', 'yaw', 'outside', 'pFL', 'pFR', 'pRL', 'pRR', 'tFL', 'tFR', 'tRL', 'tRR']);

// what kind (units, decimals) and range a unit gets; anything else is shown as it comes, in its own unit
const KINDS = {
    '°C': ['temp', 0, 150], bar: ['press', 0, 10], '%': ['pct', 0, 100], 'km/h': ['speed', 0, 250], rpm: ['rpm', 0, 7000],
    Nm: ['nm', -100, 600], '°': ['deg', -20, 60], km: ['km', 0, 1000], l: ['litre', 0, 70], 'l/h': ['lph', 0, 30], kW: ['kw', -50, 150],
};
const kindOf = (u) => KINDS[u] || ['raw', 0, 1];
const ICON = (group, u) => (u === '°C' ? (/oil/i.test(group) ? 1 : 0) : /oil/i.test(group) ? 1 : /fuel/i.test(group) ? 4 : /boost|air/i.test(group) ? 3 : /12 v|battery/i.test(group) ? 6 : /engine|ignition|knock/i.test(group) ? 11 : /tyre/i.test(group) ? 8 : /driving|chassis/i.test(group) ? 8 : 13);
// the short name on the cluster (about 14 characters fit): common words abbreviated, brackets and filler out; names
// that come out the same keep what tells them apart (the corner, the cylinder, the trip, target or actual)
const ABBR = { cylinder: 'CYL', pressure: 'PRESS', temperature: 'TEMP', target: 'TGT', average: 'AVG', absolute: 'ABS', camshaft: 'CAM', exhaust: 'EXH',
    intake: 'INT', ignition: 'IGN', injector: 'INJ', correction: 'CORR', adaptation: 'ADAPT', particulate: 'DPF', consumption: 'CONS', distance: 'DIST',
    remaining: 'LEFT', 'front left': 'FL', 'front right': 'FR', 'rear left': 'RL', 'rear right': 'RR', refuelling: 'REFUEL', refuellings: 'REFUEL',
    deviation: 'DEV', radiator: 'RAD', control: 'CTRL', 'engine hours': 'HOURS', mileage: 'KM', quality: 'QUAL', battery: 'BATT', 'high pressure': 'HP', 'low pressure': 'LP' };
const shortOf = (name) => {
    let t = name.replace(/\([^)]*\)/g, ' ').replace(/[,:]/g, ' ').replace(/\b(the|of|by|engine unit|this|above)\b/gi, ' ').toLowerCase();
    Object.keys(ABBR).sort((a, b) => b.length - a.length).forEach((k) => { t = t.replace(new RegExp('\\b' + k + '\\b', 'g'), ABBR[k]); });
    const w = t.toUpperCase().split(/\s+/).filter(Boolean);
    let s = w.join(' ');
    while (s.length > 14 && w.length > 1) { w.shift(); s = w.join(' '); }    // the last words say most ("... CYL 3")
    return s.slice(0, 14) || name.toUpperCase().slice(0, 14);
};
const UNITS = { temp: '°C', press: 'bar', pct: '%', speed: 'km/h', rpm: 'rpm', nm: 'Nm', deg: '°', km: 'km', litre: 'l', lph: 'l/h', kw: 'kW' };

const out = [];                      // every extra reading: { key, src, group, title, short, kind, unit, dec, min, max, icon, ... }
const used = new Set();

/* ---------- SOME/IP signals ---------- */
SIG.GROUPS.forEach((g) => g.items.forEach((it) => {
    if (SKIP_SIG.has(it.id) || it.tc || it.flow) return;
    const key = 's:' + it.id;
    const [kind, min, max] = kindOf(typeof it.u === 'string' ? it.u : '');
    out.push({ key, src: 'sig', group: g.group, title: it.name, short: shortOf(it.name), kind: it.raw || typeof it.u !== 'string' || it.calc ? 'raw' : kind,
        unit: typeof it.u === 'string' && !it.raw ? it.u : '', dec: it.d == null ? (it.raw ? 0 : 1) : it.d, min, max, icon: ICON(g.group, it.u), q: !!it.q, raw: !!it.raw });
    used.add(key);
}));

/* ---------- the engine unit ---------- */
function fieldOf(c) {
    const m = /^(OBD [0-9A-F]{2})(?:\/(\d+))?$/.exec(c), d = /^([0-9A-F]{4})(?:\/(\d+))?$/.exec(c);
    const entry = m ? STD.OBD[m[1]] : d ? DME[d[1]] : null;
    if (!entry) return null;
    const f = (entry.f || [])[Number((m || d)[2] || 0)];
    if (!f || f.m || f.e || !SIZE[f.t]) return null;                      // masks, tables and text are not tile numbers
    const base = m ? { obd: m[1].slice(4) } : { did: d[1] };
    return Object.assign(base, { bytes: SIZE[f.t], at: f.at, factor: f.k == null ? 1 : f.k, offset: f.o || 0, signed: f.t[0] === 's', from: f.u || '',
        name: f.d || entry.d || entry.a || '' });
}
const candidate = (c, to) => {
    const f = fieldOf(c);
    if (!f) return null;
    if (f.from === '°C' || to === '°C') { f.min = -45; f.max = 1500; }     // an unset sensor reads -48 or -273
    return f;
};
const CONV = USEFUL.CONVERT;
const DMEGROUPS = (USEFUL[0x12] || []);
const slug = (c) => String(c).replace(/^OBD /, 'o').replace('/', '_').replace(/[^0-9A-Za-z_]/g, '');
DMEGROUPS.forEach((g) => g.items.forEach((it) => {
    if (it.only === 'twin' || it.map) return;
    if (it.only === 'single' && /cylinder [56]$/.test(it.name)) return;   // a four cylinder engine
    let cands, minus;
    if (it.minus) {
        minus = it.minus.map((c) => candidate(c, it.u));
        if (minus.some((x) => !x)) return;
    } else {
        cands = (it.c || []).map((c) => candidate(c, it.u)).filter(Boolean);
        if (!cands.length) return;
    }
    let key = 'd:' + slug(it.minus ? it.minus.join('-') : it.c[0]);
    for (let n = 2; used.has(key); n++) key = key.replace(/#\d+$/, '') + '#' + n;
    used.add(key);
    const u = it.u || '', [kind, min, max] = kindOf(u);
    const rec = { key, src: 'dme', group: g.group, title: it.name, short: shortOf(it.name), kind, unit: kind === 'raw' ? u : '', dec: it.d == null ? 1 : it.d, min, max, icon: ICON(g.group, u) };
    if (cands) rec.cands = cands; else rec.minus = minus;
    if (it.bad) rec.bad = it.bad;
    if (it.lin) rec.lin = it.lin;
    rec.to = u;
    if (rec.kind === 'raw' && u === 'hPa') { rec.min = 900; rec.max = 3000; }
    out.push(rec);
}));
// plain names for people (plain_names.js), then the groups
const PLAIN = require('./plain_names');
out.forEach((r) => {
    let t = PLAIN.T[r.key];
    if (!t) PLAIN.PATTERNS.forEach(([re, f]) => { const m = re.exec(r.title); if (m && !t) t = f(m[1]); });
    if (t) { r.title = t[0]; r.short = t[1]; }
    r.group = PLAIN.GROUPS[r.group] || r.group;
});
// names that still come out the same: the engine unit's get " DME", the others keep their bracket words, then a number
const fit = (base, tail) => { const w = base.split(' '); while (w.length > 1 && (w.join(' ') + tail).length > 14) w.shift(); return (w.join(' ') + tail).slice(0, 14); };
const clash = () => { const d = {}; out.forEach((r) => (d[r.short] = d[r.short] || []).push(r)); return Object.values(d).filter((v) => v.length > 1); };
clash().forEach((g) => g.forEach((r) => { if (r.src === 'dme') r.short = fit(r.short, ' 2'); }));
clash().forEach((g) => g.forEach((r) => { const b = /\(([^)]*)\)/.exec(r.title); if (b) r.short = fit(r.short, ' ' + b[1].toUpperCase().replace(/[^A-Z0-9 ]/g, '').split(' ')[0]); }));
clash().forEach((g) => g.forEach((r, i) => { if (i) r.short = fit(r.short, ' ' + (i + 1)); }));
// unit conversion factors the readings need: [from][to]
const convs = {};
out.filter((r) => r.src === 'dme').forEach((r) => (r.cands || r.minus).forEach((c) => {
    if (c.from && r.to && c.from !== r.to && CONV[c.from] && CONV[c.from][r.to]) c.k = CONV[c.from][r.to];
    delete c.from;
}));
out.forEach((r) => { delete r.to; });
void convs;

fs.writeFileSync(path.join(ROOT, 'shared', 'extras_data.js'),
    "'use strict';\n// made by tools/gen_extras.js from the car signal list (sig_catalog.js) and the engine unit's identifiers; do not edit\nmodule.exports = " +
    JSON.stringify(out) + ';\n');

/* ---------- the settings' option lists and the manifest ---------- */
const appFile = path.join(ROOT, 'apps', 'cluster_tiles', 'app.json');
const app = JSON.parse(fs.readFileSync(appFile, 'utf8'));
const label = (r) => r.group + ' > ' + r.title + (UNITS[r.kind] || r.unit ? ' [' + (r.kind === 'raw' ? r.unit : UNITS[r.kind]) + ']' : '') + (r.q ? ' (estimated scale)' : '');
const base = (app.settings.find((s) => s.key === 'tileReading') || app.settings.find((s) => s.key === 'tile1')).options.filter((o) => !/^(s|d):/.test(o[0]));
const extra = out.slice().sort((a, b) => (a.group === b.group ? 0 : a.group < b.group ? -1 : 1)).map((r) => [r.key, label(r)]);
// one drop-down for all six tiles: the HMI's string bundle holds 1024 strings, one per drop-down row (kit/tools/localize.py)
const TILE_NAMES = ['Tile 1 (top left)', 'Tile 2 (top middle)', 'Tile 3 (top right)', 'Tile 4 (bottom left)', 'Tile 5 (bottom middle)', 'Tile 6 (bottom right)'];
const at = app.settings.findIndex((s) => /^tile[1-6]$/.test(s.key) || s.key === 'tileSel' || s.key === 'tileReading');
const rest = app.settings.filter((s) => !(/^tile[1-6]$/.test(s.key) || s.key === 'tileSel' || s.key === 'tileReading'));
rest.splice(at, 0,
    { key: 'tileSel', label: 'Tile to set', type: 'choice', default: '1', options: TILE_NAMES.map((n, i) => [String(i + 1), n]) },
    { key: 'tileReading', label: 'Reading for that tile', type: 'choice', default: 'oil', options: base.concat(extra) });
app.settings = rest;

// signals: what the car signal values need, flags as the installed apps declare them (tools/known_signals.json)
const known = JSON.parse(fs.readFileSync(path.join(__dirname, 'known_signals.json'), 'utf8')).signals;
const need = SIG.fields();
Object.keys(need).forEach((i) => {
    app.signals[i] = app.signals[i] || {};
    need[i].forEach((f) => {
        const k = known[i] && known[i][f];
        if (!k) { console.log('not declared (no installed app has it): ' + i + ' ' + f); return; }
        const have = app.signals[i][f];
        app.signals[i][f] = have && have.length > k[0].length ? have : (have === 'rs' ? 'rs' : k.indexOf('rs') >= 0 ? 'rs' : k[0]);
    });
});
fs.writeFileSync(appFile, JSON.stringify(app, null, 2) + '\n');
console.log(out.filter((r) => r.src === 'sig').length + ' car signal readings, ' + out.filter((r) => r.src === 'dme').length + ' engine unit readings, ' +
    (base.length + extra.length) + ' options per tile');

// READINGS.md: everything a tile can show, for the README
const md = ['# Readings a tile can show', '', 'Made by `tools/gen_extras.js`. Each tile (Settings > Tile 1 ... Tile 6) takes any of these, listed by group as in the settings.', '',
    'The first 48 readings of each tile\'s list are the curated ones (README.md). The rest come from the car itself (what it sends the head unit on its own) or from the engine computer (asked with read-only requests while a tile shows them). Where both have the same value, the title says which. `(estimated scale)` marks a value whose scaling is a best guess; "raw number" and "code" readings are for people who know what they mean.', ''];
const groups = {};
out.forEach((r) => { (groups[r.group] = groups[r.group] || []).push(r); });
Object.keys(groups).sort().forEach((g) => { md.push('**' + g + '**', '', groups[g].map((r) => '- ' + r.title + (UNITS[r.kind] || r.unit ? ' [' + (r.kind === 'raw' ? r.unit : UNITS[r.kind]) + ']' : '') + '  (tile: ' + r.short + ')').join('\n'), ''); });
fs.writeFileSync(path.join(ROOT, 'READINGS.md'), md.join('\n'));
