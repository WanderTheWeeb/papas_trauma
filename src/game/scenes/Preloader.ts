import { Scene } from 'phaser';
import { COLORS, COLORS_HEX, TYPE } from '../config/theme';
import { GAME_HEIGHT, GAME_WIDTH, SCENES } from '../config/constants';

export class Preloader extends Scene {
    constructor() {
        super(SCENES.PRELOADER);
    }

    init() {
        this.cameras.main.setBackgroundColor(COLORS.bg);

        const cx = GAME_WIDTH / 2;
        const cy = GAME_HEIGHT / 2;

        this.add.text(cx, cy - 80, 'Trauma Station', { ...TYPE.h2, fontSize: '44px' }).setOrigin(0.5);
        this.add
            .text(cx, cy - 30, 'cargando expediente clínico…', {
                ...TYPE.bodyS,
                fontSize: '15px',
            })
            .setOrigin(0.5);

        const barW = 520;
        this.add.rectangle(cx, cy + 30, barW, 12, COLORS.surface).setStrokeStyle(1, COLORS.border);
        const bar = this.add.rectangle(cx - barW / 2 + 2, cy + 30, 4, 8, COLORS.success).setOrigin(0, 0.5);

        this.load.on('progress', (progress: number) => {
            bar.width = 4 + (barW - 8) * progress;
        });
    }

    preload() {
        this.load.setPath('assets');
    }

    create() {
        this.scene.start(SCENES.MAIN_MENU);
    }
}
