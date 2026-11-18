'use strict';
/**
 * readings.js - every reading a tile can show: its name on the app and on the cluster, its kind (the unit it
 * is converted to by the settings), its gauge range and when it is too hot / low. Each of the six tiles picks
 * one from this list (Settings > Tile 1 ... Tile 6).
 *
 * 'consumption' is a tile that follows the drive: fuel in L/100 km while the engine runs, electric kWh/100 km
 * (negative while recuperating) while it is off (data.js sets consumptionKind).
 */
const isNum = (v) => typeof v === 'number' && isFinite(v);

/* kinds: temp (°C), press (bar), speed (km/h), rpm, pct, kw, nm, deg, km, none; icon: shaders.js ICON_FS */
const READINGS = {
    oil: { title: 'Engine oil temperature', short: 'OIL', icon: 1, kind: 'temp', min: 40, max: 140, warnHigh: 130, cold: 60 },
    coolant: { title: 'Coolant temperature', short: 'COOLANT', icon: 0, kind: 'temp', min: 40, max: 130, warnHigh: 118, cold: 60 },
    iat: { title: 'Intake air temperature', short: 'INTAKE AIR', icon: 3, kind: 'temp', min: 0, max: 80, warnHigh: 60 },
    iatRise: { title: 'Intake air above outside', short: 'IAT RISE', icon: 3, kind: 'tempDelta', min: 0, max: 40, warnHigh: 25 },
    gearbox: { title: 'Gearbox oil temperature', short: 'GEARBOX', icon: 2, kind: 'temp', min: 40, max: 130, warnHigh: 115, cold: 50 },
    outside: { title: 'Outside temperature', short: 'OUTSIDE', icon: 12, kind: 'temp', min: -20, max: 45 },
    hpfp: { title: 'High pressure fuel', short: 'HPFP', icon: 4, kind: 'press', min: 0, max: 350, warnLow: 30 },
    lpfp: { title: 'Low pressure fuel', short: 'LPFP', icon: 4, kind: 'press', min: 0, max: 8, warnLow: 3.5 },
    boostActual: { title: 'Boost (actual)', short: 'BOOST', icon: 5, kind: 'press', min: 0, max: 2 },
    boostTarget: { title: 'Boost (target)', short: 'BOOST TARGET', icon: 5, kind: 'press', min: 0, max: 2 },
    timing: { title: 'Ignition timing', short: 'TIMING', icon: 13, kind: 'deg', min: -10, max: 40 },
    rpm: { title: 'Engine speed', short: 'RPM', icon: 13, kind: 'rpm', min: 0, max: 7000 },
    speed: { title: 'Speed', short: 'SPEED', icon: 13, kind: 'speed', min: 0, max: 250 },
    torque: { title: 'Engine torque', short: 'TORQUE', icon: 11, kind: 'nm', min: 0, max: 600 },
    gLat: { title: 'Lateral g', short: 'LAT G', icon: 8, kind: 'g', min: -1.2, max: 1.2 },
    gLong: { title: 'Longitudinal g', short: 'LONG G', icon: 8, kind: 'g', min: -1.2, max: 1.2 },
    soc: { title: 'Battery charge', short: 'CHARGE', icon: 6, kind: 'pct', min: 0, max: 100, warnLow: 10 },
    kw: { title: 'Battery power', short: 'POWER', icon: 7, kind: 'kw', min: -35, max: 100 },
    battTemp: { title: 'Battery temperature', short: 'BATTERY', icon: 6, kind: 'temp', min: 0, max: 50, warnHigh: 42, cold: 5 },
    erange: { title: 'Electric range', short: 'ELECTRIC', icon: 7, kind: 'km', min: 0, max: 60 },
    frange: { title: 'Fuel range', short: 'FUEL RANGE', icon: 4, kind: 'km', min: 0, max: 700, warnLow: 50 },
    // consumption (fuel from the engine unit or the car's own signal, electric from the car / battery power)
    consumption: { title: 'Consumption now (fuel or electric, follows the drive)', short: 'CONSUMPTION', icon: 4, kind: 'l100', min: 0, max: 20 },
    fuelCons: { title: 'Fuel consumption now (L/100 km)', short: 'FUEL', icon: 4, kind: 'l100', min: 0, max: 20 },
    elecCons: { title: 'Electric consumption now (kWh/100 km, negative = recuperating)', short: 'ELECTRIC', icon: 7, kind: 'kwh100', min: -30, max: 50 },
    fuelRate: { title: 'Fuel flow (L/h)', short: 'FUEL FLOW', icon: 4, kind: 'lph', min: 0, max: 25 },
    maf: { title: 'Air mass flow (g/s)', short: 'AIR FLOW', icon: 3, kind: 'gps', min: 0, max: 120 },
    // this trip: since the car woke up, worked out in data.js from the fuel flow, the battery power and the speed
    // the averages the car's own trip computer offers (the head unit's Factory / Individual / Refuelling / Start of journey)
    avgFactory: { title: "Average consumption since delivery (the car's own, as in the head unit: Factory)", short: 'AVG FACTORY', icon: 4, kind: 'l100', min: 0, max: 20 },
    avgIndividual: { title: "Average consumption, Individual (the car's own, as in the head unit)", short: 'AVG INDIV', icon: 4, kind: 'l100', min: 0, max: 20 },
    avgRefuel: { title: "Average consumption since refuelling (the car's own, as in the head unit)", short: 'AVG REFUEL', icon: 4, kind: 'l100', min: 0, max: 20 },
    avgStart: { title: "Average consumption since the start of the journey (the car's own, as in the head unit)", short: 'AVG START', icon: 4, kind: 'l100', min: 0, max: 20 },
    tripConsumption: { title: 'Average consumption this trip (fuel, or electric while no fuel was used)', short: 'TRIP AVG', icon: 4, kind: 'l100', min: 0, max: 20 },
    tripFuelCons: { title: 'Average fuel consumption this trip (L/100 km)', short: 'TRIP AVG FUEL', icon: 4, kind: 'l100', min: 0, max: 20 },
    tripElecCons: { title: 'Average electric consumption this trip (kWh/100 km)', short: 'TRIP AVG ELEC', icon: 7, kind: 'kwh100', min: -10, max: 40 },
    tripDist: { title: 'Distance of this trip', short: 'TRIP KM', icon: 13, kind: 'km', min: 0, max: 300 },
    tripFuel: { title: 'Fuel used this trip (litres)', short: 'TRIP FUEL USED', icon: 4, kind: 'litre1', min: 0, max: 30 },
    tripKwh: { title: 'Electricity used this trip (kWh, negative = more recuperated than used)', short: 'TRIP KWH', icon: 7, kind: 'kwh', min: -5, max: 20 },
    regen: { title: 'Regeneration power (kW, from the battery power)', short: 'REGEN', icon: 7, kind: 'kw', min: 0, max: 35 },
    regenPct: { title: 'Regeneration (% of the car\'s power meter)', short: 'REGEN', icon: 7, kind: 'pct', min: 0, max: 100 },
    drivePct: { title: 'Electric drive (% of the car\'s power meter)', short: 'E-DRIVE', icon: 7, kind: 'pct', min: 0, max: 100 },
    loadActual: { title: 'Engine load (actual, %)', short: 'LOAD', icon: 11, kind: 'pct', min: 0, max: 100 },
    loadTarget: { title: 'Engine load (requested, %)', short: 'LOAD TARGET', icon: 11, kind: 'pct', min: 0, max: 100 },
    throttle: { title: 'Throttle position (%)', short: 'THROTTLE', icon: 13, kind: 'pct', min: 0, max: 100 },
    fuelPct: { title: 'Fuel tank level (%)', short: 'TANK', icon: 4, kind: 'pct', min: 0, max: 100, warnLow: 10 },
    fuelLevel: { title: 'Fuel in the tank (litres)', short: 'TANK', icon: 4, kind: 'litre', min: 0, max: 70, warnLow: 7 },
    trange: { title: 'Total range', short: 'TOTAL RANGE', icon: 4, kind: 'km', min: 0, max: 800 },
    pdDrive: { title: 'Power to driving (%)', short: 'TO DRIVE', icon: 10, kind: 'pct', min: 0, max: 100 },
    pdClimate: { title: 'Power to climate (%)', short: 'TO CLIMATE', icon: 12, kind: 'pct', min: 0, max: 100 },
    pdSeats: { title: 'Power to seat heating (%)', short: 'TO SEATS', icon: 0, kind: 'pct', min: 0, max: 100 },
    steer: { title: 'Steering angle', short: 'STEERING', icon: 8, kind: 'deg', min: -540, max: 540 },
    yaw: { title: 'Yaw rate (deg/s)', short: 'YAW', icon: 8, kind: 'deg', min: -60, max: 60 },
    tyrePFL: { title: 'Tyre pressure front left', short: 'TYRE FL', icon: 4, kind: 'press', min: 1.5, max: 3.5, warnLow: 1.9 },
    tyrePFR: { title: 'Tyre pressure front right', short: 'TYRE FR', icon: 4, kind: 'press', min: 1.5, max: 3.5, warnLow: 1.9 },
    tyrePRL: { title: 'Tyre pressure rear left', short: 'TYRE RL', icon: 4, kind: 'press', min: 1.5, max: 3.5, warnLow: 1.9 },
    tyrePRR: { title: 'Tyre pressure rear right', short: 'TYRE RR', icon: 4, kind: 'press', min: 1.5, max: 3.5, warnLow: 1.9 },
    tyreTFL: { title: 'Tyre temperature front left', short: 'TYRE T FL', icon: 0, kind: 'temp', min: -10, max: 90, warnHigh: 80 },
    tyreTFR: { title: 'Tyre temperature front right', short: 'TYRE T FR', icon: 0, kind: 'temp', min: -10, max: 90, warnHigh: 80 },
    tyreTRL: { title: 'Tyre temperature rear left', short: 'TYRE T RL', icon: 0, kind: 'temp', min: -10, max: 90, warnHigh: 80 },
    tyreTRR: { title: 'Tyre temperature rear right', short: 'TYRE T RR', icon: 0, kind: 'temp', min: -10, max: 90, warnHigh: 80 },
};

