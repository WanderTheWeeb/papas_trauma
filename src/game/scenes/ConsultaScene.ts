import { GameObjects, Scene } from 'phaser';
import { COLORS, COLORS_HEX, FONTS, TYPE } from '../config/theme';
import { EVENTS, GAME_HEIGHT, GAME_WIDTH, SCENES } from '../config/constants';
import { EventBus } from '../EventBus';
import { GameState } from '../state/GameState';
import { Expediente, EXPEDIENTE_H } from '../objects/Expediente';
import { SoundFx } from '../objects/SoundFx';
import { StreakTracker } from '../objects/StreakTracker';
import type { ScoreDesglosado } from '../data/types';
import { getPersonaje, type Personaje } from '../data/personajes';
import { PhaseHandler } from '../phases/PhaseHandler';
import { RecepcionPhase } from '../phases/RecepcionPhase';
import { ExploracionPhase } from '../phases/ExploracionPhase';
import { SelladoPhase } from '../phases/SelladoPhase';
import { PrescripcionPhase } from '../phases/PrescripcionPhase';

export const COUNTER_Y = 440;
export const DESK_TOP = 470;
export const DESK_BOTTOM = 820;
export const DESK_LEFT = 80;
export const DESK_RIGHT = 1480;
export const BANDEJA_X = 80;
export const BANDEJA_Y = DESK_TOP;
export const BANDEJA_W = 600;
export const BANDEJA_H = DESK_BOTTOM - DESK_TOP;
export const EXPEDIENTE_X = 1100;
export const EXPEDIENTE_Y = DESK_TOP + 30 + EXPEDIENTE_H / 2;

const PHASE_ORDER: Array<'recepcion' | 'exploracion' | 'sellado' | 'prescripcion'> = [
    'recepcion',
    'exploracion',
    'sellado',
    'prescripcion',
];

export class ConsultaScene extends Scene {
    private expediente!: Expediente;
    private bandeja!: GameObjects.Container;
    private aux!: GameObjects.Container;
    private currentPhase: PhaseHandler | null = null;
    private currentPhaseId: 'recepcion' | 'exploracion' | 'sellado' | 'prescripcion' | 'enviado' = 'recepcion';

    private phaseLabelText!: GameObjects.Text;
    private phaseHintText!: GameObjects.Text;
    private stepIndicators: GameObjects.Container[] = [];
    private statusFooter!: GameObjects.Text;
    private sendButton?: GameObjects.Container;
    private overlay?: GameObjects.Container;

    // Sans / clock / mute
    private sansSprite?: GameObjects.Image;
    private sansBaseY = 0;
    private sansX = 0;
    private reactionContainer?: GameObjects.Container;
    private reactionTimer?: Phaser.Time.TimerEvent;
    private clockText!: GameObjects.Text;
    private clockSeconds = 23 * 3600 + 47 * 60; // starts at 23:47
    private clockEvent?: Phaser.Time.TimerEvent;
    private muteIcon?: GameObjects.Text;
    private chitchatEvent?: Phaser.Time.TimerEvent;
    private chitchatPool: string[] = [];

    // Personaje del caso actual (Sans / Zombie / Doña Carmen)
    private personaje!: Personaje;

    // Activity tracking (idle trigger)
    private lastActivityAt = 0;
    private idleEvent?: Phaser.Time.TimerEvent;

    // Sans easter eggs (hover / click)
    private hoverTimer?: Phaser.Time.TimerEvent;
    private lastSansClickAt = 0;

    // Streaks
    public streaks!: StreakTracker;

    constructor() {
        super(SCENES.CONSULTA);
    }

    create() {
        // Reset per-scene state — Phaser reusa la instancia entre casos
        this.stepIndicators = [];
        this.sansSprite = undefined;
        this.reactionContainer = undefined;
        this.reactionTimer = undefined;
        this.chitchatEvent = undefined;
        this.chitchatPool = [];
        this.idleEvent = undefined;
        this.hoverTimer = undefined;
        this.clockEvent = undefined;
        this.muteIcon = undefined;
        this.sendButton = undefined;
        this.overlay = undefined;
        this.currentPhase = null;
        this.currentPhaseId = 'recepcion';

        // Make sure the case is started
        if (!GameState.getTicket()) GameState.startNewCase(0);
        const caso = GameState.getCaso();

        this.cameras.main.setBackgroundColor(COLORS.bgDeep);
        this.drawAtmosphere();
        this.drawChrome();

        if (!caso) {
            this.add
                .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'No hay casos cargados.', {
                    ...TYPE.h3,
                    color: COLORS_HEX.danger,
                })
                .setOrigin(0.5);
            EventBus.emit(EVENTS.CURRENT_SCENE_READY, this);
            return;
        }

        this.personaje = getPersonaje(caso.personajeId);

