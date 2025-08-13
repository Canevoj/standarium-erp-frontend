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
    elements: null,
    appInstance: null,
    chatHistory: [],

    init(elements, app) {
        this.elements = elements;
        this.appInstance = app;
    },

    setupEventListeners() {
        let isLoginMode = true;

        this.elements.authForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = this.elements.authForm.querySelector('#email').value;
            const password = this.elements.authForm.querySelector('#password').value;
            this.elements.authError.textContent = '';
            this.elements.authSubmitBtn.disabled = true;

            try {
                if (isLoginMode) {
                    await firebaseService.signIn(email, password);
                } else {
                    await firebaseService.signUp(email, password);
                }
            } catch (error) {
                this.elements.authError.textContent = error.message;
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
            this.elements.authError.textContent = '';
        });

        this.elements.logoutBtn.addEventListener('click', () => {
            firebaseService.signOut();
        });

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
                this.appInstance.navigateTo(link.hash);
                this.elements.sidebar.classList.remove('open');
                this.elements.mobileOverlay.classList.add('hidden');
            });
        });

        this.elements.addProductBtn.addEventListener('click', () => this.showProductModal());
        this.elements.productModal.querySelector('#cancel-product-btn').addEventListener('click', () => this.hideProductModal());
        this.elements.productForm.addEventListener('submit', (e) => { e.preventDefault(); this.saveProduct(); });
        this.elements.productForm.querySelector('#status').addEventListener('change', (e) => this.toggleSaleFields(e.target.value));
        this.elements.productForm.querySelector('#type').addEventListener('change', (e) => this.toggleProductFields(e.target.value));
        
        this.elements.geminiDescBtn.addEventListener('click', () => this.generateDescription(this.elements.geminiDescBtn));

        this.elements.inventoryStatusFilter.addEventListener('change', () => this.appInstance.render.renderInventoryTable());
        this.elements.inventoryDateFilter.addEventListener('change', () => this.appInstance.render.renderInventoryTable());
        this.elements.inventorySortBy.addEventListener('change', () => this.appInstance.render.renderInventoryTable());
        this.elements.inventorySortOrder.addEventListener('change', () => this.appInstance.render.renderInventoryTable());

        this.elements.addServiceBtn.addEventListener('click', () => this.showServiceModal());
        this.elements.serviceModal.querySelector('#cancel-service-btn').addEventListener('click', () => this.hideServiceModal());
        this.elements.serviceForm.addEventListener('submit', (e) => { e.preventDefault(); this.saveService(); });

        this.elements.reportTypeFilter.addEventListener('change', () => this.appInstance.render.renderReportsPage());
        this.elements.exportBtn.addEventListener('click', () => this.elements.exportDropdown.classList.toggle('hidden'));
        
        document.addEventListener('click', (e) => {
            if (this.elements.exportBtn && !this.elements.exportBtn.contains(e.target) &&
                this.elements.exportDropdown && !this.elements.exportDropdown.contains(e.target)) {
                this.elements.exportDropdown.classList.add('hidden');
            }
        });
        this.elements.exportCsvBtn.addEventListener('click', () => this.exportReports('csv'));
        this.elements.exportPdfBtn.addEventListener('click', () => this.exportReports('pdf'));
        this.elements.exportXlsxBtn.addEventListener('click', () => this.exportReports('xlsx'));


        this.elements.dashboardPeriodFilter.addEventListener('change', (e) => this.appInstance.render.renderDashboard(e.target.value));
        this.elements.generateInsightsBtn.addEventListener('click', () => this.generateBusinessInsights(this.elements.generateInsightsBtn));
        
        this.elements.insightsContainer.addEventListener('click', (e) => {
            if (e.target.id === 'close-insights-btn' || e.target.closest('#close-insights-btn')) {
                this.elements.insightsContainer.classList.add('hidden');
                this.chatHistory = [];
            }
        });

        this.elements.addComponentBtn.addEventListener('click', () => this.showComponentModal());
        this.elements.componentModal.querySelector('#cancel-component-btn').addEventListener('click', () => this.hideComponentModal());
        this.elements.componentForm.addEventListener('submit', (e) => { e.preventDefault(); this.saveComponent(); });
        this.elements.resetBizuralBtn.addEventListener('click', () => {
            this.elements.bizuralChecklistEl.querySelectorAll('input[type="checkbox"]').forEach(c => c.checked = false);
            this.appInstance.render.calculateBizuralTotals();
        });
        this.elements.bizuralLaborInput.addEventListener('input', () => this.appInstance.render.calculateBizuralTotals());
    },

    showProductModal(product = null) {
        const form = this.elements.productForm;
        form.reset();

        form.querySelector('#data_compra').value = new Date().toISOString().split('T')[0];

        if (product) {
            this.elements.productModalTitle.textContent = 'Gerenciar Item';
            form.querySelector('#product-id').value = product.id;
            form.querySelector('#produto').value = product.PRODUTO;
            form.querySelector('#type').value = product.TIPO || 'Produto para Venda';
            form.querySelector('#custo').value = product.CUSTO;
            form.querySelector('#quantidade').value = product.QUANTIDADE; // Adicionado campo de quantidade
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
            form.querySelector('#product-id').value = '';
        }

        this.toggleProductFields(form.querySelector('#type').value);
        this.toggleSaleFields(form.querySelector('#status').value);

        this.elements.productModal.classList.remove('hidden');
    },

    hideProductModal() {
        this.elements.productModal.classList.add('hidden');
    },

    toggleSaleFields(status) {
        const saleFields = this.elements.productForm.querySelector('#sale-fields');
        if (status === 'VENDIDO') {
            saleFields.classList.remove('hidden');
        } else {
            saleFields.classList.add('hidden');
        }
    },

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

    async saveProduct() {
        const form = this.elements.productForm;
        const id = form.querySelector('#product-id').value;
        const status = form.querySelector('#status').value;
        const type = form.querySelector('#type').value;

        let productData = {
            PRODUTO: form.querySelector('#produto').value,
            TIPO: type,
            CUSTO: parseFloat(form.querySelector('#custo').value) || 0,
            QUANTIDADE: parseInt(form.querySelector('#quantidade').value) || 1, // Adicionado campo de quantidade
            PRECO_SUGERIDO: type === 'Produto para Venda' ? (parseFloat(form.querySelector('#preco_sugerido').value) || 0) : null,
            DATA_COMPRA: form.querySelector('#data_compra').value,
            METODO_COMPRA: form.querySelector('#metodo_compra').value,
            STATUS: type === 'Produto para Venda' ? status : 'N/A',
            DESCRICAO: form.querySelector('#descricao').value,
        };

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
            this.hideProductModal();
        } catch (error) {
            console.error("Erro ao salvar produto:", error);
        }
    },

    showServiceModal(service = null) {
        const form = this.elements.serviceForm;
        form.reset();

        if (service) {
            this.elements.serviceModalTitle.textContent = 'Editar Serviço';
            form.querySelector('#service-id').value = service.id;
            form.querySelector('#service-name').value = service.NOME;
            form.querySelector('#service-price').value = service.PRECO;
            form.querySelector('#service-description').value = service.DESCRICAO;
        } else {
            this.elements.serviceModalTitle.textContent = 'Adicionar Novo Serviço';
            form.querySelector('#service-id').value = '';
        }
        this.elements.serviceModal.classList.remove('hidden');
    },

    hideServiceModal() {
        this.elements.serviceModal.classList.add('hidden');
    },

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
            this.hideServiceModal();
        } catch (error) {
            console.error("Erro ao salvar serviço:", error);
        }
    },

    showComponentModal(component = null) {
        const form = this.elements.componentForm;
        form.reset();

        if (component) {
            this.elements.componentModalTitle.textContent = 'Editar Componente';
            form.querySelector('#component-id').value = component.id;
            form.querySelector('#component-name').value = component.component;
            form.querySelector('#component-cost').value = component.cost;
        } else {
            this.elements.componentModalTitle.textContent = 'Adicionar Componente';
            form.querySelector('#component-id').value = '';
        }
        this.elements.componentModal.classList.remove('hidden');
    },

    hideComponentModal() {
        this.elements.componentModal.classList.add('hidden');
    },

    async saveComponent() {
        const form = this.elements.componentForm;
        const id = form.querySelector('#component-id').value;
        const componentData = {
            component: form.querySelector('#component-name').value,
            cost: parseFloat(form.querySelector('#component-cost').value) || 0
        };
        try {
            await firebaseService.saveData('components', componentData, id, form.querySelector('.btn-primary'));
            this.hideComponentModal();
        } catch (error) {
            console.error("Erro ao salvar componente:", error);
        }
    },

    async generateDescription(button) {
        const productName = this.elements.productForm.querySelector('#produto').value;
        if (!productName) {
            utils.showConfirmation("Por favor, insira o nome do produto primeiro.", () => {}, this.elements);
            return;
        }

        const prompt = `Crie uma descrição de venda curta, atraente e profissional para o seguinte produto de eletrônicos: "${productName}". Foque nos benefícios e principais características em 2 ou 3 parágrafos. Use uma linguagem vendedora, mas honesta.`;
        const description = await apiService.callGeminiAPI(prompt, button);
        if (description) {
            this.elements.productForm.querySelector('#descricao').value = description;
        } else {
            utils.showConfirmation("Desculpe, a IA não conseguiu gerar a descrição. Tente novamente.", () => {}, this.elements);
        }
    },

    async generateBusinessInsights(button) {
        this.chatHistory = [];

        this.elements.insightsContainer.classList.remove('hidden');
        this.elements.insightsContainer.innerHTML = `
            <div class="flex justify-center items-center p-8">
                <div class="spinner"></div>
            </div>
        `;

        const period = this.elements.dashboardPeriodFilter.options[this.elements.dashboardPeriodFilter.selectedIndex].text;
        const faturamento = this.elements.metricFaturamento.textContent;
        const lucro = this.elements.metricLucro.textContent;
        const vendidos = this.elements.metricVendidos.textContent;

        const initialPrompt = `Sou dono de uma pequena empresa de revenda de eletrônicos. No período de "${period}", estes foram meus resultados: Faturamento de ${faturamento}, Lucro de ${lucro}, e ${vendidos} itens vendidos. Com base nesses números, gere uma análise de negócios concisa para mim. Destaque pontos positivos, possíveis pontos de atenção e me dê 3 sugestões práticas e acionáveis para melhorar meus resultados no próximo período. Seja direto e use um tom de consultor de negócios. Formate a resposta em markdown, usando títulos com ** para negrito.`;
        
        this.chatHistory.push({ role: 'user', parts: [{ text: initialPrompt }] });

        const insights = await apiService.callGeminiAPIWithChat(this.chatHistory, button);

        if (insights) {
            this.chatHistory.push({ role: 'model', parts: [{ text: insights }] });
            this.renderInsightsChat(insights);
        } else {
            this.elements.insightsContainer.innerHTML = `
                <button id="close-insights-btn" class="absolute top-2 right-2 text-gray-400 hover:text-white p-1 rounded-full"><i data-feather="x" class="h-4 w-4"></i></button>
                <div class="p-4 text-red-400">Desculpe, a IA não conseguiu gerar a análise. Tente novamente.</div>
            `;
            if (window.feather) feather.replace();
        }
    },

    async sendChatMessage() {
        const chatInput = this.elements.insightsContainer.querySelector('#chat-input');
        const userMessage = chatInput.value;
        if (!userMessage) return;

        chatInput.value = '';
        this.chatHistory.push({ role: 'user', parts: [{ text: userMessage }] });

        const chatBody = this.elements.insightsContainer.querySelector('#chat-body');
        chatBody.innerHTML += `<div class="bg-gray-700/50 p-3 rounded-lg self-end max-w-[80%] my-2">${userMessage}</div>`;
        chatBody.scrollTop = chatBody.scrollHeight;

        const spinner = document.createElement('div');
        spinner.id = 'ai-spinner';
        spinner.className = 'w-6 h-6 border-2 border-t-2 border-sky-400 rounded-full animate-spin my-2';
        chatBody.appendChild(spinner);
        chatBody.scrollTop = chatBody.scrollHeight;

        const sendButton = this.elements.insightsContainer.querySelector('#send-chat-btn');
        sendButton.disabled = true;

        const aiResponse = await apiService.callGeminiAPIWithChat(this.chatHistory, sendButton);

        spinner.remove();
        sendButton.disabled = false;

        if (aiResponse) {
            this.chatHistory.push({ role: 'model', parts: [{ text: aiResponse }] });
            this.renderChatMessage(aiResponse, 'model');
        }
    },

    renderInsightsChat(initialInsights) {
        const formattedInsights = this.formatMarkdownToHtml(initialInsights);
        this.elements.insightsContainer.innerHTML = `
            <div class="p-4 flex flex-col h-full">
                <div id="chat-body" class="flex-1 overflow-y-auto pr-2 pb-2">
                    <div class="bg-sky-700/30 text-sky-200 p-4 rounded-lg my-2">
                        ${formattedInsights}
                    </div>
                </div>
                <div id="chat-footer" class="flex-shrink-0 mt-4 flex items-center">
                    <input type="text" id="chat-input" placeholder="Pergunte sobre a análise..." class="form-input flex-grow mr-2">
                    <button id="send-chat-btn" class="btn btn-primary px-4 py-2">
                        <i data-feather="send" class="h-5 w-5"></i>
                    </button>
                    <button id="close-insights-btn" class="btn btn-secondary ml-2 px-4 py-2">
                         <i data-feather="x" class="h-5 w-5"></i>
                    </button>
                </div>
            </div>
        `;
        
        if (window.feather) feather.replace();

        const sendButton = this.elements.insightsContainer.querySelector('#send-chat-btn');
        const chatInput = this.elements.insightsContainer.querySelector('#chat-input');
        
        sendButton.addEventListener('click', () => this.sendChatMessage());
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.sendChatMessage();
            }
        });
    },

    renderChatMessage(message, role) {
        const chatBody = this.elements.insightsContainer.querySelector('#chat-body');
        const formattedMessage = this.formatMarkdownToHtml(message);
        const bgColor = role === 'user' ? 'bg-gray-700/50' : 'bg-sky-700/30';
        const textColor = role === 'user' ? 'text-gray-200' : 'text-sky-200';
        
        chatBody.innerHTML += `<div class="${bgColor} ${textColor} p-3 rounded-lg self-start max-w-[80%] my-2">${formattedMessage}</div>`;
        chatBody.scrollTop = chatBody.scrollHeight;
    },

    exportReports(format) {
        const reportType = this.elements.reportTypeFilter.value;
        const { data, headers } = utils.getReportData(reportType, dataStore.getProducts());

        if (data.length === 0) {
            utils.showConfirmation("Nenhum dado para exportar para este relatório.", () => {}, this.elements);
            return;
        }

        const fileName = `relatorio_${reportType}_${new Date().toISOString().slice(0, 10)}`;

        if (format === 'csv') utils.exportToCSV(data, headers, `${fileName}.csv`);
        if (format === 'pdf') utils.exportToPDF(data, headers, `Relatório de ${reportType}`, this.elements.printArea);
        if (format === 'xlsx') utils.exportToXLSX(data, headers, `${fileName}.xlsx`);

        this.elements.exportDropdown.classList.add('hidden');
    },

    formatMarkdownToHtml(markdown) {
        return markdown
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/^(#+)\s*(.*)/gm, (match, hashes, content) => `<h${hashes.length + 2} class="font-bold mt-4 mb-2">${content}</h${hashes.length + 2}>`)
            .replace(/\n- /g, '<br>• ')
            .replace(/\n/g, '<br>');
    }
};

export { uiHandlers };
