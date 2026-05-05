import { BlendModes, GameObjects, Geom, Input, Utils } from 'phaser';
import { COLORS, COLORS_HEX, TYPE } from '../config/theme';
import { DIAGNOSTICOS_DISPONIBLES } from '../data/casos';
import { GameState } from '../state/GameState';
import { PhaseHandler } from './PhaseHandler';
import { BANDEJA_X, BANDEJA_Y, BANDEJA_W } from '../scenes/ConsultaScene';

const DIAG_COLORS: Record<string, number> = {
    'Tendinopatía del manguito rotador': 0x4a90e2,
    'Desgarro completo del manguito rotador': 0xe74c5e,
    'Desgarro parcial del supraespinoso': 0x60c0d8,
    'Desgarro crónico masivo del manguito rotador': 0x9b59b6,
    'Capsulitis adhesiva (hombro congelado)': 0xf5a623,
    'Lesión del subescapular': 0x00c9b1,
};

interface Sello extends GameObjects.Container {
    diagnostico: string;
    consumed: boolean;
    homeX: number;
    homeY: number;
    color: number;
    returnHome: () => void;
    flashError: () => void;
}

export class SelladoPhase extends PhaseHandler {
    private sellos: Sello[] = [];
    private locked = false;
    private dragHandler?: (...args: unknown[]) => void;

    phaseId(): 'sellado' {
        return 'sellado';
    }

    phaseLabel(): string {
        return '03  ·  SELLADO DIAGNÓSTICO';
    }

    phaseHint(): string {
        return 'estampa el diagnóstico correcto en el expediente';
    }

    isComplete(): boolean {
        return this.locked;
    }

    build() {
        this.buildNegatoscopioAux(this.caso.rom);
        this.buildSellosBandeja();

        this.dragHandler = (_p: unknown, obj: unknown) => {
            const sello = obj as Sello;
            if (!sello || !sello.diagnostico) return;
            this.handleDrop(sello);
        };
        this.scene.input.on('dragend', this.dragHandler);
    }

    cleanup() {
        if (this.dragHandler) {
            this.scene.input.off('dragend', this.dragHandler);
            this.dragHandler = undefined;
        }
        super.cleanup();
        this.sellos = [];
    }

    private buildNegatoscopioAux(rom: string) {
        const x = BANDEJA_X;
        const y = BANDEJA_Y;
        const w = BANDEJA_W;
        const h = 200;

        // Outer frame — feels like a hung negatoscopio backplate
        const card = this.scene.add.graphics();
        card.fillStyle(COLORS.bgDeep, 0.55);
        card.fillRoundedRect(x, y, w, h, 8);
        card.lineStyle(1, COLORS.borderSoft, 0.6);
        card.strokeRoundedRect(x, y, w, h, 8);
        this.aux.add(card);

        // Eyebrow
        this.aux.add(
            this.scene.add
                .text(x + 16, y + 12, 'NEGATOSCOPIO  ·  RADIOGRAFÍA', {
                    ...TYPE.label,
                    fontSize: '10px',
                    color: COLORS_HEX.success,
                })
                .setOrigin(0, 0)
                .setLetterSpacing(2.4),
        );

        // Light box on the left — backlit panel
        const lx = x + 14;
        const ly = y + 30;
        const lw = 240;
        const lh = h - 44;

        const light = this.scene.add.graphics();
        light.fillStyle(0xeaf3fb, 0.95);
        light.fillRoundedRect(lx, ly, lw, lh, 4);
        light.lineStyle(2, 0x9bb1c3, 0.7);
        light.strokeRoundedRect(lx, ly, lw, lh, 4);
        this.aux.add(light);

        // Bloom around the lightbox to sell the "backlit" feel
        const bloom = this.scene.add.graphics();
        bloom.fillStyle(0xeaf3fb, 0.18);
        bloom.fillRoundedRect(lx - 10, ly - 10, lw + 20, lh + 20, 12);
        this.aux.add(bloom);
        bloom.setBlendMode(BlendModes.ADD);

        // The X-ray photo, fitted inside the lightbox
        if (this.scene.textures.exists('aux-xray')) {
            const img = this.scene.add.image(lx + lw / 2, ly + lh / 2, 'aux-xray');
            const tex = img.texture.getSourceImage() as { width: number; height: number };
            const tw = tex.width || img.width;
            const th = tex.height || img.height;
            const scale = Math.min(lw / tw, lh / th) * 0.92;
            img.setScale(scale);
            this.aux.add(img);
        }

        // Findings text on the right
        const fx = lx + lw + 18;
        const fy = ly + 4;
        const fw = w - (fx - x) - 16;

        this.aux.add(
            this.scene.add
                .text(fx, fy, 'HALLAZGOS / ROM', {
                    ...TYPE.label,
                    fontSize: '10px',
                    color: COLORS_HEX.success,
                })
                .setOrigin(0, 0)
                .setLetterSpacing(2.2),
        );

        this.aux.add(
            this.scene.add
                .rectangle(fx, fy + 22, 22, 1, COLORS.borderSoft)
                .setOrigin(0, 0),
        );

        this.aux.add(
            this.scene.add
                .text(fx, fy + 32, rom, {
                    ...TYPE.bodyS,
                    fontSize: '12px',
                    color: COLORS_HEX.text,
                    wordWrap: { width: fw },
                    lineSpacing: 5,
                })
                .setOrigin(0, 0),
        );
    }

