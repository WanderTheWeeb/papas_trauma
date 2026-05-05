import { GameObjects, Scene } from 'phaser';
import { COLORS, COLORS_HEX, FONTS, TYPE } from '../config/theme';
import { EVENTS, GAME_HEIGHT, GAME_WIDTH, SCENES } from '../config/constants';
import { EventBus } from '../EventBus';
import { GameState } from '../state/GameState';
import { Expediente, EXPEDIENTE_H } from '../objects/Expediente';
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

    constructor() {
        super(SCENES.CONSULTA);
    }

    create() {
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

        EventBus.emit(EVENTS.CURRENT_SCENE_READY, this);
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
            this.add
                .text(
                    GAME_WIDTH - m - 16,
                    m - 22,
                    `EXP. ${caso.id.toString().padStart(3, '0')}  ·  ${caso.paciente.nombre.toUpperCase()}  ·  ${caso.paciente.ocupacion.toUpperCase()}`,
                    { ...TYPE.label, fontSize: '11px', color: COLORS_HEX.textMuted },
                )
                .setOrigin(1, 1);
        }
    }

    private drawWindow(_motivo: string) {
        // Sans on the left
        const colX = 280;
        const baseY = COUNTER_Y - 10;

        const pedestal = this.add.graphics();
        pedestal.fillStyle(0x000000, 0.22);
        pedestal.fillEllipse(colX, baseY + 6, 220, 22);

        if (this.textures.exists('patient-sans')) {
            const sans = this.add.image(colX, baseY, 'patient-sans').setOrigin(0.5, 1);
            const tex = sans.texture.getSourceImage() as { width: number; height: number };
            const tw = tex.width || sans.width;
            const th = tex.height || sans.height;
            const maxW = 260;
            const maxH = 270;
            const scale = Math.min(maxW / tw, maxH / th);
            sans.setScale(scale);

            this.tweens.add({
                targets: sans,
                y: baseY - 4,
                duration: 1800,
                ease: 'Sine.inOut',
                yoyo: true,
                repeat: -1,
            });
        }

        const caso = GameState.getCaso();
        const motivo = caso?.motivo ?? '';

        const bx = 460;
        const by = 180;
        const bw = 700;
        const bh = 220;

        const bubble = this.add.graphics();
        bubble.fillStyle(COLORS.paper, 0.95);
        bubble.fillRoundedRect(bx, by, bw, bh, 12);
        bubble.lineStyle(1, 0xc9bfa6, 0.55);
        bubble.strokeRoundedRect(bx, by, bw, bh, 12);
        bubble.fillStyle(COLORS.paper, 0.95);
        bubble.fillTriangle(bx, by + 80, bx, by + 120, bx - 18, by + 100);

        this.add
            .text(bx + 24, by + 22, '— DICE EL PACIENTE', {
                ...TYPE.paperLabel,
                fontSize: '10px',
                color: '#9a9080',
            })
            .setOrigin(0, 0)
            .setLetterSpacing(2.4);

        this.add.rectangle(bx + 24, by + 42, 22, 1, 0xc9bfa6).setOrigin(0, 0);

        this.add
            .text(bx + 24, by + 56, '"' + motivo + '"', {
                fontFamily: FONTS.body,
                fontSize: '17px',
                color: COLORS_HEX.ink,
                fontStyle: 'italic',
                wordWrap: { width: bw - 48 },
                lineSpacing: 5,
            })
            .setOrigin(0, 0);
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
    private showEvaluation() {
        const score = GameState.evaluate();
        this.refreshFooter();

        const cx = GAME_WIDTH / 2;
        const cy = GAME_HEIGHT / 2;

        // Dim backdrop
        const dim = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0).setOrigin(0).setDepth(4000);
        this.tweens.add({ targets: dim, alpha: 0.55, duration: 320 });

        const overlay = this.add.container(cx, cy).setDepth(4001);
        const w = 720;
        const h = 480;
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

        // Rows
        const rows: Array<[string, number]> = [
            ['SÍNTOMAS / FACTORES', score.symptom],
            ['EXPLORACIÓN FÍSICA', score.testing],
            ['DIAGNÓSTICO', score.diagnostic],
            ['PRESCRIPCIÓN / DESTINO', score.prescription],
        ];

        rows.forEach(([label, val], i) => {
            const ry = -h / 2 + 240 + i * 32;
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

        mkBtn(0, 'VOLVER AL MENÚ', () => this.scene.start(SCENES.MAIN_MENU));

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

}
