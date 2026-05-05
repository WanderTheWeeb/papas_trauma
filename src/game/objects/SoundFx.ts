/**
 * Procedural sound effects via the Web Audio API. No asset files needed —
 * each call shapes a tiny envelope on top of an oscillator (or a noise buffer)
 * and routes it to the destination. Cheap, immediate, no preload.
 *
 * Usage: `SoundFx.thunk()` / `SoundFx.swoosh()` / `SoundFx.tick()` / etc.
 * The first call lazily creates an AudioContext (must be after a user gesture).
 */
class SoundFxClass {
    private ctx: AudioContext | null = null;
    private masterGain: GainNode | null = null;
    private muted = false;
    private noiseBuffer: AudioBuffer | null = null;

    private ensureCtx(): AudioContext | null {
        if (typeof window === 'undefined') return null;
        if (!this.ctx) {
            const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
            if (!Ctor) return null;
            this.ctx = new Ctor();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = 0.45;
            this.masterGain.connect(this.ctx.destination);
        }
        if (this.ctx.state === 'suspended') {
            // Browsers need an explicit resume after first interaction
            this.ctx.resume().catch(() => {});
        }
        return this.ctx;
    }

    setMuted(b: boolean) {
        this.muted = b;
    }

    isMuted() {
        return this.muted;
    }

    /** Heavy stamp on paper — low frequency thump */
    thunk() {
        if (this.muted) return;
        const ctx = this.ensureCtx();
        if (!ctx || !this.masterGain) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(180, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.18);

        gain.gain.setValueAtTime(0.0001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.7, ctx.currentTime + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);

        osc.connect(gain).connect(this.masterGain);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);

