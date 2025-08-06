/*
 * Arquivo: app.js
 * Descrição: Ponto de entrada principal da aplicação Standarium ERP.
 * Orquestra a inicialização dos serviços e a configuração inicial da UI.
 */

// Importa os módulos necessários
import { firebaseService } from './firebase-service.js';
import { uiHandlers } from './ui-handlers.js';
import { domManager } from './dom-manager.js';
import { dataStore } from './data-store.js';
import { renderFunctions } from './render-functions.js';
import { utils } from './utils.js'; // Importa funções utilitárias

// Objeto global da aplicação que coordena os módulos
const app = {
    // Referências aos elementos DOM e serviços
    elements: {}, // Cache para elementos DOM
    firebase: firebaseService,
    data: dataStore,
    render: renderFunctions,
    ui: uiHandlers,
    utils: utils, // Adiciona as utilidades ao objeto app

    charts: {}, // Armazena instâncias de gráficos Chart.js

    /**
     * Inicializa a aplicação.
     * Chama a injeção de HTML, caching de elementos, setup de event listeners,
     * e inicialização do Firebase.
     */
    async init() {
        // Injeta o HTML das páginas e modais no DOM
        domManager.injectHTML();
        // Armazena referências para elementos DOM importantes
        this.elements = domManager.cacheDOMElements();

        // Passa as referências de elementos e o objeto app para uiHandlers
        uiHandlers.init(this.elements, this);
        // Passa as referências de elementos e o objeto app para renderFunctions
        renderFunctions.init(this.elements, this);
        // A linha abaixo foi REMOVIDA pois dataStore não tem uma função init
        // dataStore.init(this.elements, this);


        // Configura os event listeners
        uiHandlers.setupEventListeners();

        // Inicializa o serviço Firebase
        await firebaseService.init(this.elements, this); // Passa 'this' (app) para o service para callback
        
        // Navega para a página inicial ou para o dashboard
        this.navigateTo(window.location.hash || '#dashboard');

        // Garante que os ícones do Feather Icons sejam substituídos após o carregamento inicial
        if (window.feather) {
            feather.replace();
        }
    },

    /**
     * Navega para uma seção específica da aplicação.
     * @param {string} hash - O hash da URL (ex: '#dashboard').
     */
    navigateTo(hash) {
        const targetId = (hash || '#dashboard').substring(1);
        this.elements.pages.forEach(page => page.classList.toggle('active', page.id === `page-${targetId}`));
        this.elements.sidebarLinks.forEach(link => link.classList.toggle('active', link.hash === `#${targetId}`));
        window.location.hash = targetId;
        // Re-renderiza todo o conteúdo da página ativa quando a navegação muda
        this.render.renderAll();
    },
};

// Quando o DOM estiver completamente carregado, inicializa a aplicação
document.addEventListener('DOMContentLoaded', () => app.init());
