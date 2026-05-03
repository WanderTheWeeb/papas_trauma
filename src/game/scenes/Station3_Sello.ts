import { GameObjects, Geom, Input, Utils } from 'phaser';
import { COLORS, COLORS_HEX, TYPE } from '../config/theme';
import { GAME_HEIGHT, GAME_WIDTH, SCENES } from '../config/constants';
import { DIAGNOSTICOS_DISPONIBLES, MANIOBRAS_INFO } from '../data/casos';
import { GameState } from '../state/GameState';
import { Ticket, TICKET_W, TICKET_H } from '../objects/Ticket';
import { StationBase } from './StationBase';

const DIAG_COLORS: Record<string, number> = {
    'Tendinopatía del manguito rotador': 0x4a90e2,
    'Desgarro completo del manguito rotador': 0xe74c5e,
    'Desgarro parcial del supraespinoso': 0x60c0d8,
    'Desgarro crónico masivo del manguito rotador': 0x9b59b6,
    'Capsulitis adhesiva (hombro congelado)': 0xf5a623,
    'Lesión del subescapular': 0x00c9b1,
};

interface Sello extends GameObjects.Container {
    diagnostico: string;
    consumed: boolean;
    homeX: number;
    homeY: number;
    color: number;
    returnHome: () => void;
    flashError: () => void;
}

export class Station3_Sello extends StationBase {
    private ticket!: Ticket;
    private sellos: Sello[] = [];
    private statusText!: GameObjects.Text;
    private locked = false;

    constructor() {
        super(SCENES.STATION_3);
        this.stationTitle = '3 · Sellado Diagnóstico';
        this.nextSceneKey = SCENES.STATION_4;
    }

    protected buildStation() {
        const caso = GameState.getCaso();
        if (!caso) return;

        this.drawNegatoscopio(caso.rom);
        this.drawInstructionsBar();

        this.ticket = new Ticket(this, GAME_WIDTH - 270, 140 + TICKET_H / 2, caso);
        // Replay state
        const t = GameState.getTicket();
        if (t) {
            t.factoresSeleccionados.forEach(f => this.ticket.addFactor(f));
            t.maniobrasRealizadas.forEach(m =>
                this.ticket.addManiobra(MANIOBRAS_INFO[m.id]?.nombre ?? m.id, m.resultado),
            );
        }

        this.buildSellos();

        this.input.on('dragend', (_p: Input.Pointer, obj: GameObjects.GameObject) => {
            const sello = obj as Sello;
            if (!sello || !sello.diagnostico) return;
            this.handleDrop(sello);
        });
    }

    private drawNegatoscopio(rom: string) {
        const x = 40;
        const y = 140;
        const w = 720;
        const h = 380;

        const card = this.add.graphics();
        card.fillStyle(COLORS.surface, 1);
        card.fillRoundedRect(x, y, w, h, 16);
        card.lineStyle(1, COLORS.border, 1);
        card.strokeRoundedRect(x, y, w, h, 16);

        this.add
            .text(x + 24, y + 22, 'NEGATOSCOPIO · RADIOGRAFÍA', {
                ...TYPE.label,
                color: COLORS_HEX.success,
            })
            .setOrigin(0, 0);

        // Light box panel
        const lx = x + 40;
        const ly = y + 60;
        const lw = w - 80;
        const lh = 220;

        const light = this.add.graphics();
        light.fillStyle(0xe9f0f5, 1); // bright
        light.fillRoundedRect(lx, ly, lw, lh, 8);
        light.lineStyle(4, 0xb0bcc8, 1);
        light.strokeRoundedRect(lx, ly, lw, lh, 8);

        // Stylized X-ray of shoulder
        const cxS = lx + lw / 2;
        const cyS = ly + lh / 2;
        const xray = this.add.graphics();
        xray.lineStyle(3, 0x2c3e50, 0.7);
        xray.fillStyle(0x95a5b8, 0.4);
        // scapula
        xray.fillTriangle(cxS - 100, cyS - 60, cxS + 30, cyS - 80, cxS + 10, cyS + 80);
        xray.strokeTriangle(cxS - 100, cyS - 60, cxS + 30, cyS - 80, cxS + 10, cyS + 80);
        // humeral head
        xray.fillCircle(cxS + 50, cyS - 20, 50);
        xray.strokeCircle(cxS + 50, cyS - 20, 50);
        // humerus shaft
        xray.fillRoundedRect(cxS + 30, cyS + 10, 50, 100, 10);
        xray.strokeRoundedRect(cxS + 30, cyS + 10, 50, 100, 10);
        // acromion
        xray.lineBetween(cxS - 30, cyS - 90, cxS + 80, cyS - 80);

        // ROM / Findings text
        this.add
            .text(x + 24, y + h - 70, 'HALLAZGOS / ROM', {
                ...TYPE.label,
                fontSize: '11px',
            })
            .setOrigin(0, 0);
        this.add
            .text(x + 24, y + h - 50, rom, {
                ...TYPE.bodyS,
                fontSize: '13px',
                color: COLORS_HEX.text,
                wordWrap: { width: w - 48 },
            })
            .setOrigin(0, 0);
    }

