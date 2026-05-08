/**
 * Pacientes recurrentes de la clínica. Cada caso clínico está atado a un
 * personaje (vía `personajeId`) para que el sprite, voz, chitchat y
 * despedidas correspondan a su personalidad.
 */

export type PersonajeId = 'sans' | 'zombie' | 'pepsiman';

export type Mood = 'pain' | 'ok' | 'doubt' | 'thanks';

export interface PersonajeFarewells {
    excellent: Array<{ line: string; mood: Mood }>; // >= 90
    good: Array<{ line: string; mood: Mood }>;      // 75–89
    mid: Array<{ line: string; mood: Mood }>;       // 50–74
    bad: Array<{ line: string; mood: Mood }>;       // 20–49
    terrible: Array<{ line: string; mood: Mood }>;  // < 20
}

export interface Personaje {
    id: PersonajeId;
    /** Nombre que aparece en el expediente */
    nombre: string;
    /** Clave de la imagen precargada (Preloader) */
    spriteKey: string;
    /** Frecuencia base del beep al hablar (Hz) — para diferenciar voces */
    voiceFreq: number;
    /** Charla random durante la consulta */
    chitchat: string[];
    /** Cuando el doctor deja al paciente esperando */
    idleLines: string[];
    /** Cuando el doctor pasa el cursor encima del paciente un rato */
    hoverLines: string[];
    /** Cuando el doctor le hace click al paciente */
    pokeLines: string[];
    /** Despedida según puntaje final */
    farewells: PersonajeFarewells;
}

