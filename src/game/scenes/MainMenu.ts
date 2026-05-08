import { GameObjects, Scene } from 'phaser';
import { EventBus } from '../EventBus';
import { COLORS, COLORS_HEX, FONTS, TYPE } from '../config/theme';
import { EVENTS, GAME_HEIGHT, GAME_WIDTH, SCENES } from '../config/constants';
import { GameState } from '../state/GameState';

/**
 * Menú "mixto": el chrome serio de papers-please convive con detalles
 * absurdos del universo del juego (WIFI: PEPSI-NET, los 3 pacientes
 * esperando con bocadillos, instrucciones disponibles).
 */
export class MainMenu extends Scene {
    private clockText?: GameObjects.Text;
    private clockSeconds = 23 * 3600 + 47 * 60; // arranca a las 23:47
    private clockEvent?: Phaser.Time.TimerEvent;
    private howToOverlay?: GameObjects.Container;
    private howToDim?: GameObjects.Rectangle;

    constructor() {
        super(SCENES.MAIN_MENU);
    }

    create() {
        this.cameras.main.setBackgroundColor(COLORS.bgDeep);

        this.drawAtmosphere();
        this.drawCornerChrome();
        this.drawTopMatter();
        this.drawCenterPlate();
        this.drawWaitingRoom();
        this.drawButtons();
        this.drawFooter();
        this.playEntrance();

        EventBus.emit(EVENTS.CURRENT_SCENE_READY, this);
    }

    // ─── background ──────────────────────────────────────────
    private drawAtmosphere() {
        if (this.textures.exists('bg-menu')) {
            this.add.image(0, 0, 'bg-menu').setOrigin(0, 0).setDisplaySize(GAME_WIDTH, GAME_HEIGHT);
        }
        const veil = this.add.graphics();
        veil.fillStyle(COLORS.bgDeep, 0.62);
        veil.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // Faint vignette bottom
        const vg = this.add.graphics();
        vg.fillStyle(0x000000, 0.4);
        vg.fillRect(0, GAME_HEIGHT - 280, GAME_WIDTH, 280);
    }

    // ─── corner ticks chrome ─────────────────────────────────
    private drawCornerChrome() {
        const m = 60;
        const lines = this.add.graphics();
        lines.lineStyle(1, COLORS.border, 1);
        lines.lineBetween(m, m, GAME_WIDTH - m, m);
        lines.lineBetween(m, GAME_HEIGHT - m, GAME_WIDTH - m, GAME_HEIGHT - m);

        const ticks = this.add.graphics();
        ticks.lineStyle(1, COLORS.success, 0.8);
        const t = 14;
        ticks.lineBetween(m, m, m + t, m);
        ticks.lineBetween(m, m, m, m + t);
        ticks.lineBetween(GAME_WIDTH - m, m, GAME_WIDTH - m - t, m);
        ticks.lineBetween(GAME_WIDTH - m, m, GAME_WIDTH - m, m + t);
        ticks.lineBetween(m, GAME_HEIGHT - m, m + t, GAME_HEIGHT - m);
        ticks.lineBetween(m, GAME_HEIGHT - m, m, GAME_HEIGHT - m - t);
        ticks.lineBetween(GAME_WIDTH - m, GAME_HEIGHT - m, GAME_WIDTH - m - t, GAME_HEIGHT - m);
        ticks.lineBetween(GAME_WIDTH - m, GAME_HEIGHT - m, GAME_WIDTH - m, GAME_HEIGHT - m - t);
    }