    private drawInstructionsBar() {
        const x = 40;
        const y = 540;
        const w = 720;
        const h = 60;

        const card = this.add.graphics();
        card.fillStyle(COLORS.surfaceAlt, 1);
        card.fillRoundedRect(x, y, w, h, 12);
        card.lineStyle(1, COLORS.border, 1);
        card.strokeRoundedRect(x, y, w, h, 12);

        this.add
            .text(x + 24, y + h / 2, 'Estampa el diagnóstico correcto en el ticket', {
                ...TYPE.h4,
                fontSize: '15px',
            })
            .setOrigin(0, 0.5);

        this.statusText = this.add
            .text(x + w - 24, y + h / 2, 'sin sellar', {
                ...TYPE.h4,
                fontSize: '17px',
                color: COLORS_HEX.warning,
            })
            .setOrigin(1, 0.5);
    }

    private buildSellos() {
        const trayX = 40;
        const trayY = 620;
        const trayW = 720;
        const trayH = 240;

        const card = this.add.graphics();
        card.fillStyle(COLORS.surface, 0.85);
        card.fillRoundedRect(trayX, trayY, trayW, trayH, 12);
        card.lineStyle(1, COLORS.border, 1);
        card.strokeRoundedRect(trayX, trayY, trayW, trayH, 12);

        this.add
            .text(trayX + 16, trayY + 12, 'SELLOS DIAGNÓSTICOS', TYPE.label)
            .setOrigin(0, 0);

        const ids = Utils.Array.Shuffle([...DIAGNOSTICOS_DISPONIBLES]);
        const cols = 3;
        const colW = (trayW - 40) / cols;
        const rowY = [trayY + 90, trayY + 180];

        ids.forEach((d, i) => {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const x = trayX + 20 + colW * col + colW / 2;
            const y = rowY[row] ?? rowY[0];
            this.sellos.push(this.makeSello(x, y, d));
        });
    }

    private makeSello(x: number, y: number, diagnostico: string): Sello {
        const color = DIAG_COLORS[diagnostico] ?? COLORS.success;
        const c = this.add.container(x, y) as Sello;
        c.diagnostico = diagnostico;
        c.consumed = false;
        c.homeX = x;
        c.homeY = y;
        c.color = color;

        const w = 200;
        const h = 70;

        // Outer ring (stamp look)
        const ring = this.add.graphics();
        ring.lineStyle(3, color, 1);
        ring.strokeRoundedRect(-w / 2, -h / 2, w, h, 8);
        ring.strokeRoundedRect(-w / 2 + 4, -h / 2 + 4, w - 8, h - 8, 6);

        const fill = this.add.rectangle(0, 0, w - 16, h - 16, color, 0.18).setStrokeStyle(0);

        const label = this.add
            .text(0, 0, diagnostico, {
                ...TYPE.chip,
                fontSize: '12px',
                color: '#ffffff',
                align: 'center',
                wordWrap: { width: w - 20 },
            })
            .setOrigin(0.5);

        c.add([fill, ring, label]);
        c.setSize(w, h);
        c.setInteractive(new Geom.Rectangle(-w / 2, -h / 2, w, h), Geom.Rectangle.Contains);
        this.input.setDraggable(c);

        c.on('pointerover', () => {
            if (c.consumed || this.locked) return;
            fill.setAlpha(0.35);
        });
        c.on('pointerout', () => {
            if (c.consumed) return;
            fill.setAlpha(0.18);
        });

        c.on('dragstart', () => c.setDepth(2000));
        c.on('drag', (_p: Input.Pointer, dx: number, dy: number) => {
            if (c.consumed || this.locked) return;
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

        c.flashError = () => {
            this.tweens.add({
                targets: c,
                angle: { from: -8, to: 8 },
                duration: 60,
                yoyo: true,
                repeat: 3,
                onComplete: () => (c.angle = 0),
            });
        };

        return c;
    }

    private handleDrop(sello: Sello) {
        const caso = GameState.getCaso();
        if (!caso || this.locked) {
            sello.returnHome();
            return;
        }

        const inTicket = Geom.Rectangle.Contains(this.ticket.getBounds(), sello.x, sello.y);
        if (!inTicket) {
            sello.returnHome();
            return;
        }

        const correct = sello.diagnostico === caso.diagnosticoCorrecto;
        if (correct) {
            GameState.setDiagnostico(sello.diagnostico);
            this.ticket.setDiagnostico(sello.diagnostico);
            this.locked = true;
            this.statusText.setText('✓ sellado').setColor(COLORS_HEX.success);

            // Big stamp animation: shrink + place near ticket center
            this.tweens.add({
                targets: sello,
                x: this.ticket.x,
                y: this.ticket.y - 40,
                scale: 0.7,
                angle: -10,
                duration: 280,
                ease: 'Cubic.easeOut',
                onComplete: () => {
                    sello.consumed = true;
                    sello.disableInteractive();
                },
            });
            this.flashTicket(COLORS.success);
        } else {
            const localX = sello.x - this.ticket.x;
            const localY = sello.y - this.ticket.y;
            this.ticket.markDirty(localX, localY);
            sello.flashError();
            sello.returnHome();
            this.flashTicket(COLORS.danger);
        }
    }

    private flashTicket(color: number) {
        const flash = this.add
            .rectangle(this.ticket.x, this.ticket.y, TICKET_W, TICKET_H, color, 0.22)
            .setDepth(1000);
        this.tweens.add({
            targets: flash,
            alpha: 0,
            duration: 360,
            onComplete: () => flash.destroy(),
        });
    }
}
