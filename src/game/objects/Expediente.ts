import { GameObjects, Geom, Scene } from 'phaser';
import { COLORS, COLORS_HEX, FONTS, TYPE } from '../config/theme';
import type { CasoClinico } from '../data/types';

export const EXPEDIENTE_W = 760;
export const EXPEDIENTE_H = 340;

/**
 * The clinical record sitting open on the desk. Stays visible at all times,
 * unlike the old TicketDrawer. Layout is horizontal, two-page-spread style:
 * left page = patient + factors, right page = exam + Dx/Rx (placeholders
 * until later stations fill them in).
 */
export class Expediente extends GameObjects.Container {
    private caso: CasoClinico;

    private factorsList!: GameObjects.Text;
    private maniobrasList!: GameObjects.Text;
    private diagnosticoText!: GameObjects.Text;
    private prescripcionText!: GameObjects.Text;
    private dirtyMarks!: GameObjects.Graphics;

    private factors: string[] = [];
    private maniobras: { nombre: string; resultado: 'positivo' | 'negativo' }[] = [];

    constructor(scene: Scene, x: number, y: number, caso: CasoClinico) {
        super(scene, x, y);
        this.caso = caso;

        this.buildPaper();

        scene.add.existing(this);
    }

    private buildPaper() {
        const scene = this.scene;
        const w = EXPEDIENTE_W;
        const h = EXPEDIENTE_H;

        // Drop shadow on the desk
        const shadow = scene.add
            .rectangle(8, 14, w, h, 0x000000, 0.55)
            .setOrigin(0.5);
        this.add(shadow);

        // Paper background
        const paper = scene.add
            .rectangle(0, 0, w, h, COLORS.paper)
            .setStrokeStyle(1, 0xc9bfa6);
        this.add(paper);

        // Center fold line (two-page spread)
        const fold = scene.add
            .rectangle(0, -h / 2 + 30, 1, h - 30, 0xc9bfa6, 0.6)
            .setOrigin(0.5, 0);
        this.add(fold);

        // Top punch holes (decorative)
        for (let i = 0; i < 3; i++) {
            const hx = -w / 2 + 60 + i * 60;
            this.add(scene.add.circle(hx, -h / 2 + 14, 4, COLORS.bgDeep, 0.55));
        }

        // Header band
        const headerBand = scene.add
            .rectangle(0, -h / 2 + 14, w - 24, 1, 0xb8a988)
            .setOrigin(0.5, 0);
        this.add(headerBand);

        const expLabel = scene.add
            .text(-w / 2 + 240, -h / 2 + 22, `EXPEDIENTE  ${this.caso.id.toString().padStart(3, '0')}`, {
                ...TYPE.paperLabel,
                fontSize: '11px',
            })
            .setOrigin(0, 0)
            .setLetterSpacing(2.4);
        this.add(expLabel);

        const dateLabel = scene.add
            .text(w / 2 - 24, -h / 2 + 22, 'INGRESO: HOY · 03:24', {
                ...TYPE.paperLabel,
                fontSize: '10px',
            })
            .setOrigin(1, 0)
            .setLetterSpacing(2);
        this.add(dateLabel);

        // ─── LEFT PAGE: paciente + factores ─────────────────
        const padX = 28;
        const colTop = -h / 2 + 56;
        const leftX = -w / 2 + padX;
        const leftW = w / 2 - padX - 16;

        // Section: Paciente
        this.section(leftX, colTop, 'PACIENTE', leftW);

        const patientLine = scene.add
            .text(leftX, colTop + 24, this.caso.paciente.nombre, {
                fontFamily: FONTS.display,
                fontSize: '20px',
                color: COLORS_HEX.ink,
                fontStyle: '600',
            })
            .setOrigin(0, 0);
        this.add(patientLine);

        const ocup = scene.add
            .text(leftX, colTop + 50, this.caso.paciente.ocupacion.toUpperCase(), {
                ...TYPE.paperLabel,
                fontSize: '11px',
            })
            .setOrigin(0, 0)
            .setLetterSpacing(2);
        this.add(ocup);

        // Section: Factores
        const facTop = colTop + 90;
        this.section(leftX, facTop, 'FACTORES DE RIESGO', leftW);

        this.factorsList = scene.add
            .text(leftX, facTop + 24, 'pendiente —', {
                fontFamily: FONTS.body,
                fontSize: '13px',
                color: COLORS_HEX.textDim,
                fontStyle: 'italic',
                wordWrap: { width: leftW },
                lineSpacing: 6,
            })
            .setOrigin(0, 0);
        this.add(this.factorsList);

        // ─── RIGHT PAGE: maniobras + Dx/Rx ──────────────────
        const rightX = 16;
        const rightW = w / 2 - padX - 16;

        this.section(rightX, colTop, 'EXPLORACIÓN / MANIOBRAS', rightW);
        this.maniobrasList = scene.add
            .text(rightX, colTop + 24, 'pendiente —', {
                fontFamily: FONTS.body,
                fontSize: '13px',
                color: COLORS_HEX.textDim,
                fontStyle: 'italic',
                wordWrap: { width: rightW },
                lineSpacing: 6,
            })
            .setOrigin(0, 0);
        this.add(this.maniobrasList);

        // Dx
        const dxTop = colTop + 130;
        this.section(rightX, dxTop, 'DIAGNÓSTICO', rightW);
        this.diagnosticoText = scene.add
            .text(rightX, dxTop + 24, '—', {
                fontFamily: FONTS.body,
                fontSize: '14px',
                color: COLORS_HEX.textDim,
                fontStyle: 'italic',
                wordWrap: { width: rightW },
            })
            .setOrigin(0, 0);
        this.add(this.diagnosticoText);

        // Rx
        const rxTop = dxTop + 70;
        this.section(rightX, rxTop, 'PRESCRIPCIÓN / DESTINO', rightW);
        this.prescripcionText = scene.add
            .text(rightX, rxTop + 24, '—', {
                fontFamily: FONTS.body,
                fontSize: '13px',
                color: COLORS_HEX.textDim,
                fontStyle: 'italic',
                wordWrap: { width: rightW },
            })
            .setOrigin(0, 0);
        this.add(this.prescripcionText);

        // Dirty marks layer (on top)
        this.dirtyMarks = scene.add.graphics();
        this.add(this.dirtyMarks);
    }

