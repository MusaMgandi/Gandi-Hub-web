// Define storage keys
const STORAGE_KEYS = {
    ANALYTICS_DATA: 'analytics_data',
    CHART_CONFIG: 'chart_config',
    USER_PREFERENCES: 'user_preferences'
};

// Add initialization state tracking
class ChartManager {
    constructor() {
        this.charts = {};
        this.initialized = false;
        this.initializationPromise = this.initialize();
        this.analyticsData = {
            performanceTrends: [],
            studyPatterns: {},
            predictions: {},
            subjectPerformance: {},
            trainingProgress: {} // Add training progress tracking
        };
    }

    async initialize() {
        // Wait for Chart to be available
        while (typeof Chart === 'undefined') {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        this.charts = {};
        this.chartTypes = [
            'gpaChart', 
            'gradeDistributionChart', 
            'subjectChart', 
            'studyTimeChart', 
            'completionChart',
            'performanceTrendChart',
            'studyPatternChart',
            'predictionChart',
            'trainingProgressChart'  // Add training progress chart type
        ];
        await this.init();
        this.initialized = true;
        return this;
    }

    isReady() {
        return this.initialized && Object.keys(this.charts).length > 0;
    }

    async init() {
        try {
            this.initialized = true;
            await this.loadAnalyticsData();
            this.initGpaChart();
            this.initGradeDistributionChart();
            this.initSubjectChart();
            this.initStudyTimeChart();
            this.initCompletionChart();
            this.initPerformanceTrendChart();
            this.initStudyPatternChart();
            this.initPredictionChart();
            this.initTrainingProgressChart();
        } catch (error) {
            console.error('Failed to initialize charts:', error);
            this.initialized = false;
        }
    }

    async loadAnalyticsData() {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.ANALYTICS_DATA);
            if (!data) {
                return this.initializeDefaultData();
            }
            return JSON.parse(data);
        } catch (error) {
            console.error('Error loading analytics data:', error);
            return this.initializeDefaultData();
        }
    }

    initializeDefaultData() {
        const defaultData = {
            performance: [],
            trends: [],
            statistics: {}
        };
        localStorage.setItem(STORAGE_KEYS.ANALYTICS_DATA, JSON.stringify(defaultData));
        return defaultData;
    }

    async calculatePerformanceTrends() {
        const grades = JSON.parse(localStorage.getItem('grades')) || [];
        const subjects = [...new Set(grades.map(g => g.subject))];
        
        this.analyticsData.performanceTrends = subjects.map(subject => {
            const subjectGrades = grades.filter(g => g.subject === subject)
                .sort((a, b) => new Date(a.date) - new Date(b.date));
            
            const trend = this.calculateTrendline(subjectGrades.map(g => g.grade));
            return {
                subject,
                trend,
                improvement: trend.slope > 0,
                averageGrade: subjectGrades.reduce((sum, g) => sum + g.grade, 0) / subjectGrades.length
            };
        });
    }

    calculateTrendline(grades) {
        const n = grades.length;
        if (n < 2) return { slope: 0, intercept: grades[0] || 0 };

        const xValues = Array.from({length: n}, (_, i) => i);
        const sumX = xValues.reduce((a, b) => a + b, 0);
        const sumY = grades.reduce((a, b) => a + b, 0);
        const sumXY = xValues.reduce((sum, x, i) => sum + x * grades[i], 0);
        const sumXX = xValues.reduce((sum, x) => sum + x * x, 0);

        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;

        return { slope, intercept };
    }

    async analyzeStudyPatterns() {
        const studyData = JSON.parse(localStorage.getItem(STORAGE_KEYS.STUDY_HOURS)) || {};
        const subjects = Object.keys(studyData);

        this.analyticsData.studyPatterns = subjects.reduce((patterns, subject) => {
            const hours = studyData[subject];
            patterns[subject] = {
                totalHours: hours,
                effectiveness: this.calculateStudyEffectiveness(subject, hours),
                recommendedHours: this.calculateRecommendedStudyHours(subject, hours)
            };
            return patterns;
        }, {});
    }

    calculateStudyEffectiveness(subject, hours) {
        const grades = JSON.parse(localStorage.getItem('grades')) || [];
        const subjectGrades = grades.filter(g => g.subject === subject);
        
        if (subjectGrades.length === 0 || !hours) return 0;

        const averageGrade = subjectGrades.reduce((sum, g) => sum + g.grade, 0) / subjectGrades.length;
        return (averageGrade / 4.0) * (hours / Math.max(...Object.values(JSON.parse(localStorage.getItem(STORAGE_KEYS.STUDY_HOURS)) || {})));
    }

    calculateRecommendedStudyHours(subject, currentHours) {
        const effectiveness = this.calculateStudyEffectiveness(subject, currentHours);
        const grades = JSON.parse(localStorage.getItem('grades')) || [];
        const subjectGrades = grades.filter(g => g.subject === subject);
        
        if (subjectGrades.length === 0) return currentHours || 2;

        const averageGrade = subjectGrades.reduce((sum, g) => sum + g.grade, 0) / subjectGrades.length;
        const targetGrade = 4.0;
        
        if (averageGrade >= targetGrade) return currentHours;
        
        return Math.ceil(currentHours * (targetGrade / averageGrade) * (1 / Math.max(effectiveness, 0.1)));
    }

    async generatePredictions() {
        const subjects = Object.keys(this.analyticsData.studyPatterns);
        
        this.analyticsData.predictions = subjects.reduce((predictions, subject) => {
            const pattern = this.analyticsData.studyPatterns[subject];
            const trend = this.analyticsData.performanceTrends.find(t => t.subject === subject);
            
            predictions[subject] = {
                expectedGrade: this.predictGrade(subject, pattern, trend),
                confidenceLevel: this.calculateConfidenceLevel(subject, pattern, trend),
                recommendedActions: this.generateRecommendedActions(subject, pattern, trend)
            };
            
            return predictions;
        }, {});
    }

    predictGrade(subject, pattern, trend) {
        if (!trend || !pattern) return null;

        const currentGrade = trend.averageGrade;
        const studyEffectiveness = pattern.effectiveness;
        const trendSlope = trend.slope;

        return Math.min(4.0, currentGrade * (1 + trendSlope) * studyEffectiveness);
    }

    calculateConfidenceLevel(subject, pattern, trend) {
        if (!trend || !pattern) return 0;

        const factors = [
            pattern.totalHours > 0 ? 0.3 : 0,
            Math.abs(trend.slope) < 0.5 ? 0.3 : 0.15,
            pattern.effectiveness > 0.5 ? 0.4 : 0.2
        ];

        return factors.reduce((sum, factor) => sum + factor, 0);
    }

    generateRecommendedActions(subject, pattern, trend) {
        const actions = [];

        if (pattern.totalHours < pattern.recommendedHours) {
            actions.push(`Increase study time by ${Math.ceil(pattern.recommendedHours - pattern.totalHours)} hours`);
        }

        if (trend && trend.slope < 0) {
            actions.push('Review recent material and seek additional help');
        }

        if (pattern.effectiveness < 0.6) {
            actions.push('Consider adjusting study techniques for better effectiveness');
        }

        return actions;
    }

    initPerformanceTrendChart() {
        const ctx = document.getElementById('performanceTrendChart');
        if (!ctx) return;

        if (this.charts.performanceTrendChart) {
            this.charts.performanceTrendChart.destroy();
        }

        const trends = this.analyticsData.performanceTrends;
        const labels = trends.map(t => t.subject);
        const currentGrades = trends.map(t => t.averageGrade);
        const predictedGrades = trends.map(t => 
            this.analyticsData.predictions[t.subject]?.expectedGrade || t.averageGrade
        );

        // Calculate if each point represents an improvement
        const gradientColors = currentGrades.map((grade, index) => {
            if (index === 0) return '#3498db'; // Default color for first point
            return grade > currentGrades[index - 1] ? '#2ecc71' : '#e74c3c'; // Green for improvement, Red for decline
        });

        this.charts.performanceTrendChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'Current Performance',
                    data: currentGrades,
                    borderColor: '#3498db',
                    pointBackgroundColor: gradientColors,
                    pointRadius: 6,
                    fill: false
                }, {
                    label: 'Predicted Performance',
                    data: predictedGrades,
                    borderColor: '#2ecc71',
                    borderDash: [5, 5],
                    pointRadius: 4,
                    fill: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 4.0,
                        title: {
                            display: true,
                            text: 'Grade Point Average'
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            afterBody: (context) => {
                                const index = context[0].dataIndex;
                                const currGrade = currentGrades[index];
                                const prevGrade = index > 0 ? currentGrades[index - 1] : null;
                                
                                if (prevGrade !== null) {
                                    const diff = (currGrade - prevGrade).toFixed(2);
                                    const trend = diff > 0 ? 'Improvement' : diff < 0 ? 'Decline' : 'No change';
                                    return `\nTrend: ${trend} (${diff > 0 ? '+' : ''}${diff})`;
                                }
                                return '';
                            }
                        }
                    }
                }
            }
        });
    }

    initStudyPatternChart() {
        const ctx = document.getElementById('studyPatternChart');
        if (!ctx) return;

        if (this.charts.studyPatternChart) {
            this.charts.studyPatternChart.destroy();
        }

        const patterns = this.analyticsData.studyPatterns;
        const subjects = Object.keys(patterns);

        this.charts.studyPatternChart = new Chart(ctx, {
            type: 'bubble',
            data: {
                datasets: [{
                    label: 'Study Patterns',
                    data: subjects.map(subject => ({
                        x: patterns[subject].totalHours,
                        y: patterns[subject].effectiveness * 100,
                        r: patterns[subject].recommendedHours / 2,
                        subject
                    })),
                    backgroundColor: subjects.map((_, i) => 
                        `hsla(${(i * 360) / subjects.length}, 70%, 60%, 0.6)`
                    )
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Study Hours'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Effectiveness (%)'
                        },
                        max: 100
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const data = context.raw;
                                return [
                                    `Subject: ${data.subject}`,
                                    `Hours: ${data.x.toFixed(1)}`,
                                    `Effectiveness: ${data.y.toFixed(1)}%`,
                                    `Recommended: ${data.r * 2} hours`
                                ];
                            }
                        }
                    }
                }
            }
        });
    }

    initPredictionChart() {
        const ctx = document.getElementById('predictionChart');
        if (!ctx) return;

        if (this.charts.predictionChart) {
            this.charts.predictionChart.destroy();
        }

        const predictions = this.analyticsData.predictions;
        const subjects = Object.keys(predictions);
        const confidenceLevels = subjects.map(s => predictions[s].confidenceLevel * 100);
        const expectedGrades = subjects.map(s => predictions[s].expectedGrade);

        this.charts.predictionChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: subjects,
                datasets: [{
                    label: 'Expected Grade',
                    data: expectedGrades,
                    backgroundColor: 'rgba(52, 152, 219, 0.6)',
                    yAxisID: 'y'
                }, {
                    label: 'Confidence Level',
                    data: confidenceLevels,
                    backgroundColor: 'rgba(46, 204, 113, 0.6)',
                    yAxisID: 'y1'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 4.0,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Expected Grade'
                        }
                    },
                    y1: {
                        beginAtZero: true,
                        max: 100,
                        position: 'right',
                        grid: {
                            drawOnChartArea: false
                        },
                        title: {
                            display: true,
                            text: 'Confidence Level (%)'
                        }
                    }
                }
            }
        });
    }

    initGpaChart() {
        const ctx = document.getElementById('gpaChart');
        if (!ctx) return;

        if (this.charts.gpaChart) {
            this.charts.gpaChart.destroy();
        }

        // Initialize as a doughnut chart showing completed semesters instead of GPA trend
        this.charts.gpaChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Completed', 'Remaining'],
                datasets: [{
                    data: [0, 1], // Default values, will be updated
                    backgroundColor: [
                        'rgba(46, 204, 113, 0.8)', // Green for completed
                        'rgba(189, 195, 199, 0.4)'  // Light gray for remaining
                    ],
                    borderColor: [
                        'rgb(46, 204, 113)',
                        'rgb(189, 195, 199)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                if (label === 'Completed') {
                                    return `Completed Semesters: ${value}`;
                                } else {
                                    return `Remaining Semesters: ${value}`;
                                }
                            }
                        }
                    }
                }
            }
        });
    }

    initGradeDistributionChart() {
        const ctx = document.getElementById('gradeDistributionChart');
        if (!ctx) return;

        if (this.charts.gradeDistributionChart) {
            this.charts.gradeDistributionChart.destroy();
        }

        this.charts.gradeDistributionChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Current', 'Previous'],
                datasets: [{
                    label: 'GPA',
                    data: [0, 0],
                    backgroundColor: [
                        'rgba(52, 152, 219, 0.6)', // Blue for current (consistent blue color)
                        'rgba(149, 165, 166, 0.6)' // Gray for previous
                    ],
                    borderColor: [
                        'rgb(52, 152, 219)', // Blue for current
                        'rgb(149, 165, 166)' // Gray for previous
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const value = context.raw;
                                return `GPA: ${value.toFixed(2)}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 4.0,
                        ticks: {
                            stepSize: 0.5
                        }
                    }
                }
            }
        });
    }

    initStudyTimeChart() {
        const ctx = document.getElementById('studyTimeChart');
        if (!ctx) return;

        if (this.charts.studyTimeChart) {
            this.charts.studyTimeChart.destroy();
        }

        this.charts.studyTimeChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Mathematics', 'Science', 'Literature', 'History', 'Other'],
                datasets: [{
                    data: [0, 0, 0, 0, 0],
                    backgroundColor: [
                        '#2ecc71',
                        '#3498db',
                        '#9b59b6',
                        '#e74c3c',
                        '#95a5a6'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }

    initCompletionChart() {
        const ctx = document.getElementById('completionChart');
        if (!ctx) return;

        if (this.charts.completionChart) {
            this.charts.completionChart.destroy();
        }

        this.charts.completionChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Completion Rate',
                    data: [],
                    borderColor: '#2ecc71',
                    fill: false,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }

    initSubjectChart() {
        const ctx = document.getElementById('subjectChart');
        if (!ctx) return;

        if (this.charts.subjectChart) {
            this.charts.subjectChart.destroy();
        }

        this.charts.subjectChart = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['Mathematics', 'Science', 'Literature', 'History', 'Other'],
                datasets: [{
                    label: 'Performance',
                    data: [0, 0, 0, 0, 0],
                    backgroundColor: 'rgba(0, 119, 190, 0.2)',
                    borderColor: '#0077BE',
                    pointBackgroundColor: '#0077BE'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scale: {
                    ticks: {
                        beginAtZero: true,
                        max: 4
                    }
                }
            }
        });
    }

    initTrainingProgressChart() {
        const ctx = document.getElementById('sessionsChart');
        if (!ctx) return;

        if (this.charts.trainingProgressChart) {
            this.charts.trainingProgressChart.destroy();
        }

        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        
        this.charts.trainingProgressChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: days,
                datasets: [{
                    label: 'Training Sessions',
                    data: Array(7).fill(0),
                    borderColor: '#0077be',
                    backgroundColor: 'rgba(0, 119, 190, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { stepSize: 1 }
                    }
                }
            }
        });
    }

    updateTrainingProgress(sessions) {
        if (!this.charts.trainingProgressChart) {
            this.initTrainingProgressChart();
            return;
        }

        const today = new Date();
        const sessionsPerDay = Array(7).fill(0);

        sessions.forEach(session => {
            const sessionDate = new Date(session.date);
            const daysDiff = Math.floor((today - sessionDate) / (1000 * 60 * 60 * 24));
            if (daysDiff < 7) {
                sessionsPerDay[6 - daysDiff]++;
            }
        });

        this.charts.trainingProgressChart.data.datasets[0].data = sessionsPerDay;
        this.charts.trainingProgressChart.update();
    }

    initTrainingCharts() {
        try {
            // Initialize only if the chart elements exist in the DOM
            const charts = [
                { method: 'initPerformanceTrendChart', id: 'performanceTrendsChart' },
                { method: 'initSkillDistributionChart', id: 'skillDistributionChart' },
                { method: 'initProgressChart', id: 'progressChart' },
                { method: 'initPerformanceComparison', id: 'performanceComparisonChart' }
            ];

            charts.forEach(chart => {
                if (document.getElementById(chart.id) && typeof this[chart.method] === 'function') {
                    this[chart.method]();
                }
            });
        } catch (error) {
            console.error('Error initializing training charts:', error);
        }
    }

    initPerformanceTrendChart() {
        const ctx = document.getElementById('performanceTrendsChart');
        if (!ctx) return;

        if (this.charts.performanceTrendChart) {
            this.charts.performanceTrendChart.destroy();
        }

        this.charts.performanceTrendChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'],
                datasets: [{
                    label: 'Speed',
                    data: [65, 72, 68, 75, 82, 87],
                    borderColor: '#0077BE',
                    fill: false,
                    tension: 0.4
                }, {
                    label: 'Strength',
                    data: [70, 75, 71, 78, 82, 85],
                    borderColor: '#2ecc71',
                    fill: false,
                    tension: 0.4
                }, {
                    label: 'Endurance',
                    data: [60, 68, 72, 75, 78, 82],
                    borderColor: '#f39c12',
                    fill: false,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                },
                plugins: {
                    legend: {
                        position: 'top',
                        align: 'end'
                    }
                }
            }
        });
    }

    initSkillDistributionChart() {
        const ctx = document.getElementById('skillDistributionChart');
        if (!ctx) return;

        if (this.charts.skillDistributionChart) {
            this.charts.skillDistributionChart.destroy();
        }

        this.charts.skillDistributionChart = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['Speed', 'Strength', 'Agility', 'Endurance', 'Technique'],
                datasets: [{
                    label: 'Current Level',
                    data: [85, 78, 82, 75, 70],
                    backgroundColor: 'rgba(0, 119, 190, 0.2)',
                    borderColor: '#0077BE',
                    pointBackgroundColor: '#0077BE'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            stepSize: 20
                        }
                    }
                }
            }
        });
    }

    initProgressChart() {
        const progressCtx = document.getElementById('progressChart');
        if (!progressCtx) return;

        return new Chart(progressCtx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'Progress',
                    data: [65, 70, 75, 80, 85, 90],
                    borderColor: '#0077be',
                    tension: 0.4,
                    fill: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    initPerformanceComparison() {
        const ctx = document.getElementById('performanceComparisonChart');
        if (!ctx) return;

        if (this.charts.performanceComparisonChart) {
            this.charts.performanceComparisonChart.destroy();
        }

        this.charts.performanceComparisonChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Speed', 'Strength', 'Agility', 'Endurance', 'Technique'],
                datasets: [{
                    label: 'Current',
                    data: [85, 78, 82, 75, 70],
                    backgroundColor: 'rgba(0, 119, 190, 0.6)',
                    borderColor: '#0077BE',
                    borderWidth: 1
                }, {
                    label: 'Previous',
                    data: [75, 70, 75, 68, 65],
                    backgroundColor: 'rgba(46, 204, 113, 0.6)',
                    borderColor: '#2ecc71',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });
    }

    updateCharts(grades) {
        if (!this.initialized || !grades || !Array.isArray(grades)) {
            console.warn('Invalid grades data or charts not initialized');
            return;
        }

        try {
            // First sort by year and semester (ascending)
            const sortedByYear = [...grades].sort((a, b) => {
                // First compare by year
                if (a.year !== b.year) {
                    return a.year - b.year;
                }
                // If same year, compare by semester
                return a.semester - b.semester;
            });

            // Update GPA chart to show completed semesters instead of GPA trend
            if (this.charts.gpaChart) {
                // Count unique semesters completed
                const uniqueSemesters = new Set();
                sortedByYear.forEach(grade => {
                    uniqueSemesters.add(`${grade.year}-${grade.semester}`);
                });
                
                const completedSemesters = uniqueSemesters.size;
                // Assuming a standard 8 semesters in a 4-year program
                const totalSemesters = 8; 
                const remainingSemesters = Math.max(0, totalSemesters - completedSemesters);
                
                // Update the chart data
                this.charts.gpaChart.data.datasets[0].data = [completedSemesters, remainingSemesters];
                
                // Add center text showing completion percentage
                const completionPercentage = Math.round((completedSemesters / totalSemesters) * 100);
                
                // Add afterDraw plugin to show completion percentage in the center
                this.charts.gpaChart.options.plugins.afterDraw = (chart) => {
                    const ctx = chart.ctx;
                    const width = chart.width;
                    const height = chart.height;
                    
                    ctx.restore();
                    const fontSize = (height / 114).toFixed(2);
                    ctx.font = fontSize + 'em sans-serif';
                    ctx.textBaseline = 'middle';
                    
                    const text = `${completionPercentage}%`;
                    const textX = Math.round((width - ctx.measureText(text).width) / 2);
                    const textY = height / 2;
                    
                    ctx.fillStyle = '#333';
                    ctx.fillText(text, textX, textY);
                    
                    // Add smaller text below showing the fraction
                    ctx.font = (fontSize * 0.5) + 'em sans-serif';
                    const subText = `${completedSemesters}/${totalSemesters} Semesters`;
                    const subTextX = Math.round((width - ctx.measureText(subText).width) / 2);
                    const subTextY = height / 2 + 20;
                    
                    ctx.fillText(subText, subTextX, subTextY);
                    ctx.save();
                };
                
                this.charts.gpaChart.update('none');
            }

            // Update grade distribution chart comparing sequential semesters
            if (this.charts.gradeDistributionChart && sortedByYear.length > 0) {
                // Get the current (latest) semester data
                const currentSemester = sortedByYear[sortedByYear.length - 1];
                const currentGPA = currentSemester.gpa;
                
                // Get the previous semester data (if it exists)
                // This will compare across years if needed (e.g., Year 1 Sem 2 to Year 2 Sem 1)
                const previousSemester = sortedByYear.length > 1 ? 
                    sortedByYear[sortedByYear.length - 2] : null;
                const previousGPA = previousSemester ? previousSemester.gpa : currentGPA;

                // Update chart data
                this.charts.gradeDistributionChart.data.datasets[0].data = [currentGPA, previousGPA];
                
                // Update chart labels to show semester information
                const currentLabel = `Sem ${currentSemester.semester} (${currentSemester.year})`;
                const previousLabel = previousSemester ? 
                    `Sem ${previousSemester.semester} (${previousSemester.year})` : 'No Previous';
                this.charts.gradeDistributionChart.data.labels = [currentLabel, previousLabel];
                
                // Calculate improvement - ensure we're comparing correctly
                const diff = (currentGPA - previousGPA).toFixed(2);
                // Make sure we're correctly identifying improvement (when current > previous)
                const isImprovement = currentGPA > previousGPA;
                
                // Set colors based on improvement
                if (isImprovement) {
                    // Green for improvement
                    this.charts.gradeDistributionChart.data.datasets[0].backgroundColor[0] = 'rgba(46, 204, 113, 0.6)';
                    this.charts.gradeDistributionChart.data.datasets[0].borderColor[0] = 'rgb(46, 204, 113)';
                } else {
                    // Blue for no change or decline
                    this.charts.gradeDistributionChart.data.datasets[0].backgroundColor[0] = 'rgba(52, 152, 219, 0.6)';
                    this.charts.gradeDistributionChart.data.datasets[0].borderColor[0] = 'rgb(52, 152, 219)';
                }
                
                // Set tooltip to show the difference between current and previous with arrow indicators
                this.charts.gradeDistributionChart.options.plugins.tooltip = {
                    callbacks: {
                        label: (context) => {
                            const value = context.raw;
                            if (context.dataIndex === 0) { // Current GPA
                                const diffText = diff !== '0.00' ? 
                                    ` (${diff > 0 ? '+' : ''}${diff})` : '';
                                const arrowIndicator = isImprovement ? 
                                    ' <span style="color: #2ecc71;">▲</span>' : // Green up arrow
                                    (diff < 0 ? ' <span style="color: #e74c3c;">▼</span>' : ' ='); // Red down arrow or equals
                                return `Current GPA: ${value.toFixed(2)}${diffText}${arrowIndicator}`;
                            } else { // Previous GPA
                                return `Previous GPA: ${value.toFixed(2)}`;
                            }
                        }
                    }
                };
                
                // Add an afterDraw plugin to draw the arrow indicator on the chart
                this.charts.gradeDistributionChart.options.plugins.afterDraw = (chart) => {
                    const ctx = chart.ctx;
                    const meta = chart.getDatasetMeta(0);
                    
                    if (isImprovement && meta.data.length > 0) {
                        const currentBar = meta.data[0];
                        const x = currentBar.x;
                        const y = currentBar.y - 20; // Position above the bar
                        
                        // Draw green up arrow
                        ctx.save();
                        ctx.fillStyle = '#2ecc71';
                        ctx.font = 'bold 24px Arial';
                        ctx.textAlign = 'center';
                        ctx.fillText('▲', x, y);
                        ctx.restore();
                    }
                };
                
                // Update the chart
                this.charts.gradeDistributionChart.update('none');
            }

        } catch (error) {
            console.error('Error updating charts:', error);
        }
    }

    getGradeComparisonColors(currentGPA, previousGPA) {
        // This method is kept for compatibility but is no longer used for the grade distribution chart
        // The current grade is always blue, and the previous grade is always gray
        const diff = currentGPA - previousGPA;
        if (Math.abs(diff) < 0.001) {
            return {
                background: ['rgba(52, 152, 219, 0.6)', 'rgba(149, 165, 166, 0.6)'],
                border: ['rgb(52, 152, 219)', 'rgb(149, 165, 166)']
            };
        }
        return {
            background: [
                'rgba(52, 152, 219, 0.6)', // Always blue for current
                'rgba(149, 165, 166, 0.6)'  // Always gray for previous
            ],
            border: [
                'rgb(52, 152, 219)', // Always blue for current
                'rgb(149, 165, 166)'  // Always gray for previous
            ]
        };
    }

    updateTrainingStats(data) {
        try {
            if (!this.initialized) {
                this.init();
            }

            if (this.charts.performanceTrendChart) {
                this.charts.performanceTrendChart.data.labels = data.weeks;
                this.charts.performanceTrendChart.data.datasets.forEach((dataset, index) => {
                    dataset.data = data.performance[dataset.label.toLowerCase()];
                });
                this.charts.performanceTrendChart.update();
            }

            if (this.charts.skillDistributionChart) {
                this.charts.skillDistributionChart.data.datasets[0].data = data.skills;
                this.charts.skillDistributionChart.update();
            }
        } catch (error) {
            console.error('Error updating training stats:', error);
        }
    }

    resetCharts() {
        Object.values(this.charts).forEach(chart => {
            if (chart) {
                chart.data.labels = [];
                chart.data.datasets.forEach(dataset => {
                    dataset.data = [];
                });
                chart.update();
            }
        });
    }

    updateGradeAnalytics(grades) {
        const analytics = {
            calculateTrends() {
                // Implement trend analysis
            },
            generatePredictions() {
                // Implement grade predictions
            },
            exportData() {
                // Implement data export
            }
        };
    }

    // ... Add other chart initialization methods as needed
}

// Update the global check method
window.isChartManagerReady = () => {
    return window.chartManager && window.chartManager.isReady();
};

// Initialize with async handling
const initChartManager = async () => {
    if (!window.chartManager) {
        window.chartManager = new ChartManager();
        await window.chartManager.initializationPromise;
        console.log('ChartManager initialized successfully');
    }
};

// Initialize when everything is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initChartManager);
} else {
    initChartManager();
}

// Export for use in other modules
window.ChartManager = ChartManager;
window.STORAGE_KEYS = STORAGE_KEYS;
