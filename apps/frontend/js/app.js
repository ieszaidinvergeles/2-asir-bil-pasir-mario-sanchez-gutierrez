document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('leadForm');
    const btnSubmit = document.getElementById('btnSubmit');
    const mensajeBox = document.getElementById('mensaje');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Estado de carga
        btnSubmit.disabled = true;
        btnSubmit.innerText = "Procesando solicitud...";
        mensajeBox.classList.add('hidden');
        mensajeBox.className = 'alert'; // Reseteamos clases

        // Captura de datos
        const payload = {
            nombre: document.getElementById('nombre').value,
            email: document.getElementById('email').value,
            empresa: document.getElementById('empresa').value
        };

        try {
            // Llamada al backend a través del Ingress Gateway
            const response = await fetch('/api/leads', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            
            // Éxito
            mensajeBox.classList.add('success');
            mensajeBox.innerText = 'Propuesta solicitada con éxito. Revisaremos tu infraestructura.';
            mensajeBox.classList.remove('hidden');
            form.reset();

        } catch (error) {
            // Error
            console.error('Error al enviar el lead:', error);
            mensajeBox.classList.add('error');
            mensajeBox.innerText = 'Error de conexión con la infraestructura backend.';
            mensajeBox.classList.remove('hidden');
        } finally {
            // Restaurar botón
            btnSubmit.disabled = false;
            btnSubmit.innerText = "Solicitar Propuesta";
        }
    });
});