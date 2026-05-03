import { GameObjects, Input } from 'phaser';
import { COLORS, COLORS_HEX, TYPE } from '../config/theme';
import { GAME_HEIGHT, GAME_WIDTH, SCENES } from '../config/constants';
import { MANIOBRAS_INFO } from '../data/casos';
import { GameState } from '../state/GameState';
import { Ticket, TICKET_H } from '../objects/Ticket';
import { StationBase } from './StationBase';

const FARMACOS = [
    { id: 'naproxeno', nombre: 'Naproxeno 500 mg', tipo: 'aine' },
    { id: 'meloxicam', nombre: 'Meloxicam 15 mg', tipo: 'aine' },
    { id: 'ibuprofeno', nombre: 'Ibuprofeno 400 mg', tipo: 'aine' },
    { id: 'corticoide', nombre: 'Inyección Corticoides', tipo: 'inyec' },
] as const;
type FarmacoId = (typeof FARMACOS)[number]['id'];

// ideal fill range = "7-14 días" → 0.55 .. 0.85 of bar
const TARGET_LO = 0.55;
const TARGET_HI = 0.85;

export class Station4_Therapy extends StationBase {
    private ticket!: Ticket;
    private selectedFarmaco: FarmacoId | null = null;
    private dosePrecision = 0;
    private holding = false;
    private fillStart = 0;
    private fillFraction = 0;
    private statusText!: GameObjects.Text;
    private fillBar!: GameObjects.Rectangle;
    private fillLabel!: GameObjects.Text;
    private filling = false;
    private trayHandlers: Array<() => void> = [];
    private destinoSent = false;

    constructor() {
        super(SCENES.STATION_4);
        this.stationTitle = '4 · Prescripción y Destino';
        this.nextSceneKey = SCENES.EVALUATION;
    }

    protected buildStation() {
        const caso = GameState.getCaso();
        if (!caso) return;

        // Replay ticket
        this.ticket = new Ticket(this, GAME_WIDTH - 270, 140 + TICKET_H / 2, caso);
        const t = GameState.getTicket();
        if (t) {
            t.factoresSeleccionados.forEach(f => this.ticket.addFactor(f));
            t.maniobrasRealizadas.forEach(m =>
                this.ticket.addManiobra(MANIOBRAS_INFO[m.id]?.nombre ?? m.id, m.resultado),
            );
            if (t.diagnosticoSellado) this.ticket.setDiagnostico(t.diagnosticoSellado);
        }

        this.drawDispenser();
        this.drawDoseMeter();
        this.drawDestinos();
        this.drawStatusBar();
    }

    private drawDispenser() {
        const x = 40;
        const y = 140;
        const w = 720;
        const h = 230;

        const card = this.add.graphics();
        card.fillStyle(COLORS.surface, 1);
        card.fillRoundedRect(x, y, w, h, 16);
        card.lineStyle(1, COLORS.border, 1);
        card.strokeRoundedRect(x, y, w, h, 16);

        this.add
            .text(x + 24, y + 22, 'DISPENSADOR DE FARMACIA', {
                ...TYPE.label,
                color: COLORS_HEX.success,
            })
            .setOrigin(0, 0);

        this.add
            .text(x + 24, y + 50, 'Selecciona el fármaco apropiado', {
                ...TYPE.bodyS,
                fontSize: '13px',
            })
            .setOrigin(0, 0);

        // 4 lever buttons
        const cols = 4;
        const colW = (w - 48) / cols;
        FARMACOS.forEach((f, i) => {
            const bx = x + 24 + colW * i + colW / 2;
            const by = y + 150;
            this.makeFarmacoLever(bx, by, colW - 12, f.id, f.nombre);
        });
    }

    private farmacoButtons: Array<{ bg: GameObjects.Rectangle; id: FarmacoId; setActive: () => void }> = [];

