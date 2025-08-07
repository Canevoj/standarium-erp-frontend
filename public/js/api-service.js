import { utils } from './utils.js';

        const apiService = {

            async callGeminiAPI(prompt, callingButton) {
                // SUBSTITUA POR A URL COMPLETA DO SEU BACKEND NO RENDER!
                // Exemplo: 'https://standarium-erp-api.onrender.com/api/generate-text'
                const backendUrl = 'https://standarium-erp-api.onrender.com/api/generate-text'; // <-- ATUALIZE AQUI!

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
