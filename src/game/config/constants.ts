export const GAME_WIDTH = 1600;
export const GAME_HEIGHT = 900;

export const SCENES = {
    BOOT: 'Boot',
    PRELOADER: 'Preloader',
    MAIN_MENU: 'MainMenu',
    STATION_1: 'Station1_Order',
    STATION_2: 'Station2_Test',
    STATION_3: 'Station3_Sello',
    STATION_4: 'Station4_Therapy',
    EVALUATION: 'Evaluation',
} as const;

export const STATION_ORDER = [
    SCENES.STATION_1,
    SCENES.STATION_2,
    SCENES.STATION_3,
    SCENES.STATION_4,
] as const;

export const EVENTS = {
    CURRENT_SCENE_READY: 'current-scene-ready',
    CASE_COMPLETED: 'case-completed',
} as const;