export const PERSONAJES: Record<PersonajeId, Personaje> = {
    // ─── SANS ────────────────────────────────────────────────
    // Esqueleto chistoso de hoodie azul. Puns de huesos, sarcasmo
    // existencial, voz aguda tipo Undertale.
    sans: {
        id: 'sans',
        nombre: 'sans',
        spriteKey: 'patient-sans',
        voiceFreq: 280,
        chitchat: [
            'doc, ¿cuánto cobra? estoy bone-broke',
            'tengo un esqueleto en mi clóset, literalmente',
            'esto me está poniendo bone-tired',
            '¿usted siente humerus de mí?',
            'le tengo un chiste de costillas pero da risa',
            'mi médula favorita es la espinal, claro',
            '¿sabe por qué los huesos no pelean? no tienen agallas',
            'soy un fan del rock… del cráneo',
            'tibia y peroné suena a banda de cumbia',
            'me crucé con un perro y me agarró por el fémur',
            'wow, qué hospital tan… animado',
            'le pago en silbidos doc',
            '¿este es el plan VIP o el normal?',
            'qué ambiente tan cálido. felicidades.',
            '¿hay sala de espera para los huesos también?',
            '¿siempre tarda así o es honor especial?',
            'qué bonita la maquinita esa… ¿pita por mí?',
            'doc, su café huele a esperanza muerta',
            '¿usted alguna vez piensa en el calcio?',
            'creo que solo soy marcador en una superficie',
            'doc, los huesos no sueñan… ¿o sí?',
            '¿qué pasa si me oxido?',
            'a veces siento que ya viví esto antes',
            'todos los días me levanto y nada tiene sentido',
            'creo que mi alma vive en el coxis',
            'doc, ¿usted puede tronarse los nudillos sin morir?',
            '¿es verdad que los humanos sí tienen sangre? qué loco',
            '¿la sopa es comida o bebida?',
            '¿usted sabe nadar? yo no. me hundo.',
            '¿el aire pesa? porque me cansa cargarlo',
        ],
        idleLines: [
            'doc, ¿se quedó dormido?',
            'sigo aquí ¿eh?',
            'tengo huesos pero también tengo tiempo',
            'doc, siento mucha calma… demasiada',
            '¿hola? me oye doc',
        ],
        hoverLines: [
            'deja de mirarme así doc',
            '¿algo en la cara? ah verdad, no tengo',
            'me incomodo si me ven mucho',
            '¿usted necesita lentes?',
        ],
        pokeLines: [
            'oye, no me toque sin permiso',
            '¿quién hace eso?',
            'doc, eso fue raro',
            'sin protocolo no hay manoseo',
            'auch (no me dolió pero igual)',
        ],
        farewells: {
            excellent: [
                { line: 'doc, eso fue impecable', mood: 'thanks' },
                { line: 'le voy a recomendar con mi familia', mood: 'thanks' },
                { line: 'y eso que somos puro hueso', mood: 'ok' },
            ],
            good: [
                { line: 'gracias doc, le confío mis huesos', mood: 'thanks' },
                { line: 'estuvo bien la consulta', mood: 'ok' },
            ],
            mid: [
                { line: 'estuvo… raro, pero bueno', mood: 'doubt' },
                { line: 'creo que sigo enfermo, ¿no?', mood: 'doubt' },
                { line: 'igual gracias supongo', mood: 'ok' },
            ],
            bad: [
                { line: 'doc… creo que esto no salió bien', mood: 'doubt' },
                { line: 'voy a buscar segunda opinión', mood: 'doubt' },
                { line: '¿usted siempre así o solo hoy?', mood: 'doubt' },
            ],
            terrible: [
                { line: 'doc, ¿quiere pasar un mal rato?', mood: 'pain' },
                { line: 'porque YO acabo de pasar uno', mood: 'pain' },
                { line: 'le pago en silbidos doc…', mood: 'doubt' },
                { line: 'silbidos de hueso', mood: 'pain' },
            ],
        },
    },

    // ─── ZOMBIE ──────────────────────────────────────────────
    // Zombie de Minecraft. Monosilábico, gruñón, lento. Habla bajo
    // y arrastrado. Voz grave.
    zombie: {
        id: 'zombie',
        nombre: 'Zombie',
        spriteKey: 'patient-zombie',
        voiceFreq: 140,
        chitchat: [
            'uuugh… hombro… mal',
            'doc… ¿hay aldeano para llevar?',
            'el sol me cansa… mucho',
            'mmgh… caminé toda la noche',
            'tengo… hambre… no de comer',
            'doc, huele rico aquí… como… cerebro',
            'se me cayó un brazo el martes… lo recogí',
            'antes minero… ahora… esto',
            '¿tiene wifi? mi grupo me ghostea',
            'el doctor anterior… me corrió a gritos',
            'me pican los gusanos… normal eso ¿no?',
            'creo que ya estoy muerto… ¿cuenta?',
            'mi esposa también es zombie… lindo matrimonio',
            'doc… ¿esto es seguro social?',
            'aaargh… (eso fue saludo)',
            'me caí 3 pisos… ni cosquillas',
            'la luz del sol me mata… literal',
            'tengo 200 años… o 12… no sé',
            '¿hay descuento por descomposición?',
            'doc, su olor a vivo me distrae',
            'mmm… cerebrito… digo, certificado',
            'el último doctor era un esqueleto chistoso',
            'no duermo… ya descansé bastante',
            'doc, ¿le sobra carne? la mía está vieja',
            'creo que me falta un ojo… o dos',
        ],
        idleLines: [
            'mmgh…',
            'doc… ¿sigue ahí?',
            'me empiezo a descomponer más',
            'aaargh…',
            'tengo todo el tiempo del mundo… créame',
        ],
        hoverLines: [
            'no… me… mire',
            '¿qué… ve?',
            'mmgh…',
            'ojos… raros usted',
        ],
        pokeLines: [
            'no me empuje… se me cae algo',
            'ay… ay… AY',
            'mmgh… eso… duele',
            'no… toque…',
            'se le va a quedar carne en la mano',
        ],
        farewells: {
            excellent: [
                { line: 'doc… usted… bueno', mood: 'thanks' },
                { line: 'le traigo aldeano de regalo', mood: 'thanks' },
                { line: 'mmgh… gracias…', mood: 'ok' },
            ],
            good: [
                { line: 'doc… aceptable', mood: 'ok' },
                { line: 'no me corrió a gritos… gracias', mood: 'thanks' },
            ],
            mid: [
                { line: 'mmgh… raro… pero bueno', mood: 'doubt' },
                { line: 'creo que sigo igual', mood: 'doubt' },
                { line: 'igual… vuelvo el martes', mood: 'ok' },
            ],
            bad: [
                { line: 'doc… esto no…', mood: 'doubt' },
                { line: 'voy con el necromante', mood: 'doubt' },
                { line: 'mmgh… molesto…', mood: 'pain' },
            ],
            terrible: [
                { line: 'aaaaaargh', mood: 'pain' },
                { line: 'doc… traer cerebro mío… de vuelta', mood: 'pain' },
                { line: 'mala… consulta…', mood: 'doubt' },
            ],
        },
    },

    // ─── PEPSIMAN ────────────────────────────────────────────
    // Héroe azul de acción de los 90s. Mudo: solo grita "PEPSI!" o
    // "PEPSIMAN!". Aparece corriendo, posa heroicamente, se estampa
    // contra muebles. Toda su comunicación es onomatopéyica/gestual.
    // Voz aguda y enérgica.
    pepsiman: {
        id: 'pepsiman',
        nombre: 'Pepsiman',
        spriteKey: 'patient-pepsiman',
        voiceFreq: 520,
        chitchat: [
            '¡PEPSI!',
            '¡PEPSIMAAAAN!',
            '¡PEEEPSIIII!',
            '*pose dramática*',
            '*flexiona los brazos*',
            '¡PEPSI… ¡PEPSI! ¡PEPSI!',
            '*señala dramáticamente al doctor*',
            'p… psssh… *abre una lata invisible*',
            '¡PEPSIMAN!',
            '*se tropieza con nada*',
            '¡PEPSI! (urgente)',
            '*corre en su lugar*',
            '*lanza una lata al aire y la atrapa*',
            'PSSSHHHH (sonido de lata destapándose)',
            '*hace lagartijas sobre el piso del consultorio*',
            '¡PEPSI! ¡PEPSI! ¡PEPSI!',
            '*mira al horizonte heroicamente*',
            'pepsi… pepsi… (susurro)',
            '*choca contra el escritorio sin querer*',
            '*se estira los hombros con ímpetu*',
            '¡PEPSIMAAAN! (con eco)',
            '*hace una voltereta improvisada*',
            'pep… si… (jadeando)',
            '*saluda militarmente*',
            '¡PEPSI! 🥤',
            '*posa con la mano en la frente, mirando al sol*',
            '*tropieza con el escritorio otra vez*',
            'PEPSI ¿ok?',
            '*intenta abrir una lata invisible y se rinde*',
            '¡PEPSIIIIII!',
        ],
        idleLines: [
            '*Pepsiman se inquieta*',
            '¿PEPSI…?',
            '*tamborilea sobre el escritorio*',
            '*hace estiramientos heroicos*',
            'pepsi… (impaciente)',
        ],
        hoverLines: [
            '¿PEPSI?',
            '*ladea la cabeza*',
            '*pose intimidante*',
            '¡PEPSIMAN!',
        ],
        pokeLines: [
            '¡PEPSI!',
            '¡AHHH-PEPSI!',
            '¡PEPSIMAAAN! (dolido)',
            '*retrocede dramáticamente*',
            '¡PSSSHH! (eso dolió)',
        ],
        farewells: {
            excellent: [
                { line: '¡PEPSI! ¡PEPSIMAN!', mood: 'thanks' },
                { line: '*deja una lata helada en el escritorio*', mood: 'thanks' },
                { line: '*pose heroica final*', mood: 'ok' },
            ],
            good: [
                { line: '¡PEPSI!', mood: 'thanks' },
                { line: '*pulgar arriba enérgico*', mood: 'ok' },
            ],
            mid: [
                { line: 'pepsi… ¿?', mood: 'doubt' },
                { line: '*pose insegura*', mood: 'doubt' },
                { line: '¿PEPSI? supongo', mood: 'ok' },
            ],
            bad: [
                { line: '*niega con la cabeza*', mood: 'doubt' },
                { line: 'pepsi… NO', mood: 'doubt' },
                { line: '*sale corriendo, choca con la puerta*', mood: 'doubt' },
            ],
            terrible: [
                { line: '¡PEPSI!! (indignado)', mood: 'pain' },
                { line: '*tira la lata al piso*', mood: 'pain' },
                { line: '*se va a Coca-Cola*', mood: 'pain' },
            ],
        },
    },
};

export function getPersonaje(id: PersonajeId): Personaje {
    return PERSONAJES[id];
}
