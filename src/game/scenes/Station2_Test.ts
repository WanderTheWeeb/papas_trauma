import { GameObjects, Geom, Input, Utils } from 'phaser';
import { COLORS, COLORS_HEX, TYPE } from '../config/theme';
import { GAME_HEIGHT, GAME_WIDTH, SCENES } from '../config/constants';
import { MANIOBRAS_INFO } from '../data/casos';
import { GameState } from '../state/GameState';
import { Ticket, TICKET_W, TICKET_H } from '../objects/Ticket';
import { TimingMeter } from '../objects/TimingMeter';
import { StationBase } from './StationBase';
import type { ManiobraId, ResultadoManiobra } from '../data/types';

interface ManiobraChip extends GameObjects.Container {
    maniobraId: ManiobraId;
    consumed: boolean;
    homeX: number;
    homeY: number;
    bg: GameObjects.Rectangle;
    returnHome: () => void;
    consume: () => void;
}

export class Station2_Test extends StationBase {
    private ticket!: Ticket;
    private chips: ManiobraChip[] = [];
    private statusText!: GameObjects.Text;
    private shoulderGraphics!: GameObjects.Graphics;
    private shoulderZone!: Geom.Rectangle;
    private resultText!: GameObjects.Text;
    private testing = false;
    private done = 0;
    private expected = 0;

    constructor() {
        super(SCENES.STATION_2);
        this.stationTitle = '2 · Exploración Física';
        this.nextSceneKey = SCENES.STATION_3;
    }

    protected buildStation() {
        const caso = GameState.getCaso();
        if (!caso) return;
        this.expected = caso.maniobras.length;

        this.drawShoulderPanel();
        this.drawInstructions();
        this.buildChips(caso.maniobras.map(m => m.id));

        // Ticket right (replay state from previous station)
        this.ticket = new Ticket(this, GAME_WIDTH - 270, 140 + TICKET_H / 2, caso);
        // Replay factores already added
        const t = GameState.getTicket();
        if (t) t.factoresSeleccionados.forEach(f => this.ticket.addFactor(f));

        this.input.on('dragend', (_p: Input.Pointer, obj: GameObjects.GameObject) => {
            const chip = obj as ManiobraChip;
            if (!chip || !chip.maniobraId || chip.consumed) return;
            this.handleDrop(chip);
        });
    }

    // ─── shoulder panel ─────────────────────────────────────
    private drawShoulderPanel() {
        const x = 40;
        const y = 140;
        const w = 720;
        const h = 420;

        const card = this.add.graphics();
        card.fillStyle(COLORS.surface, 1);
        card.fillRoundedRect(x, y, w, h, 16);
        card.lineStyle(1, COLORS.border, 1);
        card.strokeRoundedRect(x, y, w, h, 16);

        this.add
            .text(x + 24, y + 22, 'HOMBRO DEL PACIENTE', {
                ...TYPE.label,
                color: COLORS_HEX.success,
            })
            .setOrigin(0, 0);

        this.add
            .text(x + 24, y + 50, 'Arrastra una maniobra al hombro y atina el timing', {
                ...TYPE.bodyS,
                fontSize: '13px',
            })
            .setOrigin(0, 0);

        // Shoulder anatomical sketch
        const cxS = x + w / 2;
        const cyS = y + h / 2 + 20;

        this.shoulderGraphics = this.add.graphics();
        this.drawShoulder(cxS, cyS, COLORS.surfaceHi);

        // dropzone rect (used for hit-test)
        this.shoulderZone = new Geom.Rectangle(cxS - 160, cyS - 140, 320, 280);

        this.resultText = this.add
            .text(cxS, cyS + 170, '', {
                ...TYPE.h4,
                fontSize: '18px',
            })
            .setOrigin(0.5);
    }

