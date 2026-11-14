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
  // PROLOGUE: Touchdown on the Moon
  prologue: {
    id: 'prologue',
    chapter: 0,
    title: 'PROLOGUE: THE SELECTION',
    location: 'Shackleton Crater Rim — Sector Alpha',
    lines: [
      {
        speakerId: 'elena',
        speakerName: 'Capt. Elena Ruiz',
        role: 'Mission Commander',
        mood: 'confident',
        text: 'Touchdown confirmed on Shackleton Crater Rim! Artemis base site is secure. Crew, check your spacesuit pressure and prep for First Light.',
        sfx: 'radio',
      },
      {
        speakerId: 'milo',
        speakerName: 'M.I.L.O.',
        role: 'AI Logistics Operator',
        mood: 'calm',
        text: 'Telemetry streaming at 100% fidelity. Greetings, Junior Mission Commander! I am M.I.L.O., your co-pilot. My predictive circuits are at your service.',
      },
      {
        speakerId: 'amir',
        speakerName: 'Amir Haddad',
        role: 'Systems Engineer',
        mood: 'tinkering',
        text: 'Look at that solar horizon! The ridge is receiving direct sunlight, but the crater basin below is in pitch-black shadow. We need to deploy our arrays immediately!',
      },
      {
        speakerId: 'nia',
        speakerName: 'Dr. Nia Okafor',
        role: 'Science Officer',
        mood: 'curious',
        text: 'And inside those shadowed craters are billions of tons of ancient water ice at -230°C. If we can mine that ice, we can create infinite rocket fuel and breathable oxygen!',
      },
      {
        speakerId: 'daniel',
        speakerName: 'Dr. Daniel Park',
        role: 'Medical Officer',
        mood: 'alert',
        text: 'Remember, everyone: our EVA life support backpacks only hold 2 hours of reserve air. Commander, let\'s prioritize the primary base grid first.',
        choices: [
          {
            text: '"Understood, Daniel. Amir, let\'s deploy the Solar Array on the sunlit ridge!"',
            consequence: 'Prioritizing immediate power generation on the high ground.',
          },
          {
            text: '"M.I.L.O., check our telemetry and calculate our starting power budget first."',
            consequence: 'Running a full systems check before breaking ground.',
          },
        ],
      },
      {
        speakerId: 'elena',
        speakerName: 'Capt. Elena Ruiz',
        role: 'Mission Commander',
        mood: 'confident',
        text: 'Great call, Commander. Let\'s begin Chapter 1: First Light. Lay down our power cables and bring our life support modules online!',
        sfx: 'fanfare',
      },
    ],
  },

  // CHAPTER 1: First Light
  ch1_intro: {
    id: 'ch1_intro',
    chapter: 1,
    title: 'CHAPTER 1: FIRST LIGHT',
    location: 'Shackleton High Ridge — Power Zone',
    lines: [
      {
        speakerId: 'amir',
        speakerName: 'Amir Haddad',
        role: 'Systems Engineer',
        mood: 'tinkering',
        text: 'Commander, I have unstrapped the Solar Array panels. When placed on the high ridge, each array converts sunlight into +20 kW of clean electricity.',
      },
      {
        speakerId: 'milo',
        speakerName: 'M.I.L.O.',
        role: 'AI Logistics Operator',
        mood: 'calm',
        text: 'Electricity does not travel wirelessly across lunar vacuum. You must lay heavy superconducting Power Cables to connect the solar array to our Oxygen Electrolyzer.',
      },
      {
        speakerId: 'nia',
        speakerName: 'Dr. Nia Okafor',
        role: 'Science Officer',
        mood: 'curious',
        text: 'The electrolyzer uses electricity to split water into hydrogen fuel and breathable O₂ gas. Once it is powered, we breathe easy!',
      },
    ],
  },

  // CHAPTER 2: The Long Night
  ch2_intro: {
    id: 'ch2_intro',
    chapter: 2,
    title: 'CHAPTER 2: THE LONG NIGHT',
    location: 'Shackleton Base — Nightfall Approach',
    lines: [
      {
        speakerId: 'milo',
        speakerName: 'M.I.L.O.',
        role: 'AI Logistics Operator',
        mood: 'alert',
        text: 'Notice: Orbital shadow analysis indicates the Sun is dropping below the crater crest. Lunar night will begin in 18 hours.',
        shake: true,
        sfx: 'alarm',
      },
      {
        speakerId: 'elena',
        speakerName: 'Capt. Elena Ruiz',
        role: 'Mission Commander',
        mood: 'worried',
        text: 'Temperatures on the surface will plunge to -130°C. If our heaters and scrubbers lose power, the base will freeze.',
      },
      {
        speakerId: 'amir',
        speakerName: 'Amir Haddad',
        role: 'Systems Engineer',
        mood: 'confident',
        text: 'Do not panic! That is why we brought Battery Banks. We must bank at least 100 kWh of energy before the last ray of sunlight fades.',
      },
      {
        speakerId: 'daniel',
        speakerName: 'Dr. Daniel Park',
        role: 'Medical Officer',
        mood: 'alert',
        text: 'Commander, monitor the power balance closely. If battery charge drops too fast, shed non-essential loads immediately.',
      },
    ],
  },

  // CHAPTER 3: The Invisible Threat (Space Weather)
  ch3_intro: {
    id: 'ch3_intro',
    chapter: 3,
    title: 'CHAPTER 3: THE INVISIBLE THREAT',
    location: 'Deep Space Telemetry Terminal — NASA DONKI',
    lines: [
      {
        speakerId: 'nia',
        speakerName: 'Dr. Nia Okafor',
        role: 'Science Officer',
        mood: 'alert',
        text: 'Commander! Look at the DONKI Space Weather feed! Active Sunspot 3842 has erupted with an X-class solar flare!',
        shake: true,
        sfx: 'alarm',
      },
      {
        speakerId: 'milo',
        speakerName: 'M.I.L.O.',
        role: 'AI Logistics Operator',
        mood: 'alert',
        text: 'Coronal Mass Ejection detected. A billion-ton cloud of magnetized solar protons is racing toward the Moon at 2,000 km/s. Arrival time: 2 hours.',
      },
      {
        speakerId: 'daniel',
        speakerName: 'Dr. Daniel Park',
        role: 'Medical Officer',
        mood: 'worried',
        text: 'Thin aluminum habitat walls cannot stop high-energy cosmic protons. We will receive lethal radiation unless we shield the base!',
      },
      {
        speakerId: 'amir',
        speakerName: 'Amir Haddad',
        role: 'Systems Engineer',
        mood: 'tinkering',
        text: 'We have millions of tons of natural armor right beneath our boots: Lunar Regolith! We can pile a regolith shield roof over the modules, or construct the Subterranean Vault!',
      },
    ],
  },

  // CHAPTER 4: Growing Beyond Earth
  ch4_intro: {
    id: 'ch4_intro',
    chapter: 4,
    title: 'CHAPTER 4: GROWING BEYOND EARTH',
    location: 'Bio-Regenerative Life Support Lab',
    lines: [
      {
        speakerId: 'nia',
        speakerName: 'Dr. Nia Okafor',
        role: 'Science Officer',
        mood: 'curious',
        text: 'Look at these seedlings! Our Canadian Space Agency (CSA) hydroponics trays are sprouting dwarf Outredgeous red romaine lettuce!',
      },
      {
        speakerId: 'daniel',
        speakerName: 'Dr. Daniel Park',
        role: 'Medical Officer',
        mood: 'confident',
        text: 'Fresh greens provide critical potassium and vitamins C & K that pre-packaged freeze-dried rations lack. Plus, the psychological boost to crew morale is huge.',
      },
      {
        speakerId: 'milo',
        speakerName: 'M.I.L.O.',
        role: 'AI Logistics Operator',
        mood: 'calm',
        text: 'Hydroponic trays require water and 12 kW of steady power. Ensure our Ice Core Extractor in the crater shadow continues pumping recycled water.',
      },
    ],
  },

  // CHAPTER 5: A Home Among the Stars
  ch5_intro: {
    id: 'ch5_intro',
    chapter: 5,
    title: 'CHAPTER 5: A HOME AMONG THE STARS',
    location: 'Shackleton Artemis Outpost — Command Cupola',
    lines: [
      {
        speakerId: 'elena',
        speakerName: 'Capt. Elena Ruiz',
        role: 'Mission Commander',
        mood: 'confident',
        text: 'Look at what we built, Commander. What started as an unpowered lander is now a fully self-sufficient human habitat standing proud on the Moon.',
      },
      {
        speakerId: 'amir',
        speakerName: 'Amir Haddad',
        role: 'Systems Engineer',
        mood: 'confident',
        text: 'Closed electrical grid, continuous Kilopower backup, full regolith radiation shielding, and running water from the ice cold-traps.',
      },
      {
        speakerId: 'milo',
        speakerName: 'M.I.L.O.',
        role: 'AI Logistics Operator',
        mood: 'calm',
        text: 'All life support and sustainability metrics exceed NASA Artemis flight criteria. Junior Commander, your graduation review is officially complete!',
        sfx: 'fanfare',
      },
    ],
  },
};
