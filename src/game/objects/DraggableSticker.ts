import { GameObjects, Geom, Input, Scene } from 'phaser';
import { COLORS, COLORS_HEX, FONTS } from '../config/theme';

/**
 * Límites a los que el drag está restringido. Nada de cards volando hacia
 * el sprite del paciente, el chrome o fuera de la mesa.
 *  - left/right/top/bottom: rect mundial donde el centro de la carta puede ir
 *  - el caller pasa el rect; si no, se queda libre.
 */
export interface DragBounds {
    left: number;
    right: number;
    top: number;
    bottom: number;
}

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
    private dragBounds?: DragBounds;
    private halfW = 0;
    private halfH = 0;
    // Offset entre el cursor y el centro de la card al iniciar drag.
    // Sin esto la card "salta" para centrarse bajo el cursor.
    private dragOffsetX = 0;
    private dragOffsetY = 0;

    constructor(scene: Scene, x: number, y: number, value: string, tilt = 0) {
        super(scene, x, y);
        this.value = value;
        this.homeX = x;
        this.homeY = y;
        this.homeAngle = tilt;

        this.label = scene.add
            .text(0, 0, value, {
                fontFamily: FONTS.body,
                fontSize: '13px',
                color: COLORS_HEX.ink,
                fontStyle: '500',
                wordWrap: { width: 156 },
                align: 'left',
                lineSpacing: 3,
            })
            .setOrigin(0, 0.5);

        const padX = 14;
        const padY = 14;
        const w = 192;
        const h = Math.max(64, this.label.height + padY * 2);
        this.halfW = w / 2;
        this.halfH = h / 2;
        void padX;

        // Tilt va en el container EXTERNO (no en visual) para que el hit area
        // y el visual coincidan. La sombra también va simétrica para que el
        // centro óptico de la card caiga en (0,0) del container y no se vea
        // desplazada abajo-derecha.
        this.angle = tilt;

        // Visual group — solo para escala animada; sin rotación propia
        this.visual = scene.add.container(0, 0);

        const shadow = scene.add
            .rectangle(0, 2, w, h, 0x000000, 0.35)
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

        // Phaser 4 interpreta el Rectangle del hit area corrido arriba-izquierda
        // del centro del Container. Compensación: desplazar el rect abajo-derecha
        // para que el hit testing real caiga sobre el visual. Estos offsets son
        // empíricos — tunearlos mirando el modo D y probando picks.
        const pad = 4;
        const hitW = w + pad * 2;
        const hitH = h + pad * 2;
        const offsetX = w / 2;   // = halfW: shift a la derecha medio ancho
        const offsetY = h / 2;   // = halfH: shift abajo medio alto
        this.setSize(hitW, hitH);
        this.setInteractive(
            new Geom.Rectangle(-hitW / 2 + offsetX, -hitH / 2 + offsetY, hitW, hitH),
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

        this.on('dragstart', (p: Input.Pointer) => {
            this.setDepth(2000);
            scene.tweens.add({ targets: this, angle: 0, duration: 120 });
            scene.tweens.add({ targets: this.visual, scale: 1.08, duration: 120 });
            // Captura el offset cursor↔centro al inicio del drag para
            // preservarlo durante el movimiento (sin snap al cursor).
            this.dragOffsetX = this.x - p.worldX;
            this.dragOffsetY = this.y - p.worldY;
        });

        this.on('drag', (p: Input.Pointer) => {
            if (this.consumed) return;
            // Ignora dx/dy de Phaser (buggy con Container en v4) y usa
            // pointer.worldX/Y + el offset capturado en dragstart.
            const targetX = p.worldX + this.dragOffsetX;
            const targetY = p.worldY + this.dragOffsetY;
            const b = this.dragBounds;
            if (b) {
                const minX = b.left + this.halfW;
                const maxX = b.right - this.halfW;
                const minY = b.top + this.halfH;
                const maxY = b.bottom - this.halfH;
                this.x = Math.max(minX, Math.min(maxX, targetX));
                this.y = Math.max(minY, Math.min(maxY, targetY));
            } else {
                this.x = targetX;
                this.y = targetY;
            }
        });

        this.on('dragend', () => {
            this.setDepth(0);
            if (!this.consumed) {
                scene.tweens.add({ targets: this.visual, scale: 1, duration: 140 });
                scene.tweens.add({ targets: this, angle: this.homeAngle, duration: 140 });
            }
        });

        scene.add.existing(this);
    }

    /** Restringe el drag al rectángulo dado (coordenadas mundo). */
    setDragBounds(bounds: DragBounds) {
        this.dragBounds = bounds;
    }

    returnHome() {
        this.scene.tweens.add({
            targets: this,
            x: this.homeX,
            y: this.homeY,
            angle: this.homeAngle,
            duration: 240,
            ease: 'Back.easeOut',
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
