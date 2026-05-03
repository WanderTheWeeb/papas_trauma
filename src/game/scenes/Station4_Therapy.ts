import { COLORS_HEX, TYPE } from '../config/theme';
import { GAME_HEIGHT, GAME_WIDTH, SCENES } from '../config/constants';
import { StationBase } from './StationBase';

export class Station4_Therapy extends StationBase {
    constructor() {
        super(SCENES.STATION_4);
        this.stationTitle = '4 · Prescripción y Destino';
        this.nextSceneKey = SCENES.EVALUATION;
    }

    protected buildStation() {
        this.add
            .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'Stub: dispensador + dosis + bandeja', {
                ...TYPE.h3,
                color: COLORS_HEX.textMuted,
            })
            .setOrigin(0.5);
    }
}
