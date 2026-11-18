# Readings a tile can show

Made by `tools/gen_extras.js`. Each tile (Settings > Tile 1 ... Tile 6) takes any of these, listed by group as in the settings.

The first 48 readings of each tile's list are the curated ones (README.md). The rest come from the car itself (what it sends the head unit on its own) or from the engine computer (asked with read-only requests while a tile shows them). Where both have the same value, the title says which. `(estimated scale)` marks a value whose scaling is a best guess; "raw number" and "code" readings are for people who know what they mean.

**12 V battery**

- 12 V battery voltage [V]  (tile: 12V VOLTAGE)
- 12 V battery current [A]  (tile: 12V CURRENT)
- 12 V battery temperature [°C]  (tile: 12V TEMP)
- 12 V battery charge [%]  (tile: 12V CHARGE 2)
- 12 V battery health [%]  (tile: 12V HEALTH)
- Alternator current [A]  (tile: ALTERNATOR)

**Advanced: raw numbers**

- Wheel rotation speed, front left (raw number)  (tile: WHEEL FL)
- Wheel rotation speed, front right (raw number)  (tile: WHEEL FR)
- Wheel rotation speed, rear left (raw number)  (tile: WHEEL RL)
- Wheel rotation speed, rear right (raw number)  (tile: WHEEL RR)
- Road gradient, uphill or downhill (raw number)  (tile: GRADIENT)
- Road slope, sideways (raw number)  (tile: SLOPE SIDE)
- Vehicle weight (raw number)  (tile: WEIGHT)
- ABS status (code)  (tile: ABS CODE)
- Traction control status (code)  (tile: TRACTION CODE)
- Stability control status (code)  (tile: STABILITY CODE)
- Driver is braking (code)  (tile: BRAKING)

**Driving**

- Gear and selector position (P, R, N, D1...)  (tile: GEAR)
- Drive mode (Comfort, Sport ...)  (tile: DRIVE MODE)
- Body roll rate (sideways tilt) [°/s]  (tile: ROLL RATE)
- Body pitch rate (forward tilt) [°/s]  (tile: PITCH RATE)
- Parking brake (applied or released)  (tile: PARK BRAKE)
- 12 V battery charge [%]  (tile: 12V CHARGE)
- Engine oil level (dipstick sensor)  (tile: OIL LEVEL)

**Engine**

- Engine power (worked out from torque and speed)  (tile: POWER)
- Engine power, % of maximum [%]  (tile: POWER %)
- Engine torque, % of maximum [%]  (tile: TORQUE %)
- Maximum engine power (scale of the sport display)  (tile: MAX POWER)
- Maximum engine torque (scale of the sport display)  (tile: MAX TORQUE)
- Turbo boost pressure [bar]  (tile: BOOST)
- Turbo boost pressure, highest so far [bar]  (tile: BOOST PEAK)
- Accelerator pedal position [%]  (tile: PEDAL)
- Coolant temperature (from the car) [°C]  (tile: COOLANT)
- Engine oil temperature (from the car) [°C]  (tile: OIL)
- Engine oil temperature (second reading) [°C]  (tile: OIL 2)
- Engine state (running or not)  (tile: ENGINE STATE)
- Auto start-stop state  (tile: START-STOP)
- Engine speed (rpm) [rpm]  (tile: RPM)
- Engine load [%]  (tile: LOAD)
- Accelerator pedal position (engine computer) [%]  (tile: PEDAL 2)
- Throttle valve opening [%]  (tile: THROTTLE)
- Engine torque (engine computer) [Nm]  (tile: TORQUE)
- Engine power (engine computer)  (tile: POWER 2)
- Vehicle speed (engine computer) [km/h]  (tile: SPEED)
- Gear (engine computer)  (tile: GEAR 2)
- Time since the engine started [s]  (tile: RUN TIME)

**Engine oil**

- Oil pressure (above the outside air pressure) [bar]  (tile: OIL PRESSURE)
- Oil pressure (absolute) [bar]  (tile: OIL PRESS ABS)
- Oil level above the minimum mark [l]  (tile: OIL ABOVE MIN)
- Oil level (dipstick height) [mm]  (tile: OIL LEVEL 2)
- Oil life left, by engine hours [%]  (tile: OIL LIFE HRS)
- Oil life left, by fuel used [%]  (tile: OIL LIFE FUEL)
- Engine hours on this oil [h]  (tile: OIL HOURS)
- Distance driven on this oil [km]  (tile: OIL KM)
- Fuel diluting the oil [g]  (tile: FUEL IN OIL)
- Oil pump load [%]  (tile: OIL PUMP)

