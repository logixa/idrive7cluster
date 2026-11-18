'use strict';
/**
 * Cluster Tiles - six tiles of live data in the centre of the factory cluster, drawn by the cluster itself.
 *
 * The stock speedometer, rev counter and warning lights stay; the centre (the map area, slot 0x100, 1088x480,
 * taken over from the stock map in Map view as Waze on cluster does) shows six tiles, each one reading picked
 * in the settings (Tile 1 ... Tile 6, readings.js lists them all). The page is built once on the cluster
 * (engine.js groups); a changed reading sends only its new value.
 *
 * Derived from Cluster Centre in eroobeeroo/idrive7-cluster-info (PolyForm Noncommercial 1.0.0, see LICENSE and
 * NOTICE.md): the render path, the car data and the shaders are its; the tiles page, the settings and the
 * consumption and regeneration readings are this app's.
 *
 * This screen shows the page as it is now (cpu_preview.js) and what feeds it. Settings are kept per driver profile.
 */
const fs = require('fs');
const path = require('path');
const mgu = require('./kit/mgu');
const { ClusterRender } = require('./cluster_render_client');
const { startCluster } = require('./engine');
const { startData } = require('./data');
const presence = require('./presence');
const { PAGES, pieces, palette, needsOf, W: SW, H: SH } = require('./pages');
const { READINGS } = require('./readings');
const { drawPieces } = require('./cpu_preview');

/* The notice on the app's own screen: where this comes from and under what licence. */
const ORIGIN = 'github.com/eroobeeroo/idrive7-cluster-info';
function creditFooter(cv, t) {
    cv.text('Free for noncommercial use. Based on eroobeeroo/idrive7-cluster-info (PolyForm Noncommercial 1.0.0), modified.', 48, 486, 17, t.dim, { font: 'bold', literal: true });
    cv.text('Original: ' + ORIGIN + '   ·   this is a modified version, not the original app', 48, 506, 15, t.dim, { font: 'label', literal: true });
}

const W = 1600, H = 520;
let record = null;
try { record = require('./kit/record'); } catch (e) { /* an older kit: no pixel images */ }
const PREVIEW_ID = 0x43430001;
let lastSig = '';
/** The picture at half size (each 2x2 block averaged). */
function half(d, w, h) {
    const W2 = w >> 1, H2 = h >> 1, out = new Uint8Array(W2 * H2 * 4);
    for (let y = 0; y < H2; y++) for (let x = 0; x < W2; x++) {
        const a = ((y * 2) * w + x * 2) * 4, b = a + w * 4, o = (y * W2 + x) * 4;
        for (let c = 0; c < 4; c++) out[o + c] = (d[a + c] + d[a + 4 + c] + d[b + c] + d[b + 4 + c]) >> 2;
    }
    return out;
}
/** A cheap fingerprint of the preview's pixels (every 997th byte), so an unchanged picture is not sent again. */
function previewSig(d) { let h = 0; for (let i = 0; i < d.length; i += 997) h = (h * 31 + d[i]) | 0; return d.length + ':' + h; }
const PAGE = 'tiles';
const TILES = [1, 2, 3, 4, 5, 6];

