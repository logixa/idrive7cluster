> [!WARNING]
> **Disclaimer.** This is an independent personal project. It is not affiliated with, endorsed by or supported by
> any vehicle manufacturer, equipment supplier or their partners. Everything in this repository is provided
> "as is", without warranty of any kind. Changing a vehicle's software, electronics or displays can cause
> malfunctions, distract the driver, void warranties, break local regulations and create safety risks. Use is
> entirely at your own risk.

# Cluster Tiles

An app for the BMW iDrive 7 head unit (MGU): **six tiles of live data in the centre of the instrument cluster**,
drawn by the cluster itself. Each tile shows whatever you pick in the app's settings (Tile 1 ... Tile 6), from
every reading in [READINGS.md](READINGS.md): the 48 below, every other signal the car sends the head unit and the
engine unit's values (temperatures, oil, fuel, boost, ignition, VANOS, lambda, 12 V ...). Which reading goes in which
tile is set one tile at a time, in the app's **Settings**.

The app starts by itself with the car (**Show in the cluster centre** is On by default) and shows the tiles whenever the
car is awake.

The default tiles:

| Tile | Shows |
|---|---|
| 1 | Engine oil temperature |
| 2 | Engine coolant temperature |
| 3 | Gearbox (transmission) oil temperature |
| 4 | **Consumption now**: litres per 100 km while the engine runs, kWh per 100 km while it is off (negative while recuperating), with the **regeneration** (kW, or % of the car's power meter) under it |
| 5 | Intake air temperature |
| 6 | Outside temperature (the "extra" tile: change it to anything) |

## What each tile can show

The 48 curated readings (listed first in each tile's setting); [READINGS.md](READINGS.md) has the rest.

| Reading | Settings key |
|---|---|
| Engine oil temperature | oil |
| Coolant temperature | coolant |
| Intake air temperature | iat |
| Intake air above outside | iatRise |
| Gearbox oil temperature | gearbox |
| Outside temperature | outside |
| High pressure fuel | hpfp |
| Low pressure fuel | lpfp |
| Boost (actual) | boostActual |
| Boost (target) | boostTarget |
| Ignition timing | timing |
| Engine speed | rpm |
| Speed | speed |
| Engine torque | torque |
| Lateral g | gLat |
| Longitudinal g | gLong |
| Battery charge | soc |
| Battery power | kw |
| Battery temperature | battTemp |
| Electric range | erange |
| Fuel range | frange |
| Consumption now (fuel or electric, follows the drive) | consumption |
| Fuel consumption now (L/100 km) | fuelCons |
| Electric consumption now (kWh/100 km, negative = recuperating) | elecCons |
| Fuel flow (L/h) | fuelRate |
| Air mass flow (g/s) | maf |
| Regeneration power (kW, from the battery power) | regen |
| Regeneration (% of the car's power meter) | regenPct |
| Electric drive (% of the car's power meter) | drivePct |
| Engine load (actual, %) | loadActual |
| Engine load (requested, %) | loadTarget |
| Throttle position (%) | throttle |
| Fuel tank level (%) | fuelPct |
| Fuel in the tank (litres) | fuelLevel |
| Total range | trange |
| Power to driving (%) | pdDrive |
| Power to climate (%) | pdClimate |
| Power to seat heating (%) | pdSeats |
| Steering angle | steer |
| Yaw rate (deg/s) | yaw |
| Tyre pressure front left | tyrePFL |
| Tyre pressure front right | tyrePFR |
| Tyre pressure rear left | tyrePRL |
| Tyre pressure rear right | tyrePRR |
| Tyre temperature front left | tyreTFL |
| Tyre temperature front right | tyreTFR |
| Tyre temperature rear left | tyreTRL |
| Tyre temperature rear right | tyreTRR |

Where the values come from, and what is **not confirmed on a car yet**, is in [apps/cluster_tiles/README.md](apps/cluster_tiles/README.md).

## Installing

Add this repository as a source in the [MGU Store](https://github.com/robertnisipeanu/mgu-store) and install
**Cluster Tiles**; the head unit builds it from source with its own SDK. What it needs comes from the Store's own
sources, which it installs with it:

- the GPU renderer (`idrive7-renderd`) and controller gate (`mgu-inputgate`) from
  [cauliflowermossgrape/idrive7-apps](https://github.com/cauliflowermossgrape/idrive7-apps);
- the cluster renderer (`cluster-render`, 0.6.9 or later) from
  [robertnisipeanu/idrive-apps](https://github.com/robertnisipeanu/idrive-apps).

[eroobeeroo/idrive7-apps](https://github.com/eroobeeroo/idrive7-apps) is optional: its **eDrive Live** shares the
battery's charge, power and temperature (the battery charge tile, battery power, regeneration in kW).

Then, on the car: **Instrument cluster > Central display area > Map view**, and turn on **Show in the cluster centre**
in the app.

## Origin and licence

Cluster Tiles is derived from **Cluster Centre** in [eroobeeroo/idrive7-cluster-info](https://github.com/eroobeeroo/idrive7-cluster-info):
the render path to the cluster, the car data layer and the shaders are from there. What is new here: the page of six
tiles, the tile settings, the consumption and regeneration readings, the engine unit's air and fuel flow readings and
the other readings in the list above. It is a modified version and not the original app.

Licensed under the **PolyForm Noncommercial License 1.0.0** ([LICENSE](LICENSE)): noncommercial use only, no selling,
no paid installation. Required notices and the third-party licences are in [NOTICE.md](NOTICE.md) and each app's
`NOTICE`. The app kit in `kit/` is MIT ([kit/LICENSE](kit/LICENSE)).

## Repository layout

| Path | What |
|---|---|
| `apps/cluster_tiles/` | the app: `main.js` (screen, settings, driver profiles), `pages.js` (the tiles page), `readings.js` (every reading, its units and warnings), `data.js` (the car's signals and the engine unit's readings), `engine.js` and `shaders.js` (what the cluster draws), `app.json` (manifest, signals, settings) |
| `shared/` | the files `apps/cluster_tiles/` takes a copy of (`node tools/sync_shared.js`) |
| `tools/` | tests, the preview (`preview_tiles.js`), the font baker |
| `kit/` | the MGU app kit (runtime, build script) |
| `mgu-repo.json` | tells the Store how to build the app |

## Development

```
node tools/sync_shared.js         # after editing shared/
node tools/test_tiles.js          # the app on stubbed signals
node tools/test_data.js; node tools/test_signals.js; node tools/test_shared.js
node tools/preview_tiles.js --tiles oil,coolant,gearbox,consumption,iat,outside --engine off --out tiles.png
```

Tests need only Node.js; the preview also needs `playwright` with Chromium. Building the package
(`python3 kit/tools/build.py cluster_tiles`) needs BMW's `oap-sdk`, extracted from your own head unit; the built
packages and the SDK are never committed.
