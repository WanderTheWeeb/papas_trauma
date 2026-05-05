import { GameObjects, Scene } from 'phaser';
import { EventBus } from '../EventBus';
import { COLORS, COLORS_HEX, FONTS, TYPE } from '../config/theme';
import { EVENTS, GAME_HEIGHT, GAME_WIDTH, SCENES } from '../config/constants';
import { GameState } from '../state/GameState';

export class MainMenu extends Scene {
    constructor() {
        super(SCENES.MAIN_MENU);
    }

    create() {
        this.cameras.main.setBackgroundColor(COLORS.bgDeep);

        this.drawAtmosphere();
        this.drawCornerChrome();
        this.drawTopMatter();
        this.drawCenterPlate();
        this.drawStartButton();
        this.drawFooter();
        this.playEntrance();

        EventBus.emit(EVENTS.CURRENT_SCENE_READY, this);
    }

    // ─── background ──────────────────────────────────────────
    private drawAtmosphere() {
        if (this.textures.exists('bg-menu')) {
            this.add.image(0, 0, 'bg-menu').setOrigin(0, 0).setDisplaySize(GAME_WIDTH, GAME_HEIGHT);
        }
        const veil = this.add.graphics();
        veil.fillStyle(COLORS.bgDeep, 0.62);
        veil.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // Faint vignette bottom
        const vg = this.add.graphics();
        vg.fillStyle(0x000000, 0.4);
        vg.fillRect(0, GAME_HEIGHT - 280, GAME_WIDTH, 280);
    }

    // ─── corner ticks chrome ─────────────────────────────────
    private drawCornerChrome() {
        const m = 60;
        const lines = this.add.graphics();
        lines.lineStyle(1, COLORS.border, 1);
        lines.lineBetween(m, m, GAME_WIDTH - m, m);
        lines.lineBetween(m, GAME_HEIGHT - m, GAME_WIDTH - m, GAME_HEIGHT - m);

        const ticks = this.add.graphics();
        ticks.lineStyle(1, COLORS.success, 0.8);
        const t = 14;
        ticks.lineBetween(m, m, m + t, m);
        ticks.lineBetween(m, m, m, m + t);
        ticks.lineBetween(GAME_WIDTH - m, m, GAME_WIDTH - m - t, m);
        ticks.lineBetween(GAME_WIDTH - m, m, GAME_WIDTH - m, m + t);
        ticks.lineBetween(m, GAME_HEIGHT - m, m + t, GAME_HEIGHT - m);
        ticks.lineBetween(m, GAME_HEIGHT - m, m, GAME_HEIGHT - m - t);
        ticks.lineBetween(GAME_WIDTH - m, GAME_HEIGHT - m, GAME_WIDTH - m - t, GAME_HEIGHT - m);
        ticks.lineBetween(GAME_WIDTH - m, GAME_HEIGHT - m, GAME_WIDTH - m, GAME_HEIGHT - m - t);
    }

    // ─── top eyebrow strip ───────────────────────────────────
    private drawTopMatter() {
        const m = 60;

        // Brand mark
        this.add
            .text(m + 16, m - 24, 'TS / ER · v0.4', {
                ...TYPE.mono,
                fontSize: '11px',
                color: COLORS_HEX.textMuted,
            })
            .setOrigin(0, 1);

        const dt = new Date();
        const dateStr = dt.toLocaleDateString('es-MX', {
            weekday: 'short',
            day: '2-digit',
            month: 'short',
        }).toUpperCase();
        this.add
            .text(GAME_WIDTH - m - 16, m - 24, `TURNO  ·  ${dateStr}`, {
                ...TYPE.label,
                fontSize: '11px',
                color: COLORS_HEX.textMuted,
            })
            .setOrigin(1, 1)
            .setLetterSpacing(2.4);
    }

    // ─── center title plate ──────────────────────────────────
    private drawCenterPlate() {
        const cx = GAME_WIDTH / 2;
        const titleY = 240;

        // Eyebrow
        this.add
            .text(cx, titleY - 50, 'PAPA’S  ·  EMERGENCY ROOM EDITION', {
                ...TYPE.label,
                fontSize: '11px',
                color: COLORS_HEX.success,
            })
            .setOrigin(0.5)
            .setLetterSpacing(3);

        // Hairline above title
        this.add.rectangle(cx, titleY - 30, 80, 1, COLORS.border).setOrigin(0.5);

        // Big title
        this.add
            .text(cx, titleY + 20, 'TRAUMA STATION', {
                fontFamily: FONTS.display,
                fontSize: '92px',
                color: COLORS_HEX.text,
                fontStyle: '700',
            })
            .setOrigin(0.5);

        // Sub
        this.add
            .text(cx, titleY + 92, 'urgencias  ·  hombro  ·  consulta única', {
                fontFamily: FONTS.body,
                fontSize: '15px',
                color: COLORS_HEX.textMuted,
                fontStyle: 'italic',
            })
            .setOrigin(0.5)
            .setLetterSpacing(2);
    }

