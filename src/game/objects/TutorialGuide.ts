import { GameObjects, Scene } from 'phaser';
import { COLORS, COLORS_HEX, FONTS, TYPE } from '../config/theme';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/constants';

export interface TutorialStep {
    n: string;
    title: string;
    body: string;
    cta?: string;
}

/**
 * Modal de tutorial mostrado al inicio de cada fase. Bloquea input hasta que
 * el jugador presiona "ENTENDIDO". Se destruye después y la fase queda libre.
 */
export class TutorialGuide {
    private scene: Scene;
    private overlay?: GameObjects.Container;
    private dim?: GameObjects.Rectangle;

    constructor(scene: Scene) {
        this.scene = scene;
    }

    show(step: TutorialStep, onClose: () => void) {
        // Si ya hay uno, ciérralo sin disparar callback
        this.destroy();

        const cx = GAME_WIDTH / 2;
        const cy = GAME_HEIGHT / 2;

        const dim = this.scene.add
            .rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0)
            .setOrigin(0)
            .setDepth(5000)
            .setInteractive();
        this.scene.tweens.add({ targets: dim, alpha: 0.6, duration: 200 });
        this.dim = dim;

        const w = 640;
        const h = 340;
        const cont = this.scene.add.container(cx, cy).setDepth(5001);
        this.overlay = cont;

        const card = this.scene.add.graphics();
        card.fillStyle(COLORS.paper, 0.98);
        card.fillRoundedRect(-w / 2, -h / 2, w, h, 14);
        card.lineStyle(1, 0xc9bfa6, 1);
        card.strokeRoundedRect(-w / 2, -h / 2, w, h, 14);
        cont.add(card);

        // Etiqueta TUTORIAL en la esquina
        cont.add(
            this.scene.add
                .text(-w / 2 + 24, -h / 2 + 24, 'TUTORIAL  ·  GUÍA RÁPIDA', {
                    ...TYPE.paperLabel,
                    fontSize: '10px',
                    color: '#9a9080',
                })
                .setOrigin(0, 0)
                .setLetterSpacing(2.4),
        );

        // Hairline
        cont.add(
            this.scene.add
                .rectangle(-w / 2 + 24, -h / 2 + 44, w - 48, 1, 0xc9bfa6, 0.7)
                .setOrigin(0, 0),
        );

        // Step number (gigante)
        cont.add(
            this.scene.add
                .text(-w / 2 + 24, -h / 2 + 60, step.n, {
                    fontFamily: FONTS.display,
                    fontSize: '54px',
                    color: COLORS_HEX.successDim,
                    fontStyle: '700',
                })
                .setOrigin(0, 0),
        );

        // Title
        cont.add(
            this.scene.add
                .text(-w / 2 + 130, -h / 2 + 70, step.title, {
                    fontFamily: FONTS.display,
                    fontSize: '22px',
                    color: COLORS_HEX.ink,
                    fontStyle: '700',
                })
                .setOrigin(0, 0)
                .setLetterSpacing(2),
        );

        // Body
        cont.add(
            this.scene.add
                .text(-w / 2 + 130, -h / 2 + 104, step.body, {
                    fontFamily: FONTS.body,
                    fontSize: '14px',
                    color: '#3a3528',
                    wordWrap: { width: w - 154 },
                    lineSpacing: 6,
                })
                .setOrigin(0, 0),
        );

        // CTA hint (opcional)
        if (step.cta) {
            cont.add(
                this.scene.add
                    .text(-w / 2 + 24, h / 2 - 70, step.cta, {
                        ...TYPE.paperLabel,
                        fontSize: '10px',
                        color: COLORS_HEX.successDim,
                        fontStyle: 'italic',
                    })
                    .setOrigin(0, 0)
                    .setLetterSpacing(2),
            );
        }

        // Botón cerrar
        const btn = this.scene.add.container(0, h / 2 - 36);
        const bw = 240;
        const bh = 38;
        const bg = this.scene.add
            .rectangle(0, 0, bw, bh, COLORS.bgDeep, 1)
            .setStrokeStyle(1, COLORS.success);
        const lbl = this.scene.add
            .text(0, 0, 'ENTENDIDO  ·  CONTINUAR', {
                ...TYPE.label,
                fontSize: '11px',
                color: COLORS_HEX.success,
            })
            .setOrigin(0.5)
            .setLetterSpacing(2.6);
        btn.add([bg, lbl]);
        btn.setSize(bw, bh).setInteractive({ useHandCursor: true });
        btn.on('pointerover', () => bg.setStrokeStyle(2, COLORS.success));
        btn.on('pointerout', () => bg.setStrokeStyle(1, COLORS.success));
        btn.on('pointerdown', () => {
            this.destroy();
            onClose();
        });
        cont.add(btn);

        // Pop-in
        cont.setScale(0.92).setAlpha(0);
        this.scene.tweens.add({
            targets: cont,
            scale: 1,
            alpha: 1,
            duration: 220,
            ease: 'Back.out',
        });
    }

    destroy() {
        if (this.overlay) {
            this.overlay.destroy();
            this.overlay = undefined;
        }
        if (this.dim) {
            this.dim.destroy();
            this.dim = undefined;
        }
    }
}
