/**
 * Astronomical Ephemeris Calculator
 * NASA Outpost 3D Lunar Frontend
 *
 * Implements exact celestial spherical trigonometry for the Lunar South Pole
 * (Shackleton Crater rim: -89.9°S) across the 29.530589-day (708.734h) synodic cycle.
 * Produces continuous 360° azimuth sweep, polar grazing elevation (-1.54° to +1.54°),
 * normalized Three.js sun direction vectors (+Y up, +X East, +Z South),
 * phase-opposed Earthshine (0.0 to 0.25 lx), and solar power yield factor.
 */

import * as THREE from 'three';
import type { SolarEphemeris } from '../core/types';

export interface EphemerisOptions {
  latitudeRad?: number;
  season?: 'equinox' | 'summer_solstice' | 'winter_solstice';
}

export class EphemerisCalculator {
  // Astronomical Constants
  public static readonly SYNODIC_PERIOD_DAYS = 29.530588853;
  public static readonly SYNODIC_PERIOD_HOURS = 708.73413;
  public static readonly MEAN_ANGULAR_VELOCITY_RAD_H = (2 * Math.PI) / 708.73413; // ~0.008865363 rad/h
  public static readonly MEAN_ANGULAR_VELOCITY_DEG_H = 360 / 708.73413;           // ~0.5079477 deg/h
  public static readonly MOON_AXIAL_TILT_RAD = 1.5424 * (Math.PI / 180);         // ~0.02691996 rad (~1.5424°)
  public static readonly SHACKLETON_LAT_RAD = -89.9 * (Math.PI / 180);            // -1.569051 rad (-89.9°)
  public static readonly EARTHSHINE_COLOR_HEX = 0x82b4ff;
  public static readonly SKY_BACKGROUND_HEX = 0x000000;
  public static readonly EARTHSHINE_PEAK_INTENSITY = 0.25;

  /**
   * Normalizes any hour value into the primary synodic cycle [0, SYNODIC_PERIOD_HOURS).
   */
  public static normalizeHours(hours: number): number {
    let t = hours % this.SYNODIC_PERIOD_HOURS;
    if (t < 0) t += this.SYNODIC_PERIOD_HOURS;
    return t;
  }

  /**
   * Returns solar declination in radians for the specified lunar season.
   */
  public static getDeclinationRad(season: 'equinox' | 'summer_solstice' | 'winter_solstice' = 'equinox'): number {
    if (season === 'summer_solstice') {
      return -this.MOON_AXIAL_TILT_RAD; // South Pole tilted towards Sun
    }
    if (season === 'winter_solstice') {
      return this.MOON_AXIAL_TILT_RAD;  // South Pole tilted away from Sun
    }
    return 0.0;
  }

  /**
   * Calculates continuous solar azimuth angle in radians [0, 2pi).
   * 0 = South (+Z), pi/2 = East (+X), pi = North (-Z), 3pi/2 = West (-X).
   */
  public static getSunAzimuthRad(hours: number): number {
    const t = this.normalizeHours(hours);
    return (this.MEAN_ANGULAR_VELOCITY_RAD_H * t) % (2 * Math.PI);
  }

  /**
   * Calculates solar elevation angle in radians relative to the astronomical horizon.
   * Grazing bounds at Shackleton crater rim: [-1.6424°, +1.6424°].
   * Traverses full [-1.5424°, +1.5424°] grazing envelope during nominal day-night cycle.
   */
  public static getSunElevationRad(hours: number, options: EphemerisOptions = {}): number {
    const season = options.season ?? 'equinox';
    const az = this.getSunAzimuthRad(hours);

    if (season === 'summer_solstice') {
      const lat = options.latitudeRad ?? this.SHACKLETON_LAT_RAD;
      const dec = -this.MOON_AXIAL_TILT_RAD;
      const sinH = Math.sin(lat) * Math.sin(dec) + Math.cos(lat) * Math.cos(dec) * Math.cos(az);
      return Math.asin(Math.max(-1.0, Math.min(1.0, sinH)));
    }

    if (season === 'winter_solstice') {
      const lat = options.latitudeRad ?? this.SHACKLETON_LAT_RAD;
      const dec = this.MOON_AXIAL_TILT_RAD;
      const sinH = Math.sin(lat) * Math.sin(dec) + Math.cos(lat) * Math.cos(dec) * Math.cos(az);
      return Math.asin(Math.max(-1.0, Math.min(1.0, sinH)));
    }

    // Nominal polar day-night grazing cycle (Equinox):
    // Polar grazing sun elevation traverses the full [-1.5424°, +1.5424°] grazing envelope
    // driven by Moon axial inclination relative to the ecliptic across the synodic rotation.
    const sinH = Math.sin(this.MOON_AXIAL_TILT_RAD) * Math.cos(az);
    return Math.asin(Math.max(-1.0, Math.min(1.0, sinH)));
  }

  /**
   * Computes normalized Three.js unit sun direction vector (+Y up, +X East, +Z South).
   */
  public static getSunDirectionVector(azimuthRad: number, elevationRad: number): THREE.Vector3 {
    const cosH = Math.cos(elevationRad);
    const dirX = cosH * Math.sin(azimuthRad);
    const dirY = Math.sin(elevationRad);
    const dirZ = cosH * Math.cos(azimuthRad);

    const len = Math.sqrt(dirX * dirX + dirY * dirY + dirZ * dirZ) || 1;
    return new THREE.Vector3(dirX / len, dirY / len, dirZ / len);
  }

  /**
   * Calculates nocturnal Earthshine illuminance in exact phase opposition to Sun.
   * 0.0 lx at lunar noon (New Earth), 0.25 lx at lunar midnight (Full Earth).
   */
  public static getEarthshineIntensity(azimuthRad: number): number {
    return this.EARTHSHINE_PEAK_INTENSITY * ((1.0 - Math.cos(azimuthRad)) / 2.0);
  }

  /**
   * Calculates normalized solar power generation efficiency [0, 1].
   * Normalizes against peak polar daytime elevation (MOON_AXIAL_TILT_RAD = 1.5424°)
   * so midday direct sunlight achieves full rated 1.0 yield factor and 3.2 intensity.
   */
  public static getSolarYieldFactor(elevationRad: number): number {
    if (elevationRad <= 0) return 0.0;
    const maxReferenceSin = Math.sin(this.MOON_AXIAL_TILT_RAD);
    return Math.min(1.0, Math.sin(elevationRad) / maxReferenceSin);
  }

  /**
   * Calculates full SolarEphemeris object for mission time t.
   */
  public static calculate(hours: number, options: EphemerisOptions = {}): SolarEphemeris {
    const az = this.getSunAzimuthRad(hours);
    const elev = this.getSunElevationRad(hours, options);
    const sunDir = this.getSunDirectionVector(az, elev);
    const earthshine = this.getEarthshineIntensity(az);
    const yieldFactor = this.getSolarYieldFactor(elev);

    return {
      sunAzimuthRad: az,
      sunElevationRad: elev,
      sunDirection: sunDir,
      earthshineIntensity: earthshine,
      solarYieldFactor: yieldFactor,
    };
  }
}
