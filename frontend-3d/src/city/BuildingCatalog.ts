/**
 * Building Catalog & Specifications
 * NASA Outpost 3D Lunar Frontend — City Builder
 *
 * Defines the 16+ kid-friendly moon colony buildings mapped to local GLB models
 * with tangible benefits for the 18-variable ECLSS and power simulation.
 */

export interface BuildingDefinition {
  id: string;
  name: string;
  category: 'living' | 'power' | 'life_support' | 'spaceport' | 'rovers';
  modelFile: string;
  materialsCost: number;
  powerGenKw?: number;
  batteryCapKwh?: number;
  crewCapacity?: number;
  foodPerTick?: number;
  waterPerTick?: number;
  o2PerTick?: number;
  materialsPerTick?: number;
  shieldBonus?: number;
  moraleBonus?: number;
  description: string;
  kidBenefit: string;
  emoji: string;
  radiusMeters: number;
}

export const BUILDING_CATALOG: Record<string, BuildingDefinition> = {
  // ==========================================
  // 1. LIVING & HABITATS
  // ==========================================
  inflatable_dome: {
    id: 'inflatable_dome',
    name: 'Inflatable Dome Habitat',
    category: 'living',
    modelFile: 'inflatable-dome-habitat.glb',
    materialsCost: 120,
    crewCapacity: 4,
    moraleBonus: 10,
    description: 'A cozy inflatable dome habitat with dust skirts and observation viewports.',
    kidBenefit: '+4 🧑‍🚀 Astronauts & Happy Crew!',
    emoji: '🏠',
    radiusMeters: 5.5,
  },
  shielded_dome: {
    id: 'shielded_dome',
    name: 'Regolith-Shielded Habitat',
    category: 'living',
    modelFile: 'inflatable-dome-habitat-with-regolith-shielding.glb',
    materialsCost: 180,
    crewCapacity: 4,
    shieldBonus: 15,
    description: 'Heavy regolith-banked dome habitat protecting crew from harsh solar radiation.',
    kidBenefit: '+4 🧑‍🚀 Crew & +15% 🛡️ Radiation Shielding!',
    emoji: '🛡️',
    radiusMeters: 6.2,
  },
  crew_cylinder: {
    id: 'crew_cylinder',
    name: 'Rigid Cylinder Habitat',
    category: 'living',
    modelFile: 'rigid-cylinder-crew-habitat-on-legs.glb',
    materialsCost: 100,
    crewCapacity: 3,
    description: 'Elevated sleeping and dining quarters on stabilizing hydraulic legs.',
    kidBenefit: '+3 🧑‍🚀 Astronaut Quarters!',
    emoji: '🏢',
    radiusMeters: 4.5,
  },
  cupola: {
    id: 'cupola',
    name: 'Cupola Observation Turret',
    category: 'living',
    modelFile: 'cupola-observation-turret.glb',
    materialsCost: 80,
    moraleBonus: 15,
    description: 'Multi-window cupola offering breathtaking views of the blue Earth and stars.',
    kidBenefit: '+15% 😊 Morale & Astronaut Happiness!',
    emoji: '🔭',
    radiusMeters: 3.5,
  },
  medical_bay: {
    id: 'medical_bay',
    name: 'Medical & Crew Care Module',
    category: 'living',
    modelFile: 'medical-and-crew-care-module.glb',
    materialsCost: 140,
    description: 'High-tech medical clinic ensuring crew health stays at 100%.',
    kidBenefit: '🏥 Restores Crew Health & Vitals!',
    emoji: '❤️',
    radiusMeters: 4.8,
  },
  straight_tunnel: {
    id: 'straight_tunnel',
    name: 'Straight Corridor Tunnel',
    category: 'living',
    modelFile: 'pressurised-connecting-tunnel-straight-bay.glb',
    materialsCost: 35,
    moraleBonus: 3,
    description: 'Pressurised hallway corridor connecting habitat modules and domes.',
    kidBenefit: '🚇 Connects Habitats & Keeps Crew Warm!',
    emoji: '🚇',
    radiusMeters: 2.2,
  },
  turn_tunnel: {
    id: 'turn_tunnel',
    name: '90° Curved Corner Tunnel',
    category: 'living',
    modelFile: 'pressurised-connecting-tunnel-quarter-turn.glb',
    materialsCost: 35,
    moraleBonus: 3,
    description: 'Pressurised 90-degree corner module for routing base hallways.',
    kidBenefit: '↪️ Corners Hallways Around Base!',
    emoji: '↪️',
    radiusMeters: 2.2,
  },
  tee_tunnel: {
    id: 'tee_tunnel',
    name: '3-Way T-Junction Hub',
    category: 'living',
    modelFile: 'pressurised-connecting-tunnel-tee-junction.glb',
    materialsCost: 40,
    moraleBonus: 5,
    description: 'Central three-way hallway hub linking different base wings together.',
    kidBenefit: '🔀 Three-Way Branching Hallway Hub!',
    emoji: '🔀',
    radiusMeters: 2.5,
  },
  airlock: {
    id: 'airlock',
    name: 'Dust-Lock Airlock Vestibule',
    category: 'living',
    modelFile: 'airlock-with-dust-lock-vestibule.glb',
    materialsCost: 50,
    shieldBonus: 5,
    description: 'Dual-door airlock and dust vacuum preventing lunar dust inside habitats.',
    kidBenefit: '🚪 Safe Astronaut Exit to Moon Surface!',
    emoji: '🚪',
    radiusMeters: 2.5,
  },

  // ==========================================
  // 2. POWER & ENERGY
  // ==========================================
  solar_array: {
    id: 'solar_array',
    name: 'Fixed Solar Array Row',
    category: 'power',
    modelFile: 'fixed-solar-array-row.glb',
    materialsCost: 60,
    powerGenKw: 40,
    description: 'Efficient photovoltaic panels collecting sunlight along crater rims.',
    kidBenefit: '+40 ⚡ Clean Solar Power in Daylight!',
    emoji: '☀️',
    radiusMeters: 4.0,
  },
  solar_tower: {
    id: 'solar_tower',
    name: 'Vertical Solar Tower',
    category: 'power',
    modelFile: 'vertical-solar-tower.glb',
    materialsCost: 90,
    powerGenKw: 60,
    description: 'Tall vertical solar tower catching grazing polar sunlight above crater shadows.',
    kidBenefit: '+60 ⚡ High-Altitude Solar Power!',
    emoji: '🗼',
    radiusMeters: 3.2,
  },
  battery_bank: {
    id: 'battery_bank',
    name: 'Battery Storage Unit',
    category: 'power',
    modelFile: 'battery-storage-container.glb',
    materialsCost: 80,
    batteryCapKwh: 150,
    description: 'High-capacity lithium-ion cells storing power for the 15-day lunar night.',
    kidBenefit: '+150 🔋 Energy Storage for the Night!',
    emoji: '🔋',
    radiusMeters: 3.5,
  },
  nuclear_reactor: {
    id: 'nuclear_reactor',
    name: 'Kilopower Nuclear Reactor',
    category: 'power',
    modelFile: 'nuclear-power-unit-with-shielding-berm.glb',
    materialsCost: 240,
    powerGenKw: 50,
    description: 'NASA Kilopower Stirling reactor generating uninterrupted electricity 24/7.',
    kidBenefit: '+50 ⚡ Day AND Night Continuous Power!',
    emoji: '⚛️',
    radiusMeters: 5.0,
  },

  // ==========================================
  // 3. LIFE SUPPORT & FARMS
  // ==========================================
  greenhouse: {
    id: 'greenhouse',
    name: 'Hydroponics Greenhouse',
    category: 'life_support',
    modelFile: 'pressurised-greenhouse-module.glb',
    materialsCost: 110,
    foodPerTick: 2.5,
    description: 'Warm LED-lit greenhouses growing space potatoes, lettuce, and strawberries.',
    kidBenefit: '+2.5 🥕 Fresh Food per Cycle!',
    emoji: '🌿',
    radiusMeters: 4.8,
  },
  water_skid: {
    id: 'water_skid',
    name: 'Water Extraction Skid',
    category: 'life_support',
    modelFile: 'water-processing-skid.glb',
    materialsCost: 95,
    waterPerTick: 2.0,
    description: 'Subsurface thermal drill extracting pristine ice from deep crater shadows.',
    kidBenefit: '+2.0 💧 Fresh Lunar Water per Cycle!',
    emoji: '💧',
    radiusMeters: 4.0,
  },
  oxygen_plant: {
    id: 'oxygen_plant',
    name: 'Oxygen Extraction Skid',
    category: 'life_support',
    modelFile: 'oxygen-extraction-plant-skid.glb',
    materialsCost: 100,
    o2PerTick: 2.0,
    description: 'Molten regolith electrolysis plant extracting pure breathing oxygen from moon rock.',
    kidBenefit: '+2.0 🫧 Clean Breathing Oxygen!',
    emoji: '🫧',
    radiusMeters: 4.0,
  },
  workshop: {
    id: 'workshop',
    name: 'Vehicle Bay & Workshop',
    category: 'life_support',
    modelFile: 'pressurised-workshop-and-vehicle-bay.glb',
    materialsCost: 130,
    materialsPerTick: 3.0,
    description: 'Robotic repair facility maintaining rovers and fabricating replacement parts.',
    kidBenefit: '+3.0 🧱 Auto Materials Fabrication!',
    emoji: '🛠️',
    radiusMeters: 5.2,
  },

  // ==========================================
  // 4. SPACEPORT & INFRASTRUCTURE
  // ==========================================
  landing_pad: {
    id: 'landing_pad',
    name: 'Sintered Landing Pad',
    category: 'spaceport',
    modelFile: 'sintered-landing-pad.glb',
    materialsCost: 150,
    materialsPerTick: 4.0,
    description: 'Microwave-sintered circular rocket pad for smooth spacecraft landings.',
    kidBenefit: '🚀 Spacecraft Port (+Resupply Bonus!)',
    emoji: '🛸',
    radiusMeters: 10.0,
  },
  comms_mast: {
    id: 'comms_mast',
    name: 'Deep Space Comms Mast',
    category: 'spaceport',
    modelFile: 'communications-relay-mast.glb',
    materialsCost: 75,
    moraleBonus: 10,
    description: 'High-gain parabolic antenna linking astronauts directly to family and Houston.',
    kidBenefit: '📡 Earth Connection & Video Calls!',
    emoji: '📡',
    radiusMeters: 3.0,
  },
  beacon_light: {
    id: 'beacon_light',
    name: 'Navigation Approach Beacon',
    category: 'spaceport',
    modelFile: 'approach-light-beacon.glb',
    materialsCost: 30,
    description: 'Bright pulse beacon guiding nocturnal rovers across the dark crater floor.',
    kidBenefit: '💡 Illuminates the Night Ground!',
    emoji: '💡',
    radiusMeters: 2.0,
  },
  propellant_farm: {
    id: 'propellant_farm',
    name: 'Cryogenic Fuel Depot',
    category: 'spaceport',
    modelFile: 'cryogenic-propellant-tank-farm.glb',
    materialsCost: 140,
    materialsPerTick: 4.0,
    description: 'Insulated cryogenic spherical tanks storing liquid methane and liquid oxygen rocket propellant.',
    kidBenefit: '⛽ Rocket Propellant Depot (+4 🧱/tick)',
    emoji: '⛽',
    radiusMeters: 5.5,
  },
  cargo_lander: {
    id: 'cargo_lander',
    name: 'Falcon Cargo Lander',
    category: 'spaceport',
    modelFile: 'cargo-lander-with-unloading-ramp.glb',
    materialsCost: 200,
    materialsPerTick: 6.0,
    description: 'Heavy automated lunar lander with unloading ramps delivering containers from Earth.',
    kidBenefit: '📦 Earth Cargo Deliveries (+6 🧱/tick)',
    emoji: '📦',
    radiusMeters: 8.0,
  },

  // ==========================================
  // 5. ROVERS & EXPLORATION
  // ==========================================
  survey_rover: {
    id: 'survey_rover',
    name: 'Robotic Survey Scout',
    category: 'rovers',
    modelFile: 'small-robotic-survey-rover.glb',
    materialsCost: 110,
    materialsPerTick: 5.0,
    description: 'Autonomous prospecting rover drilling for rare minerals and titanium.',
    kidBenefit: '+5.0 🧱 Auto Regolith Mining!',
    emoji: '🚜',
    radiusMeters: 3.0,
  },
  cargo_hauler: {
    id: 'cargo_hauler',
    name: 'Heavy 6-Wheel Hauler',
    category: 'rovers',
    modelFile: 'six-wheel-cargo-hauler-with-flatbed.glb',
    materialsCost: 160,
    materialsPerTick: 8.0,
    description: 'Heavy transport rover carrying mined ore and construction supplies.',
    kidBenefit: '+8.0 🧱 Heavy Cargo Freight!',
    emoji: '🚛',
    radiusMeters: 4.0,
  },
  long_range_rover: {
    id: 'long_range_rover',
    name: 'Pressurised Expedition Rover',
    category: 'rovers',
    modelFile: 'pressurised-long-range-rover.glb',
    materialsCost: 150,
    moraleBonus: 15,
    materialsPerTick: 5.0,
    description: 'Comfortable pressurized exploration rover allowing astronauts to travel across the crater for days.',
    kidBenefit: '🚐 Long-Range Exploration (+15% 😊 Morale)',
    emoji: '🚐',
    radiusMeters: 4.2,
  },
  astronaut: {
    id: 'astronaut',
    name: 'Moonwalking Astronaut',
    category: 'rovers',
    modelFile: 'surface-eva-suit.glb',
    materialsCost: 40,
    moraleBonus: 5,
    description: 'Artemis astronaut exploring the lunar surface in a high-mobility spacesuit.',
    kidBenefit: '🧑‍🚀 Moonwalking Explorer!',
    emoji: '🧑‍🚀',
    radiusMeters: 1.5,
  },
};

export const BUILDING_LIST = Object.values(BUILDING_CATALOG);
