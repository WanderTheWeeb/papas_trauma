import { GameObjects, Scene } from 'phaser';
import { EventBus } from '../EventBus';
import { COLORS, COLORS_HEX, FONTS, TYPE } from '../config/theme';
import { EVENTS, GAME_HEIGHT, GAME_WIDTH, SCENES } from '../config/constants';
import { CASOS_CLINICOS } from '../data/casos';
import { GameState } from '../state/GameState';

export class MainMenu extends Scene {
    constructor() {
        super(SCENES.MAIN_MENU);
    }

    create() {
        this.cameras.main.setBackgroundColor(COLORS.bgDeep);

        this.drawAtmosphere();
        this.drawChrome();
        this.drawLeftEditorial();
        this.drawRightCaseList();
        this.drawFooter();

        this.playEntrance();

        EventBus.emit(EVENTS.CURRENT_SCENE_READY, this);
    }

    // ─── background atmosphere ──────────────────────────────
    private drawAtmosphere() {
        // Vertical gradient
        const g = this.add.graphics();
        g.fillGradientStyle(COLORS.bgDeep, COLORS.bgDeep, COLORS.bg, COLORS.bg, 1);
        g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // Diffuse glow upper-left
        const glow = this.add.graphics();
        glow.fillStyle(COLORS.success, 0.05);
        glow.fillCircle(180, -120, 520);

        // Faint vignette bottom
        const vg = this.add.graphics();
        vg.fillStyle(0x000000, 0.35);
        vg.fillRect(0, GAME_HEIGHT - 240, GAME_WIDTH, 240);

        // Hairline grid (decorative — 4 vertical guides)
        const grid = this.add.graphics();
        grid.lineStyle(1, COLORS.borderSoft, 0.6);
        for (let i = 1; i < 4; i++) {
            const x = (GAME_WIDTH / 4) * i;
            grid.lineBetween(x, 60, x, GAME_HEIGHT - 60);
        }
    }

    // ─── outer chrome (margin, corner ticks) ───────────────
    private drawChrome() {
        const m = 60;

        // Top + bottom hairlines
        const lines = this.add.graphics();
        lines.lineStyle(1, COLORS.border, 1);
        lines.lineBetween(m, m, GAME_WIDTH - m, m);
        lines.lineBetween(m, GAME_HEIGHT - m, GAME_WIDTH - m, GAME_HEIGHT - m);

        // Corner ticks (subtle marks)
        const ticks = this.add.graphics();
        ticks.lineStyle(1, COLORS.success, 0.8);
        const t = 14;
        // tl
        ticks.lineBetween(m, m, m + t, m);
        ticks.lineBetween(m, m, m, m + t);
        // tr
        ticks.lineBetween(GAME_WIDTH - m, m, GAME_WIDTH - m - t, m);
        ticks.lineBetween(GAME_WIDTH - m, m, GAME_WIDTH - m, m + t);
        // bl
        ticks.lineBetween(m, GAME_HEIGHT - m, m + t, GAME_HEIGHT - m);
        ticks.lineBetween(m, GAME_HEIGHT - m, m, GAME_HEIGHT - m - t);
        // br
        ticks.lineBetween(GAME_WIDTH - m, GAME_HEIGHT - m, GAME_WIDTH - m - t, GAME_HEIGHT - m);
        ticks.lineBetween(GAME_WIDTH - m, GAME_HEIGHT - m, GAME_WIDTH - m, GAME_HEIGHT - m - t);

        // Top header band
        // Brand mark (top-left, mono)
        this.add
            .text(m + 16, m - 24, 'TS / ER · v0.3', {
                ...TYPE.mono,
                fontSize: '11px',
                color: COLORS_HEX.textMuted,
            })
            .setOrigin(0, 1);

        // Top-right meta
        this.add
            .text(GAME_WIDTH - m - 16, m - 24, 'ATENCIÓN PRIMARIA · MANGUITO ROTADOR', {
                ...TYPE.label,
                fontSize: '11px',
                color: COLORS_HEX.textMuted,
            })
            .setOrigin(1, 1);
    }

