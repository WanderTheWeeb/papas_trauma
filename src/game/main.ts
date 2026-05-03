import { AUTO, Game, Scale } from 'phaser';
import { COLORS_HEX } from './config/theme';
import { GAME_HEIGHT, GAME_WIDTH } from './config/constants';
import { Boot } from './scenes/Boot';
import { Preloader } from './scenes/Preloader';
import { MainMenu } from './scenes/MainMenu';
import { Station1_Order } from './scenes/Station1_Order';
import { Station2_Test } from './scenes/Station2_Test';
import { Station3_Sello } from './scenes/Station3_Sello';
import { Station4_Therapy } from './scenes/Station4_Therapy';
import { Evaluation } from './scenes/Evaluation';

const config: Phaser.Types.Core.GameConfig = {
    type: AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent: 'game-container',
    backgroundColor: COLORS_HEX.bg,
    scale: {
        mode: Scale.FIT,
        autoCenter: Scale.CENTER_BOTH,
        width: GAME_WIDTH,
        height: GAME_HEIGHT,
    },
    render: {
        antialias: true,
        roundPixels: false,
    },
    scene: [
        Boot,
        Preloader,
        MainMenu,
        Station1_Order,
        Station2_Test,
        Station3_Sello,
        Station4_Therapy,
        Evaluation,
    ],
};

const StartGame = (parent: string) => new Game({ ...config, parent });

export default StartGame;
