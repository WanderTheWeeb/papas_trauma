import { GameObjects, Scene, Tweens } from 'phaser';
import { COLORS, COLORS_HEX, TYPE } from '../config/theme';

export interface TimingResult {
    success: boolean;
    accuracy: number; // 0..1, 1 = bull's-eye in green zone
}

const METER_W = 80;
const METER_H = 360;
const GREEN_ZONE_FRAC = 0.22; // 22% of bar height

export class TimingMeter extends GameObjects.Container {
    private bg: GameObjects.Rectangle;
    private greenZone: GameObjects.Rectangle;
    private needle: GameObjects.Rectangle;
    private label: GameObjects.Text;
    private hint: GameObjects.Text;
    private bounceTween!: Tweens.Tween;
    private hitArea: GameObjects.Rectangle;
    private resolved = false;
    private onResultCb?: (r: TimingResult) => void;

    constructor(scene: Scene, x: number, y: number, title: string) {
        super(scene, x, y);

        // Backdrop card
        const card = scene.add
            .rectangle(0, 0, METER_W + 80, METER_H + 140, COLORS.surface, 0.96)
            .setStrokeStyle(2, COLORS.border);
        this.add(card);

        this.label = scene.add
            .text(0, -METER_H / 2 - 50, title, { ...TYPE.h4, fontSize: '16px' })
            .setOrigin(0.5);
        this.add(this.label);

        // Meter background
        this.bg = scene.add
            .rectangle(0, 0, METER_W, METER_H, COLORS.bgDeep)
            .setStrokeStyle(2, COLORS.border);
        this.add(this.bg);

        // Green zone (centered)
        const gzH = METER_H * GREEN_ZONE_FRAC;
        this.greenZone = scene.add
            .rectangle(0, 0, METER_W - 8, gzH, COLORS.success, 0.35);
        this.add(this.greenZone);

        // Outline of green zone
        const gzOutline = scene.add
            .rectangle(0, 0, METER_W - 8, gzH, 0x000000, 0)
            .setStrokeStyle(2, COLORS.success);
        this.add(gzOutline);

        // Needle
        this.needle = scene.add.rectangle(0, -METER_H / 2 + 6, METER_W + 16, 6, COLORS.warning);
        this.add(this.needle);

        this.hint = scene.add
            .text(0, METER_H / 2 + 36, 'CLICK para detener', {
                ...TYPE.label,
                fontSize: '12px',
                color: COLORS_HEX.warning,
            })
            .setOrigin(0.5);
        this.add(this.hint);

        // Full-screen hit area to capture click
        this.hitArea = scene.add
            .rectangle(0, 0, scene.scale.width, scene.scale.height, 0x000000, 0)
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });
        this.add(this.hitArea);
        this.hitArea.on('pointerdown', () => this.stop());

        scene.add.existing(this);
        this.setDepth(5000);
        this.start();
    }

    private start() {
        const top = -METER_H / 2 + 6;
        const bottom = METER_H / 2 - 6;
        this.bounceTween = this.scene.tweens.add({
            targets: this.needle,
            y: { from: top, to: bottom },
            duration: 700,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.inOut',
        });
    }

    private stop() {
        if (this.resolved) return;
        this.resolved = true;
        this.bounceTween.stop();

        const gzH = METER_H * GREEN_ZONE_FRAC;
        const dist = Math.abs(this.needle.y);
        const success = dist <= gzH / 2;
        const accuracy = success ? 1 - dist / (gzH / 2) : 0;

        // Visual flash
        const flashColor = success ? COLORS.success : COLORS.danger;
        this.needle.setFillStyle(flashColor);
        this.scene.tweens.add({
            targets: this.bg,
            duration: 120,
            yoyo: true,
            onStart: () => this.bg.setStrokeStyle(3, flashColor),
        });

        const result: TimingResult = { success, accuracy };

        this.scene.time.delayedCall(450, () => {
            this.onResultCb?.(result);
            this.destroy();
        });
    }

    onResult(cb: (r: TimingResult) => void) {
        this.onResultCb = cb;
        return this;
    }
}
