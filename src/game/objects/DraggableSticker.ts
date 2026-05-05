import { GameObjects, Geom, Input, Scene } from 'phaser';
import { COLORS, COLORS_HEX, FONTS } from '../config/theme';

/**
 * Paper card the player picks up off the desk and slides into the expediente.
 * The container itself never rotates — only an inner visual group does — so
 * the hit area stays aligned with what the player sees.
 */
export class DraggableSticker extends GameObjects.Container {
    private visual: GameObjects.Container;
    private bg: GameObjects.Rectangle;
    private accent: GameObjects.Rectangle;
    private label: GameObjects.Text;
    private homeX: number;
    private homeY: number;
    private homeAngle: number;
    public consumed = false;
    public readonly value: string;

    constructor(scene: Scene, x: number, y: number, value: string, tilt = 0) {
        super(scene, x, y);
        this.value = value;
        this.homeX = x;
        this.homeY = y;
        this.homeAngle = tilt;

        this.label = scene.add
            .text(0, 0, value, {
                fontFamily: FONTS.body,
                fontSize: '12px',
                color: COLORS_HEX.ink,
                fontStyle: '500',
                wordWrap: { width: 130 },
                align: 'left',
                lineSpacing: 2,
            })
            .setOrigin(0, 0.5);

        const padX = 12;
        const padY = 12;
        const w = 168;
        const h = Math.max(50, this.label.height + padY * 2);

        // Visual group — this is what tilts/scales for the "physical paper" feel
        this.visual = scene.add.container(0, 0);
        this.visual.setAngle(tilt);

        const shadow = scene.add
            .rectangle(2, 4, w, h, 0x000000, 0.45)
            .setOrigin(0.5);

        this.bg = scene.add
            .rectangle(0, 0, w, h, COLORS.paper)
            .setStrokeStyle(1, 0xb8a988);

        this.accent = scene.add
            .rectangle(-w / 2 + 4, 0, 4, h - 12, COLORS.success)
            .setOrigin(0, 0.5);

        const dogear = scene.add.graphics();
        dogear.fillStyle(0xd6cdb4, 1);
        dogear.fillTriangle(w / 2 - 12, -h / 2, w / 2, -h / 2, w / 2, -h / 2 + 12);
        dogear.lineStyle(1, 0xb8a988, 0.6);
        dogear.lineBetween(w / 2 - 12, -h / 2, w / 2, -h / 2 + 12);

        this.label.setPosition(-w / 2 + padX, 0);

        this.visual.add([shadow, this.bg, this.accent, dogear, this.label]);
        this.add(this.visual);

        // Hit area: a touch larger than the card to tolerate the tilt
        const pad = 6;
        this.setSize(w + pad * 2, h + pad * 2);
        this.setInteractive(
            new Geom.Rectangle(-(w + pad * 2) / 2, -(h + pad * 2) / 2, w + pad * 2, h + pad * 2),
            Geom.Rectangle.Contains,
        );

        scene.input.setDraggable(this);

        this.on('pointerover', () => {
            if (this.consumed) return;
            this.bg.setStrokeStyle(1, COLORS.success);
            scene.tweens.add({ targets: this.visual, scale: 1.05, duration: 120 });
        });
        this.on('pointerout', () => {
            if (this.consumed) return;
            this.bg.setStrokeStyle(1, 0xb8a988);
            scene.tweens.add({ targets: this.visual, scale: 1, duration: 120 });
        });

        this.on('dragstart', () => {
            this.setDepth(2000);
            scene.tweens.add({ targets: this.visual, scale: 1.08, angle: 0, duration: 120 });
        });

        this.on('drag', (_p: Input.Pointer, dx: number, dy: number) => {
            if (this.consumed) return;
            this.x = dx;
            this.y = dy;
        });

        this.on('dragend', () => {
            this.setDepth(0);
            if (!this.consumed) {
                scene.tweens.add({
                    targets: this.visual,
                    scale: 1,
                    angle: this.homeAngle,
                    duration: 140,
                });
            }
        });

        scene.add.existing(this);
    }

    returnHome() {
        this.scene.tweens.add({
            targets: this,
            x: this.homeX,
            y: this.homeY,
            duration: 240,
            ease: 'Back.easeOut',
        });
        this.scene.tweens.add({
            targets: this.visual,
            angle: this.homeAngle,
            duration: 240,
        });
    }

    flashError() {
        const orig = this.bg.strokeColor;
        this.scene.tweens.add({
            targets: this.bg,
            duration: 100,
            yoyo: true,
            repeat: 2,
            onStart: () => this.bg.setStrokeStyle(2, COLORS.danger),
            onComplete: () => this.bg.setStrokeStyle(1, orig),
        });
        this.accent.setFillStyle(COLORS.danger);
        this.scene.time.delayedCall(700, () => this.accent.setFillStyle(COLORS.success));
    }

    consume() {
        this.consumed = true;
        this.disableInteractive();
        this.accent.setFillStyle(COLORS.successDim);
        this.scene.tweens.add({
            targets: this,
            alpha: 0.0,
            duration: 260,
        });
        this.scene.tweens.add({
            targets: this.visual,
            scale: 0.94,
            duration: 260,
        });
    }
}
