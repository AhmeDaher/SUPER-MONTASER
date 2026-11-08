// Web Audio API procedural sound synthesizer
export class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private isMuted: boolean = false;
  private sfxVolume: number = 0.8;
  private musicVolume: number = 0.4;
  private ambientVolume: number = 0.3;
  private ambientActive: boolean = false;
  private musicActive: boolean = false;
  private musicTimer: any = null;
  private ambientTimer: any = null;

  constructor() {
    // Initialized on first user interaction to comply with browser audio policy
  }

  private initContext() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = this.sfxVolume;
      this.sfxGain.connect(this.masterGain);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = this.musicVolume;
      this.musicGain.connect(this.masterGain);

      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.value = this.ambientVolume;
      this.ambientGain.connect(this.masterGain);

      this.startAmbientJungle();
    } catch (e) {
      console.warn('Web Audio not supported in this browser', e);
    }
  }

  public ensureAudio() {
    if (!this.ctx) {
      this.initContext();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain) {
      this.masterGain.gain.value = muted ? 0 : 1;
    }
  }

  public toggleMute(): boolean {
    this.ensureAudio();
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  // --- Sound Effects ---

  public playFootstep(isWood: boolean = false) {
    if (this.isMuted) return;
    this.ensureAudio();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = isWood ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(isWood ? 140 : 90, t);
    osc.frequency.exponentialRampToValueAtTime(isWood ? 70 : 40, t + 0.08);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(isWood ? 400 : 250, t);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.09);
  }

  public playJump() {
    if (this.isMuted) return;
    this.ensureAudio();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(450, t + 0.22);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.linearRampToValueAtTime(0.01, t + 0.22);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.23);
  }

  public playLand() {
    if (this.isMuted) return;
    this.ensureAudio();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(100, t);
    osc.frequency.exponentialRampToValueAtTime(35, t + 0.15);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.16);
  }

  public playCoin() {
    if (this.isMuted) return;
    this.ensureAudio();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(987.77, t); // B5
    osc1.frequency.setValueAtTime(1318.51, t + 0.08); // E6

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(1975.53, t + 0.08); // B6

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.sfxGain);

    osc1.start(t);
    osc1.stop(t + 0.35);
    osc2.start(t + 0.08);
    osc2.stop(t + 0.35);
  }

  public playStar() {
    if (this.isMuted) return;
    this.ensureAudio();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51]; // C5, E5, G5, C6, E6

    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const noteTime = t + idx * 0.06;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.25, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.25);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(noteTime);
      osc.stop(noteTime + 0.26);
    });
  }

  public playChestOpen() {
    if (this.isMuted) return;
    this.ensureAudio();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    // Wood creak
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, t);
    osc.frequency.linearRampToValueAtTime(160, t + 0.3);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.36);

    // Fanfare shimmer after 0.2s
    setTimeout(() => {
      this.playStar();
    }, 200);
  }

  // --- Animal Sounds ---

  public playLionRoar() {
    if (this.isMuted) return;
    this.ensureAudio();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(90, t);
    osc.frequency.linearRampToValueAtTime(140, t + 0.25);
    osc.frequency.linearRampToValueAtTime(60, t + 0.7);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(280, t);
    filter.frequency.linearRampToValueAtTime(650, t + 0.3);
    filter.frequency.linearRampToValueAtTime(200, t + 0.75);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.linearRampToValueAtTime(0.5, t + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.75);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.8);
  }

  public playElephantTrumpet() {
    if (this.isMuted) return;
    this.ensureAudio();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    // Dual brass oscillators
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc1.type = 'sawtooth';
    osc2.type = 'square';

    osc1.frequency.setValueAtTime(280, t);
    osc1.frequency.exponentialRampToValueAtTime(540, t + 0.2);
    osc1.frequency.linearRampToValueAtTime(600, t + 0.5);
    osc1.frequency.linearRampToValueAtTime(320, t + 0.8);

    osc2.frequency.setValueAtTime(282, t);
    osc2.frequency.exponentialRampToValueAtTime(542, t + 0.2);
    osc2.frequency.linearRampToValueAtTime(602, t + 0.5);
    osc2.frequency.linearRampToValueAtTime(322, t + 0.8);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(700, t);
    filter.Q.value = 3.5;

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.linearRampToValueAtTime(0.5, t + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.85);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc1.start(t);
    osc1.stop(t + 0.85);
    osc2.start(t);
    osc2.stop(t + 0.85);
  }

  public playMonkeyChatter() {
    if (this.isMuted) return;
    this.ensureAudio();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const chirps = [600, 850, 720, 950, 680];
    chirps.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const ct = t + idx * 0.08;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ct);
      osc.frequency.linearRampToValueAtTime(freq * 1.3, ct + 0.04);
      osc.frequency.linearRampToValueAtTime(freq * 0.9, ct + 0.07);

      gain.gain.setValueAtTime(0.2, ct);
      gain.gain.exponentialRampToValueAtTime(0.01, ct + 0.07);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(ct);
      osc.stop(ct + 0.075);
    });
  }

  public playGiraffeChime() {
    if (this.isMuted) return;
    this.ensureAudio();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, t);
    osc.frequency.linearRampToValueAtTime(554.37, t + 0.15); // C#5
    osc.frequency.linearRampToValueAtTime(659.25, t + 0.35); // E5

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.55);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.56);
  }

  public playCelebrationFanfare() {
    if (this.isMuted) return;
    this.ensureAudio();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    // Trumpet-style chord progression: C, E, G, High C
    const fanfareNotes = [
      { f: 523.25, delay: 0.0, dur: 0.15 },
      { f: 523.25, delay: 0.15, dur: 0.12 },
      { f: 659.25, delay: 0.28, dur: 0.15 },
      { f: 783.99, delay: 0.44, dur: 0.25 },
      { f: 1046.5, delay: 0.72, dur: 0.6 },
    ];

    fanfareNotes.forEach((n) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const nt = t + n.delay;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(n.f, nt);

      gain.gain.setValueAtTime(0.35, nt);
      gain.gain.exponentialRampToValueAtTime(0.01, nt + n.dur);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(nt);
      osc.stop(nt + n.dur + 0.02);
    });
  }

  // --- Ambient Jungle Birds and Gentle Breeze ---
  private startAmbientJungle() {
    if (this.ambientActive) return;
    this.ambientActive = true;

    const birdCall = () => {
      if (!this.ambientActive || this.isMuted || !this.ctx || !this.ambientGain) {
        this.ambientTimer = setTimeout(birdCall, 4000 + Math.random() * 4000);
        return;
      }
      try {
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        const baseF = 1800 + Math.random() * 800;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(baseF, t);
        osc.frequency.linearRampToValueAtTime(baseF * 1.25, t + 0.08);
        osc.frequency.linearRampToValueAtTime(baseF * 1.1, t + 0.15);

        gain.gain.setValueAtTime(0.06, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

        osc.connect(gain);
        gain.connect(this.ambientGain);

        osc.start(t);
        osc.stop(t + 0.21);
      } catch (e) {}

      this.ambientTimer = setTimeout(birdCall, 2500 + Math.random() * 5000);
    };

    this.ambientTimer = setTimeout(birdCall, 2000);
  }

  public startMusic() {
    if (this.musicActive) return;
    this.ensureAudio();
    this.musicActive = true;

    // Gentle tropical pentatonic melody
    const scale = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25]; // C, D, E, G, A, C
    let step = 0;

    const playKalimbaNote = () => {
      if (!this.musicActive || this.isMuted || !this.ctx || !this.musicGain) {
        this.musicTimer = setTimeout(playKalimbaNote, 800);
        return;
      }

      try {
        const t = this.ctx.currentTime;
        const note = scale[step % scale.length];
        step = (step + Math.floor(1 + Math.random() * 3)) % scale.length;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(note, t);

        gain.gain.setValueAtTime(0.08, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);

        osc.connect(gain);
        gain.connect(this.musicGain);

        osc.start(t);
        osc.stop(t + 0.62);
      } catch (e) {}

      this.musicTimer = setTimeout(playKalimbaNote, 420 + (step % 2 === 0 ? 0 : 200));
    };

    playKalimbaNote();
  }

  public stopMusic() {
    this.musicActive = false;
    if (this.musicTimer) clearTimeout(this.musicTimer);
  }

  public toggleMusic(): boolean {
    if (this.musicActive) {
      this.stopMusic();
    } else {
      this.startMusic();
    }
    return this.musicActive;
  }

  public isMusicPlaying(): boolean {
    return this.musicActive;
  }

  public dispose() {
    this.ambientActive = false;
    this.musicActive = false;
    if (this.ambientTimer) clearTimeout(this.ambientTimer);
    if (this.musicTimer) clearTimeout(this.musicTimer);
    if (this.ctx) {
      try {
        this.ctx.close();
      } catch (e) {}
    }
  }
}
