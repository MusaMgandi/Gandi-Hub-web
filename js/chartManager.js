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

        this.charts.performanceTrendChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'Current Performance',
                    data: currentGrades,
                    borderColor: '#3498db',
                    fill: false
                }, {
                    label: 'Predicted Performance',
                    data: predictedGrades,
                    borderColor: '#2ecc71',
                    borderDash: [5, 5],
                    fill: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 4.0
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            afterBody: (context) => {
                                const subject = labels[context[0].dataIndex];
                                const actions = this.analyticsData.predictions[subject]?.recommendedActions || [];
                                return actions.length ? '\nRecommended Actions:\n- ' + actions.join('\n- ') : '';
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

        this.charts.gpaChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'GPA',
                    data: [],
                    borderColor: '#0077BE',
                    backgroundColor: 'rgba(0, 119, 190, 0.1)',
                    tension: 0.3,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 4.0,
                        ticks: {
                            stepSize: 1.0
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
                labels: ['Previous', 'Current'],
                datasets: [{
                    label: 'GPA',
                    data: [0, 0],
                    backgroundColor: [
                        'rgba(52, 152, 219, 0.6)',
                        'rgba(46, 204, 113, 0.6)'
                    ],
                    borderColor: [
                        'rgb(52, 152, 219)',
                        'rgb(46, 204, 113)'
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
        if (!this.initialized) {
            this.init();
        }

        if (!grades || !Array.isArray(grades)) {
            console.warn('Invalid grades data provided to updateCharts');
            return;
        }

        try {
            // Sort grades by date
            const sortedGrades = [...grades].sort((a, b) => new Date(a.date) - new Date(b.date));
            
            // Update GPA chart
            if (this.charts.gpaChart) {
                const labels = sortedGrades.map(grade => `${grade.yearText} ${grade.semesterText}`);
                const data = sortedGrades.map(grade => grade.gpa);
                
                this.charts.gpaChart.data.labels = labels.reverse();
                this.charts.gpaChart.data.datasets[0].data = data.reverse();
                this.charts.gpaChart.update();
            }

            // Update grade distribution chart
            if (this.charts.gradeDistributionChart && grades.length > 0) {
                const currentGPA = grades[0].gpa;
                const previousGPA = grades.length > 1 ? grades[1].gpa : 0;
                
                this.charts.gradeDistributionChart.data.datasets[0].data = [previousGPA, currentGPA];
                this.charts.gradeDistributionChart.update();
            }
        } catch (error) {
            console.error('Error updating charts:', error);
        }
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