    // ─── top eyebrow strip ───────────────────────────────────
    private drawTopMatter() {
        const m = 60;

        // Brand mark — serio
        this.add
            .text(m + 16, m - 24, 'TS / ER · v0.5', {
                ...TYPE.mono,
                fontSize: '11px',
                color: COLORS_HEX.textMuted,
            })
            .setOrigin(0, 1);

        // Detalle absurdo: wifi del hospital
        this.add
            .text(m + 100, m - 24, '·  WIFI: PEPSI-NET (sin internet)', {
                ...TYPE.mono,
                fontSize: '11px',
                color: COLORS_HEX.textDim,
                fontStyle: 'italic',
            })
            .setOrigin(0, 1);

        // Reloj turno + fecha
        const dt = new Date();
        const dateStr = dt
            .toLocaleDateString('es-MX', {
                weekday: 'short',
                day: '2-digit',
                month: 'short',
            })
            .toUpperCase();

        this.clockText = this.add
            .text(GAME_WIDTH - m - 16, m - 24, `${this.clockLabel()}  ·  TURNO  ·  ${dateStr}`, {
                ...TYPE.label,
                fontSize: '11px',
                color: COLORS_HEX.textMuted,
            })
            .setOrigin(1, 1)
            .setLetterSpacing(2.4);

        // Reloj nocturno que avanza, con ocasional glitch
        this.clockEvent = this.time.addEvent({
            delay: 1000,
            loop: true,
            callback: () => {
                this.clockSeconds += 60;
                // 1 de cada 8 ticks se "salta" un minuto al revés (vibe glitchy)
                if (Math.random() < 0.12) this.clockSeconds -= 60;
                if (this.clockText) {
                    this.clockText.setText(`${this.clockLabel()}  ·  TURNO  ·  ${dateStr}`);
                }
            },
        });
    }

    private clockLabel(): string {
        const totalMinutes = Math.floor(this.clockSeconds / 60);
        const h = Math.floor(totalMinutes / 60) % 24;
        const m = totalMinutes % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    }

    // ─── center title plate ──────────────────────────────────
    private drawCenterPlate() {
        const cx = GAME_WIDTH / 2;
        const titleY = 200;

        // Eyebrow
        this.add
            .text(cx, titleY - 50, 'PAPA’S  ·  EMERGENCY ROOM EDITION', {
                ...TYPE.label,
                fontSize: '11px',
                color: COLORS_HEX.success,
            })
            .setOrigin(0.5)
            .setLetterSpacing(3);

        // Hairline above title
        this.add.rectangle(cx, titleY - 30, 80, 1, COLORS.border).setOrigin(0.5);

        // Big title
        this.add
            .text(cx, titleY + 20, 'TRAUMA STATION', {
                fontFamily: FONTS.display,
                fontSize: '92px',
                color: COLORS_HEX.text,
                fontStyle: '700',
            })
            .setOrigin(0.5);

        // Sub
        this.add
            .text(cx, titleY + 92, 'urgencias  ·  hombro  ·  pacientes muy raros', {
                fontFamily: FONTS.body,
                fontSize: '15px',
                color: COLORS_HEX.textMuted,
                fontStyle: 'italic',
            })
            .setOrigin(0.5)
            .setLetterSpacing(2);
    }

