import { GameObjects } from 'phaser';
import { COLORS, COLORS_HEX, FONTS, TYPE } from '../config/theme';
import { GameState } from '../state/GameState';
import { PhaseHandler } from './PhaseHandler';
import { BANDEJA_X, BANDEJA_Y, BANDEJA_W } from '../scenes/ConsultaScene';

interface FarmacoSpec {
    id: 'naproxeno' | 'meloxicam' | 'ibuprofeno' | 'corticoide';
    nombre: string;
    dosis: string;
    tipo: 'AINE' | 'INYECCIÓN';
    accent: number;
    accentHex: string;
}

const FARMACOS: ReadonlyArray<FarmacoSpec> = [
    { id: 'naproxeno', nombre: 'NAPROXENO', dosis: '500 mg', tipo: 'AINE', accent: 0x4a90e2, accentHex: '#4a90e2' },
    { id: 'meloxicam', nombre: 'MELOXICAM', dosis: '15 mg', tipo: 'AINE', accent: 0x60c0d8, accentHex: '#60c0d8' },
    { id: 'ibuprofeno', nombre: 'IBUPROFENO', dosis: '400 mg', tipo: 'AINE', accent: 0xf5a623, accentHex: '#f5a623' },
    { id: 'corticoide', nombre: 'CORTICOIDES', dosis: 'inyec.', tipo: 'INYECCIÓN', accent: 0xe74c5e, accentHex: '#e74c5e' },
] as const;
type FarmacoId = FarmacoSpec['id'];

const TARGET_LO = 0.55;
const TARGET_HI = 0.85;

export class PrescripcionPhase extends PhaseHandler {
    private selectedFarmaco: FarmacoId | null = null;
    private dosePrecision = 0;
    private holding = false;
    private fillStart = 0;
    private fillFraction = 0;
    private filling = false;
    private destinoSent = false;

    private fillBar!: GameObjects.Rectangle;
    private fillLabel!: GameObjects.Text;
    private hintText!: GameObjects.Text;
    private updateHandler?: () => void;
    private farmacoButtons: Array<{ bg: GameObjects.Rectangle; id: FarmacoId; setActive: () => void }> = [];

    private fillBarStartX = 0;
    private fillBarMaxW = 0;

    phaseId(): 'prescripcion' {
        return 'prescripcion';
    }

    phaseLabel(): string {
        return '04  ·  PRESCRIPCIÓN Y DESTINO';
    }

    phaseHint(): string {
        return 'fármaco → dosis → destino';
    }

    isComplete(): boolean {
        return this.destinoSent;
    }

    build() {
        this.buildDispenserAux();
        this.buildBandeja();

        this.updateHandler = () => this.tick();
        this.scene.events.on('update', this.updateHandler);
    }

    cleanup() {
        if (this.updateHandler) {
            this.scene.events.off('update', this.updateHandler);
            this.updateHandler = undefined;
        }
        super.cleanup();
        this.farmacoButtons = [];
    }

    private tick() {
        if (!this.filling) return;
        const elapsed = (this.scene.time.now - this.fillStart) / 2200;
        this.fillFraction = Math.min(1, elapsed);
        this.fillBar.width = 4 + (this.fillBarMaxW - 4) * this.fillFraction;
        if (this.fillFraction > TARGET_HI) {
            this.fillBar.setFillStyle(COLORS.danger);
        } else if (this.fillFraction >= TARGET_LO) {
            this.fillBar.setFillStyle(COLORS.success);
        }
    }

    // ─── Aux: dispenser (medication boxes) ─────────────────
    private buildDispenserAux() {
        const x = BANDEJA_X;
        const y = BANDEJA_Y;
        const w = BANDEJA_W;
        const h = 200;

        // Frame
        const card = this.scene.add.graphics();
        card.fillStyle(COLORS.bgDeep, 0.55);
        card.fillRoundedRect(x, y, w, h, 8);
        card.lineStyle(1, COLORS.borderSoft, 0.6);
        card.strokeRoundedRect(x, y, w, h, 8);
        this.aux.add(card);

        // Eyebrow
        this.aux.add(
            this.scene.add
                .text(x + 16, y + 12, 'CAJAS DE MEDICAMENTO  ·  SELECCIONA UNO', {
                    ...TYPE.label,
                    fontSize: '10px',
                    color: COLORS_HEX.success,
                })
                .setOrigin(0, 0)
                .setLetterSpacing(2.4),
        );

        // Layout 4 boxes in a row
        const cols = 4;
        const padX = 16;
        const gap = 10;
        const innerW = w - padX * 2;
        const colW = (innerW - gap * (cols - 1)) / cols;
        FARMACOS.forEach((f, i) => {
            const bx = x + padX + i * (colW + gap);
            const by = y + 36;
            this.makeFarmacoBox(bx, by, colW, h - 50, f);
        });
    }

