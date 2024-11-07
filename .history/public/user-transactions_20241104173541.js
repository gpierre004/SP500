document.addEventListener('DOMContentLoaded', () => {
    const userForm = document.getElementById('userForm');
    const transactionForm = document.getElementById('transactionForm');
    const uploadForm = document.getElementById(uploadForm);
    const messageDiv = document.getElementById('message');
    const portfolioIdSelect = document.getElementById('portfolioId');

    userForm.addEventListener('submit', handleUserRegistration);
    transactionForm.addEventListener('submit', handleTransactionSubmission);

    // Fetch and populate portfolio IDs when the page loads
    fetchPortfolioIds();

    function showMessage(message, type = 'info') {
        messageDiv.textContent = message;
        messageDiv.className = type;
        setTimeout(() => {
            messageDiv.textContent = '';
            messageDiv.className = '';
        }, 5000);
    }

    async function handleUserRegistration(event) {
        event.preventDefault();
        const formData = new FormData(userForm);
        const userData = Object.fromEntries(formData.entries());

        try {
            const response = await fetch('/api/users/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData),
            });

            if (!response.ok) {
                throw new Error('Registration failed');
            }

            const result = await response.json();
            showMessage('User registered successfully!', 'success');
            userForm.reset();
            // Refresh the portfolio IDs after a new user is registered
            fetchPortfolioIds();
        } catch (error) {
            showMessage(`Error: ${error.message}`, 'error');
        }
    }

    async function handleTransactionSubmission(event) {
        event.preventDefault();
        const formData = new FormData(transactionForm);
        const transactionData = Object.fromEntries(formData.entries());

        // Convert string values to appropriate types
        transactionData.quantity = parseInt(transactionData.quantity, 10);
        transactionData.purchase_price = parseFloat(transactionData.purchase_price);
        transactionData.portfolio_id = parseInt(transactionData.portfolio_id, 10);
        transactionData.current_price = parseFloat(transactionData.current_price);

        try {
            const response = await fetch('/api/transactions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(transactionData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Transaction submission failed');
            }

            const result = await response.json();
            showMessage('Transaction added successfully!', 'success');
            transactionForm.reset();
        } catch (error) {
            showMessage(`Error: ${error.message}`, 'error');
        }
    }
    // create a 
    async function fetchPortfolioIds() {
        try {
            const response = await fetch('/api/users/portfolios');
            if (!response.ok) {
                throw new Error('Failed to fetch portfolio IDs');
            }
            const portfolios = await response.json();
            
            // Clear existing options
            portfolioIdSelect.innerHTML = '<option value="">Select a Portfolio ID</option>';
            
            // Add new options
            portfolios.forEach(portfolio => {
                const option = document.createElement('option');
                option.value = portfolio.id;
                option.textContent = `${portfolio.id} - ${portfolio.username}`;
                portfolioIdSelect.appendChild(option);
            });
        } catch (error) {
            showMessage(`Error: ${error.message}`, 'error');
        }
    }
});

const uploadForm = document.getElementById('uploadForm');

uploadForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(uploadForm);

    try {
        const response = await fetch('/api/transactions/upload', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Upload failed');
        }

        const result = await response.json();
        showMessage(result.message, 'success');
        uploadForm.reset();
    } catch (error) {
        showMessage(`Error: ${error.message}`, 'error');
    }
});