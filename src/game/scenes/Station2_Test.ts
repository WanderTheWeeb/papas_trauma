import { COLORS_HEX, TYPE } from '../config/theme';
import { GAME_HEIGHT, GAME_WIDTH, SCENES } from '../config/constants';
import { StationBase } from './StationBase';

export class Station2_Test extends StationBase {
    constructor() {
        super(SCENES.STATION_2);
        this.stationTitle = '2 · Exploración Física';
        this.nextSceneKey = SCENES.STATION_3;
    }

    protected buildStation() {
        this.add
            .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'Stub: maniobras + minijuego de timing', {
                ...TYPE.h3,
                color: COLORS_HEX.textMuted,
            })
            .setOrigin(0.5);
    }
}
