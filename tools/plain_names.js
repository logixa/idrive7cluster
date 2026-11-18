'use strict';
/**
 * plain_names.js - what each extra reading is called for people (settings list, app, cluster): a plain title that
 * says what it is, and a short name (14 characters at most) for the tile. gen_extras.js uses these in place of the
 * catalogs' own names; readings without an entry here keep the catalog's.
 */
const T = {
    // car signals
    's:power': ['Engine power (worked out from torque and speed)', 'POWER'], 's:powerPct': ['Engine power, % of maximum', 'POWER %'],
    's:torquePct': ['Engine torque, % of maximum', 'TORQUE %'], 's:powerMax': ['Maximum engine power (scale of the sport display)', 'MAX POWER'],
    's:torqueMax': ['Maximum engine torque (scale of the sport display)', 'MAX TORQUE'], 's:boost': ['Turbo boost pressure', 'BOOST'],
    's:boostMax': ['Turbo boost pressure, highest so far', 'BOOST PEAK'], 's:pedal': ['Accelerator pedal position', 'PEDAL'],
    's:coolant': ['Coolant temperature (from the car)', 'COOLANT'], 's:oil': ['Engine oil temperature (from the car)', 'OIL'],
    's:oil2': ['Engine oil temperature (second reading)', 'OIL 2'], 's:running': ['Engine state (running or not)', 'ENGINE STATE'],
    's:msa': ['Auto start-stop state', 'START-STOP'], 's:tank': ['Fuel in the tank (from the car)', 'FUEL TANK'],
    's:tankL': ['Fuel in the left half of the tank', 'TANK LEFT'], 's:tankR': ['Fuel in the right half of the tank', 'TANK RIGHT'],
    's:range': ['Range on the current tank', 'RANGE'], 's:odo': ['Odometer', 'ODOMETER'],
    's:avgCons1': ['Average consumption, trip computer 1', 'AVG CONS 1'], 's:avgSpeed1': ['Average speed, trip computer 1', 'AVG SPEED 1'],
    's:avgCons2': ['Average consumption, trip computer 2', 'AVG CONS 2'], 's:avgSpeed2': ['Average speed, trip computer 2', 'AVG SPEED 2'],
    's:tripTime': ['Driving time of the trip', 'TRIP TIME'], 's:tripDist': ['Distance of the trip', 'TRIP KM'],
    's:gear': ['Gear and selector position (P, R, N, D1...)', 'GEAR'], 's:mode': ['Drive mode (Comfort, Sport ...)', 'DRIVE MODE'],
    's:roll': ['Body roll rate (sideways tilt)', 'ROLL RATE'], 's:pitch': ['Body pitch rate (forward tilt)', 'PITCH RATE'],
    's:handbrake': ['Parking brake (applied or released)', 'PARK BRAKE'], 's:battery': ['12 V battery charge', '12V CHARGE'],
    's:oilLevel': ['Engine oil level (dipstick sensor)', 'OIL LEVEL'],
    's:ptFL': ['Recommended tyre pressure, front left', 'TYRE SET FL'], 's:ptFR': ['Recommended tyre pressure, front right', 'TYRE SET FR'],
    's:ptRL': ['Recommended tyre pressure, rear left', 'TYRE SET RL'], 's:ptRR': ['Recommended tyre pressure, rear right', 'TYRE SET RR'],
    's:wFL': ['Wheel rotation speed, front left (raw number)', 'WHEEL FL'], 's:wFR': ['Wheel rotation speed, front right (raw number)', 'WHEEL FR'],
    's:wRL': ['Wheel rotation speed, rear left (raw number)', 'WHEEL RL'], 's:wRR': ['Wheel rotation speed, rear right (raw number)', 'WHEEL RR'],
    's:slope': ['Road gradient, uphill or downhill (raw number)', 'GRADIENT'], 's:slopeSide': ['Road slope, sideways (raw number)', 'SLOPE SIDE'],
    's:mass': ['Vehicle weight (raw number)', 'WEIGHT'], 's:abs': ['ABS status (code)', 'ABS CODE'], 's:asc': ['Traction control status (code)', 'TRACTION CODE'],
    's:dsc': ['Stability control status (code)', 'STABILITY CODE'], 's:braking': ['Driver is braking (code)', 'BRAKING'],
    // the engine computer
    'd:4807': ['Engine speed (rpm)', 'RPM'], 'd:o04': ['Engine load', 'LOAD'], 'd:5814': ['Accelerator pedal position (engine computer)', 'PEDAL'],
    'd:4600': ['Throttle valve opening', 'THROTTLE'], 'd:5891': ['Engine torque (engine computer)', 'TORQUE'], 'd:4520': ['Engine power (engine computer)', 'POWER'],
    'd:4AB1': ['Vehicle speed (engine computer)', 'SPEED'], 'd:5881': ['Gear (engine computer)', 'GEAR'], 'd:o1F': ['Time since the engine started', 'RUN TIME'],
    'd:4300': ['Coolant temperature (engine computer)', 'COOLANT'], 'd:5890': ['Coolant temperature at the radiator outlet', 'RADIATOR OUT'],
    'd:4402': ['Engine oil temperature after the oil filter', 'OIL (FILTER)'], 'd:4425': ['Engine oil temperature in the oil pan', 'OIL PAN'],
    'd:580F': ['Intake air temperature (engine computer)', 'INTAKE AIR'], 'd:59D4': ['Air temperature after the turbo, before the throttle', 'CHARGE AIR'],
    'd:5817': ['Outside temperature (engine computer)', 'OUTSIDE'], 'd:4650': ['Gearbox temperature (engine computer)', 'GEARBOX'],
    'd:4AD5': ['Fuel temperature', 'FUEL TEMP'], 'd:5821': ['Engine computer temperature', 'COMPUTER TEMP'],
    'd:5896': ['Exhaust temperature after the catalytic converter (calculated)', 'EXHAUST TEMP'], 'd:579B': ['Particulate filter temperature', 'FILTER TEMP'],
    'd:o3C': ['Catalytic converter temperature', 'CATALYST TEMP'],
    'd:44364201': ['Oil pressure (above the outside air pressure)', 'OIL PRESSURE'], 'd:586F': ['Oil pressure (absolute)', 'OIL PRESS ABS'],
    'd:5811': ['Oil level above the minimum mark', 'OIL ABOVE MIN'], 'd:4409': ['Oil level (dipstick height)', 'OIL LEVEL'],
    'd:411A_0': ['Oil life left, by engine hours', 'OIL LIFE HRS'], 'd:411A_1': ['Oil life left, by fuel used', 'OIL LIFE FUEL'],
    'd:411A_2': ['Engine hours on this oil', 'OIL HOURS'], 'd:4404': ['Distance driven on this oil', 'OIL KM'], 'd:593A': ['Fuel diluting the oil', 'FUEL IN OIL'],
    'd:4AAA': ['Oil pump load', 'OIL PUMP'],
    'd:583B': ['Fuel in the tank (engine computer)', 'FUEL TANK'], 'd:5949': ['Fuel in the left half of the tank', 'TANK LEFT'], 'd:594A': ['Fuel in the right half of the tank', 'TANK RIGHT'],
    'd:o2F': ['Fuel tank level', 'TANK LEVEL'], 'd:58EF': ['Fuel pressure, high pressure side (fuel rail)', 'RAIL PRESSURE'],
    'd:5837': ['Fuel pressure, high pressure side, target', 'RAIL TARGET'], 'd:58F3': ['Fuel pressure, low pressure side (from the tank pump)', 'LOW PRESS FUEL'],
    'd:5656': ['Fuel flow (litres per hour)', 'FUEL FLOW'], 'd:4521': ['Fuel flow by weight (kg per hour)', 'FUEL KG/H'], 'd:550D': ['Ethanol share of the fuel', 'ETHANOL'],
    'd:5776': ['Fuel quality (octane number, RON)', 'OCTANE'], 'd:57E3': ['Time since the last refuelling', 'SINCE REFUEL'],
    'd:4035_0': ['Refuellings with low quality fuel', 'LOW QUALITY'], 'd:4035_1': ['Refuellings with medium quality fuel', 'MEDIUM QUALITY'], 'd:4035_2': ['Refuellings with high quality fuel', 'HIGH QUALITY'],
    'd:42054201': ['Turbo boost pressure (engine computer)', 'BOOST'], 'd:4205': ['Air pressure before the throttle (absolute)', 'THROTTLE PRESS'],
    'd:4AB0': ['Turbo boost pressure, target (absolute)', 'BOOST TARGET'], 'd:4536': ['Turbo boost pressure, difference from the target', 'BOOST ERROR'],
    'd:4A2D': ['Intake manifold pressure', 'MANIFOLD PRESS'], 'd:4201': ['Outside air pressure', 'AIR PRESSURE'], 'd:5511': ['Air flow into the engine', 'AIR FLOW'],
    'd:5813': ['Engine air fill (% of the maximum)', 'AIR FILL'], 'd:5927': ['Wastegate opening (0 = closed)', 'WASTEGATE'], 'd:4AAB': ['Wastegate actuator load', 'WASTEGATE LOAD'],
    'd:59FA': ['Ignition timing', 'IGNITION'], 'd:554C': ['Knock control: ignition pulled back (average)', 'KNOCK RETARD'], 'd:554A': ['Knock control: learned correction', 'KNOCK LEARNED'],
    'd:452E': ['Intake camshaft angle (VANOS)', 'INTAKE CAM'], 'd:452B': ['Intake camshaft angle, target', 'INTAKE CAM TGT'], 'd:452C': ['Exhaust camshaft angle (VANOS)', 'EXHAUST CAM'],
    'd:452A': ['Exhaust camshaft angle, target', 'EXH CAM TARGET'], 'd:4602': ['Intake valve lift (Valvetronic)', 'VALVE LIFT'], 'd:4603': ['Intake valve lift, target', 'LIFT TARGET'],
    'd:5889': ['Air-fuel ratio, lambda (1.00 = ideal)', 'LAMBDA'], 'd:5816': ['Air-fuel ratio, lambda target', 'LAMBDA TARGET'],
    'd:o06': ['Fuel correction, short term', 'CORR SHORT'], 'd:o07': ['Fuel correction, long term', 'CORR LONG'],
    'd:4A9D': ['Fuel mixture, learned factor', 'MIXTURE LEARN'], 'd:546E': ['Injector flow, learned factor (average)', 'INJECTOR LEARN'],
    'd:5853': ['12 V battery voltage', '12V VOLTAGE'], 'd:5852': ['12 V battery current', '12V CURRENT'], 'd:5854': ['12 V battery temperature', '12V TEMP'],
    'd:56F0': ['12 V battery charge', '12V CHARGE'], 'd:59AA': ['12 V battery health', '12V HEALTH'], 'd:4604': ['Alternator current', 'ALTERNATOR'],
    'd:4163_1': ['Spark plugs: distance left', 'PLUGS KM LEFT'], 'd:4163_2': ['Spark plugs: distance driven', 'PLUGS KM'], 'd:4163_0': ['Spark plug wear', 'PLUG WEAR'],
    'd:5444': ['Soot in the particulate filter', 'FILTER SOOT'], 'd:558C': ['Particulate filter load (learned)', 'FILTER LOAD'], 'd:558B': ['Particulate filter ash (learned)', 'FILTER ASH'],
    'd:5433': ['Catalytic converter oxygen storage', 'CATALYST O2'], 'd:583D': ['Engine operating hours', 'ENGINE HOURS'],
};
// per cylinder (and per refuelling): the catalog's title ends in ", cylinder N" / "Refuelling N, mileage"
const PATTERNS = [
    [/^Ignition angle, cylinder (\d)$/, (n) => ['Ignition timing, cylinder ' + n, 'IGNITION CYL ' + n]],
    [/^Misfires, cylinder (\d)$/, (n) => ['Misfires counted, cylinder ' + n, 'MISFIRE CYL ' + n]],
    [/^Rough running, cylinder (\d)$/, (n) => ['Rough running, cylinder ' + n, 'ROUGH CYL ' + n]],
    [/^Injector correction, cylinder (\d)$/, (n) => ['Injector correction, cylinder ' + n, 'INJECTOR CYL ' + n]],
    [/^Refuelling (\d), mileage$/, (n) => ['Odometer at refuelling ' + n + ' (of the last five)', 'REFUEL ' + n + ' KM']],
];
// the groups of the settings list
const GROUPS = {
    Engine: 'Engine', 'Fuel and trip': 'Fuel and trip computer', Driving: 'Driving', Tyres: 'Tyres', 'Chassis (raw numbers)': 'Advanced: raw numbers',
    Temperatures: 'Temperatures', Oil: 'Engine oil', Fuel: 'Fuel', 'Fuel quality': 'Fuel quality', 'Boost and air': 'Turbo and air',
    'Ignition and knock': 'Ignition, misfires and knocking', 'VANOS and Valvetronic': 'Valve timing', 'Mixture and injectors': 'Fuel mixture and injectors',
    '12 V': '12 V battery', 'Wear and service': 'Wear and service',
};
module.exports = { T, PATTERNS, GROUPS };
