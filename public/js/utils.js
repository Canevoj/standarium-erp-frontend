/*
 * Arquivo: utils.js
 * Descrição: Módulo de funções utilitárias que podem ser usadas em diversas partes da aplicação.
 * Inclui formatação de moeda, mensagens de erro, confirmações e funções de exportação.
 */

const utils = {
    charts: {}, // Placeholder para instâncias de gráficos, se necessário em utils.

    /**
     * Formata um valor numérico para o formato de moeda brasileira (BRL).
     * @param {number} value - O valor a ser formatado.
     * @returns {string} O valor formatado como moeda.
     */
    formatCurrency(value) {
        return (value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    },

    /**
     * Retorna uma mensagem de erro amigável para códigos de erro de autenticação do Firebase.
     * @param {string} code - O código de erro do Firebase.
     * @returns {string} A mensagem de erro correspondente.
     */
    getAuthErrorMessage(code) {
        switch (code) {
            case 'auth/wrong-password':
                return 'Senha incorreta. Tente novamente.';
            case 'auth/user-not-found':
                return 'Nenhuma conta encontrada com este e-mail.';
            case 'auth/invalid-email':
                return 'Formato de e-mail inválido.';
            case 'auth/email-already-in-use':
                return 'Este e-mail já está em uso.';
            case 'auth/weak-password':
                return 'A senha deve ter pelo menos 6 caracteres.';
            default:
                return 'Ocorreu um erro. Tente novamente.';
        }
    },

    /**
     * Exibe um modal de confirmação para o usuário.
     * @param {string} text - O texto da mensagem de confirmação.
     * @param {Function} callback - Função a ser executada se o usuário confirmar.
     * @param {object} elements - Referência aos elementos DOM para o modal de confirmação.
     */
    showConfirmation(text, callback, elements) {
        elements.confirmText.textContent = text;
        const onOkClick = () => {
            callback();
            hide();
        };
        const hide = () => {
            elements.confirmModal.classList.add('hidden');
            elements.confirmOkBtn.removeEventListener('click', onOkClick);
            elements.confirmCancelBtn.removeEventListener('click', hide, { once: true });
        };
        elements.confirmOkBtn.addEventListener('click', onOkClick, { once: true });
        elements.confirmCancelBtn.addEventListener('click', hide, { once: true });
        elements.confirmModal.classList.remove('hidden');
    },

    /**
     * Exibe uma mensagem de erro na sobreposição de carregamento.
     * @param {string} message - A mensagem de erro a ser exibida.
     * @param {HTMLElement} loadingOverlay - O elemento overlay de carregamento.
     * @param {HTMLElement} loadingTextElement - O elemento de texto dentro do overlay de carregamento.
     */
    showError(message, loadingOverlay, loadingTextElement) {
        loadingOverlay.classList.remove('hidden');
        // Adiciona um estilo para o texto do erro dentro do overlay
        loadingTextElement.innerHTML = `<div class="bg-red-500/20 border border-red-500 p-4 rounded-lg text-red-300 max-w-md text-center">${message}</div>`;
    },

    /**
     * Normaliza uma string de cabeçalho para comparação (minúsculas, sem espaços).
     * @param {string} header - A string do cabeçalho.
     * @returns {string} O cabeçalho normalizado.
     */
    normalizeHeader(header) {
        return header.toLowerCase().replace(/\s+/g, '');
    },

    /**
     * Retorna os dados e cabeçalhos para um tipo de relatório específico.
     * @param {string} reportType - O tipo de relatório ('sales', 'purchases', 'stock').
     * @param {Array<object>} products - A lista completa de produtos.
     * @returns {{data: Array<object>, headers: Array<string>}} Os dados e os cabeçalhos do relatório.
     */
    getReportData(reportType, products) {
        const reportMap = {
            sales: {
                source: products.filter(p => p.STATUS === 'VENDIDO' && p.TIPO === 'Produto para Venda'),
                map: p => ({
                    'Data Venda': p.DATA_VENDA,
                    'Produto': p.PRODUTO,
                    'Custo': p.CUSTO,
                    'Venda': p.VALOR_VENDA,
                    'Lucro': (p.VALOR_VENDA || 0) - (p.CUSTO || 0),
                    'Método': p.METODO_VENDA
                })
            },
            purchases: {
                source: products, // Todas as compras (produtos para venda e consumo)
                map: p => ({
                    'Data Compra': p.DATA_COMPRA,
                    'Item': p.PRODUTO,
                    'Tipo': p.TIPO,
                    'Custo': p.CUSTO,
                    'Método': p.METODO_COMPRA
                })
            },
            stock: {
                source: products.filter(p => p.STATUS === 'EM ESTOQUE' && p.TIPO === 'Produto para Venda'),
                map: p => ({
                    'Produto': p.PRODUTO,
                    'Custo': p.CUSTO,
                    'Preço Sugerido': p.PRECO_SUGERIDO,
                    'Data Compra': p.DATA_COMPRA
                })
            }
        };

        const currentReport = reportMap[reportType];
        if (!currentReport) {
            console.warn(`Tipo de relatório '${reportType}' desconhecido.`);
            return { data: [], headers: [] };
        }

        // Mapeia os dados e extrai os cabeçalhos do primeiro item mapeado
        const data = currentReport.source.map(currentReport.map);
        const headers = data.length > 0 ? Object.keys(data[0]) : [];

        return { data, headers };
    },

    /**
     * Exporta dados para um arquivo CSV.
     * @param {Array<object>} data - Os dados a serem exportados.
     * @param {Array<string>} headers - Os cabeçalhos das colunas.
     * @param {string} fileName - O nome do arquivo CSV.
     */
    exportToCSV(data, headers, fileName) {
        // Mapeia os dados para uma linha CSV, escapando aspas duplas
        const csvData = data.map(row => headers.map(header => {
            const key = Object.keys(row).find(k => utils.normalizeHeader(k) === utils.normalizeHeader(header));
            const value = row[key] !== undefined && row[key] !== null ? String(row[key]) : '';
            return `"${value.replace(/"/g, '""')}"`;
        }).join(','));

        // Combina cabeçalhos e dados
        const csv = [headers.join(','), ...csvData].join('\r\n');

        // Cria um Blob e um link para download
        const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' }); // Adiciona BOM para UTF-8
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        document.body.appendChild(link); // Anexa ao DOM para que o clique funcione
        link.click(); // Simula o clique para iniciar o download
        document.body.removeChild(link); // Remove o link
        URL.revokeObjectURL(link.href); // Libera o URL do objeto
    },

    /**
     * Exporta dados para PDF (usando a funcionalidade de impressão do navegador).
     * @param {Array<object>} data - Os dados a serem exportados.
     * @param {Array<string>} headers - Os cabeçalhos das colunas.
     * @param {string} title - O título do documento PDF.
     * @param {HTMLElement} printArea - O elemento HTML a ser usado para a impressão.
     */
    exportToPDF(data, headers, title, printArea) {
        // Cria uma tabela HTML com os dados
        const table = document.createElement('table');
        table.innerHTML = `
            <thead>
                <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
            </thead>
            <tbody>
                ${data.map(row => `<tr>${headers.map(h => {
                    const key = Object.keys(row).find(k => utils.normalizeHeader(k) === utils.normalizeHeader(h));
                    return `<td>${row[key] === undefined || row[key] === null ? '' : row[key]}</td>`;
                }).join('')}</tr>`).join('')}
            </tbody>`;

        // Prepara a área de impressão
        printArea.innerHTML = `<h1 style="font-family: Inter, sans-serif; color: black; text-align: center;">${title}</h1>`;
        printArea.appendChild(table);

        // Abre a janela de impressão
        window.print();

        // Opcional: Limpar a área de impressão após a impressão (ou se o modal de impressão for fechado)
        // Isso pode ser complexo de detectar, mas é uma boa prática.
        // Por enquanto, o elemento permanece oculto por padrão.
    },

    /**
     * Exporta dados para um arquivo XLSX (Excel).
     * Requer a biblioteca SheetJS (XLSX).
     * @param {Array<object>} data - Os dados a serem exportados.
     * @param {Array<string>} headers - Os cabeçalhos das colunas.
     * @param {string} fileName - O nome do arquivo XLSX.
     */
    exportToXLSX(data, headers, fileName) {
        if (typeof XLSX === 'undefined') {
            console.error("SheetJS (XLSX) library not loaded. Cannot export to XLSX.");
            utils.showError("A biblioteca para exportar XLSX não foi carregada. Tente novamente ou verifique sua conexão.", document.getElementById('loading-overlay'), document.getElementById('loading-text'));
            return;
        }

        // Transforma os dados para o formato esperado pelo SheetJS
        const worksheetData = data.map(row => {
            let newRow = {};
            headers.forEach(header => {
                const key = Object.keys(row).find(k => utils.normalizeHeader(k) === utils.normalizeHeader(header));
                newRow[header] = row[key];
            });
            return newRow;
        });

        const worksheet = XLSX.utils.json_to_sheet(worksheetData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Relatório"); // Adiciona a planilha ao workbook

        XLSX.writeFile(workbook, fileName); // Salva o arquivo XLSX
    },
};

export { utils };
