/**
 * AAA Web Audio API Procedural Sound Synthesizer & Multi-Track Adaptive Synthwave Sequencer
 * Features:
 * - 4-Track Dynamic Synthwave Sequencer (Sub-Bass, Cyber-Drums, Stereo Poly-Pads, Arp/Lead)
 * - 4 Adaptive Intensity States ('exploration' | 'combat' | 'overdrive' | 'boss')
 * - Procedural Sidechain Audio Ducking (Gain + Lowpass Filter Envelope) on Boss Alerts & Explosions
 * - Specialized Spatial Stereo Sound Effects (`StereoPannerNode`) for all 10 Laser Weapon Styles & 4 Missile Classes
 */

import { LaserBeamStyle, MissileWeaponId } from './types.ts';

export type CombatMusicIntensity = 'exploration' | 'combat' | 'overdrive' | 'boss';

export type WeaponSoundType =
  | LaserBeamStyle
  | 'light'
  | 'heavy'
  | 'plasma'
  | 'missile';

/**
 * Priority-aware Mobile Haptic Immersion Controller using navigator.vibrate().
 * Ensures high-priority combat events (taking damage, Paragon level-ups, boss alerts)
 * are never overwritten by high-frequency micro-pulses from rapid weapon firing.
 */
class HapticEngine {
  private isEnabled: boolean = true;
  private activeUntil: number = 0;
  private activePriority: number = 0;
  private lastWeaponPulseTime: number = 0;

  constructor() {
    try {
      const saved = localStorage.getItem('aether_haptics');
      if (saved !== null) {
        this.isEnabled = saved !== 'false';
      }
    } catch (e) {
      // safe fallback
    }
  }

  public isSupported(): boolean {
    return typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
  }

  public getEnabled(): boolean {
    return this.isEnabled;
  }

  public toggleEnabled(): boolean {
    this.isEnabled = !this.isEnabled;
    try {
      localStorage.setItem('aether_haptics', String(this.isEnabled));
    } catch (e) {}
    if (this.isEnabled) {
      this.trigger([15, 30, 25], 3);
    } else if (this.isSupported()) {
      try {
        navigator.vibrate(0);
      } catch (e) {}
    }
    return this.isEnabled;
  }

  private getPatternDuration(pattern: number | number[]): number {
    if (typeof pattern === 'number') return pattern;
    return pattern.reduce((sum, val) => sum + val, 0);
  }

  public trigger(pattern: number | number[], priority: number = 1): boolean {
    if (!this.isEnabled || !this.isSupported()) return false;

    const now = performance.now();
    if (now < this.activeUntil && priority < this.activePriority) {
      return false;
    }

    const duration = this.getPatternDuration(pattern);
    this.activeUntil = now + duration;
    this.activePriority = priority;

    try {
      navigator.vibrate(pattern);
      return true;
    } catch (e) {
      return false;
    }
  }

  public vibrateWeaponFire(
    type: 'light' | 'heavy' | 'plasma' | 'missile' | 'crit' = 'light'
  ) {
    // Disabled continuous auto-fire vibration to prevent annoying constant buzzing in Idle Auto-Battler mode.
    if (!this.isEnabled || !this.isSupported()) return;
    if (type === 'missile') {
      const now = performance.now();
      if (now - this.lastWeaponPulseTime < 2500) return;
      this.lastWeaponPulseTime = now;
      this.trigger(12, 2);
    }
  }

  public vibrateDamage(
    severity: 'shield' | 'hull' | 'critical_hull' | 'death' = 'shield'
  ) {
    if (severity === 'death') {
      this.trigger([120, 50, 160, 50, 220], 6);
    } else if (severity === 'critical_hull') {
      this.trigger([70, 30, 90, 30, 110], 5);
    } else if (severity === 'hull') {
      this.trigger([55, 30, 75], 5);
    } else {
      this.trigger([30, 25, 20], 4);
    }
  }

  public vibrateLevelUp(
    tier: 'paragon' | 'upgrade' | 'rift_clear' | 'prestige' = 'paragon'
  ) {
    if (tier === 'prestige') {
      this.trigger([40, 45, 60, 45, 90, 45, 140], 6);
    } else if (tier === 'rift_clear') {
      this.trigger([35, 40, 50, 40, 110], 5);
    } else if (tier === 'paragon') {
      this.trigger([25, 35, 35, 35, 85], 5);
    } else {
      this.trigger([18, 30, 38], 3);
    }
  }

  public vibrateCombatEvent(
    event: 'dash' | 'special' | 'boss_alert' | 'boss_kill' | 'enemy_kill'
  ) {
    if (event === 'boss_kill') {
      this.trigger([90, 45, 120, 45, 160], 6);
    } else if (event === 'boss_alert') {
      this.trigger([65, 55, 65, 55, 110], 5);
    } else if (event === 'special') {
      this.trigger([28, 35, 65], 4);
    } else if (event === 'dash') {
      this.trigger([14, 22, 18], 3);
    } else if (event === 'enemy_kill') {
      this.trigger(14, 2);
    }
  }

  public vibrateUiTap() {
    this.trigger(6, 1);
  }
}

