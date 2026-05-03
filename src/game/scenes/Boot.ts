import { Scene } from 'phaser';
import { COLORS } from '../config/theme';
import { SCENES } from '../config/constants';

export class Boot extends Scene {
    constructor() {
        super(SCENES.BOOT);
    }

    async create() {
        this.cameras.main.setBackgroundColor(COLORS.bg);

        // Wait for web fonts before rendering anything text-heavy
        if (typeof document !== 'undefined' && (document as Document).fonts) {
            try {
                await Promise.all([
                    (document as Document).fonts.load('600 64px "Fraunces"'),
                    (document as Document).fonts.load('900 180px "Fraunces"'),
                    (document as Document).fonts.load('600 14px "IBM Plex Sans Condensed"'),
                    (document as Document).fonts.load('400 14px "IBM Plex Mono"'),
                    (document as Document).fonts.load('400 16px "Lora"'),
                ]);
                await (document as Document).fonts.ready;
            } catch {
                // ignore — fall back to system fonts
            }
        }

        this.scene.start(SCENES.PRELOADER);
    }
}
