/*
 * Arquivo: app.js
 * Descrição: Ponto de entrada principal da aplicação Standarium ERP.
 * Orquestra a inicialização dos serviços e a configuração inicial da UI.
 */
import { firebaseService } from './firebase-service.js';
import { uiHandlers } from './ui-handlers.js';
import { domManager } from './dom-manager.js';
import { dataStore } from './data-store.js';
import { renderFunctions } from './render-functions.js';
import { utils } from './utils.js';
const app = {
    elements: {},
    firebase: firebaseService,
    data: dataStore,
    render: renderFunctions,
    ui: uiHandlers,
    utils: utils,
    charts: {},
    async init() {
        domManager.injectHTML();
        this.elements = domManager.cacheDOMElements();
        uiHandlers.init(this.elements, this);
        renderFunctions.init(this.elements, this);
        dataStore.init(this.elements, this);
        uiHandlers.setupEventListeners();
        await firebaseService.init(this.elements, this);
        this.navigateTo(window.location.hash || '#dashboard');
        if (window.feather) {
            feather.replace();
        }
    },
    navigateTo(hash) {
        const targetId = (hash || '#dashboard').substring(1);
        this.elements.pages.forEach(page => page.classList.toggle('active', page.id === `page-${targetId}`));
        this.elements.sidebarLinks.forEach(link => link.classList.toggle('active', link.hash === `#${targetId}`));
        window.location.hash = targetId;
        this.render.renderAll();
    },
};
document.addEventListener('DOMContentLoaded', () => app.init());
