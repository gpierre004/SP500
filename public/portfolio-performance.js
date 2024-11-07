document.addEventListener('DOMContentLoaded', async () => {
    const summaryDiv = document.getElementById('summaryDetails');
    const messageDiv = document.createElement('div');
    messageDiv.id = 'message';
    document.querySelector('main').prepend(messageDiv);

    function showMessage(message, type = 'info') {
        messageDiv.textContent = message;
        messageDiv.className = type;
        setTimeout(() => {
            messageDiv.textContent = '';
            messageDiv.className = '';
        }, 5000);
    }

    try {
        // Initial load with default data
        showMessage('Loading portfolio data...', 'info');
        await fetchPortfolioData();
    } catch (error) {
        console.error('Error loading initial data:', error);
        showMessage('Error loading portfolio data. Please try again.', 'error');

        // Display a friendly message in the summary section
        summaryDiv.innerHTML = `
            <div class="error-message">
                <p>Unable to load portfolio data at this time.</p>
                <p>Please ensure you are logged in and try again.</p>
            </div>
        `;
    }
});

async function fetchPortfolioData() {
    try {
        const response = await fetch('/api/portfolio');

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Portfolio data:', data);

        displayPortfolioSummary(data);
        renderPortfolioValueChart(data);
        renderIndividualPerformanceChart(data);
    }
}

function displayPortfolioSummary(data) {
    const summaryDiv = document.getElementById('summaryDetails');
    summaryDiv.innerHTML = `
        <p>Total Value: ${data.totalValue.toFixed(2)}</p>
        <p>Total Gain/Loss: ${data.totalGainLoss.toFixed(2)}%</p>
    `;
}

function renderPortfolioValueChart(data) {
    const ctx = document.getElementById('portfolioValueChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.dates,
            datasets: [{
                label: 'Portfolio Value',
                data: data.values,
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Portfolio Value Over Time'
                }
            },
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'month'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Value ($)'
                    }
                }
            }
        }
    });
}

function renderIndividualPerformanceChart(data) {
    const ctx = document.getElementById('individualPerformanceChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.stocks.map(stock => stock.ticker),
            datasets: [{
                label: 'Performance (%)',
                data: data.stocks.map(stock => stock.performance),
                backgroundColor: data.stocks.map(stock => stock.performance >= 0 ? 'rgb(75, 192, 192)' : 'rgb(255, 99, 132)')
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Individual Stock Performance'
                }
            },
            scales: {
                y: {
                    title: {
                        display: true,
                        text: 'Performance (%)'
                    }
                }
            }
        }
    });
}
