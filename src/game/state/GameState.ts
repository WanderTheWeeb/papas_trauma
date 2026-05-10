import { CASOS_CLINICOS } from '../data/casos';
import type {
    CasoClinico,
    ManiobraEjecutada,
    ScoreDesglosado,
    TicketEnConstruccion,
} from '../data/types';

class GameStateClass {
    private casoIndex = 0;
    private ticket: TicketEnConstruccion | null = null;
    private lastScore: ScoreDesglosado | null = null;
    private tutorial = false;

    setTutorial(on: boolean) {
        this.tutorial = on;
    }
    isTutorial(): boolean {
        return this.tutorial;
    }

    startNewCase(index = 0): CasoClinico | null {
        if (CASOS_CLINICOS.length === 0) return null;
        this.casoIndex = index % CASOS_CLINICOS.length;
        const caso = CASOS_CLINICOS[this.casoIndex];
        this.ticket = {
            casoId: caso.id,
            factoresSeleccionados: [],
            factoresIncorrectos: [],
            maniobrasRealizadas: [],
            diagnosticoSellado: null,
            farmacoSeleccionado: null,
            dosisPrecision: 0,
            destino: null,
        };
        return caso;
    }

    nextCase(): CasoClinico | null {
        return this.startNewCase(this.casoIndex + 1);
    }

    getCaso(): CasoClinico | null {
        return CASOS_CLINICOS[this.casoIndex] ?? null;
    }

    getTicket(): TicketEnConstruccion | null {
        return this.ticket;
    }

    addFactor(factor: string) {
        if (!this.ticket) return;
        if (!this.ticket.factoresSeleccionados.includes(factor)) {
            this.ticket.factoresSeleccionados.push(factor);
        }
    }

    addFactorIncorrecto(factor: string) {
        if (!this.ticket) return;
        if (!this.ticket.factoresIncorrectos.includes(factor)) {
            this.ticket.factoresIncorrectos.push(factor);
        }
    }

    addManiobra(m: ManiobraEjecutada) {
        if (!this.ticket) return;
        this.ticket.maniobrasRealizadas.push(m);
    }

    setDiagnostico(d: string) {
        if (this.ticket) this.ticket.diagnosticoSellado = d;
    }

    setPrescripcion(farmaco: string, precision: number, destino: 'conservador' | 'urgente') {
        if (!this.ticket) return;
        this.ticket.farmacoSeleccionado = farmaco;
        this.ticket.dosisPrecision = precision;
        this.ticket.destino = destino;
    }

    evaluate(): ScoreDesglosado {
        const caso = this.getCaso();
        const ticket = this.ticket;
        if (!caso || !ticket) {
            const empty: ScoreDesglosado = { symptom: 0, testing: 0, diagnostic: 0, prescription: 0, total: 0 };
            this.lastScore = empty;
            return empty;
        }

        // Symptom (25): % de factores correctos, penaliza incorrectos -3 cada uno
        const factoresEsperados = caso.factoresRiesgo;
        const correctos = ticket.factoresSeleccionados.filter(f => factoresEsperados.includes(f)).length;
        const base = factoresEsperados.length
            ? (correctos / factoresEsperados.length) * 25
            : 0;
        const penalty = (ticket.factoresIncorrectos?.length ?? 0) * 3;
        const symptom = Math.max(0, base - penalty);

        // Testing (25): % de maniobras esperadas con timing acertado
        const maniobrasEsperadas = caso.maniobras.map(m => m.id);
        const aciertos = ticket.maniobrasRealizadas.filter(
            m => maniobrasEsperadas.includes(m.id) && m.aciertoTiming,
        ).length;
        const testing = maniobrasEsperadas.length
            ? (aciertos / maniobrasEsperadas.length) * 25
            : 0;

        // Diagnostic (25): match exacto
        const diagnostic = ticket.diagnosticoSellado === caso.diagnosticoCorrecto ? 25 : 0;

        // Prescription (25): destino correcto + precisión de dosis
        const destinoEsperado = caso.referenciaUrgente ? 'urgente' : 'conservador';
        const destinoOk = ticket.destino === destinoEsperado ? 1 : 0;
        const prescription = (destinoOk * 0.6 + ticket.dosisPrecision * 0.4) * 25;

        const score: ScoreDesglosado = {
            symptom: Math.round(symptom),
            testing: Math.round(testing),
            diagnostic: Math.round(diagnostic),
            prescription: Math.round(prescription),
            total: 0,
        };
        score.total = score.symptom + score.testing + score.diagnostic + score.prescription;
        this.lastScore = score;
        return score;
    }

    getLastScore(): ScoreDesglosado | null {
        return this.lastScore;
    }
}

export const GameState = new GameStateClass();
