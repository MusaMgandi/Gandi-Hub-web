class AnalyticsManager {
    constructor() {
        this.chartManager = window.chartManager;
        this.insightsContainer = document.getElementById('academicInsights');
    }

    async initialize() {
        try {
            await this.chartManager.initializationPromise;
            this.updateInsights();
            this.setupEventListeners();
            console.log('✅ AnalyticsManager initialized');
            return true;
        } catch (error) {
            console.error('Failed to initialize AnalyticsManager:', error);
            return false;
        }
    }

    setupEventListeners() {
        // Update insights when study data changes
        window.addEventListener('studyDataUpdated', () => this.updateInsights());
        window.addEventListener('gradeAdded', () => this.updateInsights());
    }

    updateInsights() {
        if (!this.chartManager.analyticsData) return;

        const insights = this.generateInsights();
        this.renderInsights(insights);
    }

    generateInsights() {
        const insights = [];
        const { performanceTrends, studyPatterns, predictions } = this.chartManager.analyticsData;

        // Performance Trends Insights
        performanceTrends.forEach(trend => {
            if (trend.improvement) {
                insights.push({
                    type: 'positive',
                    icon: 'bi-graph-up-arrow',
                    title: `Improving in ${trend.subject}`,
                    content: `Your performance in ${trend.subject} is showing an upward trend.`,
                    actions: ['Keep up the good work!']
                });
            } else if (trend.trend.slope < -0.2) {
                insights.push({
                    type: 'negative',
                    icon: 'bi-graph-down-arrow',
                    title: `Declining in ${trend.subject}`,
                    content: `Your performance in ${trend.subject} needs attention.`,
                    actions: this.chartManager.generateRecommendedActions(trend.subject, 
                        studyPatterns[trend.subject], trend)
                });
            }
        });

        // Study Pattern Insights
        Object.entries(studyPatterns).forEach(([subject, pattern]) => {
            if (pattern.effectiveness < 0.5) {
                insights.push({
                    type: 'warning',
                    icon: 'bi-lightbulb',
                    title: `Study Effectiveness for ${subject}`,
                    content: `Your study effectiveness in ${subject} could be improved.`,
                    actions: [
                        'Try different study techniques',
                        'Consider study groups or tutoring',
                        `Recommended study time: ${pattern.recommendedHours} hours`
                    ]
                });
            }
        });

        // Prediction Insights
        Object.entries(predictions).forEach(([subject, prediction]) => {
            if (prediction.expectedGrade < 3.0) {
                insights.push({
                    type: 'warning',
                    icon: 'bi-exclamation-triangle',
                    title: `Grade Alert for ${subject}`,
                    content: `Your predicted grade in ${subject} is ${prediction.expectedGrade.toFixed(1)}.`,
                    actions: prediction.recommendedActions
                });
            }
        });

        return insights;
    }

    renderInsights(insights) {
        if (!this.insightsContainer) return;

        this.insightsContainer.innerHTML = insights.map(insight => `
            <div class="insight-card ${insight.type}">
                <div class="insight-header">
                    <i class="bi ${insight.icon}"></i>
                    <h4 class="insight-title">${insight.title}</h4>
                </div>
                <div class="insight-content">
                    ${insight.content}
                </div>
                ${insight.actions.length ? `
                    <div class="insight-actions">
                        ${insight.actions.map(action => `
                            <div class="insight-action-item">
                                <i class="bi bi-check-circle"></i>
                                <span>${action}</span>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `).join('');
    }

    exportAnalytics() {
        const data = {
            performanceTrends: this.chartManager.analyticsData.performanceTrends,
            studyPatterns: this.chartManager.analyticsData.studyPatterns,
            predictions: this.chartManager.analyticsData.predictions,
            timestamp: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'academic-analytics.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.analyticsManager = new AnalyticsManager();
    window.analyticsManager.initialize();
});