    // ─── waiting room: 3 pacientes en fila ───────────────────
    private drawWaitingRoom() {
        const cx = GAME_WIDTH / 2;
        const y = 470;

        // Eyebrow de la sala de espera
        this.add
            .text(cx, y - 90, 'EN COLA  ·  03  ·  HOY', {
                ...TYPE.label,
                fontSize: '11px',
                color: COLORS_HEX.textDim,
            })
            .setOrigin(0.5)
            .setLetterSpacing(3);

        // Hairline
        this.add.rectangle(cx, y - 70, 60, 1, COLORS.borderSoft).setOrigin(0.5);

        // 3 sprites en fila con bocadillos
        const slots: Array<{ key: string; quote: string; tilt: number }> = [
            { key: 'patient-sans', quote: '"le pago en silbidos doc"', tilt: -3 },
            { key: 'patient-zombie', quote: '"mmgh… hombro… mal"', tilt: 1 },
            { key: 'patient-pepsiman', quote: '"¡PEPSI!"', tilt: 4 },
        ];

        const slotW = 320;
        const startX = cx - slotW;

        slots.forEach((s, i) => {
            const sx = startX + i * slotW;
            const sy = y;

            // Pedestal
            const pedestal = this.add.graphics();
            pedestal.fillStyle(0x000000, 0.22);
            pedestal.fillEllipse(sx, sy + 6, 160, 18);

            if (this.textures.exists(s.key)) {
                const sprite = this.add.image(sx, sy, s.key).setOrigin(0.5, 1);
                const tex = sprite.texture.getSourceImage() as { width: number; height: number };
                const tw = tex.width || sprite.width;
                const th = tex.height || sprite.height;
                const scale = Math.min(150 / tw, 200 / th);
                sprite.setScale(scale);
                sprite.setAngle(s.tilt * 0.3);

                // Idle flotante leve, desfasado
                this.tweens.add({
                    targets: sprite,
                    y: sy - 4,
                    duration: 1700 + i * 150,
                    ease: 'Sine.inOut',
                    yoyo: true,
                    repeat: -1,
                });
            }

            // Bocadillo de papel
            const bx = sx;
            const by = sy - 240;
            const bw = 200;
            const bh = 50;
            const bubble = this.add.graphics();
            bubble.fillStyle(COLORS.paper, 0.92);
            bubble.fillRoundedRect(bx - bw / 2, by - bh / 2, bw, bh, 8);
            bubble.lineStyle(1, 0xc9bfa6, 0.55);
            bubble.strokeRoundedRect(bx - bw / 2, by - bh / 2, bw, bh, 8);
            bubble.fillTriangle(bx - 6, by + bh / 2, bx + 6, by + bh / 2, bx, by + bh / 2 + 10);

            this.add
                .text(bx, by, s.quote, {
                    fontFamily: FONTS.body,
                    fontSize: '12px',
                    color: COLORS_HEX.ink,
                    fontStyle: 'italic',
                    wordWrap: { width: bw - 20 },
                    align: 'center',
                })
                .setOrigin(0.5);
        });
    }

    // ─── buttons: empezar + cómo jugar ───────────────────────
    private drawButtons() {
        const cx = GAME_WIDTH / 2;
        const by = 770;

        // Botón principal
        this.makeButton({
            x: cx - 200,
            y: by,
            w: 360,
            h: 56,
            label: 'EMPEZAR TURNO',
            arrow: '→',
            primary: true,
            onClick: () => this.startConsulta(),
        });

        // Botón cómo jugar
        this.makeButton({
            x: cx + 200,
            y: by,
            w: 240,
            h: 56,
            label: 'CÓMO JUGAR',
            arrow: '?',
            primary: false,
            onClick: () => this.openHowTo(),
        });

        // Hint debajo
        this.add
            .text(cx, by + 50, 'un paciente a la vez · cuatro fases · un solo expediente', {
                ...TYPE.label,
                fontSize: '10px',
                color: COLORS_HEX.textDim,
            })
            .setOrigin(0.5)
            .setLetterSpacing(2.4);
    }

