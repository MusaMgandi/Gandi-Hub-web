export function initializeCharts() {
    if (typeof Chart === 'undefined') {
        console.warn('Chart.js not loaded yet, retrying in 100ms...');
        setTimeout(initializeCharts, 100);
        return;
    }

    try {
        initializePerformanceTrendsChart();
        initializeSkillDistributionChart();
        console.log('✅ Charts initialized successfully');
    } catch (error) {
        console.error('Error initializing charts:', error);
    }
}

function initializePerformanceTrendsChart() {
    const ctx = document.getElementById('performanceTrendsChart');
    if (!ctx) return;
    
    const data = {
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'],
        datasets: [
            {
                label: 'Performance Index',
                data: [65, 72, 68, 75, 82, 87],
                borderColor: 'rgb(66, 135, 245)',
                backgroundColor: 'rgba(66, 135, 245, 0.1)',
                fill: true,
                tension: 0.4
            },
            {
                label: 'Calories Burned',
                data: [1800, 2100, 1950, 2300, 2450, 2600],
                borderColor: 'rgb(255, 99, 132)',
                backgroundColor: 'rgba(255, 99, 132, 0.1)',
                fill: true,
                tension: 0.4
            }
        ]
    };
    
    createChart(ctx, 'line', data);
}

function initializeSkillDistributionChart() {
    const ctx = document.getElementById('skillDistributionChart');
    if (!ctx) return;

    const data = {
        labels: ['Speed', 'Strength', 'Agility', 'Endurance', 'Technique'],
        datasets: [{
            data: [75, 60, 85, 70, 65],
            backgroundColor: [
                'rgba(66, 135, 245, 0.8)',
                'rgba(40, 167, 69, 0.8)',
                'rgba(255, 193, 7, 0.8)',
                'rgba(23, 162, 184, 0.8)',
                'rgba(111, 66, 193, 0.8)'
            ]
        }]
    };

    createChart(ctx, 'doughnut', data);
}

function createChart(ctx, type, data) {
    // Destroy existing chart if it exists
    const existingChart = Chart.getChart(ctx);
    if (existingChart) {
        existingChart.destroy();
    }
    
    return new Chart(ctx, {
        type,
        data,
        options: getChartOptions(type)
    });
}

function getChartOptions(type) {
    const baseOptions = {
        responsive: true,
        maintainAspectRatio: false
    };

    const typeSpecificOptions = {
        line: {
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        drawBorder: false,
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                    align: 'end',
                    labels: {
                        boxWidth: 10,
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            }
        },
        doughnut: {
            plugins: {
                legend: {
                    position: 'bottom'
                }
            },
            cutout: '70%'
        }
    };

    return { ...baseOptions, ...typeSpecificOptions[type] };
}