// every other signal of the car and every value of the engine unit (extras.js): picked from the same list
Object.assign(READINGS, require('./extras').READINGS);
// the range of an extra reading: its kind's usual one, widened by what it has shown (most have no known end)
const SEEN = {};

/** Units now: { temp: 'f' | 'c', press: 'bar' | 'psi' | 'kpa', speed: 'mph' | 'kmh', torque: 'lbft' | 'nm' | 'kgm' }. */
function convert(kind, v, u) {
    if (!isNum(v)) return v;
    if (kind === 'temp') return u.temp === 'f' ? v * 9 / 5 + 32 : v;
    if (kind === 'tempDelta') return u.temp === 'f' ? v * 9 / 5 : v;
    if (kind === 'press') return u.press === 'psi' ? v * 14.5038 : u.press === 'kpa' ? v * 100 : v;
    if (kind === 'speed' || kind === 'km') return u.speed === 'mph' ? v / 1.609344 : v;
    if (kind === 'litre') return v;
    if (kind === 'nm') return u.torque === 'lbft' ? v * 0.737562 : u.torque === 'kgm' ? v / 9.80665 : v;
    return v;
}
function unitText(kind, u) {
    return { temp: '°' + (u.temp === 'f' ? 'F' : 'C'), tempDelta: '°' + (u.temp === 'f' ? 'F' : 'C'), press: u.press === 'psi' ? 'PSI' : u.press === 'kpa' ? 'KPA' : 'BAR',
        l100: 'L/100KM', kwh100: 'KWH/100KM', kwh: 'KWH', lph: 'L/H', gps: 'G/S', litre: 'L', litre1: 'L',
        speed: u.speed === 'mph' ? 'mph' : 'km/h', km: u.speed === 'mph' ? 'mi' : 'km', rpm: 'rpm', pct: '%', kw: 'kW', nm: u.torque === 'lbft' ? 'lb-ft' : u.torque === 'kgm' ? 'kgm' : 'Nm', deg: '°', g: 'G' }[kind] || '';
}
/** Decimals for a kind in a unit. */
function decimals(kind, v, u) {
    if (kind === 'press') return u.press === 'bar' ? (Math.abs(v) < 10 ? 2 : 0) : u.press === 'psi' && Math.abs(v) < 30 ? 1 : 0;
    if (kind === 'g') return 2;
    if (kind === 'l100' || kind === 'kwh100' || kind === 'lph' || kind === 'litre1' || kind === 'kwh') return 1;
    if (kind === 'gps') return Math.abs(v) < 10 ? 1 : 0;
    if (kind === 'kw' || kind === 'deg') return Math.abs(v) < 10 ? 1 : 0;
    if (kind === 'nm' && u.torque === 'kgm') return Math.abs(v) < 100 ? 1 : 0;   // kgm: a tenth of Nm's, so a decimal
    return 0;
}

