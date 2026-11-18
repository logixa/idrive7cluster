'use strict';
/**
 * extras.js - every reading a tile can show beyond readings.js's curated ones: the car's SOME/IP signals (keys
 * "s:<id>", sig_catalog.js) and the engine unit's identifiers (keys "d:<did>"), listed in extras_data.js by
 * tools/gen_extras.js.
 *
 *   READINGS            the reading entries to add to readings.js's (title, short name, kind, range, unit, decimals)
 *   fieldsOf(keys)      { interface: [field] } the car signals these keys need
 *   sigStore()          .feed(iface, field, struct) keeps what the car sent; .value(key, ctx) the reading now:
 *                       { v: number | text, u: unit | undefined } or null
 *   dmeRead(rd, key)    one engine unit reading through a DidReader (kit/dids.js): number or null
 *   isSig(k), isDme(k)
 */
const SIG = require('./sig_catalog');
const LIST = require('./extras_data');

const BY = {};
LIST.forEach((r) => { BY[r.key] = r; });
const READINGS = {};
LIST.forEach((r) => {
    READINGS[r.key] = { title: r.group + ': ' + r.title, short: r.short, icon: r.icon, kind: r.kind, min: r.min, max: r.max, group: r.group, unit: r.unit, dec: r.dec };
});
const isSig = (k) => typeof k === 'string' && k.slice(0, 2) === 's:';
const isDme = (k) => typeof k === 'string' && k.slice(0, 2) === 'd:';
const itemOf = (key) => SIG.ITEMS[key.slice(2)];
// the values a worked-out signal value takes from others
const DEPENDS = { power: ['torque', 'rpm'] };

/** { interface: [field] } the signals the sig keys in keys need (the sources of the item and of what it works out from) */
function fieldsOf(keys) {
    const out = {};
    const add = (it) => {
        if (!it) return;
        SIG.sourcesOf(it).forEach((s) => { const l = out[s.i] || (out[s.i] = []); if (l.indexOf(s.f) < 0) l.push(s.f); });
        (DEPENDS[it.id] || []).forEach((id) => add(SIG.ITEMS[id]));
    };
    keys.filter(isSig).forEach((k) => add(itemOf(k)));
    return out;
}

function sigStore() {
    const last = {};
    const get = (it, ctx, depth) => {
        if (it.calc) return it.calc((id) => { const x = (depth || 0) < 3 && SIG.ITEMS[id] ? get(SIG.ITEMS[id], ctx, (depth || 0) + 1) : null; return x && typeof x.n === 'number' && !x.raw ? x : null; });
        let best = null;
        SIG.sourcesOf(it).forEach((s) => { const x = last[s.i + ' ' + s.f]; if (x && (!best || x.t > best.x.t)) best = { s, x }; });
        if (!best) return null;
        SIG.units.press = ctx && ctx.press || SIG.units.press;
        return SIG.value(it, best.s, best.x.v);
    };
    return {
        feed(i, f, v) { if (v && typeof v === 'object') last[i + ' ' + f] = { v, t: Date.now() }; },
        value(key, ctx) {
            const it = itemOf(key);
            if (!it) return null;
            const x = get(it, ctx);
            if (!x || x.bad) return null;
            if (x.text !== undefined) return { v: String(x.text) };
            return typeof x.n === 'number' && isFinite(x.n) ? { v: x.n, u: x.raw ? undefined : x.u } : null;
        },
    };
}

/** An engine unit reading: the first candidate that answers, in the reading's unit. */
async function dmeRead(rd, key) {
    const r = BY[key];
    if (!r) return null;
    const one = async (name, cands) => {
        const v = await rd.value(name, cands);
        if (v === null) return null;
        const c = cands[rd.pick[name] || 0];
        if (r.bad) {
            const raw = (v - c.offset) / c.factor;
            if (r.bad.some((b) => Math.abs(raw - b) < 1e-6 * Math.max(1, Math.abs(b)))) return null;      // "no data" (FFFF with the engine off)
        }
        return v * (c.k || 1);
    };
    let v;
    if (r.minus) {
        const a = await one(key + '/a', [r.minus[0]]);
        const b = a === null ? null : await one(key + '/b', [r.minus[1]]);
        v = a === null || b === null ? null : a - b;
    } else v = await one(key, r.cands);
    if (v !== null && r.lin) v = r.lin[0] + r.lin[1] * v;
    return v;
}

module.exports = { READINGS, LIST, BY, fieldsOf, sigStore, dmeRead, isSig, isDme };
