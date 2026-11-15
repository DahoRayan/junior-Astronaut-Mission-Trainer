import { CharacterId } from '../core/types';

export type CharacterMood = 'confident' | 'alert' | 'curious' | 'worried' | 'tinkering' | 'calm';

export interface StoryChoice {
  text: string;
  nextIndex?: number;
  consequence?: string;
  onSelect?: () => void;
}

export interface StoryLine {
  speakerId: CharacterId;
  speakerName: string;
  role: string;
  mood?: CharacterMood;
  text: string;
  shake?: boolean;
  sfx?: 'blip' | 'alarm' | 'fanfare' | 'radio';
  choices?: StoryChoice[];
}

export interface StoryScene {
  id: string;
  chapter: number;
  title: string;
  location: string;
  lines: StoryLine[];
}

export const STORY_SCENES: Record<string, StoryScene> = {
  "S-PRO-1": {
    "id": "S-PRO-1",
    "chapter": 0,
    "title": "PROLOGUE: TOUCHDOWN",
    "location": "Shackleton Crater Rim — Landing Site",
    "lines": [
      {
        "speakerId": "narrator",
        "speakerName": "Mission Log",
        "role": "Telemetry & Atmosphere",
        "mood": "calm",
        "text": "◈ [The Artemis Lunar Lander touches down on grey lunar regolith. Dust settles.]"
      },
      {
        "speakerId": "milo",
        "speakerName": "M.I.L.O.",
        "role": "AI Logistics Operator",
        "mood": "confident",
        "text": "Touchdown confirmed on Shackleton Crater Rim! First Light Outpost systems online.",
        "sfx": "fanfare"
      },
      {
        "speakerId": "leo",
        "speakerName": "Capt. Leo Ruiz",
        "role": "Mission Commander",
        "mood": "confident",
        "text": "Welcome to the Moon, Commander! Shackleton Rim is one of the harshest places in the solar system. Our survival depends entirely on the machines working around us."
      },
      {
        "speakerId": "milo",
        "speakerName": "M.I.L.O.",
        "role": "AI Logistics Operator",
        "mood": "calm",
        "text": "All telemetry channels are streaming. Let us tour each base sector so you understand how every machine keeps our crew alive.",
        "choices": [
          {
            "text": "Take the Systems Tour of our Pre-Built Base",
            "consequence": "Touring all 12 outpost life-support and energy machines..."
          },
          {
            "text": "Start building my own base from scratch",
            "consequence": "Grid cleared with 1400 materials. Build freely!"
          }
        ]
      }
    ]
  },
  "S-BASE-TOUR": {
    "id": "S-BASE-TOUR",
    "chapter": 1,
    "title": "BASE SYSTEMS TOUR",
    "location": "Shackleton Crater Rim — Outpost Complex",
    "lines": [
      {
        "speakerId": "narrator",
        "speakerName": "Mission Log",
        "role": "Telemetry & Atmosphere",
        "mood": "calm",
        "text": "◈ [Holographic telemetry highlights the glowing First Light Outpost complex.]"
      },
      {
        "speakerId": "milo",
        "speakerName": "M.I.L.O.",
        "role": "AI Logistics Operator",
        "mood": "curious",
        "text": "Welcome to First Light Outpost, Commander! You are looking at a complete, self-sustaining lunar survival base on Shackleton Crater Rim."
      },
      {
        "speakerId": "leo",
        "speakerName": "Capt. Leo Ruiz",
        "role": "Mission Commander",
        "mood": "confident",
        "text": "Our lives depend on every machine here working together in balance. Without them, the vacuum and radiation are fatal. Let's inspect each sector so you understand how they keep us alive."
      },
      {
        "speakerId": "amir",
        "speakerName": "Amir Haddad",
        "role": "Systems Engineer",
        "mood": "tinkering",
        "text": "First up: ENERGY! Look at our 8 Solar Panels along the sunlit ridge. They convert sunlight into 160 kW of clean electrical power. But lunar dust settles on them constantly—so we must clean them regularly to keep power flowing!"
      },
      {
        "speakerId": "amir",
        "speakerName": "Amir Haddad",
        "role": "Systems Engineer",
        "mood": "worried",
        "text": "Right beside them are 8 Battery Banks storing 800 kWh of energy. When the 12-hour lunar night falls, solar power drops to zero. Our batteries release stored power to keep the base alive until sunrise."
      },
      {
        "speakerId": "amir",
        "speakerName": "Amir Haddad",
        "role": "Systems Engineer",
        "mood": "tinkering",
        "text": "And linking everything are our Power Cables—the heavy-duty electrical grid routing wattage between every generator, battery, and life-support machine."
      },
      {
        "speakerId": "daniel",
        "speakerName": "Dr. Daniel Park",
        "role": "Medical Officer",
        "mood": "worried",
        "text": "Next: ATMOSPHERE & BREATHING. The four of us exhale toxic carbon dioxide with every breath. Without our 2 CO₂ Scrubbers, CO₂ would poison our blood within hours. They filter out 4 kg of toxic gas every single hour."
      },
      {
        "speakerId": "nia",
        "speakerName": "Dr. Nia Okafor",
        "role": "Science Officer",
        "mood": "curious",
        "text": "And for fresh air, meet our Oxygen Electrolyzer! It splits liquid water (H₂O) into hydrogen and breathable oxygen, generating +2.5 kg of pure oxygen per hour."
      },
      {
        "speakerId": "nia",
        "speakerName": "Dr. Nia Okafor",
        "role": "Science Officer",
        "mood": "curious",
        "text": "To supply water for breathing and drinking, our Water Recycling System purifies wastewater and humidity, reclaiming +3 liters of clean water every hour."
      },
      {
        "speakerId": "daniel",
        "speakerName": "Dr. Daniel Park",
        "role": "Medical Officer",
        "mood": "confident",
        "text": "And if our primary loop ever drops below safe levels, the Emergency Oxygen Generator acts as our backup lifeline to immediately pressurize the cabin.",
        "sfx": "fanfare"
      },
      {
        "speakerId": "amir",
        "speakerName": "Amir Haddad",
        "role": "Systems Engineer",
        "mood": "confident",
        "text": "Don't forget the extreme cold! Outside in shadow it drops to -180°C. Our automated Heating System pumps warmth through the core, maintaining cabin temperature safely at 21°C.",
        "sfx": "fanfare"
      },
      {
        "speakerId": "nia",
        "speakerName": "Dr. Nia Okafor",
        "role": "Science Officer",
        "mood": "curious",
        "text": "Over in the Green Dome is our Growth Farm. Plants recycle carbon dioxide, produce supplemental oxygen, and grow fresh food to keep crew morale high and hunger away."
      },
      {
        "speakerId": "leo",
        "speakerName": "Capt. Leo Ruiz",
        "role": "Mission Commander",
        "mood": "confident",
        "text": "Up top is our Lunar Soil Radiation Shield—a thick blanket of regolith blocking deadly cosmic rays. And if an X-class solar flare strikes, we evacuate to the Subterranean Storm Vault!"
      },
      {
        "speakerId": "leo",
        "speakerName": "Capt. Leo Ruiz",
        "role": "Mission Commander",
        "mood": "tinkering",
        "text": "Finally, our Earth Connection Channel keeps high-gain communication streaming to Houston, allowing emergency cargo resupplies when resources run thin."
      },
      {
        "speakerId": "milo",
        "speakerName": "M.I.L.O.",
        "role": "AI Logistics Operator",
        "mood": "calm",
        "text": "Systems briefing complete. The outpost is yours to command! You can continue managing this pre-built base, or select 'Start building my own base' to design your own from scratch.",
        "choices": [
          {
            "text": "Acknowledge all systems and take command of the Outpost!",
            "consequence": "All systems green! Outpost under your command."
          },
          {
            "text": "Switch to custom mode: wipe grid and build my own base",
            "consequence": "1400 Materials granted. Build freely!"
          }
        ]
      }
    ]
  },
  "S-C1-1": {
    "id": "S-C1-1",
    "chapter": 1,
    "title": "CHAPTER 1: HABITAT DEPLOYMENT",
    "location": "Sector Alpha — Outpost Perimeter",
    "lines": [
      {
        "speakerId": "amir",
        "speakerName": "Amir Haddad",
        "role": "Systems Engineer",
        "mood": "tinkering",
        "text": "Power lines connected! 40 kilowatts of solar energy are pouring into the main breaker!"
      },
      {
        "speakerId": "leo",
        "speakerName": "Capt. Leo Ruiz",
        "role": "Mission Commander",
        "mood": "tinkering",
        "text": "Outstanding work, Commander! With the power grid online, the habitat lights are on and our systems are fully operational."
      },
      {
        "speakerId": "milo",
        "speakerName": "M.I.L.O.",
        "role": "AI Logistics Operator",
        "mood": "calm",
        "text": "Base telemetry unlocked. All life-support, oxygen, and resource monitoring channels are now active."
      }
    ]
  },
  "S-C1-2": {
    "id": "S-C1-2",
    "chapter": 1,
    "title": "CHAPTER 1: LIFE SUPPORT ACTIVATION",
    "location": "Hab Module — CDRA Atmosphere Bay",
    "lines": [
      {
        "speakerId": "narrator",
        "speakerName": "Mission Log",
        "role": "Telemetry & Atmosphere",
        "mood": "calm",
        "text": "◈ [A shrill alarm echoes through the habitat.]"
      },
      {
        "speakerId": "milo",
        "speakerName": "M.I.L.O.",
        "role": "AI Logistics Operator",
        "mood": "alert",
        "text": "CRITICAL ALERT: Primary compressed oxygen tank pressure dropping to zero! Valve fracture detected!",
        "sfx": "alarm",
        "shake": true
      },
      {
        "speakerId": "daniel",
        "speakerName": "Dr. Daniel Park",
        "role": "Medical Officer",
        "mood": "worried",
        "text": "Our reserve oxygen is blowing into the vacuum! We have less than 48 hours of breathable air in the habitat!"
      },
      {
        "speakerId": "leo",
        "speakerName": "Capt. Leo Ruiz",
        "role": "Mission Commander",
        "mood": "confident",
        "text": "Stay calm, team! Panic consumes more oxygen. Commander, open the deep-space transmitter! We need to demand an emergency high-speed cargo resupply from Earth right now!"
      },
      {
        "speakerId": "narrator",
        "speakerName": "Mission Log",
        "role": "Telemetry & Atmosphere",
        "mood": "calm",
        "text": "◈ [Player opens the Earth Logistics Menu and clicks Demand Emergency Oxygen Resupply.]"
      },
      {
        "speakerId": "milo",
        "speakerName": "M.I.L.O.",
        "role": "AI Logistics Operator",
        "mood": "calm",
        "text": "Emergency transmission received by NASA Kennedy Space Center. Rapid-response Falcon Heavy cargo rocket launched with replacement O₂ pods."
      },
      {
        "speakerId": "milo",
        "speakerName": "M.I.L.O.",
        "role": "AI Logistics Operator",
        "mood": "calm",
        "text": "Estimated transit time: 2 Sols. Cabin oxygen reserves are draining.",
        "choices": [
          {
            "text": "Connect power cable from solar array to oxygen electrolyzer",
            "consequence": "Power circuit closed: 10 kW flowing to life support!"
          },
          {
            "text": "Verify battery bank charge capacity before engaging",
            "consequence": "Batteries primed for upcoming solar cycle."
          }
        ]
      }
    ]
  },
  "S-C1-3": {
    "id": "S-C1-3",
    "chapter": 1,
    "title": "CHAPTER 1: PRIMARY VALVE FRACTURE",
    "location": "Cryo-Tank Station — Main Oxygen Line",
    "lines": [
      {
        "speakerId": "narrator",
        "speakerName": "Mission Log",
        "role": "Telemetry & Atmosphere",
        "mood": "calm",
        "text": "◈ [Player must shed non-vital power, seal interior airlocks, and keep the crew rested to preserve oxygen until the cargo lander thumps down outside.]"
      },
      {
        "speakerId": "amir",
        "speakerName": "Amir Haddad",
        "role": "Systems Engineer",
        "mood": "tinkering",
        "text": "Cargo lander has touched down! I'm suiting up to haul the new oxygen tanks into the airlock!"
      },
      {
        "speakerId": "narrator",
        "speakerName": "Mission Log",
        "role": "Telemetry & Atmosphere",
        "mood": "calm",
        "text": "◈ [Amir replaces the tank. The oxygen gauge surges back to 100%.]"
      },
      {
        "speakerId": "leo",
        "speakerName": "Capt. Leo Ruiz",
        "role": "Mission Commander",
        "mood": "confident",
        "text": "Air pressure restored. That was too close, Commander. If that rocket had been delayed by half a day, we wouldn't have survived.",
        "choices": [
          {
            "text": "Demand emergency Earth resupply lander via Deep Space Network",
            "consequence": "Earth Connection Channel transmitting telemetry. Resupply lander launched!"
          }
        ]
      }
    ]
  },
  "S-C2-1": {
    "id": "S-C2-1",
    "chapter": 2,
    "title": "CHAPTER 2: THE LONG NIGHT",
    "location": "Solar Rim Ridge — Shadow Threshold",
    "lines": [
      {
        "speakerId": "milo",
        "speakerName": "M.I.L.O.",
        "role": "AI Logistics Operator",
        "mood": "alert",
        "text": "Warning: Orbital sun angle declining. A massive mountain ridge will cast a total shadow over the base for 48 consecutive hours.",
        "sfx": "alarm",
        "shake": true
      },
      {
        "speakerId": "amir",
        "speakerName": "Amir Haddad",
        "role": "Systems Engineer",
        "mood": "tinkering",
        "text": "Without direct sunlight, our solar panels won't produce a single watt. Outside temperature will plummet to −180 °C."
      },
      {
        "speakerId": "daniel",
        "speakerName": "Dr. Daniel Park",
        "role": "Medical Officer",
        "mood": "worried",
        "text": "If our electric heaters shut down, the habitat interior will drop below freezing in two hours. Human blood cannot circulate in extreme cold. The crew will freeze to death."
      },
      {
        "speakerId": "leo",
        "speakerName": "Capt. Leo Ruiz",
        "role": "Mission Commander",
        "mood": "tinkering",
        "text": "Commander, build high-capacity battery banks immediately. We must store every joule of excess solar power before the shadow arrives."
      },
      {
        "speakerId": "narrator",
        "speakerName": "Mission Log",
        "role": "Telemetry & Atmosphere",
        "mood": "calm",
        "text": "◈ [Player builds Battery Banks and toggles off research labs and floodlights.]",
        "choices": [
          {
            "text": "Engage load-shedding protocol: shut down non-essential systems",
            "consequence": "Farm grow-lights offline. Power conserved for life support heaters!"
          },
          {
            "text": "Reroute battery heating loop through secondary bus",
            "consequence": "Thermal bus active. Core temperature stabilized at 21°C."
          }
        ]
      }
    ]
  },
  "S-C2-2": {
    "id": "S-C2-2",
    "chapter": 2,
    "title": "CHAPTER 2: SUNRISE OVER SHACKLETON",
    "location": "Shackleton Rim — Solar Farm",
    "lines": [
      {
        "speakerId": "narrator",
        "speakerName": "Mission Log",
        "role": "Telemetry & Atmosphere",
        "mood": "calm",
        "text": "◈ [Total darkness falls across the base. The base switches to battery power.]"
      },
      {
        "speakerId": "milo",
        "speakerName": "M.I.L.O.",
        "role": "AI Logistics Operator",
        "mood": "calm",
        "text": "Solar generation: 0.0 kW. Battery discharge active."
      },
      {
        "speakerId": "amir",
        "speakerName": "Amir Haddad",
        "role": "Systems Engineer",
        "mood": "tinkering",
        "text": "Captain! The exterior cooling lines on Battery Bank 2 are freezing solid! The battery can't release power when frozen!"
      },
      {
        "speakerId": "daniel",
        "speakerName": "Dr. Daniel Park",
        "role": "Medical Officer",
        "mood": "worried",
        "text": "Cabin temperature is falling fast: 18 °C... 12 °C... 6 °C! We're shivering uncontrollably!"
      },
      {
        "speakerId": "leo",
        "speakerName": "Capt. Leo Ruiz",
        "role": "Mission Commander",
        "mood": "tinkering",
        "text": "Amir, reroute emergency heating loops to the battery core! Commander, switch auxiliary power to the thermal grid!"
      },
      {
        "speakerId": "narrator",
        "speakerName": "Mission Log",
        "role": "Telemetry & Atmosphere",
        "mood": "calm",
        "text": "◈ [Player reroutes the circuit on the thermal panel. Warm coolant pulses through the battery casing.]"
      },
      {
        "speakerId": "amir",
        "speakerName": "Amir Haddad",
        "role": "Systems Engineer",
        "mood": "tinkering",
        "text": "Coolant thawed! Power is surging through the main bus! Heaters are back online!"
      },
      {
        "speakerId": "daniel",
        "speakerName": "Dr. Daniel Park",
        "role": "Medical Officer",
        "mood": "worried",
        "text": "Cabin temperature stabilizing at 21 °C. Good thinking, Commander."
      }
    ]
  },
  "S-C3-1": {
    "id": "S-C3-1",
    "chapter": 3,
    "title": "CHAPTER 3: CME SOLAR STORM WARNING",
    "location": "Outpost Communications Mast",
    "lines": [
      {
        "speakerId": "nia",
        "speakerName": "Dr. Nia Okafor",
        "role": "Science Officer",
        "mood": "curious",
        "text": "Commander! NASA DONKI has detected a Category X solar flare on the Sun's surface at sunspot 4109."
      },
      {
        "speakerId": "milo",
        "speakerName": "M.I.L.O.",
        "role": "AI Logistics Operator",
        "mood": "calm",
        "text": "A Coronal Mass Ejection is traveling directly along the Earth-Moon line. High-energy proton shockwave will hit our coordinates in approximately 90 minutes."
      },
      {
        "speakerId": "leo",
        "speakerName": "Capt. Leo Ruiz",
        "role": "Mission Commander",
        "mood": "confident",
        "text": "Our inflatable habitat walls are thin aluminum and Kevlar. They won't stop cosmic protons. We need heavy shielding."
      },
      {
        "speakerId": "nia",
        "speakerName": "Dr. Nia Okafor",
        "role": "Science Officer",
        "mood": "curious",
        "text": "We need two layers: pile lunar regolith over the roof using the automated scooper, and retreat into the underground storm vault surrounded by our water tanks."
      },
      {
        "speakerId": "narrator",
        "speakerName": "Mission Log",
        "role": "Telemetry & Atmosphere",
        "mood": "calm",
        "text": "◈ [Player builds Regolith Shielding and moves crew to the Underground Storm Vault.]",
        "choices": [
          {
            "text": "Sound general base evacuation to subterranean storm vault",
            "consequence": "All 4 astronauts safe in vault behind regolith shield."
          }
        ]
      }
    ]
  },
  "S-C3-2": {
    "id": "S-C3-2",
    "chapter": 3,
    "title": "CHAPTER 3: RADIATION IMPACT",
    "location": "Subterranean Storm Vault",
    "lines": [
      {
        "speakerId": "narrator",
        "speakerName": "Mission Log",
        "role": "Telemetry & Atmosphere",
        "mood": "calm",
        "text": "◈ [The radiation storm strikes. Exterior sensors read off the charts.]"
      },
      {
        "speakerId": "milo",
        "speakerName": "M.I.L.O.",
        "role": "AI Logistics Operator",
        "mood": "calm",
        "text": "Exterior radiation levels spiking: 140 mSv/h. Outside exposure would cause fatal acute radiation poisoning within 15 minutes."
      },
      {
        "speakerId": "daniel",
        "speakerName": "Dr. Daniel Park",
        "role": "Medical Officer",
        "mood": "confident",
        "text": "The water tanks and lunar soil are absorbing the particles. Interior dosimeter reads safe.",
        "sfx": "fanfare"
      },
      {
        "speakerId": "amir",
        "speakerName": "Amir Haddad",
        "role": "Systems Engineer",
        "mood": "confident",
        "text": "Hear that static on the radio? The Sun is throwing everything it's got at us. But we're safe underground.",
        "sfx": "fanfare"
      },
      {
        "speakerId": "leo",
        "speakerName": "Capt. Leo Ruiz",
        "role": "Mission Commander",
        "mood": "confident",
        "text": "The Moon gave us the weapon to defend ourselves: its own soil. Outstanding preparation, Commander."
      }
    ]
  },
  "S-C4-1": {
    "id": "S-C4-1",
    "chapter": 4,
    "title": "CHAPTER 4: HYDROPONIC EXPEDITION",
    "location": "Permanent Shadow Crater Basin",
    "lines": [
      {
        "speakerId": "daniel",
        "speakerName": "Dr. Daniel Park",
        "role": "Medical Officer",
        "mood": "worried",
        "text": "Inventory count is complete. Our packaged rations from Earth are down to their last week. If we don't start producing food here, we'll have to abandon the mission."
      },
      {
        "speakerId": "nia",
        "speakerName": "Dr. Nia Okafor",
        "role": "Science Officer",
        "mood": "curious",
        "text": "We're not going anywhere. Inside Shackleton's shadow, there's ancient water ice. If we drill into the permafrost, we can melt it and run our hydroponics."
      },
      {
        "speakerId": "narrator",
        "speakerName": "Mission Log",
        "role": "Telemetry & Atmosphere",
        "mood": "calm",
        "text": "◈ [Player builds Water Extractor and runs power down into the crater.]"
      },
      {
        "speakerId": "milo",
        "speakerName": "M.I.L.O.",
        "role": "AI Logistics Operator",
        "mood": "calm",
        "text": "Water extraction online: +10 L/h of purified water flowing into reservoir tanks.",
        "choices": [
          {
            "text": "Plant Outredgeous lettuce and radishes in growth trays",
            "consequence": "Hydroponic nutrient mist activated! Fresh greens sprouting."
          }
        ]
      }
    ]
  },
  "S-C4-2": {
    "id": "S-C4-2",
    "chapter": 4,
    "title": "CHAPTER 4: THE FIRST HARVEST",
    "location": "Greenhouse Dome — Tray Alpha",
    "lines": [
      {
        "speakerId": "narrator",
        "speakerName": "Mission Log",
        "role": "Telemetry & Atmosphere",
        "mood": "calm",
        "text": "◈ [Hydroponic growth lights turn magenta. Seed trays are slotted into nutrient pipes.]"
      },
      {
        "speakerId": "nia",
        "speakerName": "Dr. Nia Okafor",
        "role": "Science Officer",
        "mood": "curious",
        "text": "Greenhouse trays deployed: lettuce, radishes, and dwarf wheat. The plants absorb our exhaled carbon dioxide and release fresh oxygen while feeding us."
      },
      {
        "speakerId": "narrator",
        "speakerName": "Mission Log",
        "role": "Telemetry & Atmosphere",
        "mood": "calm",
        "text": "◈ [Player builds Greenhouse Trays.]"
      },
      {
        "speakerId": "amir",
        "speakerName": "Amir Haddad",
        "role": "Systems Engineer",
        "mood": "curious",
        "text": "Look at those tiny green sprouts! First time fresh living plants have grown in lunar regolith."
      },
      {
        "speakerId": "leo",
        "speakerName": "Capt. Leo Ruiz",
        "role": "Mission Commander",
        "mood": "confident",
        "text": "From this day on, we aren't visitors surviving on canned food from Earth. We are inhabitants of the Moon."
      }
    ]
  },
  "S-C5-1": {
    "id": "S-C5-1",
    "chapter": 5,
    "title": "CHAPTER 5: COMPOUND MOONQUAKE EMERGENCY",
    "location": "Base Central Power Hub",
    "lines": [
      {
        "speakerId": "narrator",
        "speakerName": "Mission Log",
        "role": "Telemetry & Atmosphere",
        "mood": "calm",
        "text": "◈ [The ground shudders violently. Dust erupts from the crater walls. A loud CRACK echoes through the structure.]"
      },
      {
        "speakerId": "milo",
        "speakerName": "M.I.L.O.",
        "role": "AI Logistics Operator",
        "mood": "tinkering",
        "text": "CRITICAL EMERGENCY: Moonquake detected, Magnitude 5.2! Power distribution bus severed! Habitat pressure dropping rapidly: 70 kPa... 60 kPa!"
      },
      {
        "speakerId": "daniel",
        "speakerName": "Dr. Daniel Park",
        "role": "Medical Officer",
        "mood": "worried",
        "text": "Captain Leo was outside performing exterior maintenance! His suit telemetry says he's trapped at the primary airlock exterior valve!"
      },
      {
        "speakerId": "leo",
        "speakerName": "Capt. Leo Ruiz",
        "role": "Mission Commander",
        "mood": "confident",
        "text": "Comms... cracking... valve jammed by seismic dust... suit oxygen... at 8%... cannot reach the manual override..."
      },
      {
        "speakerId": "amir",
        "speakerName": "Amir Haddad",
        "role": "Systems Engineer",
        "mood": "tinkering",
        "text": "His suit oxygen is almost gone! He has about 60 seconds before he suffocates!",
        "choices": [
          {
            "text": "Reroute emergency power & open jammed airlock valve for Leo",
            "consequence": "Airlock pressure equalized! Captain Ruiz safely pulled inside."
          }
        ]
      }
    ]
  },
  "S-C5-2": {
    "id": "S-C5-2",
    "chapter": 5,
    "title": "CHAPTER 5: THE RESCUE OF CAPT. RUIZ",
    "location": "Hab Main Airlock",
    "lines": [
      {
        "speakerId": "narrator",
        "speakerName": "Mission Log",
        "role": "Telemetry & Atmosphere",
        "mood": "calm",
        "text": "◈ [Toggles emergency batteries directly to the airlock power bus.]"
      },
      {
        "speakerId": "narrator",
        "speakerName": "Mission Log",
        "role": "Telemetry & Atmosphere",
        "mood": "calm",
        "text": "◈ [Cleans the solar panels using automated electrostatic pulse.]"
      },
      {
        "speakerId": "narrator",
        "speakerName": "Mission Log",
        "role": "Telemetry & Atmosphere",
        "mood": "calm",
        "text": "◈ [Reroutes the backup power cable to the primary life-support loop.]"
      },
      {
        "speakerId": "narrator",
        "speakerName": "Mission Log",
        "role": "Telemetry & Atmosphere",
        "mood": "calm",
        "text": "◈ [Presses the emergency repressurization override.]"
      },
      {
        "speakerId": "narrator",
        "speakerName": "Mission Log",
        "role": "Telemetry & Atmosphere",
        "mood": "calm",
        "text": "◈ [The airlock hisses loudly. Pressure equalizes. Inner doors swing open. Daniel and Amir drag Leo inside.]"
      },
      {
        "speakerId": "daniel",
        "speakerName": "Dr. Daniel Park",
        "role": "Medical Officer",
        "mood": "worried",
        "text": "Pulse is strong! He's breathing! Get his helmet off!"
      },
      {
        "speakerId": "leo",
        "speakerName": "Capt. Leo Ruiz",
        "role": "Mission Commander",
        "mood": "confident",
        "text": "Coughing... That... was closer than I like, team."
      },
      {
        "speakerId": "leo",
        "speakerName": "Capt. Leo Ruiz",
        "role": "Mission Commander",
        "mood": "alert",
        "text": "Commander... when every alarm in the base was screaming at once, you didn't freeze. You made the hard calls, you prioritized the right systems, and you brought me home.",
        "sfx": "alarm",
        "shake": true
      },
      {
        "speakerId": "leo",
        "speakerName": "Capt. Leo Ruiz",
        "role": "Mission Commander",
        "mood": "curious",
        "text": "I couldn't have asked for a better officer at the console."
      }
    ]
  },
  "S-EPI-1": {
    "id": "S-EPI-1",
    "chapter": 6,
    "title": "EPILOGUE: FIRST LIGHT DIPLOMA",
    "location": "NASA Mission Control Teleconference",
    "lines": [
      {
        "speakerId": "narrator",
        "speakerName": "Mission Log",
        "role": "Telemetry & Atmosphere",
        "mood": "calm",
        "text": "◈ [The habitat glows softly in the permanent light of the crater rim. Earth hangs in the velvet black sky like a bright jewel.]"
      },
      {
        "speakerId": "leo",
        "speakerName": "Capt. Leo Ruiz",
        "role": "Mission Commander",
        "mood": "curious",
        "text": "Commander, when we landed, Shackleton Crater was an empty, frozen desert ready to swallow us whole."
      },
      {
        "speakerId": "leo",
        "speakerName": "Capt. Leo Ruiz",
        "role": "Mission Commander",
        "mood": "tinkering",
        "text": "You managed our power, you never let our oxygen run out, you called for help when we needed it, and you kept us alive when disaster struck."
      },
      {
        "speakerId": "leo",
        "speakerName": "Capt. Leo Ruiz",
        "role": "Mission Commander",
        "mood": "confident",
        "text": "You aren't just a student anymore. You are a true Mission Commander."
      },
      {
        "speakerId": "narrator",
        "speakerName": "Mission Log",
        "role": "Telemetry & Atmosphere",
        "mood": "calm",
        "text": "◈ [A golden NASA achievement certificate appears on screen.]"
      }
    ]
  },
  "S-EPI-2": {
    "id": "S-EPI-2",
    "chapter": 6,
    "title": "EPILOGUE: THE MARS HORIZON",
    "location": "Shackleton Overlook — Observation Deck",
    "lines": [
      {
        "speakerId": "narrator",
        "speakerName": "Mission Log",
        "role": "Telemetry & Atmosphere",
        "mood": "calm",
        "text": "◈ [M.I.L.O.'s terminal beeps with an encrypted transmission from NASA Deep Space Logistics.]"
      },
      {
        "speakerId": "milo",
        "speakerName": "M.I.L.O.",
        "role": "AI Logistics Operator",
        "mood": "calm",
        "text": "Commander, high-priority transmission incoming from Earth."
      },
      {
        "speakerId": "leo",
        "speakerName": "Capt. Leo Ruiz",
        "role": "Mission Commander",
        "mood": "confident",
        "text": "What does it say, MILO?"
      },
      {
        "speakerId": "milo",
        "speakerName": "M.I.L.O.",
        "role": "AI Logistics Operator",
        "mood": "calm",
        "text": "It concerns a new expedition. Target destination: Mars. Distance: 225 million kilometers."
      },
      {
        "speakerId": "narrator",
        "speakerName": "Mission Log",
        "role": "Telemetry & Atmosphere",
        "mood": "calm",
        "text": "◈ [The screen shifts from the silver Moon to a rotating red globe: MARS.]"
      },
      {
        "speakerId": "amir",
        "speakerName": "Amir Haddad",
        "role": "Systems Engineer",
        "mood": "tinkering",
        "text": "Mars? That's going to take a lot of oxygen tanks!"
      },
      {
        "speakerId": "nia",
        "speakerName": "Dr. Nia Okafor",
        "role": "Science Officer",
        "mood": "curious",
        "text": "Real soil, ancient riverbeds, towering volcanoes... think of the science!"
      },
      {
        "speakerId": "leo",
        "speakerName": "Capt. Leo Ruiz",
        "role": "Mission Commander",
        "mood": "confident",
        "text": "Enjoy this victory, Commander. You earned it. But keep your spacesuit ready... Mars is waiting for us."
      },
      {
        "speakerId": "narrator",
        "speakerName": "Mission Log",
        "role": "Telemetry & Atmosphere",
        "mood": "calm",
        "text": "◈ [Screen fades to stars.]",
        "choices": [
          {
            "text": "Accept commendation & unlock Creative Sandbox Mode",
            "consequence": "All modules unlocked! Full lunar training certification awarded."
          }
        ]
      }
    ]
  }
};