    private makeFarmacoLever(x: number, y: number, w: number, id: FarmacoId, nombre: string) {
        const h = 100;
        const bg = this.add
            .rectangle(x, y, w, h, COLORS.surfaceHi)
            .setStrokeStyle(2, COLORS.border)
            .setInteractive({ useHandCursor: true });

        // Bottle top
        const cap = this.add.rectangle(x, y - h / 2 + 8, 28, 12, COLORS.warning);
        // Bottle pill
        this.add.circle(x, y - 12, 14, COLORS.success);

        const label = this.add
            .text(x, y + 26, nombre, {
                ...TYPE.chip,
                fontSize: '12px',
                wordWrap: { width: w - 16 },
                align: 'center',
            })
            .setOrigin(0.5);

        bg.on('pointerover', () => {
            if (this.selectedFarmaco === id) return;
            bg.setStrokeStyle(2, COLORS.success);
        });
        bg.on('pointerout', () => {
            if (this.selectedFarmaco === id) return;
            bg.setStrokeStyle(2, COLORS.border);
        });
        bg.on('pointerdown', () => this.selectFarmaco(id));

        const setActive = () => {
            bg.setFillStyle(COLORS.successDim);
            bg.setStrokeStyle(3, COLORS.success);
            cap.setFillStyle(COLORS.success);
        };

        this.farmacoButtons.push({ bg, id, setActive });
    }

    private selectFarmaco(id: FarmacoId) {
        if (this.destinoSent) return;
        this.selectedFarmaco = id;
        this.farmacoButtons.forEach(b => {
            if (b.id === id) {
                b.setActive();
            } else {
                b.bg.setFillStyle(COLORS.surfaceHi);
                b.bg.setStrokeStyle(2, COLORS.border);
            }
        });
        this.statusText.setText('Mantén pulsada la barra para dosificar');
    }

    // ─── Dose meter ─────────────────────────────────────────
    private drawDoseMeter() {
        const x = 40;
        const y = 390;
        const w = 720;
        const h = 130;

        const card = this.add.graphics();
        card.fillStyle(COLORS.surface, 1);
        card.fillRoundedRect(x, y, w, h, 16);
        card.lineStyle(1, COLORS.border, 1);
        card.strokeRoundedRect(x, y, w, h, 16);

        this.add
            .text(x + 24, y + 18, 'DOSIS · 7–14 DÍAS', {
                ...TYPE.label,
                color: COLORS_HEX.success,
            })
            .setOrigin(0, 0);

        // Bar
        const bx = x + 24;
        const by = y + 60;
        const bw = w - 48;
        const bh = 28;

        this.add.rectangle(bx, by, bw, bh, COLORS.bgDeep).setOrigin(0, 0).setStrokeStyle(2, COLORS.border);

        // Target zone
        const tlo = bx + bw * TARGET_LO;
        const thi = bx + bw * TARGET_HI;
        this.add.rectangle(tlo, by, thi - tlo, bh, COLORS.success, 0.35).setOrigin(0, 0).setStrokeStyle(2, COLORS.success);

        // Fill bar
        this.fillBar = this.add.rectangle(bx, by, 4, bh, COLORS.warning).setOrigin(0, 0);

        // Hold-to-fill button
        const btnX = x + 24;
        const btnY = y + h - 28;
        const btnW = w - 48;
        const btnH = 28;
        const btn = this.add
            .rectangle(btnX, btnY, btnW, btnH, COLORS.surfaceHi)
            .setOrigin(0, 0)
            .setStrokeStyle(2, COLORS.border)
            .setInteractive({ useHandCursor: true });

        this.fillLabel = this.add
            .text(btnX + btnW / 2, btnY + btnH / 2, 'MANTÉN PULSADO PARA LLENAR', {
                ...TYPE.label,
                fontSize: '12px',
                color: COLORS_HEX.text,
            })
            .setOrigin(0.5);

        btn.on('pointerdown', () => this.startFilling());
        btn.on('pointerup', () => this.stopFilling());
        btn.on('pointerout', () => {
            if (this.holding) this.stopFilling();
        });
    }

    private startFilling() {
        if (!this.selectedFarmaco || this.destinoSent) return;
        if (this.dosePrecision > 0) return; // already set
        this.holding = true;
        this.filling = true;
        this.fillStart = this.time.now;
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
                ? `Dosis correcta — ${Math.round(precision * 100)}% de precisión`
                : 'Dosis fuera de rango terapéutico',
        );

