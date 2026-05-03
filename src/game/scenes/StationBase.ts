import { GameObjects, Scene } from 'phaser';
import { COLORS, COLORS_HEX, FONTS, TYPE } from '../config/theme';
import { EVENTS, GAME_HEIGHT, GAME_WIDTH, SCENES, STATION_ORDER } from '../config/constants';
import { EventBus } from '../EventBus';
import { GameState } from '../state/GameState';

const STATION_LABELS: Record<string, string> = {
    [SCENES.STATION_1]: 'Recepción del paciente',
    [SCENES.STATION_2]: 'Exploración física',
    [SCENES.STATION_3]: 'Sellado diagnóstico',
    [SCENES.STATION_4]: 'Prescripción y destino',
};

const STATION_SHORT: Record<string, string> = {
    [SCENES.STATION_1]: 'RECEPCIÓN',
    [SCENES.STATION_2]: 'EXPLORACIÓN',
    [SCENES.STATION_3]: 'SELLADO',
    [SCENES.STATION_4]: 'PRESCRIPCIÓN',
};

export abstract class StationBase extends Scene {
    /** Legacy display label (subclasses still set it; we no longer rely on it). */
    protected stationTitle = '';
    protected nextSceneKey: string | null = null;
    protected nextLabel = 'CONTINUAR';
    protected nextButton?: { setEnabled: (b: boolean) => void };

    create() {
        this.cameras.main.setBackgroundColor(COLORS.bgDeep);
        this.drawAtmosphere();
        this.drawChromeFrame();
        this.drawHeader();
        this.buildStation();
        this.drawFooter();
        this.cameras.main.fadeIn(280, 7, 14, 24);
        EventBus.emit(EVENTS.CURRENT_SCENE_READY, this);
    }

    protected abstract buildStation(): void;

    // ─── atmosphere ─────────────────────────────────────────
    private drawAtmosphere() {
        const g = this.add.graphics();
        g.fillGradientStyle(COLORS.bgDeep, COLORS.bgDeep, COLORS.bg, COLORS.bg, 1);
        g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        const glow = this.add.graphics();
        glow.fillStyle(COLORS.success, 0.035);
        glow.fillCircle(GAME_WIDTH * 0.15, -100, 480);
    }

    // ─── chrome frame ───────────────────────────────────────
    private drawChromeFrame() {
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
    }

    // ─── header (40..132, content starts at y=140) ──────────
    private drawHeader() {
        const m = 40;
        const cx = GAME_WIDTH / 2;

        // Brand strip ABOVE margin (mono, small)
        this.add
            .text(m + 16, m - 22, 'TS / ER · v0.3', {
                ...TYPE.mono,
                fontSize: '11px',
                color: COLORS_HEX.textMuted,
            })
            .setOrigin(0, 1);

        const caso = GameState.getCaso();
        const meta = caso
            ? `EXP. ${caso.id.toString().padStart(3, '0')}  ·  ${caso.paciente.nombre.toUpperCase()}  ·  ${caso.paciente.ocupacion.toUpperCase()}`
            : 'SIN EXPEDIENTE CARGADO';
        this.add
            .text(GAME_WIDTH - m - 16, m - 22, meta, {
                ...TYPE.label,
                fontSize: '11px',
                color: COLORS_HEX.textMuted,
            })
            .setOrigin(1, 1);

        const { num, name } = this.parseStation();
        const total = STATION_ORDER.length.toString().padStart(2, '0');

        // Eyebrow centered
        this.add
            .text(cx, 56, `ESTACIÓN  ${num}  /  ${total}`, {
                ...TYPE.label,
                fontSize: '11px',
                color: COLORS_HEX.success,
            })
            .setOrigin(0.5, 0);

        // Serif title centered
        this.add
            .text(cx, 74, name, {
                fontFamily: FONTS.display,
                fontSize: '32px',
                color: COLORS_HEX.text,
                fontStyle: '600',
            })
            .setOrigin(0.5, 0);

        // Compact step indicator centered below title
        this.drawStepIndicator(cx, 122);

        // Bottom rule of header band
        const rule = this.add.graphics();
        rule.lineStyle(1, COLORS.borderSoft, 1);
        rule.lineBetween(m, 132, GAME_WIDTH - m, 132);
    }

