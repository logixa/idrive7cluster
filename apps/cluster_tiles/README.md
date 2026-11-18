# Cluster Tiles

The factory cluster as it is - speedometer, rev counter, warning lights - with **its centre taken over** by six
tiles of live data. The centre is the stock map's area (slot 0x100, 1088x480), taken over the way Waze on cluster
takes it; set **Instrument cluster > Central display area** to **Map view**. Turn it on in the app with **Show in
the cluster**. While it shows it covers a Waze map in the centre; turn it off for the map.

## Settings

- **Tile 1 ... Tile 6**: the reading in each tile (or Nothing: the others then share the space). All readings are in
  the table in the [main README](../../README.md).
- **Tile style**: number and bar, arc gauge, or number only. **Look**: like the factory cluster, or modern.
  **Size in the centre**: between the stock readouts, or the whole middle. **Colour**, **Number size**.
- **Units**: temperature (default °C), pressure (bar), speed and distance (km/h), torque (Nm).
- **Warnings**: when oil, coolant, intake air, gearbox and battery count as too hot, and low pressure fuel as too low
  (the value turns orange).
- **Vehicle**: plug-in hybrid (default), petrol or diesel, or found from the car. **Fuel tank size** (default 46 L,
  the 530e's), **Battery power (kW)**, **Electric range when full**.
- Settings are kept for each driver profile.

## Where the values come from

| Reading | From |
|---|---|
| oil, coolant, speed, rpm, torque, g | the car's signals |
| gearbox oil | the car's data set, else the gearbox unit (EGS) over the diagnostic link |
| intake air, fuel pressures, boost, ignition timing, engine load, throttle, air flow, fuel flow | the engine unit (DME) over the diagnostic link, only for the tiles that show them (read a few times a second) |
| outside temperature, ranges, fuel level, power distribution, tyres | the car's signals |
| **electric consumption** | the battery power (eDrive Live) over the speed, else the car's own consumption signal |
| **regeneration** | the battery power below zero (kW, needs eDrive Live) and the car's own power meter (%) |
| **fuel consumption** | a field of the car's consumption signal when it has one, else the engine unit's fuel flow (OBD PID 0x5E), else its air mass flow (PID 0x10) taken as fuel for a petrol engine at lambda 1: L/h = g/s x 3600 / (14.7 x 745) |
| battery charge, battery power | eDrive Live (eroobeeroo/idrive7-apps) |

The consumption tile follows the drive: **fuel in L/100 km while the engine runs, electric in kWh/100 km while it is
off**, negative while recuperating, with the regeneration under it. Standing still the figure per 100 km is empty;
with the engine running the fuel flow in L/h shows under it.

With the car switched off or locked it asks nothing of the car's units.

## Not confirmed on a car yet

This app has not run on a car. It is built from the readings and signals the community apps already use, and the
tests run it on stubbed signals. In particular:

- **Fuel consumption** depends on the engine unit answering the standard OBD identifiers (fuel flow 0x5E or air flow
  0x10) over the diagnostic link, or on the car's consumption signal having a fuel field. If neither answers, the
  tile shows `--` for the fuel consumption. The raw values of the car's signal go to the app's log
  (`raw currentConsumption`), so a car that names its fields differently can be added.
- The unit of the car's own consumption field is taken as kWh/100 km (a value above 100 is read as tenths).
- The gearbox temperature of a ZF 8HP is read from the gearbox unit (EGS 0x18, DID 0x6000) as on a G22; it is not
  confirmed on every car.
- The settings screen offers every reading in each tile's drop-down (49 rows).