    // ─── left editorial column ─────────────────────────────
    private drawLeftEditorial() {
        const x = 100;
        const colW = 700;

        // Section eyebrow
        this.add
            .text(x, 160, 'EXPEDIENTE  /  EDICIÓN ER', {
                ...TYPE.labelHi,
                fontSize: '12px',
            })
            .setOrigin(0, 0);

        // Tiny accent rule under eyebrow
        this.add
            .rectangle(x, 184, 36, 2, COLORS.success)
            .setOrigin(0, 0);

        // Title — stacked, low line-height
        this.add
            .text(x, 220, 'Manguito', {
                ...TYPE.h1,
                fontSize: '142px',
                color: COLORS_HEX.text,
                fontStyle: '800',
            })
            .setOrigin(0, 0);

        this.add
            .text(x + 4, 360, 'Rotador.', {
                fontFamily: FONTS.display,
                fontSize: '142px',
                color: COLORS_HEX.success,
                fontStyle: '800italic',
            })
            .setOrigin(0, 0);

        // Italic kicker
        this.add
            .text(
                x,
                540,
                'Simulador clínico para atención primaria.\nOcho casos, cuatro estaciones por caso.',
                {
                    ...TYPE.body,
                    fontFamily: FONTS.body,
                    fontStyle: 'italic',
                    fontSize: '20px',
                    color: COLORS_HEX.textMuted,
                    lineSpacing: 6,
                },
            )
            .setOrigin(0, 0);

        // Source line
        const sourceY = 660;
        this.add
            .text(x, sourceY, 'FUENTES', {
                ...TYPE.label,
                fontSize: '10px',
            })
            .setOrigin(0, 0);

        this.add
            .text(x + 90, sourceY, '· · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · ·', {
                fontFamily: FONTS.mono,
                fontSize: '12px',
                color: COLORS_HEX.textDim,
            })
            .setOrigin(0, 0);

        this.add
            .text(x, sourceY + 22, 'AAFP · NEJM · JAMA · AAOS · GRASP TRIAL', {
                ...TYPE.mono,
                fontSize: '12px',
                color: COLORS_HEX.text,
            })
            .setOrigin(0, 0);

        // Vertical hairline divider between columns
        const div = this.add.graphics();
        div.lineStyle(1, COLORS.border, 1);
        div.lineBetween(x + colW + 100, 140, x + colW + 100, GAME_HEIGHT - 140);
    }

    // ─── right case list ───────────────────────────────────
    private drawRightCaseList() {
        const x = 920;
        const colW = 580;
        const top = 160;

        this.add
            .text(x, top, 'SELECCIONAR CASO', {
                ...TYPE.label,
                fontSize: '11px',
                color: COLORS_HEX.text,
            })
            .setOrigin(0, 0);

        this.add
            .text(x + colW, top, `${CASOS_CLINICOS.length.toString().padStart(2, '0')} REGISTROS`, {
                ...TYPE.mono,
                fontSize: '11px',
                color: COLORS_HEX.textMuted,
            })
            .setOrigin(1, 0);

        // Header rule
        const hr = this.add.graphics();
        hr.lineStyle(1, COLORS.border, 1);
        hr.lineBetween(x, top + 26, x + colW, top + 26);

        // Rows
        const rowH = 56;
        const startY = top + 40;
        CASOS_CLINICOS.forEach((c, i) => {
            this.makeCaseRow(x, startY + i * rowH, colW, rowH, i, c.paciente.nombre, c.paciente.ocupacion);
        });

        // Footer rule for the list
        const fr = this.add.graphics();
        fr.lineStyle(1, COLORS.border, 1);
        fr.lineBetween(x, startY + CASOS_CLINICOS.length * rowH + 4, x + colW, startY + CASOS_CLINICOS.length * rowH + 4);

        // Helper hint below list
        this.add
            .text(x, startY + CASOS_CLINICOS.length * rowH + 22, 'CLIC EN UNA FILA PARA INICIAR', {
                ...TYPE.label,
                fontSize: '10px',
                color: COLORS_HEX.textDim,
            })
            .setOrigin(0, 0);
    }