export const haptics = new HapticEngine();

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  // Master & SFX buses
  private masterGain: GainNode | null = null;
  private sfxBus: GainNode | null = null;

  // Multi-Track Music & Procedural Ducking buses
  private musicMasterGain: GainNode | null = null;
  private musicDuckGain: GainNode | null = null;
  private musicDuckFilter: BiquadFilterNode | null = null;

  // Individual Multi-Track Stem Gains
  private bassTrackGain: GainNode | null = null;
  private drumsTrackGain: GainNode | null = null;
  private padTrackGain: GainNode | null = null;
  private leadTrackGain: GainNode | null = null;

  // Continuous Atmospheric Pad Oscillators
  private droneOsc1: OscillatorNode | null = null;
  private droneOsc2: OscillatorNode | null = null;

  // Pre-computed noise buffer for crisp percussion & flak/explosions
  private sharedNoiseBuffer: AudioBuffer | null = null;

  // Multi-track Synthwave Sequencer state
  private seqTimer: number | null = null;
  private stepIndex: number = 0;
  private intensity: CombatMusicIntensity = 'exploration';
  private lastHoverTime: number = 0;
  private lastWeaponSfxTime: number = 0;
  private lastHitSfxTime: number = 0;

  // Ducking telemetry state
  private duckRecoveryTime: number = 0;
  private currentDuckDepth: number = 1.0;

  constructor() {
    try {
      const saved = localStorage.getItem('aether_muted');
      if (saved !== null) {
        this.isMuted = saved === 'true';
      }
    } catch (e) {
      // safe fallback
    }
  }

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();

        // Master output with gentle dynamics compression to prevent clipping during multi-slot salvos
        const compressor = this.ctx.createDynamicsCompressor();
        compressor.threshold.setValueAtTime(-10, this.ctx.currentTime);
        compressor.knee.setValueAtTime(12, this.ctx.currentTime);
        compressor.ratio.setValueAtTime(4, this.ctx.currentTime);
        compressor.attack.setValueAtTime(0.005, this.ctx.currentTime);
        compressor.release.setValueAtTime(0.18, this.ctx.currentTime);
        compressor.connect(this.ctx.destination);

        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.34, this.ctx.currentTime);
        this.masterGain.connect(compressor);

        this.sfxBus = this.ctx.createGain();
        this.sfxBus.gain.setValueAtTime(0.65, this.ctx.currentTime);
        this.sfxBus.connect(this.masterGain);

        this.ensureSharedNoiseBuffer();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  private ensureSharedNoiseBuffer(): AudioBuffer | null {
    if (!this.ctx) return null;
    if (!this.sharedNoiseBuffer) {
      const length = this.ctx.sampleRate * 2.0; // 2-second reusable white noise buffer
      this.sharedNoiseBuffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
      const output = this.sharedNoiseBuffer.getChannelData(0);
      for (let i = 0; i < length; i++) {
        output[i] = Math.random() * 2 - 1;
      }
    }
    return this.sharedNoiseBuffer;
  }

  private createPanner(pan: number = 0, targetNode?: AudioNode | null): AudioNode {
    if (!this.ctx || !this.masterGain) {
      throw new Error('AudioContext not initialized');
    }
    const destination = targetNode || this.sfxBus || this.masterGain;
    if (typeof this.ctx.createStereoPanner === 'function') {
      const panner = this.ctx.createStereoPanner();
      const clampedPan = Math.max(-1, Math.min(1, Number.isFinite(pan) ? pan : 0));
      panner.pan.setValueAtTime(clampedPan, this.ctx.currentTime);
      panner.connect(destination);
      return panner;
    }
    return destination;
  }

  /**
   * Procedural Sidechain Audio Ducking:
   * Smoothly attenuates and low-pass filters the multi-track synthwave music bus
   * when boss alerts, massive explosions, or EMP novas occur.
   */
  public triggerAudioDucking(
    duckGainLevel: number = 0.2,
    attackSec: number = 0.02,
    holdSec: number = 0.25,
    releaseSec: number = 0.65,
    filterCutoffHz: number = 650
  ) {
    if (!this.ctx || !this.musicDuckGain || !this.musicDuckFilter) return;

    const now = this.ctx.currentTime;
    const totalDuration = attackSec + holdSec + releaseSec;

    // Only override if this ducking event is deeper or extends beyond current ducking
    if (now < this.duckRecoveryTime && duckGainLevel > this.currentDuckDepth) {
      return;
    }

    this.currentDuckDepth = duckGainLevel;
    this.duckRecoveryTime = now + totalDuration;

    const gainParam = this.musicDuckGain.gain;
    gainParam.cancelScheduledValues(now);
    gainParam.setValueAtTime(Math.max(0.05, gainParam.value), now);
    gainParam.linearRampToValueAtTime(Math.max(0.05, duckGainLevel), now + attackSec);
    gainParam.setValueAtTime(Math.max(0.05, duckGainLevel), now + attackSec + holdSec);
    gainParam.exponentialRampToValueAtTime(1.0, now + totalDuration);

    const freqParam = this.musicDuckFilter.frequency;
    freqParam.cancelScheduledValues(now);
    freqParam.setValueAtTime(Math.max(200, freqParam.value), now);
    freqParam.exponentialRampToValueAtTime(Math.max(220, filterCutoffHz), now + attackSec);
    freqParam.setValueAtTime(Math.max(220, filterCutoffHz), now + attackSec + holdSec);
    freqParam.exponentialRampToValueAtTime(18000, now + totalDuration);
  }

  public isDuckingActive(): boolean {
    if (!this.ctx) return false;
    return this.ctx.currentTime < this.duckRecoveryTime;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    try {
      localStorage.setItem('aether_muted', String(this.isMuted));
    } catch (e) {}

    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.34, this.ctx.currentTime);
    }
    if (this.musicMasterGain && this.ctx) {
      this.musicMasterGain.gain.setValueAtTime(0, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  public setCombatIntensity(mode: CombatMusicIntensity) {
    if (this.intensity === mode) return;
    this.intensity = mode;
    this.updateMultiTrackMix();
  }

  public getCombatIntensity(): CombatMusicIntensity {
    return this.intensity;
  }

  /**
   * Smoothly crossfades the 4 synthwave stem tracks based on current combat state.
   */
  private updateMultiTrackMix() {
    if (!this.ctx || !this.bassTrackGain || !this.drumsTrackGain || !this.padTrackGain || !this.leadTrackGain) {
      return;
    }
    const t = this.ctx.currentTime;
    const ramp = 0.35;

    if (this.intensity === 'exploration') {
      this.bassTrackGain.gain.setTargetAtTime(0.45, t, ramp);
      this.drumsTrackGain.gain.setTargetAtTime(0.18, t, ramp);
      this.padTrackGain.gain.setTargetAtTime(0.85, t, ramp);
      this.leadTrackGain.gain.setTargetAtTime(0.15, t, ramp);
    } else if (this.intensity === 'combat') {
      this.bassTrackGain.gain.setTargetAtTime(0.82, t, ramp);
      this.drumsTrackGain.gain.setTargetAtTime(0.78, t, ramp);
      this.padTrackGain.gain.setTargetAtTime(0.6, t, ramp);
      this.leadTrackGain.gain.setTargetAtTime(0.55, t, ramp);
    } else if (this.intensity === 'overdrive') {
      this.bassTrackGain.gain.setTargetAtTime(0.95, t, ramp);
      this.drumsTrackGain.gain.setTargetAtTime(0.95, t, ramp);
      this.padTrackGain.gain.setTargetAtTime(0.7, t, ramp);
      this.leadTrackGain.gain.setTargetAtTime(0.85, t, ramp);
    } else {
      // 'boss'
      this.bassTrackGain.gain.setTargetAtTime(1.0, t, ramp);
      this.drumsTrackGain.gain.setTargetAtTime(1.0, t, ramp);
      this.padTrackGain.gain.setTargetAtTime(0.75, t, ramp);
      this.leadTrackGain.gain.setTargetAtTime(1.0, t, ramp);
    }

    // Shift atmospheric drone pitch for Boss tension
    if (this.droneOsc1 && this.droneOsc2) {
      const rootFreq = this.intensity === 'boss' ? 77.78 : 73.42; // Eb2 Phrygian tension vs D2
      this.droneOsc1.frequency.setTargetAtTime(rootFreq, t, 0.25);
      this.droneOsc2.frequency.setTargetAtTime(
        this.intensity === 'boss' ? 116.54 : 110.0,
        t,
        0.25
      );
    }
  }

  public playUiHover() {
    if (this.isMuted) return;
    const now = performance.now();
    if (now - this.lastHoverTime < 45) return;
    this.lastHoverTime = now;

    this.initCtx();
    if (!this.ctx || !this.sfxBus) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1650, t);
    osc.frequency.exponentialRampToValueAtTime(2480, t + 0.032);

    gain.gain.setValueAtTime(0.045, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.035);

    osc.connect(gain);
    gain.connect(this.sfxBus);
    osc.start(t);
    osc.stop(t + 0.035);
  }

  public playUiClick() {
    haptics.vibrateUiTap();
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.sfxBus) return;

    const t = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(740, t);
    osc1.frequency.exponentialRampToValueAtTime(1480, t + 0.065);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1110, t);
    osc2.frequency.exponentialRampToValueAtTime(2220, t + 0.065);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.sfxBus);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 0.07);
    osc2.stop(t + 0.07);
  }

  /**
   * Specialized Spatial Weapon Synthesizer:
   * Generates a distinct procedural acoustic signature for all 10 Laser Beam Styles
   * and legacy weapon classes, with full stereo panning (`pan` in [-1, 1]) and tier scaling.
   */
  public playWeaponFire(
    style: WeaponSoundType = 'pulse',
    options: { pan?: number; isCrit?: boolean; tier?: number } = {}
  ) {
    if (this.isMuted) return;
    const now = performance.now();
    if (now - this.lastWeaponSfxTime < 145) return;
    this.lastWeaponSfxTime = now;

    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    const pan = options.pan ?? 0;
    const isCrit = options.isCrit ?? false;
    const tier = options.tier ?? 1;

    const t = this.ctx.currentTime;
    const dest = this.createPanner(pan);
    const critPitchBoost = isCrit ? 1.18 : 1.0;
    const tierHarmonic = 1 + Math.min(0.35, (tier - 1) * 0.015);

    if (style === 'pulse' || style === 'light') {
      // Crisp Dual-Oscillator Photon Pulse Chirp
      const osc = this.ctx.createOscillator();
      const sub = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(980 * critPitchBoost * tierHarmonic, t);
      osc.frequency.exponentialRampToValueAtTime(175, t + 0.1);

      sub.type = 'triangle';
      sub.frequency.setValueAtTime(490 * critPitchBoost, t);
      sub.frequency.exponentialRampToValueAtTime(95, t + 0.1);

      gain.gain.setValueAtTime(isCrit ? 0.21 : 0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.105);

      osc.connect(gain);
      sub.connect(gain);
      gain.connect(dest);
      osc.start(t);
      sub.start(t);
      osc.stop(t + 0.105);
      sub.stop(t + 0.105);
    } else if (style === 'twin_plasma' || style === 'plasma') {
      // Resonant Band-Passed Dual Plasma Bolt
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'square';
      osc1.frequency.setValueAtTime(720 * critPitchBoost, t);
      osc1.frequency.exponentialRampToValueAtTime(240, t + 0.13);
      osc2.frequency.setValueAtTime(732 * critPitchBoost, t); // detuned chorus
      osc2.frequency.exponentialRampToValueAtTime(244, t + 0.13);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1100, t);
      filter.frequency.exponentialRampToValueAtTime(380, t + 0.13);
      filter.Q.setValueAtTime(3.2, t);

      gain.gain.setValueAtTime(isCrit ? 0.24 : 0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.135);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(dest);

      osc1.start(t);
      osc2.start(t);
      osc1.stop(t + 0.135);
      osc2.stop(t + 0.135);
    } else if (style === 'gatling') {
      // Hyper-Rotary Autocannon Transient + High-Velocity Zip
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const jitter = 0.94 + Math.random() * 0.12;

      osc.type = 'square';
      osc.frequency.setValueAtTime(640 * jitter * critPitchBoost, t);
      osc.frequency.exponentialRampToValueAtTime(110, t + 0.065);

      gain.gain.setValueAtTime(0.16, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

      osc.connect(gain);
      gain.connect(dest);
      osc.start(t);
      osc.stop(t + 0.07);
    } else if (style === 'lance' || style === 'heavy') {
      // Piercing Tachyon Lance Beam + Sub-Harmonic Core
      const beamOsc = this.ctx.createOscillator();
      const coreOsc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      beamOsc.type = 'sawtooth';
      beamOsc.frequency.setValueAtTime(1320 * critPitchBoost, t);
      beamOsc.frequency.exponentialRampToValueAtTime(310, t + 0.21);

      coreOsc.type = 'square';
      coreOsc.frequency.setValueAtTime(220, t);
      coreOsc.frequency.exponentialRampToValueAtTime(52, t + 0.22);

      gain.gain.setValueAtTime(isCrit ? 0.28 : 0.22, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

      beamOsc.connect(gain);
      coreOsc.connect(gain);
      gain.connect(dest);
      beamOsc.start(t);
      coreOsc.start(t);
      beamOsc.stop(t + 0.22);
      coreOsc.stop(t + 0.22);
    } else if (style === 'flak') {
      // Explosive Scatter Flak Cannon Thump + Shrapnel Burst
      const thumpOsc = this.ctx.createOscillator();
      const thumpGain = this.ctx.createGain();

      thumpOsc.type = 'triangle';
      thumpOsc.frequency.setValueAtTime(195, t);
      thumpOsc.frequency.exponentialRampToValueAtTime(38, t + 0.16);

      thumpGain.gain.setValueAtTime(0.26, t);
      thumpGain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

      thumpOsc.connect(thumpGain);
      thumpGain.connect(dest);
      thumpOsc.start(t);
      thumpOsc.stop(t + 0.16);

      const noiseBuf = this.ensureSharedNoiseBuffer();
      if (noiseBuf) {
        const noise = this.ctx.createBufferSource();
        noise.buffer = noiseBuf;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1400, t);
        filter.Q.setValueAtTime(1.8, t);

        const nGain = this.ctx.createGain();
        nGain.gain.setValueAtTime(0.18, t);
        nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

        noise.connect(filter);
        filter.connect(nGain);
        nGain.connect(dest);
        noise.start(t, Math.random() * 0.5, 0.13);
      }
    } else if (style === 'helix') {
      // Spiral Frequency-Modulated Helix Wave
      const carrier = this.ctx.createOscillator();
      const mod = this.ctx.createOscillator();
      const modGain = this.ctx.createGain();
      const outGain = this.ctx.createGain();

      carrier.type = 'sine';
      carrier.frequency.setValueAtTime(780 * critPitchBoost, t);
      carrier.frequency.exponentialRampToValueAtTime(290, t + 0.16);

      mod.type = 'sine';
      mod.frequency.setValueAtTime(55, t); // Spiral modulation rate
      modGain.gain.setValueAtTime(190, t);

      outGain.gain.setValueAtTime(0.2, t);
      outGain.gain.exponentialRampToValueAtTime(0.001, t + 0.165);

      mod.connect(modGain);
      modGain.connect(carrier.frequency);
      carrier.connect(outGain);
      outGain.connect(dest);

      mod.start(t);
      carrier.start(t);
      mod.stop(t + 0.165);
      carrier.stop(t + 0.165);
    } else if (style === 'prism') {
      // Crystalline Harmonic Triad Shimmer
      const chordRatio = [1.0, 1.25, 1.5]; // Major triad shimmer
      const baseFreq = 880 * critPitchBoost;

      chordRatio.forEach((ratio, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = idx === 1 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(baseFreq * ratio, t);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * ratio * 0.45, t + 0.17);

        gain.gain.setValueAtTime(0.09, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.175);

        osc.connect(gain);
        gain.connect(dest);
        osc.start(t);
        osc.stop(t + 0.175);
      });
    } else if (style === 'void_arc') {
      // Dark-Energy Electric Arc Snap
      const arcOsc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      arcOsc.type = 'sawtooth';
      arcOsc.frequency.setValueAtTime(1480 * critPitchBoost, t);
      arcOsc.frequency.setValueAtTime(620, t + 0.03);
      arcOsc.frequency.setValueAtTime(1120, t + 0.06);
      arcOsc.frequency.exponentialRampToValueAtTime(140, t + 0.15);

      filter.type = 'highpass';
      filter.frequency.setValueAtTime(320, t);

      gain.gain.setValueAtTime(0.21, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.155);

      arcOsc.connect(filter);
      filter.connect(gain);
      gain.connect(dest);
      arcOsc.start(t);
      arcOsc.stop(t + 0.155);
    } else if (style === 'singularity') {
      // Gravitational Implosion Warp Pulse
      const subOsc = this.ctx.createOscillator();
      const overtone = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(95, t);
      subOsc.frequency.exponentialRampToValueAtTime(340 * critPitchBoost, t + 0.06);
      subOsc.frequency.exponentialRampToValueAtTime(42, t + 0.21);

      overtone.type = 'sawtooth';
      overtone.frequency.setValueAtTime(520, t);
      overtone.frequency.exponentialRampToValueAtTime(85, t + 0.2);

      gain.gain.setValueAtTime(0.24, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.21);

      subOsc.connect(gain);
      overtone.connect(gain);
      gain.connect(dest);
      subOsc.start(t);
      overtone.start(t);
      subOsc.stop(t + 0.21);
      overtone.stop(t + 0.21);
    } else if (style === 'omega') {
      // Celestial Omega Discharge (Multi-harmonic + Sub-impact)
      const freqs = [220, 554.37, 1108.73];
      freqs.forEach((f, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = idx === 0 ? 'square' : 'sawtooth';
        osc.frequency.setValueAtTime(f * critPitchBoost, t);
        osc.frequency.exponentialRampToValueAtTime(f * 0.28, t + 0.22);

        gain.gain.setValueAtTime(idx === 0 ? 0.14 : 0.09, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.225);

        osc.connect(gain);
        gain.connect(dest);
        osc.start(t);
        osc.stop(t + 0.225);
      });
    } else {
      // Missile launch ignition + whoosh
      this.playMissileLaunch('micro_swarm', pan);
    }
  }

  /**
   * Specialized Spatial Missile & Torpedo Launch Audio
   */
  public playMissileLaunch(
    missileType: MissileWeaponId = 'micro_swarm',
    pan: number = 0
  ) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const dest = this.createPanner(pan);

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    if (missileType === 'omega_nova_warhead') {
      this.triggerAudioDucking(0.45, 0.02, 0.12, 0.35, 1100);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(95, t);
      osc.frequency.exponentialRampToValueAtTime(620, t + 0.28);
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      osc.connect(gain);
      gain.connect(dest);
      osc.start(t);
      osc.stop(t + 0.3);
    } else if (missileType === 'heavy_torpedo') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(110, t);
      osc.frequency.exponentialRampToValueAtTime(340, t + 0.24);
      gain.gain.setValueAtTime(0.26, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      osc.connect(gain);
      gain.connect(dest);
      osc.start(t);
      osc.stop(t + 0.25);
    } else if (missileType === 'emp_disruptor') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, t);
      osc.frequency.exponentialRampToValueAtTime(180, t + 0.22);
      gain.gain.setValueAtTime(0.24, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.23);
      osc.connect(gain);
      gain.connect(dest);
      osc.start(t);
      osc.stop(t + 0.23);
    } else {
      // micro_swarm
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, t);
      osc.frequency.exponentialRampToValueAtTime(540, t + 0.17);
      gain.gain.setValueAtTime(0.21, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      osc.connect(gain);
      gain.connect(dest);
      osc.start(t);
      osc.stop(t + 0.18);
    }
  }

  /**
   * Backwards-compatible wrapper that routes to the specialized spatial weapon synthesizer
   */
  public playLaser(
    type: WeaponSoundType = 'light',
    pan: number = 0,
    isCrit: boolean = false,
    tier: number = 1
  ) {
    this.playWeaponFire(type, { pan, isCrit, tier });
  }

  public playHit(critical: boolean = false, pan: number = 0) {
    if (this.isMuted) return;
    const now = performance.now();
    if (!critical && now - this.lastHitSfxTime < 90) return;
    this.lastHitSfxTime = now;

    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const dest = this.createPanner(pan);
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = critical ? 'sawtooth' : 'triangle';
    osc.frequency.setValueAtTime(critical ? 460 : 210, t);
    osc.frequency.exponentialRampToValueAtTime(55, t + (critical ? 0.16 : 0.08));

    gain.gain.setValueAtTime(critical ? 0.32 : 0.14, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + (critical ? 0.16 : 0.08));

    osc.connect(gain);
    gain.connect(dest);
    osc.start(t);
    osc.stop(t + (critical ? 0.16 : 0.08));
  }

  public playExplosion(scale: 'small' | 'medium' | 'boss' = 'medium', pan: number = 0) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    // Procedural Sidechain Audio Ducking scaled by explosion intensity
    if (scale === 'boss') {
      this.triggerAudioDucking(0.1, 0.015, 0.55, 1.25, 380);
    } else if (scale === 'medium') {
      this.triggerAudioDucking(0.36, 0.02, 0.14, 0.42, 950);
    } else {
      this.triggerAudioDucking(0.68, 0.015, 0.06, 0.22, 2400);
    }

    const t = this.ctx.currentTime;
    const dest = this.createPanner(pan);
    const duration = scale === 'boss' ? 1.55 : scale === 'medium' ? 0.52 : 0.26;

    const noiseBuffer = this.ensureSharedNoiseBuffer();
    if (noiseBuffer) {
      const noise = this.ctx.createBufferSource();
      noise.buffer = noiseBuffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(scale === 'boss' ? 580 : 880, t);
      filter.frequency.exponentialRampToValueAtTime(28, t + duration);

      const noiseGain = this.ctx.createGain();
      const maxVol = scale === 'boss' ? 0.68 : scale === 'medium' ? 0.36 : 0.2;
      noiseGain.gain.setValueAtTime(maxVol, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, t + duration);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(dest);

      noise.start(t, Math.random() * 0.4, duration);
    }

    // Sub-bass shockwave thump
    const subOsc = this.ctx.createOscillator();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(scale === 'boss' ? 140 : 95, t);
    subOsc.frequency.exponentialRampToValueAtTime(22, t + duration);

    const subGain = this.ctx.createGain();
    const maxSub = scale === 'boss' ? 0.58 : scale === 'medium' ? 0.3 : 0.16;
    subGain.gain.setValueAtTime(maxSub, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    subOsc.connect(subGain);
    subGain.connect(dest);

    subOsc.start(t);
    subOsc.stop(t + duration);
  }

  public playScrapChime() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.sfxBus) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    const freqs = [587.33, 659.25, 880, 1046.5, 1174.66];
    const freq = freqs[Math.floor(Math.random() * freqs.length)];

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.5, t + 0.11);

    gain.gain.setValueAtTime(0.11, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.11);

    osc.connect(gain);
    gain.connect(this.sfxBus);
    osc.start(t);
    osc.stop(t + 0.11);
  }

  public playUpgrade() {
    haptics.vibrateLevelUp('upgrade');
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.sfxBus) return;

    const t = this.ctx.currentTime;
    const notes = [440, 554.37, 659.25, 880, 1108.73];
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const noteTime = t + idx * 0.045;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.18, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.19);

      osc.connect(gain);
      gain.connect(this.sfxBus!);
      osc.start(noteTime);
      osc.stop(noteTime + 0.19);
    });
  }

  public playPrestige() {
    haptics.vibrateLevelUp('prestige');
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.sfxBus) return;

    this.triggerAudioDucking(0.18, 0.03, 0.5, 1.0, 800);

    const t = this.ctx.currentTime;
    const chord = [146.83, 220.0, 293.66, 369.99, 440.0, 587.33, 880.0];
    chord.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const start = t + idx * 0.06;

      osc.type = idx % 2 === 0 ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(freq * 0.5, start);
      osc.frequency.exponentialRampToValueAtTime(freq, start + 0.35);

      gain.gain.setValueAtTime(0.12, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 1.1);

      osc.connect(gain);
      gain.connect(this.sfxBus!);
      osc.start(start);
      osc.stop(start + 1.1);
    });
  }

  public playEmp(pan: number = 0) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    // Duck background synthwave for EMP shockwave clarity
    this.triggerAudioDucking(0.25, 0.015, 0.22, 0.55, 620);

    const t = this.ctx.currentTime;
    const dest = this.createPanner(pan);
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1350, t);
    osc.frequency.exponentialRampToValueAtTime(58, t + 0.48);

    gain.gain.setValueAtTime(0.36, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.48);

    osc.connect(gain);
    gain.connect(dest);
    osc.start(t);
    osc.stop(t + 0.48);
  }

  public playBossAlert() {
    haptics.vibrateCombatEvent('boss_alert');
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.sfxBus) return;

    // Deep procedural audio ducking so the 3-stage boss klaxon dominates the soundstage
    this.triggerAudioDucking(0.12, 0.02, 1.05, 0.9, 420);

    const t = this.ctx.currentTime;
    for (let i = 0; i < 3; i++) {
      const start = t + i * 0.34;
      const osc = this.ctx.createOscillator();
      const sub = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(240, start);
      osc.frequency.linearRampToValueAtTime(560, start + 0.22);

      sub.type = 'square';
      sub.frequency.setValueAtTime(120, start);
      sub.frequency.linearRampToValueAtTime(280, start + 0.22);

      gain.gain.setValueAtTime(0.28, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.32);

      osc.connect(gain);
      sub.connect(gain);
      gain.connect(this.sfxBus);
      osc.start(start);
      sub.start(start);
      osc.stop(start + 0.32);
      sub.stop(start + 0.32);
    }
  }

  // ============================================================================
  // 4-TRACK ADAPTIVE SYNTHWAVE SEQUENCER (BASS + DRUMS + POLY-PAD + ARP/LEAD)
  // ============================================================================
  private triggerSynthStep() {
    if (
      this.isMuted ||
      !this.ctx ||
      !this.bassTrackGain ||
      !this.drumsTrackGain ||
      !this.padTrackGain ||
      !this.leadTrackGain
    ) {
      return;
    }

    const t = this.ctx.currentTime;
    const step = this.stepIndex % 16;
    const bar = Math.floor(this.stepIndex / 16) % 4;
    this.stepIndex++;

    // -------------------------------------------------------------------------
    // TRACK 1: Rolling 16th-Note Analog Sawtooth Sub-Bass
    // -------------------------------------------------------------------------
    const combatBassRoots = [73.42, 65.41, 58.27, 82.41]; // D2, C2, Bb1, E2
    const bossBassRoots = [73.42, 77.78, 73.42, 65.41]; // D2, Eb2, D2, C2 (Phrygian Dark)
    const root = this.intensity === 'boss' ? bossBassRoots[bar] : combatBassRoots[bar];

    const octaveMult = step % 2 === 0 ? 1 : 2;
    const bassFreq = root * (this.intensity === 'exploration' ? 0.5 : octaveMult);

    if (this.intensity !== 'exploration' || step % 4 === 0) {
      const bassOsc = this.ctx.createOscillator();
      const bassFilter = this.ctx.createBiquadFilter();
      const bassGain = this.ctx.createGain();

      bassOsc.type = 'sawtooth';
      bassOsc.frequency.setValueAtTime(bassFreq, t);

      bassFilter.type = 'lowpass';
      const cutoff =
        this.intensity === 'boss'
          ? 820 + Math.sin(this.stepIndex * 0.32) * 320
          : this.intensity === 'overdrive'
            ? 680 + Math.sin(this.stepIndex * 0.25) * 240
            : this.intensity === 'combat'
              ? 510 + Math.sin(this.stepIndex * 0.2) * 160
              : 240;
      bassFilter.frequency.setValueAtTime(cutoff, t);
      bassFilter.Q.setValueAtTime(4.8, t);

      const dur = this.intensity === 'exploration' ? 0.34 : 0.11;
      const vol =
        this.intensity === 'boss'
          ? 0.24
          : this.intensity === 'overdrive'
            ? 0.21
            : this.intensity === 'combat'
              ? 0.17
              : 0.11;

      bassGain.gain.setValueAtTime(vol, t);
      bassGain.gain.exponentialRampToValueAtTime(0.001, t + dur);

      bassOsc.connect(bassFilter);
      bassFilter.connect(bassGain);
      bassGain.connect(this.bassTrackGain);

      bassOsc.start(t);
      bassOsc.stop(t + dur);
    }

    // -------------------------------------------------------------------------
    // TRACK 2: Cyber-Drums (Kick, Gated Noise Snare, Stereo Hi-Hats)
    // -------------------------------------------------------------------------
    if (this.intensity !== 'exploration') {
      // Four-on-the-floor Kick on 0, 4, 8, 12 (+ syncopated 14 in overdrive/boss)
      if (
        step % 4 === 0 ||
        ((this.intensity === 'boss' || this.intensity === 'overdrive') && step === 14)
      ) {
        const kickOsc = this.ctx.createOscillator();
        const kickGain = this.ctx.createGain();
        kickOsc.type = 'sine';
        kickOsc.frequency.setValueAtTime(148, t);
        kickOsc.frequency.exponentialRampToValueAtTime(34, t + 0.125);

        kickGain.gain.setValueAtTime(0.36, t);
        kickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

        kickOsc.connect(kickGain);
        kickGain.connect(this.drumsTrackGain);
        kickOsc.start(t);
        kickOsc.stop(t + 0.14);
      }

      // 80s Gated Synthwave Snare on steps 4 and 12 (Body + Filtered White Noise Burst)
      if (step === 4 || step === 12) {
        const snareOsc = this.ctx.createOscillator();
        const snareGain = this.ctx.createGain();
        snareOsc.type = 'triangle';
        snareOsc.frequency.setValueAtTime(230, t);
        snareOsc.frequency.exponentialRampToValueAtTime(78, t + 0.11);

        snareGain.gain.setValueAtTime(0.18, t);
        snareGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

        snareOsc.connect(snareGain);
        snareGain.connect(this.drumsTrackGain);
        snareOsc.start(t);
        snareOsc.stop(t + 0.12);

        const noiseBuf = this.ensureSharedNoiseBuffer();
        if (noiseBuf) {
          const noise = this.ctx.createBufferSource();
          noise.buffer = noiseBuf;
          const filter = this.ctx.createBiquadFilter();
          filter.type = 'highpass';
          filter.frequency.setValueAtTime(1200, t);

          const nGain = this.ctx.createGain();
          nGain.gain.setValueAtTime(0.14, t);
          nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.13);

          noise.connect(filter);
          filter.connect(nGain);
          nGain.connect(this.drumsTrackGain);
          noise.start(t, Math.random() * 0.5, 0.13);
        }
      }

      // 16th-Note Stereo-Panned Metallic Hi-Hats
      if (this.intensity === 'overdrive' || this.intensity === 'boss' || step % 2 === 0) {
        const noiseBuf = this.ensureSharedNoiseBuffer();
        if (noiseBuf) {
          const hatNoise = this.ctx.createBufferSource();
          hatNoise.buffer = noiseBuf;

          const hatFilter = this.ctx.createBiquadFilter();
          hatFilter.type = 'highpass';
          hatFilter.frequency.setValueAtTime(6800, t);

          const hatGain = this.ctx.createGain();
          const isOffbeat = step % 4 === 2;
          const hatDur = isOffbeat ? 0.065 : 0.032;
          hatGain.gain.setValueAtTime(isOffbeat ? 0.075 : 0.04, t);
          hatGain.gain.exponentialRampToValueAtTime(0.001, t + hatDur);

          const hatDest = this.createPanner(step % 2 === 0 ? -0.28 : 0.28, this.drumsTrackGain);
          hatNoise.connect(hatFilter);
          hatFilter.connect(hatGain);
          hatGain.connect(hatDest);

          hatNoise.start(t, (step * 0.09) % 1.2, hatDur);
        }
      }
    }

    // -------------------------------------------------------------------------
    // TRACK 3: Lush Stereo Poly-Pad Chord Swells (Triggered on Downbeat of Each Bar)
    // -------------------------------------------------------------------------
    if (step === 0) {
      const combatChords = [
        [293.66, 349.23, 440.0], // Dm
        [261.63, 329.63, 392.0], // C
        [233.08, 293.66, 349.23], // Bb
        [329.63, 392.0, 493.88], // Em
      ];
      const bossChords = [
        [293.66, 369.99, 440.0], // D Phrygian Dominant
        [311.13, 392.0, 466.16], // Eb Maj
        [293.66, 369.99, 440.0], // D
        [261.63, 311.13, 392.0], // Cm
      ];
      const activeChord = this.intensity === 'boss' ? bossChords[bar] : combatChords[bar];

      activeChord.forEach((freq, idx) => {
        if (!this.ctx || !this.padTrackGain) return;
        const padOsc = this.ctx.createOscillator();
        const padGain = this.ctx.createGain();
        const padDest = this.createPanner((idx - 1) * 0.45, this.padTrackGain);

        padOsc.type = 'sawtooth';
        padOsc.frequency.setValueAtTime(freq, t);

        const padFilter = this.ctx.createBiquadFilter();
        padFilter.type = 'lowpass';
        padFilter.frequency.setValueAtTime(950, t);

        padGain.gain.setValueAtTime(0.002, t);
        padGain.gain.linearRampToValueAtTime(0.045, t + 0.45);
        padGain.gain.exponentialRampToValueAtTime(0.001, t + 1.85);

        padOsc.connect(padFilter);
        padFilter.connect(padGain);
        padGain.connect(padDest);

        padOsc.start(t);
        padOsc.stop(t + 1.88);
      });
    }

    // -------------------------------------------------------------------------
    // TRACK 4: Stereo Synthwave Arpeggiator & Boss Phrygian Lead Melody
    // -------------------------------------------------------------------------
    if (this.intensity === 'boss' && step % 2 === 0) {
      const leadScale = [293.66, 311.13, 369.99, 440.0, 466.16, 587.33, 622.25]; // D Phrygian Dominant
      const noteIdx = (step / 2 + bar * 2) % leadScale.length;
      const leadFreq = leadScale[noteIdx];

      const leadOsc = this.ctx.createOscillator();
      const leadGain = this.ctx.createGain();
      const leadDest = this.createPanner(Math.sin(this.stepIndex * 0.4) * 0.35, this.leadTrackGain);

      leadOsc.type = 'square';
      leadOsc.frequency.setValueAtTime(leadFreq, t);

      leadGain.gain.setValueAtTime(0.095, t);
      leadGain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

      leadOsc.connect(leadGain);
      leadGain.connect(leadDest);

      leadOsc.start(t);
      leadOsc.stop(t + 0.18);
    } else if (this.intensity === 'overdrive' || (this.intensity === 'combat' && step % 2 === 0)) {
      const arpNotes = [293.66, 349.23, 440.0, 523.25, 587.33, 659.25]; // D Dorian Synthwave Arp
      const arpFreq = arpNotes[(step + bar * 3) % arpNotes.length];

      const arpOsc = this.ctx.createOscillator();
      const arpGain = this.ctx.createGain();
      const arpDest = this.createPanner(step % 2 === 0 ? -0.4 : 0.4, this.leadTrackGain);

      arpOsc.type = 'triangle';
      arpOsc.frequency.setValueAtTime(arpFreq, t);

      arpGain.gain.setValueAtTime(this.intensity === 'overdrive' ? 0.085 : 0.06, t);
      arpGain.gain.exponentialRampToValueAtTime(0.001, t + 0.11);

      arpOsc.connect(arpGain);
      arpGain.connect(arpDest);

      arpOsc.start(t);
      arpOsc.stop(t + 0.11);
    }
  }

  public startAtmosphere() {
    // Initialize AudioContext for crisp discrete combat SFX only — no continuous drone oscillators or sub-bass hum
    this.initCtx();
  }

  public stopAtmosphere() {
    if (this.seqTimer !== null) {
      clearInterval(this.seqTimer);
      this.seqTimer = null;
    }
    if (this.droneOsc1) {
      try {
        this.droneOsc1.stop();
      } catch (e) {}
      this.droneOsc1 = null;
    }
    if (this.droneOsc2) {
      try {
        this.droneOsc2.stop();
      } catch (e) {}
      this.droneOsc2 = null;
    }
    this.musicMasterGain = null;
    this.musicDuckGain = null;
    this.musicDuckFilter = null;
    this.bassTrackGain = null;
    this.drumsTrackGain = null;
    this.padTrackGain = null;
    this.leadTrackGain = null;
  }
}

export const sound = new SoundEngine();
