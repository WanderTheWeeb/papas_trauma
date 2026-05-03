export type ManiobraId =
    | 'hawkins'
    | 'neer'
    | 'jobe'
    | 'fullcan'
    | 'arco'
    | 'droparm'
    | 'lag_re'
    | 'lag_ri'
    | 'bearhug'
    | 'bellypress';

export type ResultadoManiobra = 'positivo' | 'negativo';

export interface Maniobra {
    id: ManiobraId;
    resultado: ResultadoManiobra;
}

export interface Paciente {
    nombre: string;
    ocupacion: string;
}

export interface CasoClinico {
    id: number;
    paciente: Paciente;
    motivo: string;
    factoresRiesgo: string[];
    maniobras: Maniobra[];
    rom: string;
    diagnosticoCorrecto: string;
    manejoCorrecto: string;
    referenciaUrgente: boolean;
    feedback: string;
}

export interface ManiobraEjecutada {
    id: ManiobraId;
    aciertoTiming: boolean;
    resultado: ResultadoManiobra;
}

export interface TicketEnConstruccion {
    casoId: number;
    factoresSeleccionados: string[];
    maniobrasRealizadas: ManiobraEjecutada[];
    diagnosticoSellado: string | null;
    farmacoSeleccionado: string | null;
    dosisPrecision: number; // 0..1
    destino: 'conservador' | 'urgente' | null;
}

export interface ScoreDesglosado {
    symptom: number;     // 0..25
    testing: number;     // 0..25
    diagnostic: number;  // 0..25
    prescription: number;// 0..25
    total: number;       // 0..100
}