    // ─── start button ────────────────────────────────────────
    private drawStartButton() {
        const cx = GAME_WIDTH / 2;
        const by = 740;
        const w = 360;
        const h = 56;

        const btn = this.add.container(cx, by);
        const bg = this.add
            .rectangle(0, 0, w, h, COLORS.surface, 0.85)
            .setStrokeStyle(1, COLORS.border);
        const ring = this.add.graphics();
        const drawRing = (color: number, alpha = 1) => {
            ring.clear();
            ring.lineStyle(1, color, alpha);
            const t = 10;
            ring.lineBetween(-w / 2, -h / 2, -w / 2 + t, -h / 2);
            ring.lineBetween(-w / 2, -h / 2, -w / 2, -h / 2 + t);
            ring.lineBetween(w / 2, -h / 2, w / 2 - t, -h / 2);
            ring.lineBetween(w / 2, -h / 2, w / 2, -h / 2 + t);
            ring.lineBetween(-w / 2, h / 2, -w / 2 + t, h / 2);
            ring.lineBetween(-w / 2, h / 2, -w / 2, h / 2 - t);
            ring.lineBetween(w / 2, h / 2, w / 2 - t, h / 2);
            ring.lineBetween(w / 2, h / 2, w / 2, h / 2 - t);
        };
        drawRing(COLORS.success, 0.7);

        const label = this.add
            .text(-w / 2 + 28, 0, 'EMPEZAR TURNO', {
                ...TYPE.label,
                fontSize: '13px',
                color: COLORS_HEX.text,
            })
            .setOrigin(0, 0.5)
            .setLetterSpacing(3);

        const arrow = this.add
            .text(w / 2 - 28, 0, '→', {
                fontFamily: FONTS.mono,
                fontSize: '24px',
                color: COLORS_HEX.success,
                fontStyle: '300',
            })
            .setOrigin(1, 0.5);

        const sep = this.add.rectangle(w / 2 - 70, -h / 2 + 14, 1, h - 28, COLORS.borderSoft).setOrigin(0, 0);

        btn.add([bg, ring, label, sep, arrow]);
        btn.setSize(w, h).setInteractive({ useHandCursor: true });

        btn.on('pointerover', () => {
            bg.setFillStyle(COLORS.surfaceAlt, 0.95);
            bg.setStrokeStyle(1, COLORS.success);
            label.setColor(COLORS_HEX.success);
            drawRing(COLORS.success, 1);
            this.tweens.add({ targets: arrow, x: w / 2 - 22, duration: 180, ease: 'Sine.out' });
        });
        btn.on('pointerout', () => {
            bg.setFillStyle(COLORS.surface, 0.85);
            bg.setStrokeStyle(1, COLORS.border);
            label.setColor(COLORS_HEX.text);
            drawRing(COLORS.success, 0.7);
            this.tweens.add({ targets: arrow, x: w / 2 - 28, duration: 180, ease: 'Sine.out' });
        });
        btn.on('pointerdown', () => this.startConsulta());

        // Subtle pulse to draw attention
        this.tweens.add({
            targets: btn,
            scaleX: { from: 1, to: 1.02 },
            scaleY: { from: 1, to: 1.02 },
            duration: 1400,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.inOut',
        });

        // Hint below the button
        this.add
            .text(cx, by + 50, 'un paciente · cuatro fases · un solo expediente', {
                ...TYPE.label,
                fontSize: '10px',
                color: COLORS_HEX.textDim,
            })
            .setOrigin(0.5)
            .setLetterSpacing(2.4);
    }

    private startConsulta() {
        GameState.startNewCase(0);
        this.cameras.main.fadeOut(280, 7, 14, 24);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start(SCENES.CONSULTA);
        });
    }

    // ─── footer ──────────────────────────────────────────────
    private drawFooter() {
        const m = 60;
        const gutterY = GAME_HEIGHT - m + 14;

        this.add
            .text(m + 16, gutterY, 'PAPA’S TRAUMA STATION  /  ER EDITION', {
                ...TYPE.label,
                fontSize: '10px',
                color: COLORS_HEX.textDim,
            })
            .setOrigin(0, 0)
            .setLetterSpacing(2.4);

        this.add
            .text(GAME_WIDTH / 2, gutterY, '·  un proyecto editorial-quirúrgico  ·', {
                ...TYPE.bodyS,
                fontSize: '10px',
                color: COLORS_HEX.textDim,
                fontStyle: 'italic',
            })
            .setOrigin(0.5, 0);

        this.add
            .text(GAME_WIDTH - m - 16, gutterY, 'PRESS  ·  ENTER', {
                ...TYPE.mono,
                fontSize: '10px',
                color: COLORS_HEX.textDim,
            })
            .setOrigin(1, 0);

        // Enter key shortcut
        if (this.input.keyboard) {
            this.input.keyboard.once('keydown-ENTER', () => this.startConsulta());
            this.input.keyboard.once('keydown-SPACE', () => this.startConsulta());
        }
    }

    // ─── entrance animation ──────────────────────────────────
    private playEntrance() {
        this.cameras.main.fadeIn(360, 7, 14, 24);

        // Stagger fade-up of children added so far
        const all = this.children.list as GameObjects.GameObject[];
        all.forEach((child, i) => {
            const c = child as GameObjects.Components.Alpha & GameObjects.GameObject;
            if (typeof c.setAlpha !== 'function') return;
            c.setAlpha(0);
            this.tweens.add({
                targets: c,
                alpha: 1,
                duration: 360,
                delay: 80 + i * 6,
                ease: 'Sine.out',
            });
        });
    }
}