    private makeFarmacoBox(x: number, y: number, w: number, h: number, spec: FarmacoSpec) {
        const cont = this.scene.add.container(x, y);

        // Card body — paper-cream feel (medication box)
        const body = this.scene.add
            .rectangle(0, 0, w, h, COLORS.paper, 0.96)
            .setOrigin(0, 0)
            .setStrokeStyle(1, 0xc9bfa6);

        // Top accent bar — color brand of the drug
        const accentTop = this.scene.add
            .rectangle(0, 0, w, 6, spec.accent)
            .setOrigin(0, 0);

        // Vertical stripes (printed-on-cardboard look)
        const stripes = this.scene.add.graphics();
        stripes.fillStyle(spec.accent, 0.08);
        for (let i = 0; i < 3; i++) {
            stripes.fillRect(8 + i * 8, 14, 2, h - 22);
        }

        // Brand area (top): "TX-PHARMA" pseudo-logo line
        const brand = this.scene.add
            .text(w / 2, 14, 'TX · PHARMA', {
                ...TYPE.label,
                fontSize: '8px',
                color: '#9a9080',
            })
            .setOrigin(0.5, 0)
            .setLetterSpacing(2.2);

        // Type chip ("AINE" / "INYECCIÓN")
        const tipoBgW = w - 24;
        const tipoBg = this.scene.add
            .rectangle(12, 30, tipoBgW, 14, spec.accent, 0.18)
            .setOrigin(0, 0);
        const tipoText = this.scene.add
            .text(w / 2, 37, spec.tipo, {
                ...TYPE.label,
                fontSize: '9px',
                color: spec.accentHex,
            })
            .setOrigin(0.5)
            .setLetterSpacing(2.4);

        // Drug visual (mini blister of pills, or syringe for injection)
        const visualY = 60;
        const visualG = this.scene.add.graphics();
        if (spec.tipo === 'INYECCIÓN') {
            // Mini syringe
            const sx = w / 2 - 28;
            const sy = visualY + 18;
            visualG.lineStyle(2, COLORS.ink, 0.85);
            visualG.fillStyle(0xe8e0c8, 1);
            // barrel
            visualG.fillRoundedRect(sx, sy, 50, 12, 3);
            visualG.strokeRoundedRect(sx, sy, 50, 12, 3);
            // plunger
            visualG.fillStyle(spec.accent, 1);
            visualG.fillRect(sx - 10, sy + 1, 12, 10);
            // needle
            visualG.lineStyle(2, COLORS.ink, 0.85);
            visualG.lineBetween(sx + 50, sy + 6, sx + 70, sy + 6);
            // liquid
            visualG.fillStyle(spec.accent, 0.25);
            visualG.fillRect(sx + 4, sy + 2, 40, 8);
        } else {
            // Pill blister — 2 rows × 4 pills
            const pillW = 12;
            const pillH = 8;
            const gx = w / 2 - (pillW * 4 + 6) / 2;
            const gy = visualY + 6;
            visualG.fillStyle(0xd6cdb4, 1);
            visualG.fillRoundedRect(gx - 4, gy - 4, pillW * 4 + 14, pillH * 2 + 12, 3);
            visualG.lineStyle(1, 0xb8a988, 1);
            visualG.strokeRoundedRect(gx - 4, gy - 4, pillW * 4 + 14, pillH * 2 + 12, 3);
            for (let r = 0; r < 2; r++) {
                for (let c = 0; c < 4; c++) {
                    const px = gx + c * (pillW + 1);
                    const py = gy + r * (pillH + 2);
                    visualG.fillStyle(spec.accent, 0.85);
                    visualG.fillEllipse(px + pillW / 2, py + pillH / 2, pillW - 2, pillH - 2);
                    visualG.lineStyle(1, COLORS.ink, 0.4);
                    visualG.strokeEllipse(px + pillW / 2, py + pillH / 2, pillW - 2, pillH - 2);
                }
            }
        }

        // Drug name
        const name = this.scene.add
            .text(w / 2, h - 38, spec.nombre, {
                fontFamily: FONTS.display,
                fontSize: '13px',
                color: COLORS_HEX.ink,
                fontStyle: '600',
            })
            .setOrigin(0.5);

        // Dose
        const dose = this.scene.add
            .text(w / 2, h - 22, spec.dosis, {
                ...TYPE.mono,
                fontSize: '11px',
                color: '#7a8294',
            })
            .setOrigin(0.5);

        // Bottom accent bar
        const accentBot = this.scene.add
            .rectangle(0, h - 4, w, 4, spec.accent, 0.6)
            .setOrigin(0, 0);

        cont.add([body, accentTop, stripes, brand, tipoBg, tipoText, visualG, name, dose, accentBot]);
        cont.setSize(w, h);
        cont.setInteractive({ useHandCursor: true });

        cont.on('pointerover', () => {
            if (this.selectedFarmaco === spec.id) return;
            body.setStrokeStyle(2, spec.accent);
            this.scene.tweens.add({ targets: cont, y: y - 4, duration: 140, ease: 'Sine.out' });
        });
        cont.on('pointerout', () => {
            if (this.selectedFarmaco === spec.id) return;
            body.setStrokeStyle(1, 0xc9bfa6);
            this.scene.tweens.add({ targets: cont, y, duration: 140, ease: 'Sine.out' });
        });
        cont.on('pointerdown', () => this.selectFarmaco(spec.id));

        const setActive = () => {
            body.setStrokeStyle(3, spec.accent);
            tipoBg.setFillStyle(spec.accent, 0.4);
            this.scene.tweens.add({ targets: cont, y: y - 6, duration: 160, ease: 'Sine.out' });
        };

        this.aux.add(cont);
        // Keep a ref to body as the visual "bg" for the active state hook
        this.farmacoButtons.push({ bg: body as unknown as GameObjects.Rectangle, id: spec.id, setActive });
    }