**Fuel**

- Fuel in the tank (engine computer) [l]  (tile: FUEL TANK 2)
- Fuel in the left half of the tank [l]  (tile: TANK LEFT 2)
- Fuel in the right half of the tank [l]  (tile: TANK RIGHT 2)
- Fuel tank level [%]  (tile: TANK LEVEL)
- Fuel pressure, high pressure side (fuel rail) [bar]  (tile: RAIL PRESSURE)
- Fuel pressure, high pressure side, target [bar]  (tile: RAIL TARGET)
- Fuel pressure, low pressure side (from the tank pump) [bar]  (tile: LOW PRESS FUEL)
- Fuel flow (litres per hour) [l/h]  (tile: FUEL FLOW)
- Fuel flow by weight (kg per hour) [kg/h]  (tile: FUEL KG/H)
- Ethanol share of the fuel [%]  (tile: ETHANOL)

**Fuel and trip computer**

- Fuel in the tank (from the car) [l]  (tile: FUEL TANK)
- Fuel in the left half of the tank [l]  (tile: TANK LEFT)
- Fuel in the right half of the tank [l]  (tile: TANK RIGHT)
- Range on the current tank [km]  (tile: RANGE)
- Odometer [km]  (tile: ODOMETER)
- Average consumption in the car's trip computer 1 (not always this trip)  (tile: CAR AVG 1)
- Average speed in the car's trip computer 1 (not always this trip)  (tile: CAR SPEED 1)
- Average consumption in the car's trip computer 2 (not always this trip)  (tile: CAR AVG 2)
- Average speed in the car's trip computer 2 (not always this trip)  (tile: CAR SPEED 2)
- Driving time of the trip  (tile: TRIP TIME)
- Distance of the trip [km]  (tile: TRIP KM)

**Fuel mixture and injectors**

- Air-fuel ratio, lambda (1.00 = ideal)  (tile: LAMBDA)
- Air-fuel ratio, lambda target  (tile: LAMBDA TARGET)
- Fuel correction, short term [%]  (tile: CORR SHORT)
- Fuel correction, long term [%]  (tile: CORR LONG)
- Fuel mixture, learned factor  (tile: MIXTURE LEARN)
- Injector flow, learned factor (average)  (tile: INJECTOR LEARN)
- Injector correction, cylinder 1  (tile: INJECTOR CYL 1)
- Injector correction, cylinder 2  (tile: INJECTOR CYL 2)
- Injector correction, cylinder 3  (tile: INJECTOR CYL 3)
- Injector correction, cylinder 4  (tile: INJECTOR CYL 4)

**Fuel quality**

- Fuel quality (octane number, RON) [RON]  (tile: OCTANE)
- Time since the last refuelling [h]  (tile: SINCE REFUEL)
- Refuellings with low quality fuel  (tile: LOW QUALITY)
- Refuellings with medium quality fuel  (tile: MEDIUM QUALITY)
- Refuellings with high quality fuel  (tile: HIGH QUALITY)
- Odometer at refuelling 1 (of the last five) [km]  (tile: REFUEL 1 KM)
- Odometer at refuelling 2 (of the last five) [km]  (tile: REFUEL 2 KM)
- Odometer at refuelling 3 (of the last five) [km]  (tile: REFUEL 3 KM)
- Odometer at refuelling 4 (of the last five) [km]  (tile: REFUEL 4 KM)
- Odometer at refuelling 5 (of the last five) [km]  (tile: REFUEL 5 KM)

**Ignition, misfires and knocking**

