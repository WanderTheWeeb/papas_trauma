import { Geom, Utils } from 'phaser';
import { COLORS_HEX, TYPE } from '../config/theme';
import { FACTORES_RIESGO_DISPONIBLES } from '../data/casos';
import { GameState } from '../state/GameState';
import { DraggableSticker } from '../objects/DraggableSticker';
import { PhaseHandler } from './PhaseHandler';
import { BANDEJA_X, BANDEJA_Y, BANDEJA_W } from '../scenes/ConsultaScene';

const REQUIRED_KEY = 'phase-recepcion-drag-listener';

export class RecepcionPhase extends PhaseHandler {
    private cards: DraggableSticker[] = [];
    private foundCount = 0;
    private dragHandler?: (...args: unknown[]) => void;

    phaseId(): 'recepcion' {
        return 'recepcion';
    }

    phaseLabel(): string {
        return '01  ·  RECEPCIÓN DEL PACIENTE';
    }

    phaseHint(): string {
        return 'identifica los factores de riesgo — arrastra al expediente';
    }

    isComplete(): boolean {
        return this.foundCount >= this.caso.factoresRiesgo.length;
    }

    build() {
        const correct = this.caso.factoresRiesgo;

        // Tray label
        const lbl = this.scene.add
            .text(BANDEJA_X, BANDEJA_Y, 'TARJETAS  ·  ARRASTRA AL EXPEDIENTE', {
                ...TYPE.label,
                fontSize: '10px',
                color: COLORS_HEX.textDim,
            })
            .setOrigin(0, 0)
            .setLetterSpacing(2.4);
        this.bandeja.add(lbl);

        // Build pool
        const distractors = FACTORES_RIESGO_DISPONIBLES.filter(f => !correct.includes(f));
        Utils.Array.Shuffle(distractors);
        const desired = 6;
        const fillNeeded = Math.max(0, desired - correct.length);
        const options = Utils.Array.Shuffle([...correct, ...distractors.slice(0, fillNeeded)]);

        const cols = 3;
        const cardW = 168;
        const gap = 30;
        const rowsY = [BANDEJA_Y + 40, BANDEJA_Y + 130];

        options.forEach((value, i) => {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const x = BANDEJA_X + col * (cardW + gap) + cardW / 2;
            const y = rowsY[row] ?? rowsY[0];
            const tilt = (i % 2 === 0 ? -1 : 1) * (1 + Math.random() * 1.5);
            // Live in scene root so hit-areas resolve correctly
            const card = this.own(new DraggableSticker(this.scene, x, y, value, tilt));
            this.cards.push(card);

            card.setAlpha(0);
            card.y = y + 12;
            this.scene.tweens.add({
                targets: card,
                alpha: 1,
                y,
                duration: 320,
                delay: 80 + i * 60,
                ease: 'Sine.out',
            });
        });

        // Drag listener
        this.dragHandler = (_p: unknown, obj: unknown) => {
            if (!(obj instanceof DraggableSticker)) return;
            this.handleDrop(obj);
        };
        this.scene.input.on('dragend', this.dragHandler);

        // Suppress unused var
        void BANDEJA_W;
        void REQUIRED_KEY;
    }

    cleanup() {
        if (this.dragHandler) {
            this.scene.input.off('dragend', this.dragHandler);
            this.dragHandler = undefined;
        }
        super.cleanup();
        this.cards = [];
    }

    private handleDrop(card: DraggableSticker) {
        const eBounds = this.expediente.getBounds();
        const inExp = Geom.Rectangle.Contains(eBounds, card.x, card.y);
        if (!inExp) {
            card.returnHome();
            return;
        }

        const isCorrect = this.caso.factoresRiesgo.includes(card.value);
        if (isCorrect) {
            GameState.addFactor(card.value);
            this.expediente.addFactor(card.value);
            card.consume();
            this.foundCount++;
            this.expediente.flashAccept();
            this.scene.playSfx('scratch');
            this.scene.playSfx('beep');
            // No Sans reaction on correct factor — patient stays neutral.
            // The expediente filling up is feedback enough.
        } else {
            const localX = card.x - this.expediente.x;
            const localY = card.y - this.expediente.y;
            this.expediente.markDirty(localX, localY);
            card.flashError();
            card.returnHome();
            this.expediente.flashReject();
            this.scene.playSfx('error');
            // No Sans reaction on wrong drop — let the doctor fail in peace.
            // The ink stain on the expediente is the feedback.
        }

        this.scene.refreshFooter();

        if (this.isComplete()) {
            this.scene.time.delayedCall(420, () => this.onComplete());
        }
    }
}
