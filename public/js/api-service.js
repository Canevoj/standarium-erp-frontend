/*
 * Arquivo: api-service.js
 * Descrição: Módulo para chamadas a APIs externas, como a API Gemini.
 */
import { utils } from './utils.js';

const apiService = {

    /**
     * Chama a API Gemini através de um endpoint de backend seguro para uma única requisição.
     */
    async callGeminiAPI(prompt, callingButton) {
        const backendUrl = 'https://standarium-erp-api.onrender.com/api/generate-text';
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
            // utils.showError já está sendo chamado no ui-handlers
            return null;
        } finally {
            callingButton.disabled = false;
            callingButton.innerHTML = originalButtonText;
        }
    },
    /**
     * Chama a API Gemini com um histórico de conversa.
     */
    async callGeminiAPIWithChat(history, callingButton) {
        // Substitua pela URL do seu backend se tiver um endpoint de chat diferente
        const backendUrl = 'https://standarium-erp-api.onrender.com/api/generate-chat';
        
        try {
            callingButton.disabled = true;
            const response = await fetch(backendUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ history })
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
            console.error("Erro na chamada da API Gemini com chat (via backend):", error);
            return null;
        } finally {
            // O botão do chat é gerenciado separadamente
            if (callingButton) callingButton.disabled = false;
        }
    }
};

export { apiService };
