const fs = require('fs');
const path = require('path');

const dialogue = JSON.parse(fs.readFileSync(path.join(__dirname, '../../story/samples/dialogue.en.json'), 'utf8'));
const bible = JSON.parse(fs.readFileSync(path.join(__dirname, '../../story/samples/story-bible.json'), 'utf8'));

// Build lookup of timeline events
const eventMap = {};
for (const ev of bible.timeline) {
  eventMap[ev.event_id] = ev;
}

const sceneMeta = {
  'S-PRO-1': { chapter: 0, title: 'PROLOGUE: TOUCHDOWN', location: 'Shackleton Crater Rim — Landing Site' },
  'S-BASE-TOUR': { chapter: 1, title: 'BASE SYSTEMS TOUR', location: 'Shackleton Crater Rim — Outpost Complex' },
  'S-C1-1': { chapter: 1, title: 'CHAPTER 1: HABITAT DEPLOYMENT', location: 'Sector Alpha — Outpost Perimeter' },
  'S-C1-2': { chapter: 1, title: 'CHAPTER 1: LIFE SUPPORT ACTIVATION', location: 'Hab Module — CDRA Atmosphere Bay' },
  'S-C1-3': { chapter: 1, title: 'CHAPTER 1: PRIMARY VALVE FRACTURE', location: 'Cryo-Tank Station — Main Oxygen Line' },
  'S-C2-1': { chapter: 2, title: 'CHAPTER 2: THE LONG NIGHT', location: 'Solar Rim Ridge — Shadow Threshold' },
  'S-C2-2': { chapter: 2, title: 'CHAPTER 2: SUNRISE OVER SHACKLETON', location: 'Shackleton Rim — Solar Farm' },
  'S-C3-1': { chapter: 3, title: 'CHAPTER 3: CME SOLAR STORM WARNING', location: 'Outpost Communications Mast' },
  'S-C3-2': { chapter: 3, title: 'CHAPTER 3: RADIATION IMPACT', location: 'Subterranean Storm Vault' },
  'S-C4-1': { chapter: 4, title: 'CHAPTER 4: HYDROPONIC EXPEDITION', location: 'Permanent Shadow Crater Basin' },
  'S-C4-2': { chapter: 4, title: 'CHAPTER 4: THE FIRST HARVEST', location: 'Greenhouse Dome — Tray Alpha' },
  'S-C5-1': { chapter: 5, title: 'CHAPTER 5: COMPOUND MOONQUAKE EMERGENCY', location: 'Base Central Power Hub' },
  'S-C5-2': { chapter: 5, title: 'CHAPTER 5: THE RESCUE OF CAPT. RUIZ', location: 'Hab Main Airlock' },
  'S-EPI-1': { chapter: 6, title: 'EPILOGUE: FIRST LIGHT DIPLOMA', location: 'NASA Mission Control Teleconference' },
  'S-EPI-2': { chapter: 6, title: 'EPILOGUE: THE MARS HORIZON', location: 'Shackleton Overlook — Observation Deck' },
};

const speakerInfo = {
  Narrator: { id: 'narrator', name: 'Narrator', role: 'Mission Log', mood: 'calm' },
  MILO: { id: 'milo', name: 'M.I.L.O.', role: 'AI Logistics Operator', mood: 'calm' },
  Leo: { id: 'leo', name: 'Capt. Leo Ruiz', role: 'Mission Commander', mood: 'confident' },
  Amir: { id: 'amir', name: 'Amir Haddad', role: 'Systems Engineer', mood: 'tinkering' },
  Daniel: { id: 'daniel', name: 'Dr. Daniel Park', role: 'Medical Officer', mood: 'worried' },
  Nia: { id: 'nia', name: 'Dr. Nia Okafor', role: 'Science Officer', mood: 'curious' },
};

const storyScenes = {};

