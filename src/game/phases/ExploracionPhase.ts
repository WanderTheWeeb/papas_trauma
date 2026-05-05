import { GameObjects, Geom, Input, Tweens, Utils } from 'phaser';
import { COLORS, COLORS_HEX, TYPE } from '../config/theme';
import { MANIOBRAS_INFO } from '../data/casos';
import { GameState } from '../state/GameState';
import { PhaseHandler } from './PhaseHandler';
import { BANDEJA_X, BANDEJA_Y, BANDEJA_W } from '../scenes/ConsultaScene';
import type { ManiobraId, ResultadoManiobra } from '../data/types';

const SHOULDER_PANEL_H = 200;

interface ManiobraChip extends GameObjects.Container {
    maniobraId: ManiobraId;
    consumed: boolean;
    homeX: number;
    homeY: number;
    bg: GameObjects.Rectangle;
    returnHome: () => void;
    consume: () => void;
}

export class ExploracionPhase extends PhaseHandler {
    private chips: ManiobraChip[] = [];
    private shoulderImage!: GameObjects.Image;
    private shoulderRing!: GameObjects.Graphics;
    private shoulderZone!: Geom.Rectangle;
    private resultText!: GameObjects.Text;
    private testing = false;
    private done = 0;
    private expected = 0;
    private dragHandler?: (...args: unknown[]) => void;

    phaseId(): 'exploracion' {
        return 'exploracion';
    }

    phaseLabel(): string {
        return '02  ·  EXPLORACIÓN FÍSICA';
    }

    phaseHint(): string {
        return 'arrastra una maniobra al hombro y atina el timing';
    }

    isComplete(): boolean {
        return this.done >= this.expected;
    }

    build() {
        this.expected = this.caso.maniobras.length;

        this.buildShoulderAux();
        this.buildChipsBandeja();

        this.dragHandler = (_p: unknown, obj: unknown) => {
            const chip = obj as ManiobraChip;
            if (!chip || !chip.maniobraId || chip.consumed) return;
            this.handleDrop(chip);
        };
        this.scene.input.on('dragend', this.dragHandler);
    }

    cleanup() {
        if (this.dragHandler) {
            this.scene.input.off('dragend', this.dragHandler);
            this.dragHandler = undefined;
        }
        super.cleanup();
        this.chips = [];
    }

    // ─── Aux: shoulder panel above the chips ───────────────
    private buildShoulderAux() {
        const x = BANDEJA_X;
        const y = BANDEJA_Y;
        const w = BANDEJA_W;
        const h = SHOULDER_PANEL_H;

        // Frame card — feels like a clinical photo on the desk
        const card = this.scene.add.graphics();
        card.fillStyle(COLORS.bgDeep, 0.55);
        card.fillRoundedRect(x, y, w, h, 8);
        card.lineStyle(1, COLORS.borderSoft, 0.6);
        card.strokeRoundedRect(x, y, w, h, 8);
        this.aux.add(card);

        // Inner mat (gives the photo room to breathe)
        const matX = x + 14;
        const matY = y + 30;
        const matW = w - 28;
        const matH = h - 44;
        const mat = this.scene.add.graphics();
        mat.fillStyle(0x000000, 0.45);
        mat.fillRoundedRect(matX, matY, matW, matH, 4);
        this.aux.add(mat);

        // Eyebrow
        this.aux.add(
            this.scene.add
                .text(x + 16, y + 12, 'PACIENTE  ·  ZONA DE PRUEBA', {
                    ...TYPE.label,
                    fontSize: '10px',
                    color: COLORS_HEX.success,
                })
                .setOrigin(0, 0)
                .setLetterSpacing(2.4),
        );

        // The actual shoulder photo, fitted inside the mat
        if (this.scene.textures.exists('aux-shoulder')) {
            const img = this.scene.add.image(matX + matW / 2, matY + matH / 2, 'aux-shoulder');
            const tex = img.texture.getSourceImage() as { width: number; height: number };
            const tw = tex.width || img.width;
            const th = tex.height || img.height;
            const scale = Math.min(matW / tw, matH / th) * 0.95;
            img.setScale(scale);
            this.shoulderImage = img;
            this.aux.add(img);
        }

        // Soft accent ring around the mat (drop hint)
        this.shoulderRing = this.scene.add.graphics();
        this.drawShoulderRing(matX, matY, matW, matH, COLORS.success, 0.0);
        this.aux.add(this.shoulderRing);

        this.shoulderZone = new Geom.Rectangle(matX, matY, matW, matH);

        // Result line
        this.resultText = this.scene.add
            .text(x + w / 2, y + h - 12, '', {
                ...TYPE.bodyS,
                fontSize: '11px',
                fontStyle: 'italic',
                color: COLORS_HEX.textMuted,
            })
            .setOrigin(0.5, 1);
        this.aux.add(this.resultText);
    }

