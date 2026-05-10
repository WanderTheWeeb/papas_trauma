import { GameObjects } from 'phaser';
import type { CasoClinico } from '../data/types';
import type { Expediente } from '../objects/Expediente';
import type { ConsultaScene } from '../scenes/ConsultaScene';

export interface PhaseContext {
    scene: ConsultaScene;
    caso: CasoClinico;
    expediente: Expediente;
    bandeja: GameObjects.Container;
    aux: GameObjects.Container;
    onComplete: () => void;
}

/**
 * Base for the four clinical phases that share the same desk.
 * Each phase populates the bandeja (left) and optionally an aux panel
 * (above the bandeja), reads/writes the same Expediente, and signals
 * completion through `onComplete()` so the scene can hand off to the
 * next phase without re-creating the desk.
 */
export abstract class PhaseHandler {
    protected scene: ConsultaScene;
    protected caso: CasoClinico;
    protected expediente: Expediente;
    protected bandeja: GameObjects.Container;
    protected aux: GameObjects.Container;
    protected onComplete: () => void;
    protected listeners: Array<{
        emitter: { off: (ev: string, fn: (...a: unknown[]) => void) => void };
        ev: string;
        fn: (...a: unknown[]) => void;
    }> = [];

    /**
     * Live in scene root (not in `bandeja`/`aux`) so input hit-areas resolve
     * correctly. `cleanup()` destroys these explicitly.
     */
    protected disposables: GameObjects.GameObject[] = [];

    constructor(ctx: PhaseContext) {
        this.scene = ctx.scene;
        this.caso = ctx.caso;
        this.expediente = ctx.expediente;
        this.bandeja = ctx.bandeja;
        this.aux = ctx.aux;
        this.onComplete = ctx.onComplete;
    }

    abstract build(): void;
    abstract isComplete(): boolean;
    abstract phaseId(): 'recepcion' | 'exploracion' | 'sellado' | 'prescripcion';
    abstract phaseLabel(): string;
    abstract phaseHint(): string;

    /**
     * Para el tutorial: posición de un elemento "correcto" desde el cual
     * demostrar el gesto al jugador. Default: null (sin demo). Cada fase
     * sobreescribe para devolver el centro de su pick correcto.
     */
    getDemoSource(): { x: number; y: number } | null {
        return null;
    }

    /** Called when the phase is leaving. Default: empty bandeja & aux containers. */
    cleanup() {
        // Detach any input listeners we registered through trackInput
        for (const l of this.listeners) {
            try {
                l.emitter.off(l.ev, l.fn);
            } catch {
                /* noop */
            }
        }
        this.listeners = [];

        this.bandeja.removeAll(true);
        this.aux.removeAll(true);

        // Destroy scene-root disposables (interactive draggables)
        for (const d of this.disposables) {
            try {
                d.destroy();
            } catch {
                /* noop */
            }
        }
        this.disposables = [];
    }

    /** Track a scene-root object so cleanup() destroys it. */
    protected own<T extends GameObjects.GameObject>(obj: T): T {
        this.disposables.push(obj);
        return obj;
    }

    /** Tracks an input listener so cleanup() can remove it automatically. */
    protected trackOn(
        emitter: { on: (ev: string, fn: (...a: unknown[]) => void) => void; off: (ev: string, fn: (...a: unknown[]) => void) => void },
        ev: string,
        fn: (...a: unknown[]) => void,
    ) {
        emitter.on(ev, fn);
        this.listeners.push({ emitter, ev, fn });
    }
}
