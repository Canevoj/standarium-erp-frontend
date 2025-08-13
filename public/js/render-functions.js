/*
 * Arquivo: render-functions.js
 * Descrição: Módulo responsável por renderizar o conteúdo dinâmico da aplicação,
 * incluindo o dashboard, tabelas de estoque e serviços, relatórios e a calculadora Bizural.
 */

import { dataStore } from './data-store.js';
import { uiHandlers } from './ui-handlers.js';
import { utils } from './utils.js';

const renderFunctions = {
    elements: null,
    appInstance: null,
    charts: {},

    init(elements, app) {
        this.elements = elements;
        this.appInstance = app;
        this.charts = app.charts;
    },

    renderAll() {
        const dashboardPeriod = this.elements.dashboardPeriodFilter ? this.elements.dashboardPeriodFilter.value : 'all_time';
        this.renderDashboard(dashboardPeriod);
        this.renderInventoryTable();
        this.renderReportsPage();
        this.renderServicesTable();
        this.renderBizuralChecklist();
        if (window.feather) feather.replace();
    },

    renderDashboard(period) {
        const now = new Date();
        const products = dataStore.getProducts();

        const filteredProducts = products.filter(p => {
            if (p.TIPO !== 'Produto para Venda' || !p.STATUS || p.STATUS !== 'VENDIDO') return false;
            const saleDate = p.DATA_VENDA ? new Date(p.DATA_VENDA + 'T00:00:00') : null;
            if (!saleDate) return false;

            if (period === 'all_time') return true;
            if (period === 'last_30_days') {
                const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                return saleDate >= thirtyDaysAgo;
            }
            if (period === 'this_month') {
                return saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear();
            }
            return true;
        });

        const totalProfit = filteredProducts.reduce((acc, p) => acc + ((p.VALOR_VENDA || 0) - (p.CUSTO || 0)), 0);
        const totalRevenue = filteredProducts.reduce((acc, p) => acc + (p.VALOR_VENDA || 0), 0);

        const stockProducts = products.filter(p => p.TIPO === 'Produto para Venda' && p.STATUS !== 'VENDIDO');
        const stockValue = stockProducts.reduce((acc, p) => acc + (p.PRECO_SUGERIDO || 0) * (p.QUANTIDADE || 1), 0);
        const stockCost = stockProducts.reduce((acc, p) => acc + (p.CUSTO_TOTAL || 0), 0);

        this.elements.metricFaturamento.textContent = utils.formatCurrency(totalRevenue);
        this.elements.metricLucro.textContent = utils.formatCurrency(totalProfit);
        this.elements.metricEstoque.textContent = utils.formatCurrency(stockValue);
        this.elements.metricCustoEstoque.innerHTML = `Custo: <span class="text-gray-400">${utils.formatCurrency(stockCost)}</span>`;
        this.elements.metricVendidos.textContent = filteredProducts.length;

        this.renderSalesCostChart(products);
        this.renderSalesByMethodChart(filteredProducts);

        this.elements.insightsContainer.classList.add('hidden');
        this.elements.insightsContainer.innerHTML = '';
    },

    renderInventoryTable() {
        const statusFilter = this.elements.inventoryStatusFilter.value;
        const dateFilter = this.elements.inventoryDateFilter.value;
        const sortBy = this.elements.inventorySortBy.value;
        const sortOrder = this.elements.inventorySortOrder.value;

        let items = [...dataStore.getProducts()];

        if (statusFilter !== 'all') {
            if (statusFilter === 'Consumo') {
                items = items.filter(p => p.TIPO === 'Consumo');
            } else {
                items = items.filter(p => p.STATUS === statusFilter && p.TIPO === 'Produto para Venda');
            }
        }
        if (dateFilter) {
            items = items.filter(p => p.DATA_COMPRA === dateFilter);
        }

        items.sort((a, b) => {
            let valA, valB;
            if (sortBy === 'date') {
                valA = new Date(a.DATA_COMPRA + 'T00:00:00');
                valB = new Date(b.DATA_COMPRA + 'T00:00:00');
            } else {
                valA = (a.CUSTO_TOTAL || 0) / (a.QUANTIDADE || 1);
                valB = (b.CUSTO_TOTAL || 0) / (b.QUANTIDADE || 1);
            }
            return sortOrder === 'asc' ? valA - valB : valB - valA;
        });

        this.elements.inventoryTableBody.innerHTML = '';

        if (items.length === 0) {
            this.elements.inventoryTableBody.innerHTML = `<tr><td colspan="8" class="text-center p-8 text-gray-500">Nenhum item encontrado.</td></tr>`;
            return;
        }

        items.forEach(p => {
            const isExpense = p.TIPO === 'Consumo';
            const status = p.STATUS || 'EM BRANCO';
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
            
            const custoUnitario = (p.CUSTO_TOTAL || 0) / (p.QUANTIDADE || 1);
            const precoSugeridoUnitario = p.PRECO_SUGERIDO || 0;

            row.innerHTML = `
                <td class="p-4 font-medium">${p.PRODUTO}</td>
                <td class="p-4"><span class="px-2 py-1 text-xs font-semibold rounded-full ${statusClass}">${isExpense ? 'Consumo' : status}</span></td>
                <td class="p-4 text-center">${p.QUANTIDADE || '---'}</td>
                <td class="p-4 text-right">${utils.formatCurrency(custoUnitario)}</td>
                <td class="p-4 text-right">${isExpense ? '---' : utils.formatCurrency(precoSugeridoUnitario)}</td>
                <td class="p-4 text-center">${p.DATA_COMPRA ? new Date(p.DATA_COMPRA + 'T00:00:00').toLocaleDateString('pt-BR') : '---'}</td>
                <td class="p-4 text-right font-bold text-green-400">${p.STATUS === 'VENDIDO' && !isExpense ? utils.formatCurrency(p.VALOR_VENDA) : '---'}</td>
                <td class="p-4 text-center space-x-2">
                    <button class="btn-edit btn btn-sm bg-orange-500 hover:bg-orange-600 text-white">Gerenciar</button>
                    <button class="btn-delete btn btn-sm bg-red-600 hover:bg-red-700 text-white"><i data-feather="trash-2" class="h-4 w-4"></i></button>
                </td>`;
            row.querySelector('.btn-edit').addEventListener('click', () => uiHandlers.showProductModal(p));
            row.querySelector('.btn-delete').addEventListener('click', () => {
                utils.showConfirmation("Deseja realmente excluir este item?", async () => {
                    await firebaseService.deleteData('products', p.id);
                }, this.elements);
            });
            this.elements.inventoryTableBody.appendChild(row);
        });
    },

    renderServicesTable() {
        if (!this.elements.servicesTableBody) return;

        this.elements.servicesTableBody.innerHTML = '';
        const services = dataStore.getServices();

        if (services.length === 0) {
            this.elements.servicesTableBody.innerHTML = `<tr><td colspan="4" class="text-center p-8 text-gray-500">Nenhum serviço cadastrado.</td></tr>`;
            return;
        }

        [...services].sort((a, b) => (a.NOME || '').localeCompare(b.NOME || '')).forEach(s => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-700/50 text-sm';
            row.innerHTML = `
                <td class="p-4 font-medium">${s.NOME}</td>
                <td class="p-4">${s.DESCRICAO || '---'}</td>
                <td class="p-4 text-right font-bold">${utils.formatCurrency(s.PRECO)}</td>
                <td class="p-4 text-center space-x-2">
                    <button class="btn-edit btn btn-sm bg-orange-500 hover:bg-orange-600 text-white">Editar</button>
                    <button class="btn-delete btn btn-sm bg-red-600 hover:bg-red-700 text-white"><i data-feather="trash-2" class="h-4 w-4"></i></button>
                </td>`;
            row.querySelector('.btn-edit').addEventListener('click', () => uiHandlers.showServiceModal(s));
            row.querySelector('.btn-delete').addEventListener('click', (e) => {
                utils.showConfirmation("Deseja realmente excluir este item?", async () => {
                    await firebaseService.deleteData('services', s.id);
                }, this.elements);
            });
            this.elements.servicesTableBody.appendChild(row);
        });
    },

    renderReportsPage() {
        const reportType = this.elements.reportTypeFilter.value;
        const { data, headers } = utils.getReportData(reportType, dataStore.getProducts());

        this.elements.reportTableHead.innerHTML = `<tr>${headers.map(h => `<th class="p-4 text-left text-xs uppercase text-gray-400">${h}</th>`).join('')}</tr>`;
        this.elements.reportTableBody.innerHTML = '';

        if (data.length === 0) {
            this.elements.reportTableBody.innerHTML = `<tr><td colspan="${headers.length}" class="text-center p-8 text-gray-500">Nenhum registro para este relatório.</td></tr>`;
            return;
        }

        data.forEach(rowData => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-700/50 text-sm';
            let cellHTML = '';
            headers.forEach(headerKey => {
                const key = Object.keys(rowData).find(k => utils.normalizeHeader(k) === utils.normalizeHeader(headerKey));
                let cellData = rowData[key];
                if (typeof cellData === 'number' && utils.normalizeHeader(headerKey) !== 'produto') {
                    cellData = utils.formatCurrency(cellData);
                }
                cellHTML += `<td class="p-4 whitespace-nowrap">${cellData !== undefined && cellData !== null ? cellData : '---'}</td>`;
            });
            row.innerHTML = cellHTML;
            this.elements.reportTableBody.appendChild(row);
        });
    },

    renderSalesCostChart(products) {
        if (!this.elements.salesCostChartCanvas) return;

        const ctx = this.elements.salesCostChartCanvas.getContext('2d');
        if (this.charts.salesCost) this.charts.salesCost.destroy();

        const monthlyData = products.reduce((acc, p) => {
            if (p.DATA_COMPRA) {
                const month = p.DATA_COMPRA.substring(0, 7);
                if (!acc[month]) acc[month] = { costs: 0, sales: 0 };
                acc[month].costs += p.CUSTO_TOTAL || 0;
            }
            if (p.DATA_VENDA && p.TIPO === 'Venda') {
                const month = p.DATA_VENDA.substring(0, 7);
                if (!acc[month]) acc[month] = { costs: 0, sales: 0 };
                acc[month].sales += p.VALOR_VENDA || 0;
            }
            return acc;
        }, {});

        const sortedMonths = Object.keys(monthlyData).sort();

        this.charts.salesCost = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: sortedMonths,
                datasets: [
                    {
                        label: 'Vendas',
                        data: sortedMonths.map(m => monthlyData[m].sales),
                        backgroundColor: '#0ea5e9',
                    },
                    {
                        label: 'Custos',
                        data: sortedMonths.map(m => monthlyData[m].costs),
                        backgroundColor: '#f97316',
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { color: '#9ca3af' }
                    },
                    x: {
                        ticks: { color: '#9ca3af' }
                    }
                },
                plugins: {
                    legend: {
                        labels: { color: '#d1d5db' }
                    }
                }
            }
        });
    },

    renderSalesByMethodChart(data) {
        if (!this.elements.salesByMethodChartCanvas) return;

        const ctx = this.elements.salesByMethodChartCanvas.getContext('2d');
        if (this.charts.salesByMethod) this.charts.salesByMethod.destroy();

        const methodData = data.reduce((acc, p) => {
            const method = p.METODO_VENDA || 'N/A';
            if (!acc[method]) acc[method] = 0;
            acc[method] += (p.VALOR_VENDA || 0);
            return acc;
        }, {});

        this.charts.salesByMethod = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(methodData),
                datasets: [{
                    data: Object.values(methodData),
                    backgroundColor: ['#0ea5e9', '#f97316', '#10b981', '#6b7280'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: '#d1d5db' }
                    }
                }
            }
        });
    },

    renderBizuralChecklist() {
        if (!this.elements.bizuralChecklistEl) return;

        this.elements.bizuralChecklistEl.innerHTML = '';
        const components = dataStore.getComponents();

        const sortedComponents = [...components].sort((a, b) => (a.component || '').localeCompare(b.component || ''));

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
                }, this.elements);
            });
            this.elements.bizuralChecklistEl.appendChild(el);
        });

        this.calculateBizuralTotals();
        if (window.feather) feather.replace();
    },

    /**
     * Calcula e exibe o custo total dos componentes selecionados e o preço sugerido de venda para o Bizural.
     */
    calculateBizuralTotals() {
        if (!this.elements.bizuralChecklistEl) return;

        let cost = Array.from(this.elements.bizuralChecklistEl.querySelectorAll('input:checked')).reduce((sum, el) => sum + parseFloat(el.dataset.cost), 0);
        const labor = parseFloat(this.elements.bizuralLaborInput.value) || 0;

        const suggestedPrice = (cost + labor) * 1.3;

        this.elements.bizuralCostEl.textContent = utils.formatCurrency(cost);
        this.elements.bizuralPriceEl.textContent = utils.formatCurrency(suggestedPrice);
    },
};

export { renderFunctions };
