/**
 * Simulation Time Manager
 * NASA Outpost 3D Lunar Frontend
 *
 * Coordinates elapsed simulation hours, mission Sol and Sol Hour decomposition,
 * speed multipliers (1x, 6x, 30x, 360x, 708x), play/pause, bidirectional scrubbing,
 * and state change subscriptions.
 */

import { EphemerisCalculator, type EphemerisOptions } from './EphemerisCalculator';
import type { CelestialTimeState, SolarEphemeris, TimeMultiplier } from '../core/types';

export interface TimeManagerConfig {
  initialHours?: number;      // Default: 6.0 (Sol 1, 06:00)
  defaultMultiplier?: number; // Default: 1.0
  season?: 'equinox' | 'summer_solstice' | 'winter_solstice';
}

export type TimeUpdateCallback = (timeState: CelestialTimeState, ephemeris: SolarEphemeris) => void;

export class TimeManager {
  private totalHours: number;
  private multiplier: number;
  private cachedMultiplier: number;
  private paused: boolean;
  private season: 'equinox' | 'summer_solstice' | 'winter_solstice';
  private readonly listeners: Set<TimeUpdateCallback> = new Set();

  constructor(config: TimeManagerConfig = {}) {
    this.totalHours = config.initialHours ?? 6.0; // Start at Sol 1, 06:00
    this.multiplier = config.defaultMultiplier ?? 1.0;
    this.cachedMultiplier = this.multiplier > 0 ? this.multiplier : 1.0;
    this.paused = false;
    this.season = config.season ?? 'equinox';
  }

  /**
   * Advances simulation time by deltaRealSeconds and notifies subscribers.
   */
  public update(deltaRealSeconds: number): { timeState: CelestialTimeState; ephemeris: SolarEphemeris } {
    if (!this.paused && this.multiplier > 0) {
      const deltaHours = deltaRealSeconds * this.multiplier;
      this.totalHours += deltaHours;
    }

    const timeState = this.getState();
    const ephemeris = this.getEphemeris();
    this.notifyListeners(timeState, ephemeris);

    return { timeState, ephemeris };
  }

  /**
   * Alias for update() to support generic tick calling.
   */
  public tick(deltaRealSeconds: number): { timeState: CelestialTimeState; ephemeris: SolarEphemeris } {
    return this.update(deltaRealSeconds);
  }

  /**
   * Returns current CelestialTimeState snapshot per PROJECT.md interface contract.
   */
  public getState(): CelestialTimeState {
    const wrappedHours = EphemerisCalculator.normalizeHours(this.totalHours);
    const sol = Math.floor(this.totalHours / 24.0) + 1;
    const timeOfDayHours = this.totalHours % 24.0;
    const synodicPhase = wrappedHours / EphemerisCalculator.SYNODIC_PERIOD_HOURS;

    const ephem = this.getEphemeris();
    const isDaylight = ephem.solarYieldFactor > 0.05 || ephem.sunElevationRad > 0.0;

    return {
      totalHours: this.totalHours,
      sol,
      timeOfDayHours,
      synodicPhase,
      isDaylight,
    };
  }

  /**
   * Alias for getState() matching getTimeState contract.
   */
  public getTimeState(): CelestialTimeState {
    return this.getState();
  }

  /**
   * Returns current SolarEphemeris calculated for current totalHours.
   */
  public getEphemeris(options?: EphemerisOptions): SolarEphemeris {
    const opts = options ?? { season: this.season };
    return EphemerisCalculator.calculate(this.totalHours, opts);
  }

  /**
   * Sets speed multiplier (e.g. 1, 6, 30, 360, 708). Unpauses if multiplier > 0.
   */
  public setMultiplier(multiplier: number): void {
    if (multiplier <= 0) {
      this.pause();
    } else {
      this.multiplier = multiplier;
      this.cachedMultiplier = multiplier;
      this.paused = false;
    }
  }

  /**
   * Alias for setMultiplier().
   */
  public setSpeed(multiplier: number | TimeMultiplier): void {
    this.setMultiplier(multiplier);
  }

  /**
   * Returns the current configured speed multiplier.
   */
  public getMultiplier(): number {
    return this.multiplier;
  }

  /**
   * Alias for getMultiplier().
   */
  public getSpeed(): number {
    return this.multiplier;
  }

  public pause(): void {
    if (!this.paused) {
      this.cachedMultiplier = this.multiplier > 0 ? this.multiplier : 1.0;
      this.paused = true;
    }
  }

  public resume(): void {
    if (this.paused) {
      this.multiplier = this.cachedMultiplier > 0 ? this.cachedMultiplier : 1.0;
      this.paused = false;
    }
  }

  public togglePause(): boolean {
    if (this.paused) {
      this.resume();
    } else {
      this.pause();
    }
    return this.paused;
  }

  public togglePlayPause(): boolean {
    return this.togglePause();
  }

  public isPaused(): boolean {
    return this.paused;
  }

  public isTimePaused(): boolean {
    return this.paused;
  }

  public getTotalHours(): number {
    return this.totalHours;
  }

  public setSeason(season: 'equinox' | 'summer_solstice' | 'winter_solstice'): void {
    this.season = season;
  }

  /**
   * Scrubs directly to target elapsed simulation hours.
   * Clamps negative to 0.0 and excessive to SYNODIC_PERIOD_HOURS.
   */
  public setTime(hours: number): { timeState: CelestialTimeState; ephemeris: SolarEphemeris } {
    if (hours < 0) {
      this.totalHours = 0.0;
    } else if (hours > EphemerisCalculator.SYNODIC_PERIOD_HOURS) {
      this.totalHours = EphemerisCalculator.SYNODIC_PERIOD_HOURS;
    } else {
      this.totalHours = hours;
    }

    const timeState = this.getState();
    const ephemeris = this.getEphemeris();
    this.notifyListeners(timeState, ephemeris);
    return { timeState, ephemeris };
  }

  /**
   * Alias for setTime().
   */
  public scrubTo(hours: number): { timeState: CelestialTimeState; ephemeris: SolarEphemeris } {
    return this.setTime(hours);
  }

  /**
   * Scrubs to specific Sol and Sol hour (e.g. Sol 7, 00:00).
   */
  public scrubToSol(sol: number, hour: number): { timeState: CelestialTimeState; ephemeris: SolarEphemeris } {
    const hours = (sol - 1) * 24.0 + hour;
    return this.setTime(hours);
  }

  /**
   * Resets simulation clock (defaults to 0.0h for unit test runs).
   */
  public reset(initialHours: number = 0.0): void {
    this.totalHours = initialHours;
    this.multiplier = 1.0;
    this.cachedMultiplier = 1.0;
    this.paused = false;
  }

  /**
   * Adds state update subscriber. Returns unsubscribe callback.
   */
  public subscribe(callback: TimeUpdateCallback): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners(timeState: CelestialTimeState, ephem: SolarEphemeris): void {
    for (const listener of this.listeners) {
      listener(timeState, ephem);
    }
  }
}
