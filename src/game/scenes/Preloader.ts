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
        this.load.image('bg-menu', 'bg_menu.jpg');
        this.load.image('bg-station1', 'bg_station1.jpg');
        this.load.image('bg-station2', 'bg_station2.jpg');
        this.load.image('bg-station3', 'bg_station3.jpg');
        this.load.image('bg-station4', 'bg_station4.jpg');
        this.load.image('bg-evaluation', 'bg_evaluation.jpg');
        this.load.image('patient-sans', 'sans.png');
        this.load.image('patient-zombie', 'zombie.png');
        this.load.image('patient-pepsiman', 'pepsiman.png');
        this.load.image('aux-shoulder', 'dolor_hombro.png');
        this.load.image('aux-xray', 'x_ray.png');
    }

    create() {
        this.scene.start(SCENES.MAIN_MENU);
    }
}