    private buildSellosBandeja() {
        const trayX = BANDEJA_X;
        const trayY = BANDEJA_Y + 214;
        const trayW = BANDEJA_W;

        this.bandeja.add(
            this.scene.add
                .text(trayX, trayY, 'SELLOS DIAGNÓSTICOS', {
                    ...TYPE.label,
                    fontSize: '10px',
                    color: COLORS_HEX.textDim,
                })
                .setOrigin(0, 0)
                .setLetterSpacing(2.4),
        );

        const ids = Utils.Array.Shuffle([...DIAGNOSTICOS_DISPONIBLES]);
        const cols = 3;
        const cardW = 188;
        const gap = 14;
        const rowsY = [trayY + 26, trayY + 84];

        ids.forEach((d, i) => {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const x = trayX + col * (cardW + gap) + cardW / 2;
            const y = rowsY[row] ?? rowsY[0];
            const sello = this.own(this.makeSello(x, y, d, cardW));
            this.sellos.push(sello);
        });
    }

    private makeSello(x: number, y: number, diagnostico: string, w: number): Sello {
        const color = DIAG_COLORS[diagnostico] ?? COLORS.success;
        const c = this.scene.add.container(x, y) as Sello;
        c.diagnostico = diagnostico;
        c.consumed = false;
        c.homeX = x;
        c.homeY = y;
        c.color = color;

        const h = 56;

        const ring = this.scene.add.graphics();
        ring.lineStyle(3, color, 1);
        ring.strokeRoundedRect(-w / 2, -h / 2, w, h, 6);
        ring.strokeRoundedRect(-w / 2 + 4, -h / 2 + 4, w - 8, h - 8, 4);

        const fill = this.scene.add.rectangle(0, 0, w - 16, h - 16, color, 0.18);

        const label = this.scene.add
            .text(0, 0, diagnostico, {
                ...TYPE.chip,
                fontSize: '11px',
                color: '#ffffff',
                align: 'center',
                wordWrap: { width: w - 20 },
            })
            .setOrigin(0.5);

        c.add([fill, ring, label]);
        c.setSize(w, h);
        c.setInteractive(new Geom.Rectangle(-w / 2, -h / 2, w, h), Geom.Rectangle.Contains);
        this.scene.input.setDraggable(c);

        c.on('pointerover', () => {
            if (c.consumed || this.locked) return;
            fill.setAlpha(0.35);
        });
        c.on('pointerout', () => {
            if (c.consumed) return;
            fill.setAlpha(0.18);
        });

        c.on('dragstart', () => c.setDepth(2000));
        c.on('drag', (_p: Input.Pointer, dx: number, dy: number) => {
            if (c.consumed || this.locked) return;
            c.x = dx;
            c.y = dy;
        });
        c.on('dragend', () => c.setDepth(0));

        c.returnHome = () => {
            this.scene.tweens.add({
                targets: c,
                x: c.homeX,
                y: c.homeY,
                duration: 220,
                ease: 'Back.easeOut',
            });
        };

        c.flashError = () => {
            this.scene.tweens.add({
                targets: c,
                angle: { from: -8, to: 8 },
                duration: 60,
                yoyo: true,
                repeat: 3,
                onComplete: () => (c.angle = 0),
            });
        };

        return c;
    }

    private handleDrop(sello: Sello) {
        if (this.locked) {
            sello.returnHome();
            return;
        }

        const inExp = Geom.Rectangle.Contains(this.expediente.getBounds(), sello.x, sello.y);
        if (!inExp) {
            sello.returnHome();
            return;
        }

        const correct = sello.diagnostico === this.caso.diagnosticoCorrecto;
        // Always commit the stamp — doctor can fail. The dx is whatever they
        // chose; evaluation will judge it.
        GameState.setDiagnostico(sello.diagnostico);
        this.expediente.setDiagnostico(sello.diagnostico);
        this.locked = true;
        if (correct) {
            this.expediente.flashAccept();
            this.scene.streaks?.correct();
        } else {
            this.expediente.flashReject();
            this.scene.streaks?.wrong();
        }

        const targetX = this.expediente.x;
        const targetY = this.expediente.y - 60;

        // Heavy stamp animation regardless of correctness
        this.scene.tweens.add({
            targets: sello,
            x: targetX,
            y: targetY,
            scale: 0.7,
            angle: -10,
            alpha: 0.92,
            duration: 220,
            ease: 'Bounce.easeOut',
            onComplete: () => {
                sello.consumed = true;
                sello.disableInteractive();
                this.scene.playSfx('thunk');
                this.scene.cameras.main.shake(260, 0.006);

                // Permanent ink stamp — green if correct, red-ish if wrong
                const stampColor = correct ? sello.color : 0x7a3a2a;
                const stamp = this.scene.add.graphics();
                stamp.lineStyle(2, stampColor, 0.85);
                stamp.strokeCircle(targetX, targetY, 28);
                stamp.strokeCircle(targetX, targetY, 22);
                stamp.setDepth(950);
                stamp.setAlpha(0);
                this.scene.tweens.add({ targets: stamp, alpha: 1, duration: 200 });
                this.own(stamp);

                if (!correct) {
                    // Drop one extra error sound to make the wrong stamp feel weighty/wrong
                    this.scene.time.delayedCall(120, () => this.scene.playSfx('error'));
                }
            },
        });

        this.scene.refreshFooter();
        this.scene.time.delayedCall(820, () => this.onComplete());
    }
}