    private selectFarmaco(id: FarmacoId) {
        if (this.destinoSent) return;
        this.selectedFarmaco = id;
        this.farmacoButtons.forEach(b => {
            if (b.id === id) {
                b.setActive();
            } else {
                // Reset look on non-selected boxes
                b.bg.setStrokeStyle(1, 0xc9bfa6);
                const parent = (b.bg as unknown as { parentContainer: GameObjects.Container }).parentContainer;
                if (parent) {
                    this.scene.tweens.add({ targets: parent, y: parent.y, duration: 120 });
                }
            }
        });
        this.hintText.setText('mantén pulsada la barra para dosificar (objetivo: zona verde)');
    }

    // ─── Bandeja: dose meter + destinos ────────────────────
    private buildBandeja() {
        const x = BANDEJA_X;
        const y = BANDEJA_Y + 214;
        const w = BANDEJA_W;

        // Eyebrow + status
        this.bandeja.add(
            this.scene.add
                .text(x, y, 'DOSIS  ·  7–14 DÍAS', {
                    ...TYPE.label,
                    fontSize: '10px',
                    color: COLORS_HEX.textDim,
                })
                .setOrigin(0, 0)
                .setLetterSpacing(2.4),
        );

        // Dose meter bar
        const bx = x;
        const by = y + 24;
        const bw = w;
        const bh = 22;

        this.fillBarStartX = bx;
        this.fillBarMaxW = bw;

        this.bandeja.add(
            this.scene.add
                .rectangle(bx, by, bw, bh, COLORS.bgDeep, 0.85)
                .setOrigin(0, 0)
                .setStrokeStyle(1, COLORS.border),
        );
        // Target zone
        const tlo = bx + bw * TARGET_LO;
        const thi = bx + bw * TARGET_HI;
        this.bandeja.add(
            this.scene.add
                .rectangle(tlo, by, thi - tlo, bh, COLORS.success, 0.3)
                .setOrigin(0, 0)
                .setStrokeStyle(1, COLORS.success, 0.7),
        );
        // Fill bar
        this.fillBar = this.scene.add
            .rectangle(bx, by, 4, bh, COLORS.warning)
            .setOrigin(0, 0);
        this.bandeja.add(this.fillBar);

        // Hold-to-fill button
        const btnY = by + bh + 8;
        const btnH = 26;
        const btn = this.scene.add
            .rectangle(bx, btnY, bw, btnH, COLORS.surfaceHi, 0.92)
            .setOrigin(0, 0)
            .setStrokeStyle(1, COLORS.border)
            .setInteractive({ useHandCursor: true });
        this.bandeja.add(btn);

        this.fillLabel = this.scene.add
            .text(bx + bw / 2, btnY + btnH / 2, 'MANTÉN PULSADO PARA LLENAR', {
                ...TYPE.label,
                fontSize: '11px',
                color: COLORS_HEX.text,
            })
            .setOrigin(0.5)
            .setLetterSpacing(2);
        this.bandeja.add(this.fillLabel);

        btn.on('pointerdown', () => this.startFilling());
        btn.on('pointerup', () => this.stopFilling());
        btn.on('pointerout', () => {
            if (this.holding) this.stopFilling();
        });

        // Hint line
        this.hintText = this.scene.add
            .text(x, btnY + btnH + 14, 'selecciona un fármaco para empezar', {
                ...TYPE.bodyS,
                fontSize: '11px',
                color: COLORS_HEX.textDim,
                fontStyle: 'italic',
            })
            .setOrigin(0, 0);
        this.bandeja.add(this.hintText);

        // Destino buttons
        const destY = btnY + btnH + 50;
        const halfGap = 12;
        const halfW = (w - halfGap) / 2;
        const destH = 56;
        this.makeDestino(bx, destY, halfW, destH, 'A', 'CONSERVADOR', 'fisioterapia · 1er nivel', COLORS.success, 'conservador');
        this.makeDestino(bx + halfW + halfGap, destY, halfW, destH, 'B', 'URGENTE', 'ortopedia · 2do nivel', COLORS.danger, 'urgente');
    }