    private makeButton(opts: {
        x: number;
        y: number;
        w: number;
        h: number;
        label: string;
        arrow: string;
        primary: boolean;
        onClick: () => void;
    }) {
        const { x, y, w, h, label: labelTxt, arrow: arrowTxt, primary, onClick } = opts;

        const btn = this.add.container(x, y);
        const bg = this.add
            .rectangle(0, 0, w, h, COLORS.surface, 0.85)
            .setStrokeStyle(1, COLORS.border);
        const ring = this.add.graphics();
        const ringColor = primary ? COLORS.success : COLORS.border;
        const drawRing = (color: number, alpha = 1) => {
            ring.clear();
            ring.lineStyle(1, color, alpha);
            const t = 10;
            ring.lineBetween(-w / 2, -h / 2, -w / 2 + t, -h / 2);
            ring.lineBetween(-w / 2, -h / 2, -w / 2, -h / 2 + t);
            ring.lineBetween(w / 2, -h / 2, w / 2 - t, -h / 2);
            ring.lineBetween(w / 2, -h / 2, w / 2, -h / 2 + t);
            ring.lineBetween(-w / 2, h / 2, -w / 2 + t, h / 2);
            ring.lineBetween(-w / 2, h / 2, -w / 2, h / 2 - t);
            ring.lineBetween(w / 2, h / 2, w / 2 - t, h / 2);
            ring.lineBetween(w / 2, h / 2, w / 2, h / 2 - t);
        };
        drawRing(ringColor, primary ? 0.7 : 0.5);

        const label = this.add
            .text(-w / 2 + 28, 0, labelTxt, {
                ...TYPE.label,
                fontSize: '13px',
                color: COLORS_HEX.text,
            })
            .setOrigin(0, 0.5)
            .setLetterSpacing(3);

        const arrow = this.add
            .text(w / 2 - 28, 0, arrowTxt, {
                fontFamily: FONTS.mono,
                fontSize: '24px',
                color: primary ? COLORS_HEX.success : COLORS_HEX.textMuted,
                fontStyle: '300',
            })
            .setOrigin(1, 0.5);

        const sep = this.add.rectangle(w / 2 - 70, -h / 2 + 14, 1, h - 28, COLORS.borderSoft).setOrigin(0, 0);

        btn.add([bg, ring, label, sep, arrow]);
        btn.setSize(w, h).setInteractive({ useHandCursor: true });

        btn.on('pointerover', () => {
            bg.setFillStyle(COLORS.surfaceAlt, 0.95);
            bg.setStrokeStyle(1, primary ? COLORS.success : COLORS.text);
            label.setColor(primary ? COLORS_HEX.success : COLORS_HEX.text);
            drawRing(primary ? COLORS.success : COLORS.text, 1);
            this.tweens.add({ targets: arrow, x: w / 2 - 22, duration: 180, ease: 'Sine.out' });
        });
        btn.on('pointerout', () => {
            bg.setFillStyle(COLORS.surface, 0.85);
            bg.setStrokeStyle(1, COLORS.border);
            label.setColor(COLORS_HEX.text);
            drawRing(ringColor, primary ? 0.7 : 0.5);
            this.tweens.add({ targets: arrow, x: w / 2 - 28, duration: 180, ease: 'Sine.out' });
        });
        btn.on('pointerdown', onClick);

        if (primary) {
            this.tweens.add({
                targets: btn,
                scaleX: { from: 1, to: 1.02 },
                scaleY: { from: 1, to: 1.02 },
                duration: 1400,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.inOut',
            });
        }
    }

    // ─── how-to overlay ──────────────────────────────────────
    private openHowTo() {
        if (this.howToOverlay) return;

        const dim = this.add
            .rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0)
            .setOrigin(0)
            .setDepth(4000)
            .setInteractive();
        this.tweens.add({ targets: dim, alpha: 0.65, duration: 220 });
        this.howToDim = dim;

        const cx = GAME_WIDTH / 2;
        const cy = GAME_HEIGHT / 2;
        const w = 880;
        const h = 700;

        const overlay = this.add.container(cx, cy).setDepth(4001);
        this.howToOverlay = overlay;

        const card = this.add.graphics();
        card.fillStyle(COLORS.paper, 0.98);
        card.fillRoundedRect(-w / 2, -h / 2, w, h, 14);
        card.lineStyle(1, 0xc9bfa6, 1);
        card.strokeRoundedRect(-w / 2, -h / 2, w, h, 14);
        overlay.add(card);

        // Header
        overlay.add(
            this.add
                .text(0, -h / 2 + 32, 'CÓMO JUGAR', {
                    ...TYPE.paperLabel,
                    fontSize: '11px',
                    color: '#9a9080',
                })
                .setOrigin(0.5, 0)
                .setLetterSpacing(3),
        );
        overlay.add(this.add.rectangle(0, -h / 2 + 56, 60, 1, 0xc9bfa6).setOrigin(0.5));

        overlay.add(
            this.add
                .text(0, -h / 2 + 80, 'eres el doctor del turno nocturno', {
                    fontFamily: FONTS.display,
                    fontSize: '24px',
                    color: COLORS_HEX.ink,
                    fontStyle: '700',
                })
                .setOrigin(0.5, 0),
        );

