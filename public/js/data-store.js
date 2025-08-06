/*
 * Arquivo: data-store.js
 * Descrição: Módulo para gerenciar o estado dos dados da aplicação (produtos, serviços, componentes).
 * Atua como uma fonte única de verdade para os dados e emite eventos quando os dados mudam.
 */

import { eventBus } from './event-bus.js';

const dataStore = {
    products: [],      // Armazena todos os produtos
    services: [],      // Armazena todos os serviços
    components: [],    // Armazena todos os componentes

    // init não é mais necessário, pois não precisamos mais da instância do app.

    /**
     * Define a lista de produtos e emite um evento 'productsChanged'.
     * @param {Array<object>} newProducts - A nova lista de produtos.
     */
    setProducts(newProducts) {
        this.products = newProducts;
        eventBus.emit('productsChanged');
    },

    /**
     * Retorna a lista atual de produtos.
     * @returns {Array<object>} A lista de produtos.
     */
    getProducts() {
        return [...this.products]; // Retorna uma cópia para evitar modificações diretas
    },

    /**
     * Define a lista de serviços e emite um evento 'servicesChanged'.
     * @param {Array<object>} newServices - A nova lista de serviços.
     */
    setServices(newServices) {
        this.services = newServices;
        eventBus.emit('servicesChanged');
    },

    /**
     * Retorna a lista atual de serviços.
     * @returns {Array<object>} A lista de serviços.
     */
    getServices() {
        return [...this.services]; // Retorna uma cópia
    },

    /**
     * Define a lista de componentes e emite um evento 'componentsChanged'.
     * @param {Array<object>} newComponents - A nova lista de componentes.
     */
    setComponents(newComponents) {
        this.components = newComponents;
        eventBus.emit('componentsChanged');
    },

    /**
     * Retorna a lista atual de componentes.
     * @returns {Array<object>} A lista de componentes.
     */
    getComponents() {
        return [...this.components]; // Retorna uma cópia
    },
};

export { dataStore };
