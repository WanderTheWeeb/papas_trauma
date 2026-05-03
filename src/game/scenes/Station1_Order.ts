import { GameObjects, Geom, Utils } from 'phaser';
import { COLORS, COLORS_HEX, TYPE } from '../config/theme';
import { GAME_HEIGHT, GAME_WIDTH, SCENES } from '../config/constants';
import { FACTORES_RIESGO_DISPONIBLES } from '../data/casos';
import { GameState } from '../state/GameState';
import { Ticket, TICKET_W, TICKET_H } from '../objects/Ticket';
import { DraggableSticker } from '../objects/DraggableSticker';
import { StationBase } from './StationBase';

export class Station1_Order extends StationBase {
    private ticket!: Ticket;
    private stickers: DraggableSticker[] = [];
    private statusText!: GameObjects.Text;
    private foundCount = 0;
    private wrongCount = 0;
    private totalRequired = 0;

    constructor() {
        super(SCENES.STATION_1);
        this.stationTitle = '1 · Recepción del Paciente';
        this.nextSceneKey = SCENES.STATION_2;
    }

    protected buildStation() {
        const caso = GameState.getCaso();
        if (!caso) {
            this.add
                .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'No hay casos cargados.', {
                    ...TYPE.h3,
                    color: COLORS_HEX.danger,
                })
                .setOrigin(0.5);
            return;
        }

        this.totalRequired = caso.factoresRiesgo.length;

        // Layout zones for 1600x900:
        // - Patient panel left:  x=40..720,  y=140..560
        // - Ticket right:        x=1100..1560, y=140..860 (centered at 1330)
        // - Sticker tray bottom: x=40..1080, y=600..860
        // - Continuar bottom-right (StationBase)

        this.drawPatientPanel(caso.motivo);
        this.drawInstructionsPanel();

        // Ticket (right column)
        const ticketX = GAME_WIDTH - 270;
        const ticketY = 140 + TICKET_H / 2;
        this.ticket = new Ticket(this, ticketX, ticketY, caso);

        // Sticker tray (left bottom area)
        this.buildStickers(caso.factoresRiesgo);

