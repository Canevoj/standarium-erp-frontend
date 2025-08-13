/*
 * Arquivo: dom-manager.js
 * Descrição: Módulo responsável por injetar o HTML dinâmico nas seções
 * e modais, e por cachear as referências aos elementos DOM.
 */

const domManager = {
    /**
     * Injeta o HTML inicial das páginas e modais no DOM.
     * Isso ajuda a manter o index.html limpo e centraliza a estrutura de UI.
     */
    injectHTML() {
        // Páginas
        document.getElementById('page-dashboard').innerHTML = `
            <div class="flex flex-wrap gap-4 justify-between items-center mb-6">
                <h1 class="text-3xl font-bold">Dashboard</h1>
                <div class="flex items-center gap-4">
                    <button id="generate-insights-btn" class="btn gemini-btn font-bold">✨ Gerar Análise</button>
                    <div class="w-48">
                        <select id="dashboard-period-filter" class="form-select text-sm">
                            <option value="all_time">Todo o Período</option>
                            <option value="this_month">Este Mês</option>
                            <option value="last_30_days">Últimos 30 Dias</option>
                        </select>
                    </div>
                </div>
            </div>
            <div id="insights-container" class="hidden relative bg-gray-800/50 border border-sky-500/20 rounded-lg mb-8 text-gray-300"></div>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div class="bg-gray-800 p-6 rounded-lg">
                    <h3 class="text-gray-400 text-sm font-medium">Faturamento (no período)</h3>
                    <p id="metric-faturamento" class="text-3xl font-bold text-sky-400 mt-2">R$ 0,00</p>
                </div>
                <div class="bg-gray-800 p-6 rounded-lg">
                    <h3 class="text-gray-400 text-sm font-medium">Lucro (no período)</h3>
                    <p id="metric-lucro" class="text-3xl font-bold text-green-400 mt-2">R$ 0,00</p>
                </div>
                <div class="bg-gray-800 p-6 rounded-lg">
                    <h3 class="text-gray-400 text-sm font-medium">Itens Vendidos (no período)</h3>
                    <p id="metric-vendidos" class="text-3xl font-bold text-white mt-2">0</p>
                </div>
                <div class="bg-gray-800 p-6 rounded-lg">
                    <h3 class="text-gray-400 text-sm font-medium">Valor do Estoque Atual</h3>
                    <p id="metric-estoque" class="text-3xl font-bold text-orange-400 mt-1">R$ 0,00</p>
                    <p id="metric-custo-estoque" class="text-xs text-gray-500"></p>
                </div>
            </div>
            <div class="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div class="lg:col-span-3 bg-gray-800 p-6 rounded-lg">
                    <h3 class="font-bold mb-4">Vendas vs Custos por Mês</h3>
                    <div class="chart-container"><canvas id="sales-cost-chart"></canvas></div>
                </div>
                <div class="lg:col-span-2 bg-gray-800 p-6 rounded-lg">
                    <h3 class="font-bold mb-4">Vendas por Método</h3>
                    <div class="chart-container"><canvas id="sales-by-method-chart"></canvas></div>
                </div>
            </div>
        `;
        document.getElementById('page-inventory').innerHTML = `
            <div class="flex flex-wrap gap-4 justify-between items-center mb-6">
                <h1 class="text-3xl font-bold">Estoque e Despesas</h1>
                <button id="add-product-btn" class="btn btn-primary"><i data-feather="plus" class="mr-2 h-5 w-5"></i> Adicionar Item</button>
            </div>
            <div class="bg-gray-800/50 p-4 rounded-lg mb-6 flex flex-wrap items-center gap-4">
                <div class="flex-grow">
                    <label for="inventory-status-filter" class="text-xs text-gray-400">Filtrar por Status</label>
                    <select id="inventory-status-filter" class="form-select mt-1">
                        <option value="all">Todos</option>
                        <option value="EM ESTOQUE">Em Estoque</option>
                        <option value="EM TRÂNSITO">Em Trânsito</option>
                        <option value="VENDIDO">Vendido</option>
                        <option value="Consumo">Consumo</option>
                    </select>
                </div>
                <div class="flex-grow">
                    <label for="inventory-date-filter" class="text-xs text-gray-400">Filtrar por Data de Compra</label>
                    <input type="date" id="inventory-date-filter" class="form-input mt-1">
                </div>
                <div class="flex-grow">
                    <label for="inventory-sort-by" class="text-xs text-gray-400">Ordenar por</label>
                    <div class="flex gap-2 mt-1">
                        <select id="inventory-sort-by" class="form-select">
                            <option value="date">Data</option>
                            <option value="cost">Custo</option>
                        </select>
                        <select id="inventory-sort-order" class="form-select">
                            <option value="desc">Descendente</option>
                            <option value="asc">Ascendente</option>
                        </select>
                    </div>
                </div>
            </div>
            <div class="bg-gray-800 rounded-lg overflow-x-auto">
                <table class="w-full text-left text-sm">
                    <thead class="bg-gray-700/50 text-xs text-gray-400 uppercase">
                        <tr>
                            <th class="p-4">Produto</th>
                            <th class="p-4">Status</th>
                            <th class="p-4 text-center">Quantidade</th>
                            <th class="p-4 text-right">Custo Unitário</th>
                            <th class="p-4 text-right">Preço Sugerido</th>
                            <th class="p-4 text-center">Data Compra</th>
                            <th class="p-4 text-right">Venda Final</th>
                            <th class="p-4 text-center">Ações</th>
                        </tr>
                    </thead>
                    <tbody id="inventory-table-body" class="divide-y divide-gray-700"></tbody>
                </table>
            </div>
        `;
        document.getElementById('page-services').innerHTML = `
            <div class="flex justify-between items-center mb-6">
                <h1 class="text-3xl font-bold">Serviços Oferecidos</h1>
                <button id="add-service-btn" class="btn btn-primary"><i data-feather="plus" class="mr-2 h-5 w-5"></i> Adicionar Serviço</button>
            </div>
            <div class="bg-gray-800 rounded-lg overflow-x-auto">
                <table class="w-full text-left text-sm">
                    <thead class="bg-gray-700/50 text-xs text-gray-400 uppercase">
                        <tr>
                            <th class="p-4">Nome</th>
                            <th class="p-4">Descrição</th>
                            <th class="p-4 text-right">Preço</th>
                            <th class="p-4 text-center">Ações</th>
                        </tr>
                    </thead>
                    <tbody id="services-table-body" class="divide-y divide-gray-700"></tbody>
                </table>
            </div>
        `;
        document.getElementById('page-reports').innerHTML = `
            <div class="flex flex-wrap gap-4 justify-between items-center mb-6">
                <h1 class="text-3xl font-bold">Relatórios</h1>
                <div class="flex items-center gap-4">
                    <select id="report-type-filter" class="form-select w-48">
                        <option value="sales">Vendas</option>
                        <option value="purchases">Compras</option>
                        <option value="stock">Estoque Atual</option>
                    </select>
                    <div class="relative">
                        <button id="export-btn" class="btn btn-secondary"><i data-feather="download" class="mr-2 h-4 w-4"></i> Exportar</button>
                        <div id="export-dropdown" class="export-dropdown hidden absolute z-10 w-48 bg-gray-700 rounded-md shadow-lg">
                            <a href="#" id="export-csv-btn" class="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-600">Exportar para CSV</a>
                            <a href="#" id="export-pdf-btn" class="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-600">Exportar para PDF</a>
                            <a href="#" id="export-xlsx-btn" class="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-600">Exportar para XLSX</a>
                        </div>
                    </div>
                </div>
            </div>
            <div class="bg-gray-800 rounded-lg overflow-x-auto">
                <table class="w-full text-left">
                    <thead id="report-table-head" class="bg-gray-700/50"></thead>
                    <tbody id="report-table-body" class="divide-y divide-gray-700"></tbody>
                </table>
            </div>
        `;
        document.getElementById('page-bizural').innerHTML = `
            <h1 class="text-3xl font-bold mb-6">Calculadora de Montagem</h1>
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div class="lg:col-span-2 bg-gray-800 p-6 rounded-lg">
                    <div class="flex justify-between items-center border-b border-gray-700 pb-2 mb-4">
                        <h2 class="text-xl font-bold">Checklist de Componentes</h2>
                        <button id="add-component-btn" class="btn btn-primary btn-sm"><i data-feather="plus" class="h-4 w-4 mr-1"></i> Adicionar</button>
                    </div>
                    <div id="bizural-checklist" class="space-y-3"></div>
                </div>
                <div class="bg-gray-800 p-6 rounded-lg self-start">
                    <h2 class="text-xl font-bold mb-4">Resumo Financeiro</h2>
                    <div class="space-y-4">
                        <div>
                            <label class="text-sm text-gray-400">Custo Total dos Componentes</label>
                            <p id="bizural-cost" class="text-2xl font-bold">R$ 0,00</p>
                        </div>
                        <div>
                            <label for="bizural-labor" class="text-sm text-gray-400">Taxa de Montagem</label>
                            <input type="number" step="0.01" id="bizural-labor" class="form-input mt-1" value="150">
                        </div>
                        <div class="border-t border-gray-700 pt-4">
                            <label class="text-sm text-gray-400">Preço de Venda Sugerido (Lucro 30%)</label>
                            <p id="bizural-price" class="text-3xl font-bold text-sky-400">R$ 0,00</p>
                        </div>
                        <button id="reset-bizural-btn" class="w-full btn btn-secondary mt-4">Limpar Seleção</button>
                    </div>
                </div>
            </div>
        `;

        // Modais
        document.getElementById('product-modal').innerHTML = `
            <div class="bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl modal-content">
                <form id="product-form" class="p-6 space-y-4">
                    <div class="flex justify-between items-start">
                        <h2 id="product-modal-title" class="text-2xl font-bold">Adicionar Item</h2>
                        <button type="button" class="btn-icon" id="cancel-product-btn">&times;</button>
                    </div>
                    <input type="hidden" id="product-id">
                    <div>
                        <label class="text-sm font-medium">Tipo de Item</label>
                        <select id="type" class="form-select">
                            <option value="Produto para Venda">Produto para Venda</option>
                            <option value="Consumo">Consumo</option>
                        </select>
                    </div>
                    <div>
                        <label for="produto" class="text-sm font-medium">Nome / Descrição do Item</label>
                        <input type="text" id="produto" class="form-input" required>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <fieldset class="border border-gray-600 p-3 rounded-lg">
                            <legend class="text-sm px-2 text-gray-400">Detalhes da Compra</legend>
                            <div class="space-y-4">
                                <label>Quantidade
                                    <input type="number" step="1" id="quantidade" class="form-input" value="1" required>
                                </label>
                                <label>Custo de Aquisição (Total)
                                    <input type="number" step="0.01" id="custo" class="form-input" required>
                                </label>
                                <label>Data da Compra
                                    <input type="date" id="data_compra" class="form-input" required>
                                </label>
                                <label>Método de Compra
                                    <select id="metodo_compra" class="form-select">
                                        <option value="Pix">Pix</option>
                                        <option value="Cartão">Cartão</option>
                                        <option value="Dinheiro">Dinheiro</option>
                                        <option value="Outro">Outro</option>
                                    </select>
                                </label>
                            </div>
                        </fieldset>
                        <div id="product-for-sale-fields">
                            <fieldset class="border border-gray-600 p-3 rounded-lg">
                                <legend class="text-sm px-2 text-gray-400">Detalhes de Venda</legend>
                                <div class="space-y-4">
                                    <label>Preço Sugerido de Venda (Unitário)
                                        <input type="number" step="0.01" id="preco_sugerido" class="form-input">
                                    </label>
                                    <label>Status do Produto
                                        <select id="status" class="form-select">
                                            <option value="EM ESTOQUE">EM ESTOQUE</option>
                                            <option value="EM TRÂNSITO">EM TRÂNSITO</option>
                                            <option value="VENDIDO">VENDIDO</option>
                                        </select>
                                    </label>
                                    <div id="sale-fields" class="hidden space-y-4 border-t border-dashed border-sky-500 pt-4 mt-4">
                                        <label>Quantidade Vendida
                                            <input type="number" step="1" id="quantidade-vendida" class="form-input">
                                        </label>
                                        <label>Valor Final da Venda (Total)
                                            <input type="number" step="0.01" id="valor_venda" class="form-input">
                                        </label>
                                        <label>Data da Venda
                                            <input type="date" id="data_venda" class="form-input">
                                        </label>
                                        <label>Método de Venda
                                            <select id="metodo_venda" class="form-select">
                                                <option value="Pix">Pix</option>
                                                <option value="Cartão">Cartão</option>
                                                <option value="Dinheiro">Dinheiro</option>
                                                <option value="Outro">Outro</option>
                                            </select>
                                        </label>
                                    </div>
                                </div>
                            </fieldset>
                        </div>
                    </div>
                    <div id="product-description-field">
                        <div class="flex items-center justify-between">
                            <label for="descricao" class="text-sm font-medium">Descrição para Venda</label>
                            <button type="button" id="gemini-desc-btn" class="gemini-btn font-bold">✨ Gerar</button>
                        </div>
                        <textarea id="descricao" rows="3" class="form-textarea"></textarea>
                    </div>
                    <div class="pt-4 flex justify-end">
                        <button type="submit" class="btn btn-primary">Salvar Item</button>
                    </div>
                </form>
            </div>
        `;
        document.getElementById('service-modal').innerHTML = `
            <div class="bg-gray-800 rounded-lg shadow-xl w-full max-w-lg modal-content">
                <form id="service-form" class="p-6 space-y-4">
                    <h2 id="service-modal-title" class="text-2xl font-bold">Adicionar/Editar Serviço</h2>
                    <input type="hidden" id="service-id">
                    <div>
                        <label for="service-name" class="text-sm font-medium">Nome do Serviço</label>
                        <input type="text" id="service-name" class="form-input" required>
                    </div>
                    <div>
                        <label for="service-price" class="text-sm font-medium">Preço (R$)</label>
                        <input type="number" step="0.01" id="service-price" class="form-input" required>
                    </div>
                    <div>
                        <label for="service-description" class="text-sm font-medium">Descrição</label>
                        <textarea id="service-description" rows="3" class="form-textarea"></textarea>
                    </div>
                    <div class="pt-4 flex justify-end space-x-3">
                        <button type="button" id="cancel-service-btn" class="btn btn-secondary">Cancelar</button>
                        <button type="submit" class="btn btn-primary">Salvar Serviço</button>
                    </div>
                </form>
            </div>
        `;
        document.getElementById('component-modal').innerHTML = `
            <div class="bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
                <form id="component-form" class="p-6 space-y-4">
                    <h2 id="component-modal-title" class="text-2xl font-bold">Adicionar Componente</h2>
                    <input type="hidden" id="component-id">
                    <div>
                        <label for="component-name" class="text-sm font-medium">Nome do Componente</label>
                        <input type="text" id="component-name" class="form-input" required>
                    </div>
                    <div>
                        <label for="component-cost" class="text-sm font-medium">Custo (R$)</label>
                        <input type="number" step="0.01" id="component-cost" class="form-input" required>
                    </div>
                    <div class="pt-4 flex justify-end space-x-3">
                        <button type="button" id="cancel-component-btn" class="btn btn-secondary">Cancelar</button>
                        <button type="submit" class="btn btn-primary">Salvar Componente</button>
                    </div>
                </form>
            </div>
        `;
        document.getElementById('confirm-modal').innerHTML = `
            <div class="bg-gray-800 rounded-lg shadow-xl w-full max-w-sm p-6">
                <h2 id="confirm-title" class="text-xl font-bold mb-4">Confirmar Ação</h2>
                <p id="confirm-text" class="text-gray-300 mb-6">Você tem certeza?</p>
                <div class="flex justify-end space-x-3">
                    <button id="confirm-cancel-btn" class="btn btn-secondary">Cancelar</button>
                    <button id="confirm-ok-btn" class="btn bg-red-600 text-white hover:bg-red-700">Confirmar</button>
                </div>
            </div>
        `;
    },
        document.getElementById('sale-modal').innerHTML = `
    <div class="bg-gray-800 rounded-lg shadow-xl w-full max-w-lg modal-content">
        <form id="sale-form" class="p-6 space-y-4">
            <div class="flex justify-between items-start">
                <div>
                    <h2 id="sale-modal-title" class="text-2xl font-bold">Registrar Venda</h2>
                    <p id="sale-product-name" class="text-gray-400"></p>
                </div>
                <button type="button" class="btn-icon" id="cancel-sale-btn">&times;</button>
            </div>
            
            <input type="hidden" id="sale-product-id">
            <input type="hidden" id="sale-product-cost">
            
            <div class="p-3 bg-gray-900/50 rounded-md text-center">
                <span>Estoque Atual: </span>
                <span id="sale-stock-quantity" class="font-bold text-sky-400 text-lg"></span>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label for="sale-quantity" class="text-sm font-medium">Quantidade a Vender</label>
                    <input type="number" id="sale-quantity" class="form-input" required min="1">
                </div>
                <div>
                    <label for="sale-price" class="text-sm font-medium">Preço de Venda (Unitário)</label>
                    <input type="number" step="0.01" id="sale-price" class="form-input" required>
                </div>
            </div>

            <div>
                <label for="sale-method" class="text-sm font-medium">Método de Pagamento</label>
                <select id="sale-method" class="form-select">
                    <option value="Pix">Pix</option>
                    <option value="Cartão">Cartão</option>
                    <option value="Dinheiro">Dinheiro</option>
                    <option value="Outro">Outro</option>
                </select>
            </div>

            <div class="pt-4 flex justify-end">
                <button type="submit" class="btn btn-primary bg-green-600 hover:bg-green-700">Confirmar Venda</button>
            </div>
        </form>
    </div>
    `;

    /**
     * Cacheia e retorna referências para elementos DOM importantes.
     * Isso evita a necessidade de buscar elementos repetidamente, otimizando o desempenho.
     * @returns {object} Um objeto contendo as referências dos elementos DOM.
     */
    cacheDOMElements() {
    return {
        // Overlays e contêineres principais
        loadingOverlay: document.getElementById('loading-overlay'),
        loadingText: document.getElementById('loading-text'),
        authContainer: document.getElementById('auth-container'),
        appContainer: document.getElementById('app-container'),

        // Autenticação
        authForm: document.getElementById('auth-form'),
        authTitle: document.getElementById('auth-title'),
        authSubtitle: document.getElementById('auth-subtitle'),
        authSubmitBtn: document.getElementById('auth-submit-btn'),
        authToggleText: document.getElementById('auth-toggle-text'),
        authToggleBtn: document.getElementById('auth-toggle-btn'),
        authError: document.getElementById('auth-error'),

        // Sidebar e navegação
        sidebar: document.getElementById('sidebar'),
        sidebarToggle: document.getElementById('sidebar-toggle'),
        mobileMenuBtn: document.getElementById('mobile-menu-btn'),
        mobileOverlay: document.getElementById('mobile-overlay'),
        sidebarLinks: document.querySelectorAll('.sidebar-link'),
        logoutBtn: document.getElementById('logout-btn'),

        // Páginas de conteúdo
        pages: document.querySelectorAll('.page'),
        mainContent: document.getElementById('main-content'),

        // Dashboard
        metricFaturamento: document.getElementById('metric-faturamento'),
        metricLucro: document.getElementById('metric-lucro'),
        metricEstoque: document.getElementById('metric-estoque'),
        metricCustoEstoque: document.getElementById('metric-custo-estoque'),
        metricVendidos: document.getElementById('metric-vendidos'),
        dashboardPeriodFilter: document.getElementById('dashboard-period-filter'),
        salesCostChartCanvas: document.getElementById('sales-cost-chart'),
        salesByMethodChartCanvas: document.getElementById('sales-by-method-chart'),
        generateInsightsBtn: document.getElementById('generate-insights-btn'),
        insightsContainer: document.getElementById('insights-container'),

        // Estoque
        addProductBtn: document.getElementById('add-product-btn'),
        inventoryTableBody: document.getElementById('inventory-table-body'),
        inventoryStatusFilter: document.getElementById('inventory-status-filter'),
        inventoryDateFilter: document.getElementById('inventory-date-filter'),
        inventorySortBy: document.getElementById('inventory-sort-by'),
        inventorySortOrder: document.getElementById('inventory-sort-order'),
        productModal: document.getElementById('product-modal'),
        productModalTitle: document.getElementById('product-modal-title'),
        productForm: document.getElementById('product-form'),
        geminiDescBtn: document.getElementById('gemini-desc-btn'),

        // Serviços
        addServiceBtn: document.getElementById('add-service-btn'),
        servicesTableBody: document.getElementById('services-table-body'),
        serviceModal: document.getElementById('service-modal'),
        serviceForm: document.getElementById('service-form'),
        serviceModalTitle: document.getElementById('service-modal-title'),

        // Relatórios
        reportTableBody: document.getElementById('report-table-body'),
        reportTableHead: document.querySelector('#page-reports thead'),
        reportTypeFilter: document.getElementById('report-type-filter'),
        exportBtn: document.getElementById('export-btn'),
        exportDropdown: document.getElementById('export-dropdown'),
        exportCsvBtn: document.getElementById('export-csv-btn'),
        exportPdfBtn: document.getElementById('export-pdf-btn'),
        exportXlsxBtn: document.getElementById('export-xlsx-btn'),
        printArea: document.getElementById('print-area'),

        // Bizural (Montagem)
        bizuralChecklistEl: document.getElementById('bizural-checklist'),
        bizuralCostEl: document.getElementById('bizural-cost'),
        bizuralLaborInput: document.getElementById('bizural-labor'),
        bizuralPriceEl: document.getElementById('bizural-price'),
        resetBizuralBtn: document.getElementById('reset-bizural-btn'),
        addComponentBtn: document.getElementById('add-component-btn'),
        componentModal: document.getElementById('component-modal'),
        componentModalTitle: document.getElementById('component-modal-title'),
        componentForm: document.getElementById('component-form'),

        // Modal de Confirmação
        confirmModal: document.getElementById('confirm-modal'),
        confirmText: document.getElementById('confirm-text'),
        confirmOkBtn: document.getElementById('confirm-ok-btn'),
        confirmCancelBtn: document.getElementById('confirm-cancel-btn'),

        // --- ELEMENTOS DO NOVO MODAL DE VENDA ---
        saleModal: document.getElementById('sale-modal'),
        saleForm: document.getElementById('sale-form'),
        cancelSaleBtn: document.getElementById('cancel-sale-btn')
    };
},

export { domManager };