    private drawShoulder(cx: number, cy: number, color: number) {
        const g = this.shoulderGraphics;
        g.clear();
        g.lineStyle(3, COLORS.success, 1);
        g.fillStyle(color, 1);
        // Torso
        g.fillRoundedRect(cx - 90, cy - 20, 180, 200, 12);
        g.strokeRoundedRect(cx - 90, cy - 20, 180, 200, 12);
        // Shoulder ball
        g.fillCircle(cx + 110, cy + 10, 50);
        g.strokeCircle(cx + 110, cy + 10, 50);
        // Upper arm
        g.fillRoundedRect(cx + 90, cy + 20, 60, 160, 16);
        g.strokeRoundedRect(cx + 90, cy + 20, 60, 160, 16);
        // Neck/head hint
        g.fillCircle(cx - 40, cy - 60, 28);
        g.strokeCircle(cx - 40, cy - 60, 28);
    }

    // ─── instructions panel ────────────────────────────────
    private drawInstructions() {
        const x = 40;
        const y = 580;
        const w = 720;
        const h = 60;

        const card = this.add.graphics();
        card.fillStyle(COLORS.surfaceAlt, 1);
        card.fillRoundedRect(x, y, w, h, 12);
        card.lineStyle(1, COLORS.border, 1);
        card.strokeRoundedRect(x, y, w, h, 12);

        this.add
            .text(x + 24, y + h / 2, 'Realiza las maniobras necesarias', {
                ...TYPE.h4,
                fontSize: '15px',
            })
            .setOrigin(0, 0.5);

        this.statusText = this.add
            .text(x + w - 24, y + h / 2, this.statusLabel(), {
                ...TYPE.h4,
                fontSize: '18px',
                color: COLORS_HEX.warning,
            })
            .setOrigin(1, 0.5);
    }

    // ─── chips ──────────────────────────────────────────────
    private buildChips(expectedIds: ManiobraId[]) {
        const allIds = Object.keys(MANIOBRAS_INFO) as ManiobraId[];
        const distractorPool = allIds.filter(id => !expectedIds.includes(id));
        Utils.Array.Shuffle(distractorPool);
        const desired = 6;
        const distractors = distractorPool.slice(0, Math.max(0, desired - expectedIds.length));
        const ids = Utils.Array.Shuffle([...expectedIds, ...distractors]);

        const trayX = 40;
        const trayY = 660;
        const trayW = 720;
        const trayH = 200;

        const card = this.add.graphics();
        card.fillStyle(COLORS.surface, 0.85);
        card.fillRoundedRect(trayX, trayY, trayW, trayH, 12);
        card.lineStyle(1, COLORS.border, 1);
        card.strokeRoundedRect(trayX, trayY, trayW, trayH, 12);

        this.add
            .text(trayX + 16, trayY + 12, 'MANIOBRAS DISPONIBLES', TYPE.label)
            .setOrigin(0, 0);

        const cols = 3;
        const colW = (trayW - 40) / cols;
        const rowY = [trayY + 80, trayY + 150];

        ids.forEach((id, i) => {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const x = trayX + 20 + colW * col + colW / 2;
            const y = rowY[row] ?? rowY[0];
            this.chips.push(this.makeChip(x, y, id));
        });
    }

