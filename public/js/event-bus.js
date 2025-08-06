/*
 * Arquivo: event-bus.js
 * Descrição: Módulo simples para gerenciar eventos customizados (Publisher/Subscriber).
 * Permite que diferentes partes da aplicação se comuniquem sem acoplamento direto.
 */

const events = {};

const eventBus = {
    /**
     * Registra um listener para um evento específico.
     * @param {string} eventName - O nome do evento (ex: 'productsChanged').
     * @param {Function} listener - A função a ser chamada quando o evento for emitido.
     */
    on(eventName, listener) {
        if (!events[eventName]) {
            events[eventName] = [];
        }
        events[eventName].push(listener);
    },

    /**
     * Emite (dispara) um evento, chamando todos os listeners registrados.
     * @param {string} eventName - O nome do evento a ser emitido.
     * @param {*} [data] - Dados opcionais a serem passados para os listeners.
     */
    emit(eventName, data) {
        if (events[eventName]) {
            events[eventName].forEach(listener => listener(data));
        }
    },

    /**
     * Remove um listener de um evento específico.
     * @param {string} eventName - O nome do evento.
     * @param {Function} listener - A função listener a ser removida.
     */
    off(eventName, listener) {
        if (events[eventName]) {
            events[eventName] = events[eventName].filter(l => l !== listener);
        }
    }
};

export { eventBus };
