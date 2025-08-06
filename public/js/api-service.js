/*
 * Arquivo: api-service.js
 * Descrição: Módulo para chamadas a APIs externas, como a API Gemini.
 *
 * IMPORTANTE: Sua chave da Gemini API NUNCA deve ser exposta diretamente no frontend.
 * Este módulo demonstra como você chamaria um endpoint do seu próprio backend,
 * que por sua vez, faria a chamada segura para a Gemini API usando sua chave.
 *
 * Você precisará implementar um pequeno servidor Node.js/Python/etc. para isso.
 * Um exemplo básico de backend (Node.js com Express) foi fornecido na explicação anterior.
 */

const apiService = {

    /**
     * Chama a API Gemini através de um endpoint de backend seguro.
     * Agora, ela recebe o elemento do botão que acionou a chamada.
     * @param {string} prompt - O prompt de texto para a API Gemini.
     * @param {HTMLElement} callingButton - O elemento do botão que chamou esta função (para gerenciar seu estado).
     * @returns {Promise<string>} O texto gerado pela IA.
     */
    async callGeminiAPI(prompt, callingButton) {
        // Substitua esta URL pelo endereço do seu endpoint de backend
        // Ex: 'http://localhost:3000/api/generate-text' se seu backend estiver rodando localmente
        const backendUrl = 'https://standarium-erp-api.onrender.com'; // **AJUSTE ESSA URL SE NECESSÁRIO**

        const originalButtonText = callingButton.innerHTML; // Salva o texto original do botão

        try {
            // Exibe o spinner de carregamento da IA no botão que foi clicado
            callingButton.disabled = true;
            callingButton.innerHTML = '<div class="spinner"></div>';

            const response = await fetch(backendUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`A requisição para o backend falhou: ${errorData.error || response.statusText}`);
            }

            const result = await response.json();

            if (result.text) {
                return result.text;
            } else {
                throw new Error("Estrutura de resposta inválida do backend.");
            }
        } catch (error) {
            console.error("Erro na chamada da API Gemini (via backend):", error);
            // Aqui, passamos a referência global dos elementos de overlay de loading para a função de utilidade.
            // Para isso, precisamos que o 'app' passe 'elements' para 'utils' também, ou que utils tenha acesso global.
            // Por enquanto, vamos manter a mensagem no console e o alerta simplificado.
            // utils.showError("Desculpe, ocorreu um erro ao contatar a IA. Verifique se o seu servidor de backend está rodando.", this.elements.loadingOverlay, this.elements.loadingText);
            
            // Para evitar a necessidade de 'this.elements' aqui, e considerando que 'showError' precisa deles,
            // vamos deixar a mensagem de erro direto para o console e o retorno padrão.
            // A mensagem na tela será a que vem do ui-handlers.
            return "Desculpe, ocorreu um erro ao contatar a IA. Tente novamente.";
        } finally {
            // Restaura o botão após a conclusão (sucesso ou erro)
            callingButton.disabled = false;
            callingButton.innerHTML = originalButtonText; // Restaura o texto original
        }
    }
};

export { apiService };
