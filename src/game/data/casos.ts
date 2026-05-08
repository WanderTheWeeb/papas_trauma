import type { CasoClinico } from './types';

/**
 * Cada caso está atado a un personaje (Sans / Zombie / Pepsiman).
 * El motivo está escrito en la voz del personaje pero contiene toda la
 * información clínica relevante (timing, agravantes, fallas a tratamiento,
 * estudios previos). Las pistas son frases que el paciente puede soltar
 * durante la consulta y que confirman uno de los factores de riesgo.
 *  - Sans     → tendinopatía recurrente del manguito (paciente frecuente)
 *  - Zombie   → desgarros crónicos / degeneración (descomposición progresiva)
 *  - Pepsiman → trauma agudo, deportivo, y DM2 ocupacional
 */
export const CASOS_CLINICOS: CasoClinico[] = [
    {
        id: 1,
        personajeId: 'sans',
        paciente: { nombre: 'sans', ocupacion: 'Vigilante de bosque (tiempo parcial)' },
        motivo:
            'doc, llevo como 3 meses que el hombro derecho me arde más y más. alcanzar mis discos de huesos en la repisa de arriba es un drama, y dormir de ese lado ni hablar — me despierto cada hora.',
        factoresRiesgo: ['Edad > 50', 'Movimientos repetitivos'],
        maniobras: [
            { id: 'hawkins', resultado: 'positivo' },
            { id: 'arco', resultado: 'positivo' },
        ],
        rom: 'Pasivo completo limitado por dolor. Activo disminuido. Arco doloroso 60–120°.',
        diagnosticoCorrecto: 'Tendinopatía del manguito rotador',
        manejoCorrecto: 'Fisioterapia con ejercicios progresivos',
        referenciaUrgente: false,
        feedback:
            'La tendinopatía del manguito es la causa más común de dolor de hombro (~65%). El ROM pasivo completo la distingue de la capsulitis adhesiva.',
        pistas: [
            'doc, ya tengo mis añitos, no soy un esqueleto adolescente',
            'todo el día estoy alzando cosas en mi turno de vigilante, todo el día',
            'me arde más cuando alzo el brazo arriba de la cabeza',
            'doc, en mi puesto reviso lámparas altas cada cinco minutos, llevo años así',
            'le confieso: si fuera nuevecito esto no pasaría, pero ya soy un huesote viejo',
        ],
    },
    {
        id: 2,
        personajeId: 'pepsiman',
        paciente: { nombre: 'Pepsiman', ocupacion: 'Repartidor heroico de Pepsi' },
        motivo:
            '*entra corriendo y choca contra el escritorio* ¡PEPSI! *señala dramáticamente el hombro izquierdo* ¡PEPSIMAAAN! *mima cargar un six-pack gigante, estamparse contra una pared, e intenta levantar el brazo… falla*',
        factoresRiesgo: ['Inicio traumático', 'Esfuerzo agudo'],
        maniobras: [
            { id: 'droparm', resultado: 'positivo' },
            { id: 'lag_re', resultado: 'positivo' },
        ],
        rom: 'Movimiento activo abolido. Atrofia leve en fosa supraespinosa. Fuerza 2/5 en abducción.',
        diagnosticoCorrecto: 'Desgarro completo del manguito rotador',
        manejoCorrecto: 'Referencia urgente a ortopedia',
        referenciaUrgente: true,
        feedback:
            'Drop arm (LR+ 3.3) y lag en rotación externa (LR+ 7.2) sugieren desgarro completo. Pacientes activos con desgarros traumáticos agudos se benefician de cirugía temprana.',
        pistas: [
            '¡PEPSI! *señala el hombro y mima cargar algo enorme*',
            '*mima un golpe seco contra una pared* ¡PSSSHH!',
            'pepsi… *intenta levantar el brazo y falla dramáticamente*',
            '*saca un calendario y marca con dedo: hace 2 días*',
            '¡PEPSIMAAAN! *flexiona el otro brazo enseñando que ese sí jala*',
            '*hace ademán de "pum-explosión" en el hombro izquierdo*',
        ],
    },
    {
        id: 3,
        personajeId: 'pepsiman',
        paciente: { nombre: 'Pepsiman', ocupacion: 'Embajador de marca (DM2 ocupacional)' },
        motivo:
            'pepsi… *entra ladeado, se palmea el estómago, señala el hombro derecho* ¡PEPSI! *intenta rotar el brazo y se queda atorado a la mitad* 6 meses… cada vez peor… *muestra una pulsera médica que dice DIABETES*',
        factoresRiesgo: ['Diabetes Mellitus 2', 'Edad > 50'],
        maniobras: [{ id: 'neer', resultado: 'positivo' }],
        rom:
            'Limitación marcada activa y pasiva en todas las direcciones, especialmente rotación externa (20° vs 90° contralateral).',
        diagnosticoCorrecto: 'Capsulitis adhesiva (hombro congelado)',
        manejoCorrecto: 'Manejo conservador con fisioterapia',
        referenciaUrgente: false,
        feedback:
            'La restricción del movimiento pasivo global en presencia de DM2 es patognomónica de capsulitis adhesiva. Esta población responde mal a infiltraciones intempestivas y bien a movilización progresiva.',
        pistas: [
            '*señala su frasco de Pepsi y se da palmadas al estómago* PEPSI… mucho',
            '*intenta rotar el brazo y se queda atorado a la mitad*',
            '¡PEPSIMAN! *muestra una pulsera médica que dice DIABETES*',
            '*saca su tarjeta de embajador con foto de hace 20 años, claramente más viejo ahora*',
            'pepsi… *imita probar a hacer movimientos cotidianos y todos están limitados*',
            '*sostiene seis latas y enseña cómo TODAS las posiciones le cuestan*',
        ],
    },
    {
        id: 4,
        personajeId: 'sans',
        paciente: { nombre: 'sans', ocupacion: 'Comediante de stand-up nocturno' },
        motivo:
            'doc, en mi otro trabajo pinto techos los fines de semana — llevo 8 meses con el hombro derecho fastidiando. ya tomé como 4 semanas de los AINEs que me dieron y nada, ni cosquillas. mi crítico me dice que estoy oxidado.',
        factoresRiesgo: ['Movimientos repetitivos', 'Falla a tratamiento inicial'],
        maniobras: [
            { id: 'jobe', resultado: 'positivo' },
            { id: 'hawkins', resultado: 'positivo' },
        ],
        rom: 'Arco doloroso activo. Pasivo completo. Esclerosis leve del acromion en Rx.',
        diagnosticoCorrecto: 'Tendinopatía del manguito rotador',
        manejoCorrecto: 'Fisioterapia con ejercicios progresivos',
        referenciaUrgente: false,
        feedback:
            'La fisioterapia con ejercicios progresivos (GRASP trial) es el tratamiento de primera línea avalado por las guías clínicas, especialmente cuando hubo falla previa a AINEs.',
        pistas: [
            'doc, llevo 8 meses pintando techos arriba de un andamio',
            'ya tomé como cuatro semanas de pastillas y nada, ni cosquillas',
            'todo el día con el brazo arriba… del techo, no del público',
            'mi rutina del stand-up también incluye gestos amplios, ya no me río',
            'el ibuprofeno fue como tirarle a un esqueleto: nada que doler ahí',
        ],
    },
    {
        id: 5,
        personajeId: 'zombie',
        paciente: { nombre: 'Zombie', ocupacion: 'Jubilado del horario nocturno' },
        motivo:
            'mmgh… un año… hombro izquierdo… cada vez… más débil… no puedo… peinar… los pocos pelos… ni vestirme… solo… cada vez peor… aaargh.',
        factoresRiesgo: ['Edad avanzada', 'Evolución crónica'],
        maniobras: [{ id: 'lag_ri', resultado: 'positivo' }],
        rom:
            'Atrofia marcada de fosa supra/infraespinosa. Abducción 3/5, RE 3/5. Rx: migración superior de la cabeza humeral.',
        diagnosticoCorrecto: 'Desgarro crónico masivo del manguito rotador',
        manejoCorrecto: 'Fisioterapia y reeducación muscular',
        referenciaUrgente: false,
        feedback:
            'La migración superior de la cabeza humeral es el hallazgo radiográfico más específico para desgarro crónico masivo. Pacientes mayores con desgarros irreparables responden bien a rehabilitación con reeducación del deltoides anterior.',
        pistas: [
            'mmgh… llevo… un año… así',
            'no puedo… peinarme… ni vestirme… solo',
            'ya estoy… muy viejo… para esto…',
            'doc… 200 años… o 12… mi calendario… roto…',
            '*levanta el brazo malo y cae solo* mmgh… eso… normal ya…',
            'antes… cargar aldeanos… ahora… ni la lata…',
        ],
    },
    {
        id: 6,
        personajeId: 'pepsiman',
        paciente: { nombre: 'Pepsiman', ocupacion: 'Tenista patrocinado (servicio supersónico)' },
        motivo:
            '¡PEPSI! *imita un servicio de tenis explosivo, justo en el momento del saque hace una mueca de dolor en el hombro derecho* ¡PEPSIMAN! 2 meses… solo cuando saco… *vuelve a mimar el saque, le duele otra vez*',
        factoresRiesgo: ['Actividad deportiva repetitiva'],
        maniobras: [
            { id: 'bearhug', resultado: 'positivo' },
            { id: 'bellypress', resultado: 'positivo' },
        ],
        rom: 'Sin limitación pasiva. Rotación interna dolorosa y disminuida. Neer y Hawkins negativos.',
        diagnosticoCorrecto: 'Lesión del subescapular',
        manejoCorrecto: 'Manejo conservador con fisioterapia',
        referenciaUrgente: false,
        feedback:
            'Bear Hug y Belly Press evalúan específicamente la integridad del subescapular, principal rotador interno del hombro. Frecuente en deportes de saque (tenis, beisbol).',
        pistas: [
            '¡PEPSI! *imita un servicio de tenis con dolor en la cara*',
            '*mima sacar con el brazo y solo le duele al servir, no antes*',
            '¡PEPSIMAN! *señala 2 meses con los dedos*',
            '*saca un trofeo de pickleball senior y enseña que entrena 5 días a la semana*',
            'pepsi… *muestra que mover el brazo en cualquier otra dirección no le duele*',
            '*finta una raqueta gigante con el logo de Pepsi*',
        ],
    },
    {
        id: 7,
        personajeId: 'sans',
        paciente: { nombre: 'sans', ocupacion: 'Centinela retirado / vendedor de hot dogs' },
        motivo:
            'doc, ya van 4 meses con esto, y por la noche es la peor parte — no me deja dormir, y eso que un esqueleto debería dormir como roca. fui a fisio 6 semanas, mejoré tantito pero todavía no puedo ni armar un hot dog sin que me duela.',
        factoresRiesgo: ['Edad > 50', 'Persistencia de dolor'],
        maniobras: [
            { id: 'neer', resultado: 'positivo' },
            { id: 'jobe', resultado: 'positivo' },
        ],
        rom: 'Arco doloroso. Lata vacía positiva para dolor sin debilidad significativa (4+/5).',
        diagnosticoCorrecto: 'Tendinopatía del manguito rotador',
        manejoCorrecto: 'Inyección de corticosteroides subacromial',
        referenciaUrgente: false,
        feedback:
            'En pacientes con respuesta parcial a fisioterapia, la inyección subacromial es una excelente opción coadyuvante recomendada por guías.',
        pistas: [
            'doc, ya van 4 meses y por la noche es lo peor, no me deja dormir',
            'fui a fisio 6 semanas, mejoré tantito pero no del todo',
            'no soy un esqueletito joven ya, eh',
            'mi puesto de hot dogs me obliga a estirarme cada rato y ahí es donde grito',
            'la fisio ayudó pero la mitad — me falta la otra mitad, doc',
        ],
    },
    {
        id: 8,
        personajeId: 'zombie',
        paciente: { nombre: 'Zombie', ocupacion: 'Cargador de aldeanos (5 años de servicio)' },
        motivo:
            'mmgh… 5 meses… brazo derecho… cargar aldeanos… arriba… arriba… *mima elevar*… ultrasonido… dijo… roto… un poco… supraespinoso… *trae el papel arrugado*',
        factoresRiesgo: ['Movimientos de elevación', 'Desgarro parcial en imagen'],
        maniobras: [{ id: 'fullcan', resultado: 'positivo' }],
        rom: 'Fuerza 4/5 en abducción. Sin atrofia visible. Rx normales.',
        diagnosticoCorrecto: 'Desgarro parcial del supraespinoso',
        manejoCorrecto: 'Manejo conservador con fisioterapia y AINEs',
        referenciaUrgente: false,
        feedback:
            'Un desgarro parcial del manguito rotador se maneja de forma conservadora en primer nivel: analgesia + fisioterapia ± inyección.',
        pistas: [
            'mmgh… cargando… aldeanos… 5 meses…',
            'ultrasonido… dijo… roto… un poco…',
            'siempre… brazo arriba… cargar… cargar…',
            '*saca el ultrasonido baboseado y lo deja en el escritorio* ahí… dice…',
            'mi… horario… 5 años… todos… los aldeanos…',
            '*levanta el brazo* puede… pero… duele… mmgh',
        ],
    },
];