    private parseStation(): { num: string; name: string } {
        const idx = STATION_ORDER.indexOf(this.scene.key as typeof STATION_ORDER[number]);
        const num = idx >= 0 ? (idx + 1).toString().padStart(2, '0') : '--';
        const name = STATION_LABELS[this.scene.key] ?? this.stationTitle ?? '';
        return { num, name };
    }

    // ─── step indicator: centered horizontal map ───────────
    private drawStepIndicator(cx: number, y: number) {
        const idx = STATION_ORDER.indexOf(this.scene.key as typeof STATION_ORDER[number]);
        if (idx < 0) return;

        const cellW = 132;
        const totalW = STATION_ORDER.length * cellW;
        const startX = cx - totalW / 2;

        STATION_ORDER.forEach((key, i) => {
            const x = startX + i * cellW + cellW / 2;
            const active = i === idx;
            const past = i < idx;
            const future = i > idx;

            const numColor = active
                ? COLORS_HEX.success
                : past
                    ? COLORS_HEX.text
                    : COLORS_HEX.textDim;
            const labelColor = future ? COLORS_HEX.textDim : COLORS_HEX.textMuted;

            // Numeral + dot prefix
            this.add
                .text(x - 22, y, (i + 1).toString().padStart(2, '0'), {
                    ...TYPE.mono,
                    fontSize: '11px',
                    color: numColor,
                    fontStyle: active ? '500' : '400',
                })
                .setOrigin(0, 0.5);

            // Label
            this.add
                .text(x, y, STATION_SHORT[key] ?? '', {
                    ...TYPE.label,
                    fontSize: '10px',
                    color: labelColor,
                })
                .setOrigin(0, 0.5);

            // Underline
            const ulW = 84;
            const ulColor = active ? COLORS.success : past ? COLORS.borderSoft : COLORS.borderSoft;
            const ulAlpha = active ? 1 : past ? 0.9 : 0.4;
            this.add
                .rectangle(x - 26, y + 12, ulW, active ? 2 : 1, ulColor, ulAlpha)
                .setOrigin(0, 0);

            // Connector tick to next
            if (i < STATION_ORDER.length - 1) {
                this.add
                    .text(x + ulW - 30, y, '·', {
                        fontFamily: FONTS.mono,
                        fontSize: '14px',
                        color: COLORS_HEX.textDim,
                    })
                    .setOrigin(0.5);
            }
        });
    }

    // ─── footer (lives in the bottom gutter below chrome) ──
    private drawFooter() {
        const m = 40;
        const gutterY = GAME_HEIGHT - m + 14; // baseline for gutter content

        // Brand mono left
        this.add
            .text(m + 16, gutterY, 'PAPA’S TRAUMA STATION  /  ER EDITION', {
                ...TYPE.label,
                fontSize: '10px',
                color: COLORS_HEX.textDim,
            })
            .setOrigin(0, 0);

        // Center: dotted leader + tiny status
        this.add
            .text(GAME_WIDTH / 2, gutterY, this.footerStatus(), {
                ...TYPE.mono,
                fontSize: '10px',
                color: COLORS_HEX.textMuted,
            })
            .setOrigin(0.5, 0);

        if (!this.nextSceneKey) return;
        this.drawContinueButton();
    }

    private footerStatus(): string {
        const caso = GameState.getCaso();
        const ticket = GameState.getTicket();
        if (!caso || !ticket) return '— · — · — · —';
        const f = `${ticket.factoresSeleccionados.length}/${caso.factoresRiesgo.length}`;
        const m = `${ticket.maniobrasRealizadas.length}/${caso.maniobras.length}`;
        const d = ticket.diagnosticoSellado ? 'OK' : '—';
        const p = ticket.farmacoSeleccionado ? 'OK' : '—';
        return `FACT  ${f}   ·   MAN  ${m}   ·   DX  ${d}   ·   RX  ${p}`;
    }

