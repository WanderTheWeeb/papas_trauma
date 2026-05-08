import { GameObjects, Scene } from 'phaser';
import { COLORS, COLORS_HEX, FONTS, TYPE } from '../config/theme';

export type ChatMood = 'pain' | 'ok' | 'doubt' | 'thanks';

export interface ChatEntry {
    text: string;
    mood: ChatMood;
    /** true = pista clínicamente relevante (se marca con ✦) */
    relevant?: boolean;
    /** Hora simulada en formato HH:MM (la consulta empieza ~23:47) */
    timestamp?: string;
}

const PANEL_PAD = 14;
const ENTRY_GAP = 8;

/**
 * Panel de transcripción tipo chat al lado derecho de la sala. Cada
 * vez que el paciente dice algo (motivo, chitchat, idle, hover, poke,
 * pista) se agrega aquí. Las pistas relevantes se marcan con ✦ y un
 * borde más fuerte para que el doctor pueda releerlas.
 */
export class ChatLog {
    private scene: Scene;
    private root: GameObjects.Container;
    private mask?: Phaser.Display.Masks.GeometryMask;
    private content: GameObjects.Container;
    private entries: ChatEntry[] = [];
    private renderedHeight = 0;
    private readonly x: number;
    private readonly y: number;
    private readonly w: number;
    private readonly h: number;
    private fadeTop?: GameObjects.Graphics;
    private emptyHint!: GameObjects.Text;
    private titleBadge!: GameObjects.Text;

    constructor(scene: Scene, x: number, y: number, w: number, h: number) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;

        this.root = scene.add.container(0, 0).setDepth(1500);

        // Frame de papel
        const card = scene.add.graphics();
        card.fillStyle(COLORS.paper, 0.94);
        card.fillRoundedRect(x, y, w, h, 10);
        card.lineStyle(1, 0xc9bfa6, 0.65);
        card.strokeRoundedRect(x, y, w, h, 10);
        this.root.add(card);

        // Eyebrow / título
        this.root.add(
            scene.add
                .text(x + PANEL_PAD, y + 12, 'TRANSCRIPCIÓN  ·  PACIENTE', {
                    ...TYPE.paperLabel,
                    fontSize: '10px',
                    color: '#9a9080',
                })
                .setOrigin(0, 0)
                .setLetterSpacing(2.4),
        );

        // Línea hairline bajo el título
        this.root.add(
            scene.add.rectangle(x + PANEL_PAD, y + 30, w - PANEL_PAD * 2, 1, 0xc9bfa6, 0.6).setOrigin(0, 0),
        );

        // Badge de conteo a la derecha
        this.titleBadge = scene.add
            .text(x + w - PANEL_PAD, y + 12, '0', {
                ...TYPE.paperLabel,
                fontSize: '10px',
                color: '#9a9080',
            })
            .setOrigin(1, 0);
        this.root.add(this.titleBadge);

        // Hint cuando está vacío
        this.emptyHint = scene.add
            .text(x + w / 2, y + h / 2, '— sin diálogos aún —', {
                fontFamily: FONTS.body,
                fontSize: '12px',
                color: '#9a9080',
                fontStyle: 'italic',
            })
            .setOrigin(0.5);
        this.root.add(this.emptyHint);

        // Contenedor scrolleable para entradas — cropped via mask
        const contentTop = y + 40;
        const contentBottom = y + h - PANEL_PAD;
        this.content = scene.add.container(0, contentTop).setDepth(1501);

        const maskShape = scene.make.graphics({ x: 0, y: 0 }, false);
        maskShape.fillStyle(0xffffff);
        maskShape.fillRect(x + PANEL_PAD, contentTop, w - PANEL_PAD * 2, contentBottom - contentTop);
        this.mask = maskShape.createGeometryMask();
        this.content.setMask(this.mask);

        // Fade superior para que el corte no se vea feo
        this.fadeTop = scene.add.graphics().setDepth(1502);
        this.fadeTop.fillGradientStyle(COLORS.paper, COLORS.paper, COLORS.paper, COLORS.paper, 1, 1, 0, 0);
        this.fadeTop.fillRect(x + 1, contentTop, w - 2, 14);
    }

    /** Agrega una línea al log y auto-scrollea al fondo. */
    add(entry: ChatEntry) {
        this.entries.push(entry);
        if (this.emptyHint) {
            this.emptyHint.setVisible(false);
        }
        this.titleBadge.setText(this.entries.length.toString());

        const entryY = this.renderedHeight;
        const card = this.buildEntry(entry, entryY);
        this.content.add(card);

        this.renderedHeight += card.height + ENTRY_GAP;

        // Auto-scroll para que la última quepa abajo
        const visibleH = this.h - 40 - PANEL_PAD;
        if (this.renderedHeight > visibleH) {
            const targetY = this.y + 40 - (this.renderedHeight - visibleH);
            this.scene.tweens.add({
                targets: this.content,
                y: targetY,
                duration: 240,
                ease: 'Sine.out',
            });
        }
    }

    private buildEntry(entry: ChatEntry, yOffset: number): GameObjects.Container & { height: number } {
        const innerW = this.w - PANEL_PAD * 2;
        const cont = this.scene.add.container(this.x + PANEL_PAD, yOffset) as GameObjects.Container & {
            height: number;
        };

        const moodColor =
            entry.mood === 'pain' ? COLORS.danger : entry.mood === 'doubt' ? COLORS.warning : COLORS.success;

        // Texto principal
        const prefix = entry.relevant ? '✦  ' : '';
        const txt = this.scene.add
            .text(8, 4, prefix + entry.text, {
                fontFamily: FONTS.body,
                fontSize: '12px',
                color: entry.relevant ? COLORS_HEX.ink : '#3a3528',
                fontStyle: entry.relevant ? '600' : '400',
                wordWrap: { width: innerW - 16 },
                lineSpacing: 3,
            })
            .setOrigin(0, 0);

        const h = txt.height + 12;

        // Borde / strip de mood
        const strip = this.scene.add.rectangle(0, 0, 3, h, moodColor, 1).setOrigin(0, 0);

        // Fondo sutil para pistas relevantes
        if (entry.relevant) {
            const bg = this.scene.add.graphics();
            bg.fillStyle(0xfff4d6, 0.55);
            bg.fillRoundedRect(0, 0, innerW, h, 4);
            bg.lineStyle(1, 0xd4a017, 0.5);
            bg.strokeRoundedRect(0, 0, innerW, h, 4);
            cont.add(bg);
        }

        cont.add([strip, txt]);

        // Timestamp pequeño en la esquina (si aplica)
        if (entry.timestamp) {
            cont.add(
                this.scene.add
                    .text(innerW - 6, 4, entry.timestamp, {
                        ...TYPE.paperLabel,
                        fontSize: '9px',
                        color: '#9a9080',
                    })
                    .setOrigin(1, 0)
                    .setLetterSpacing(1.5),
            );
        }

        cont.height = h;

        // Animación de entrada
        cont.setAlpha(0);
        cont.x = this.x + PANEL_PAD + 8;
        this.scene.tweens.add({
            targets: cont,
            alpha: 1,
            x: this.x + PANEL_PAD,
            duration: 240,
            ease: 'Sine.out',
        });

        return cont;
    }

    destroy() {
        if (this.mask) this.mask.destroy();
        this.content.destroy();
        this.root.destroy();
        this.fadeTop?.destroy();
    }
}
