import { TILE_SIZE } from '../core/Constants';
import { PlacedBuilding } from '../core/types';

/**
 * BuildingRenderer — High-detail 2D space simulation graphics
 * Renders authentic, high-fidelity lunar base structures with animations
 */
export class BuildingRenderer {
  /**
   * Draw a building with rich textures, lighting highlights, and animated states
   */
  public static drawBuilding(
    ctx: CanvasRenderingContext2D,
    b: PlacedBuilding,
    px: number,
    py: number,
    time: number
  ): void {
    ctx.save();

    // Fast-path: Power Cable junction node (renders compact ground conduit terminal, no giant building shadow)
    if (b.type === 'power_cable') {
      this.drawPowerJunction(ctx, px, py, b.isPowered, time);
      ctx.restore();
      return;
    }

    // Fast-path: 4-Tile Central Outpost Base (renders iconic 96x96 Artemis Core Base)
    if (b.type === 'outpost_base') {
      this.drawOutpostBase(ctx, px, py, b.isPowered, time);
      ctx.restore();
      return;
    }

    // 1. Structure Ground Shadow
    ctx.fillStyle = 'rgba(10, 15, 30, 0.45)';
    ctx.beginPath();
    ctx.ellipse(px + TILE_SIZE / 2 + 4, py + TILE_SIZE - 4, TILE_SIZE * 0.42, TILE_SIZE * 0.18, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Specific Building Geometry
    switch (b.type) {
      case 'solar_array':
        this.drawSolarArray(ctx, px, py, b.isPowered, time);
        break;

      case 'battery_bank':
        this.drawBatteryBank(ctx, px, py, b.isPowered, time);
        break;

      case 'oxygen_electrolyzer':
        this.drawOxygenElectrolyzer(ctx, px, py, b.isPowered, time);
        break;

      case 'co2_scrubber':
        this.drawCO2Scrubber(ctx, px, py, b.isPowered, time);
        break;

      case 'crew_habitat':
        this.drawCrewHabitat(ctx, px, py, b.isPowered, time);
        break;

      case 'regolith_shield':
        this.drawRegolithShield(ctx, px, py);
        break;

      case 'subterranean_vault':
        this.drawSubterraneanVault(ctx, px, py, b.isPowered, time);
        break;

      case 'hydroponics_tray':
        this.drawHydroponics(ctx, px, py, b.isPowered, time);
        break;

      case 'water_extractor':
        this.drawWaterExtractor(ctx, px, py, b.isPowered, time);
        break;

      case 'emergency_o2_generator':
        this.drawEmergencyO2(ctx, px, py, b.isPowered, time);
        break;

      case 'water_recycler':
        this.drawWaterRecycler(ctx, px, py, b.isPowered, time);
        break;

      case 'heating_system':
        this.drawHeatingSystem(ctx, px, py, b.isPowered, time);
        break;

      case 'earth_channel':
        this.drawEarthChannel(ctx, px, py, b.isPowered, time);
        break;

      default:
        this.drawGenericModule(ctx, px, py);
        break;
    }

    // 3. Status LED Beacon (Blinking Green if OK, Pulsing Amber if unpowered, Dim Gray if switched OFF)
    const isSwitchedOff = b.isEnabled === false;
    const ledColor = isSwitchedOff ? '#64748b' : b.isPowered ? '#10b981' : '#f59e0b';
    const ledGlow = isSwitchedOff ? 'rgba(100, 116, 139, 0.2)' : b.isPowered ? 'rgba(16, 185, 129, 0.5)' : 'rgba(245, 158, 11, 0.5)';
    const pulse = isSwitchedOff ? 2 : Math.sin(time * 0.008 + b.x) * 1.5 + 4;

    ctx.fillStyle = ledGlow;
    ctx.beginPath();
    ctx.arc(px + TILE_SIZE - 7, py + 7, pulse + 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = ledColor;
    ctx.beginPath();
    ctx.arc(px + TILE_SIZE - 7, py + 7, 3, 0, Math.PI * 2);
    ctx.fill();

    // 4. If switched OFF by player, draw a clear [OFF] badge on the module
    if (isSwitchedOff) {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(px + 4, py + 4, 22, 11, 3);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#f87171';
      ctx.font = 'bold 8px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('OFF', px + 15, py + 9.5);
    }

    ctx.restore();
  }

  // --- Solar Array ---
  private static drawSolarArray(
    ctx: CanvasRenderingContext2D,
    px: number,
    py: number,
    isPowered: boolean,
    time: number
  ): void {
    const tilt = Math.sin(time * 0.001) * 3;

    // Heavy tripod mounting stand
    ctx.fillStyle = '#64748b';
    ctx.fillRect(px + TILE_SIZE / 2 - 3, py + TILE_SIZE - 12, 6, 10);
    ctx.fillStyle = '#475569';
    ctx.fillRect(px + TILE_SIZE / 2 - 8, py + TILE_SIZE - 4, 16, 3);

    // Motorized gimbal pivot
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.arc(px + TILE_SIZE / 2, py + TILE_SIZE - 14, 4, 0, Math.PI * 2);
    ctx.fill();

    // Twin Photovoltaic Solar Wings
    const wingW = TILE_SIZE - 10;
    const wingH = TILE_SIZE - 18;
    const wx = px + 5;
    const wy = py + 4 + tilt;

    // Wing Metallic Frame
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(wx, wy, wingW, wingH, 4);
    ctx.fill();
    ctx.stroke();

    // Deep Blue Crystalline Silicon Cells
    const cellGrad = ctx.createLinearGradient(wx, wy, wx + wingW, wy + wingH);
    cellGrad.addColorStop(0, '#1d4ed8');
    cellGrad.addColorStop(0.5, '#1e3a8a');
    cellGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = cellGrad;
    ctx.beginPath();
    ctx.roundRect(wx + 2, wy + 2, wingW - 4, wingH - 4, 2);
    ctx.fill();

    // Grid Busbars & Solar Grid Lines
    ctx.strokeStyle = isPowered ? '#93c5fd' : '#60a5fa';
    ctx.lineWidth = 1;
    // Horizontal divisions
    ctx.beginPath();
    ctx.moveTo(wx + 2, wy + wingH / 2);
    ctx.lineTo(wx + wingW - 2, wy + wingH / 2);
    // Vertical divisions
    ctx.moveTo(wx + wingW * 0.33, wy + 2);
    ctx.lineTo(wx + wingW * 0.33, wy + wingH - 2);
    ctx.moveTo(wx + wingW * 0.66, wy + 2);
    ctx.lineTo(wx + wingW * 0.66, wy + wingH - 2);
    ctx.stroke();

    // Specular Sunlight Glint
    if (isPowered) {
      const glintX = wx + 4 + ((time * 0.02) % (wingW - 8));
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fillRect(glintX, wy + 3, 3, wingH - 6);
    }
  }

  // --- Battery Bank ---
  private static drawBatteryBank(
    ctx: CanvasRenderingContext2D,
    px: number,
    py: number,
    isPowered: boolean,
    time: number
  ): void {
    const bx = px + 6;
    const by = py + 7;
    const bw = TILE_SIZE - 12;
    const bh = TILE_SIZE - 12;

    // Heavy Cryogenic Insulated Case
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, 6);
    ctx.fill();
    ctx.stroke();

    // Front Metal Armor Plate
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(bx + 2, by + 2, bw - 4, bh - 4, 4);
    ctx.fill();

    // 3 Vertical Power Cell Capsules
    const cellW = (bw - 10) / 3;
    for (let i = 0; i < 3; i++) {
      const cx = bx + 3 + i * (cellW + 2);
      const cy = by + 5;
      const ch = bh - 10;

      // Cell Slot Background
      ctx.fillStyle = '#090d16';
      ctx.fillRect(cx, cy, cellW, ch);

      // Glowing Battery Charge Indicator
      const fillPct = isPowered ? 0.6 + Math.sin(time * 0.003 + i) * 0.3 : 0.2;
      const fillH = ch * fillPct;

      const chargeGrad = ctx.createLinearGradient(cx, cy + ch - fillH, cx, cy + ch);
      chargeGrad.addColorStop(0, '#34d399');
      chargeGrad.addColorStop(1, '#059669');
      ctx.fillStyle = chargeGrad;
      ctx.fillRect(cx, cy + ch - fillH, cellW, fillH);

      // Glass shine
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.fillRect(cx + 1, cy, 1.5, ch);
    }

    // Top High-Voltage Terminal Caps
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(bx + bw * 0.25 - 2, by - 3, 4, 3);
    ctx.fillRect(bx + bw * 0.75 - 2, by - 3, 4, 3);
  }

  // --- Oxygen Electrolyzer ---
  private static drawOxygenElectrolyzer(
    ctx: CanvasRenderingContext2D,
    px: number,
    py: number,
    _isPowered: boolean,
    _time: number
  ): void {
    const ex = px + 6;
    const ey = py + 6;
    const ew = TILE_SIZE - 12;
    const eh = TILE_SIZE - 10;

    // Industrial Life Support Frame
    ctx.fillStyle = '#0c4a6e';
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(ex, ey, ew, eh, 6);
    ctx.fill();
    ctx.stroke();

    // Twin High-Pressure Titanium Tanks (Left: H2, Right: O2)
    const tankW = (ew - 8) / 2;
    const th = eh - 8;

    // Left Tank
    ctx.fillStyle = '#0369a1';
    ctx.beginPath();
    ctx.roundRect(ex + 2, ey + 4, tankW, th, 4);
    ctx.fill();

    // Right Tank (O2 with blue glow)
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.roundRect(ex + tankW + 6, ey + 4, tankW, th, 4);
    ctx.fill();

    // Center Inspection Glass Window
    const chamberX = ex + tankW + 1;
    const chamberW = 4;
    ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.fillRect(chamberX, ey + 6, chamberW, th - 4);

    // Top Manifold Pipes
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ex + 4, ey + 2);
    ctx.lineTo(ex + ew - 4, ey + 2);
    ctx.stroke();
  }

