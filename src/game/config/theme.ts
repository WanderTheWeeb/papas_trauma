export const COLORS = {
    bg: 0x0b1622,
    bgDeep: 0x070e18,
    surface: 0x111e30,
    surfaceAlt: 0x162436,
    surfaceHi: 0x1d2e46,
    border: 0x2a3a55,
    borderSoft: 0x1a2840,
    success: 0x00c9b1,
    successDim: 0x008273,
    danger: 0xe74c5e,
    warning: 0xf5a623,
    text: 0xf2efe8,
    textMuted: 0x9bb0c7,
    textDim: 0x5c6f86,
    paper: 0xf2eede,
    paperShadow: 0xe6dfca,
    ink: 0x14202e,
    inkSoft: 0x3a4658,
} as const;

export const COLORS_HEX = {
    bg: '#0b1622',
    bgDeep: '#070e18',
    surface: '#111e30',
    surfaceAlt: '#162436',
    surfaceHi: '#1d2e46',
    border: '#2a3a55',
    borderSoft: '#1a2840',
    success: '#00c9b1',
    successDim: '#008273',
    danger: '#e74c5e',
    warning: '#f5a623',
    text: '#f2efe8',
    textMuted: '#9bb0c7',
    textDim: '#5c6f86',
    paper: '#f2eede',
    paperShadow: '#e6dfca',
    ink: '#14202e',
    inkSoft: '#3a4658',
} as const;

export const FONTS = {
    display: '"Fraunces", "Times New Roman", serif',
    sans:    '"IBM Plex Sans Condensed", system-ui, sans-serif',
    mono:    '"IBM Plex Mono", ui-monospace, monospace',
    body:    '"Lora", Georgia, serif',
    // legacy aliases (kept so existing scenes don't break)
    title:   '"Fraunces", serif',
    ui:      '"IBM Plex Sans Condensed", system-ui, sans-serif',
} as const;

// Editorial / surgical type system
export const TYPE = {
    // Display serif — for headlines and the one big number
    display:  { fontFamily: FONTS.display, fontSize: '180px', color: COLORS_HEX.text, fontStyle: '900' },
    h1:       { fontFamily: FONTS.display, fontSize: '88px',  color: COLORS_HEX.text, fontStyle: '600' },
    h2:       { fontFamily: FONTS.display, fontSize: '56px',  color: COLORS_HEX.text, fontStyle: '600' },
    h3:       { fontFamily: FONTS.display, fontSize: '34px',  color: COLORS_HEX.text, fontStyle: '500' },
    h4:       { fontFamily: FONTS.sans,    fontSize: '20px',  color: COLORS_HEX.text, fontStyle: '600' },
    // Mono — for instrument readouts, IDs, numerics
    mono:     { fontFamily: FONTS.mono,    fontSize: '13px',  color: COLORS_HEX.textMuted, fontStyle: '400' },
    monoLg:   { fontFamily: FONTS.mono,    fontSize: '24px',  color: COLORS_HEX.text,      fontStyle: '500' },
    monoXl:   { fontFamily: FONTS.mono,    fontSize: '64px',  color: COLORS_HEX.text,      fontStyle: '300' },
    // Small caps labels
    label:    { fontFamily: FONTS.sans,    fontSize: '11px',  color: COLORS_HEX.textDim, fontStyle: '600' },
    labelHi:  { fontFamily: FONTS.sans,    fontSize: '11px',  color: COLORS_HEX.success, fontStyle: '600' },
    // Body
    body:     { fontFamily: FONTS.body,    fontSize: '17px',  color: COLORS_HEX.text },
    bodyS:    { fontFamily: FONTS.body,    fontSize: '14px',  color: COLORS_HEX.textMuted },
    // UI text
    btn:      { fontFamily: FONTS.sans,    fontSize: '14px',  color: COLORS_HEX.text, fontStyle: '600' },
    chip:     { fontFamily: FONTS.sans,    fontSize: '14px',  color: COLORS_HEX.text, fontStyle: '500' },
    // Paper
    paperH:     { fontFamily: FONTS.display, fontSize: '18px', color: COLORS_HEX.ink,     fontStyle: '600' },
    paperBody:  { fontFamily: FONTS.body,    fontSize: '14px', color: COLORS_HEX.ink },
    paperLabel: { fontFamily: FONTS.sans,    fontSize: '10px', color: '#7a8294',          fontStyle: '600' },
    paperItem:  { fontFamily: FONTS.sans,    fontSize: '14px', color: COLORS_HEX.ink },
} as const;

// Letter-spacing helpers (Phaser doesn't expose CSS letter-spacing on Text;
// we apply it manually where needed via `.setLetterSpacing()` in Phaser 4)
export const TRACKING = {
    label: 2.4,   // small caps
    mono: 0.4,
} as const;
