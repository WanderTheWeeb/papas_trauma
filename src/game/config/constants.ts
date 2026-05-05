export const GAME_WIDTH = 1600;
export const GAME_HEIGHT = 900;

export const SCENES = {
    BOOT: 'Boot',
    PRELOADER: 'Preloader',
    MAIN_MENU: 'MainMenu',
    CONSULTA: 'ConsultaScene',
} as const;

export const EVENTS = {
    CURRENT_SCENE_READY: 'current-scene-ready',
    CASE_COMPLETED: 'case-completed',
} as const;
