import { GameObjects, Scene } from 'phaser';
import { EventBus } from '../EventBus';
import { COLORS, COLORS_HEX, TYPE } from '../config/theme';
import { EVENTS, GAME_HEIGHT, GAME_WIDTH, SCENES } from '../config/constants';
import { GameState } from '../state/GameState';

export class MainMenu extends Scene {
    constructor() {
        super(SCENES.MAIN_MENU);
    }

    create() {
        this.cameras.main.setBackgroundColor(COLORS.bg);

        // backdrop
        const g = this.add.graphics();
        g.fillGradientStyle(COLORS.bgDeep, COLORS.bgDeep, COLORS.bg, COLORS.bg, 1);
        g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // top glow
        const glow = this.add.graphics();
        glow.fillStyle(COLORS.success, 0.06);
        glow.fillCircle(GAME_WIDTH / 2, 0, 700);

        const cx = GAME_WIDTH / 2;

        // logo cross icon
        const cross = this.add.graphics();
        cross.fillStyle(COLORS.success, 1);
        cross.fillRoundedRect(cx - 24, 200, 48, 96, 8);
        cross.fillRoundedRect(cx - 48, 224, 96, 48, 8);

        this.add.text(cx, 350, "Papa's Trauma Station", { ...TYPE.h1, fontSize: '78px' }).setOrigin(0.5);

        this.add
            .text(cx, 410, 'ER · Manguito Rotador Edition', {
                ...TYPE.h3,
                color: COLORS_HEX.success,
                fontSize: '26px',
            })
            .setOrigin(0.5);

        this.add
            .text(cx, 460, 'Simulador clínico de atención primaria · 8 casos', {
                ...TYPE.bodyS,
                fontSize: '17px',
            })
            .setOrigin(0.5);

        this.createButton(cx, 580, 'Iniciar turno', true, () => this.startGame(0));
        this.createButton(cx, 660, 'Caso aleatorio', false, () =>
            this.startGame(Math.floor(Math.random() * 8)),
        );

        this.add
            .text(cx, GAME_HEIGHT - 30, 'v0.2 · scaffold + UI pass', {
                ...TYPE.label,
                fontSize: '12px',
            })
            .setOrigin(0.5);

        EventBus.emit(EVENTS.CURRENT_SCENE_READY, this);
    }

    private createButton(x: number, y: number, label: string, primary: boolean, onClick: () => void) {
        const w = 320;
        const h = 64;
        const bg = this.add
            .rectangle(x, y, w, h, primary ? COLORS.success : COLORS.surface)
            .setStrokeStyle(2, primary ? COLORS.success : COLORS.border)
            .setInteractive({ useHandCursor: true });

        const text = this.add
            .text(x, y, label, {
                ...TYPE.btn,
                color: primary ? COLORS_HEX.bgDeep : COLORS_HEX.text,
            })
            .setOrigin(0.5);

        bg.on('pointerover', () => {
            bg.setFillStyle(primary ? 0x33d9c3 : COLORS.surfaceAlt);
            this.tweens.add({ targets: [bg, text], scale: 1.03, duration: 120 });
        });
        bg.on('pointerout', () => {
            bg.setFillStyle(primary ? COLORS.success : COLORS.surface);
            this.tweens.add({ targets: [bg, text], scale: 1, duration: 120 });
        });
        bg.on('pointerdown', onClick);

        return { bg, text };
    }

    private startGame(index: number) {
        GameState.startNewCase(index);
        this.scene.start(SCENES.STATION_1);
    }
}