    private makeDestino(
        x: number,
        y: number,
        w: number,
        h: number,
        letra: string,
        title: string,
        sub: string,
        color: number,
        destino: 'conservador' | 'urgente',
    ) {
        const bg = this.scene.add
            .rectangle(x, y, w, h, COLORS.surface, 0.85)
            .setOrigin(0, 0)
            .setStrokeStyle(1, COLORS.border)
            .setInteractive({ useHandCursor: true });
        const badge = this.scene.add.circle(x + 26, y + h / 2, 16, color);
        const letter = this.scene.add
            .text(x + 26, y + h / 2, letra, {
                fontFamily: TYPE.h3.fontFamily,
                fontSize: '14px',
                color: COLORS_HEX.bgDeep,
                fontStyle: '600',
            })
            .setOrigin(0.5);
        const t = this.scene.add
            .text(x + 50, y + 12, title, {
                ...TYPE.label,
                fontSize: '11px',
                color: COLORS_HEX.text,
            })
            .setOrigin(0, 0)
            .setLetterSpacing(2.2);
        const s = this.scene.add
            .text(x + 50, y + 30, sub, {
                ...TYPE.bodyS,
                fontSize: '11px',
                color: COLORS_HEX.textMuted,
                fontStyle: 'italic',
            })
            .setOrigin(0, 0);

        bg.on('pointerover', () => bg.setStrokeStyle(2, color));
        bg.on('pointerout', () => bg.setStrokeStyle(1, COLORS.border));
        bg.on('pointerdown', () => this.sendToDestino(destino));

        this.bandeja.add([bg, badge, letter, t, s]);
    }

    private startFilling() {
        if (!this.selectedFarmaco || this.destinoSent) return;
        if (this.dosePrecision > 0) return;
        this.holding = true;
        this.filling = true;
        this.fillStart = this.scene.time.now;
        this.fillFraction = 0;
        this.fillLabel.setText('LLENANDO…');
    }

    private stopFilling() {
        if (!this.holding) return;
        this.holding = false;
        this.filling = false;

        const f = this.fillFraction;
        let precision = 0;
        if (f >= TARGET_LO && f <= TARGET_HI) {
            const center = (TARGET_LO + TARGET_HI) / 2;
            const half = (TARGET_HI - TARGET_LO) / 2;
            precision = 1 - Math.abs(f - center) / half;
        }
        this.dosePrecision = precision;

        this.fillBar.setFillStyle(precision > 0 ? COLORS.success : COLORS.danger);
        this.fillLabel.setText(
            precision > 0
                ? `dosis correcta — ${Math.round(precision * 100)}% de precisión`
                : 'dosis fuera de rango terapéutico',
        );

        if (precision === 0) {
            this.scene.time.delayedCall(900, () => {
                if (this.destinoSent) return;
                this.fillFraction = 0;
                this.fillBar.width = 4;
                this.fillBar.setFillStyle(COLORS.warning);
                this.fillLabel.setText('MANTÉN PULSADO PARA LLENAR');
            });
        } else {
            this.hintText.setText('elige el destino del paciente');
        }
        void this.fillBarStartX;
    }

    private sendToDestino(destino: 'conservador' | 'urgente') {
        if (this.destinoSent) return;
        if (!this.selectedFarmaco || this.dosePrecision === 0) {
            this.hintText
                .setText('selecciona un fármaco y dosifica antes de enviar')
                .setColor(COLORS_HEX.danger);
            return;
        }
        this.destinoSent = true;

        const farmacoNombre = FARMACOS.find(f => f.id === this.selectedFarmaco)!.nombre;
        GameState.setPrescripcion(farmacoNombre, this.dosePrecision, destino);
        this.expediente.setPrescripcion(
            `${farmacoNombre} · ${destino === 'urgente' ? 'Referencia urgente' : 'Manejo conservador'}`,
        );
        this.expediente.flashAccept();
        this.hintText
            .setText(`expediente enviado — ${destino === 'urgente' ? 'bandeja B (urgente)' : 'bandeja A (conservador)'}`)
            .setColor(COLORS_HEX.success);

        this.scene.refreshFooter();
        this.scene.time.delayedCall(720, () => this.onComplete());
    }
}
