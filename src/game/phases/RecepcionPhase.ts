import { Geom, Utils } from 'phaser';
import { COLORS_HEX, TYPE } from '../config/theme';
import { FACTORES_RIESGO_DISPONIBLES } from '../data/casos';
import { GameState } from '../state/GameState';
import { DraggableSticker } from '../objects/DraggableSticker';
import { PhaseHandler } from './PhaseHandler';
import { BANDEJA_X, BANDEJA_Y, BANDEJA_W, DESK_LEFT, DESK_RIGHT, DESK_TOP, DESK_BOTTOM } from '../scenes/ConsultaScene';

const REQUIRED_KEY = 'phase-recepcion-drag-listener';

export class RecepcionPhase extends PhaseHandler {
    private cards: DraggableSticker[] = [];
    private foundCount = 0;
    private wrongCount = 0;
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
        if (this.foundCount >= this.caso.factoresRiesgo.length) return true;
        // Or: ran out of cards — doctor moves on with what they have
        return this.cards.length > 0 && this.cards.every(c => c.consumed);
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
        // Más separación vertical entre filas para que los hit areas (con pad
        // grande para dedos) no se traslapen y el jugador agarre la card de
        // arriba creyendo agarrar la de abajo.
        const rowsY = [BANDEJA_Y + 50, BANDEJA_Y + 170];

        options.forEach((value, i) => {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const x = BANDEJA_X + col * (cardW + gap) + cardW / 2;
            const y = rowsY[row] ?? rowsY[0];
            const tilt = (i % 2 === 0 ? -1 : 1) * (1 + Math.random() * 1.5);
            // Live in scene root so hit-areas resolve correctly
            const card = this.own(new DraggableSticker(this.scene, x, y, value, tilt));
            card.setDragBounds({ left: DESK_LEFT, right: DESK_RIGHT, top: DESK_TOP, bottom: DESK_BOTTOM });
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

        // Drag listener — el objeto arrastrado puede ser el container
        // (DraggableSticker) o su Zone hijo. En el caso del Zone, subimos al
        // parentContainer para encontrar el sticker.
        this.dragHandler = (_p: unknown, obj: unknown) => {
            let card: DraggableSticker | null = null;
            if (obj instanceof DraggableSticker) {
                card = obj;
            } else if (obj && typeof obj === 'object') {
                const parent = (obj as { parentContainer?: unknown }).parentContainer;
                if (parent instanceof DraggableSticker) card = parent;
            }
            if (!card) return;
            this.handleDrop(card);
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
            this.scene.streaks?.correct();
        } else {
            // Wrong factor — IT STAYS on the expediente. Doctor owns the mistake.
            GameState.addFactorIncorrecto(card.value);
            this.expediente.addFactorWrong(card.value);
            const localX = card.x - this.expediente.x;
            const localY = card.y - this.expediente.y;
            this.expediente.markDirty(localX, localY);
            card.consume();
            this.wrongCount++;
            this.expediente.flashReject();
            this.scene.playSfx('scratch');
            this.scene.playSfx('paperRip');
            this.scene.streaks?.wrong();
        }

        this.scene.refreshFooter();

        if (this.isComplete()) {
            this.scene.time.delayedCall(420, () => this.onComplete());
        }
    }
}