        this.input.on('dragend', (_p: unknown, obj: unknown) => {
            if (!(obj instanceof DraggableSticker)) return;
            this.handleDrop(obj);
        });
    }

    private drawPatientPanel(motivo: string) {
        const panelX = 40;
        const panelY = 140;
        const panelW = 720;
        const panelH = 420;

        // Card background
        const card = this.add.graphics();
        card.fillStyle(COLORS.surface, 1);
        card.fillRoundedRect(panelX, panelY, panelW, panelH, 16);
        card.lineStyle(1, COLORS.border, 1);
        card.strokeRoundedRect(panelX, panelY, panelW, panelH, 16);

        // Section label
        this.add
            .text(panelX + 24, panelY + 22, 'PACIENTE', {
                ...TYPE.label,
                color: COLORS_HEX.success,
            })
            .setOrigin(0, 0);

        // Patient avatar (silhouette)
        const ax = panelX + 90;
        const ay = panelY + 160;
        this.add.circle(ax, ay, 44, COLORS.surfaceHi).setStrokeStyle(3, COLORS.success);
        this.add.circle(ax, ay - 8, 20, COLORS.bgDeep);
        this.add.rectangle(ax, ay + 90, 110, 100, COLORS.surfaceHi).setStrokeStyle(3, COLORS.success);

        // Speech bubble
        const bx = panelX + 170;
        const by = panelY + 90;
        const bw = panelW - 200;
        const bh = 240;

        const bubble = this.add.graphics();
        bubble.fillStyle(COLORS.paper, 1);
        bubble.lineStyle(2, COLORS.success, 1);
        bubble.fillRoundedRect(bx, by, bw, bh, 14);
        bubble.strokeRoundedRect(bx, by, bw, bh, 14);
        bubble.fillStyle(COLORS.paper, 1);
        bubble.fillTriangle(bx, by + 50, bx, by + 90, bx - 18, by + 70);
        bubble.lineStyle(2, COLORS.success, 1);
        bubble.lineBetween(bx, by + 50, bx - 18, by + 70);
        bubble.lineBetween(bx - 18, by + 70, bx, by + 90);

        this.add
            .text(bx + 24, by + 24, 'MOTIVO DE CONSULTA', {
                ...TYPE.label,
                fontSize: '11px',
                color: '#7a8294',
            })
            .setOrigin(0, 0);

        this.add
            .text(bx + 24, by + 50, '"' + motivo + '"', {
                ...TYPE.paperBody,
                fontSize: '15px',
                color: COLORS_HEX.ink,
                fontStyle: 'italic',
                wordWrap: { width: bw - 48 },
            })
            .setOrigin(0, 0);
    }

    private drawInstructionsPanel() {
        const panelX = 40;
        const panelY = 580;
        const panelW = 720;
        const panelH = 80;

        const card = this.add.graphics();
        card.fillStyle(COLORS.surfaceAlt, 1);
        card.fillRoundedRect(panelX, panelY, panelW, panelH, 12);
        card.lineStyle(1, COLORS.border, 1);
        card.strokeRoundedRect(panelX, panelY, panelW, panelH, 12);

        this.add
            .text(panelX + 24, panelY + panelH / 2, '🎯', {
                fontSize: '28px',
                fontFamily: 'sans-serif',
            })
            .setOrigin(0.5);

        this.add
            .text(panelX + 60, panelY + 22, 'Identifica los factores de riesgo', {
                ...TYPE.h4,
                fontSize: '17px',
            })
            .setOrigin(0, 0);

        this.add
            .text(
                panelX + 60,
                panelY + 46,
                'Arrastra los stickers correctos al ticket. Los incorrectos lo ensucian.',
                { ...TYPE.bodyS, fontSize: '13px' },
            )
            .setOrigin(0, 0);

        // Status counter top-right of panel
        this.statusText = this.add
            .text(panelX + panelW - 24, panelY + panelH / 2, this.statusLabel(), {
                ...TYPE.h4,
                fontSize: '20px',
                color: COLORS_HEX.warning,
            })
            .setOrigin(1, 0.5);
    }

    private buildStickers(correctFactors: string[]) {
        const distractors = FACTORES_RIESGO_DISPONIBLES.filter(
            f => !correctFactors.includes(f),
        );
        Utils.Array.Shuffle(distractors);
        const desired = 6;
        const fillNeeded = Math.max(0, desired - correctFactors.length);
        const options = Utils.Array.Shuffle([
            ...correctFactors,
            ...distractors.slice(0, fillNeeded),
        ]);

        const trayX = 40;
        const trayY = 690;
        const trayW = 720;
        const trayH = 170;

        const card = this.add.graphics();
        card.fillStyle(COLORS.surface, 0.8);
        card.fillRoundedRect(trayX, trayY, trayW, trayH, 12);
        card.lineStyle(1, COLORS.border, 1);
        card.strokeRoundedRect(trayX, trayY, trayW, trayH, 12);

        this.add
            .text(trayX + 16, trayY + 12, 'FACTORES DE RIESGO DISPONIBLES', TYPE.label)
            .setOrigin(0, 0);

        // Two rows of 3
        const cols = 3;
        const colW = (trayW - 40) / cols;
        const rowY = [trayY + 70, trayY + 130];

        options.forEach((value, i) => {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const x = trayX + 20 + colW * col + colW / 2;
            const y = rowY[row] ?? rowY[0];
            const sticker = new DraggableSticker(this, x, y, value);
            this.stickers.push(sticker);
        });
    }

    private handleDrop(sticker: DraggableSticker) {
        const caso = GameState.getCaso();
        if (!caso) return;

        const tBounds = this.ticket.getBounds();
        const inTicket = Geom.Rectangle.Contains(tBounds, sticker.x, sticker.y);

        if (!inTicket) {
            sticker.returnHome();
            return;
        }

        const isCorrect = caso.factoresRiesgo.includes(sticker.value);

        if (isCorrect) {
            GameState.addFactor(sticker.value);
            this.ticket.addFactor(sticker.value);
            sticker.consume();
            this.foundCount++;
            this.flashTicket(COLORS.success);
        } else {
            const localX = sticker.x - this.ticket.x;
            const localY = sticker.y - this.ticket.y;
            this.ticket.markDirty(localX, localY);
            sticker.flashError();
            sticker.returnHome();
            this.wrongCount++;
            this.flashTicket(COLORS.danger);
        }

        this.statusText.setText(this.statusLabel());
        if (this.foundCount === this.totalRequired) {
            this.statusText.setColor(COLORS_HEX.success);
        }
    }

    private statusLabel() {
        return `${this.foundCount} / ${this.totalRequired} factores`;
    }

    private flashTicket(color: number) {
        const flash = this.add
            .rectangle(this.ticket.x, this.ticket.y, TICKET_W, TICKET_H, color, 0.18)
            .setDepth(1000);
        this.tweens.add({
            targets: flash,
            alpha: 0,
            duration: 320,
            onComplete: () => flash.destroy(),
        });
    }
}
