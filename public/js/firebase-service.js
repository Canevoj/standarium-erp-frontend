/*
 * Arquivo: firebase-service.js
 * Descrição: Módulo responsável pela inicialização do Firebase, autenticação
 * e gerenciamento de dados no Firestore.
 */

// Importa as funções necessárias do Firebase SDK
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { getFirestore, collection, query, onSnapshot, addDoc, doc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";

// Importa as utilidades
import { utils } from './utils.js';
import { dataStore } from './data-store.js';

// Configuração do Firebase (SUBSTITUA PELAS SUAS PRÓPRIAS CHAVES!)
// IMPORTANTE: Para um ambiente de produção, considere usar variáveis de ambiente
// injetadas durante o processo de build para não hardcodar essas chaves.
// As chaves de API do Firebase são consideradas "seguras" para estarem no frontend
// APENAS SE VOCÊ CONFIGURAR CORRETAMENTE AS REGRAS DE SEGURANÇA DO FIRESTORE.
const firebaseConfig = {
    apiKey: "AIzaSyDWKmS0mWBI85QnE9Ajy_qGn4yY00TtmcY", // Substitua pela sua API Key do Firebase
    authDomain: "bizural-gestao.firebaseapp.com",
    projectId: "bizural-gestao",
    storageBucket: "bizural-gestao.appspot.com",
    messagingSenderId: "24565860173",
    appId: "1:24565860173:web:512e49c9f5efd791491904",
    measurementId: "G-PXHMBWT2EY"
};

const firebaseService = {
    db: null,       // Instância do Firestore
    auth: null,     // Instância de autenticação do Firebase
    userId: null,   // UID do usuário logado
    elements: null, // Referência aos elementos DOM (para exibir loading/erros)
    appInstance: null, // Referência à instância principal do app (para callbacks)

    /**
     * Inicializa o Firebase e configura o listener de estado de autenticação.
     * @param {object} elements - Referência aos elementos DOM.
     * @param {object} app - Referência à instância principal da aplicação.
     */
    async init(elements, app) {
        this.elements = elements;
        this.appInstance = app;

        if (!firebaseConfig.projectId || firebaseConfig.projectId === "YOUR_PROJECT_ID") {
            utils.showError("Configuração do Firebase não encontrada. Verifique as chaves de configuração.", this.elements.loadingOverlay, this.elements.loadingText);
            this.elements.loadingOverlay.classList.add('hidden'); // Certifica que o loading é ocultado
            return;
        }

        try {
            const firebaseApp = initializeApp(firebaseConfig);
            this.db = getFirestore(firebaseApp);
            this.auth = getAuth(firebaseApp);
            this.handleAuthStateChange(); // Configura o observador de estado de autenticação
        } catch (error) {
            console.error("Falha na inicialização do Firebase:", error);
            utils.showError("Falha ao inicializar o Firebase. Verifique suas chaves.", this.elements.loadingOverlay, this.elements.loadingText);
            this.elements.loadingOverlay.classList.add('hidden'); // Certifica que o loading é ocultado
        }
    },

    /**
     * Configura o observador de estado de autenticação do Firebase.
     * Gerencia a visibilidade das telas de autenticação e principal.
     */
    handleAuthStateChange() {
        onAuthStateChanged(this.auth, user => {
            if (user) {
                this.userId = user.uid;
                this.elements.authContainer.classList.add('hidden');
                this.elements.appContainer.classList.remove('hidden'); // Mostra o contêiner principal do app
                this.setupFirestoreListeners(); // Configura os listeners do Firestore após o login
                this.appInstance.navigateTo(window.location.hash || '#dashboard'); // Navega para o dashboard
            } else {
                this.userId = null;
                this.elements.authContainer.classList.remove('hidden');
                this.elements.appContainer.classList.add('hidden'); // Oculta o contêiner principal do app
                this.elements.loadingOverlay.classList.add('hidden'); // Oculta o overlay de carregamento se não autenticado
            }
            if (window.feather) feather.replace(); // Atualiza os ícones
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
        const servicesPath = `users/${this.userId}/services`;
        const componentsPath = `users/${this.userId}/components`;

        // Listener para produtos
        onSnapshot(query(collection(this.db, productsPath)), (snapshot) => {
            const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            dataStore.setProducts(products); // Apenas atualiza o dataStore
        }, (error) => console.error("Erro ao buscar produtos:", error));

        // Listener para serviços
        onSnapshot(query(collection(this.db, servicesPath)), (snapshot) => {
            const services = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            dataStore.setServices(services); // Apenas atualiza o dataStore
        }, (error) => console.error("Erro ao buscar serviços:", error));

        // Listener para componentes
        onSnapshot(query(collection(this.db, componentsPath)), (snapshot) => {
            const components = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            dataStore.setComponents(components); // Apenas atualiza o dataStore
        }, (error) => console.error("Erro ao buscar componentes:", error));

        this.elements.loadingOverlay.classList.add('hidden'); // Esconde o loading overlay após a primeira carga
    },

    /**
     * Realiza o login do usuário.
     * @param {string} email - E-mail do usuário.
     * @param {string} password - Senha do usuário.
     */
    async signIn(email, password) {
        try {
            await signInWithEmailAndPassword(this.auth, email, password);
        } catch (error) {
            console.error("Erro de login:", error.code, error.message);
            throw new Error(utils.getAuthErrorMessage(error.code));
        }
    },

    /**
     * Cria uma nova conta de usuário.
     * @param {string} email - E-mail do novo usuário.
     * @param {string} password - Senha do novo usuário.
     */
    async signUp(email, password) {
        try {
            await createUserWithEmailAndPassword(this.auth, email, password);
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
            await signOut(this.auth);
            console.log("Usuário desconectado com sucesso.");
        } catch (error) {
            console.error("Erro de logout:", error);
            utils.showError("Ocorreu um erro ao fazer logout. Tente novamente.", this.elements.loadingOverlay, this.elements.loadingText);
        }
    },

    /**
     * Salva dados em uma coleção do Firestore.
     * @param {string} collectionName - Nome da coleção (ex: 'products', 'services').
     * @param {object} data - Os dados a serem salvos.
     * @param {string} [id=null] - ID do documento, se for uma atualização.
     * @param {HTMLElement} [saveButton=null] - Botão de salvar para desabilitar/habilitar.
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
            const dataToSave = { ...data, lastUpdatedAt: serverTimestamp() };
            if (id) {
                await updateDoc(doc(this.db, collectionPath, id), dataToSave);
            } else {
                await addDoc(collection(this.db, collectionPath), dataToSave);
            }
            console.log(`Dados salvos com sucesso em ${collectionPath}. ID: ${id || 'novo'}`);
        } catch (error) {
            console.error(`Erro ao salvar dados em ${collectionPath}:`, error);
            utils.showError("Ocorreu um erro ao salvar os dados.", this.elements.loadingOverlay, this.elements.loadingText);
            throw error; // Propaga o erro para ser tratado no handler da UI
        } finally {
            if (saveButton) saveButton.disabled = false;
        }
    },

    /**
     * Exclui um documento de uma coleção do Firestore.
     * @param {string} collectionName - Nome da coleção.
     * @param {string} id - ID do documento a ser excluído.
     */
    async deleteData(collectionName, id) {
        if (!this.userId) {
            console.error("Usuário não autenticado para excluir dados.");
            utils.showError("Você precisa estar logado para excluir dados.", this.elements.loadingOverlay, this.elements.loadingText);
            return;
        }

        const collectionPath = `users/${this.userId}/${collectionName}`;
        try {
            await deleteDoc(doc(this.db, collectionPath, id));
            console.log(`Documento ${id} excluído de ${collectionPath} com sucesso.`);
        } catch (error) {
            console.error(`Erro ao excluir dados de ${collectionPath}:`, error);
            utils.showError("Ocorreu um erro ao excluir o item.", this.elements.loadingOverlay, this.elements.loadingText);
            throw error; // Propaga o erro para ser tratado no handler da UI
        }
    },
};

export { firebaseService };
