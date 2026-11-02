// Procedural 8-Bit Fantasy Web Audio Synthesizer & Sound Effects Engine

const BGM_INTERVAL_MS = 310;

// Gentle enchanting 8-bit fantasy town melody (C major / A minor pastoral loop)
const BGM_MELODY: readonly number[] = [
  523.25, 659.25, 783.99, 659.25,
  587.33, 659.25, 523.25, 392.0,
  440.0, 523.25, 659.25, 587.33,
  523.25, 493.88, 392.0, 0,
  523.25, 659.25, 880.0, 783.99,
  659.25, 587.33, 523.25, 659.25,
  587.33, 523.25, 493.88, 587.33,
  523.25, 0, 392.0, 0,
];

const BGM_BASS: readonly number[] = [
  261.63, 0, 196.0, 0,
  293.66, 0, 261.63, 0,
  220.0, 0, 164.81, 0,
  196.0, 0, 246.94, 0,
  261.63, 0, 220.0, 0,
  174.61, 0, 196.0, 0,
  293.66, 0, 196.0, 0,
  261.63, 0, 196.0, 0,
];

export interface AudioVisualizerSample {
  bars: readonly number[];
  beatPulse: number;
  melodyHz: number;
  isLiveAudio: boolean;
  isAudioEnabled: boolean;
}

class SoundEngine {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private freqBins: Uint8Array<ArrayBuffer> = new Uint8Array(new ArrayBuffer(32));
  private visualizerBars: number[] = [0, 0, 0, 0, 0, 0, 0, 0];

  private soundEnabled = true;
  private musicEnabled = true;
  private bgmTimer: number | null = null;
  private bgmStep = 0;
  private isPlayingBgm = false;
  private lastStepTime = 0;

  // Real-time BGM beat & pitch telemetry for the 8-bit visualizer
  private lastBeatMs = 0;
  private activeMelodyHz = 523.25;
  private activeBassHz = 261.63;
  private lastSfxMs = 0;

  private ensureContext(): AudioContext | null {
    if (!this.soundEnabled) return null;
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        const analyser = this.ctx.createAnalyser();
        analyser.fftSize = 64;
        analyser.smoothingTimeConstant = 0.68;
        analyser.connect(this.ctx.destination);
        this.analyser = analyser;
        this.freqBins = new Uint8Array(new ArrayBuffer(analyser.frequencyBinCount));
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
    if (!enabled) {
      this.stopBgm();
    } else if (this.musicEnabled && !this.isPlayingBgm) {
      this.startBgm();
    }
  }

  public setMusicEnabled(enabled: boolean) {
    this.musicEnabled = enabled;
    if (!enabled) {
      this.stopBgm();
    } else if (this.soundEnabled && !this.isPlayingBgm) {
      this.startBgm();
    }
  }

  public getSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  public getMusicEnabled(): boolean {
    return this.musicEnabled;
  }

  private playTone(
    freq: number,
    duration: number,
    type: OscillatorType = 'square',
    volume = 0.08,
    delay = 0,
    slideToFreq?: number
  ) {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slideToFreq) {
      osc.frequency.exponentialRampToValueAtTime(slideToFreq, now + duration);
    }

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    if (this.analyser) {
      gain.connect(this.analyser);
    } else {
      gain.connect(ctx.destination);
    }

    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  public playButtonHover() {
    this.lastSfxMs = performance.now();
    this.playTone(587.33, 0.04, 'triangle', 0.028);
  }

  public playBookHover() {
    this.lastSfxMs = performance.now();
    this.playTone(659.25, 0.035, 'triangle', 0.026, 0, 783.99);
    this.playTone(880.0, 0.03, 'sine', 0.02, 0.028);
  }

  public playButtonClick() {
    this.lastSfxMs = performance.now();
    this.playTone(523.25, 0.055, 'square', 0.055, 0);
    this.playTone(783.99, 0.075, 'square', 0.055, 0.042);
  }

  public playAdventureStart() {
    this.lastSfxMs = performance.now();
    // Heroic 8-bit RPG start arpeggio (gentle volume)
    this.playTone(523.25, 0.07, 'square', 0.055, 0);
    this.playTone(659.25, 0.07, 'square', 0.055, 0.06);
    this.playTone(783.99, 0.08, 'square', 0.06, 0.12);
    this.playTone(1046.5, 0.22, 'triangle', 0.07, 0.19);
    this.playTone(523.25, 0.22, 'sine', 0.045, 0.19);
  }

  public playBagOpen() {
    this.lastSfxMs = performance.now();
    // Soft leather pouch latch + gold coin glint
    this.playTone(246.94, 0.05, 'triangle', 0.05, 0, 329.63);
    this.playTone(392.0, 0.06, 'triangle', 0.05, 0.045);
    this.playTone(987.77, 0.11, 'sine', 0.045, 0.095);
  }