        if (precision === 0) {
            // allow retry after a moment
            this.time.delayedCall(900, () => {
                this.fillFraction = 0;
                this.fillBar.width = 4;
                this.fillBar.setFillStyle(COLORS.warning);
                this.fillLabel.setText('MANTÉN PULSADO PARA LLENAR');
            });
        }
    }

    update() {
        if (this.filling) {
            const elapsed = (this.time.now - this.fillStart) / 2200;
            this.fillFraction = Math.min(1, elapsed);
            const bw = 720 - 48;
            const bx = 40 + 24;
            this.fillBar.width = 4 + (bw - 4) * this.fillFraction;
            // overshoot color hint
            if (this.fillFraction > TARGET_HI) {
                this.fillBar.setFillStyle(COLORS.danger);
            } else if (this.fillFraction >= TARGET_LO) {
                this.fillBar.setFillStyle(COLORS.success);
            }
            void bx;
        }
    }

    // ─── Destinos ───────────────────────────────────────────
    private drawDestinos() {
        const y = 560;
        const h = 100;
        const wHalf = 350;
        const gap = 20;
        const totalW = wHalf * 2 + gap;
        const x0 = 40 + (720 - totalW) / 2;

        this.makeDestino(x0, y, wHalf, h, 'A', 'Manejo conservador', 'Fisioterapia · primer nivel', COLORS.success, 'conservador');
        this.makeDestino(x0 + wHalf + gap, y, wHalf, h, 'B', 'Referencia urgente', 'Ortopedia · segundo nivel', COLORS.danger, 'urgente');
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
        const bg = this.add
            .rectangle(x, y, w, h, COLORS.surface)
            .setOrigin(0, 0)
            .setStrokeStyle(2, COLORS.border)
            .setInteractive({ useHandCursor: true });

        // Letter badge
        this.add.circle(x + 32, y + h / 2, 22, color).setStrokeStyle(0);
        this.add
            .text(x + 32, y + h / 2, letra, { ...TYPE.h3, fontSize: '20px', color: COLORS_HEX.bgDeep })
            .setOrigin(0.5);

        this.add.text(x + 70, y + 26, title, { ...TYPE.h4, fontSize: '17px' }).setOrigin(0, 0);
        this.add.text(x + 70, y + 56, sub, { ...TYPE.bodyS, fontSize: '13px' }).setOrigin(0, 0);

        const handler = () => this.sendToDestino(destino);
        bg.on('pointerdown', handler);
        bg.on('pointerover', () => bg.setStrokeStyle(2, color));
        bg.on('pointerout', () => bg.setStrokeStyle(2, COLORS.border));
        this.trayHandlers.push(handler);
    }

    private sendToDestino(destino: 'conservador' | 'urgente') {
        if (this.destinoSent) return;
        if (!this.selectedFarmaco || this.dosePrecision === 0) {
            this.statusText
                .setText('Selecciona fármaco y dosifica antes de enviar')
                .setColor(COLORS_HEX.danger);
            return;
        }
        this.destinoSent = true;
        const farmacoNombre = FARMACOS.find(f => f.id === this.selectedFarmaco)!.nombre;
        GameState.setPrescripcion(farmacoNombre, this.dosePrecision, destino);
        this.ticket.setPrescripcion(
            `${farmacoNombre} · ${destino === 'urgente' ? 'Referencia urgente' : 'Manejo conservador'}`,
        );
        this.statusText
            .setText(`Ticket enviado — ${destino === 'urgente' ? 'Bandeja B / urgente' : 'Bandeja A / conservador'}`)
            .setColor(COLORS_HEX.success);
    }

    private drawStatusBar() {
        const x = 40;
        const y = 690;
        const w = 720;
        const h = 50;

        const card = this.add.graphics();
        card.fillStyle(COLORS.surfaceAlt, 1);
        card.fillRoundedRect(x, y, w, h, 12);
        card.lineStyle(1, COLORS.border, 1);
        card.strokeRoundedRect(x, y, w, h, 12);

        this.statusText = this.add
            .text(x + 24, y + h / 2, 'Selecciona un fármaco para empezar', {
                ...TYPE.h4,
                fontSize: '14px',
                color: COLORS_HEX.warning,
            })
            .setOrigin(0, 0.5);
    }
}