for (const [sceneId, lines] of Object.entries(dialogue.scenes)) {
  const meta = sceneMeta[sceneId] || { chapter: 1, title: sceneId, location: 'Moon Base' };
  const formattedLines = [];

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    let lineObj;

    if (raw.type === 'direction') {
      lineObj = {
        speakerId: 'narrator',
        speakerName: 'Mission Log',
        role: 'Telemetry & Atmosphere',
        mood: 'calm',
        text: `◈ [${raw.text}]`,
      };
    } else {
      const sp = speakerInfo[raw.speaker] || speakerInfo.MILO;
      let mood = sp.mood;
      let sfx = undefined;
      let shake = undefined;

      // Context-aware moods and sfx
      const textLower = raw.text.toLowerCase();
      if (textLower.includes('warning') || textLower.includes('alert') || textLower.includes('alarm') || textLower.includes('danger') || textLower.includes('fracture')) {
        mood = 'alert';
        sfx = 'alarm';
        shake = true;
      } else if (textLower.includes('touchdown') || textLower.includes('safe') || textLower.includes('congratulations') || textLower.includes('diploma') || textLower.includes('harvest')) {
        mood = 'confident';
        sfx = 'fanfare';
      } else if (textLower.includes('freeze') || textLower.includes('die') || textLower.includes('cold') || textLower.includes('fall')) {
        mood = 'worried';
      } else if (textLower.includes('check') || textLower.includes('wire') || textLower.includes('connect') || textLower.includes('power')) {
        mood = 'tinkering';
      } else if (textLower.includes('plant') || textLower.includes('ice') || textLower.includes('crater') || textLower.includes('science')) {
        mood = 'curious';
      }

      lineObj = {
        speakerId: sp.id,
        speakerName: sp.name,
        role: sp.role,
        mood,
        text: raw.text,
      };

      if (sfx) lineObj.sfx = sfx;
      if (shake) lineObj.shake = shake;
    }

    formattedLines.push(lineObj);
  }

  // Add interactive choices on last lines of key decision scenes
  if (sceneId === 'S-PRO-1') {
    formattedLines[formattedLines.length - 1].choices = [
      { text: "Take the Systems Tour of our Pre-Built Base", consequence: 'Touring all 12 outpost life-support and energy machines...' },
      { text: "Start building my own base from scratch", consequence: 'Grid cleared with 1400 materials. Build freely!' },
    ];
  } else if (sceneId === 'S-BASE-TOUR') {
    formattedLines[formattedLines.length - 1].choices = [
      { text: 'Acknowledge all systems and take command of the Outpost!', consequence: 'All systems green! Outpost under your command.' },
      { text: 'Switch to custom mode: wipe grid and build my own base', consequence: '1400 Materials granted. Build freely!' },
    ];
  } else if (sceneId === 'S-C1-2') {
    formattedLines[formattedLines.length - 1].choices = [
      { text: 'Connect power cable from solar array to oxygen electrolyzer', consequence: 'Power circuit closed: 10 kW flowing to life support!' },
      { text: 'Verify battery bank charge capacity before engaging', consequence: 'Batteries primed for upcoming solar cycle.' },
    ];
  } else if (sceneId === 'S-C1-3') {
    formattedLines[formattedLines.length - 1].choices = [
      { text: 'Demand emergency Earth resupply lander via Deep Space Network', consequence: 'Earth Connection Channel transmitting telemetry. Resupply lander launched!' },
    ];
  } else if (sceneId === 'S-C2-1') {
    formattedLines[formattedLines.length - 1].choices = [
      { text: 'Engage load-shedding protocol: shut down non-essential systems', consequence: 'Farm grow-lights offline. Power conserved for life support heaters!' },
      { text: 'Reroute battery heating loop through secondary bus', consequence: 'Thermal bus active. Core temperature stabilized at 21°C.' },
    ];
  } else if (sceneId === 'S-C3-1') {
    formattedLines[formattedLines.length - 1].choices = [
      { text: 'Sound general base evacuation to subterranean storm vault', consequence: 'All 4 astronauts safe in vault behind regolith shield.' },
    ];
  } else if (sceneId === 'S-C4-1') {
    formattedLines[formattedLines.length - 1].choices = [
      { text: 'Plant Outredgeous lettuce and radishes in growth trays', consequence: 'Hydroponic nutrient mist activated! Fresh greens sprouting.' },
    ];
  } else if (sceneId === 'S-C5-1') {
    formattedLines[formattedLines.length - 1].choices = [
      { text: 'Reroute emergency power & open jammed airlock valve for Leo', consequence: 'Airlock pressure equalized! Captain Ruiz safely pulled inside.' },
    ];
  } else if (sceneId === 'S-EPI-2') {
    formattedLines[formattedLines.length - 1].choices = [
      { text: 'Accept commendation & unlock Creative Sandbox Mode', consequence: 'All modules unlocked! Full lunar training certification awarded.' },
    ];
  }

  storyScenes[sceneId] = {
    id: sceneId,
    chapter: meta.chapter,
    title: meta.title,
    location: meta.location,
    lines: formattedLines,
  };
}

// Generate TypeScript code
const tsCode = `import { CharacterId } from '../core/types';

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

export const STORY_SCENES: Record<string, StoryScene> = ${JSON.stringify(storyScenes, null, 2)};
`;

fs.writeFileSync(path.join(__dirname, '../src/narrative/StoryData.ts'), tsCode, 'utf8');
console.log('Successfully generated StoryData.ts with ' + Object.keys(storyScenes).length + ' scenes!');