- Ignition timing [°]  (tile: IGNITION)
- Ignition timing, cylinder 1 [°]  (tile: IGNITION CYL 1)
- Ignition timing, cylinder 2 [°]  (tile: IGNITION CYL 2)
- Ignition timing, cylinder 3 [°]  (tile: IGNITION CYL 3)
- Ignition timing, cylinder 4 [°]  (tile: IGNITION CYL 4)
- Knock control: ignition pulled back (average) [°]  (tile: KNOCK RETARD)
- Knock control: learned correction [°]  (tile: KNOCK LEARNED)
- Misfires counted, cylinder 1  (tile: MISFIRE CYL 1)
- Misfires counted, cylinder 2  (tile: MISFIRE CYL 2)
- Misfires counted, cylinder 3  (tile: MISFIRE CYL 3)
- Misfires counted, cylinder 4  (tile: MISFIRE CYL 4)
- Misfires counted, cylinder 5  (tile: MISFIRE CYL 5)
- Misfires counted, cylinder 6  (tile: MISFIRE CYL 6)
- Rough running, cylinder 1  (tile: ROUGH CYL 1)
- Rough running, cylinder 2  (tile: ROUGH CYL 2)
- Rough running, cylinder 3  (tile: ROUGH CYL 3)
- Rough running, cylinder 4  (tile: ROUGH CYL 4)
- Rough running, cylinder 5  (tile: ROUGH CYL 5)
- Rough running, cylinder 6  (tile: ROUGH CYL 6)

**Temperatures**

- Coolant temperature (engine computer) [°C]  (tile: COOLANT 2)
- Coolant temperature at the radiator outlet [°C]  (tile: RADIATOR OUT)
- Engine oil temperature after the oil filter [°C]  (tile: OIL (FILTER))
- Engine oil temperature in the oil pan [°C]  (tile: OIL PAN)
- Intake air temperature (engine computer) [°C]  (tile: INTAKE AIR)
- Air temperature after the turbo, before the throttle [°C]  (tile: CHARGE AIR)
- Outside temperature (engine computer) [°C]  (tile: OUTSIDE)
- Gearbox temperature (engine computer) [°C]  (tile: GEARBOX)
- Fuel temperature [°C]  (tile: FUEL TEMP)
- Engine computer temperature [°C]  (tile: COMPUTER TEMP)
- Exhaust temperature after the catalytic converter (calculated) [°C]  (tile: EXHAUST TEMP)
- Particulate filter temperature [°C]  (tile: FILTER TEMP)
- Catalytic converter temperature [°C]  (tile: CATALYST TEMP)

**Turbo and air**

- Turbo boost pressure (engine computer) [bar]  (tile: BOOST 2)
- Air pressure before the throttle (absolute) [bar]  (tile: THROTTLE PRESS)
- Turbo boost pressure, target (absolute) [bar]  (tile: BOOST TARGET)
- Turbo boost pressure, difference from the target [hPa]  (tile: BOOST ERROR)
- Intake manifold pressure [bar]  (tile: MANIFOLD PRESS)
- Outside air pressure [hPa]  (tile: AIR PRESSURE)
- Air flow into the engine [kg/h]  (tile: AIR FLOW)
- Engine air fill (% of the maximum) [%]  (tile: AIR FILL)
- Wastegate opening (0 = closed) [%]  (tile: WASTEGATE)
- Wastegate actuator load [%]  (tile: WASTEGATE LOAD)

**Tyres**

- Recommended tyre pressure, front left [bar]  (tile: TYRE SET FL)
- Recommended tyre pressure, front right [bar]  (tile: TYRE SET FR)
- Recommended tyre pressure, rear left [bar]  (tile: TYRE SET RL)
- Recommended tyre pressure, rear right [bar]  (tile: TYRE SET RR)

**Valve timing**

- Intake camshaft angle (VANOS) [°]  (tile: INTAKE CAM)
- Intake camshaft angle, target [°]  (tile: INTAKE CAM TGT)
- Exhaust camshaft angle (VANOS) [°]  (tile: EXHAUST CAM)
- Exhaust camshaft angle, target [°]  (tile: EXH CAM TARGET)
- Intake valve lift (Valvetronic) [mm]  (tile: VALVE LIFT)
- Intake valve lift, target [mm]  (tile: LIFT TARGET)

**Wear and service**

- Spark plugs: distance left [km]  (tile: PLUGS KM LEFT)
- Spark plugs: distance driven [km]  (tile: PLUGS KM)
- Spark plug wear  (tile: PLUG WEAR)
- Soot in the particulate filter [g]  (tile: FILTER SOOT)
- Particulate filter load (learned)  (tile: FILTER LOAD)
- Particulate filter ash (learned)  (tile: FILTER ASH)
- Catalytic converter oxygen storage [mg]  (tile: CATALYST O2)
- Engine operating hours [h]  (tile: ENGINE HOURS)
