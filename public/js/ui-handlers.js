/*
 * Arquivo: ui-handlers.js
 * Descrição: Módulo responsável por configurar todos os event listeners
 * e gerenciar as interações da interface do usuário (UI).
 */

import { firebaseService } from './firebase-service.js';
import { apiService } from './api-service.js';
import { dataStore } from './data-store.js';
import { utils } from './utils.js';


const uiHandlers = {
    elements: null, // Referência aos elementos DOM
    appInstance: null, // Referência à instância principal do app (para navegação, etc.)

    init(elements, app) {
        this.elements = elements;
        this.appInstance = app;
        // apiService.init(elements); // Não é mais necessário chamar init aqui no apiService se não for armazenar elementos genéricos
    },

    /**
     * Configura todos os event listeners para os elementos da UI.
     */
    setupEventListeners() {
        let isLoginMode = true; // Estado para alternar entre login e cadastro

        // Event Listeners de Autenticação
        this.elements.authForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = this.elements.authForm.querySelector('#email').value;
            const password = this.elements.authForm.querySelector('#password').value;
            this.elements.authError.textContent = ''; // Limpa mensagens de erro anteriores
            this.elements.authSubmitBtn.disabled = true;

            try {
                if (isLoginMode) {
                    await firebaseService.signIn(email, password);
                } else {
                    await firebaseService.signUp(email, password);
                }
            } catch (error) {
                this.elements.authError.textContent = error.message; // Exibe mensagem de erro do FirebaseService
            } finally {
                this.elements.authSubmitBtn.disabled = false;
            }
        });

        this.elements.authToggleBtn.addEventListener('click', () => {
            isLoginMode = !isLoginMode;
            this.elements.authTitle.textContent = isLoginMode ? 'Login' : 'Cadastre-se';
            this.elements.authSubtitle.textContent = isLoginMode ? 'Acesse sua plataforma de gestão.' : 'Crie uma conta para a sua empresa.';
            this.elements.authSubmitBtn.textContent = isLoginMode ? 'Entrar' : 'Criar Conta';
            this.elements.authToggleText.textContent = isLoginMode ? 'Não tem uma conta?' : 'Já tem uma conta?';
            this.elements.authToggleBtn.textContent = isLoginMode ? 'Cadastre-se' : 'Faça Login';
            this.elements.authError.textContent = ''; // Limpa erro ao alternar
        });

        // Event Listener para Logout
        this.elements.logoutBtn.addEventListener('click', () => {
            firebaseService.signOut();
        });

        // Event Listeners da Sidebar e Navegação Mobile
        this.elements.sidebarToggle.addEventListener('click', () => {
            this.elements.sidebar.classList.toggle('collapsed');
            const icon = this.elements.sidebar.classList.contains('collapsed') ? 'chevrons-right' : 'chevrons-left';
            this.elements.sidebarToggle.innerHTML = `<i data-feather="${icon}" class="shrink-0"></i>`;
            
        });

        this.elements.mobileMenuBtn.addEventListener('click', () => {
            this.elements.sidebar.classList.add('open');
            this.elements.mobileOverlay.classList.remove('hidden');
        });

        this.elements.mobileOverlay.addEventListener('click', () => {
            this.elements.sidebar.classList.remove('open');
            this.elements.mobileOverlay.classList.add('hidden');
        });

        this.elements.sidebarLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.appInstance.navigateTo(link.hash); // Usa o método navigateTo do app
                this.elements.sidebar.classList.remove('open');
                this.elements.mobileOverlay.classList.add('hidden');
            });
        });

        // Event Listeners da Página de Estoque
        this.elements.addProductBtn.addEventListener('click', () => this.showProductModal());
        this.elements.productModal.querySelector('#cancel-product-btn').addEventListener('click', () => this.hideProductModal());
        this.elements.productForm.addEventListener('submit', (e) => { e.preventDefault(); this.saveProduct(); });
        this.elements.productForm.querySelector('#status').addEventListener('change', (e) => this.toggleSaleFields(e.target.value));
        this.elements.productForm.querySelector('#type').addEventListener('change', (e) => this.toggleProductFields(e.target.value));
        
        // CORREÇÃO AQUI: Passa o botão específico 'geminiDescBtn'
        this.elements.geminiDescBtn.addEventListener('click', () => this.generateDescription(this.elements.geminiDescBtn));

        this.elements.inventoryStatusFilter.addEventListener('change', () => this.appInstance.render.renderInventoryTable());
        this.elements.inventoryDateFilter.addEventListener('change', () => this.appInstance.render.renderInventoryTable());
        this.elements.inventorySortBy.addEventListener('change', () => this.appInstance.render.renderInventoryTable());
        this.elements.inventorySortOrder.addEventListener('change', () => this.appInstance.render.renderInventoryTable());

        // Event Listeners da Página de Serviços
        this.elements.addServiceBtn.addEventListener('click', () => this.showServiceModal());
        this.elements.serviceModal.querySelector('#cancel-service-btn').addEventListener('click', () => this.hideServiceModal());
        this.elements.serviceForm.addEventListener('submit', (e) => { e.preventDefault(); this.saveService(); });

        // Event Listeners da Página de Relatórios
        this.elements.reportTypeFilter.addEventListener('change', () => this.appInstance.render.renderReportsPage());
        this.elements.exportBtn.addEventListener('click', () => this.elements.exportDropdown.classList.toggle('hidden'));
        // Fechar dropdown ao clicar fora
        document.addEventListener('click', (e) => {
            if (this.elements.exportBtn && !this.elements.exportBtn.contains(e.target) &&
                this.elements.exportDropdown && !this.elements.exportDropdown.contains(e.target)) {
                this.elements.exportDropdown.classList.add('hidden');
            }
        });
        this.elements.exportCsvBtn.addEventListener('click', () => this.exportReports('csv'));
        this.elements.exportPdfBtn.addEventListener('click', () => this.exportReports('pdf'));
        this.elements.exportXlsxBtn.addEventListener('click', () => this.exportReports('xlsx'));


        // Event Listeners da Página Dashboard
        this.elements.dashboardPeriodFilter.addEventListener('change', (e) => this.appInstance.render.renderDashboard(e.target.value));
        // CORREÇÃO AQUI: Passa o botão específico 'generateInsightsBtn'
        this.elements.generateInsightsBtn.addEventListener('click', () => this.generateBusinessInsights(this.elements.generateInsightsBtn));
        
        this.elements.insightsContainer.addEventListener('click', (e) => {
            if (e.target.id === 'close-insights-btn' || e.target.closest('#close-insights-btn')) {
                this.elements.insightsContainer.classList.add('hidden');
            }
        });

        // Event Listeners da Página Bizural (Montagem)
        this.elements.addComponentBtn.addEventListener('click', () => this.showComponentModal());
        this.elements.componentModal.querySelector('#cancel-component-btn').addEventListener('click', () => this.hideComponentModal());
        this.elements.componentForm.addEventListener('submit', (e) => { e.preventDefault(); this.saveComponent(); });
        this.elements.resetBizuralBtn.addEventListener('click', () => {
            this.elements.bizuralChecklistEl.querySelectorAll('input[type="checkbox"]').forEach(c => c.checked = false);
            this.appInstance.render.calculateBizuralTotals(); // Recalcula totais
        });
        this.elements.bizuralLaborInput.addEventListener('input', () => this.appInstance.render.calculateBizuralTotals());
    },

    /**
     * Exibe o modal de produto e preenche com dados se um produto for fornecido para edição.
     * @param {object} [product=null] - Objeto produto para edição, ou null para adicionar novo.
     */
    showProductModal(product = null) {
        const form = this.elements.productForm;
        form.reset(); // Limpa o formulário

        // Define a data de compra como a data atual por padrão para novos itens
        form.querySelector('#data_compra').value = new Date().toISOString().split('T')[0];

        if (product) {
            this.elements.productModalTitle.textContent = 'Gerenciar Item';
            form.querySelector('#product-id').value = product.id;
            form.querySelector('#produto').value = product.PRODUTO;
            form.querySelector('#type').value = product.TIPO || 'Produto para Venda';
            form.querySelector('#custo').value = product.CUSTO;
            form.querySelector('#preco_sugerido').value = product.PRECO_SUGERIDO;
            form.querySelector('#data_compra').value = product.DATA_COMPRA;
            form.querySelector('#metodo_compra').value = product.METODO_COMPRA;
            form.querySelector('#status').value = product.STATUS;
            form.querySelector('#descricao').value = product.DESCRICAO || '';

            if (product.STATUS === 'VENDIDO') {
                form.querySelector('#valor_venda').value = product.VALOR_VENDA;
                form.querySelector('#data_venda').value = product.DATA_VENDA;
                form.querySelector('#metodo_venda').value = product.METODO_VENDA;
            }
        } else {
            this.elements.productModalTitle.textContent = 'Adicionar Novo Item';
            form.querySelector('#product-id').value = ''; // Limpa o ID para novo item
        }

        // Ajusta a visibilidade dos campos com base no tipo e status
        this.toggleProductFields(form.querySelector('#type').value);
        this.toggleSaleFields(form.querySelector('#status').value);

        this.elements.productModal.classList.remove('hidden'); // Exibe o modal
    },

    /** Oculta o modal de produto. */
    hideProductModal() {
        this.elements.productModal.classList.add('hidden');
    },

    /**
     * Alterna a visibilidade dos campos de venda com base no status do produto.
     * @param {string} status - O status atual do produto.
     */
    toggleSaleFields(status) {
        const saleFields = this.elements.productForm.querySelector('#sale-fields');
        if (status === 'VENDIDO') {
            saleFields.classList.remove('hidden');
        } else {
            saleFields.classList.add('hidden');
        }
    },

    /**
     * Alterna a visibilidade dos campos específicos para "Produto para Venda" vs "Consumo".
     * @param {string} type - O tipo de item selecionado ('Produto para Venda' ou 'Consumo').
     */
    toggleProductFields(type) {
        const fields = this.elements.productForm.querySelector('#product-for-sale-fields');
        const descField = this.elements.productForm.querySelector('#product-description-field');
        if (type === 'Produto para Venda') {
            fields.classList.remove('hidden');
            descField.classList.remove('hidden');
        } else {
            fields.classList.add('hidden');
            descField.classList.add('hidden');
        }
    },

    /** Salva um produto (novo ou existente) no Firestore. */
    async saveProduct() {
        const form = this.elements.productForm;
        const id = form.querySelector('#product-id').value;
        const status = form.querySelector('#status').value;
        const type = form.querySelector('#type').value;

        let productData = {
            PRODUTO: form.querySelector('#produto').value,
            TIPO: type,
            CUSTO: parseFloat(form.querySelector('#custo').value) || 0,
            PRECO_SUGERIDO: type === 'Produto para Venda' ? (parseFloat(form.querySelector('#preco_sugerido').value) || 0) : null,
            DATA_COMPRA: form.querySelector('#data_compra').value,
            METODO_COMPRA: form.querySelector('#metodo_compra').value,
            STATUS: type === 'Produto para Venda' ? status : 'N/A', // Status é N/A para Consumo
            DESCRICAO: form.querySelector('#descricao').value,
        };

        // Condicionalmente adiciona campos de venda se o status for 'VENDIDO' e tipo 'Produto para Venda'
        if (status === 'VENDIDO' && type === 'Produto para Venda') {
            productData.VALOR_VENDA = parseFloat(form.querySelector('#valor_venda').value) || 0;
            productData.DATA_VENDA = form.querySelector('#data_venda').value;
            productData.METODO_VENDA = form.querySelector('#metodo_venda').value;
        } else {
            productData.VALOR_VENDA = null;
            productData.DATA_VENDA = null;
            productData.METODO_VENDA = null;
        }

        try {
            await firebaseService.saveData('products', productData, id, form.querySelector('.btn-primary'));
            this.hideProductModal(); // Oculta o modal após salvar
        } catch (error) {
            console.error("Erro ao salvar produto:", error);
            // utils.showError já é chamado no firebaseService.saveData
        }
    },

    /**
     * Exibe o modal de serviço e preenche com dados se um serviço for fornecido para edição.
     * @param {object} [service=null] - Objeto serviço para edição, ou null para adicionar novo.
     */
    showServiceModal(service = null) {
        const form = this.elements.serviceForm;
        form.reset(); // Limpa o formulário

        if (service) {
            this.elements.serviceModalTitle.textContent = 'Editar Serviço';
            form.querySelector('#service-id').value = service.id;
            form.querySelector('#service-name').value = service.NOME;
            form.querySelector('#service-price').value = service.PRECO;
            form.querySelector('#service-description').value = service.DESCRICAO;
        } else {
            this.elements.serviceModalTitle.textContent = 'Adicionar Novo Serviço';
            form.querySelector('#service-id').value = ''; // Limpa o ID para novo item
        }
        this.elements.serviceModal.classList.remove('hidden'); // Exibe o modal
    },

    /** Oculta o modal de serviço. */
    hideServiceModal() {
        this.elements.serviceModal.classList.add('hidden');
    },

    /** Salva um serviço (novo ou existente) no Firestore. */
    async saveService() {
        const form = this.elements.serviceForm;
        const id = form.querySelector('#service-id').value;
        const serviceData = {
            NOME: form.querySelector('#service-name').value,
            PRECO: parseFloat(form.querySelector('#service-price').value) || 0,
            DESCRICAO: form.querySelector('#service-description').value,
        };
        try {
            await firebaseService.saveData('services', serviceData, id, form.querySelector('.btn-primary'));
            this.hideServiceModal(); // Oculta o modal após salvar
        } catch (error) {
            console.error("Erro ao salvar serviço:", error);
            // utils.showError já é chamado no firebaseService.saveData
        }
    },

    /**
     * Exibe o modal de componente e preenche com dados se um componente for fornecido para edição.
     * @param {object} [component=null] - Objeto componente para edição, ou null para adicionar novo.
     */
    showComponentModal(component = null) {
        const form = this.elements.componentForm;
        form.reset(); // Limpa o formulário

        if (component) {
            this.elements.componentModalTitle.textContent = 'Editar Componente';
            form.querySelector('#component-id').value = component.id;
            form.querySelector('#component-name').value = component.component;
            form.querySelector('#component-cost').value = component.cost;
        } else {
            this.elements.componentModalTitle.textContent = 'Adicionar Componente';
            form.querySelector('#component-id').value = ''; // Limpa o ID para novo item
        }
        this.elements.componentModal.classList.remove('hidden'); // Exibe o modal
    },

    /** Oculta o modal de componente. */
    hideComponentModal() {
        this.elements.componentModal.classList.add('hidden');
    },

    /** Salva um componente (novo ou existente) no Firestore. */
    async saveComponent() {
        const form = this.elements.componentForm;
        const id = form.querySelector('#component-id').value;
        const componentData = {
            component: form.querySelector('#component-name').value,
            cost: parseFloat(form.querySelector('#component-cost').value) || 0
        };
        try {
            await firebaseService.saveData('components', componentData, id, form.querySelector('.btn-primary'));
            this.hideComponentModal(); // Oculta o modal após salvar
        } catch (error) {
            console.error("Erro ao salvar componente:", error);
            // utils.showError já é chamado no firebaseService.saveData
        }
    },

    /**
     * Gera uma descrição de produto usando a API Gemini.
     * @param {HTMLElement} button - O botão que acionou a geração (para controle de estado).
     */
    async generateDescription(button) {
        const productName = this.elements.productForm.querySelector('#produto').value;
        if (!productName) {
            utils.showConfirmation("Por favor, insira o nome do produto primeiro.", () => {}, this.elements); // Passa 'elements' para showConfirmation
            return;
        }

        const prompt = `Crie uma descrição de venda curta, atraente e profissional para o seguinte produto de eletrônicos: "${productName}". Foque nos benefícios e principais características em 2 ou 3 parágrafos. Use uma linguagem vendedora, mas honesta.`;
        const description = await apiService.callGeminiAPI(prompt, button); // Passa o botão para apiService

        this.elements.productForm.querySelector('#descricao').value = description;
    },

    /**
     * Gera insights de negócios usando a API Gemini.
     * @param {HTMLElement} button - O botão que acionou a geração (para controle de estado).
     */
    async generateBusinessInsights(button) {
        // const button = this.elements.generateInsightsBtn; // Removido, pois o botão é passado como argumento

        this.elements.insightsContainer.classList.remove('hidden');
        this.elements.insightsContainer.innerHTML = '<div class="flex justify-center items-center p-8"><div class="spinner"></div></div>';

        const period = this.elements.dashboardPeriodFilter.options[this.elements.dashboardPeriodFilter.selectedIndex].text;
        const faturamento = this.elements.metricFaturamento.textContent;
        const lucro = this.elements.metricLucro.textContent;
        const vendidos = this.elements.metricVendidos.textContent;

        const prompt = `Sou dono de uma pequena empresa de revenda de eletrônicos. No período de "${period}", estes foram meus resultados: Faturamento de ${faturamento}, Lucro de ${lucro}, e ${vendidos} itens vendidos. Com base nesses números, gere uma análise de negócios concisa para mim. Destaque pontos positivos, possíveis pontos de atenção e me dê 3 sugestões práticas e acionáveis para melhorar meus resultados no próximo período. Seja direto e use um tom de consultor de negócios. Formate a resposta em markdown, usando títulos com ** para negrito.`;
        const insights = await apiService.callGeminiAPI(prompt, button); // Passa o botão para apiService

        // Formata o Markdown para HTML
        let formattedInsights = insights
            .replace(/\*\*(.*?)\*\*/g, '<strong class="text-sky-400">$1</strong>') // Negrito
            .replace(/\*(.*?)\*/g, '<em>$1</em>') // Itálico
            // Adiciona quebras de linha para simular parágrafos para títulos
            .replace(/^(#+)\s*(.*)/gm, (match, hashes, content) => `<h${hashes.length + 2} class="font-bold mt-4 mb-2">${content}</h${hashes.length + 2}>`)
            .replace(/\n- /g, '<br>• ') // Listas
            .replace(/\n/g, '<br>'); // Novas linhas

        this.elements.insightsContainer.innerHTML = `<button id="close-insights-btn" class="absolute top-2 right-2 text-gray-400 hover:text-white p-1 rounded-full"><i data-feather="x" class="h-4 w-4"></i></button><div class="p-4">${formattedInsights}</div>`;
    },

    /**
     * Exporta os dados dos relatórios para diferentes formatos (CSV, PDF, XLSX).
     * @param {string} format - O formato de exportação ('csv', 'pdf', 'xlsx').
     */
    exportReports(format) {
        const reportType = this.elements.reportTypeFilter.value;
        const { data, headers } = utils.getReportData(reportType, dataStore.getProducts()); // Pega dados e cabeçalhos

        if (data.length === 0) {
            utils.showConfirmation("Nenhum dado para exportar para este relatório.", () => {}, this.elements); // Passa 'elements'
            return;
        }

        const fileName = `relatorio_${reportType}_${new Date().toISOString().slice(0, 10)}`;

        if (format === 'csv') utils.exportToCSV(data, headers, `${fileName}.csv`);
        if (format === 'pdf') utils.exportToPDF(data, headers, `Relatório de ${reportType}`, this.elements.printArea);
        if (format === 'xlsx') utils.exportToXLSX(data, headers, `${fileName}.xlsx`);

        this.elements.exportDropdown.classList.add('hidden'); // Esconde o dropdown após a exportação
    },
};

export { uiHandlers };