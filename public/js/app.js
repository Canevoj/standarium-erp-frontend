/*
 * Arquivo: firebase-service.js
 * Descrição: Módulo responsável pela inicialização do Firebase, autenticação
 * e gerenciamento de dados no Firestore. A configuração do Firebase é
 * obtida de um endpoint seguro no backend.
 */

import { utils } from './utils.js';
import { dataStore } from './data-store.js';

const firebaseService = {
    db: null,
    auth: null,
    userId: null,
    elements: null,
    appInstance: null,

    /**
     * Obtém a configuração do Firebase de um endpoint seguro no backend.
     */
    async getFirebaseConfig() {
        const backendUrl = 'https://standarium-erp-api.onrender.com/api/firebase-config';
        try {
            const response = await fetch(backendUrl);
            if (!response.ok) {
                throw new Error('Falha ao obter a configuração do Firebase do backend.');
            }
            return await response.json();
        } catch (error) {
            console.error("Erro ao obter a configuração do Firebase:", error);
            utils.showError("Falha ao obter a configuração do Firebase.", this.elements.loadingOverlay, this.elements.loadingText);
            return null;
        }
    },

    /**
     * Inicializa o Firebase e configura o listener de estado de autenticação.
     */
    async init(elements, app) {
        this.elements = elements;
        this.appInstance = app;

        const firebaseConfig = await this.getFirebaseConfig();
        if (!firebaseConfig) {
            return;
        }

        try {
            const firebaseApp = firebase.initializeApp(firebaseConfig);
            this.db = firebaseApp.firestore();
            this.auth = firebaseApp.auth();
            this.handleAuthStateChange();
        } catch (error) {
            console.error("Falha na inicialização do Firebase:", error);
            utils.showError("Falha ao inicializar o Firebase. Verifique suas chaves.", this.elements.loadingOverlay, this.elements.loadingText);
            this.elements.loadingOverlay.classList.add('hidden');
        }
    },

    /**
     * Configura o observador de estado de autenticação do Firebase.
     */
    handleAuthStateChange() {
        this.auth.onAuthStateChanged(user => {
            if (user) {
                this.userId = user.uid;
                this.elements.authContainer.classList.add('hidden');
                this.elements.appContainer.classList.remove('hidden');
                this.setupFirestoreListeners();
            } else {
                this.userId = null;
                this.elements.authContainer.classList.remove('hidden');
                this.elements.appContainer.classList.add('hidden');
                this.elements.loadingOverlay.classList.add('hidden');
            }
            if (window.feather) feather.replace();
        });
    },

    /**
     * Configura os listeners em tempo real do Firestore para produtos, serviços e componentes.
     */
    setupFirestoreListeners() {
        if (!this.db || !this.userId) {
            console.warn("Firestore ou UserId não disponíveis para configurar listeners.");
            return;
        }

        const productsPath = `users/${this.userId}/products`;
        const salesPath = `users/${this.userId}/sales`;
        const servicesPath = `users/${this.userId}/services`;
        const componentsPath = `users/${this.userId}/components`;

        // Listener para produtos
        this.db.collection(productsPath).onSnapshot(snapshot => {
            const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            dataStore.setProducts(products);
            this.appInstance.render.renderAll();
        }, error => console.error("Erro ao buscar produtos:", error));

        // Listener para serviços
        this.db.collection(servicesPath).onSnapshot(snapshot => {
            const services = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            dataStore.setServices(services);
            this.appInstance.render.renderServicesTable();
        }, error => console.error("Erro ao buscar serviços:", error));

        // Listener para componentes
        this.db.collection(componentsPath).onSnapshot(snapshot => {
            const components = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            dataStore.setComponents(components);
            this.appInstance.render.renderBizuralChecklist();
        }, error => console.error("Erro ao buscar componentes:", error));
        
        // Listener para vendas (novo)
        this.db.collection(salesPath).onSnapshot(snapshot => {
            const sales = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            dataStore.setSales(sales);
            this.appInstance.render.renderAll();
        }, error => console.error("Erro ao buscar vendas:", error));
    },

    /**
     * Realiza o login do usuário.
     */
    async signIn(email, password) {
        try {
            await this.auth.signInWithEmailAndPassword(email, password);
        } catch (error) {
            console.error("Erro de login:", error.code, error.message);
            throw new Error(utils.getAuthErrorMessage(error.code));
        }
    },

    /**
     * Cria uma nova conta de usuário.
     */
    async signUp(email, password) {
        try {
            await this.auth.createUserWithEmailAndPassword(email, password);
        } catch (error) {
            console.error("Erro de cadastro:", error.code, error.message);
            throw new Error(utils.getAuthErrorMessage(error.code));
        }
    },

    /**
     * Realiza o logout do usuário.
     */
    async signOut() {
        try {
            await this.auth.signOut();
            console.log("Usuário desconectado com sucesso.");
        } catch (error) {
            console.error("Erro de logout:", error);
            utils.showError("Ocorreu um erro ao fazer logout. Tente novamente.", this.elements.loadingOverlay, this.elements.loadingText);
        }
    },

    /**
     * Salva dados em uma coleção do Firestore.
     */
    async saveData(collectionName, data, id = null, saveButton = null) {
        if (!this.userId) {
            console.error("Usuário não autenticado para salvar dados.");
            utils.showError("Você precisa estar logado para salvar dados.", this.elements.loadingOverlay, this.elements.loadingText);
            return;
        }

        const collectionPath = `users/${this.userId}/${collectionName}`;
        if (saveButton) saveButton.disabled = true;

        try {
            const dataToSave = { ...data, lastUpdatedAt: firebase.firestore.FieldValue.serverTimestamp() };
            if (id) {
                await this.db.collection(collectionPath).doc(id).update(dataToSave);
            } else {
                await this.db.collection(collectionPath).add(dataToSave);
            }
            console.log(`Dados salvos com sucesso em ${collectionPath}. ID: ${id || 'novo'}`);
        } catch (error) {
            console.error(`Erro ao salvar dados em ${collectionPath}:`, error);
            utils.showError("Ocorreu um erro ao salvar os dados.", this.elements.loadingOverlay, this.elements.loadingText);
            throw error;
        } finally {
            if (saveButton) saveButton.disabled = false;
        }
    },

    /**
     * Exclui um documento de uma coleção do Firestore.
     */
    async deleteData(collectionName, id) {
        if (!this.userId) {
            console.error("Usuário não autenticado para excluir dados.");
            utils.showError("Você precisa estar logado para excluir dados.", this.elements.loadingOverlay, this.elements.loadingText);
            return;
        }

        const collectionPath = `users/${this.userId}/${collectionName}`;
        try {
            await this.db.collection(collectionPath).doc(id).delete();
            console.log(`Documento ${id} excluído de ${collectionPath} com sucesso.`);
        } catch (error) {
            console.error(`Erro ao excluir dados de ${collectionPath}:`, error);
            utils.showError("Ocorreu um erro ao excluir o item.", this.elements.loadingOverlay, this.elements.loadingText);
            throw error;
        }
    },
};

export { firebaseService };
