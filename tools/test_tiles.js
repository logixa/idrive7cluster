'use strict';
/**
 * test_tiles.js - Cluster Tiles: every reading has a view; the consumption and regeneration readings worked out
 * from the car's signals; the page (inside the centre, texts that fit, colours that exist) with every reading on a
 * tile; the page on the cluster (layers, uniforms); and the whole app on stubbed signals with a recording render
 * client (settings change the tiles, off by default, a colour change sends colours only).
 *   node tools/test_tiles.js
 */
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const Module = require('module');
const { FakeClient, KIT } = require('./scene');

const APP = path.join(__dirname, '..', 'apps', 'cluster_tiles');
const RESERVED = ['u_mvp', 'u_mv', 'u_m', 'u_v', 'u_p', 'u_normal'];   // the renderer's matrix names (PROTOCOL.md)
let ok = 0;
const check = async (name, fn) => { await fn(); ok++; console.log('ok   ' + name); };
const { PAGES, pieces, palette, needsOf, W, H } = require(path.join(APP, 'pages'));
const { READINGS, view } = require(path.join(APP, 'readings'));
const { sample } = require('./preview_tiles');
const SPEC = JSON.parse(fs.readFileSync(path.join(APP, 'app.json'), 'utf8'));

const metric = { temp: 'c', press: 'bar', speed: 'kmh', torque: 'nm' }, us = { temp: 'f', press: 'psi', speed: 'mph', torque: 'lbft' };
const opts = (extra) => Object.assign({ pages: ['tiles'], style: 'bar', accent: 'blue', size: 'normal', units: metric, warn: {}, slots: ['oil', 'coolant', 'gearbox', 'consumption', 'iat', 'outside'] }, extra);
const texts = (ps, d, t) => ps.filter((p) => p.kind === 'text').map((p) => (typeof p.text === 'function' ? p.text(d, t) : p.text));