    // ─── Continue button (gutter, bottom-right) ────────────
    private drawContinueButton() {
        const m = 40;
        const w = 220;
        const h = 36;
        const x = GAME_WIDTH - m - 16 - w; // left edge
        const y = GAME_HEIGHT - m + 4;     // top edge — sits in the bottom gutter

        const container = this.add.container(x, y);

        // Subtle fill
        const bg = this.add
            .rectangle(0, 0, w, h, COLORS.surface, 0.6)
            .setOrigin(0, 0);
        container.add(bg);

        // Thin border
        const border = this.add.graphics();
        border.lineStyle(1, COLORS.border, 1);
        border.strokeRect(0, 0, w, h);
        container.add(border);

        // Corner ticks (turquoise)
        const ticks = this.add.graphics();
        const drawTicks = (color: number, alpha = 1) => {
            ticks.clear();
            ticks.lineStyle(1, color, alpha);
            const t = 8;
            ticks.lineBetween(0, 0, t, 0);
            ticks.lineBetween(0, 0, 0, t);
            ticks.lineBetween(w, 0, w - t, 0);
            ticks.lineBetween(w, 0, w, t);
            ticks.lineBetween(0, h, t, h);
            ticks.lineBetween(0, h, 0, h - t);
            ticks.lineBetween(w, h, w - t, h);
            ticks.lineBetween(w, h, w, h - t);
        };
        drawTicks(COLORS.success, 0.7);
        container.add(ticks);

        // Label + arrow
        const label = this.add
            .text(24, h / 2, this.nextLabel, {
                ...TYPE.label,
                fontSize: '13px',
                color: COLORS_HEX.text,
            })
            .setOrigin(0, 0.5);
        container.add(label);

        const arrow = this.add
            .text(w - 24, h / 2, '→', {
                fontFamily: FONTS.mono,
                fontSize: '22px',
                color: COLORS_HEX.success,
                fontStyle: '300',
            })
            .setOrigin(1, 0.5);
        container.add(arrow);

        // Internal hairline between label and arrow
        const sep = this.add
            .rectangle(w - 60, 14, 1, h - 28, COLORS.borderSoft)
            .setOrigin(0, 0);
        container.add(sep);

        // Hit
        const hit = this.add
            .rectangle(0, 0, w, h, 0xffffff, 0.0001)
            .setOrigin(0, 0)
            .setInteractive({ useHandCursor: true });
        container.add(hit);

        hit.on('pointerover', () => {
            bg.setFillStyle(COLORS.surfaceAlt, 0.95);
            border.clear();
            border.lineStyle(1, COLORS.success, 1);
            border.strokeRect(0, 0, w, h);
            label.setColor(COLORS_HEX.success);
            this.tweens.add({ targets: arrow, x: w - 18, duration: 180, ease: 'Sine.out' });
        });
        hit.on('pointerout', () => {
            bg.setFillStyle(COLORS.surface, 0.6);
            border.clear();
            border.lineStyle(1, COLORS.border, 1);
            border.strokeRect(0, 0, w, h);
            label.setColor(COLORS_HEX.text);
            this.tweens.add({ targets: arrow, x: w - 24, duration: 180, ease: 'Sine.out' });
        });
        hit.on('pointerdown', () => {
            this.cameras.main.fadeOut(220, 7, 14, 24);
            this.cameras.main.once('camerafadeoutcomplete', () =>
                this.scene.start(this.nextSceneKey!),
            );
        });

        this.nextButton = {
            setEnabled: (b: boolean) => {
                container.setAlpha(b ? 1 : 0.35);
                if (b) hit.setInteractive({ useHandCursor: true });
                else hit.disableInteractive();
            },
        };
    }
}
