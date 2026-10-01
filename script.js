const OLLAMA_URL = "http://127.0.0.1:11434";
const MODEL_NAME = "gemma4:latest";

// Chequea si Ollama está prendido apenas carga la página
async function chequearOllama() {
    try {
        const res = await fetch(`${OLLAMA_URL}/api/tags`);
        if (res.ok) {
            statusEl.textContent = "Conectado";
            statusEl.className = "online";
        } else {
            statusEl.textContent = "⚠️ error al conectar";
            statusEl.className = "offline";
        }
    } catch (err) {
        statusEl.textContent = "❌ ollama apagado";
        statusEl.className = "offline";
    }
}

chequearOllama();

// Al tocar el botón, le manda el prompt a n8n (que a su vez llama a Ollama)
runBtn.addEventListener("click", async () => {
    const prompt = promptEl.value.trim();

    if (!prompt) {
        responseEl.innerHTML = "<h3>📨 Respuesta</h3><p>Escribí algo primero.</p>";
        return;
    }

    responseEl.innerHTML = "<h3>📨 Respuesta</h3><p>⏳ Pensando...</p>";
    runBtn.disabled = true;

    try {
        const res = await fetch(N8N_WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ mensaje: prompt })
        });

        if (!res.ok) throw new Error(`n8n respondió ${res.status}`);

        const data = await res.json();

        // n8n puede devolver la respuesta en distintos formatos según el nodo,
        // probamos los más comunes
        const texto = data.content || data.message?.content || data.text || data.output || JSON.stringify(data);

        responseEl.innerHTML = `<h3>📨 Respuesta</h3><p>${texto}</p>`;

    } catch (err) {
        responseEl.innerHTML = `<h3>📨 Respuesta</h3><p>❌ Error: ${err.message}</p>`;
    } finally {
        runBtn.disabled = false;
    }
});

// Función para enviar el prompt al modelo de Ollama directamente
async function enviarALlama(prompt) {
    try {
        const res = await fetch(`${OLLAMA_URL}/api/generate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ model: MODEL_NAME, prompt })
        });

        if (!res.ok) throw new Error(`Ollama respondió ${res.status}`);

        const data = await res.json();
        return data.text;
    } catch (err) {
        console.error("Error al enviar a Ollama:", err);
        return "❌ Error al conectar con Ollama";
    }
}

// Botón para ejecutar el Agente Real
document.getElementById('run-real-agent').addEventListener('click', async () => {
    const prompt = document.getElementById('agent-prompt').value.trim();

    if (!prompt) {
        document.getElementById('agent-response').innerHTML = "<h3>📨 Respuesta</h3><p>Escribí algo primero.</p>";
        return;
    }

    document.getElementById('agent-response').innerHTML = "<h3>📨 Respuesta</h3><p>⏳ Pensando...</p>";

    try {
        const respuesta = await enviarALlama(prompt);
        document.getElementById('agent-response').innerHTML = `<h3>📨 Respuesta</h3><p>${respuesta}</p>`;
    } catch (err) {
        document.getElementById('agent-response').innerHTML = `<h3>📨 Respuesta</h3><p>❌ Error: ${err.message}</p>`;
    }
});