        // Cuerpo: 4 fases + tips
        const sections: Array<{ tag: string; title: string; body: string }> = [
            {
                tag: '01',
                title: 'RECEPCIÓN',
                body:
                    'Lee lo que dice el paciente y arrastra al expediente solo las tarjetas que sean factores de riesgo reales del caso. Las equivocadas se quedan pegadas y manchan tu expediente — escoge bien.',
            },
            {
                tag: '02',
                title: 'EXPLORACIÓN FÍSICA',
                body:
                    'Arrastra cada maniobra (Hawkins, Neer, Jobe, etc.) al hombro del paciente y atina el timing. No todas las maniobras aplican a todos los casos — usa solo las que correspondan.',
            },
            {
                tag: '03',
                title: 'SELLADO DEL DIAGNÓSTICO',
                body:
                    'Con base en lo que viste, sella un diagnóstico sobre el expediente. Solo uno. Si fallas, se queda registrado.',
            },
            {
                tag: '04',
                title: 'PRESCRIPCIÓN  ·  DESTINO',
                body:
                    'Receta o refiere. Algunos pacientes ameritan referencia urgente a ortopedia, otros van bien con fisioterapia. Ajusta la dosis con cuidado.',
            },
        ];

        const startY = -h / 2 + 130;
        sections.forEach((s, i) => {
            const ry = startY + i * 110;
            // Tag
            overlay.add(
                this.add
                    .text(-w / 2 + 40, ry, s.tag, {
                        fontFamily: FONTS.display,
                        fontSize: '32px',
                        color: COLORS_HEX.successDim,
                        fontStyle: '700',
                    })
                    .setOrigin(0, 0),
            );
            overlay.add(
                this.add
                    .text(-w / 2 + 110, ry + 6, s.title, {
                        fontFamily: FONTS.display,
                        fontSize: '15px',
                        color: COLORS_HEX.ink,
                        fontStyle: '700',
                    })
                    .setOrigin(0, 0)
                    .setLetterSpacing(2.4),
            );
            overlay.add(
                this.add
                    .text(-w / 2 + 110, ry + 32, s.body, {
                        fontFamily: FONTS.body,
                        fontSize: '13px',
                        color: '#3a3528',
                        wordWrap: { width: w - 160 },
                        lineSpacing: 4,
                    })
                    .setOrigin(0, 0),
            );
        });

        // Tip especial: chat
        const tipY = startY + 4 * 110 + 8;
        overlay.add(this.add.rectangle(0, tipY, w - 80, 1, 0xc9bfa6, 0.6).setOrigin(0.5));
        overlay.add(
            this.add
                .text(-w / 2 + 40, tipY + 16, 'TIP', {
                    ...TYPE.paperLabel,
                    fontSize: '10px',
                    color: COLORS_HEX.successDim,
                })
                .setOrigin(0, 0)
                .setLetterSpacing(2.4),
        );
        overlay.add(
            this.add
                .text(
                    -w / 2 + 80,
                    tipY + 14,
                    'el paciente habla mucho. lee la TRANSCRIPCIÓN: las líneas marcadas con ✦ son pistas clínicas reales, el resto es ruido (chistes, quejas, posturas heroicas).',
                    {
                        fontFamily: FONTS.body,
                        fontSize: '13px',
                        color: '#3a3528',
                        wordWrap: { width: w - 200 },
                        lineSpacing: 4,
                        fontStyle: 'italic',
                    },
                )
                .setOrigin(0, 0),
        );