    private drawShoulderRing(x: number, y: number, w: number, h: number, color: number, alpha: number) {
        const g = this.shoulderRing;
        g.clear();
        g.lineStyle(2, color, alpha);
        g.strokeRoundedRect(x - 2, y - 2, w + 4, h + 4, 6);
    }

    private flashShoulder(color: number) {
        const z = this.shoulderZone;
        this.drawShoulderRing(z.x, z.y, z.width, z.height, color, 0.85);
        this.scene.tweens.add({
            targets: this.shoulderImage,
            alpha: { from: 0.6, to: 1 },
            duration: 480,
        });
        this.scene.time.delayedCall(420, () =>
            this.drawShoulderRing(z.x, z.y, z.width, z.height, COLORS.success, 0),
        );
    }

    // ─── Bandeja: chips de maniobras ───────────────────────
    private buildChipsBandeja() {
        // Chips area lives below the shoulder panel
        const trayX = BANDEJA_X;
        const trayY = BANDEJA_Y + SHOULDER_PANEL_H + 14;
        const trayW = BANDEJA_W;

        this.bandeja.add(
            this.scene.add
                .text(trayX, trayY, 'MANIOBRAS DISPONIBLES', {
                    ...TYPE.label,
                    fontSize: '10px',
                    color: COLORS_HEX.textDim,
                })
                .setOrigin(0, 0)
                .setLetterSpacing(2.4),
        );

        const expectedIds = this.caso.maniobras.map(m => m.id);
        const allIds = Object.keys(MANIOBRAS_INFO) as ManiobraId[];
        const distractorPool = allIds.filter(id => !expectedIds.includes(id));
        Utils.Array.Shuffle(distractorPool);
        const desired = 6;
        const distractors = distractorPool.slice(0, Math.max(0, desired - expectedIds.length));
        const ids = Utils.Array.Shuffle([...expectedIds, ...distractors]);

        const cols = 3;
        const cardW = 188;
        const gap = 14;
        const rowsY = [trayY + 28, trayY + 88];

        ids.forEach((id, i) => {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const x = trayX + col * (cardW + gap) + cardW / 2;
            const y = rowsY[row] ?? rowsY[0];
            const chip = this.makeChip(x, y, id, cardW);
            this.chips.push(chip);
            this.bandeja.add(chip);
        });
    }

