import { GameObjects, Scene } from 'phaser';
import { COLORS, COLORS_HEX, FONTS } from '../config/theme';

interface Point {
    x: number;
    y: number;
}

/**
 * Mini animaciones del tutorial: un cursor fantasma + pulsos en source/target
 * que muestran visualmente el gesto que el jugador debe hacer. No bloquean
 * input — el jugador puede ignorar la animación y empezar a clickear/arrastrar
 * cuando quiera; los GameObjects de la animación se destruyen solos.
 */
export class TutorialDemo {
    private scene: Scene;
    private active: GameObjects.GameObject[] = [];
    private timers: Phaser.Time.TimerEvent[] = [];

    constructor(scene: Scene) {
        this.scene = scene;
    }

    /** Animación de drag: pulso en source → cursor de source a target → pulso en target. Repite 2 veces. */
    playDrag(source: Point, target: Point, label?: string) {
        this.cleanup();

        const runOnce = (delay: number) => {
            this.timers.push(
                this.scene.time.delayedCall(delay, () => this.runDragOnce(source, target, label)),
            );
        };
        runOnce(0);
        runOnce(2400);
    }

    /** Animación de tap: pulso + cursor que toca un punto. Repite 2 veces. */
    playTap(target: Point, label?: string) {
        this.cleanup();

        const runOnce = (delay: number) => {
            this.timers.push(
                this.scene.time.delayedCall(delay, () => this.runTapOnce(target, label)),
            );
        };
        runOnce(0);
        runOnce(1800);
    }

    private runDragOnce(source: Point, target: Point, label?: string) {
        // Pulso en source
        this.spawnPulse(source.x, source.y, COLORS.success);

        // Etiqueta opcional encima del cursor
        const tag = label ? this.spawnTag(source.x, source.y - 50, label) : null;

        // Cursor fantasma — graphics shape (no depende de emoji ni fuente)
        const ghost = this.makeCursor(source.x, source.y);
        ghost.setAlpha(0);
        this.track(ghost);

        // Linea punteada del path
        const path = this.spawnDottedPath(source, target);

        this.scene.tweens.add({
            targets: ghost,
            alpha: 1,
            duration: 200,
        });

        this.scene.tweens.add({
            targets: ghost,
            x: target.x,
            y: target.y,
            duration: 1100,
            delay: 280,
            ease: 'Cubic.inOut',
            onComplete: () => {
                this.spawnPulse(target.x, target.y, COLORS.successDim, 90);
                this.scene.tweens.add({
                    targets: ghost,
                    alpha: 0,
                    duration: 360,
                    delay: 200,
                    onComplete: () => ghost.destroy(),
                });
                if (path) {
                    this.scene.tweens.add({
                        targets: path,
                        alpha: 0,
                        duration: 360,
                        delay: 200,
                        onComplete: () => path.destroy(),
                    });
                }
                if (tag) {
                    this.scene.tweens.add({
                        targets: tag,
                        alpha: 0,
                        duration: 360,
                        delay: 200,
                        onComplete: () => tag.destroy(),
                    });
                }
            },
        });
    }

    private runTapOnce(target: Point, label?: string) {
        this.spawnPulse(target.x, target.y, COLORS.success, 70);

        const tag = label ? this.spawnTag(target.x, target.y - 50, label) : null;

        const ghost = this.makeCursor(target.x + 30, target.y - 30);
        ghost.setAlpha(0);
        this.track(ghost);

        this.scene.tweens.add({
            targets: ghost,
            alpha: 1,
            x: target.x,
            y: target.y,
            duration: 380,
            ease: 'Back.easeOut',
            onComplete: () => {
                this.scene.tweens.add({
                    targets: ghost,
                    alpha: 0,
                    duration: 320,
                    delay: 360,
                    onComplete: () => ghost.destroy(),
                });
                if (tag) {
                    this.scene.tweens.add({
                        targets: tag,
                        alpha: 0,
                        duration: 320,
                        delay: 360,
                        onComplete: () => tag.destroy(),
                    });
                }
            },
        });
    }

    /**
     * Cursor fantasma dibujado con Graphics — un círculo grande verde semi-
     * transparente con un núcleo brillante. NO depende de emojis/fuentes así
     * que se ve igual en cualquier browser/SO.
     */
    private makeCursor(x: number, y: number): GameObjects.Container {
        const cont = this.scene.add.container(x, y).setDepth(3500);

        // Halo exterior pulsante
        const halo = this.scene.add.circle(0, 0, 22, COLORS.success, 0.25);
        // Anillo
        const ring = this.scene.add.circle(0, 0, 18, 0x000000, 0).setStrokeStyle(3, COLORS.success, 1);
        // Núcleo brillante
        const core = this.scene.add.circle(0, 0, 8, COLORS.success, 1);
        // Punto blanco al centro para alto contraste
        const dot = this.scene.add.circle(0, 0, 3, 0xffffff, 1);

        cont.add([halo, ring, core, dot]);

        // Pulso continuo del halo
        this.scene.tweens.add({
            targets: halo,
            scale: { from: 1, to: 1.6 },
            alpha: { from: 0.35, to: 0 },
            duration: 900,
            yoyo: false,
            repeat: -1,
            ease: 'Cubic.out',
        });

        return cont;
    }

    private spawnPulse(x: number, y: number, color: number, maxR = 70) {
        const ring = this.scene.add
            .circle(x, y, 14, color, 0)
            .setStrokeStyle(2, color, 0.9)
            .setDepth(3400);
        this.track(ring);
        this.scene.tweens.add({
            targets: ring,
            radius: maxR,
            alpha: 0,
            duration: 800,
            ease: 'Cubic.out',
            onComplete: () => ring.destroy(),
        });
    }

    private spawnDottedPath(a: Point, b: Point): GameObjects.Graphics | null {
        const g = this.scene.add.graphics().setDepth(3300);
        g.lineStyle(2, COLORS.success, 0.55);
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const dashLen = 8;
        const gapLen = 6;
        const step = dashLen + gapLen;
        const ux = dx / dist;
        const uy = dy / dist;
        for (let d = 0; d < dist; d += step) {
            const x1 = a.x + ux * d;
            const y1 = a.y + uy * d;
            const end = Math.min(d + dashLen, dist);
            const x2 = a.x + ux * end;
            const y2 = a.y + uy * end;
            g.lineBetween(x1, y1, x2, y2);
        }
        g.setAlpha(0);
        this.scene.tweens.add({ targets: g, alpha: 1, duration: 240 });
        this.track(g);
        return g;
    }

    private spawnTag(x: number, y: number, text: string): GameObjects.Text {
        const t = this.scene.add
            .text(x, y, text, {
                fontFamily: FONTS.mono,
                fontSize: '11px',
                color: COLORS_HEX.success,
                backgroundColor: '#0e1a24',
                padding: { x: 8, y: 4 },
            })
            .setOrigin(0.5)
            .setDepth(3450)
            .setLetterSpacing(2);
        this.track(t);
        t.setAlpha(0);
        this.scene.tweens.add({ targets: t, alpha: 1, duration: 200 });
        return t;
    }

    private track(go: GameObjects.GameObject) {
        this.active.push(go);
    }

    cleanup() {
        for (const t of this.timers) t.remove();
        this.timers = [];
        for (const go of this.active) {
            try {
                go.destroy();
            } catch {
                /* noop */
            }
        }
        this.active = [];
    }
}
