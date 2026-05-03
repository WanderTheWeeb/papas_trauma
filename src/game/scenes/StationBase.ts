import { GameObjects, Scene } from 'phaser';
import { COLORS, COLORS_HEX, TYPE } from '../config/theme';
import { EVENTS, GAME_HEIGHT, GAME_WIDTH, SCENES, STATION_ORDER } from '../config/constants';
import { EventBus } from '../EventBus';
import { GameState } from '../state/GameState';

export abstract class StationBase extends Scene {
    protected stationTitle = 'Station';
    protected nextSceneKey: string | null = null;
    protected nextButton?: { container: GameObjects.Container; setEnabled: (b: boolean) => void };

    create() {
        this.cameras.main.setBackgroundColor(COLORS.bg);
        this.drawBackdrop();
        this.drawHeader();
        this.drawStepIndicator();
        this.drawNextButton();
        this.buildStation();
        EventBus.emit(EVENTS.CURRENT_SCENE_READY, this);
    }

    protected abstract buildStation(): void;

    private drawBackdrop() {
        // subtle grid / gradient
        const g = this.add.graphics();
        g.fillGradientStyle(COLORS.bgDeep, COLORS.bgDeep, COLORS.bg, COLORS.bg, 1);
        g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // decorative top glow
        const glow = this.add.graphics();
        glow.fillStyle(COLORS.success, 0.04);
        glow.fillCircle(GAME_WIDTH / 2, -200, 600);
    }

    private drawHeader() {
        // Top bar
        this.add.rectangle(0, 0, GAME_WIDTH, 80, COLORS.surface).setOrigin(0, 0);
        this.add.rectangle(0, 80, GAME_WIDTH, 2, COLORS.success).setOrigin(0, 0);

        // Brand
        this.add
            .text(40, 40, "Papa's Trauma Station", {
                ...TYPE.h4,
                fontSize: '20px',
                color: COLORS_HEX.success,
            })
            .setOrigin(0, 0.5);

        // Station title
        this.add
            .text(GAME_WIDTH / 2, 40, this.stationTitle, {
                ...TYPE.h3,
                fontSize: '24px',
            })
            .setOrigin(0.5);

        // Case info (right)
        const caso = GameState.getCaso();
        const txt = caso
            ? `Caso #${caso.id} · ${caso.paciente.nombre}`
            : 'Sin caso cargado';
        this.add
            .text(GAME_WIDTH - 40, 40, txt, {
                ...TYPE.label,
                fontSize: '14px',
                color: COLORS_HEX.textMuted,
            })
            .setOrigin(1, 0.5);
    }

    private drawStepIndicator() {
        const stationKey = this.scene.key;
        const idx = STATION_ORDER.indexOf(stationKey as typeof STATION_ORDER[number]);
        if (idx < 0) return;

        const stepW = 60;
        const gap = 16;
        const totalW = STATION_ORDER.length * stepW + (STATION_ORDER.length - 1) * gap;
        const startX = (GAME_WIDTH - totalW) / 2;
        const y = 100;

        STATION_ORDER.forEach((_, i) => {
            const x = startX + i * (stepW + gap);
            const active = i <= idx;
            const color = active ? COLORS.success : COLORS.border;
            this.add.rectangle(x, y, stepW, 4, color).setOrigin(0, 0.5);
        });
    }

    private drawNextButton() {
        if (!this.nextSceneKey) return;
        const x = GAME_WIDTH - 140;
        const y = GAME_HEIGHT - 56;
        const w = 220;
        const h = 64;

        const container = this.add.container(x, y);
        const bg = this.add
            .rectangle(0, 0, w, h, COLORS.success)
            .setInteractive({ useHandCursor: true });
        const label = this.add
            .text(0, 0, 'Continuar  →', {
                ...TYPE.btn,
                color: COLORS_HEX.bgDeep,
            })
            .setOrigin(0.5);
        container.add([bg, label]);

        bg.on('pointerover', () => bg.setFillStyle(0x33d9c3));
        bg.on('pointerout', () => bg.setFillStyle(COLORS.success));
        bg.on('pointerdown', () => this.scene.start(this.nextSceneKey!));

        this.nextButton = {
            container,
            setEnabled: (b: boolean) => {
                bg.setAlpha(b ? 1 : 0.4);
                if (b) bg.setInteractive({ useHandCursor: true });
                else bg.disableInteractive();
            },
        };
    }
}