    private section(x: number, y: number, label: string, w: number) {
        const t = this.scene.add
            .text(x, y, label, { ...TYPE.paperLabel, fontSize: '10px' })
            .setOrigin(0, 0)
            .setLetterSpacing(2.4);
        this.add(t);
        const line = this.scene.add
            .rectangle(x, y + 14, w, 1, 0xc9bfa6)
            .setOrigin(0, 0);
        this.add(line);
    }

    // ─── public API ─────────────────────────────────────────
    private wrongFactors: string[] = [];

    addFactor(factor: string) {
        this.factors.push(factor);
        this.refreshFactorsList();
    }

    addFactorWrong(factor: string) {
        this.wrongFactors.push(factor);
        this.refreshFactorsList();
    }

    private refreshFactorsList() {
        const goodLines = this.factors.map(f => `+  ${f}`);
        const badLines = this.wrongFactors.map(f => `✕  ${f}`);
        const all = [...goodLines, ...badLines];
        if (all.length === 0) {
            this.factorsList.setText('pendiente —');
            this.factorsList.setStyle({ fontStyle: 'italic', color: COLORS_HEX.textDim });
            return;
        }
        this.factorsList.setText(all.join('\n'));
        this.factorsList.setStyle({ fontStyle: '500', color: COLORS_HEX.ink });
    }

    addManiobra(nombre: string, resultado: 'positivo' | 'negativo') {
        this.maniobras.push({ nombre, resultado });
        const lines = this.maniobras.map(m => {
            const sym = m.resultado === 'positivo' ? '(+)' : '(−)';
            return `•  ${m.nombre}  ${sym}`;
        });
        this.maniobrasList.setText(lines.join('\n'));
        this.maniobrasList.setStyle({ fontStyle: '500', color: COLORS_HEX.ink });
    }

    setDiagnostico(text: string) {
        this.diagnosticoText.setText(text);
        this.diagnosticoText.setStyle({ fontStyle: 'bold', color: COLORS_HEX.ink });
    }

    setPrescripcion(text: string) {
        this.prescripcionText.setText(text);
        this.prescripcionText.setStyle({ fontStyle: '500', color: COLORS_HEX.ink });
    }

    markDirty(localX: number, localY: number) {
        const r = 9 + Math.random() * 7;
        this.dirtyMarks.fillStyle(0x7a3a2a, 0.32);
        this.dirtyMarks.fillCircle(localX, localY, r);
        this.dirtyMarks.fillCircle(localX + r * 0.6, localY - r * 0.4, r * 0.5);
    }

    getBounds(): Geom.Rectangle {
        return new Geom.Rectangle(
            this.x - EXPEDIENTE_W / 2,
            this.y - EXPEDIENTE_H / 2,
            EXPEDIENTE_W,
            EXPEDIENTE_H,
        );
    }

    flashAccept() {
        const flash = this.scene.add
            .rectangle(this.x, this.y, EXPEDIENTE_W + 8, EXPEDIENTE_H + 8, COLORS.success, 0.18)
            .setDepth(1000);
        this.scene.tweens.add({
            targets: flash,
            alpha: 0,
            duration: 320,
            onComplete: () => flash.destroy(),
        });
    }

    flashReject() {
        const flash = this.scene.add
            .rectangle(this.x, this.y, EXPEDIENTE_W + 8, EXPEDIENTE_H + 8, COLORS.danger, 0.18)
            .setDepth(1000);
        this.scene.tweens.add({
            targets: flash,
            alpha: 0,
            duration: 320,
            onComplete: () => flash.destroy(),
        });
    }
}