(async () => {
    /* ---------- the settings ---------- */
    await check('settings: six tiles, each offering Nothing and every reading; defaults are readings', () => {
        for (let i = 1; i <= 6; i++) {
            const s = SPEC.settings.find((x) => x.key === 'tile' + i);
            assert(s && s.type === 'choice', 'tile' + i);
            assert.deepStrictEqual(s.options.map((o) => o[0]).sort(), ['none'].concat(Object.keys(READINGS)).sort());
            assert.deepStrictEqual(s.options.slice(0, 49).map((o) => o[0]), ['none'].concat(Object.keys(READINGS).slice(0, 48)));
            assert(s.options.some((o) => o[0] === s.default), 'tile' + i + ' default');
        }
        // what the car owner asked for is on offer: the temperatures, the consumption with regeneration, intake air
        ['oil', 'coolant', 'gearbox', 'iat', 'consumption', 'fuelCons', 'elecCons', 'regen', 'regenPct'].forEach((k) => assert(READINGS[k], k));
    });

    /* ---------- the readings ---------- */
    await check('every reading has a view in each unit set', () => {
        const d = sample({ engine: 'on' });
        Object.keys(READINGS).forEach((k) => [us, metric].forEach((u) => {
            const v = view(k, d, u);
            assert(typeof v.text === 'string' && v.frac >= 0 && v.frac <= 1, k);
        }));
        assert.strictEqual(view('oil', { oil: 100 }, us).text, '212');
        assert.strictEqual(view('oil', { oil: 131 }, us, {}).level, 'warn');
        assert.strictEqual(view('oil', { oil: 121 }, us, { oilHigh: 120 }).level, 'warn');
        assert.strictEqual(view('lpfp', { lpfp: 3 }, metric, {}).level, 'warn');
    });
    await check('consumption tile follows the drive: fuel L/100 km with the engine, kWh/100 km (negative = recuperating) without', () => {
        const on = view('consumption', sample({ engine: 'on' }), metric), off = view('consumption', sample({ engine: 'off' }), metric);
        assert.strictEqual(on.text, '6.4'); assert.strictEqual(on.unit, 'L/100KM'); assert.strictEqual(on.short, 'FUEL');
        assert.strictEqual(off.text, '-9.8'); assert.strictEqual(off.unit, 'KWH/100KM'); assert.strictEqual(off.short, 'ELECTRIC');
        assert(off.frac > 0 && off.frac < 0.4, 'recuperation sits left of the middle of its bar: ' + off.frac);
        assert.strictEqual(view('consumption', { consumptionKind: 'fuel' }, metric).text, '--');
    });
    await check('what each tile has the engine unit read', () => {
        assert.deepStrictEqual(needsOf(['oil', 'coolant', 'soc']), []);
        assert.deepStrictEqual(needsOf(['gearbox', 'iat', 'iatRise']).sort(), ['gearbox', 'iat']);
        assert.deepStrictEqual(needsOf(['consumption']).sort(), ['fuelRate']);
    });

    /* ---------- the data: consumption and regeneration from the car's signals ---------- */
    await check('data: electric consumption, regeneration and fuel consumption from the car', async () => {
        process.env.CLUSTER_INFO_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'ci-'));
        const handlers = {};
        const ctx = { log: { info() {}, warn() {}, debug() {} }, spec: SPEC, settings: { get: () => undefined },
            signals: { watch: (iface, inst, h) => { Object.assign(handlers, h); return Promise.resolve({}); }, proxy: () => Promise.reject(new Error('no link (test)')) } };
        const { startData } = require(path.join(APP, 'data'));
        const D = startData(ctx, { shown: () => false, tyres: true });
        try {
            assert(handlers.currentConsumption && handlers.statusPowerRelativHybrid && handlers.statusTyrePressure, 'subscribed');
            const car = (kmh, rpm) => {
                handlers.statusCarSpeed2({ speedVehicleCentreOfGravity: Math.round(kmh / 0.015625) });
                handlers.statusEngineSpeed2({ actualValueRPMEngineCrankshaft: rpm / 0.25 });
            };
            // electric: engine off, 80 km/h, the car's consumption 17 and its power meter recuperating 40 %
            car(80, 0);
            handlers.currentConsumption({ consumptionElectricCurrentDigit: 17 });
            handlers.statusPowerRelativHybrid({ displayActualValuePowerRelativeDrivingElectric: 0, displayActualValuePowerRelativeRecuperation: 40 });
            await new Promise((r) => setTimeout(r, 50));
            let d = D.data();
            assert.strictEqual(d.consumptionKind, 'electric'); assert.strictEqual(d.engineOn, false);
            assert.strictEqual(d.elecCons, 17); assert.strictEqual(d.consumption, 17);
            assert.strictEqual(d.regenPct, 40); assert.strictEqual(d.drivePct, 0); assert.strictEqual(d.regen, undefined);
            // tenths from a car that sends them
            handlers.currentConsumption({ consumptionElectricCurrentDigit: 185 });
            await new Promise((r) => setTimeout(r, 100));
            assert(D.data().elecCons > 17 && D.data().elecCons < 18.5, 'smoothed towards 18.5, not read as 185: ' + D.data().elecCons);
            // the engine runs: fuel, from a field of the car's signal named for fuel and consumption
            car(80, 2000);
            handlers.currentConsumption({ consumptionFuelCurrentDigit: 72 });
            d = D.data();
            assert.strictEqual(d.consumptionKind, 'fuel'); assert.strictEqual(d.engineOn, true);
            assert(Math.abs(d.fuelCons - 7.2) < 1e-9, String(d.fuelCons)); assert.strictEqual(d.consumption, d.fuelCons);
            // no car field: the engine unit's fuel flow (6.58 L/h at 80 km/h = 8.2 L/100 km); air flow is not used
            const D2 = startData(ctx, { shown: () => false });
            const h2 = handlers;
            h2.statusCarSpeed2({ speedVehicleCentreOfGravity: Math.round(80 / 0.015625) });
            h2.statusEngineSpeed2({ actualValueRPMEngineCrankshaft: 2000 / 0.25 });
            D2.inject('maf', 20);
            let e = D2.data();
            assert.strictEqual(e.fuelRate, undefined);
            D2.inject('fuelRate', 6.58);
            e = D2.data();
            assert(Math.abs(e.fuelRate - 6.58) < 1e-9, String(e.fuelRate));
            assert(Math.abs(e.fuelCons - e.fuelRate / 80 * 100) < 1e-9 || Math.abs(e.fuelCons - 8.2) < 0.05, String(e.fuelCons));
            D2.inject('fuelRate', 5);
            e = D2.data();
            assert(Math.abs(e.fuelRate - 5) < 1e-9);
            // standing still: the flow shows, the per-100-km figure does not
            h2.statusCarSpeed2({ speedVehicleCentreOfGravity: 0 });
            e = D2.data();
            assert.strictEqual(e.fuelCons, undefined); assert(e.fuelRate > 0);
            // engine off: no fuel readings at all
            h2.statusEngineSpeed2({ actualValueRPMEngineCrankshaft: 0 });
            e = D2.data();
            assert.strictEqual(e.fuelRate, undefined); assert.strictEqual(e.consumptionKind, 'electric');
            D2.stop();
            // any other car signal of the list: watched once a tile asks for it, scaled as Live Data scales it
            const D3 = startData(ctx, { shown: () => false });
            D3.want(['s:handbrake', 's:oilLevel']);
            h2.statusHandBrake({ statusContactHandBrake: 'HANDBREMSE_ANGEZOGEN' });
            h2.statusOilDipstick2({ fluidLevelEngineOilRelative: 'MOTOROELSTAND_OK' });
            e = D3.data();
            assert.strictEqual(e['s:handbrake'], 'applied'); assert.strictEqual(e['s:oilLevel'], 'OK');
            const rv = require(path.join(APP, 'readings')).view('s:handbrake', e, { temp: 'c', press: 'bar', speed: 'kmh', torque: 'nm' });
            assert.strictEqual(rv.text, 'applied'); assert.strictEqual(rv.level, 'ok');
            D3.stop();
        } finally { D.stop(); }
    });

    /* ---------- the page ---------- */
    for (const style of ['bar', 'arc', 'number']) for (const look of ['native', 'modern']) for (const engine of ['on', 'off']) {
        await check('page (' + look + ', ' + style + ' tiles, engine ' + engine + '): every piece inside the centre, texts up to 32 glyphs, colours that exist', () => {
            const t = palette('orange', look), d = sample({ engine });
            [1, 2, 3, 4, 5, 6].forEach((n) => {
                const ps = pieces(opts({ style, look, slots: Object.keys(READINGS).slice(0, n).concat(['consumption']).slice(-n) }));
                assert(ps.length > 5);
                ps.forEach((p) => {
                    assert(p.x >= 0 && p.y >= 0 && p.x + p.w <= W && p.y + p.h <= H, p.key + ' ' + [p.x, p.y, p.w, p.h]);
                    if (p.kind === 'text') { const s = typeof p.text === 'function' ? p.text(d, t) : p.text; assert(String(s).length <= 32, p.key + ': ' + s); }
                    if (p.colors) { const c = p.colors(t, d); Object.keys(c).forEach((k) => { const v = Array.isArray(c[k]) ? c[k][0] : c[k]; assert(/^#[0-9a-f]{6}$/i.test(v), p.key + '.' + k + ' ' + v); }); }
                });
            });
        });
    }
    await check('page: every reading can be on a tile (six at a time) and shows its own name', () => {
        const d = sample({ engine: 'on' }), t = palette('blue');
        const keys = Object.keys(READINGS);
        for (let i = 0; i < keys.length; i += 6) {
            const slots = keys.slice(i, i + 6);
            const ps = pieces(opts({ slots }));
            const ts = texts(ps, d, t);
            slots.forEach((k) => assert(ts.indexOf(view(k, d, metric).short) >= 0, k + ' not named: ' + ts.join('|')));
        }
    });
    await check('page: the consumption tile shows the regeneration under its value while electric, the fuel flow while the engine runs', () => {
        const t = palette('blue');
        const ts = (engine) => texts(pieces(opts({ slots: ['consumption'] })), sample({ engine }), t);
        assert(ts('off').indexOf('REGEN 9.2 KW') >= 0, ts('off').join('|'));
        assert(ts('on').indexOf('6.2 L/H') >= 0, ts('on').join('|'));
        const d = Object.assign(sample({ engine: 'off' }), { regen: undefined });
        assert(texts(pieces(opts({ slots: ['consumption'] })), d, t).indexOf('REGEN 55 %') >= 0, 'without the battery power: the car\'s own meter');
    });

    /* ---------- on the cluster ---------- */
    await check('page is one group: a layer a piece, uniforms and shaders within the renderer\'s limits, driving sends little', () => {
        const { startCluster } = require(path.join(APP, 'engine'));
        const client = new FakeClient(), d = sample({ engine: 'on' });
        const e = startCluster({ client, log: { info() {}, warn(m) { throw new Error(m); } }, target: 'map', contend: true, z: 200,
            settleMs: 0, layout: () => ({ id: 'c', pieces }), options: () => opts({ style: 'arc', look: 'modern' }),
            theme: () => palette('blue', 'modern'), data: () => d, live: () => true, enabled: () => true, sweep: () => false, group: 'tiles' });
        e._tick();
        const effects = () => Array.from(client.layers.values()).filter((l) => l.kind === 'effect');
        assert(effects().length === e._pieces().length && effects().length <= 60, effects().length + ' layers (the service allows 64 an app)');
        assert(effects().every((l) => l.opts.target === 'map' && l.opts.contend === true && l.opts.visible));
        effects().forEach((l) => Object.keys(l.uniforms).forEach((k) => assert(l.uniforms[k].v.length <= 1024, k)));
        effects().forEach((l) => RESERVED.forEach((n) => assert(!new RegExp('(^|[^A-Za-z0-9_])' + n + '($|[^A-Za-z0-9_])').test(l.opts.fs), n)));
        client.reset();
        for (let i = 0; i < 25 * 30; i++) { d.oil = 90 + 10 * Math.sin(i / 90); d.consumption = 6 + 3 * Math.sin(i / 20); d.rpm = 2500 + 2000 * Math.sin(i / 20); e._tick(); }
        console.log('     driving: ' + (client.bytes / 30 / 1024).toFixed(1) + ' KB/s, ' + e._pieces().length + ' pieces');
        assert(client.bytes / 30 < 12 * 1024);
        e.stop();
    });

    /* ---------- the app ---------- */
    process.env.SOMEIP_CATALOG = '/nonexistent/someip-interfaces.json';
    process.env.CLUSTER_INFO_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'ci-'));
    process.env.CLUSTER_SETTLE_MS = '0';
    process.env.CLUSTER_PRESENCE_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'cp-'));
    let app = null, client = null;
    const load = Module._load;
    Module._load = function (req, parent, isMain) {
        if (req === './kit/mgu') return { run(a) { app = a; } };
        if (req === './cluster_render_client') return { ClusterRender: function () { client = new FakeClient(); return client; } };
        return load.call(this, req, parent, isMain);
    };
    const themes = require(path.join(KIT, 'themes'));
    const { Canvas } = require(path.join(KIT, 'canvas'));
    const S = {}, changes = [], clicks = {}, handlers = {}, warns = [];
    SPEC.settings.forEach((s) => { S[s.key] = s.default; });
    let pages = 0, lastImage = null;
    const ctx = {
        app: {}, ui: { onClick(n, fn) { clicks[n] = fn; }, text() {}, image: async (n, cv) => { pages++; lastImage = cv; } },
        settings: { schema: SPEC.settings, get: (k) => S[k], set: (k, v) => { S[k] = v; changes.forEach((f) => f(k, v)); }, onChange(f) { changes.push(f); }, display: (k) => String(S[k]) },
        log: { info() {}, warn: (m) => warns.push(m), error: (m, e) => warns.push(m + ' ' + e) },
        spec: SPEC, dataDir: fs.mkdtempSync(path.join(os.tmpdir(), 'ct-')),
        signals: {
            watch: (iface, inst, h) => { Object.assign(handlers, h); return Promise.resolve({ available: true }); },
            proxy: () => Promise.reject(new Error('no TASU here')), on: () => Promise.resolve(), onAvailable: () => Promise.resolve(),
        },
        loop() {}, theme: () => themes.theme('m_tricolour'), canvas: (w, h) => new Canvas(w, h),
    };
    require(path.join(APP, 'main.js'));
    await app.start(ctx);
    await new Promise((r) => setTimeout(r, 300));
    const effects = () => Array.from(client.layers.values()).filter((l) => l.kind === 'effect');
    const eng = () => require(path.join(APP, 'engine')).startCluster.last;
    const names = () => texts(eng()._pieces(), sample({ engine: 'on' }), palette('blue'));
    await check('app: every signal it reads is declared in app.json', () => {
        const declared = [].concat(...Object.keys(SPEC.signals).map((i) => Object.keys(SPEC.signals[i])));
        Object.keys(handlers).forEach((h) => assert(declared.indexOf(h) >= 0, h));
    });
    await check('engine unit extras: a candidate list, unit conversion, a difference, no-data values', async () => {
        const X = require(path.join(APP, 'extras'));
        const fake = (vals) => ({ pick: {}, async value(name, list) { for (let i = 0; i < list.length; i++) { const v = vals[list[i].did || 'OBD ' + list[i].obd]; if (v !== undefined) { this.pick[name] = i; return v; } } return null; } });
        assert.strictEqual(await X.dmeRead(fake({ 4402: 95 }), 'd:4402'), 95);
        assert.strictEqual(await X.dmeRead(fake({ 5822: 88 }), 'd:4402'), 88);                    // the second candidate
        assert(Math.abs(await X.dmeRead(fake({ 4205: 2000, 4201: 1000 }), 'd:42054201') - 1) < 1e-9);   // hPa -> bar, boost over ambient
        assert.strictEqual(await X.dmeRead(fake({}), 'd:4402'), null);
        assert.strictEqual(await X.dmeRead(fake({ 4402: 95 }), 'd:nothing'), null);
        assert(Object.keys(X.READINGS).length > 150);
    });
    await check('app: on by itself at every start (Show in the cluster centre defaults to On)', () => assert(effects().length > 0));
    handlers.statusCarSpeed2({ speedVehicleCentreOfGravity: Math.round(40 / 0.015625) });
    handlers.statusEngineSpeed2({ actualValueRPMEngineCrankshaft: 2000 / 0.25 });
    handlers.statusEngineTemperature({ temperatureEngineDrive: 90 + 48, temperatureEngineOilDrive: 100 + 48 });
    await new Promise((r) => setTimeout(r, 400));
    await check('app: shown with the six tiles of the settings (oil, coolant, gearbox, consumption, intake air, outside)', () => {
        assert(effects().length > 0 && effects().every((l) => l.opts.visible));
        const ts = names();
        ['OIL', 'COOLANT', 'GEARBOX', 'INTAKE AIR', 'OUTSIDE'].forEach((n) => assert(ts.indexOf(n) >= 0, n + ': ' + ts.join('|')));
        assert(ts.indexOf('FUEL') >= 0 || ts.indexOf('ELECTRIC') >= 0);
    });
    await check('app: another reading in a tile rebuilds the page with it; Nothing leaves it out', () => {
        ctx.settings.set('tile6', 'soc');
        assert(names().indexOf('CHARGE') >= 0 && names().indexOf('OUTSIDE') < 0);
        ctx.settings.set('tile5', 'none');
        assert(names().indexOf('INTAKE AIR') < 0 && eng()._pieces().length > 5);
        ctx.settings.set('tile5', 'iat'); ctx.settings.set('tile6', 'outside');
        assert(names().indexOf('INTAKE AIR') >= 0 && names().indexOf('OUTSIDE') >= 0);
    });
    await check('app: a colour change sends colours only', () => { client.reset(); ctx.settings.set('accent', 'orange'); assert(client.log.length > 0 && client.log.every((m) => m.op === 'uniform')); });
    // a Cluster Layouts layout showing: the page steps aside
    const layoutsSays = (centre) => fs.writeFileSync(path.join(process.env.CLUSTER_PRESENCE_DIR, 'layouts.json'), JSON.stringify({ at: Date.now(), centre }));
    layoutsSays('map');
    await new Promise((r) => setTimeout(r, 1500));
    await check('app: a Cluster Layouts layout with Waze in its centre: the tiles step aside', () => assert(!(effects().length > 0 && effects().every((l) => l.opts.visible))));
    fs.unlinkSync(path.join(process.env.CLUSTER_PRESENCE_DIR, 'layouts.json'));
    await check('app: the screen shows the page preview', () => assert(pages > 0 && lastImage && lastImage.w === 1600));
    await check('app: warnings only for what this machine lacks (no diagnostic link, no catalog)', () => assert(warns.every((w) => /TASU|catalog/.test(w)), JSON.stringify(warns)));
    console.log(ok + ' passed');
    process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
