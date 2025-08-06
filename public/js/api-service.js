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

        import { utils } from './utils.js';

        const apiService = {

            async callGeminiAPI(prompt, callingButton) {
                
                const backendUrl = 'https://standarium-erp-api.onrender.com'; 

                const originalButtonText = callingButton.innerHTML;

                try {
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
                    utils.showError("Desculpe, ocorreu um erro ao contatar a IA. Verifique se o seu servidor de backend está rodando.", this.elements.loadingOverlay, this.elements.loadingText);
                    return "Desculpe, ocorreu um erro ao contatar a IA. Tente novamente.";
                } finally {
                    callingButton.disabled = false;
                    callingButton.innerHTML = originalButtonText;
                }
            }
        };

        export { apiService };
        