  public playMapUnfold() {
    this.lastSfxMs = performance.now();
    // Crisp scroll / parchment unfurl flourish
    this.playTone(293.66, 0.055, 'triangle', 0.048, 0, 440.0);
    this.playTone(440.0, 0.065, 'triangle', 0.05, 0.05, 587.33);
    this.playTone(659.25, 0.13, 'sine', 0.055, 0.105);
  }

  public playMagicSparkle() {
    this.lastSfxMs = performance.now();
    this.playTone(783.99, 0.06, 'sine', 0.045, 0);
    this.playTone(1046.5, 0.07, 'sine', 0.045, 0.05);
    this.playTone(1318.51, 0.12, 'triangle', 0.05, 0.1);
  }

  public playFootstep() {
    if (!this.soundEnabled) return;
    const nowMs = performance.now();
    if (nowMs - this.lastStepTime < 230) return;
    this.lastStepTime = nowMs;
    const pitch = this.bgmStep % 2 === 0 ? 155 : 180;
    this.playTone(pitch, 0.045, 'triangle', 0.04, 0, 95);
  }

  public playNpcInteract() {
    this.lastSfxMs = performance.now();
    this.playTone(440, 0.07, 'square', 0.06, 0);
    this.playTone(554.37, 0.07, 'square', 0.06, 0.06);
    this.playTone(659.25, 0.11, 'triangle', 0.07, 0.12);
  }

  public playVoiceBlip() {
    const freqs = [493.88, 523.25, 587.33, 659.25];
    const f = freqs[Math.floor(Math.random() * freqs.length)];
    this.playTone(f, 0.035, 'square', 0.025);
  }

  public playBookOpen() {
    this.lastSfxMs = performance.now();
    this.playTone(329.63, 0.07, 'triangle', 0.06, 0);
    this.playTone(392.0, 0.07, 'triangle', 0.06, 0.05);
    this.playTone(523.25, 0.12, 'triangle', 0.065, 0.1);
  }

  public playCorrect() {
    this.lastSfxMs = performance.now();
    this.playTone(523.25, 0.09, 'square', 0.08, 0);
    this.playTone(659.25, 0.09, 'square', 0.08, 0.08);
    this.playTone(783.99, 0.09, 'square', 0.08, 0.16);
    this.playTone(1046.5, 0.24, 'square', 0.09, 0.24);
  }

  public playCrystalGain() {
    this.lastSfxMs = performance.now();
    this.playTone(880, 0.09, 'sine', 0.08, 0.12);
    this.playTone(1174.66, 0.11, 'sine', 0.08, 0.2);
    this.playTone(1396.91, 0.14, 'triangle', 0.09, 0.28);
    this.playTone(1760, 0.28, 'sine', 0.09, 0.36);
  }

  public playWrong() {
    this.lastSfxMs = performance.now();
    this.playTone(311.13, 0.14, 'sawtooth', 0.065, 0, 261.63);
    this.playTone(233.08, 0.22, 'sawtooth', 0.065, 0.14, 196.0);
  }

  public playMissionUnlock() {
    this.lastSfxMs = performance.now();
    const notes = [392.0, 493.88, 587.33, 783.99, 987.77, 1174.66];
    notes.forEach((n, idx) => {
      this.playTone(n, 0.14, 'square', 0.075, idx * 0.085);
    });
  }

  public playVictoryFanfare() {
    this.lastSfxMs = performance.now();
    const fanfare = [
      { f: 523.25, d: 0.12, t: 0 },
      { f: 523.25, d: 0.12, t: 0.13 },
      { f: 523.25, d: 0.12, t: 0.26 },
      { f: 659.25, d: 0.26, t: 0.4 },
      { f: 587.33, d: 0.22, t: 0.68 },
      { f: 659.25, d: 0.22, t: 0.92 },
      { f: 783.99, d: 0.45, t: 1.16 },
      { f: 1046.5, d: 0.55, t: 1.62 },
    ];
    fanfare.forEach((n) => {
      this.playTone(n.f, n.d, 'square', 0.085, n.t);
      this.playTone(n.f * 0.5, n.d, 'triangle', 0.07, n.t);
    });
  }

  private triggerBgmStep() {
    const idx = this.bgmStep % BGM_MELODY.length;
    const mFreq = BGM_MELODY[idx];
    const bFreq = BGM_BASS[idx];

    this.lastBeatMs = performance.now();
    this.activeMelodyHz = mFreq;
    this.activeBassHz = bFreq;

    if (mFreq > 0) {
      this.playTone(mFreq, 0.24, 'triangle', 0.024, 0);
    }
    if (bFreq > 0) {
      this.playTone(bFreq, 0.28, 'sine', 0.022, 0);
    }
    this.bgmStep++;
  }

