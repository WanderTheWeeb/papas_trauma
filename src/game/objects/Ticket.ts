import { GameObjects, Geom, Scene } from 'phaser';
import { COLORS, COLORS_HEX, TYPE } from '../config/theme';
import type { CasoClinico } from '../data/types';

export const TICKET_W = 460;
export const TICKET_H = 700;

export class Ticket extends GameObjects.Container {
    private bg: GameObjects.Rectangle;
    private dirtyMarks: GameObjects.Graphics;
    private factorTexts: GameObjects.Text[] = [];
    private maniobraTexts: GameObjects.Text[] = [];
    private diagnosticoText!: GameObjects.Text;
    private prescripcionText!: GameObjects.Text;
    private factorY = 0;
    private maniobraY = 0;
    private dirtyCount = 0;

    constructor(scene: Scene, x: number, y: number, caso: CasoClinico | null) {
        super(scene, x, y);

        // Soft drop shadow
        const shadow = scene.add
            .rectangle(6, 8, TICKET_W, TICKET_H, 0x000000, 0.35)
            .setOrigin(0.5);
        this.add(shadow);

        // Paper background
        this.bg = scene.add
            .rectangle(0, 0, TICKET_W, TICKET_H, COLORS.paper)
            .setStrokeStyle(2, COLORS.border);
        this.add(this.bg);

        // Header bar
        const header = scene.add
            .rectangle(0, -TICKET_H / 2 + 30, TICKET_W, 60, COLORS.surface);
        this.add(header);

        const headerText = scene.add
            .text(0, -TICKET_H / 2 + 30, 'TICKET CLÍNICO', {
                ...TYPE.h4,
                color: COLORS_HEX.success,
                fontSize: '18px',
            })
            .setOrigin(0.5);
        this.add(headerText);

        let y0 = -TICKET_H / 2 + 80;
        const padX = 24;
        const innerW = TICKET_W - padX * 2;

        // Patient + motivo
        if (caso) {
            const paciente = scene.add
                .text(-TICKET_W / 2 + padX, y0, caso.paciente.nombre, {
                    fontFamily: TYPE.h4.fontFamily,
                    fontSize: '17px',
                    color: COLORS_HEX.ink,
                    fontStyle: 'bold',
                })
                .setOrigin(0, 0);
            this.add(paciente);

            const ocupacion = scene.add
                .text(-TICKET_W / 2 + padX, y0 + 22, caso.paciente.ocupacion, {
                    ...TYPE.paperLabel,
                    fontSize: '12px',
                })
                .setOrigin(0, 0);
            this.add(ocupacion);
            y0 += 48;

            const motivo = scene.add
                .text(-TICKET_W / 2 + padX, y0, caso.motivo, {
                    ...TYPE.paperBody,
                    fontSize: '13px',
                    color: COLORS_HEX.inkSoft,
                    wordWrap: { width: innerW },
                    fontStyle: 'italic',
                })
                .setOrigin(0, 0);
            this.add(motivo);
            y0 += motivo.height + 16;
        } else {
            const empty = scene.add
                .text(0, y0, 'Sin caso cargado', {
                    ...TYPE.paperBody,
                    color: COLORS_HEX.danger,
                })
                .setOrigin(0.5, 0);
            this.add(empty);
            y0 += 30;
        }

        // ── Factores
        y0 = this.section(y0, 'Factores de riesgo');
        this.factorY = y0;
        y0 += 110;

        // ── Maniobras
        y0 = this.section(y0, 'Exploración / maniobras');
        this.maniobraY = y0;
        y0 += 110;

        // ── Diagnóstico
        y0 = this.section(y0, 'Diagnóstico');
        this.diagnosticoText = scene.add
            .text(-TICKET_W / 2 + padX, y0, '—', {
                ...TYPE.paperItem,
                fontSize: '15px',
                fontStyle: 'bold',
                wordWrap: { width: innerW },
            })
            .setOrigin(0, 0);
        this.add(this.diagnosticoText);
        y0 += 60;

        // ── Prescripción
        y0 = this.section(y0, 'Prescripción / destino');
        this.prescripcionText = scene.add
            .text(-TICKET_W / 2 + padX, y0, '—', {
                ...TYPE.paperItem,
                wordWrap: { width: innerW },
            })
            .setOrigin(0, 0);
        this.add(this.prescripcionText);

        // Dirty layer (on top of everything, below scroll-out)
        this.dirtyMarks = scene.add.graphics();
        this.add(this.dirtyMarks);

        scene.add.existing(this);
    }

    private section(y: number, label: string): number {
        const padX = 24;
        const innerW = TICKET_W - padX * 2;
        const line = this.scene.add
            .rectangle(0, y, innerW, 1, 0xc9bfa6)
            .setOrigin(0.5, 0);
        this.add(line);
        const text = this.scene.add
            .text(-TICKET_W / 2 + padX, y + 6, label.toUpperCase(), TYPE.paperLabel)
            .setOrigin(0, 0);
        this.add(text);
        return y + 28;
    }

    addFactor(factor: string) {
        const padX = 24;
        const t = this.scene.add
            .text(
                -TICKET_W / 2 + padX,
                this.factorY + this.factorTexts.length * 20,
                `+  ${factor}`,
                {
                    ...TYPE.paperItem,
                    fontSize: '14px',
                    color: COLORS_HEX.successDim,
                    fontStyle: 'bold',
                },
            )
            .setOrigin(0, 0);
        this.add(t);
        this.factorTexts.push(t);
    }

    addManiobra(nombre: string, resultado: 'positivo' | 'negativo') {
        const padX = 24;
        const color = resultado === 'positivo' ? COLORS_HEX.danger : COLORS_HEX.successDim;
        const symbol = resultado === 'positivo' ? '(+)' : '(−)';
        const t = this.scene.add
            .text(
                -TICKET_W / 2 + padX,
                this.maniobraY + this.maniobraTexts.length * 20,
                `• ${nombre}  ${symbol}`,
                {
                    ...TYPE.paperItem,
                    fontSize: '14px',
                    color,
                    fontStyle: 'bold',
                },
            )
            .setOrigin(0, 0);
        this.add(t);
        this.maniobraTexts.push(t);
    }

    setDiagnostico(text: string) {
        this.diagnosticoText.setText(text);
    }

    setPrescripcion(text: string) {
        this.prescripcionText.setText(text);
    }

    markDirty(localX: number, localY: number) {
        this.dirtyCount++;
        const r = 10 + Math.random() * 8;
        this.dirtyMarks.fillStyle(0x7a3a2a, 0.32);
        this.dirtyMarks.fillCircle(localX, localY, r);
        this.dirtyMarks.fillCircle(localX + r * 0.6, localY - r * 0.4, r * 0.5);
    }

    getBounds(): Geom.Rectangle {
        return new Geom.Rectangle(
            this.x - TICKET_W / 2,
            this.y - TICKET_H / 2,
            TICKET_W,
            TICKET_H,
        );
    }
}
