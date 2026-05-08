import type { CasoClinico } from './types';

/**
 * Cada caso está atado a un personaje (Sans / Zombie / Pepsiman).
 * Mantén el `personajeId` consistente con el `paciente.nombre` y `ocupacion`.
 *  - Sans     → tendinopatía recurrente del manguito (paciente frecuente)
 *  - Zombie   → desgarros crónicos / degeneración (descomposición progresiva)
 *  - Pepsiman → trauma agudo, deportivo, y DM2 ocupacional (ya saben por qué)
 */
export const CASOS_CLINICOS: CasoClinico[] = [
    {
        id: 1,
        personajeId: 'sans',
        paciente: { nombre: 'sans', ocupacion: 'Vigilante de bosque (tiempo parcial)' },
        motivo:
            'Dolor progresivo en región lateral del hombro derecho de 3 meses, empeora al alcanzar objetos altos y al acostarse sobre el lado afectado. Interfiere con el sueño.',
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
    },
    {
        id: 2,
        personajeId: 'pepsiman',
        paciente: { nombre: 'Pepsiman', ocupacion: 'Repartidor heroico de Pepsi' },
        motivo:
            'Dolor agudo en hombro izquierdo después de cargar un six-pack gigante de Pepsi y estamparse contra una pared hace 2 días. Incapacidad para elevar el brazo lateralmente.',
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
    },
    {
        id: 3,
        personajeId: 'pepsiman',
        paciente: { nombre: 'Pepsiman', ocupacion: 'Embajador de marca (DM2 ocupacional)' },
        motivo:
            'Dolor difuso en hombro derecho de 6 meses de evolución, ha empeorado progresivamente.',
        factoresRiesgo: ['Diabetes Mellitus 2', 'Edad > 50'],
        maniobras: [{ id: 'neer', resultado: 'positivo' }],
        rom:
            'Limitación marcada activa y pasiva en todas las direcciones, especialmente rotación externa (20° vs 90° contralateral).',
        diagnosticoCorrecto: 'Capsulitis adhesiva (hombro congelado)',
        manejoCorrecto: 'Manejo conservador con fisioterapia',
        referenciaUrgente: false,
        feedback:
            'La restricción del movimiento pasivo global en presencia de DM2 es patognomónica de capsulitis adhesiva.',
    },
    {
        id: 4,
        personajeId: 'sans',
        paciente: { nombre: 'sans', ocupacion: 'Comediante de stand-up nocturno' },
        motivo:
            'Dolor crónico en hombro derecho de 8 meses al pintar techos en su segundo trabajo. Sin mejoría tras 4 semanas de AINEs.',
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
            'La fisioterapia con ejercicios progresivos (GRASP trial) es el tratamiento de primera línea avalado por las guías clínicas.',
    },
    {
        id: 5,
        personajeId: 'zombie',
        paciente: { nombre: 'Zombie', ocupacion: 'Jubilado del horario nocturno' },
        motivo:
            'Dolor en hombro izquierdo de 1 año. Debilidad progresiva al peinarse y vestirse. (Los pocos pelos que le quedan).',
        factoresRiesgo: ['Edad avanzada', 'Evolución crónica'],
        maniobras: [{ id: 'lag_ri', resultado: 'positivo' }],
        rom:
            'Atrofia marcada de fosa supra/infraespinosa. Abducción 3/5, RE 3/5. Rx: migración superior de la cabeza humeral.',
        diagnosticoCorrecto: 'Desgarro crónico masivo del manguito rotador',
        manejoCorrecto: 'Fisioterapia y reeducación muscular',
        referenciaUrgente: false,
        feedback:
            'La migración superior de la cabeza humeral es el hallazgo radiográfico más específico para desgarro crónico masivo. Pacientes mayores con desgarros irreparables responden bien a rehabilitación con reeducación del deltoides anterior.',
    },
    {
        id: 6,
        personajeId: 'pepsiman',
        paciente: { nombre: 'Pepsiman', ocupacion: 'Tenista patrocinado (servicio supersónico)' },
        motivo:
            'Dolor en hombro derecho de 2 meses, aparece específicamente al servir.',
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
            'Bear Hug y Belly Press evalúan específicamente la integridad del subescapular, principal rotador interno del hombro.',
    },
    {
        id: 7,
        personajeId: 'sans',
        paciente: { nombre: 'sans', ocupacion: 'Centinela retirado / vendedor de hot dogs' },
        motivo:
            'Dolor de 4 meses, nocturno, interrumpe el sueño. Mejoría parcial con 6 semanas de fisioterapia, persiste limitación laboral.',
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
    },
    {
        id: 8,
        personajeId: 'zombie',
        paciente: { nombre: 'Zombie', ocupacion: 'Cargador de aldeanos (5 años de servicio)' },
        motivo:
            'Dolor de 5 meses con movimientos repetitivos de elevación. Ultrasonido reporta desgarro parcial del supraespinoso.',
        factoresRiesgo: ['Movimientos de elevación', 'Desgarro parcial en imagen'],
        maniobras: [{ id: 'fullcan', resultado: 'positivo' }],
        rom: 'Fuerza 4/5 en abducción. Sin atrofia visible. Rx normales.',
        diagnosticoCorrecto: 'Desgarro parcial del supraespinoso',
        manejoCorrecto: 'Manejo conservador con fisioterapia y AINEs',
        referenciaUrgente: false,
        feedback:
            'Un desgarro parcial del manguito rotador se maneja de forma conservadora en primer nivel: analgesia + fisioterapia ± inyección.',
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
