import { domManager } from './dom-manager.js';
import { uiHandlers } from './ui-handlers.js';
import { renderFunctions } from './render-functions.js';
import { dataStore } from './data-store.js';
import { utils } from './utils.js';
import { apiService } from './api-service.js';


const firebaseManager = {
    db: null,
    auth: null,
    userId: null,
    
    async getFirebaseConfig() {
        const backendUrl = 'https://standarium-erp-api.onrender.com/api/firebase-config';
        try {
            const response = await fetch(backendUrl);
            if (!response.ok) {
                throw new Error(`Falha ao obter a configuração do Firebase. Status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error("Erro CRÍTICO ao obter a configuração do Firebase:", error);
            // Mostra o erro para o usuário de forma clara
            const loadingOverlay = document.getElementById('loading-overlay');
            const loadingText = document.getElementById('loading-text');
            utils.showError("Não foi possível conectar ao servidor para iniciar. Verifique o backend e tente novamente.", loadingOverlay, loadingText);
            return null;
        }
    },

    async init(appInstance) {
        const firebaseConfig = await this.getFirebaseConfig();
        if (!firebaseConfig) return; // Se a configuração falhar, para a execução.

        try {
            const firebaseApp = firebase.initializeApp(firebaseConfig);
            this.db = firebaseApp.firestore();
            this.auth = firebaseApp.auth();
            this.handleAuthStateChange(appInstance);
        } catch (error) {
            console.error("Falha na inicialização do Firebase:", error);
        }
    },
    
    handleAuthStateChange(appInstance) {
        this.auth.onAuthStateChanged(user => {
            const { elements } = appInstance;
            if (user) {
                this.userId = user.uid;
                elements.authContainer.classList.add('hidden');
                elements.appContainer.classList.remove('hidden');
                this.setupFirestoreListeners(appInstance);
            } else {
                this.userId = null;
                elements.authContainer.classList.remove('hidden');
                elements.appContainer.classList.add('hidden');
                elements.loadingOverlay.classList.add('hidden');
            }
            if (window.feather) feather.replace();
        });
    },

    setupFirestoreListeners(appInstance) {
        if (!this.db || !this.userId) return;
        const paths = {
            products: `users/${this.userId}/products`,
            services: `users/${this.userId}/services`,
            components: `users/${this.userId}/components`,
            sales: `users/${this.userId}/sales`
        };

        const setupListener = (path, setData, renderFunc) => {
            this.db.collection(path).onSnapshot(snapshot => {
                const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setData(items);
                if (renderFunc) renderFunc();
            }, error => console.error(`Erro ao buscar dados de ${path}:`, error));
        };
        
        // Configura todos os listeners
        setupListener(paths.products, dataStore.setProducts, () => appInstance.render.renderAll());
        setupListener(paths.services, dataStore.setServices, () => appInstance.render.renderServicesTable());
        setupListener(paths.components, dataStore.setComponents, () => appInstance.render.renderBizuralChecklist());
        setupListener(paths.sales, (sales) => dataStore.setSales(sales)); // Assumindo que você adicionará setSales ao dataStore
        
        // Esconde o overlay DEPOIS que os listeners foram configurados
        appInstance.elements.loadingOverlay.classList.add('hidden');
    },

    // Funções de login, etc., que serão chamadas pelo ui-handlers
    signIn(email, password) {
        return this.auth.signInWithEmailAndPassword(email, password);
    },
    signUp(email, password) {
        return this.auth.createUserWithEmailAndPassword(email, password);
    },
    signOut() {
        return this.auth.signOut();
    }
};

// Classe principal da Aplicação
class App {
    constructor() {
        this.elements = null;
        this.render = renderFunctions;
        this.ui = uiHandlers;
        this.charts = {}; // Para armazenar instâncias de gráficos
    }

    async init() {
        domManager.injectHTML();
        this.elements = domManager.cacheDOMElements();

        // Passa as dependências para os outros módulos
        this.render.init(this.elements, this);
        this.ui.init(this.elements, this);
        
        // Inicializa o Firebase, que é o ponto crítico
        await firebaseManager.init(this);
        
        this.ui.setupEventListeners();
        
        // Passa a instância do firebaseManager para o uiHandlers, para que ele possa chamar signIn, etc.
        this.ui.firebaseManager = firebaseManager;
        
        this.navigateTo(window.location.hash || '#dashboard');
        window.addEventListener('hashchange', () => this.navigateTo(window.location.hash));
    }

    navigateTo(hash) {
        this.elements.pages.forEach(p => p.classList.remove('active'));
        const targetPage = document.getElementById(`page-${hash.substring(1)}`);
        if (targetPage) {
            targetPage.classList.add('active');
        } else {
            document.getElementById('page-dashboard').classList.add('active');
        }
        
        this.elements.sidebarLinks.forEach(l => {
            if(l.hash === hash) {
                l.classList.add('active-link-style'); // Adicione este estilo no seu CSS
            } else {
                l.classList.remove('active-link-style');
            }
        });

        this.render.renderAll();
        if (window.feather) feather.replace();
    }
}

// Inicia a aplicação
document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.init();
});