/**
 * A reading's view now: { key, title, short, icon, value (converted, null none), text, unit, frac (0..1 on its
 * range), warnAt (0..1 where it turns too hot, 2 none), level: 'ok' | 'warn' | 'cold' | 'none' }. warn: thresholds set by the user ({ key: number } in °C /
 * bar), else the reading's own.
 */
function view(key, d, u, warn) {
    // the consumption tile follows the drive: electric while the engine is off, else fuel
    if (/^avg(Factory|Individual|Refuel|Start)$/.test(key)) {
        const elec = d.consumptionKind === 'electric' && isNum(d[key + 'Elec']);
        const v = view(elec ? 'elecCons' : 'fuelCons', Object.assign({}, d, { fuelCons: d[key + 'Fuel'], elecCons: d[key + 'Elec'] }), u, warn);
        return Object.assign({}, v, { key: key, short: READINGS[key].short, title: READINGS[key].title });
    }
    if (key === 'tripConsumption') {
        const v = view(d.tripFuel > 0.05 ? 'tripFuelCons' : 'tripElecCons', d, u, warn);
        return Object.assign({}, v, { key: 'tripConsumption' });
    }
    if (key === 'consumption') {
        const k = d.consumptionKind === 'electric' ? 'elecCons' : 'fuelCons';
        const v = view(k, Object.assign({}, d, { consumption: d[k] }), u, warn);
        return Object.assign({}, v, { key: 'consumption', frac: v.frac });
    }
    const r = READINGS[key];
    if (!r) return { key, title: key, short: key.toUpperCase(), icon: 13, value: null, text: '--', unit: '', frac: 0, warnAt: 2, level: 'none' };
    const raw = d[key], txt = typeof raw === 'string', v = convert(r.kind, raw, u);
    let rmin = r.min, rmax = r.max;
    if (r.group) {
        const sn = SEEN[key] || (SEEN[key] = { lo: Infinity, hi: -Infinity });
        if (isNum(raw)) { sn.lo = Math.min(sn.lo, raw); sn.hi = Math.max(sn.hi, raw); }
        if (isFinite(sn.lo)) { rmin = Math.min(rmin, sn.lo); rmax = Math.max(rmax, sn.hi); }
        if (rmax - rmin < 1e-9) rmax = rmin + 1;
    }
    const hi = warn && isNum(warn[key + 'High']) ? warn[key + 'High'] : r.warnHigh, lo = warn && isNum(warn[key + 'Low']) ? warn[key + 'Low'] : r.warnLow;
    const level = txt ? 'ok' : !isNum(raw) ? 'none' : isNum(hi) && raw >= hi ? 'warn' : isNum(lo) && raw <= lo ? 'warn' : isNum(r.cold) && raw < r.cold ? 'cold' : 'ok';
    const dec = r.group && r.kind !== 'press' && isNum(r.dec) ? r.dec : decimals(r.kind, v, u);
    const text = isNum(v) ? (r.kind === 'kw' && v > 0.05 ? '+' : '') + v.toFixed(dec) : txt ? raw : '--';
    const lo2 = convert(r.kind, rmin, u), hi2 = convert(r.kind, rmax, u);
    const warnAt = isNum(hi) ? Math.max(0, Math.min(2, (convert(r.kind, hi, u) - lo2) / (hi2 - lo2))) : 2;
    return { key, title: r.title, short: r.short, icon: r.icon || 0, value: isNum(v) ? v : null, text, unit: r.kind === 'raw' ? ((d.__u && d.__u[key]) || r.unit || '') : unitText(r.kind, u), frac: isNum(v) ? Math.max(0, Math.min(1, (v - lo2) / (hi2 - lo2))) : 0, warnAt, level };
}

module.exports = { READINGS, view, convert, unitText };