  // --- CO2 Scrubber (CDRA) ---
  private static drawCO2Scrubber(
    ctx: CanvasRenderingContext2D,
    px: number,
    py: number,
    isPowered: boolean,
    time: number
  ): void {
    const sx = px + 6;
    const sy = py + 7;
    const sw = TILE_SIZE - 12;
    const sh = TILE_SIZE - 12;

    // Module Frame
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(sx, sy, sw, sh, 5);
    ctx.fill();
    ctx.stroke();

    // Central Air Intake Turbine Vent
    const cx = sx + sw / 2;
    const cy = sy + sh / 2;
    const radius = 9;

    ctx.fillStyle = '#090d16';
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    // Spinning Turbine Fan Blades
    if (isPowered) {
      const angle = time * 0.01;
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2;
      for (let i = 0; i < 4; i++) {
        const a = angle + (i * Math.PI) / 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(a) * (radius - 2), cy + Math.sin(a) * (radius - 2));
        ctx.stroke();
      }
    }
  }

  // --- Crew Habitat Module ---
  private static drawCrewHabitat(
    ctx: CanvasRenderingContext2D,
    px: number,
    py: number,
    isPowered: boolean,
    time: number
  ): void {
    const cx = px + TILE_SIZE / 2;
    const cy = py + TILE_SIZE / 2 + 2;
    const domeRadius = TILE_SIZE * 0.42;

    // Pressurized Multi-Layer Insulation (MLI) White Inflatable Dome
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(cx, cy, domeRadius, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Structural Kevlar Support Ribs
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, domeRadius * 0.65, Math.PI, 0);
    ctx.stroke();

    // Illuminated Observation Cupola Windows
    const winW = 12;
    const winH = 6;
    const wx = cx - winW / 2;
    const wy = cy - domeRadius * 0.55;

    // Warm Interior Ambient Glow
    const glowColor = isPowered ? '#fef08a' : '#64748b';
    ctx.fillStyle = glowColor;
    ctx.beginPath();
    ctx.roundRect(wx, wy, winW, winH, 3);
    ctx.fill();

    // Window Glass Specular Highlights
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Crew Silhouette Inside Window
    if (isPowered) {
      const bob = Math.sin(time * 0.003) * 1;
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(cx, wy + 3 + bob, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Airlock Vestibule Tunnel at Bottom
    ctx.fillStyle = '#475569';
    ctx.fillRect(cx - 6, cy - 2, 12, 6);
    ctx.fillStyle = isPowered ? '#10b981' : '#f59e0b';
    ctx.fillRect(cx - 2, cy + 1, 4, 2);
  }

  // --- Regolith Shield ---
  private static drawRegolithShield(
    ctx: CanvasRenderingContext2D,
    px: number,
    py: number
  ): void {
    const rx = px + 4;
    const ry = py + 5;
    const rw = TILE_SIZE - 8;
    const rh = TILE_SIZE - 8;

    // 3D-Printed Interlocking Lunar Sintered Regolith Arch
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.moveTo(rx, ry + rh);
    ctx.lineTo(rx + rw * 0.2, ry + 4);
    ctx.lineTo(rx + rw * 0.8, ry + 4);
    ctx.lineTo(rx + rw, ry + rh);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Layered 3D print sintering striations
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;
    for (let i = 1; i <= 4; i++) {
      const yLine = ry + 4 + i * (rh / 5);
      ctx.beginPath();
      ctx.moveTo(rx + (i * 2), yLine);
      ctx.lineTo(rx + rw - (i * 2), yLine);
      ctx.stroke();
    }

    // Heavy Boulder Cladding on Top
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.arc(rx + rw * 0.35, ry + 4, 3, 0, Math.PI * 2);
    ctx.arc(rx + rw * 0.65, ry + 3, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // --- Subterranean Vault ---
  private static drawSubterraneanVault(
    ctx: CanvasRenderingContext2D,
    px: number,
    py: number,
    isPowered: boolean,
    time: number
  ): void {
    const vx = px + 5;
    const vy = py + 6;
    const vw = TILE_SIZE - 10;
    const vh = TILE_SIZE - 10;

    // Heavy Concrete / Lead Blast Rim
    ctx.fillStyle = '#1e1b4b';
    ctx.strokeStyle = '#4338ca';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(vx, vy, vw, vh, 8);
    ctx.fill();
    ctx.stroke();

    // Hazard Stripes on Hatch Perimeter
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(vx + 3, vy + 2, 4, 2);
    ctx.fillRect(vx + vw - 7, vy + 2, 4, 2);
    ctx.fillRect(vx + 3, vy + vh - 4, 4, 2);
    ctx.fillRect(vx + vw - 7, vy + vh - 4, 4, 2);

    // Vault Heavy Blast Door Wheel Hatch
    const cx = vx + vw / 2;
    const cy = vy + vh / 2;
    ctx.fillStyle = '#312e81';
    ctx.beginPath();
    ctx.arc(cx, cy, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Hatch Locking Wheel
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    ctx.fill();

    // Strobe Warning Beacon
    if (isPowered) {
      const strobe = Math.sin(time * 0.015) > 0 ? '#ef4444' : '#7f1d1d';
      ctx.fillStyle = strobe;
      ctx.beginPath();
      ctx.arc(vx + 5, vy + 5, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // --- CSA Hydroponics Unit ---
  private static drawHydroponics(
    ctx: CanvasRenderingContext2D,
    px: number,
    py: number,
    isPowered: boolean,
    time: number
  ): void {
    const hx = px + 5;
    const hy = py + 7;
    const hw = TILE_SIZE - 10;
    const hh = TILE_SIZE - 12;

    // Greenhouse Base Frame
    ctx.fillStyle = '#064e3b';
    ctx.strokeStyle = '#059669';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(hx, hy, hw, hh, 6);
    ctx.fill();
    ctx.stroke();

    // Magenta / Purple Horticultural LED Lighting Canopy
    const ledGlow = isPowered ? 'rgba(217, 70, 239, 0.4)' : 'rgba(0, 0, 0, 0.3)';
    ctx.fillStyle = ledGlow;
    ctx.beginPath();
    ctx.roundRect(hx + 2, hy + 2, hw - 4, hh - 4, 4);
    ctx.fill();

    // Tiered Outredgeous Lettuce Leaves (Animated Growth & Sway)
    const sway = Math.sin(time * 0.005) * 1.5;
    ctx.fillStyle = '#22c55e';
    // 3 Lush Lettuce Tufts
    const spots = [
      { x: hx + 6, y: hy + hh - 8 },
      { x: hx + hw / 2, y: hy + hh - 9 },
      { x: hx + hw - 6, y: hy + hh - 8 },
    ];

    spots.forEach((sp, i) => {
      ctx.beginPath();
      ctx.arc(sp.x + (i === 1 ? sway : -sway), sp.y, 4, 0, Math.PI * 2);
      ctx.fill();

      // Bright fresh green heart
      ctx.fillStyle = '#86efac';
      ctx.beginPath();
      ctx.arc(sp.x + (i === 1 ? sway : -sway), sp.y - 1, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#22c55e';
    });
  }

  // --- Water Extractor Rig ---
  private static drawWaterExtractor(
    ctx: CanvasRenderingContext2D,
    px: number,
    py: number,
    isPowered: boolean,
    time: number
  ): void {
    const wx = px + 6;
    const wy = py + 6;
    const ww = TILE_SIZE - 12;
    const wh = TILE_SIZE - 10;

    // Heavy Mining Chassis
    ctx.fillStyle = '#115e59';
    ctx.strokeStyle = '#0d9488';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(wx, wy, ww, wh, 5);
    ctx.fill();
    ctx.stroke();

    // Cryogenic Ice Storage Tank (Blue Cylinder)
    ctx.fillStyle = '#06b6d4';
    ctx.fillRect(wx + 3, wy + 3, ww * 0.45, wh - 6);

    // Vertical Auger Drill Assembly
    const drillX = wx + ww * 0.75;
    const drillY = wy + 4;
    const drillH = wh - 4;

    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(drillX - 2, drillY, 4, drillH);

    // Rotating Auger Spiral
    if (isPowered) {
      const drillOffset = (time * 0.05) % 6;
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      for (let y = drillY; y < drillY + drillH; y += 5) {
        ctx.beginPath();
        ctx.moveTo(drillX - 3, y + drillOffset);
        ctx.lineTo(drillX + 3, y + drillOffset + 2);
        ctx.stroke();
      }
    }
  }

  // --- 11. Emergency Oxygen Generator ---
  private static drawEmergencyO2(ctx: CanvasRenderingContext2D, px: number, py: number, isPowered: boolean, time: number): void {
    const ox = px + 8;
    const oy = py + 6;
    const ow = TILE_SIZE - 16;
    const oh = TILE_SIZE - 12;

    // High-pressure titanium canister body
    ctx.fillStyle = '#dc2626'; // High-alert red canister
    ctx.beginPath();
    ctx.roundRect(ox, oy, ow, oh, 6);
    ctx.fill();

    // Hazard safety stripes
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(ox + 4, oy + 4, ow - 8, 3);
    ctx.fillRect(ox + 4, oy + oh - 7, ow - 8, 3);

    // Pressure gauge dial
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(ox + ow / 2, oy + oh / 2, 6, 0, Math.PI * 2);
    ctx.fill();

    // Needle
    const needleAngle = isPowered ? Math.sin(time * 0.01) * 0.8 : 0;
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(ox + ow / 2, oy + oh / 2);
    ctx.lineTo(ox + ow / 2 + Math.cos(needleAngle) * 5, oy + oh / 2 + Math.sin(needleAngle) * 5);
    ctx.stroke();
  }

  // --- 12. Water Recycling System ---
  private static drawWaterRecycler(ctx: CanvasRenderingContext2D, px: number, py: number, isPowered: boolean, time: number): void {
    const rx = px + 6;
    const ry = py + 6;
    const rw = TILE_SIZE - 12;
    const rh = TILE_SIZE - 12;

    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(rx, ry, rw, rh, 6);
    ctx.fill();

    // Water filtration chamber
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.roundRect(rx + 4, ry + 4, rw - 8, rh - 8, 4);
    ctx.fill();

    // Bubbles
    if (isPowered) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      const bubbleY = ry + rh - 6 - ((time * 0.02) % (rh - 10));
      ctx.beginPath();
      ctx.arc(rx + rw / 2 - 4, bubbleY, 2, 0, Math.PI * 2);
      ctx.arc(rx + rw / 2 + 4, (bubbleY + 6) % (rh - 8) + ry + 4, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // --- 13. Habitat Heating System ---
  private static drawHeatingSystem(ctx: CanvasRenderingContext2D, px: number, py: number, isPowered: boolean, time: number): void {
    const hx = px + 6;
    const hy = py + 6;
    const hw = TILE_SIZE - 12;
    const hh = TILE_SIZE - 12;

    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.roundRect(hx, hy, hw, hh, 5);
    ctx.fill();

    // Glowing heating element coils
    const glow = isPowered ? Math.sin(time * 0.006) * 0.3 + 0.7 : 0.2;
    ctx.strokeStyle = `rgba(249, 115, 22, ${glow})`;
    ctx.lineWidth = 2;

    for (let y = hy + 6; y < hy + hh - 4; y += 5) {
      ctx.beginPath();
      ctx.moveTo(hx + 5, y);
      ctx.lineTo(hx + hw - 5, y);
      ctx.stroke();
    }
  }

  // --- 14. Earth Connection Channel ---
  private static drawEarthChannel(ctx: CanvasRenderingContext2D, px: number, py: number, isPowered: boolean, time: number): void {
    const cx = px + TILE_SIZE / 2;
    const cy = py + TILE_SIZE / 2;

    // Base pedestal
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.roundRect(px + 10, py + TILE_SIZE - 12, TILE_SIZE - 20, 8, 2);
    ctx.fill();

    // Parabolic antenna dish directed up towards Earth
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(cx, cy - 2, 12, Math.PI * 0.8, Math.PI * 2.2);
    ctx.fill();

    // Dish rim
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Feed horn & sub-reflector
    ctx.strokeStyle = '#0284c7';
    ctx.beginPath();
    ctx.moveTo(cx, cy - 2);
    ctx.lineTo(cx + 6, cy - 10);
    ctx.stroke();

    // Transmit signal waves when powered
    if (isPowered) {
      const ping = (time * 0.005) % 1;
      ctx.strokeStyle = `rgba(56, 189, 248, ${1 - ping})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx + 6, cy - 10, ping * 12, -Math.PI * 0.5, 0);
      ctx.stroke();
    }
  }

  // --- Sleek, Compact Power Junction Conduit Node ---
  public static drawPowerJunction(
    ctx: CanvasRenderingContext2D,
    px: number,
    py: number,
    isPowered: boolean,
    time: number
  ): void {
    const cx = px + TILE_SIZE / 2;
    const cy = py + TILE_SIZE / 2;

    ctx.save();

    // Subtle ambient glow when powered
    if (isPowered) {
      const pulse = Math.sin(time * 0.005) * 1.2;
      ctx.fillStyle = 'rgba(56, 189, 248, 0.28)';
      ctx.beginPath();
      ctx.arc(cx, cy, 6 + pulse, 0, Math.PI * 2);
      ctx.fill();
    }

    // Outer compact casing (sleek dark metallic terminal pad)
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = isPowered ? '#0284c7' : '#78350f';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Central glowing core diode
    ctx.fillStyle = isPowered ? '#38bdf8' : '#f59e0b';
    ctx.beginPath();
    ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Specular glint
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx - 0.8, cy - 0.8, 1, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // --- Central Outpost Base (4 Tiles: 96x96 px) ---
  private static drawOutpostBase(
    ctx: CanvasRenderingContext2D,
    px: number,
    py: number,
    _isPowered: boolean,
    time: number
  ): void {
    const w = TILE_SIZE * 2; // 96px
    const h = TILE_SIZE * 2; // 96px
    const cx = px + w / 2;
    const cy = py + h / 2;

    // 1. Massive 4-tile Ground Shadow
    ctx.fillStyle = 'rgba(10, 15, 30, 0.55)';
    ctx.beginPath();
    ctx.ellipse(cx + 6, cy + 32, 42, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Heavy Titanium Landing Gear & Hydraulic Shock Struts (4 corners)
    const corners = [
      { legX: px + 14, legY: py + 14, footX: px + 8, footY: py + 8 },
      { legX: px + w - 14, legY: py + 14, footX: px + w - 8, footY: py + 8 },
      { legX: px + 14, legY: py + h - 14, footX: px + 8, footY: py + h - 8 },
      { legX: px + w - 14, legY: py + h - 14, footX: px + w - 8, footY: py + h - 8 },
    ];

    corners.forEach((c) => {
      // Primary titanium structural beam
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(c.legX, c.legY);
      ctx.stroke();

      // Hydraulic piston arm
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(c.legX, c.legY);
      ctx.lineTo(c.footX, c.footY);
      ctx.stroke();

      // Gold MLI foil covered landing footpad
      ctx.fillStyle = '#d97706';
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(c.footX, c.footY, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });

    // 3. Central Reinforced Foundation Deck
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(cx, cy, 38, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 4. Outer Docking Airlock Vestibules (North, South, West, East)
    const airlocks = [
      { x: cx - 10, y: py + 6, w: 20, h: 16 }, // North
      { x: cx - 10, y: py + h - 22, w: 20, h: 16 }, // South
      { x: px + 6, y: cy - 10, w: 16, h: 20 }, // West
      { x: px + w - 22, y: cy - 10, w: 16, h: 20 }, // East
    ];

    airlocks.forEach((al, i) => {
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(al.x, al.y, al.w, al.h, 4);
      ctx.fill();
      ctx.stroke();

      // Hatch docking seal
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      if (i < 2) {
        ctx.fillRect(al.x + 4, al.y + (i === 0 ? 1 : al.h - 3), al.w - 8, 2);
      } else {
        ctx.fillRect(al.x + (i === 2 ? 1 : al.w - 3), al.y + 4, 2, al.h - 8);
      }
    });

    // 5. Inflatable Multi-Layer Insulation (MLI) Pressurized Main Dome
    const domeGrad = ctx.createRadialGradient(cx - 8, cy - 8, 4, cx, cy, 28);
    domeGrad.addColorStop(0, '#ffffff');
    domeGrad.addColorStop(0.7, '#e2e8f0');
    domeGrad.addColorStop(1, '#94a3b8');
    ctx.fillStyle = domeGrad;
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, 27, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Circumferential Kevlar structural tension seam
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, 18, 0, Math.PI * 2);
    ctx.stroke();

    // 6. Observation Cupola & Command Bridge (Glowing Cyan Windows)
    const cupolaRadius = 10;
    ctx.fillStyle = '#090d16';
    ctx.beginPath();
    ctx.arc(cx, cy - 3, cupolaRadius + 1, 0, Math.PI * 2);
    ctx.fill();

    const winGrad = ctx.createRadialGradient(cx, cy - 3, 2, cx, cy - 3, cupolaRadius);
    winGrad.addColorStop(0, '#7dd3fc');
    winGrad.addColorStop(1, '#0284c7');
    ctx.fillStyle = winGrad;
    ctx.beginPath();
    ctx.arc(cx, cy - 3, cupolaRadius, 0, Math.PI * 2);
    ctx.fill();

    // Cupola cross-mullion window frames
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - cupolaRadius, cy - 3);
    ctx.lineTo(cx + cupolaRadius, cy - 3);
    ctx.moveTo(cx, cy - 3 - cupolaRadius);
    ctx.lineTo(cx, cy - 3 + cupolaRadius);
    ctx.stroke();

    // 7. Parabolic Communications Antenna Dish
    const dishX = cx + 14;
    const dishY = cy - 14;
    ctx.strokeStyle = '#d97706';
    ctx.fillStyle = '#f59e0b';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(dishX, dishY, 7, 0.8 * Math.PI, 1.8 * Math.PI);
    ctx.stroke();
    // Dish feed horn
    ctx.beginPath();
    ctx.moveTo(dishX, dishY);
    ctx.lineTo(dishX + 4, dishY - 4);
    ctx.stroke();

    // 8. Central Telemetry Beacon (Pulsing Green / Blue)
    const beaconPulse = Math.sin(time * 0.005) * 1.5 + 3.5;
    ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.beginPath();
    ctx.arc(cx, cy - 3, beaconPulse + 5, 0, Math.PI * 2);
    ctx.fill();

    // 9. NASA Artemis Base Nameplate Badge
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(cx - 28, cy + 18, 56, 11, 3);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 7.5px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ARTEMIS BASE', cx, cy + 24);
  }

  // --- Fallback Module ---
  private static drawGenericModule(ctx: CanvasRenderingContext2D, px: number, py: number): void {
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.roundRect(px + 6, py + 6, TILE_SIZE - 12, TILE_SIZE - 12, 6);
    ctx.fill();
  }
}