        this.drawWindow(caso.motivo);
        this.drawCounter();

        // Containers (children of the scene's display list, not the desk graphics)
        this.aux = this.add.container(0, 0);
        this.bandeja = this.add.container(0, 0);

        this.expediente = new Expediente(this, EXPEDIENTE_X, EXPEDIENTE_Y, caso);

        this.drawPhaseStrip();
        this.drawFooter();

        this.cameras.main.fadeIn(300, 7, 14, 24);
        this.startPhase('recepcion');
        this.startChitchat();
        this.setupSansEasterEggs();
        this.setupActivityTracker();

        // Streak tracker
        this.streaks = new StreakTracker(this);
        this.streaks.onDirty(line => this.sansReact(line, 'doubt'));
        this.streaks.onCombo(line => this.sansReact(line, 'ok'));

        EventBus.emit(EVENTS.CURRENT_SCENE_READY, this);
    }

    // ─── Sans easter eggs (hover / click on sprite) ─────────
    private setupSansEasterEggs() {
        if (!this.sansSprite) return;

        // Approximate hit area around the sprite
        this.sansSprite.setInteractive({ useHandCursor: true });

        this.sansSprite.on('pointerover', () => {
            if (this.hoverTimer) this.hoverTimer.remove();
            this.hoverTimer = this.time.delayedCall(1100, () => {
                if (this.reactionContainer) return;
                const lines = this.personaje.hoverLines;
                this.sansReact(lines[Math.floor(Math.random() * lines.length)], 'doubt');
            });
        });

        this.sansSprite.on('pointerout', () => {
            if (this.hoverTimer) {
                this.hoverTimer.remove();
                this.hoverTimer = undefined;
            }
        });

        this.sansSprite.on('pointerdown', () => {
            const now = this.time.now;
            if (now - this.lastSansClickAt < 800) return; // throttle
            this.lastSansClickAt = now;

            const lines = this.personaje.pokeLines;
            this.sansReact(lines[Math.floor(Math.random() * lines.length)], 'pain');
            // Light wiggle
            if (this.sansSprite) {
                this.tweens.add({
                    targets: this.sansSprite,
                    angle: { from: -4, to: 4 },
                    duration: 50,
                    yoyo: true,
                    repeat: 4,
                    onComplete: () => {
                        if (this.sansSprite) this.sansSprite.angle = 0;
                    },
                });
            }
        });
    }

    // ─── Idle trigger ───────────────────────────────────────
    private setupActivityTracker() {
        this.lastActivityAt = this.time.now;

        const bump = () => {
            this.lastActivityAt = this.time.now;
        };
        this.input.on('pointerdown', bump);
        this.input.on('dragend', bump);

        this.idleEvent = this.time.addEvent({
            delay: 3000,
            loop: true,
            callback: () => {
                if (this.reactionContainer) return;
                const idle = (this.time.now - this.lastActivityAt) / 1000;
                if (idle >= 15) {
                    const lines = this.personaje.idleLines;
                    const line = lines[Math.floor(Math.random() * lines.length)];
                    this.sansReact(line, 'doubt');
                    this.lastActivityAt = this.time.now; // don't spam
                }
            },
        });
    }

    // ─── Static chrome / desk ────────────────────────────────
    private drawAtmosphere() {
        if (this.textures.exists('bg-station1')) {
            this.add.image(0, 0, 'bg-station1').setOrigin(0).setDisplaySize(GAME_WIDTH, GAME_HEIGHT);
        }
        const veil = this.add.graphics();
        veil.fillStyle(COLORS.bgDeep, 0.62);
        veil.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    }

    private drawChrome() {
        const m = 40;
        const lines = this.add.graphics();
        lines.lineStyle(1, COLORS.border, 1);
        lines.lineBetween(m, m, GAME_WIDTH - m, m);
        lines.lineBetween(m, GAME_HEIGHT - m, GAME_WIDTH - m, GAME_HEIGHT - m);

        const ticks = this.add.graphics();
        ticks.lineStyle(1, COLORS.success, 0.7);
        const t = 12;
        ticks.lineBetween(m, m, m + t, m);
        ticks.lineBetween(m, m, m, m + t);
        ticks.lineBetween(GAME_WIDTH - m, m, GAME_WIDTH - m - t, m);
        ticks.lineBetween(GAME_WIDTH - m, m, GAME_WIDTH - m, m + t);
        ticks.lineBetween(m, GAME_HEIGHT - m, m + t, GAME_HEIGHT - m);
        ticks.lineBetween(m, GAME_HEIGHT - m, m, GAME_HEIGHT - m - t);
        ticks.lineBetween(GAME_WIDTH - m, GAME_HEIGHT - m, GAME_WIDTH - m - t, GAME_HEIGHT - m);
        ticks.lineBetween(GAME_WIDTH - m, GAME_HEIGHT - m, GAME_WIDTH - m, GAME_HEIGHT - m - t);

        const caso = GameState.getCaso();
        // Top-left brand
        this.add
            .text(m + 16, m - 22, 'TS / ER · v0.4', {
                ...TYPE.mono,
                fontSize: '11px',
                color: COLORS_HEX.textMuted,
            })
            .setOrigin(0, 1);

        if (caso) {
            // Just the file number, no patient details (those live in the expediente)
            this.add
                .text(GAME_WIDTH - m - 180, m - 22, `EXP. ${caso.id.toString().padStart(3, '0')}`, {
                    ...TYPE.mono,
                    fontSize: '11px',
                    color: COLORS_HEX.textDim,
                })
                .setOrigin(1, 1);
        }

        // Clock — top-right, mono, dim teal
        this.clockText = this.add
            .text(GAME_WIDTH - m - 60, m - 22, this.clockLabel(), {
                fontFamily: FONTS.mono,
                fontSize: '13px',
                color: COLORS_HEX.success,
                fontStyle: '500',
            })
            .setOrigin(1, 1)
            .setLetterSpacing(1.4);

        // Mute toggle — small circle with speaker glyph
        this.muteIcon = this.add
            .text(GAME_WIDTH - m - 16, m - 22, '♪', {
                fontFamily: FONTS.mono,
                fontSize: '14px',
                color: COLORS_HEX.success,
            })
            .setOrigin(1, 1)
            .setInteractive({ useHandCursor: true });
        this.muteIcon.on('pointerdown', () => this.toggleMute());

        // Start clock — one tick per real second = 1 in-game minute
        this.clockEvent = this.time.addEvent({
            delay: 1000,
            loop: true,
            callback: () => {
                this.clockSeconds += 60;
                if (this.clockText) this.clockText.setText(this.clockLabel());
                // Soft tick every 5 in-game minutes
                if ((this.clockSeconds / 60) % 5 === 0) SoundFx.tick();
            },
        });
    }

    private clockLabel(): string {
        const totalMinutes = Math.floor(this.clockSeconds / 60);
        const h = Math.floor(totalMinutes / 60) % 24;
        const m = totalMinutes % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    }

    private toggleMute() {
        const next = !SoundFx.isMuted();
        SoundFx.setMuted(next);
        if (this.muteIcon) {
            this.muteIcon.setText(next ? '✕' : '♪');
            this.muteIcon.setColor(next ? COLORS_HEX.textDim : COLORS_HEX.success);
        }
    }

    private drawWindow(_motivo: string) {
        // Sans on the left
        const colX = 280;
        const baseY = COUNTER_Y - 10;

        const pedestal = this.add.graphics();
        pedestal.fillStyle(0x000000, 0.22);
        pedestal.fillEllipse(colX, baseY + 6, 220, 22);

        this.sansX = colX;
        this.sansBaseY = baseY;

        // Fallback al sprite de sans si el del personaje no se cargó
        const spriteKey = this.textures.exists(this.personaje.spriteKey)
            ? this.personaje.spriteKey
            : 'patient-sans';

        if (this.textures.exists(spriteKey)) {
            const sprite = this.add.image(colX, baseY, spriteKey).setOrigin(0.5, 1);
            const tex = sprite.texture.getSourceImage() as { width: number; height: number };
            const tw = tex.width || sprite.width;
            const th = tex.height || sprite.height;
            const maxW = 260;
            const maxH = 270;
            const scale = Math.min(maxW / tw, maxH / th);
            sprite.setScale(scale);

            this.tweens.add({
                targets: sprite,
                y: baseY - 4,
                duration: 1800,
                ease: 'Sine.inOut',
                yoyo: true,
                repeat: -1,
            });
            this.sansSprite = sprite;
        }

        const caso = GameState.getCaso();
        const motivo = caso?.motivo ?? '';

        const bx = 460;
        const by = 180;
        const bw = 700;
        const bh = 220;

        // Bubble container so we can animate it as a unit
        const bubbleCont = this.add.container(0, 0);

        const bubble = this.add.graphics();
        bubble.fillStyle(COLORS.paper, 0.95);
        bubble.fillRoundedRect(bx, by, bw, bh, 12);
        bubble.lineStyle(1, 0xc9bfa6, 0.55);
        bubble.strokeRoundedRect(bx, by, bw, bh, 12);
        bubble.fillStyle(COLORS.paper, 0.95);
        bubble.fillTriangle(bx, by + 80, bx, by + 120, bx - 18, by + 100);
        bubbleCont.add(bubble);

        const eyebrow = this.add
            .text(bx + 24, by + 22, '— DICE EL PACIENTE', {
                ...TYPE.paperLabel,
                fontSize: '10px',
                color: '#9a9080',
            })
            .setOrigin(0, 0)
            .setLetterSpacing(2.4);
        bubbleCont.add(eyebrow);

        bubbleCont.add(this.add.rectangle(bx + 24, by + 42, 22, 1, 0xc9bfa6).setOrigin(0, 0));

        // Typewriter text — start empty, fill char by char
        const motivoText = this.add
            .text(bx + 24, by + 56, '', {
                fontFamily: FONTS.body,
                fontSize: '17px',
                color: COLORS_HEX.ink,
                fontStyle: 'italic',
                wordWrap: { width: bw - 48 },
                lineSpacing: 5,
            })
            .setOrigin(0, 0);
        bubbleCont.add(motivoText);

        // Bubble pop-in
        bubbleCont.setAlpha(0);
        bubbleCont.y = -10;
        this.tweens.add({
            targets: bubbleCont,
            alpha: 1,
            y: 0,
            duration: 360,
            delay: 320,
            ease: 'Back.out',
        });

        // Typewriter + voice — kicks in after the bubble settles
        const fullText = '"' + motivo + '"';
        let i = 0;
        const startDelay = 700;

        this.time.delayedCall(startDelay, () => {
            // play one long voice burst across the typewriter
            SoundFx.sansVoice(Math.min(40, fullText.length), this.personaje.voiceFreq);
            const ev = this.time.addEvent({
                delay: 26,
                repeat: fullText.length - 1,
                callback: () => {
                    i++;
                    motivoText.setText(fullText.slice(0, i));
                    // periodic voice retrigger so it keeps "talking"
                    if (i % 18 === 0) SoundFx.sansVoice(18, this.personaje.voiceFreq);
                },
            });
            void ev;
        });
    }

    private drawCounter() {
        const m = 80;
        const y = COUNTER_Y;

        const line = this.add.graphics();
        line.lineStyle(1, COLORS.borderSoft, 0.7);
        line.lineBetween(m, y, GAME_WIDTH - m, y);

        const ticks = this.add.graphics();
        ticks.lineStyle(1, COLORS.success, 0.35);
        for (let x = m + 40; x < GAME_WIDTH - m; x += 120) {
            ticks.lineBetween(x, y - 3, x, y);
        }
    }

    // ─── Phase strip (between counter and desk) ──────────────
    private drawPhaseStrip() {
        const y = 452;

        // Phase label + hint, top-left of desk area
        this.phaseLabelText = this.add
            .text(DESK_LEFT, y, '', {
                ...TYPE.label,
                fontSize: '11px',
                color: COLORS_HEX.success,
            })
            .setOrigin(0, 0)
            .setLetterSpacing(2.4);

        this.phaseHintText = this.add
            .text(DESK_LEFT, y + 16, '', {
                ...TYPE.bodyS,
                fontSize: '11px',
                color: COLORS_HEX.textDim,
                fontStyle: 'italic',
            })
            .setOrigin(0, 0);

        // Step indicators on the right side of the strip
        const cellW = 124;
        const stripRightX = DESK_RIGHT;
        const totalW = PHASE_ORDER.length * cellW;
        const startX = stripRightX - totalW;

        PHASE_ORDER.forEach((id, i) => {
            const cx = startX + i * cellW + cellW / 2;
            const cont = this.add.container(cx, y + 10);

            const num = this.add
                .text(-30, 0, (i + 1).toString().padStart(2, '0'), {
                    ...TYPE.mono,
                    fontSize: '11px',
                    color: COLORS_HEX.textDim,
                })
                .setOrigin(0, 0.5);
            const label = this.add
                .text(-12, 0, this.shortLabel(id), {
                    ...TYPE.label,
                    fontSize: '10px',
                    color: COLORS_HEX.textDim,
                })
                .setOrigin(0, 0.5)
                .setLetterSpacing(2.2);
            const underline = this.add
                .rectangle(-30, 12, 84, 1, COLORS.borderSoft, 0.7)
                .setOrigin(0, 0);
            cont.add([num, label, underline]);
            this.stepIndicators.push(cont);
        });
    }

    private shortLabel(id: string) {
        switch (id) {
            case 'recepcion':
                return 'RECEPCIÓN';
            case 'exploracion':
                return 'EXPLORACIÓN';
            case 'sellado':
                return 'SELLADO';
            case 'prescripcion':
                return 'RECETA';
            default:
                return id.toUpperCase();
        }
    }

    private updateStepIndicators() {
        const idx = PHASE_ORDER.indexOf(this.currentPhaseId as never);
        this.stepIndicators.forEach((cont, i) => {
            const num = cont.getAt(0) as GameObjects.Text;
            const label = cont.getAt(1) as GameObjects.Text;
            const underline = cont.getAt(2) as GameObjects.Rectangle;

            if (i === idx) {
                num.setColor(COLORS_HEX.success).setFontStyle('500');
                label.setColor(COLORS_HEX.text);
                underline.setFillStyle(COLORS.success, 1);
                underline.height = 2;
            } else if (i < idx || (this.currentPhaseId === 'enviado' && i <= 3)) {
                num.setColor(COLORS_HEX.text).setFontStyle('400');
                label.setColor(COLORS_HEX.textMuted);
                underline.setFillStyle(COLORS.borderSoft, 0.9);
                underline.height = 1;
            } else {
                num.setColor(COLORS_HEX.textDim).setFontStyle('400');
                label.setColor(COLORS_HEX.textDim);
                underline.setFillStyle(COLORS.borderSoft, 0.4);
                underline.height = 1;
            }
        });
    }

    // ─── Footer ──────────────────────────────────────────────
    private drawFooter() {
        const m = 40;
        const gutterY = GAME_HEIGHT - m + 14;

        this.add
            .text(m + 16, gutterY, 'PAPA’S TRAUMA STATION  /  ER EDITION', {
                ...TYPE.label,
                fontSize: '10px',
                color: COLORS_HEX.textDim,
            })
            .setOrigin(0, 0);

        this.statusFooter = this.add
            .text(GAME_WIDTH / 2, gutterY, this.computeFooterStatus(), {
                ...TYPE.mono,
                fontSize: '10px',
                color: COLORS_HEX.textMuted,
            })
            .setOrigin(0.5, 0);
    }

    refreshFooter() {
        if (this.statusFooter) this.statusFooter.setText(this.computeFooterStatus());
    }

    // ─── Sans reactions (small floating bubble) ──────────────
    /**
     * Pops a small reaction bubble next to Sans for ~1.6 s. Use for short
     * diegetic feedback when the player succeeds or fails an interaction.
     */
    sansReact(text: string, mood: 'pain' | 'ok' | 'doubt' | 'thanks' = 'ok') {
        if (!this.sansSprite) return;

        // Tear down any previous reaction
        if (this.reactionContainer) {
            this.reactionContainer.destroy();
            this.reactionContainer = undefined;
        }
        if (this.reactionTimer) {
            this.reactionTimer.remove();
            this.reactionTimer = undefined;
        }

        const cx = this.sansX + 110;
        const cy = this.sansBaseY - 230;

        const cont = this.add.container(cx, cy).setDepth(2500);

        const padX = 14;
        const padY = 8;
        const tmp = this.add.text(0, 0, text, {
            fontFamily: FONTS.body,
            fontSize: '14px',
            color: COLORS_HEX.ink,
            fontStyle: 'italic',
            wordWrap: { width: 220 },
            align: 'center',
        }).setOrigin(0.5);
        const w = tmp.width + padX * 2;
        const h = tmp.height + padY * 2;
        tmp.destroy();

        // Bubble background
        const bubble = this.add.graphics();
        bubble.fillStyle(COLORS.paper, 0.97);
        bubble.fillRoundedRect(-w / 2, -h / 2, w, h, 10);
        bubble.lineStyle(1, 0xc9bfa6, 0.8);
        bubble.strokeRoundedRect(-w / 2, -h / 2, w, h, 10);
        // Tail downward toward Sans
        bubble.fillStyle(COLORS.paper, 0.97);
        bubble.fillTriangle(-12, h / 2, 12, h / 2, 0, h / 2 + 14);
        cont.add(bubble);

        // Mood color tag
        const tagColor =
            mood === 'pain' ? COLORS.danger : mood === 'doubt' ? COLORS.warning : COLORS.success;
        cont.add(this.add.rectangle(-w / 2 + 8, 0, 4, h - 16, tagColor).setOrigin(0.5));

        const txt = this.add
            .text(0, 0, text, {
                fontFamily: FONTS.body,
                fontSize: '14px',
                color: COLORS_HEX.ink,
                fontStyle: 'italic',
                wordWrap: { width: 220 },
                align: 'center',
            })
            .setOrigin(0.5);
        cont.add(txt);

        // Pop-in animation
        cont.setScale(0.7).setAlpha(0);
        this.tweens.add({
            targets: cont,
            scale: 1,
            alpha: 1,
            y: cy - 6,
            duration: 220,
            ease: 'Back.out',
        });

        // Voice
        SoundFx.sansVoice(text.length, this.personaje?.voiceFreq);

        // Wiggle Sans on pain
        if (mood === 'pain' && this.sansSprite) {
            this.tweens.add({
                targets: this.sansSprite,
                angle: { from: -3, to: 3 },
                duration: 60,
                yoyo: true,
                repeat: 3,
                onComplete: () => {
                    if (this.sansSprite) this.sansSprite.angle = 0;
                },
            });
        }

        this.reactionContainer = cont;
        this.reactionTimer = this.time.delayedCall(1600, () => {
            if (!this.reactionContainer) return;
            this.tweens.add({
                targets: this.reactionContainer,
                alpha: 0,
                y: cy - 16,
                duration: 240,
                onComplete: () => {
                    this.reactionContainer?.destroy();
                    this.reactionContainer = undefined;
                },
            });
        });
    }

    /** Public sound hook for phase handlers */
    playSfx(
        name:
            | 'thunk'
            | 'swoosh'
            | 'beep'
            | 'error'
            | 'pickup'
            | 'scratch'
            | 'tick'
            | 'paperRip'
            | 'boneRattle'
            | 'successDing'
            | 'streakFanfare'
            | 'crowdMurmur',
    ) {
        switch (name) {
            case 'thunk':
                SoundFx.thunk();
                break;
            case 'swoosh':
                SoundFx.swoosh();
                break;
            case 'beep':
                SoundFx.beep();
                break;
            case 'error':
                SoundFx.error();
                break;
            case 'pickup':
                SoundFx.pickup();
                break;
            case 'scratch':
                SoundFx.scratch();
                break;
            case 'tick':
                SoundFx.tick();
                break;
            case 'paperRip':
                SoundFx.paperRip();
                break;
            case 'boneRattle':
                SoundFx.boneRattle();
                break;
            case 'successDing':
                SoundFx.successDing();
                break;
            case 'streakFanfare':
                SoundFx.streakFanfare();
                break;
            case 'crowdMurmur':
                SoundFx.crowdMurmur();
                break;
        }
    }

    /** Sans speaking voice (Undertale-style beep beep) */
    sansSpeak(charCount = 12) {
        SoundFx.sansVoice(charCount);
    }

    // ─── Chitchat: el paciente suelta random pendejadas ─────
    private startChitchat() {
        this.chitchatPool = [...this.personaje.chitchat];

        // First chitchat after a beat, then every 9–14s
        const schedule = () => {
            const delay = 9000 + Math.random() * 5000;
            this.chitchatEvent = this.time.delayedCall(delay, () => {
                this.firePendejada();
                schedule();
            });
        };
        // Initial delay so it doesn't talk over the opening motivo
        this.time.delayedCall(6000, schedule);
    }

    private firePendejada() {
        // Don't interrupt an active reaction
        if (this.reactionContainer) return;
        // Pick one and remove from pool so we don't repeat in the same session
        if (this.chitchatPool.length === 0) return;
        const idx = Math.floor(Math.random() * this.chitchatPool.length);
        const line = this.chitchatPool.splice(idx, 1)[0];
        this.sansReact(line, 'ok');
    }

    private stopChitchat() {
        if (this.chitchatEvent) {
            this.chitchatEvent.remove();
            this.chitchatEvent = undefined;
        }
    }

    private computeFooterStatus(): string {
        const caso = GameState.getCaso();
        const t = GameState.getTicket();
        if (!caso || !t) return '— · — · — · —';
        const f = `${t.factoresSeleccionados.length}/${caso.factoresRiesgo.length}`;
        const m = `${t.maniobrasRealizadas.length}/${caso.maniobras.length}`;
        const d = t.diagnosticoSellado ? 'OK' : '—';
        const r = t.farmacoSeleccionado ? 'OK' : '—';
        return `FACT  ${f}   ·   MAN  ${m}   ·   DX  ${d}   ·   RX  ${r}`;
    }

    // ─── Phase orchestration ─────────────────────────────────
    private startPhase(id: 'recepcion' | 'exploracion' | 'sellado' | 'prescripcion') {
        this.currentPhaseId = id;
        this.updateStepIndicators();

        const handler = this.makePhase(id);
        this.currentPhase = handler;
        this.phaseLabelText.setText(handler.phaseLabel());
        this.phaseHintText.setText(handler.phaseHint());

        // fade-in animation: bandeja + aux start at alpha 0
        this.bandeja.setAlpha(0);
        this.aux.setAlpha(0);
        handler.build();
        this.tweens.add({
            targets: [this.bandeja, this.aux],
            alpha: 1,
            duration: 320,
            ease: 'Sine.out',
        });

        this.refreshFooter();
    }

    private makePhase(id: 'recepcion' | 'exploracion' | 'sellado' | 'prescripcion'): PhaseHandler {
        const ctx = {
            scene: this,
            caso: GameState.getCaso()!,
            expediente: this.expediente,
            bandeja: this.bandeja,
            aux: this.aux,
            onComplete: () => this.advancePhase(),
        };
        switch (id) {
            case 'recepcion':
                return new RecepcionPhase(ctx);
            case 'exploracion':
                return new ExploracionPhase(ctx);
            case 'sellado':
                return new SelladoPhase(ctx);
            case 'prescripcion':
                return new PrescripcionPhase(ctx);
        }
    }

    private advancePhase() {
        const idx = PHASE_ORDER.indexOf(this.currentPhaseId as never);
        const next = PHASE_ORDER[idx + 1];
        SoundFx.successDing();
        SoundFx.swoosh();
        // fade-out, swap, fade-in
        this.tweens.add({
            targets: [this.bandeja, this.aux],
            alpha: 0,
            duration: 260,
            ease: 'Sine.in',
            onComplete: () => {
                this.currentPhase?.cleanup();
                this.currentPhase = null;
                if (next) {
                    this.startPhase(next);
                } else {
                    this.currentPhaseId = 'enviado';
                    this.updateStepIndicators();
                    this.showEvaluation();
                }
            },
        });
    }

    // ─── Evaluation overlay ──────────────────────────────────
    private getTitle(score: ScoreDesglosado): { name: string; sub: string } {
        if (score.total === 100) return { name: 'HUESO DE ORO', sub: 'mejor doc del turno' };
        if (score.total >= 90) return { name: 'DOCTOR HOUSE', sub: 'gruñón pero efectivo' };
        if (score.total >= 75) return { name: 'MÉDICO COMPETENTE', sub: 'no es House pero ahí va' };
        if (score.diagnostic === 25 && score.symptom === 25)
            return { name: 'OJO CLÍNICO', sub: 'el diagnóstico fue lo único bien' };
        if (score.total >= 50) return { name: 'MÉDICO PROMEDIO', sub: 'el paciente vivirá. probablemente.' };
        if (score.total >= 30) return { name: 'MÉDICO DE YELP', sub: '2 estrellas — "no recomendado"' };
        if (score.total >= 10) return { name: 'CARNICERO CERTIFICADO', sub: 'huesos rotos al cliente' };
        return { name: 'EXPEDIENTE DESASTROSO', sub: 'el paciente huyó por las escaleras' };
    }

    private playFarewellSequence(seq: Array<{ line: string; mood: 'pain' | 'ok' | 'doubt' | 'thanks' }>) {
        seq.forEach((step, i) => {
            this.time.delayedCall(1200 + i * 1900, () => {
                this.sansReact(step.line, step.mood);
            });
        });
    }

    private getSansFarewellSequence(total: number): Array<{ line: string; mood: 'pain' | 'ok' | 'doubt' | 'thanks' }> {
        const f = this.personaje.farewells;
        if (total >= 90) return f.excellent;
        if (total >= 75) return f.good;
        if (total >= 50) return f.mid;
        if (total >= 20) return f.bad;
        return f.terrible;
    }

    private showEvaluation() {
        this.stopChitchat();
        if (this.idleEvent) {
            this.idleEvent.remove();
            this.idleEvent = undefined;
        }
        const score = GameState.evaluate();
        this.refreshFooter();

        // Crowd murmur if score is great
        if (score.total >= 80) SoundFx.crowdMurmur();

        const cx = GAME_WIDTH / 2;
        const cy = GAME_HEIGHT / 2;

        // Dim backdrop
        const dim = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0).setOrigin(0).setDepth(4000);
        this.tweens.add({ targets: dim, alpha: 0.55, duration: 320 });

        const overlay = this.add.container(cx, cy).setDepth(4001);
        const w = 720;
        const h = 560;
        const card = this.add.graphics();
        card.fillStyle(COLORS.paper, 0.98);
        card.fillRoundedRect(-w / 2, -h / 2, w, h, 14);
        card.lineStyle(1, 0xc9bfa6, 1);
        card.strokeRoundedRect(-w / 2, -h / 2, w, h, 14);
        overlay.add(card);

        overlay.add(
            this.add
                .text(0, -h / 2 + 36, 'EVALUACIÓN DEL EXPEDIENTE', {
                    ...TYPE.paperLabel,
                    fontSize: '11px',
                    color: '#9a9080',
                })
                .setOrigin(0.5, 0)
                .setLetterSpacing(2.4),
        );

        // Big total
        const ringColor =
            score.total >= 80 ? COLORS.success : score.total >= 50 ? COLORS.warning : COLORS.danger;
        const ringHex =
            score.total >= 80 ? COLORS_HEX.successDim : score.total >= 50 ? COLORS_HEX.warning : COLORS_HEX.danger;
        const ring = this.add.graphics();
        ring.lineStyle(4, ringColor, 1);
        ring.strokeCircle(0, -h / 2 + 130, 56);
        overlay.add(ring);
        overlay.add(
            this.add
                .text(0, -h / 2 + 130, `${score.total}`, {
                    fontFamily: FONTS.display,
                    fontSize: '48px',
                    color: ringHex,
                    fontStyle: '600',
                })
                .setOrigin(0.5),
        );
        overlay.add(
            this.add
                .text(0, -h / 2 + 196, 'DE 100 PUNTOS', {
                    ...TYPE.paperLabel,
                    fontSize: '10px',
                })
                .setOrigin(0.5)
                .setLetterSpacing(2.4),
        );

        // Title plate (gracioso, basado en score)
        const title = this.getTitle(score);
        const titleColorHex = score.total >= 75 ? COLORS_HEX.success : score.total >= 30 ? COLORS_HEX.warning : COLORS_HEX.danger;

        const titleStripeTop = this.add.rectangle(0, -h / 2 + 218, 220, 1, 0xc9bfa6).setOrigin(0.5);
        const titleText = this.add
            .text(0, -h / 2 + 232, title.name, {
                fontFamily: FONTS.display,
                fontSize: '24px',
                color: titleColorHex,
                fontStyle: '700',
            })
            .setOrigin(0.5);
        const titleSub = this.add
            .text(0, -h / 2 + 256, title.sub, {
                ...TYPE.paperLabel,
                fontSize: '10px',
                color: '#9a9080',
                fontStyle: 'italic',
            })
            .setOrigin(0.5);
        const titleStripeBot = this.add.rectangle(0, -h / 2 + 270, 220, 1, 0xc9bfa6).setOrigin(0.5);
        overlay.add([titleStripeTop, titleText, titleSub, titleStripeBot]);

        // Pop the title with a tiny scale + voice
        titleText.setScale(0.6).setAlpha(0);
        this.tweens.add({
            targets: titleText,
            scale: 1,
            alpha: 1,
            duration: 380,
            delay: 600,
            ease: 'Back.out',
            onComplete: () => SoundFx.sansVoice(title.name.length),
        });

        // Sans farewell sequence — drops 2-4 lines spaced apart, dramatic on bad scores
        this.playFarewellSequence(this.getSansFarewellSequence(score.total));

        // Rows
        const rows: Array<[string, number]> = [
            ['SÍNTOMAS / FACTORES', score.symptom],
            ['EXPLORACIÓN FÍSICA', score.testing],
            ['DIAGNÓSTICO', score.diagnostic],
            ['PRESCRIPCIÓN / DESTINO', score.prescription],
        ];

        rows.forEach(([label, val], i) => {
            const ry = -h / 2 + 296 + i * 30;
            overlay.add(
                this.add
                    .text(-w / 2 + 36, ry, label, {
                        ...TYPE.paperLabel,
                        fontSize: '10px',
                    })
                    .setOrigin(0, 0.5)
                    .setLetterSpacing(2.4),
            );
            // bar
            overlay.add(
                this.add
                    .rectangle(0, ry, 280, 4, 0xd6cdb4)
                    .setOrigin(0, 0.5),
            );
            const fillW = (val / 25) * 280;
            const fillC = val >= 18 ? COLORS.success : val >= 10 ? COLORS.warning : COLORS.danger;
            overlay.add(
                this.add
                    .rectangle(0, ry, fillW, 4, fillC)
                    .setOrigin(0, 0.5),
            );
            overlay.add(
                this.add
                    .text(w / 2 - 36, ry, `${val} / 25`, {
                        fontFamily: FONTS.mono,
                        fontSize: '12px',
                        color: COLORS_HEX.ink,
                    })
                    .setOrigin(1, 0.5),
            );
        });

        // Buttons
        const mkBtn = (relX: number, label: string, onClick: () => void) => {
            const bw = 200;
            const bh = 36;
            const by = h / 2 - 50;
            const c = this.add.container(relX, by);
            const bg = this.add
                .rectangle(0, 0, bw, bh, COLORS.surface, 0.95)
                .setStrokeStyle(1, COLORS.border);
            const t = this.add
                .text(0, 0, label, { ...TYPE.label, fontSize: '11px', color: COLORS_HEX.text })
                .setOrigin(0.5)
                .setLetterSpacing(2.4);
            c.add([bg, t]);
            c.setSize(bw, bh).setInteractive({ useHandCursor: true });
            c.on('pointerover', () => bg.setStrokeStyle(1, COLORS.success));
            c.on('pointerout', () => bg.setStrokeStyle(1, COLORS.border));
            c.on('pointerdown', onClick);
            overlay.add(c);
        };

        mkBtn(-110, 'SIGUIENTE PACIENTE', () => this.nextCase());
        mkBtn(110, 'VOLVER AL MENÚ', () => this.scene.start(SCENES.MAIN_MENU));

        overlay.setAlpha(0);
        overlay.y = cy + 24;
        this.tweens.add({
            targets: overlay,
            alpha: 1,
            y: cy,
            duration: 360,
            ease: 'Cubic.out',
        });

        this.overlay = overlay;
    }

    private nextCase() {
        if (this.clockEvent) {
            this.clockEvent.remove();
            this.clockEvent = undefined;
        }
        this.cameras.main.fadeOut(260, 7, 14, 24);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            GameState.nextCase();
            this.scene.restart();
        });
    }
}
