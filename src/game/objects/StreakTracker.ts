import { GameObjects, Scene } from 'phaser';
import { COLORS, COLORS_HEX, FONTS } from '../config/theme';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/constants';
import { SoundFx } from './SoundFx';

/**
 * Tracks correct/wrong actions across phases and pops a flashy momentum
 * banner at thresholds. Lives in the scene root above everything.
 */
export class StreakTracker {
    private scene: Scene;
    private streak = 0;
    private dirtyCount = 0;
    private onDirtyMessage?: (text: string) => void;
    private onComboMessage?: (text: string) => void;

    constructor(scene: Scene) {
        this.scene = scene;
    }

    /** Hook so the host can pipe Sans reactions back through sansReact() */
    onDirty(cb: (text: string) => void) {
        this.onDirtyMessage = cb;
    }

    onCombo(cb: (text: string) => void) {
        this.onComboMessage = cb;
    }

    correct() {
        this.streak += 1;
        if (this.streak === 3) {
            this.popBanner('ON FIRE', COLORS.success);
            SoundFx.streakFanfare();
        } else if (this.streak === 5) {
            this.popBanner('COMBO MÉDICO', COLORS.warning);
            SoundFx.streakFanfare();
            this.scene.cameras.main.shake(180, 0.004);
            const lines = [
                'doc, usted está on fire',
                'mucho rato sin equivocarse, ¿verdad?',
                'oiga, está fluyendo bien la cosa',
            ];
            this.onComboMessage?.(lines[Math.floor(Math.random() * lines.length)]);
        } else if (this.streak === 8) {
            this.popBanner('IMPARABLE', COLORS.danger);
            SoundFx.streakFanfare();
            this.scene.cameras.main.shake(220, 0.005);
        }
    }

    wrong() {
        this.streak = 0;
        this.dirtyCount += 1;
        if (this.dirtyCount === 3 || this.dirtyCount === 6) {
            const lines = [
                'doc, las hojas no son gratis ¿eh?',
                'el papel hospitalario está caro',
                'a este paso necesitamos más tinta',
            ];
            this.onDirtyMessage?.(lines[Math.floor(Math.random() * lines.length)]);
        }
    }

    private popBanner(text: string, color: number) {
        const cx = GAME_WIDTH / 2;
        const cy = GAME_HEIGHT / 2 - 60;
        const cont = this.scene.add.container(cx, cy).setDepth(3500);

        // Big serif text with thick outline
        const main = this.scene.add
            .text(0, 0, text, {
                fontFamily: FONTS.display,
                fontSize: '88px',
                color: '#ffffff',
                fontStyle: '800',
                stroke: '#0b1622',
                strokeThickness: 6,
            })
            .setOrigin(0.5);
        const sub = this.scene.add
            .text(0, 60, '', {
                fontFamily: FONTS.mono,
                fontSize: '12px',
                color: COLORS_HEX.text,
            })
            .setOrigin(0.5)
            .setLetterSpacing(2.4);

        // Color stripes top & bottom
        const stripeTop = this.scene.add.rectangle(0, -40, 320, 4, color).setOrigin(0.5);
        const stripeBot = this.scene.add.rectangle(0, 40, 320, 4, color).setOrigin(0.5);

        cont.add([stripeTop, main, sub, stripeBot]);
        cont.setScale(0.5).setAlpha(0);
        this.scene.tweens.add({
            targets: cont,
            scale: 1,
            alpha: 1,
            duration: 220,
            ease: 'Back.out',
        });
        // Hold then fade
        this.scene.time.delayedCall(900, () => {
            this.scene.tweens.add({
                targets: cont,
                alpha: 0,
                y: cy - 30,
                scale: 1.05,
                duration: 280,
                onComplete: () => cont.destroy(),
            });
        });
    }
}