  public startBgm() {
    if (!this.soundEnabled || !this.musicEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    if (this.isPlayingBgm) return;

    this.isPlayingBgm = true;
    this.triggerBgmStep();

    this.bgmTimer = window.setInterval(() => {
      if (!this.soundEnabled || !this.musicEnabled) {
        this.stopBgm();
        return;
      }
      if (document.hidden) return;
      this.triggerBgmStep();
    }, BGM_INTERVAL_MS);
  }

  public stopBgm() {
    this.isPlayingBgm = false;
    if (this.bgmTimer !== null) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
  }

  /**
   * Samples 8 stepped bar heights (0..1) synchronized to live Web Audio FFT bins
   * and the exact 310ms 8-bit BGM tempo & pitch contour.
   */
  public sampleVisualizer(): AudioVisualizerSample {
    const enabled = this.soundEnabled && this.musicEnabled;
    if (!enabled) {
      for (let i = 0; i < 8; i++) {
        this.visualizerBars[i] = 0;
      }
      return {
        bars: this.visualizerBars,
        beatPulse: 0,
        melodyHz: 0,
        isLiveAudio: false,
        isAudioEnabled: false,
      };
    }

    const now = performance.now();
    const isCtxRunning = Boolean(this.ctx && this.ctx.state === 'running' && this.isPlayingBgm);

    let mHz = this.activeMelodyHz;
    let bHz = this.activeBassHz;
    let beatPhase = 0;

    if (isCtxRunning && this.lastBeatMs > 0) {
      beatPhase = Math.min(1, Math.max(0, (now - this.lastBeatMs) / BGM_INTERVAL_MS));
    } else {
      // Pre-gesture tempo clock locked to the exact 310ms BGM score so the menu feels alive immediately
      const virtualStep = Math.floor(now / BGM_INTERVAL_MS) % BGM_MELODY.length;
      mHz = BGM_MELODY[virtualStep];
      bHz = BGM_BASS[virtualStep];
      beatPhase = (now % BGM_INTERVAL_MS) / BGM_INTERVAL_MS;
    }

    //Sharp 8-bit attack + musical decay envelope per 310ms eighth-note
    const noteEnvelope = Math.pow(1 - beatPhase, 1.35);
    const sfxBoost = Math.max(0, 1 - (now - this.lastSfxMs) / 180) * 0.35;

    // Sample live Web Audio AnalyserNode spectrum when running
    let hasFftSignal = false;
    if (isCtxRunning && this.analyser) {
      this.analyser.getByteFrequencyData(this.freqBins);
      for (let k = 0; k < 12; k++) {
        if (this.freqBins[k] > 4) {
          hasFftSignal = true;
          break;
        }
      }
    }

    // Map melody pitch (392Hz .. 880Hz) to primary dancing bar index (2..6)
    const normalizedPitch =
      mHz > 0 ? Math.min(1, Math.max(0, (mHz - 392) / (880 - 392))) : 0.35;
    const focusBar = 2 + normalizedPitch * 4.2;
    const idleScale = isCtxRunning ? 1.0 : 0.76;

    for (let i = 0; i < 8; i++) {
      let target = 0.16;

      if (i <= 1) {
        // Bass columns (bars 0 & 1) bounce strongly on bass downbeats
        const bassHit = bHz > 0 ? (i === 0 ? 0.78 : 0.64) * noteEnvelope : 0.22 * noteEnvelope;
        target += bassHit;
      } else {
        // Melody & harmony columns (bars 2..7) follow pitch center + rhythmic counter-wave
        const dist = Math.abs(i - focusBar);
        const pitchPeak = mHz > 0 ? Math.max(0, 1 - dist * 0.42) * 0.78 * noteEnvelope : 0.14;
        const chiptuneWave =
          0.14 * Math.abs(Math.sin(now * 0.009 + i * 0.95));
        target += pitchPeak + chiptuneWave;
      }

      if (hasFftSignal) {
        const binIdx = Math.min(this.freqBins.length - 1, i + 1);
        const fftNorm = this.freqBins[binIdx] / 255;
        target = target * 0.62 + fftNorm * 0.85;
      }

      target = Math.min(1, (target + sfxBoost) * idleScale);
      // Smooth attack / crisp release
      const prev = this.visualizerBars[i];
      this.visualizerBars[i] =
        target > prev ? prev + (target - prev) * 0.55 : prev + (target - prev) * 0.24;
    }

    return {
      bars: this.visualizerBars,
      beatPulse: (mHz > 0 || bHz > 0 ? noteEnvelope : noteEnvelope * 0.35) * idleScale,
      melodyHz: mHz,
      isLiveAudio: isCtxRunning,
      isAudioEnabled: true,
    };
  }
}

export const soundEngine = new SoundEngine();
