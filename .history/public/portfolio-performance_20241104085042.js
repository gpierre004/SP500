document.addEventListener('DOMContentLoaded', async () => {
    try {
        const portfolioData = await fetchPortfolioData();
        displayPortfolioSummary(portfolioData);
        renderPortfolioValueChart(portfolioData);
        renderIndividualPerformanceChart(portfolioData);
    } catch (error) {
        console.error('Error loading portfolio data:', error);
    }
});

async function fetchPortfolioData() {
    const response = await fetch('/api/portfolio');
    if (!response.ok) {
        throw new Error('Failed to fetch portfolio data');
    }
    return await response.json();
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