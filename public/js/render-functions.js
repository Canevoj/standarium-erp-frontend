/*
 * Arquivo: render-functions.js
 * Descrição: Módulo responsável por renderizar o conteúdo dinâmico da aplicação,
 * incluindo o dashboard, tabelas de estoque e serviços, relatórios e a calculadora Bizural.
 */

import { dataStore } from './data-store.js';
import { uiHandlers } from './ui-handlers.js'; // Para acessar showProductModal, etc.
import { utils } from './utils.js'; // Para funções utilitárias como formatCurrency

const renderFunctions = {
    elements: null, // Referência aos elementos DOM
    appInstance: null, // Referência à instância principal do app (para navegação, etc.)
    charts: {}, // Armazena instâncias de gráficos Chart.js

    init(elements, app) {
        this.elements = elements;
        this.appInstance = app;
        // Copia a referência do charts para o objeto renderFunctions
        this.charts = app.charts;
    },

    /**
     * Renderiza todas as partes da UI que dependem de mudanças nos dados.
     * Chamado após atualizações dos dados do Firestore.
     */
    renderAll() {
        // Pega o período do filtro do dashboard. Se não houver filtro, usa 'all_time'.
        const dashboardPeriod = this.elements.dashboardPeriodFilter ? this.elements.dashboardPeriodFilter.value : 'all_time';
        this.renderDashboard(dashboardPeriod);
        this.renderInventoryTable();
        this.renderReportsPage();
        // Garante que os ícones do Feather Icons sejam substituídos após a renderização
        if (window.feather) feather.replace();
    },

    /**
     * Renderiza o dashboard com base nos produtos vendidos e no período selecionado.
     * @param {string} period - Período para filtrar os dados ('all_time', 'this_month', 'last_30_days').
     */
    renderDashboard(period) {
        const now = new Date();
        const products = dataStore.getProducts(); // Pega os produtos do dataStore

        // Filtra produtos vendidos com base no período
        const filteredProducts = products.filter(p => {
            // Apenas produtos para venda e com status 'VENDIDO'
            if (p.TIPO !== 'Produto para Venda' || !p.STATUS || p.STATUS !== 'VENDIDO') return false;
            // Converte a data de venda para objeto Date
            const saleDate = p.DATA_VENDA ? new Date(p.DATA_VENDA + 'T00:00:00') : null;
            if (!saleDate) return false; // Ignora se não houver data de venda

            // Lógica de filtragem por período
            if (period === 'all_time') return true; // Todos os tempos
            if (period === 'last_30_days') {
                const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                return saleDate >= thirtyDaysAgo;
            }
            if (period === 'this_month') {
                return saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear();
            }
            return true; // Caso padrão, deve cobrir 'all_time'
        });

        // Calcula métricas
        const totalProfit = filteredProducts.reduce((acc, p) => acc + ((p.VALOR_VENDA || 0) - (p.CUSTO || 0)), 0);
        const totalRevenue = filteredProducts.reduce((acc, p) => acc + (p.VALOR_VENDA || 0), 0);

        // Calcula valor e custo do estoque atual (apenas produtos para venda em estoque)
        const stockProducts = products.filter(p => p.TIPO === 'Produto para Venda' && p.STATUS !== 'VENDIDO');
        const stockValue = stockProducts.reduce((acc, p) => acc + (p.PRECO_SUGERIDO || 0), 0);
        const stockCost = stockProducts.reduce((acc, p) => acc + (p.CUSTO || 0), 0);

        // Atualiza os elementos DOM com as métricas
        this.elements.metricFaturamento.textContent = utils.formatCurrency(totalRevenue);
        this.elements.metricLucro.textContent = utils.formatCurrency(totalProfit);
        this.elements.metricEstoque.textContent = utils.formatCurrency(stockValue);
        this.elements.metricCustoEstoque.innerHTML = `Custo: <span class="text-gray-400">${utils.formatCurrency(stockCost)}</span>`;
        this.elements.metricVendidos.textContent = filteredProducts.length;

        // Renderiza os gráficos do dashboard
        this.renderSalesCostChart(products); // Usa todos os produtos para o gráfico de vendas vs custos
        this.renderSalesByMethodChart(filteredProducts); // Usa produtos filtrados para vendas por método

        // Oculta e limpa o container de insights ao re-renderizar o dashboard
        this.elements.insightsContainer.classList.add('hidden');
        this.elements.insightsContainer.innerHTML = '';
    },

    /**
     * Renderiza a tabela de inventário com base nos filtros e ordenação.
     */
    renderInventoryTable() {
        const statusFilter = this.elements.inventoryStatusFilter.value;
        const dateFilter = this.elements.inventoryDateFilter.value;
        const sortBy = this.elements.inventorySortBy.value;
        const sortOrder = this.elements.inventorySortOrder.value;

        let items = [...dataStore.getProducts()]; // Pega uma cópia dos produtos do dataStore

        // Aplica filtro por status/tipo
        if (statusFilter !== 'all') {
            if (statusFilter === 'Consumo') {
                items = items.filter(p => p.TIPO === 'Consumo');
            } else {
                items = items.filter(p => p.STATUS === statusFilter && p.TIPO === 'Produto para Venda');
            }
        }
        // Aplica filtro por data de compra
        if (dateFilter) {
            items = items.filter(p => p.DATA_COMPRA === dateFilter);
        }

        // Ordena os itens
        items.sort((a, b) => {
            let valA, valB;
            if (sortBy === 'date') {
                valA = new Date(a.DATA_COMPRA + 'T00:00:00'); // Garante comparação de data
                valB = new Date(b.DATA_COMPRA + 'T00:00:00');
            } else { // sortBy === 'cost'
                valA = a.CUSTO || 0;
                valB = b.CUSTO || 0;
            }
            return sortOrder === 'asc' ? valA - valB : valB - valA;
        });

        // Limpa o corpo da tabela
        this.elements.inventoryTableBody.innerHTML = '';

        // Exibe mensagem se não houver itens
        if (items.length === 0) {
            this.elements.inventoryTableBody.innerHTML = `<tr><td colspan="7" class="text-center p-8 text-gray-500">Nenhum item encontrado.</td></tr>`;
            return;
        }

        // Popula a tabela com os itens filtrados e ordenados
        items.forEach(p => {
            const isExpense = p.TIPO === 'Consumo';
            const status = p.STATUS || 'EM BRANCO';
            // Mapeamento de classes CSS para diferentes status
            const statusMap = {
                'EM ESTOQUE': 'bg-sky-500/10 text-sky-400',
                'EM TRÂNSITO': 'bg-yellow-500/10 text-yellow-400',
                'VENDIDO': 'bg-gray-500/10 text-gray-400',
                'N/A': 'bg-purple-500/10 text-purple-400',
                'default': 'bg-gray-600/10 text-gray-500'
            };
            const statusClass = statusMap[status] || statusMap.default;
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-700/50 text-sm';
            row.innerHTML = `
                <td class="p-4 font-medium">${p.PRODUTO}</td>
                <td class="p-4"><span class="px-2 py-1 text-xs font-semibold rounded-full ${statusClass}">${isExpense ? 'Consumo' : status}</span></td>
                <td class="p-4 text-right">${utils.formatCurrency(p.CUSTO)}</td>
                <td class="p-4 text-right">${isExpense ? '---' : utils.formatCurrency(p.PRECO_SUGERIDO)}</td>
                <td class="p-4 text-center">${p.DATA_COMPRA ? new Date(p.DATA_COMPRA + 'T00:00:00').toLocaleDateString('pt-BR') : '---'}</td>
                <td class="p-4 text-right font-bold text-green-400">${p.STATUS === 'VENDIDO' && !isExpense ? utils.formatCurrency(p.VALOR_VENDA) : '---'}</td>
                <td class="p-4 text-center space-x-2">
                    <button class="btn-edit btn btn-sm bg-orange-500 hover:bg-orange-600 text-white">Gerenciar</button>
                </td>`;
            // Adiciona listener para o botão "Gerenciar"
            row.querySelector('.btn-edit').addEventListener('click', () => uiHandlers.showProductModal(p));
            this.elements.inventoryTableBody.appendChild(row);
        });
    },

    /**
     * Renderiza a tabela de serviços.
     */
    renderServicesTable() {
        // Verifica se o elemento existe antes de tentar manipular
        if (!this.elements.servicesTableBody) return;

        this.elements.servicesTableBody.innerHTML = ''; // Limpa o corpo da tabela
        const services = dataStore.getServices(); // Pega os serviços do dataStore

        // Exibe mensagem se não houver serviços
        if (services.length === 0) {
            this.elements.servicesTableBody.innerHTML = `<tr><td colspan="4" class="text-center p-8 text-gray-500">Nenhum serviço cadastrado.</td></tr>`;
            return;
        }

        // Popula a tabela com os serviços (ordenados por nome)
        [...services].sort((a, b) => (a.NOME || '').localeCompare(b.NOME || '')).forEach(s => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-700/50 text-sm';
            row.innerHTML = `
                <td class="p-4 font-medium">${s.NOME}</td>
                <td class="p-4">${s.DESCRICAO || '---'}</td>
                <td class="p-4 text-right font-bold">${utils.formatCurrency(s.PRECO)}</td>
                <td class="p-4 text-center space-x-2">
                    <button class="btn-edit btn btn-sm bg-orange-500 hover:bg-orange-600 text-white">Editar</button>
                    <button class="btn-delete btn btn-sm bg-red-600 hover:bg-red-700 text-white">Excluir</button>
                </td>`;
            // Adiciona listeners para os botões "Editar" e "Excluir"
            row.querySelector('.btn-edit').addEventListener('click', () => uiHandlers.showServiceModal(s));
            row.querySelector('.btn-delete').addEventListener('click', () => {
                utils.showConfirmation("Deseja realmente excluir este item?", async () => {
                    await firebaseService.deleteData('services', s.id);
                });
            });
            this.elements.servicesTableBody.appendChild(row);
        });
    },

    /**
     * Renderiza a página de relatórios com base no tipo de relatório selecionado.
     */
    renderReportsPage() {
        const reportType = this.elements.reportTypeFilter.value;
        const { data, headers } = utils.getReportData(reportType, dataStore.getProducts()); // Pega dados e cabeçalhos

        // Popula o cabeçalho da tabela de relatórios
        this.elements.reportTableHead.innerHTML = `<tr>${headers.map(h => `<th class="p-4 text-left text-xs uppercase text-gray-400">${h}</th>`).join('')}</tr>`;
        this.elements.reportTableBody.innerHTML = ''; // Limpa o corpo da tabela

        // Exibe mensagem se não houver dados para o relatório
        if (data.length === 0) {
            this.elements.reportTableBody.innerHTML = `<tr><td colspan="${headers.length}" class="text-center p-8 text-gray-500">Nenhum registro para este relatório.</td></tr>`;
            return;
        }

        // Popula a tabela com os dados do relatório
        data.forEach(rowData => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-700/50 text-sm';
            let cellHTML = '';
            headers.forEach(headerKey => {
                // Encontra a chave correspondente no rowData, normalizando para comparação (ex: "Data Compra" vs "DATA_COMPRA")
                const key = Object.keys(rowData).find(k => utils.normalizeHeader(k) === utils.normalizeHeader(headerKey));
                let cellData = rowData[key];
                // Formata valores numéricos como moeda, exceto para a coluna 'Produto'
                if (typeof cellData === 'number' && utils.normalizeHeader(headerKey) !== 'produto') {
                    cellData = utils.formatCurrency(cellData);
                }
                cellHTML += `<td class="p-4 whitespace-nowrap">${cellData !== undefined && cellData !== null ? cellData : '---'}</td>`;
            });
            row.innerHTML = cellHTML;
            this.elements.reportTableBody.appendChild(row);
        });
    },

    /**
     * Renderiza o gráfico de Vendas vs Custos por Mês.
     * @param {Array<object>} products - A lista de produtos para gerar o gráfico.
     */
    renderSalesCostChart(products) {
        if (!this.elements.salesCostChartCanvas) return; // Verifica se o canvas existe

        const ctx = this.elements.salesCostChartCanvas.getContext('2d');
        if (this.charts.salesCost) this.charts.salesCost.destroy(); // Destrói o gráfico anterior, se existir

        // Agrupa custos e vendas por mês
        const monthlyData = products.reduce((acc, p) => {
            if (p.DATA_COMPRA) {
                const month = p.DATA_COMPRA.substring(0, 7); // Ex: "AAAA-MM"
                if (!acc[month]) acc[month] = { costs: 0, sales: 0 };
                acc[month].costs += p.CUSTO || 0;
            }
            if (p.DATA_VENDA && p.STATUS === 'VENDIDO') {
                const month = p.DATA_VENDA.substring(0, 7);
                if (!acc[month]) acc[month] = { costs: 0, sales: 0 };
                acc[month].sales += p.VALOR_VENDA || 0;
            }
            return acc;
        }, {});

        const sortedMonths = Object.keys(monthlyData).sort(); // Ordena os meses

        // Cria o novo gráfico de barras
        this.charts.salesCost = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: sortedMonths,
                datasets: [
                    {
                        label: 'Vendas',
                        data: sortedMonths.map(m => monthlyData[m].sales),
                        backgroundColor: '#0ea5e9', // Cor azul
                    },
                    {
                        label: 'Custos',
                        data: sortedMonths.map(m => monthlyData[m].costs),
                        backgroundColor: '#f97316', // Cor laranja
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false, // Permite que o gráfico se ajuste ao contêiner
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { color: '#9ca3af' } // Cor do texto do eixo Y
                    },
                    x: {
                        ticks: { color: '#9ca3af' } // Cor do texto do eixo X
                    }
                },
                plugins: {
                    legend: {
                        labels: { color: '#d1d5db' } // Cor do texto da legenda
                    }
                }
            }
        });
    },

    /**
     * Renderiza o gráfico de Vendas por Método.
     * @param {Array<object>} data - A lista de produtos (já filtrados) para gerar o gráfico.
     */
    renderSalesByMethodChart(data) {
        if (!this.elements.salesByMethodChartCanvas) return; // Verifica se o canvas existe

        const ctx = this.elements.salesByMethodChartCanvas.getContext('2d');
        if (this.charts.salesByMethod) this.charts.salesByMethod.destroy(); // Destrói o gráfico anterior, se existir

        // Agrupa vendas por método de venda
        const methodData = data.reduce((acc, p) => {
            const method = p.METODO_VENDA || 'N/A';
            if (!acc[method]) acc[method] = 0;
            acc[method] += (p.VALOR_VENDA || 0);
            return acc;
        }, {});

        // Cria o novo gráfico de rosca (doughnut)
        this.charts.salesByMethod = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(methodData),
                datasets: [{
                    data: Object.values(methodData),
                    backgroundColor: ['#0ea5e9', '#f97316', '#10b981', '#6b7280'], // Cores para os segmentos
                    borderWidth: 0 // Remove as bordas dos segmentos
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false, // Permite que o gráfico se ajuste ao contêiner
                plugins: {
                    legend: {
                        position: 'bottom', // Posição da legenda
                        labels: { color: '#d1d5db' } // Cor do texto da legenda
                    }
                }
            }
        });
    },

    /**
     * Renderiza o checklist de componentes para a calculadora Bizural.
     */
    renderBizuralChecklist() {
        if (!this.elements.bizuralChecklistEl) return; // Verifica se o elemento existe

        this.elements.bizuralChecklistEl.innerHTML = ''; // Limpa o checklist
        const components = dataStore.getComponents(); // Pega os componentes do dataStore

        // Ordena os componentes alfabeticamente
        const sortedComponents = [...components].sort((a, b) => (a.component || '').localeCompare(b.component || ''));

        // Popula o checklist com os componentes
        sortedComponents.forEach(item => {
            const el = document.createElement('div');
            el.className = 'flex items-center justify-between p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700';
            el.innerHTML = `
                <label for="comp-${item.id}" class="flex-grow flex items-center cursor-pointer">
                    <input type="checkbox" id="comp-${item.id}" data-cost="${item.cost}" class="form-checkbox h-5 w-5 rounded bg-gray-600 border-gray-500 text-sky-500 focus:ring-sky-500 mr-4">
                    <span class="text-gray-200">${item.component}</span>
                </label>
                <div class="flex items-center space-x-2">
                    <span class="font-mono text-sky-300">${utils.formatCurrency(item.cost)}</span>
                    <button class="btn-edit btn-icon" data-id="${item.id}" data-name="${item.component}" data-cost="${item.cost}"><i data-feather="edit-2" class="h-4 w-4"></i></button>
                    <button class="btn-delete btn-icon" data-id="${item.id}"><i data-feather="trash-2" class="h-4 w-4 text-red-500"></i></button>
                </div>`;
            // Adiciona listeners para os checkboxes e botões de edição/exclusão
            el.querySelector('input[type="checkbox"]').addEventListener('change', () => this.calculateBizuralTotals());
            el.querySelector('.btn-edit').addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                const name = e.currentTarget.dataset.name;
                const cost = parseFloat(e.currentTarget.dataset.cost);
                uiHandlers.showComponentModal({ id, component: name, cost });
            });
            el.querySelector('.btn-delete').addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                utils.showConfirmation("Deseja realmente excluir este componente?", async () => {
                    await firebaseService.deleteData('components', id);
                });
            });
            this.elements.bizuralChecklistEl.appendChild(el);
        });

        // Recalcula os totais após a renderização (para refletir o estado inicial dos checkboxes)
        this.calculateBizuralTotals();
        if (window.feather) feather.replace(); // Atualiza os ícones
    },

    /**
     * Calcula e exibe o custo total dos componentes selecionados e o preço sugerido de venda para o Bizural.
     */
    calculateBizuralTotals() {
        if (!this.elements.bizuralChecklistEl) return; // Verifica se o elemento existe

        // Soma o custo dos checkboxes selecionados
        let cost = Array.from(this.elements.bizuralChecklistEl.querySelectorAll('input:checked')).reduce((sum, el) => sum + parseFloat(el.dataset.cost), 0);
        const labor = parseFloat(this.elements.bizuralLaborInput.value) || 0; // Pega a taxa de montagem

        // Calcula o preço sugerido (custo + mão de obra) com um lucro de 30%
        const suggestedPrice = (cost + labor) * 1.3;

        // Atualiza os elementos DOM com os totais formatados
        this.elements.bizuralCostEl.textContent = utils.formatCurrency(cost);
        this.elements.bizuralPriceEl.textContent = utils.formatCurrency(suggestedPrice);
    },
};

export { renderFunctions };