    private makeChip(x: number, y: number, id: ManiobraId): ManiobraChip {
        const info = MANIOBRAS_INFO[id];
        const c = this.add.container(x, y) as ManiobraChip;
        c.maniobraId = id;
        c.consumed = false;
        c.homeX = x;
        c.homeY = y;

        const w = 200;
        const h = 60;
        const bg = this.add
            .rectangle(0, 0, w, h, COLORS.surfaceHi)
            .setStrokeStyle(2, COLORS.border);
        const accent = this.add.rectangle(-w / 2 + 6, 0, 4, h - 14, COLORS.warning);
        const name = this.add
            .text(-w / 2 + 18, -10, info.nombre, {
                ...TYPE.chip,
                fontSize: '14px',
            })
            .setOrigin(0, 0);
        const sub = this.add
            .text(-w / 2 + 18, 10, info.evalua, {
                ...TYPE.label,
                fontSize: '10px',
                color: COLORS_HEX.textMuted,
            })
            .setOrigin(0, 0);

        c.add([bg, accent, name, sub]);
        c.bg = bg;
        c.setSize(w, h);
        c.setInteractive(new Geom.Rectangle(-w / 2, -h / 2, w, h), Geom.Rectangle.Contains);
        this.input.setDraggable(c);

        c.on('pointerover', () => {
            if (c.consumed) return;
            bg.setStrokeStyle(2, COLORS.warning);
        });
        c.on('pointerout', () => {
            if (c.consumed) return;
            bg.setStrokeStyle(2, COLORS.border);
        });

        c.on('dragstart', () => c.setDepth(2000));
        c.on('drag', (_p: Input.Pointer, dx: number, dy: number) => {
            if (c.consumed || this.testing) return;
            c.x = dx;
            c.y = dy;
        });
        c.on('dragend', () => c.setDepth(0));

        c.returnHome = () => {
            this.tweens.add({
                targets: c,
                x: c.homeX,
                y: c.homeY,
                duration: 220,
                ease: 'Back.easeOut',
            });
        };

        c.consume = () => {
            c.consumed = true;
            c.disableInteractive();
            this.tweens.add({ targets: c, alpha: 0.4, scale: 0.92, duration: 220 });
            accent.setFillStyle(COLORS.successDim);
        };

        return c;
    }

    // ─── drop logic ─────────────────────────────────────────
    private handleDrop(chip: ManiobraChip) {
        if (this.testing) {
            chip.returnHome();
            return;
        }
        const dropped = Geom.Rectangle.Contains(this.shoulderZone, chip.x, chip.y);
        if (!dropped) {
            chip.returnHome();
            return;
        }

        const info = MANIOBRAS_INFO[chip.maniobraId];
        chip.returnHome(); // move back, the timing meter takes over

        this.testing = true;
        const meter = new TimingMeter(
            this,
            GAME_WIDTH / 2,
            GAME_HEIGHT / 2,
            `Maniobra: ${info.nombre}`,
        );
        meter.onResult(({ success }) => {
            this.testing = false;
            this.resolveManiobra(chip, success);
        });
    }

    private resolveManiobra(chip: ManiobraChip, timingOk: boolean) {
        if (!timingOk) {
            this.flashShoulder(COLORS.danger);
            this.resultText
                .setText('⌛ Timing fallido — vuelve a intentar')
                .setColor(COLORS_HEX.danger);
            return;
        }

        const caso = GameState.getCaso();
        if (!caso) return;
        const expected = caso.maniobras.find(m => m.id === chip.maniobraId);
        const resultado: ResultadoManiobra = expected ? expected.resultado : 'negativo';

        GameState.addManiobra({
            id: chip.maniobraId,
            aciertoTiming: true,
            resultado,
        });

        const info = MANIOBRAS_INFO[chip.maniobraId];
        this.ticket.addManiobra(info.nombre, resultado);
        chip.consume();

        if (expected) this.done++;
        this.statusText.setText(this.statusLabel());
        if (this.done >= this.expected) this.statusText.setColor(COLORS_HEX.success);

        const flashColor = resultado === 'positivo' ? COLORS.danger : COLORS.success;
        this.flashShoulder(flashColor);
        this.resultText
            .setText(
                `${info.nombre} — ${resultado === 'positivo' ? 'POSITIVO (+)' : 'NEGATIVO (−)'}`,
            )
            .setColor(resultado === 'positivo' ? COLORS_HEX.danger : COLORS_HEX.success);
    }

    private flashShoulder(color: number) {
        const cxS = 40 + 720 / 2;
        const cyS = 140 + 420 / 2 + 20;
        this.drawShoulder(cxS, cyS, color);
        this.time.delayedCall(450, () => this.drawShoulder(cxS, cyS, COLORS.surfaceHi));
    }

    private statusLabel() {
        return `${this.done} / ${this.expected} maniobras`;
    }
}
