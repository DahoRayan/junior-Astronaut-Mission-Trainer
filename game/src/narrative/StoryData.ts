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
        "text": "◈ [Black screen. Deep space ambient frequencies. Earth appears as a blue marble, then the camera descends rapidly toward the Moon's South Pole.]"
      },
      {
        "speakerId": "narrator",
        "speakerName": "Narrator",
        "role": "Mission Log",
        "mood": "calm",
        "text": "Three hundred and eighty-four thousand kilometers from Earth, there is a place where no trees grow, no wind blows, and no human can take a single breath without life-support."
      },
      {
        "speakerId": "narrator",
        "speakerName": "Narrator",
        "role": "Mission Log",
        "mood": "curious",
        "text": "This is Shackleton Crater. And the lives of four astronauts are in your hands."
      },
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
        "text": "Touchdown confirmed! Surface telemetry online.",
        "sfx": "fanfare"
      },
      {
        "speakerId": "leo",
        "speakerName": "Capt. Leo Ruiz",
        "role": "Mission Commander",
        "mood": "confident",
        "text": "Houston, Shackleton Rim Base here. The First Light has touched down safely.",
        "sfx": "fanfare"
      },
      {
        "speakerId": "narrator",
        "speakerName": "Mission Log",
        "role": "Telemetry & Atmosphere",
        "mood": "calm",
        "text": "◈ [Leo turns toward the camera, speaking over the direct comm link.]"
      },
      {
        "speakerId": "leo",
        "speakerName": "Capt. Leo Ruiz",
        "role": "Mission Commander",
        "mood": "confident",
        "text": "Commander, good to have you on the console. I'm Captain Leo Ruiz. These three people beside me are my family now—Amir, Nia, and Daniel."
      },
      {
        "speakerId": "leo",
        "speakerName": "Capt. Leo Ruiz",
        "role": "Mission Commander",
        "mood": "worried",
        "text": "Down here, there is no room for mistakes. If our power dies, our heaters die. If our air tanks run dry, we die. We're counting on your spatial planning and quick thinking to keep us alive."
      },
      {
        "speakerId": "amir",
        "speakerName": "Amir Haddad",
        "role": "Systems Engineer",
        "mood": "tinkering",
        "text": "Don't scare the Commander already, Captain! We've got the best tech in the solar system."
      },
      {
        "speakerId": "leo",
        "speakerName": "Capt. Leo Ruiz",
        "role": "Mission Commander",
        "mood": "tinkering",
        "text": "Technology only works if our Commander connects it right, Amir. Let's get to work.",
        "choices": [
          {
            "text": "Acknowledge mission plan & deploy inflatable habitat",
            "consequence": "Unpacking habitat module on grid tile (20, 15)..."
          },
          {
            "text": "Ask M.I.L.O. to run landing sensor calibration first",
            "consequence": "All telemetry arrays calibrated at 100% nominal!"
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
        "speakerId": "milo",
        "speakerName": "M.I.L.O.",
        "role": "AI Logistics Operator",
        "mood": "calm",
        "text": "Unpacking inflatable Crew Habitat. Structural seals engaged."
      },
      {
        "speakerId": "leo",
        "speakerName": "Capt. Leo Ruiz",
        "role": "Mission Commander",
        "mood": "tinkering",
        "text": "Commander, anchor that habitat securely. Then we need power to run the air pumps."
      },
      {
        "speakerId": "narrator",
        "speakerName": "Mission Log",
        "role": "Telemetry & Atmosphere",
        "mood": "calm",
        "text": "◈ [Player places Solar Array and connects the power cable.]"
      },
      {
        "speakerId": "amir",
        "speakerName": "Amir Haddad",
        "role": "Systems Engineer",
        "mood": "tinkering",
        "text": "Power lines connected! Solar wattage is pouring into the main breaker."
      },
      {
        "speakerId": "milo",
        "speakerName": "M.I.L.O.",
        "role": "AI Logistics Operator",
        "mood": "calm",
        "text": "Opening the Compressed Oxygen Reserve"
      },
      {
        "speakerId": "daniel",
        "speakerName": "Dr. Daniel Park",
        "role": "Medical Officer",
        "mood": "worried",
        "text": "Opening the habitat's compressed oxygen valve. Remember: our air isn't infinite. It comes from high-pressure liquid oxygen tanks delivered with the lander."
      },
      {
        "speakerId": "nia",
        "speakerName": "Dr. Nia Okafor",
        "role": "Science Officer",
        "mood": "tinkering",
        "text": "We exhale toxic carbon dioxide with every breath. If the CDRA scrubbers aren't powered, CO₂ will poison our blood within hours."
      },
      {
        "speakerId": "narrator",
        "speakerName": "Mission Log",
        "role": "Telemetry & Atmosphere",
        "mood": "calm",
        "text": "◈ [Player powers the CDRA Scrubber and Habitat ventilation.]"
      },
      {
        "speakerId": "milo",
        "speakerName": "M.I.L.O.",
        "role": "AI Logistics Operator",
        "mood": "calm",
        "text": "Cabin atmosphere balanced at 21% O₂, 101.3 kPa."
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
        "mood": "confident",
        "text": "Commander! Reroute the emergency heating loops to the battery core! Do it before our fingers go numb!"
      },
      {
        "speakerId": "narrator",
        "speakerName": "Mission Log",
        "role": "Telemetry & Atmosphere",
        "mood": "calm",
        "text": "◈ [Player reroutes the circuit on the thermal panel. Heaters ignite. Temperature stabilizes at 21 °C.]"
      },
      {
        "speakerId": "daniel",
        "speakerName": "Dr. Daniel Park",
        "role": "Medical Officer",
        "mood": "worried",
        "text": "Core body temperatures recovering. The heaters saved us."
      },
      {
        "speakerId": "leo",
        "speakerName": "Capt. Leo Ruiz",
        "role": "Mission Commander",
        "mood": "worried",
        "text": "Good work, Commander. You kept our fire burning in the coldest place in the world."
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
        "speakerId": "narrator",
        "speakerName": "Mission Log",
        "role": "Telemetry & Atmosphere",
        "mood": "calm",
        "text": "◈ [Nia's science terminal sounds a frantic pulsating siren.]"
      },
      {
        "speakerId": "nia",
        "speakerName": "Dr. Nia Okafor",
        "role": "Science Officer",
        "mood": "alert",
        "text": "Captain! Look at the NASA DONKI space weather alert! Sunspot 4109 just suffered an X-class solar flare!",
        "sfx": "alarm",
        "shake": true
      },
      {
        "speakerId": "milo",
        "speakerName": "M.I.L.O.",
        "role": "AI Logistics Operator",
        "mood": "calm",
        "text": "A Coronal Mass Ejection is heading directly along the Earth-Moon line. Lethal proton radiation shockwave arrives in 90 minutes."
      },
      {
        "speakerId": "leo",
        "speakerName": "Capt. Leo Ruiz",
        "role": "Mission Commander",
        "mood": "confident",
        "text": "Standard habitat walls are just thin aluminum and Kevlar. If we stay out here, that radiation will destroy our immune systems and kill us in days."
      },
      {
        "speakerId": "nia",
        "speakerName": "Dr. Nia Okafor",
        "role": "Science Officer",
        "mood": "curious",
        "text": "We need two layers of protection: pile lunar regolith over the roof using the automated rover, and prepare the underground storm bunker surrounded by our water tanks!"
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
        "text": "◈ [Screen shakes violently with static. Radiation monitor outside spikes to 140 mSv/h.]"
      },
      {
        "speakerId": "milo",
        "speakerName": "M.I.L.O.",
        "role": "AI Logistics Operator",
        "mood": "calm",
        "text": "Exterior radiation at lethal levels. Anyone outside would suffer fatal organ failure in 15 minutes."
      },
      {
        "speakerId": "daniel",
        "speakerName": "Dr. Daniel Park",
        "role": "Medical Officer",
        "mood": "confident",
        "text": "Inside the bunker, the water tanks and regolith are absorbing the cosmic rays. Dosimeter reads safe.",
        "sfx": "fanfare"
      },
      {
        "speakerId": "leo",
        "speakerName": "Capt. Leo Ruiz",
        "role": "Mission Commander",
        "mood": "confident",
        "text": "Deep breaths, everyone. We wait out the storm together."
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
        "text": "Captain, our packaged rations from Earth are down to their last week. If we don't produce food and water here, starvation will finish us."
      },
      {
        "speakerId": "nia",
        "speakerName": "Dr. Nia Okafor",
        "role": "Science Officer",
        "mood": "curious",
        "text": "Deep inside Shackleton's shadow, there is ancient water ice. If we place an autonomous thermal drill, we can extract pure water."
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
        "text": "Water extraction active: +10 L/h of purified liquid water flowing into habitat tanks.",
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
        "speakerId": "milo",
        "speakerName": "M.I.L.O.",
        "role": "AI Logistics Operator",
        "mood": "calm",
        "text": "The Hydroponics Bay"
      },
      {
        "speakerId": "nia",
        "speakerName": "Dr. Nia Okafor",
        "role": "Science Officer",
        "mood": "curious",
        "text": "Now we plant the hydroponic lettuce and radishes. They drink our recycled wastewater, absorb the CO₂ we breathe out, and give us fresh calories and pure oxygen."
      },
      {
        "speakerId": "narrator",
        "speakerName": "Mission Log",
        "role": "Telemetry & Atmosphere",
        "mood": "calm",
        "text": "◈ [Player builds Greenhouse Trays. Green sprouts grow.]"
      },
      {
        "speakerId": "amir",
        "speakerName": "Amir Haddad",
        "role": "Systems Engineer",
        "mood": "tinkering",
        "text": "Look at that! Real green leaves growing in lunar dust! We can actually live here!"
      },
      {
        "speakerId": "leo",
        "speakerName": "Capt. Leo Ruiz",
        "role": "Mission Commander",
        "mood": "confident",
        "text": "Every meal grown here proves that humanity can survive on another world."
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
        "text": "◈ [The ground quakes violently. Multiple alarm systems scream simultaneously.]"
      },
      {
        "speakerId": "milo",
        "speakerName": "M.I.L.O.",
        "role": "AI Logistics Operator",
        "mood": "calm",
        "text": "CRITICAL CATASTROPHIC FAILURE!"
      },
      {
        "speakerId": "milo",
        "speakerName": "M.I.L.O.",
        "role": "AI Logistics Operator",
        "mood": "tinkering",
        "text": "1. Moonquake has severed the main power conduit to Life Support!"
      },
      {
        "speakerId": "milo",
        "speakerName": "M.I.L.O.",
        "role": "AI Logistics Operator",
        "mood": "calm",
        "text": "2. Massive electrostatic dust cloud blankets all solar arrays!"
      },
      {
        "speakerId": "milo",
        "speakerName": "M.I.L.O.",
        "role": "AI Logistics Operator",
        "mood": "calm",
        "text": "3. Cabin oxygen leaking! Pressure dropping below 70 kPa!"
      },
      {
        "speakerId": "daniel",
        "speakerName": "Dr. Daniel Park",
        "role": "Medical Officer",
        "mood": "worried",
        "text": "The oxygen pumps stopped! Leo... Leo went out to manually seal the exterior emergency valve, but his suit radio is breaking up!"
      },
      {
        "speakerId": "leo",
        "speakerName": "Capt. Leo Ruiz",
        "role": "Mission Commander",
        "mood": "tinkering",
        "text": "(Over crackling static) Commander... the valve is jammed... dust got into the gears... I can't breathe... oxygen running out... you have to... reconnect the power... from your console..."
      },
      {
        "speakerId": "amir",
        "speakerName": "Amir Haddad",
        "role": "Systems Engineer",
        "mood": "tinkering",
        "text": "The Captain is dying out there on the surface! We have 60 seconds before he suffocates, and then our own habitat air runs out!",
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
        "text": "◈ [Player executes under intense tension: (1) Toggles emergency batteries directly to the airlock power bus. (2) Cleans the solar panels using automated electrostatic pulse. (3) Reroutes the backup power cable to the primary life-support loop. (4) Presses the emergency repressurization override.]"
      },
      {
        "speakerId": "milo",
        "speakerName": "M.I.L.O.",
        "role": "AI Logistics Operator",
        "mood": "tinkering",
        "text": "Power circuit restored! Oxygen pressure climbing! Airlock repressurized!"
      },
      {
        "speakerId": "narrator",
        "speakerName": "Mission Log",
        "role": "Telemetry & Atmosphere",
        "mood": "calm",
        "text": "◈ [Airlock hisses open. Amir and Daniel drag Captain Leo Ruiz inside, pulling off his helmet. He gasps for air.]"
      },
      {
        "speakerId": "daniel",
        "speakerName": "Dr. Daniel Park",
        "role": "Medical Officer",
        "mood": "worried",
        "text": "He's breathing! Pulse is returning! Leo, look at me!"
      },
      {
        "speakerId": "leo",
        "speakerName": "Capt. Leo Ruiz",
        "role": "Mission Commander",
        "mood": "confident",
        "text": "(Coughing, then smiling faintly) Good job... Commander. You saved my life... you saved all of us."
      },
      {
        "speakerId": "amir",
        "speakerName": "Amir Haddad",
        "role": "Systems Engineer",
        "mood": "tinkering",
        "text": "We did it! The base held! Everything is green!"
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
        "text": "◈ [The camera pans through a magnificent, glowing lunar base with greenhouses, batteries, and observation domes. Earth shines brightly overhead.]"
      },
      {
        "speakerId": "milo",
        "speakerName": "M.I.L.O.",
        "role": "AI Logistics Operator",
        "mood": "calm",
        "text": "Simulation debrief complete. Survival Rate: 100%. Life-Support Uptime: 98.4%."
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
        "text": "◈ [A golden NASA achievement certificate appears on screen (see certificate in story-bible.json).]"
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
