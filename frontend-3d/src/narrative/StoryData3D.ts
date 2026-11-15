export interface DialogueLine {
  type: 'line' | 'direction';
  speaker?: string;
  role?: string;
  text: string;
}

export interface DialogueScene {
  id: string;
  title: string;
  sol: number;
  lines: DialogueLine[];
  choices?: { text: string; action?: string }[];
}

export const STORY_SCENES_3D: Record<string, DialogueScene> = {
  'S-PRO-1': {
    id: 'S-PRO-1',
    title: 'PROLOGUE: TOUCHDOWN',
    sol: 1,
    lines: [
      { type: 'direction', text: 'The Artemis Lunar Lander touches down on grey lunar regolith. Dust settles.' },
      { type: 'line', speaker: 'MILO', role: 'AI Logistics Operator', text: 'Touchdown confirmed on Shackleton Crater Rim! First Light Outpost systems online.' },
      { type: 'line', speaker: 'Leo', role: 'Mission Commander', text: 'Welcome to the Moon, Commander! Shackleton Rim is one of the harshest places in the solar system. Our survival depends entirely on the machines working around us.' },
      { type: 'line', speaker: 'MILO', role: 'AI Logistics Operator', text: 'All telemetry channels are streaming. Let us tour each base sector so you understand how every machine keeps our crew alive.' },
    ],
    choices: [
      { text: 'Acknowledge Telemetry and Tour Base' },
      { text: 'Inspect Outpost Diagnostics Directly' },
    ],
  },
  'S-BASE-TOUR': {
    id: 'S-BASE-TOUR',
    title: 'FIRST LIGHT OUTPOST TOUR',
    sol: 1,
    lines: [
      { type: 'direction', text: 'Holographic telemetry highlights the glowing First Light Outpost complex.' },
      { type: 'line', speaker: 'MILO', role: 'AI Logistics Operator', text: 'Welcome to First Light Outpost, Commander! You are looking at a complete, self-sustaining lunar survival base on Shackleton Crater Rim.' },
      { type: 'line', speaker: 'Leo', role: 'Mission Commander', text: 'Our lives depend on every machine here working together in balance. Without them, the vacuum and radiation are fatal. Let\'s inspect each sector so you understand how they keep us alive.' },
      { type: 'line', speaker: 'Amir', role: 'Power Engineer', text: 'First up: ENERGY! Look at our 8 Solar Panels along the sunlit ridge. They convert sunlight into 480 kW of clean electrical power. But lunar dust settles on them constantly—so we must clean them regularly to keep power flowing!' },
      { type: 'line', speaker: 'Amir', role: 'Power Engineer', text: 'Right beside them are Battery Banks storing 850 kWh of energy. When the lunar night falls, solar power drops to zero. Our batteries release stored power to keep the base alive until sunrise.' },
      { type: 'line', speaker: 'Nia', role: 'ECLSS Specialist', text: 'Next: LIFE SUPPORT! Our Oxygen Electrolyzer splits water into breathable oxygen (O2) and hydrogen. Our CO2 Scrubber pulls carbon dioxide out of the air so we do not suffocate.' },
    ],
    choices: [
      { text: 'Understood. Outpost systems operational.' },
    ],
  },
  'S-C1-2': {
    id: 'S-C1-2',
    title: 'CRISIS: PRIMARY VALVE FRACTURE',
    sol: 2,
    lines: [
      { type: 'direction', text: 'Klaxons sound through the habitat. Amber warning lights flash.' },
      { type: 'line', speaker: 'MILO', role: 'AI Logistics Operator', text: 'CRITICAL ALERT: Primary compressed oxygen tank valve fractured! Pressure dropping to zero!' },
      { type: 'line', speaker: 'Nia', role: 'ECLSS Specialist', text: 'Commander! The main seal cracked under thermal expansion. We are venting stored O2 into the vacuum! We have approximately 48 hours of emergency reserve before asphyxiation.' },
      { type: 'line', speaker: 'Leo', role: 'Mission Commander', text: 'We must order an emergency cargo lander resupply from Earth immediately via the Deep Space Network!' },
    ],
    choices: [
      { text: 'Order Emergency Earth Resupply via DSN', action: 'order_resupply' },
      { text: 'Ration Emergency Reserves (48h Countdown)', action: 'ration_o2' },
    ],
  },
  'S-C1-3': {
    id: 'S-C1-3',
    title: 'EMERGENCY RESUPPLY TOUCHDOWN',
    sol: 4,
    lines: [
      { type: 'direction', text: 'Retrorockets roar as a Falcon Heavy Cargo Lander touches down on the sintered pad.' },
      { type: 'line', speaker: 'MILO', role: 'AI Logistics Operator', text: 'Falcon Heavy cargo lander touchdown confirmed! 10,000 kg liquid oxygen delivered to First Light Outpost.' },
      { type: 'line', speaker: 'Nia', role: 'ECLSS Specialist', text: 'Cargo offloaded! ECLSS reserve manifolds are fully recharged to 100%. The crisis is resolved, Commander!' },
    ],
    choices: [
      { text: 'Celebrate with crew and resume operations.' },
    ],
  },
  'S-C2-1': {
    id: 'S-C2-1',
    title: 'POLAR LONG NIGHT ECLIPSE',
    sol: 7,
    lines: [
      { type: 'direction', text: 'The sun slips behind Malapert Mountain. Shadows engulf the outpost.' },
      { type: 'line', speaker: 'MILO', role: 'AI Logistics Operator', text: 'Mountain shadow eclipse entry confirmed. Solar array generation has dropped to 0 kW. Outpost is now running entirely on stored battery reserves.' },
      { type: 'line', speaker: 'Amir', role: 'Power Engineer', text: 'Temperatures outside will plunge to -180°C. We must engage Priority Load-Shedding to ensure Life Support remains powered!' },
    ],
    choices: [
      { text: 'Engage Priority Load-Shedding Scheme' },
      { text: 'Monitor Battery Banks closely' },
    ],
  },
  'S-C2-2': {
    id: 'S-C2-2',
    title: 'BATTERY COOLING LINE FREEZE',
    sol: 7,
    lines: [
      { type: 'direction', text: 'Frost crystals form rapidly along the external battery conduit.' },
      { type: 'line', speaker: 'MILO', role: 'AI Logistics Operator', text: 'Warning: Main battery bus coolant line freezing. Thermal radiator experiencing severe sub-zero thermal shock.' },
      { type: 'line', speaker: 'Amir', role: 'Power Engineer', text: 'If the coolant freezes solid, the cells will rupture! Reroute secondary bus heating loop now!' },
    ],
    choices: [
      { text: 'Reroute Thermal Loop through Secondary Bus' },
    ],
  },
  'S-C3-1': {
    id: 'S-C3-1',
    title: 'CATEGORY X SOLAR FLARE ALERT',
    sol: 10,
    lines: [
      { type: 'direction', text: 'Red alarm beacons pulse. NASA DONKI transmission scrolls across the main console.' },
      { type: 'line', speaker: 'MILO', role: 'AI Logistics Operator', text: 'NASA DONKI ALERT: Category X Solar Flare and Coronal Mass Ejection detected inbound! Arrival in 2 hours.' },
      { type: 'line', speaker: 'Daniel', role: 'Radiation Safety Officer', text: 'Proton shockwave intensity estimated at 140 mSv/h. Surface habitats will not block this dosage. All personnel must evacuate to the Subterranean Storm Vault!' },
    ],
    choices: [
      { text: 'Evacuate Crew to Subterranean Storm Vault', action: 'evacuate_vault' },
    ],
  },
  'S-C3-2': {
    id: 'S-C3-2',
    title: 'RADIATION SHOCKWAVE PASSES',
    sol: 10,
    lines: [
      { type: 'direction', text: 'Geiger counters gradually return to baseline. The proton storm has cleared.' },
      { type: 'line', speaker: 'Daniel', role: 'Radiation Safety Officer', text: 'Radiation levels on the surface have returned to safe background levels. The storm vault kept crew dosage below 5 mSv!' },
      { type: 'line', speaker: 'Leo', role: 'Mission Commander', text: 'Excellent discipline, team. Surface operations may resume.' },
    ],
    choices: [
      { text: 'Exit Storm Vault and resume operations.', action: 'exit_vault' },
    ],
  },
  'S-C5-1': {
    id: 'S-C5-1',
    title: 'MOONQUAKE 5.2 CATASTROPHE',
    sol: 14,
    lines: [
      { type: 'direction', text: 'Violent tremors shudder through the regolith! Dust billows around the hab airlock.' },
      { type: 'line', speaker: 'MILO', role: 'AI Logistics Operator', text: 'Seismic impact: Magnitude 5.2 moonquake on Shackleton Fault! Outer airlock door jammed! Commander Leo Ruiz trapped outside in EVA suit!' },
      { type: 'line', speaker: 'Leo', role: 'Mission Commander', text: 'Suit pressure integrity holding, but my secondary oxygen regulator is damaged! I have 30 minutes of O2!' },
    ],
    choices: [
      { text: 'Dispatch Excavator and LRV to Extract Leo', action: 'dispatch_rescue' },
    ],
  },
  'S-C5-2': {
    id: 'S-C5-2',
    title: 'COMMANDER RESCUE COMPLETE',
    sol: 14,
    lines: [
      { type: 'direction', text: 'The excavator crane lifts the collapsed gantry beam. Crew pulls Leo into the pressurized airlock.' },
      { type: 'line', speaker: 'MILO', role: 'AI Logistics Operator', text: 'Airlock repressurized. Vital signs stabilizing. Commander Leo Ruiz safely recovered!' },
      { type: 'line', speaker: 'Leo', role: 'Mission Commander', text: 'Outstanding work, Commander! Your fast thinking and rover coordination saved my life today.' },
    ],
    choices: [
      { text: 'Acknowledge rescue and prepare for Mission Debrief.' },
    ],
  },
  'S-EPI-1': {
    id: 'S-EPI-1',
    title: 'MISSION DEBRIEF & NASA COMMENDATION',
    sol: 15,
    lines: [
      { type: 'direction', text: 'NASA Artemis Headquarters transmission appears on the central holographic display.' },
      { type: 'line', speaker: 'Director', role: 'NASA Artemis Directorate', text: 'Commander, on behalf of NASA and the international Artemis Coalition: congratulations on the successful 15-Sol survival and commissioning of First Light Outpost!' },
      { type: 'line', speaker: 'MILO', role: 'AI Logistics Operator', text: 'Outpost stability: 100%. All crew members alive, healthy, and high morale. First Light Outpost is officially designated permanent humanity lunar habitat.' },
    ],
    choices: [
      { text: 'Accept NASA Commendation' },
    ],
  },
  'S-EPI-2': {
    id: 'S-EPI-2',
    title: 'MARS TRANSMISSION & SANDBOX UNLOCK',
    sol: 15,
    lines: [
      { type: 'direction', text: 'A deep space telemetry chime sounds from the high-gain comms mast.' },
      { type: 'line', speaker: 'MILO', role: 'AI Logistics Operator', text: 'Incoming Deep Space relay from Mars Outpost Ares-1: "First Light, we read you loud and clear. Your lunar architecture has proven the pathway to Mars. Stand by for orbital transport."' },
      { type: 'line', speaker: 'Leo', role: 'Mission Commander', text: 'The Moon is just the first step, Commander. Creative Sandbox Mode is now unlocked. You have full command of First Light Outpost!' },
    ],
    choices: [
      { text: 'Enter Creative Sandbox Mode' },
    ],
  },
};