    private makeCaseRow(
        x: number,
        y: number,
        w: number,
        h: number,
        index: number,
        nombre: string,
        ocupacion: string,
    ) {
        const container = this.add.container(x, y);

        // Hover/active fill (initially transparent)
        const hoverFill = this.add
            .rectangle(0, 0, w, h - 4, COLORS.surface, 0)
            .setOrigin(0, 0);
        container.add(hoverFill);

        // Left accent bar (hidden by default)
        const accent = this.add.rectangle(0, 0, 3, h - 4, COLORS.success).setOrigin(0, 0).setAlpha(0);
        container.add(accent);

        // Number (mono)
        const num = this.add
            .text(20, h / 2 - 2, (index + 1).toString().padStart(2, '0'), {
                ...TYPE.monoLg,
                fontSize: '22px',
                color: COLORS_HEX.text,
                fontStyle: '300',
            })
            .setOrigin(0, 0.5);
        container.add(num);

        // Vertical hairline separator
        const sep = this.add.rectangle(64, 14, 1, h - 32, COLORS.border).setOrigin(0, 0);
        container.add(sep);

        // Patient name
        const name = this.add
            .text(80, 16, nombre, {
                fontFamily: FONTS.display,
                fontSize: '20px',
                color: COLORS_HEX.text,
                fontStyle: '600',
            })
            .setOrigin(0, 0);
        container.add(name);

        // Occupation
        const occ = this.add
            .text(80, h - 22, ocupacion.toUpperCase(), {
                ...TYPE.label,
                fontSize: '10px',
                color: COLORS_HEX.textMuted,
            })
            .setOrigin(0, 1);
        container.add(occ);

        // Right arrow (animates in on hover)
        const arrow = this.add
            .text(w - 20, h / 2 - 2, '>', {
                fontFamily: FONTS.mono,
                fontSize: '20px',
                color: COLORS_HEX.success,
                fontStyle: '300',
            })
            .setOrigin(1, 0.5)
            .setAlpha(0);
        container.add(arrow);

        // Bottom hairline (between rows)
        const rule = this.add
            .rectangle(0, h - 4, w, 1, COLORS.borderSoft)
            .setOrigin(0, 0);
        container.add(rule);

        // Hit area
        const hit = this.add
            .rectangle(0, 0, w, h - 4, 0xffffff, 0.0001)
            .setOrigin(0, 0)
            .setInteractive({ useHandCursor: true });
        container.add(hit);

        hit.on('pointerover', () => {
            hoverFill.setFillStyle(COLORS.surface).setAlpha(0.6);
            accent.setAlpha(1);
            this.tweens.add({ targets: arrow, alpha: 1, x: w - 20 + 6, duration: 180, ease: 'Sine.out' });
            num.setColor(COLORS_HEX.success);
        });
        hit.on('pointerout', () => {
            hoverFill.setAlpha(0);
            accent.setAlpha(0);
            this.tweens.add({ targets: arrow, alpha: 0, x: w - 20, duration: 180, ease: 'Sine.out' });
            num.setColor(COLORS_HEX.text);
        });
        hit.on('pointerdown', () => this.startCase(index));
    }

    // ─── footer ─────────────────────────────────────────────
    private drawFooter() {
        const m = 60;
        const y = GAME_HEIGHT - m + 24;

        this.add
            .text(m + 16, y, 'v0.3 · editorial pass', {
                ...TYPE.mono,
                fontSize: '10px',
                color: COLORS_HEX.textDim,
            })
            .setOrigin(0, 0);

        this.add
            .text(GAME_WIDTH / 2, y, 'PAPA ’ S  TRAUMA  STATION  /  ER  EDITION', {
                ...TYPE.label,
                fontSize: '10px',
                color: COLORS_HEX.textMuted,
            })
            .setOrigin(0.5, 0);

        this.add
            .text(GAME_WIDTH - m - 16, y, '1600 × 900', {
                ...TYPE.mono,
                fontSize: '10px',
                color: COLORS_HEX.textDim,
            })
            .setOrigin(1, 0);
    }

    // ─── entrance motion ───────────────────────────────────
    private playEntrance() {
        this.cameras.main.fadeIn(420, 7, 14, 24);
    }

    private startCase(index: number) {
        GameState.startNewCase(index);
        this.cameras.main.fadeOut(260, 7, 14, 24);
        this.cameras.main.once('camerafadeoutcomplete', () =>
            this.scene.start(SCENES.STATION_1),
        );
    }
}