export const FACTORES_RIESGO_DISPONIBLES: string[] = [
    'Edad > 50',
    'Edad avanzada',
    'Movimientos repetitivos',
    'Movimientos de elevación',
    'Inicio traumático',
    'Esfuerzo agudo',
    'Diabetes Mellitus 2',
    'Actividad deportiva repetitiva',
    'Falla a tratamiento inicial',
    'Persistencia de dolor',
    'Evolución crónica',
    'Desgarro parcial en imagen',
];

export const DIAGNOSTICOS_DISPONIBLES: string[] = [
    'Tendinopatía del manguito rotador',
    'Desgarro completo del manguito rotador',
    'Desgarro parcial del supraespinoso',
    'Desgarro crónico masivo del manguito rotador',
    'Capsulitis adhesiva (hombro congelado)',
    'Lesión del subescapular',
];

export const MANIOBRAS_INFO: Record<string, { nombre: string; evalua: string }> = {
    hawkins: { nombre: 'Hawkins-Kennedy', evalua: 'Pinzamiento subacromial' },
    neer: { nombre: 'Neer', evalua: 'Pinzamiento subacromial' },
    jobe: { nombre: 'Jobe (Empty Can)', evalua: 'Supraespinoso' },
    fullcan: { nombre: 'Full Can', evalua: 'Supraespinoso (menos doloroso)' },
    arco: { nombre: 'Arco doloroso', evalua: 'Patología del manguito (60–120°)' },
    droparm: { nombre: 'Drop Arm', evalua: 'Desgarro completo' },
    lag_re: { nombre: 'Lag en Rot. Externa', evalua: 'Infraespinoso / desgarro completo' },
    lag_ri: { nombre: 'Lag en Rot. Interna', evalua: 'Subescapular / desgarro masivo' },
    bearhug: { nombre: 'Bear Hug', evalua: 'Subescapular' },
    bellypress: { nombre: 'Belly Press', evalua: 'Subescapular' },
};
