document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const messageDiv = document.getElementById('message');

    loginForm.addEventListener('submit', handleLogin);

    function showMessage(message, type = 'info') {
        messageDiv.textContent = message;
        messageDiv.className = type;
        setTimeout(() => {
            messageDiv.textContent = '';
            messageDiv.className = '';
        }, 5000);
    }

    async function handleLogin(event) {
        event.preventDefault();
        const formData = new FormData(loginForm);
        const loginData = Object.fromEntries(formData.entries());

        try {
            const response = await fetch('/api/users/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(loginData),
            });

            if (!response.ok) {
                throw new Error('Login failed');
            }

            const result = await response.json();
            localStorage.setItem('token', result.token);
            showMessage('Login successful!', 'success');
            window.location.href = 'index.html'; // Redirect to home page
        } catch (error) {
            showMessage(`Error: ${error.message}`, 'error');
        }
    }
});