    private makeChip(x: number, y: number, id: ManiobraId, w: number): ManiobraChip {
        const info = MANIOBRAS_INFO[id];
        const c = this.scene.add.container(x, y) as ManiobraChip;
        c.maniobraId = id;
        c.consumed = false;
        c.homeX = x;
        c.homeY = y;

        const h = 50;
        const bg = this.scene.add
            .rectangle(0, 0, w, h, COLORS.surfaceHi, 0.92)
            .setStrokeStyle(1, COLORS.border);
        const accent = this.scene.add.rectangle(-w / 2 + 5, 0, 4, h - 14, COLORS.warning);
        const name = this.scene.add
            .text(-w / 2 + 14, -8, info.nombre, {
                ...TYPE.chip,
                fontSize: '12px',
            })
            .setOrigin(0, 0);
        const sub = this.scene.add
            .text(-w / 2 + 14, 8, info.evalua, {
                ...TYPE.label,
                fontSize: '9px',
                color: COLORS_HEX.textMuted,
            })
            .setOrigin(0, 0);

        c.add([bg, accent, name, sub]);
        c.bg = bg;
        c.setSize(w, h);
        c.setInteractive(new Geom.Rectangle(-w / 2, -h / 2, w, h), Geom.Rectangle.Contains);
        this.scene.input.setDraggable(c);

        c.on('pointerover', () => {
            if (c.consumed) return;
            bg.setStrokeStyle(2, COLORS.warning);
        });
        c.on('pointerout', () => {
            if (c.consumed) return;
            bg.setStrokeStyle(1, COLORS.border);
        });

        c.on('dragstart', () => c.setDepth(2000));
        c.on('drag', (_p: Input.Pointer, dx: number, dy: number) => {
            if (c.consumed || this.testing) return;
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

        c.consume = () => {
            c.consumed = true;
            c.disableInteractive();
            this.scene.tweens.add({ targets: c, alpha: 0.4, scale: 0.92, duration: 220 });
            accent.setFillStyle(COLORS.successDim);
        };

        return c;
    }

    private handleDrop(chip: ManiobraChip) {
        if (this.testing) {
            chip.returnHome();
            return;
        }
        if (!Geom.Rectangle.Contains(this.shoulderZone, chip.x, chip.y)) {
            chip.returnHome();
            return;
        }

        const info = MANIOBRAS_INFO[chip.maniobraId];
        chip.returnHome();
        this.testing = true;

        // Inline timing meter — sits on top of the shoulder photo
        this.runInlineTiming(info.nombre, success => {
            this.testing = false;
            this.resolveManiobra(chip, success);
        });
    }

    /**
     * Diegetic mini timing bar that sits across the shoulder photo while
     * the player is "performing" the maneuver. A needle bounces side-to-
     * side; one click anywhere on the bar (or the photo) stops it. If the
     * needle is in the green zone, the maneuver succeeds.
     */
    private runInlineTiming(maniobraName: string, cb: (ok: boolean) => void) {
        const z = this.shoulderZone;
        const cx = z.x + z.width / 2;
        const cy = z.y + z.height / 2;

        // Floating panel inside the aux container so it gets cleaned up
        const panel = this.scene.add.container(cx, cy);
        this.aux.add(panel);

        const w = z.width - 24;
        const h = 56;
        const barH = 14;

        // Backdrop strip
        const bg = this.scene.add
            .rectangle(0, 0, w, h, COLORS.bgDeep, 0.92)
            .setStrokeStyle(1, COLORS.success);
        panel.add(bg);

        // Title (mono caption)
        const title = this.scene.add
            .text(0, -h / 2 + 10, maniobraName.toUpperCase(), {
                ...TYPE.label,
                fontSize: '10px',
                color: COLORS_HEX.success,
            })
            .setOrigin(0.5, 0)
            .setLetterSpacing(2.4);
        panel.add(title);

        // Bar body
        const barTop = -h / 2 + 26;
        const barBg = this.scene.add
            .rectangle(0, barTop, w - 24, barH, 0x000000, 0.6)
            .setOrigin(0.5, 0)
            .setStrokeStyle(1, COLORS.borderSoft);
        panel.add(barBg);

        // Green zone (centered, 22% wide)
        const gzFrac = 0.22;
        const gzW = (w - 24) * gzFrac;
        const greenZone = this.scene.add
            .rectangle(0, barTop, gzW, barH, COLORS.success, 0.4)
            .setOrigin(0.5, 0)
            .setStrokeStyle(1, COLORS.success);
        panel.add(greenZone);

        // Needle
        const needleW = 4;
        const needle = this.scene.add
            .rectangle(0, barTop, needleW, barH + 8, COLORS.warning)
            .setOrigin(0.5, 0);
        panel.add(needle);
        needle.x = -(w / 2 - 12) + needleW;

        // Bounce tween
        const left = -(w / 2 - 12) + needleW;
        const right = w / 2 - 12 - needleW;
        const tween: Tweens.Tween = this.scene.tweens.add({
            targets: needle,
            x: { from: left, to: right },
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.inOut',
        });

        // Click hint
        const hint = this.scene.add
            .text(0, h / 2 - 4, 'CLIC PARA DETENER', {
                ...TYPE.label,
                fontSize: '9px',
                color: COLORS_HEX.warning,
            })
            .setOrigin(0.5, 1)
            .setLetterSpacing(2.4);
        panel.add(hint);

        // Hit zone covering the whole shoulder area
        const hit = this.scene.add
            .rectangle(z.x + z.width / 2, z.y + z.height / 2, z.width, z.height, 0xffffff, 0.001)
            .setInteractive({ useHandCursor: true });
        this.aux.add(hit);

        // Animate panel in
        panel.setScale(0.85).setAlpha(0);
        this.scene.tweens.add({ targets: panel, scale: 1, alpha: 1, duration: 200, ease: 'Cubic.out' });

        let resolved = false;
        const finalize = (ok: boolean) => {
            if (resolved) return;
            resolved = true;
            tween.stop();

            const flashColor = ok ? COLORS.success : COLORS.danger;
            needle.setFillStyle(flashColor);
            this.scene.tweens.add({
                targets: bg,
                duration: 100,
                yoyo: true,
                onStart: () => bg.setStrokeStyle(2, flashColor),
                onComplete: () => bg.setStrokeStyle(1, COLORS.success),
            });

            this.scene.time.delayedCall(420, () => {
                this.scene.tweens.add({
                    targets: panel,
                    alpha: 0,
                    scale: 0.92,
                    duration: 200,
                    onComplete: () => {
                        panel.destroy();
                        hit.destroy();
                        cb(ok);
                    },
                });
            });
        };

        hit.on('pointerdown', () => {
            const dist = Math.abs(needle.x);
            const ok = dist <= gzW / 2;
            finalize(ok);
        });
    }

    private resolveManiobra(chip: ManiobraChip, timingOk: boolean) {
        if (!timingOk) {
            this.flashShoulder(COLORS.danger);
            this.resultText.setText('timing fallido — intenta otra vez').setColor(COLORS_HEX.danger);
            this.scene.playSfx('error');
            this.scene.sansReact('así no doc, otra vez', 'doubt');
            return;
        }

        const expected = this.caso.maniobras.find(m => m.id === chip.maniobraId);
        const resultado: ResultadoManiobra = expected ? expected.resultado : 'negativo';

        GameState.addManiobra({
            id: chip.maniobraId,
            aciertoTiming: true,
            resultado,
        });
        const info = MANIOBRAS_INFO[chip.maniobraId];
        this.expediente.addManiobra(info.nombre, resultado);
        chip.consume();

        if (expected) this.done++;
        this.flashShoulder(resultado === 'positivo' ? COLORS.danger : COLORS.success);
        this.resultText
            .setText(`${info.nombre} — ${resultado === 'positivo' ? '(+) POSITIVO' : '(−) negativo'}`)
            .setColor(resultado === 'positivo' ? COLORS_HEX.danger : COLORS_HEX.success);

        if (resultado === 'positivo') {
            this.scene.playSfx('error');
            this.scene.sansReact('¡AGH! ahí…', 'pain');
        } else {
            this.scene.playSfx('beep');
            this.scene.sansReact('eso no me dolió', 'ok');
        }
        this.scene.playSfx('scratch');

        this.scene.refreshFooter();

        if (this.isComplete()) {
            this.scene.time.delayedCall(640, () => this.onComplete());
        }
    }
}
