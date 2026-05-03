import { Display, Scene } from 'phaser';
import { COLORS, COLORS_HEX, TYPE } from '../config/theme';
import { EVENTS, GAME_HEIGHT, GAME_WIDTH, SCENES } from '../config/constants';
import { EventBus } from '../EventBus';
import { GameState } from '../state/GameState';

export class Evaluation extends Scene {
    constructor() {
        super(SCENES.EVALUATION);
    }

    create() {
        this.cameras.main.setBackgroundColor(COLORS.bg);

        const g = this.add.graphics();
        g.fillGradientStyle(COLORS.bgDeep, COLORS.bgDeep, COLORS.bg, COLORS.bg, 1);
        g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        const score = GameState.evaluate();
        const cx = GAME_WIDTH / 2;

        this.add.text(cx, 120, 'Evaluación del Caso', { ...TYPE.h2, fontSize: '48px' }).setOrigin(0.5);

        // Big score
        const ringColor =
            score.total >= 80 ? COLORS.success : score.total >= 50 ? COLORS.warning : COLORS.danger;
        this.add.circle(cx, 280, 90, COLORS.surface).setStrokeStyle(6, ringColor);
        this.add
            .text(cx, 280, `${score.total}`, {
                ...TYPE.h1,
                fontSize: '88px',
                color: Display.Color.IntegerToColor(ringColor).rgba,
            })
            .setOrigin(0.5);
        this.add
            .text(cx, 360, 'de 100 puntos', { ...TYPE.bodyS, fontSize: '15px' })
            .setOrigin(0.5);

        // Card with rows
        const cardW = 720;
        const cardX = cx - cardW / 2;
        const cardY = 430;
        const card = this.add.graphics();
        card.fillStyle(COLORS.surface, 1);
        card.fillRoundedRect(cardX, cardY, cardW, 280, 16);
        card.lineStyle(1, COLORS.border, 1);
        card.strokeRoundedRect(cardX, cardY, cardW, 280, 16);

        const rows: [string, number][] = [
            ['Síntomas · factores de riesgo', score.symptom],
            ['Pruebas · timing de maniobras', score.testing],
            ['Diagnóstico · sello correcto', score.diagnostic],
            ['Prescripción · fármaco + destino', score.prescription],
        ];

        rows.forEach(([label, value], i) => {
            const y = cardY + 36 + i * 56;
            this.add
                .text(cardX + 32, y, label, { ...TYPE.body, fontSize: '17px' })
                .setOrigin(0, 0.5);

            // mini bar
            const barX = cardX + 360;
            const barW = 200;
            this.add.rectangle(barX, y, barW, 8, COLORS.surfaceAlt).setOrigin(0, 0.5);
            this.add
                .rectangle(barX, y, (value / 25) * barW, 8, COLORS.success)
                .setOrigin(0, 0.5);

            this.add
                .text(cardX + cardW - 32, y, `${value} / 25`, {
                    ...TYPE.btn,
                    fontSize: '18px',
                    color: COLORS_HEX.warning,
                })
                .setOrigin(1, 0.5);
        });

        this.createButton(cx - 160, GAME_HEIGHT - 80, 'Siguiente caso', true, () => {
            GameState.nextCase();
            this.scene.start(SCENES.STATION_1);
        });
        this.createButton(cx + 160, GAME_HEIGHT - 80, 'Menú principal', false, () => {
            this.scene.start(SCENES.MAIN_MENU);
        });

        EventBus.emit(EVENTS.CURRENT_SCENE_READY, this);
    }

    private createButton(x: number, y: number, label: string, primary: boolean, onClick: () => void) {
        const w = 280;
        const h = 60;
        const bg = this.add
            .rectangle(x, y, w, h, primary ? COLORS.success : COLORS.surface)
            .setStrokeStyle(2, primary ? COLORS.success : COLORS.border)
            .setInteractive({ useHandCursor: true });
        this.add
            .text(x, y, label, {
                ...TYPE.btn,
                color: primary ? COLORS_HEX.bgDeep : COLORS_HEX.text,
            })
            .setOrigin(0.5);
        bg.on('pointerover', () =>
            bg.setFillStyle(primary ? 0x33d9c3 : COLORS.surfaceAlt),
        );
        bg.on('pointerout', () =>
            bg.setFillStyle(primary ? COLORS.success : COLORS.surface),
        );
        bg.on('pointerdown', onClick);
    }
}
