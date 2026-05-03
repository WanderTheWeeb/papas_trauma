export const COLORS = {
    bg: 0x0b1622,
    bgDeep: 0x070e18,
    surface: 0x111e30,
    surfaceAlt: 0x162436,
    surfaceHi: 0x1d2e46,
    border: 0x2a3a55,
    success: 0x00c9b1,
    successDim: 0x008273,
    danger: 0xe74c5e,
    warning: 0xf5a623,
    text: 0xffffff,
    textMuted: 0x9bb0c7,
    paper: 0xfaf6ec,
    paperShadow: 0xe6dfca,
    ink: 0x1a2236,
    inkSoft: 0x3a4658,
} as const;

export const COLORS_HEX = {
    bg: '#0b1622',
    bgDeep: '#070e18',
    surface: '#111e30',
    surfaceAlt: '#162436',
    surfaceHi: '#1d2e46',
    border: '#2a3a55',
    success: '#00c9b1',
    successDim: '#008273',
    danger: '#e74c5e',
    warning: '#f5a623',
    text: '#ffffff',
    textMuted: '#9bb0c7',
    paper: '#faf6ec',
    paperShadow: '#e6dfca',
    ink: '#1a2236',
    inkSoft: '#3a4658',
} as const;

export const FONTS = {
    title: '"Outfit", system-ui, sans-serif',
    body: '"Lora", Georgia, serif',
    ui: '"Outfit", system-ui, sans-serif',
} as const;

export const TYPE = {
    h1:    { fontFamily: FONTS.title, fontSize: '72px', color: COLORS_HEX.text,      fontStyle: 'bold' },
    h2:    { fontFamily: FONTS.title, fontSize: '40px', color: COLORS_HEX.text,      fontStyle: 'bold' },
    h3:    { fontFamily: FONTS.title, fontSize: '28px', color: COLORS_HEX.text,      fontStyle: 'bold' },
    h4:    { fontFamily: FONTS.title, fontSize: '22px', color: COLORS_HEX.text,      fontStyle: 'bold' },
    label: { fontFamily: FONTS.ui,    fontSize: '13px', color: COLORS_HEX.textMuted, fontStyle: 'bold' },
    body:  { fontFamily: FONTS.body,  fontSize: '18px', color: COLORS_HEX.text },
    bodyS: { fontFamily: FONTS.body,  fontSize: '15px', color: COLORS_HEX.textMuted },
    btn:   { fontFamily: FONTS.ui,    fontSize: '20px', color: COLORS_HEX.text,      fontStyle: 'bold' },
    chip:  { fontFamily: FONTS.ui,    fontSize: '15px', color: COLORS_HEX.text,      fontStyle: 'bold' },
    paperH: { fontFamily: FONTS.title, fontSize: '16px', color: COLORS_HEX.successDim, fontStyle: 'bold' },
    paperBody: { fontFamily: FONTS.body, fontSize: '14px', color: COLORS_HEX.ink },
    paperLabel: { fontFamily: FONTS.ui, fontSize: '11px', color: '#7a8294', fontStyle: 'bold' },
    paperItem: { fontFamily: FONTS.ui, fontSize: '14px', color: COLORS_HEX.ink },
} as const;
