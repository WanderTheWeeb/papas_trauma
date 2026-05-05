import { AUTO, Game, Scale } from 'phaser';
import { COLORS_HEX } from './config/theme';
import { GAME_HEIGHT, GAME_WIDTH } from './config/constants';
import { Boot } from './scenes/Boot';
import { Preloader } from './scenes/Preloader';
import { MainMenu } from './scenes/MainMenu';
import { ConsultaScene } from './scenes/ConsultaScene';

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
        ConsultaScene,
    ],
};

const StartGame = (parent: string) => new Game({ ...config, parent });

export default StartGame;
