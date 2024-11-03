const apiBaseUrl = '/api';

async function fetchData(endpoint) {
    const response = await fetch(`${apiBaseUrl}${endpoint}`);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
}

function createChart(ctx, type, data, options) {
    return new Chart(ctx, {
        type: type,
        data: data,
        options: options
    });
}

let charts = {};

function destroyChart(chartName) {
    if (charts[chartName]) {
        charts[chartName].destroy();
        charts[chartName] = null;
    }
}

function getTimeUnit(timeRange) {
    switch (timeRange) {
        case '1d': return 'hour';
        case '1w': return 'day';
        case '1m': return 'day';
        case '1y': return 'month';
        case '3y': return 'month';
        default: return 'day';
    }
}

async function fetchPricePerformance(ticker) {
    try {
        const response = await fetch(`/api/analytics/price-performance/${ticker}`);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Price performance data:', data);
        return data;
    } catch (error) {
        console.error('Error fetching price performance:', error);
        return null;
    }
}

function updatePricePerformanceTable(data) {
    const table = document.getElementById('pricePerformanceTable');
    table.innerHTML = '<tr><th>Period</th><th>Performance</th></tr>';

    if (!data) {
        console.error('No price performance data available');
        const row = table.insertRow();
        const cell = row.insertCell(0);
        cell.colSpan = 2;
        cell.textContent = 'No data available';
        return;
    }

    const periods = [
        { key: '5d', label: '5-day' },
        { key: '10d', label: '10-day' },
        { key: '1m', label: '1-month' },
        { key: '3m', label: '3-month' },
        { key: '6m', label: '6-month' },
        { key: 'ytd', label: 'YTD' },
        { key: '1y', label: '1-year' },
        { key: '2y', label: '2-year' },
        { key: '5y', label: '5-year' },
        { key: '10y', label: '10-year' }
    ];

    periods.forEach(period => {
        if (data[period.key] !== undefined && data[period.key] !== null) {
            const row = table.insertRow();
            const cellPeriod = row.insertCell(0);
            const cellPerformance = row.insertCell(1);

            cellPeriod.textContent = period.label;
            const performance = parseFloat(data[period.key]).toFixed(2);
            cellPerformance.textContent = `${performance}%`;
            cellPerformance.className = performance >= 0 ? 'positive' : 'negative';
        }
    });
}

async function updateDashboard(ticker, timeRange = '1y') {
    try {
        console.log(`Updating dashboard for ${ticker} with time range ${timeRange}`);
        const [priceData, priceTrend, bollingerBands, volumeAnalysis, rsi, pricePerformance] = await Promise.all([
            fetchData(`/analytics/price-data/${ticker}?range=${timeRange}`),
            fetchData(`/analytics/price-trend/${ticker}`),
            fetchData(`/analytics/bollinger-bands/${ticker}`),
            fetchData(`/analytics/volume-analysis/${ticker}`),
            fetchData(`/analytics/rsi/${ticker}`),
            fetchData(`/analytics/price-performance/${ticker}`)
        ]);

        console.log('Fetched data:', { priceData, priceTrend, bollingerBands, volumeAnalysis, rsi, pricePerformance });

        updatePriceChart(priceData, timeRange, ticker);
        updatePriceTrendChart(priceTrend);
        updateBollingerBandsChart(bollingerBands);
        updateVolumeAnalysisChart(volumeAnalysis);
        updateRSIChart(rsi);
        updatePricePerformanceTable(pricePerformance);
    } catch (error) {
        console.error('Error updating dashboard:', error);
        alert(`Error updating dashboard: ${error.message}. Please try again.`);
    }
}


function updatePriceChart(data, timeRange, ticker) {
    if (!data || data.length === 0) {
        console.error('No price data available');
        return;
    }

    const ctx = document.getElementById('priceChart').getContext('2d');
    destroyChart('price');

    const chartData = {
        labels: data.map(d => new Date(d.date)),
        datasets: [{
            label: 'Close Price',
            data: data.map(d => d.close),
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1
        }]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            title: {
                display: true,
                text: `${ticker} Price Chart (${timeRange.toUpperCase()})`
            },
            tooltip: {
                mode: 'index',
                intersect: false
            }
        },
        scales: {
            x: {
                type: 'time',
                time: {
                    unit: getTimeUnit(timeRange)
                },
                title: {
                    display: true,
                    text: 'Date'
                }
            },
            y: {
                title: {
                    display: true,
                    text: 'Price ($)'
                }
            }
        }
    };
    
    charts.price = createChart(ctx, 'line', chartData, options);
}