        // Add a click transient on top
        this.shortClick(900, 0.04);
    }

    /** Quick paper/swipe sound — short noise burst */
    swoosh() {
        if (this.muted) return;
        const ctx = this.ensureCtx();
        if (!ctx || !this.masterGain) return;

        const src = ctx.createBufferSource();
        src.buffer = this.getNoiseBuffer(ctx);
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1200, ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.25);
        filter.Q.value = 0.8;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.0001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.45, ctx.currentTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.32);

        src.connect(filter).connect(gain).connect(this.masterGain);
        src.start();
        src.stop(ctx.currentTime + 0.4);
    }

    /** Soft confirmation beep */
    beep(freq = 880) {
        if (this.muted) return;
        const ctx = this.ensureCtx();
        if (!ctx || !this.masterGain) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;

        gain.gain.setValueAtTime(0.0001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.35, ctx.currentTime + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18);

        osc.connect(gain).connect(this.masterGain);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
    }

    /** Error — dissonant low tone */
    error() {
        if (this.muted) return;
        const ctx = this.ensureCtx();
        if (!ctx || !this.masterGain) return;

        [220, 207].forEach((f, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.value = f;
            gain.gain.setValueAtTime(0.0001, ctx.currentTime + i * 0.005);
            gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.01 + i * 0.005);
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
            osc.connect(gain).connect(this.masterGain!);
            osc.start();
            osc.stop(ctx.currentTime + 0.4);
        });
    }

    /** Clock tick — short high click */
    tick() {
        if (this.muted) return;
        this.shortClick(1400, 0.02, 0.18);
    }

    /** Pickup a card */
    pickup() {
        if (this.muted) return;
        this.shortClick(700, 0.03, 0.25);
    }

    /**
     * Sans-style voice — rapid square-wave beeps at random pitches, à la
     * Undertale text scroll. Length scales with the character count so
     * shorter reactions sound short and longer monologues sustain.
     */
    sansVoice(charCount = 12) {
        if (this.muted) return;
        const ctx = this.ensureCtx();
        if (!ctx || !this.masterGain) return;

        const beeps = Math.min(20, Math.max(4, Math.floor(charCount / 2)));
        const beepDur = 0.055;
        const gap = 0.015;
        const baseFreq = 280;

        for (let i = 0; i < beeps; i++) {
            const t = ctx.currentTime + i * (beepDur + gap);
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'square';
            // Slight pitch wobble per beep, like Sans
            const f = baseFreq + (Math.random() * 80 - 40);
            osc.frequency.value = f;
            // Sub-osc for fatness
            gain.gain.setValueAtTime(0.0001, t);
            gain.gain.exponentialRampToValueAtTime(0.18, t + 0.005);
            gain.gain.exponentialRampToValueAtTime(0.0001, t + beepDur);
            osc.connect(gain).connect(this.masterGain);
            osc.start(t);
            osc.stop(t + beepDur + 0.01);
        }
    }

    /** Paper rip — bright burst with highpass + decay */
    paperRip() {
        if (this.muted) return;
        const ctx = this.ensureCtx();
        if (!ctx || !this.masterGain) return;

        const src = ctx.createBufferSource();
        src.buffer = this.getNoiseBuffer(ctx);
        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(2500, ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.3);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.0001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.5, ctx.currentTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);

        src.connect(filter).connect(gain).connect(this.masterGain);
        src.start();
        src.stop(ctx.currentTime + 0.45);
    }

    /** Bone rattle — rapid low clicks (60–90 Hz) */
    boneRattle() {
        if (this.muted) return;
        const ctx = this.ensureCtx();
        if (!ctx || !this.masterGain) return;

        for (let i = 0; i < 5; i++) {
            const t = ctx.currentTime + i * 0.045;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'square';
            osc.frequency.value = 60 + Math.random() * 40;
            gain.gain.setValueAtTime(0.0001, t);
            gain.gain.exponentialRampToValueAtTime(0.35, t + 0.003);
            gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
            osc.connect(gain).connect(this.masterGain);
            osc.start(t);
            osc.stop(t + 0.06);
        }
    }

    /** Success ding — major triad arpeggio (C–E–G) */
    successDing() {
        if (this.muted) return;
        const ctx = this.ensureCtx();
        const master = this.masterGain;
        if (!ctx || !master) return;

        const notes = [523.25, 659.25, 783.99]; // C5 E5 G5
        notes.forEach((freq, i) => {
            const t = ctx.currentTime + i * 0.07;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.0001, t);
            gain.gain.exponentialRampToValueAtTime(0.32, t + 0.008);
            gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
            osc.connect(gain).connect(master);
            osc.start(t);
            osc.stop(t + 0.35);
        });
    }

    /** Crowd murmur — soft low-band noise for "applause" feel */
    crowdMurmur() {
        if (this.muted) return;
        const ctx = this.ensureCtx();
        if (!ctx || !this.masterGain) return;

        const src = ctx.createBufferSource();
        src.buffer = this.getNoiseBuffer(ctx);
        src.loop = true;
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 800;
        filter.Q.value = 0.6;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.0001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.4);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.5);

        src.connect(filter).connect(gain).connect(this.masterGain);
        src.start();
        src.stop(ctx.currentTime + 1.6);
    }

    /** Streak fanfare — 3 beeps rising in pitch */
    streakFanfare() {
        if (this.muted) return;
        const ctx = this.ensureCtx();
        const master = this.masterGain;
        if (!ctx || !master) return;
        [600, 800, 1100].forEach((f, i) => {
            const t = ctx.currentTime + i * 0.08;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.value = f;
            gain.gain.setValueAtTime(0.0001, t);
            gain.gain.exponentialRampToValueAtTime(0.3, t + 0.005);
            gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
            osc.connect(gain).connect(master);
            osc.start(t);
            osc.stop(t + 0.18);
        });
    }

    /** Pen scratch when something is written on the expediente */
    scratch() {
        if (this.muted) return;
        const ctx = this.ensureCtx();
        if (!ctx || !this.masterGain) return;

        const src = ctx.createBufferSource();
        src.buffer = this.getNoiseBuffer(ctx);
        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 3000;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.0001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18);

        src.connect(filter).connect(gain).connect(this.masterGain);
        src.start();
        src.stop(ctx.currentTime + 0.2);
    }

    private shortClick(freq: number, duration = 0.04, peakGain = 0.4) {
        const ctx = this.ensureCtx();
        if (!ctx || !this.masterGain) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.0001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(peakGain, ctx.currentTime + 0.002);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
        osc.connect(gain).connect(this.masterGain);
        osc.start();
        osc.stop(ctx.currentTime + duration + 0.02);
    }

    private getNoiseBuffer(ctx: AudioContext): AudioBuffer {
        if (this.noiseBuffer) return this.noiseBuffer;
        const sr = ctx.sampleRate;
        const buf = ctx.createBuffer(1, sr * 0.5, sr);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        this.noiseBuffer = buf;
        return buf;
    }
}

export const SoundFx = new SoundFxClass();