mgu.run({
    async start(ctx) {
        const { ui, settings, log } = ctx;
        const showing = () => settings.get('show') === 'on';
        const data = startData(ctx, { shown: showing, tyres: true });
        const num = (k, dflt) => { const v = Number(settings.get(k)); return isFinite(v) ? v : dflt; };
        const all = () => data.data();

        /* ---------- options for the page ---------- */
        // the readings the six tiles show, in order ('Nothing' leaves a tile out: the rest share the space)
        const slots = () => TILES.map((i) => settings.get('tile' + i)).filter((k) => k && k !== 'none' && READINGS[k]);
        // a Cluster Layouts layout covers the whole panel: the page waits while one shows
        const blockedByLayout = () => presence.active('layouts');
        const options = () => ({
            look: settings.get('look'), fit: settings.get('fit'), pages: [PAGE], style: settings.get('style'), accent: settings.get('accent'), size: settings.get('size'),
            units: { temp: settings.get('tempUnit'), press: settings.get('pressUnit'), speed: settings.get('speedUnit'), torque: settings.get('torqueUnit') },
            warn: { oilHigh: num('oilHigh'), coolantHigh: num('coolantHigh'), iatHigh: num('iatHigh'), gearboxHigh: num('gearboxHigh'), battTempHigh: num('battTempHigh'), lpfpLow: num('lpfpLow') },
            slots: slots(),
        });
        const layout = { id: 'centre', pieces: (o) => pieces(o) };
        const cluster = startCluster({
            client: new ClusterRender('cluster_tiles'),
            target: 'map', contend: true, z: 200,
            layout: () => layout, options, log, data: all, onFresh: data.onFresh,
            theme: () => palette(settings.get('accent'), settings.get('look')),
            font: () => (settings.get('look') === 'modern' ? 'bold' : 'light'),
            live: () => data.car.data().demo || data.car.subs.some((s) => s.available) || data.car.lastCar > 0,
            // not while Cluster Layouts covers the whole panel (the tiles would be hidden under it and take the
            // renderer's layers the layout needs)
            enabled: () => showing() && !blockedByLayout(),
            sweep: () => false,
            group: PAGE,
        });
        // the engine unit is asked (fast) only for what the six tiles show
        const wantNow = () => data.want(needsOf(slots()));
        cluster.setGroup(PAGE);
        wantNow();
        setInterval(wantNow, 1000);

        /* ---------- settings per driver profile ---------- */
        const PROFILE_KEYS = settings.schema.map((s) => s.key).filter((k) => k !== 'show' && k !== 'demo');
        const PROFILE_FILE = path.join(ctx.dataDir, 'profiles.json');
        let profiles = {}, applying = false, profile = null;
        try { profiles = JSON.parse(fs.readFileSync(PROFILE_FILE, 'utf8')) || {}; } catch (e) { /* none yet */ }
        const saveProfiles = () => { try { fs.writeFileSync(PROFILE_FILE, JSON.stringify(profiles)); } catch (e) { log.warn('profiles: ' + e); } };
        const snapshot = () => { const o = {}; PROFILE_KEYS.forEach((k) => { o[k] = settings.get(k); }); return o; };
        ctx.signals.watch('de.bmw.infotainment.personalization.SessionManager', 'de.bmw.infotainment.personalization.SessionManager', {
            currentUserAccountReference: (v) => {
                const id = typeof v === 'string' ? v : v && (v.value || v.currentUserAccountReference);
                if (!id || String(id) === profile) return;
                profile = String(id);
                if (profiles[profile]) {
                    applying = true;
                    PROFILE_KEYS.forEach((k) => { if (profiles[profile][k] !== undefined && profiles[profile][k] !== settings.get(k)) settings.set(k, profiles[profile][k]); });
                    applying = false;
                    log.info('driver profile ' + profile + ': their settings');
                    rebuild();
                } else { profiles[profile] = snapshot(); saveProfiles(); log.info('driver profile ' + profile + ': first seen'); }
            },
        }, log, { pollMs: 5000 });

        function rebuild() {
            cluster.rebuild();
            cluster.setGroup(PAGE);
            wantNow();
        }
        settings.onChange((k, v) => {
            if (!applying && profile && PROFILE_KEYS.indexOf(k) >= 0) { profiles[profile] = Object.assign(profiles[profile] || snapshot(), { [k]: v }); saveProfiles(); }
            if (applying || k === 'show' || k === 'demo') return;
            if (k === 'accent') return cluster.recolour();
            rebuild();
        });

        ui.onClick('BTN_SHOW', () => { settings.set('show', showing() ? 'off' : 'on'); return safeRender(); });

        // where each of the two consumptions comes from now, for the screen
        const consFrom = (d) => ({
            fuel: isNum(d.carFuelCons) ? 'the car' : isNum(d.fuelRate) ? 'the engine unit' : 'nothing yet',
            elec: isNum(d.kw) ? 'battery power' : isNum(d.carElecCons) ? 'the car' : 'nothing yet',
        });
        function isNum(v) { return typeof v === 'number' && isFinite(v); }

        function render() {
            const t = ctx.theme();
            const cv = ctx.canvas(W, H).clear(t.bg);
            // the page as the cluster shows it, then what feeds it
            const o = options(), d = all();
            const sc = drawPieces(pieces(o), palette(settings.get('accent'), settings.get('look')), d, SW, SH, PAGE);
            const k = 0.82, pw = Math.round(SW * k), ph = Math.round(SH * k);
            // on the car the screen is a recorder for the GPU draw engine: the preview goes as a pixel image
            // (record.js setImage, uploaded when it changed); a plain canvas (the tests) draws it in place
            if (typeof cv.image === 'function' && record) {
                const sig = previewSig(sc.d);
                if (sig !== lastSig) { lastSig = sig; record.setImage(PREVIEW_ID, SW / 2, SH / 2, half(sc.d, SW, SH)); }   // half size: a quarter of the bytes
                cv.image(PREVIEW_ID, 24, 30, pw, ph);
            } else if (typeof cv.drawImage === 'function') cv.drawImage(sc.d, SW, SH, 24, 30, pw, ph);
            const st = cluster.status(), ds = data.status(), cf = consFrom(d);
            const x = pw + 52, line = (i, a, b) => { cv.text(a, x, 60 + i * 50, 18, t.dim, { font: 'bold', literal: true }); cv.text(String(b).slice(0, 34), x, 84 + i * 50, 18, t.text, { font: 'label', literal: true }); };
            line(0, 'In the cluster', !showing() ? 'off (stock map)' : st.shown ? 'showing' : blockedByLayout() ? 'waiting: a layout shows' : 'waiting');
            line(1, 'Tiles', o.slots.map((s) => READINGS[s].short).join(', ') || 'none chosen');
            line(2, 'Cluster renderer', st.renderer + ', centre ' + st.target + ', ' + st.layers + ' layers' + (st.refused ? ', refused: ' + st.refused : '') + '   ·   app ' + ((ctx.spec && ctx.spec.version) || ''));
            line(3, 'Engine units (UDS)', ds.diag);
            line(4, 'Shared by apps', ds.providers);
            line(5, 'Fuel consumption from', cf.fuel);
            line(6, 'Electric consumption from', cf.elec);
            creditFooter(cv, t);
            return ui.image('MAIN_GFX', cv);
        }
        // a failing frame says why on the screen (and in the log) instead of leaving it blank
        async function safeRender() {
            try { return await render(); } catch (e) {
                log.warn('render: ' + (e && e.stack || e));
                try { const t = ctx.theme(), cv = ctx.canvas(W, H).clear(t.bg); cv.text('Cluster Tiles ' + ((ctx.spec && ctx.spec.version) || '') + ': the screen failed to draw', 48, 80, 26, t.text, { font: 'bold', literal: true }); cv.text(String(e && e.message || e).slice(0, 120), 48, 120, 18, t.dim, { font: 'label', literal: true }); return ui.image('MAIN_GFX', cv); } catch (e2) { return undefined; }
            }
        }
        ctx.loop('MAIN', 2, safeRender);
        safeRender();
    },
});