function updatePriceTrendChart(data) {
    const ctx = document.getElementById('priceTrendChart').getContext('2d');
    destroyChart('priceTrend');

    const chartData = {
        labels: data.map(d => new Date(d.date)),
        datasets: [
            {
                label: 'SMA 20',
                data: data.map(d => d.SMA_20),
                borderColor: 'rgb(255, 99, 132)',
                fill: false
            },
            {
                label: 'SMA 50',
                data: data.map(d => d.SMA_50),
                borderColor: 'rgb(54, 162, 235)',
                fill: false
            },
            {
                label: 'SMA 200',
                data: data.map(d => d.SMA_200),
                borderColor: 'rgb(75, 192, 192)',
                fill: false
            }
        ]
    };
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            title: {
                display: true,
                text: 'Price Trend'
            }
        },
        scales: {
            x: {
                type: 'time',
                time: {
                    unit: 'day'
                }
            }
        }
    };
    
    charts.priceTrend = createChart(ctx, 'line', chartData, options);
}

function updateBollingerBandsChart(data) {
    const ctx = document.getElementById('bollingerBandsChart').getContext('2d');
    destroyChart('bollingerBands');

    const chartData = {
        labels: data.map(d => new Date(d.date)),
        datasets: [
            {
                label: 'Upper Band',
                data: data.map(d => d.Upper_Band),
                borderColor: 'rgb(255, 99, 132)',
                fill: false
            },
            {
                label: 'Middle Band (SMA 20)',
                data: data.map(d => d.middle_band),
                borderColor: 'rgb(54, 162, 235)',
                fill: false
            },
            {
                label: 'Lower Band',
                data: data.map(d => d.Lower_Band),
                borderColor: 'rgb(75, 192, 192)',
                fill: false
            }
        ]
    };
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            title: {
                display: true,
                text: 'Bollinger Bands'
            }
        },
        scales: {
            x: {
                type: 'time',
                time: {
                    unit: 'day'
                }
            }
        }
    };
    
    charts.bollingerBands = createChart(ctx, 'line', chartData, options);
}

function updateVolumeAnalysisChart(data) {
    const ctx = document.getElementById('volumeAnalysisChart').getContext('2d');
    destroyChart('volumeAnalysis');

    const chartData = {
        labels: data.map(d => new Date(d.date)),
        datasets: [
            {
                label: 'Volume',
                data: data.map(d => d.volume),
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
                type: 'bar'
            },
            {
                label: 'SMA 20',
                data: data.map(d => d.SMA_20),
                borderColor: 'rgb(255, 99, 132)',
                fill: false,
                type: 'line'
            }
        ]
    };
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            title: {
                display: true,
                text: 'Volume Analysis'
            }
        },
        scales: {
            x: {
                type: 'time',
                time: {
                    unit: 'day'
                }
            },
            y: {
                beginAtZero: true
            }
        }
    };
    
    charts.volumeAnalysis = createChart(ctx, 'bar', chartData, options);
}

function updateRSIChart(data) {
    const ctx = document.getElementById('rsiChart').getContext('2d');
    destroyChart('rsi');

    const chartData = {
        labels: data.map(d => new Date(d.date)),
        datasets: [
            {
                label: 'RSI',
                data: data.map(d => d.rsi),
                borderColor: 'rgb(75, 192, 192)',
                fill: false
            }
        ]
    };
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            title: {
                display: true,
                text: 'Relative Strength Index (RSI)'
            }
        },
        scales: {
            x: {
                type: 'time',
                time: {
                    unit: 'day'
                }
            },
            y: {
                min: 0,
                max: 100,
                ticks: {
                    stepSize: 10
                }
            }
        }
    };
    
    charts.rsi = createChart(ctx, 'line', chartData, options);
}

async function fetchWatchList() {
    try {
      console.log('Fetching watch list...');
      const response = await fetch('/api/watch-list');
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      const responseText = await response.text();
      console.log('Response text:', responseText);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = JSON.parse(responseText);
      console.log('Watch list data:', data);
      // Process and display the watch list data here
    } catch (error) {
      console.error('Error fetching watch list:', error);
    }
  }
  
  // Call fetchWatchList when the page loads
  document.addEventListener('DOMContentLoaded', fetchWatchList);

document.addEventListener('DOMContentLoaded', () => {
    const searchButton = document.getElementById('searchButton');
    const tickerInput = document.getElementById('tickerInput');
    const timeRangeButtons = document.querySelectorAll('.time-range-btn');

    let currentTicker = 'AAPL';
    let currentTimeRange = '1y';

    function updateDashboardWithCurrentSettings() {
        console.log(`Updating dashboard with ticker: ${currentTicker}, time range: ${currentTimeRange}`);
        updateDashboard(currentTicker, currentTimeRange);
    }

    searchButton.addEventListener('click', () => {
        currentTicker = tickerInput.value.trim().toUpperCase();
        if (currentTicker) {
            updateDashboardWithCurrentSettings();
        } else {
            alert('Please enter a valid stock ticker.');
        }
    });

    tickerInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchButton.click();
        }
    });

    tickerInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.toUpperCase();
    });

    timeRangeButtons.forEach(button => {
        button.addEventListener('click', () => {
            currentTimeRange = button.dataset.range;
            updateDashboardWithCurrentSettings();
        });
    });

    updateDashboardWithCurrentSettings();
});