        // Botón cerrar
        const closeBtn = this.add.container(0, h / 2 - 40);
        const closeBg = this.add
            .rectangle(0, 0, 220, 38, COLORS.bgDeep, 1)
            .setStrokeStyle(1, COLORS.border);
        const closeLbl = this.add
            .text(0, 0, 'ENTENDIDO', {
                ...TYPE.label,
                fontSize: '11px',
                color: COLORS_HEX.text,
            })
            .setOrigin(0.5)
            .setLetterSpacing(3);
        closeBtn.add([closeBg, closeLbl]);
        closeBtn.setSize(220, 38).setInteractive({ useHandCursor: true });
        closeBtn.on('pointerover', () => {
            closeBg.setStrokeStyle(1, COLORS.success);
            closeLbl.setColor(COLORS_HEX.success);
        });
        closeBtn.on('pointerout', () => {
            closeBg.setStrokeStyle(1, COLORS.border);
            closeLbl.setColor(COLORS_HEX.text);
        });
        closeBtn.on('pointerdown', () => this.closeHowTo());
        overlay.add(closeBtn);

        // Cerrar con click en el dim o con ESC
        dim.on('pointerdown', () => this.closeHowTo());
        if (this.input.keyboard) {
            this.input.keyboard.once('keydown-ESC', () => this.closeHowTo());
        }

        // Pop-in
        overlay.setScale(0.92).setAlpha(0);
        this.tweens.add({
            targets: overlay,
            scale: 1,
            alpha: 1,
            duration: 240,
            ease: 'Back.out',
        });
    }

    private closeHowTo() {
        if (!this.howToOverlay) return;
        const overlay = this.howToOverlay;
        const dim = this.howToDim;
        this.howToOverlay = undefined;
        this.howToDim = undefined;
        this.tweens.add({
            targets: overlay,
            alpha: 0,
            scale: 0.96,
            duration: 180,
            onComplete: () => overlay.destroy(),
        });
        if (dim) {
            this.tweens.add({
                targets: dim,
                alpha: 0,
                duration: 180,
                onComplete: () => dim.destroy(),
            });
        }
    }

    private startConsulta() {
        if (this.howToOverlay) return; // no arranques con el modal abierto
        GameState.startNewCase(0);
        this.cameras.main.fadeOut(280, 7, 14, 24);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start(SCENES.CONSULTA);
        });
    }

    // ─── footer ──────────────────────────────────────────────
    private drawFooter() {
        const m = 60;
        const gutterY = GAME_HEIGHT - m + 14;

        this.add
            .text(m + 16, gutterY, 'PAPA’S TRAUMA STATION  /  ER EDITION', {
                ...TYPE.label,
                fontSize: '10px',
                color: COLORS_HEX.textDim,
            })
            .setOrigin(0, 0)
            .setLetterSpacing(2.4);

        this.add
            .text(GAME_WIDTH / 2, gutterY, '·  un proyecto editorial-quirúrgico  ·', {
                ...TYPE.bodyS,
                fontSize: '10px',
                color: COLORS_HEX.textDim,
                fontStyle: 'italic',
            })
            .setOrigin(0.5, 0);

        this.add
            .text(GAME_WIDTH - m - 16, gutterY, 'PRESS  ·  ENTER', {
                ...TYPE.mono,
                fontSize: '10px',
                color: COLORS_HEX.textDim,
            })
            .setOrigin(1, 0);

        // Atajos de teclado
        if (this.input.keyboard) {
            this.input.keyboard.on('keydown-ENTER', () => {
                if (!this.howToOverlay) this.startConsulta();
            });
            this.input.keyboard.on('keydown-SPACE', () => {
                if (!this.howToOverlay) this.startConsulta();
            });
            this.input.keyboard.on('keydown-H', () => {
                if (!this.howToOverlay) this.openHowTo();
            });
        }
    }

    // ─── entrance animation ──────────────────────────────────
    private playEntrance() {
        this.cameras.main.fadeIn(360, 7, 14, 24);

        const all = this.children.list as GameObjects.GameObject[];
        all.forEach((child, i) => {
            const c = child as GameObjects.Components.Alpha & GameObjects.GameObject;
            if (typeof c.setAlpha !== 'function') return;
            c.setAlpha(0);
            this.tweens.add({
                targets: c,
                alpha: 1,
                duration: 360,
                delay: 80 + i * 6,
                ease: 'Sine.out',
            });
        });
    }
}
