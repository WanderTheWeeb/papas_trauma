import { GameObjects, Geom, Input, Scene } from 'phaser';
import { COLORS, TYPE } from '../config/theme';

export class DraggableSticker extends GameObjects.Container {
    private bg: GameObjects.Rectangle;
    private accent: GameObjects.Rectangle;
    private label: GameObjects.Text;
    private homeX: number;
    private homeY: number;
    public consumed = false;
    public readonly value: string;

    constructor(scene: Scene, x: number, y: number, value: string) {
        super(scene, x, y);
        this.value = value;
        this.homeX = x;
        this.homeY = y;

        this.label = scene.add.text(0, 0, value, TYPE.chip).setOrigin(0.5);

        const padX = 22;
        const padY = 14;
        const w = Math.max(160, this.label.width + padX * 2);
        const h = this.label.height + padY * 2;

        this.bg = scene.add
            .rectangle(0, 0, w, h, COLORS.surfaceHi)
            .setStrokeStyle(2, COLORS.border);

        this.accent = scene.add
            .rectangle(-w / 2 + 6, 0, 4, h - 14, COLORS.success)
            .setOrigin(0.5);

        this.add([this.bg, this.accent, this.label]);
        this.setSize(w, h);
        this.setInteractive(
            new Geom.Rectangle(-w / 2, -h / 2, w, h),
            Geom.Rectangle.Contains,
        );

        scene.input.setDraggable(this);

        this.on('pointerover', () => {
            if (this.consumed) return;
            this.bg.setFillStyle(COLORS.surfaceAlt);
            this.bg.setStrokeStyle(2, COLORS.success);
            scene.tweens.add({ targets: this, scale: 1.04, duration: 120 });
        });
        this.on('pointerout', () => {
            if (this.consumed) return;
            this.bg.setFillStyle(COLORS.surfaceHi);
            this.bg.setStrokeStyle(2, COLORS.border);
            scene.tweens.add({ targets: this, scale: 1, duration: 120 });
        });

        this.on('dragstart', () => {
            this.setDepth(2000);
            scene.tweens.add({ targets: this, scale: 1.08, duration: 100 });
        });

        this.on('drag', (_p: Input.Pointer, dx: number, dy: number) => {
            if (this.consumed) return;
            this.x = dx;
            this.y = dy;
        });

        this.on('dragend', () => {
            this.setDepth(0);
            if (!this.consumed) {
                scene.tweens.add({ targets: this, scale: 1, duration: 120 });
            }
        });

        scene.add.existing(this);
    }

    returnHome() {
        this.scene.tweens.add({
            targets: this,
            x: this.homeX,
            y: this.homeY,
            duration: 220,
            ease: 'Back.easeOut',
        });
    }

    flashError() {
        this.scene.tweens.add({
            targets: this.bg,
            duration: 100,
            yoyo: true,
            repeat: 2,
            onStart: () => this.bg.setStrokeStyle(2, COLORS.danger),
            onComplete: () => this.bg.setStrokeStyle(2, COLORS.border),
        });
        this.accent.setFillStyle(COLORS.danger);
        this.scene.time.delayedCall(600, () => this.accent.setFillStyle(COLORS.success));
    }

    consume() {
        this.consumed = true;
        this.disableInteractive();
        this.accent.setFillStyle(COLORS.successDim);
        this.scene.tweens.add({
            targets: this,
            alpha: 0.4,
            scale: 0.92,
            duration: 220,
        });
    }
}
