class TrainingManager {
    constructor() {
        this.sessions = JSON.parse(localStorage.getItem('trainingSessions')) || [];
        this.activeTimers = new Map(); // Add timer tracking
        this.updateInterval = null; // Add update interval for real-time updates
        this.lastResetDate = localStorage.getItem('lastResetDate') || this.getStartOfWeek();
        this.checkWeeklyReset();
        this.loadDataFromStorage();
        this.initialized = false;
        this.initPromise = null;
        this.quests = JSON.parse(localStorage.getItem('trainingQuests')) || {};
        this.achievements = JSON.parse(localStorage.getItem('trainingAchievements')) || [];
        this.initQuests();
        this.loadAchievementsFromStorage();
        this.currentDate = new Date();
        this.selectedDate = null;
    }

    loadDataFromStorage() {
        // Load sessions from localStorage
        this.sessions = JSON.parse(localStorage.getItem('trainingSessions')) || [];
        
        // Restore active timers for in-progress sessions
        this.sessions.forEach(session => {
            if (session.status === 'inProgress' && session.actualStartTime) {
                this.activeTimers.set(session.id, session.actualStartTime);
                this.startRealtimeUpdates();
            }
        });
        
        // Update UI
        this.updateSessionCounts();
        this.renderStats();
        this.renderRecentSessions(this.getRecentSessions());
        this.renderRecentActivities(); // Add this line to render activities on load
    }

    loadAchievementsFromStorage() {
        this.quests = JSON.parse(localStorage.getItem('trainingQuests')) || {};
        this.achievements = JSON.parse(localStorage.getItem('trainingAchievements')) || [];
        this.updateAchievements(); // Update UI on load
    }

    async init() {
        if (this.initPromise) return this.initPromise;

        this.initPromise = (async () => {
            try {
                // Critical initialization first
                this.sessions = JSON.parse(localStorage.getItem('trainingSessions')) || [];
                this.initEventListeners();
                this.showSection('overview');

                // Defer non-critical operations
                requestAnimationFrame(() => {
                    this.updateSessionCounts();
                    this.initCardListeners();
                    this.renderSessions();
                    this.initNavigation();
                });

                this.initialized = true;
            } catch (error) {
                console.error('Initialization error:', error);
            }
        })();

        return this.initPromise;
    }

    initEventListeners() {
        document.getElementById('saveSession')?.addEventListener('click', () => this.saveSession());
        
        // Calendar navigation
        document.getElementById('prevMonth')?.addEventListener('click', () => this.changeMonth(-1));
        document.getElementById('nextMonth')?.addEventListener('click', () => this.changeMonth(1));
        document.getElementById('todayBtn')?.addEventListener('click', () => this.goToToday());
        
        // Close day details panel
        document.getElementById('closeDayDetails')?.addEventListener('click', () => this.closeDayDetails());
        
        // Initialize calendar
        this.initCalendar();
    }

    initCardListeners() {
        document.querySelectorAll('.training-card').forEach(card => {
            card.addEventListener('click', () => {
                const type = card.classList.contains('session-list') ? 'sessions' :
                            card.classList.contains('in-progress') ? 'in-progress' :
                            'completed';
                this.showCardOverlay(type);
            });
        });
    }

    showCardOverlay(type) {
        this.currentOverlayType = type; // Store current type
        const overlay = document.createElement('div');
        overlay.className = `card-overlay ${type}`;
        
        overlay.innerHTML = `
            <div class="overlay-header">
                <h2 class="overlay-title">${type.charAt(0).toUpperCase() + type.slice(1)}</h2>
                <button class="overlay-close" onclick="trainingManager.closeCardOverlay()">
                    <i class="bi bi-x-lg"></i>
                </button>
            </div>
            <div class="overlay-content">
                ${this.renderSessionsByType(type)}
            </div>
        `;
        
        document.body.appendChild(overlay);
        setTimeout(() => overlay.classList.add('show'), 10);
        document.body.style.overflow = 'hidden';
    }

    closeCardOverlay() {
        const overlay = document.querySelector('.card-overlay');
        if (overlay) {
            overlay.classList.remove('show');
            setTimeout(() => {
                overlay.remove();
                document.body.style.overflow = '';
            }, 300);
        }
    }

    renderSessionsByType(type) {
        const sessions = this.sessions.filter(session => {
            if (type === 'sessions') return session.status === 'pending';
            if (type === 'in-progress') return session.status === 'inProgress';
            return session.status === 'completed';
        });

        if (!sessions.length) {
            return '<div class="empty-state">No sessions found</div>';
        }

        return sessions.map(session => `
            <div class="session-item">
                <div class="session-header">
                    <h3 class="session-title">${session.name}</h3>
                    <span class="session-date">${new Date(session.date).toLocaleDateString()}</span>
                </div>
                <div class="session-actions">
                    <button class="details-session-btn" onclick="trainingManager.toggleDetails('${session.id}')">
                        <i class="bi bi-info-circle"></i>
                        Details
                    </button>
                    ${type === 'sessions' ? `
                        <button class="delete-session-btn" onclick="trainingManager.deleteSession('${session.id}')">
                            <i class="bi bi-trash"></i>
                            Delete
                        </button>
                    ` : ''}
                    ${type !== 'completed' ? `
                        <button class="start-session-btn" onclick="trainingManager.${type === 'in-progress' ? 'completeSession' : 'startSession'}('${session.id}')">
                            <i class="bi bi-${type === 'in-progress' ? 'check-lg' : 'play-fill'}"></i>
                            ${type === 'in-progress' ? 'Complete' : 'Start'}
                        </button>
                    ` : ''}
                </div>
                <div class="session-details" id="details-${session.id}" style="display: none;">
                    <div class="session-info-row">
                        <div class="info-group">
                            <span class="info-label">Type</span>
                            <span class="info-value">${session.type}</span>
                        </div>
                        <div class="info-group">
                            <span class="info-label">Duration</span>
                            <span class="info-value">${session.duration} minutes</span>
                        </div>
                        <div class="info-group">
                            <span class="info-label">Time</span>
                            <span class="info-value">${session.time || 'Not set'} ${session.timeAmPm || ''}</span>
                        </div>
                    </div>
                    ${session.notes ? `
                        <div class="session-notes">
                            <span class="info-label">Notes</span>
                            <p>${session.notes}</p>
                        </div>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    toggleDetails(id) {
        const details = document.getElementById(`details-${id}`);
        if (details) {
            const isHidden = details.style.display === 'none';
            details.style.display = isHidden ? 'block' : 'none';
        }
    }

    saveSessions() {
        localStorage.setItem('trainingSessions', JSON.stringify(this.sessions));
        this.updateSessionCounts();
        this.renderStats();
        this.renderRecentSessions(this.getRecentSessions());
    }

    saveSession() {
        const form = document.getElementById('sessionForm');
        if (!form) return;
        
        const formData = new FormData(form);
        
        const session = {
            id: Date.now(),
            name: formData.get('sessionName'),
            type: formData.get('sessionType'),
            duration: formData.get('duration'),
            date: formData.get('sessionDate'),
            time: formData.get('sessionTime'),
            timeAmPm: formData.get('timeAmPm'),
            notes: formData.get('sessionNotes'),
            status: 'pending',
            createdAt: new Date().toISOString()
        };

        this.sessions.push(session);
        this.saveSessions();
        this.updateSessionCounts();
        this.renderStats(); // Add this line to update overview stats
        modalManager.closeModal();
        form.reset();
        
        // Refresh the current overlay if we're in sessions view
        if (this.currentOverlayType === 'sessions') {
            this.closeCardOverlay();
            this.showCardOverlay('sessions');
        }
    }

    updateSessionCounts() {
        // Get counts for each status
        const pending = this.sessions.filter(s => s.status === 'pending').length;
        const inProgress = this.sessions.filter(s => s.status === 'inProgress').length;
        const completed = this.sessions.filter(s => s.status === 'completed').length;

        // Update DOM elements
        const sessionCount = document.querySelector('.session-list .session-count');
        const inProgressCount = document.querySelector('.in-progress .progress-count');
        const completedCount = document.querySelector('.completed .complete-count');
        const totalSessionsCount = document.querySelector('#totalSessions');

        if (sessionCount) sessionCount.textContent = pending;
        if (inProgressCount) inProgressCount.textContent = inProgress;
        if (completedCount) completedCount.textContent = completed;
        if (totalSessionsCount) totalSessionsCount.textContent = completed; // Update overview total with completed count
    }

    showSection(sectionId) {
        // Hide all sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Show selected section
        document.getElementById(`${sectionId}-content`)?.classList.add('active');
        
        // Update nav links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.toggle('active', link.getAttribute('data-section') === sectionId);
        });
    }

    initNavigation() {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.currentTarget.getAttribute('data-section');
                this.showSection(section);
            });
        });
    }

    renderOverview() {
        const recentSessions = this.getRecentSessions();
        this.renderRecentSessions(recentSessions);
        this.renderStats();
    }

    getRecentSessions() {
        return this.sessions
            .filter(s => s.status === 'pending')
            .slice(0, 5); // Return 5 most recent pending sessions
    }

    renderRecentSessions(sessions) {
        const container = document.querySelector('.recent-sessions');
        if (!container) return;

        if (!sessions || sessions.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="bi bi-calendar-x"></i>
                    <p>No upcoming sessions</p>
                </div>`;
            return;
        }

        container.innerHTML = sessions.map(session => `
            <div class="session-card">
                <div class="session-header">
                    <h3 class="session-title">${session.name}</h3>
                    <span class="session-date">${new Date(session.date).toLocaleDateString()}</span>
                </div>
                <div class="session-footer">
                    <button class="start-session-btn" onclick="trainingManager.startSession('${session.id}')">
                        <i class="bi bi-play-fill"></i>
                        Start
                    </button>
                </div>
            </div>
        `).join('');
    }

    renderStats() {
        // Initialize counts, defaulting to 0 for new users
        const completed = this.sessions.filter(s => s.status === 'completed').length || 0;
        const upcoming = this.sessions.filter(s => s.status === 'pending').length || 0;
        const inProgress = this.sessions.filter(s => s.status === 'inProgress').length || 0;
            
        // Update UI elements, ensuring they show 0 for new users
        const elements = {
            'totalSessions': completed,
            'inProgressCount': inProgress,
            'upcomingSessionsCount': upcoming
        };

        // Update each element, defaulting to 0 if element not found
        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });
        
        // Update progress count in training card
        const inProgressCount = document.querySelector('.in-progress .progress-count');
        if (inProgressCount) {
            inProgressCount.textContent = inProgress;
        }

        this.renderPerformanceChart();
    }

    renderPerformanceChart() {
        const ctx = document.getElementById('sessionsChart')?.getContext('2d');
        if (!ctx) return;

        // Get last 7 days of sessions
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const today = new Date();
        const sessionsPerDay = Array(7).fill(0);

        this.sessions.forEach(session => {
            const sessionDate = new Date(session.date);
            const daysDiff = Math.floor((today - sessionDate) / (1000 * 60 * 60 * 24));
            if (daysDiff < 7) {
                sessionsPerDay[6 - daysDiff]++;
            }
        });

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: days,
                datasets: [{
                    label: 'Training Sessions',
                    data: sessionsPerDay,
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

    renderSchedule() {
        // Implement schedule rendering
    }

    renderSessions() {
        // Remove this method or keep it empty since we're not using the bottom list anymore
        return;
    }

    startSession(id) {
        const session = this.sessions.find(s => s.id === Number(id));
        if (session) {
            session.status = 'inProgress';
            session.startedDate = new Date().toISOString();
            session.actualStartTime = Date.now();
            this.activeTimers.set(session.id, Date.now());
            
            this.saveSessions();
            this.updateSessionCounts();
            if (window.chartManager) {
                window.chartManager.updateTrainingProgress(this.sessions);
            }
            this.closeCardOverlay();
            this.showCardOverlay('in-progress');
        }
    }

    startRealtimeUpdates() {
        if (this.updateInterval) return;
        
        this.checkWeeklyReset();
        
        // Only update in-progress counts
        this.updateInterval = setInterval(() => {
            const inProgress = this.sessions.filter(s => s.status === 'inProgress').length || 0;
            
            // Update both overview and training card counts
            const overviewCount = document.getElementById('inProgressCount');
            const cardCount = document.querySelector('.in-progress .progress-count');
            
            if (overviewCount) overviewCount.textContent = inProgress;
            if (cardCount) cardCount.textContent = inProgress;
        }, 1000);
    }

    completeSession(id) {
        const session = this.sessions.find(s => s.id === Number(id));
        if (session) {
            const startTime = this.activeTimers.get(session.id);
            const endTime = Date.now();
            const duration = (endTime - startTime) / (1000 * 60); // Convert to minutes

            session.status = 'completed';
            session.completedDate = new Date().toISOString();
            session.actualDuration = Math.round(duration); // Store actual duration
            this.activeTimers.delete(session.id);

            this.saveSessions();
            this.updateSessionCounts();
            this.renderStats(); // Update overview stats
            this.closeCardOverlay();
            this.showCardOverlay('completed');

            if (this.activeTimers.size === 0) {
                clearInterval(this.updateInterval); // Stop real-time updates if no active timers
                this.updateInterval = null;
            }
        }
    }

    deleteSession(id) {
        this.sessions = this.sessions.filter(s => s.id !== Number(id));
        this.saveSessions();
        this.updateSessionCounts();
        this.closeCardOverlay();
        this.showCardOverlay(this.currentOverlayType); // Refresh current view
    }

    checkWeeklyReset() {
        const currentWeekStart = this.getStartOfWeek();
        if (this.lastResetDate < currentWeekStart) {
            this.resetWeeklyHours();
        }
    }

    getStartOfWeek() {
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setHours(0, 0, 0, 0);
        startOfWeek.setDate(now.getDate() - now.getDay()); // Set to Sunday
        return startOfWeek.toISOString();
    }

    resetWeeklyHours() {
        this.sessions.forEach(session => {
            if (session.status === 'completed') {
                session.actualDuration = 0;
            }
        });
        this.lastResetDate = this.getStartOfWeek();
        localStorage.setItem('lastResetDate', this.lastResetDate);
        this.saveSessions();
        this.renderStats();
    }

    initQuests() {
        const questData = {
            quest1: {
                title: 'Power Training',
                description: 'Complete 3 gym sessions focusing on power exercises',
                reward: 'Power Trainer Achievement'
            },
            quest2: {
                title: 'Speed Development',
                description: 'Finish 5 sprint training sessions',
                reward: 'Speed Demon Achievement'
            },
            quest3: {
                title: 'Passing Master',
                description: 'Complete 100 accurate passes in training',
                reward: 'Master Passer Achievement'
            },
            quest4: {
                title: 'Tackle Technique',
                description: 'Perfect form in 20 tackle drills',
                reward: 'Tackle Expert Achievement'
            },
            quest5: {
                title: 'Team Player',
                description: 'Participate in 3 full team practice sessions',
                reward: 'Team Spirit Achievement'
            }
        };
        this.questData = questData;
    }

    completeQuest(questId) {
        const quest = this.questData[questId];
        if (!quest) return;

        const achievement = {
            id: questId,
            title: quest.reward,
            completed: new Date().toISOString(),
            questTitle: quest.title
        };

        // Add to achievements
        this.achievements.push(achievement);
        this.quests[questId] = true;

        // Save to localStorage
        localStorage.setItem('trainingQuests', JSON.stringify(this.quests));
        localStorage.setItem('trainingAchievements', JSON.stringify(this.achievements));

        // Update both achievements and recent activities
        this.updateAchievements();
        this.renderRecentSessions(this.getRecentSessions());
        
        // Add achievement to recent activities
        this.addAchievementToRecent(achievement);

        // Hide completed quest
        const questElement = document.querySelector(`[data-quest-id="${questId}"]`);
        if (questElement) {
            questElement.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => questElement.remove(), 300);
        }
    }

    addAchievementToRecent(achievement) {
        // Get existing recent activities
        let recentActivities = JSON.parse(localStorage.getItem('recentActivities')) || [];
        
        // Add new achievement to the beginning
        recentActivities.unshift({
            type: 'achievement',
            data: achievement,
            timestamp: new Date().toISOString()
        });

        // Keep only the latest 10 items
        recentActivities = recentActivities.slice(0, 10);
        
        // Save to localStorage
        localStorage.setItem('recentActivities', JSON.stringify(recentActivities));
        
        // Update UI
        this.renderRecentActivities();
    }

    renderRecentActivities() {
        const container = document.querySelector('.recent-sessions');
        if (!container) return;

        const recentActivities = JSON.parse(localStorage.getItem('recentActivities')) || [];

        if (recentActivities.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="bi bi-calendar-x"></i>
                    <p>No recent activities</p>
                </div>`;
            return;
        }

        container.innerHTML = recentActivities.map(activity => {
            if (activity.type === 'achievement') {
                return `
                    <div class="session-card achievement-card">
                        <div class="session-header">
                            <h3 class="session-title">
                                <i class="bi bi-trophy-fill" style="color: #f1c40f;"></i>
                                New Achievement: ${activity.data.title}
                            </h3>
                            <span class="session-date">${new Date(activity.timestamp).toLocaleDateString()}</span>
                        </div>
                        <p class="achievement-desc">${activity.data.questTitle}</p>
                    </div>`;
            }
            // Add other activity types here if needed
            return '';
        }).join('');
    }

    updateAchievements() {
        const emptyState = document.getElementById('emptyAchievements');
        const achievementsList = document.getElementById('achievementsList');
        
        if (!this.achievements || this.achievements.length === 0) {
            if (emptyState) emptyState.style.display = 'flex';
            if (achievementsList) achievementsList.innerHTML = '';
            return;
        }

        if (emptyState) emptyState.style.display = 'none';
        if (achievementsList) {
            achievementsList.innerHTML = this.achievements.map(achievement => `
                <div class="achievement-item unlocked">
                    <i class="bi bi-trophy-fill"></i>
                    <div class="achievement-info">
                        <h4>${achievement.title}</h4>
                        <p>Completed: ${new Date(achievement.completed).toLocaleDateString()}</p>
                        <small>${achievement.questTitle}</small>
                    </div>
                </div>
            `).join('');
        }
    }

    initCalendar() {
        this.renderCalendar();
    }

    renderCalendar() {
        const currentMonth = this.currentDate.getMonth();
        const currentYear = this.currentDate.getFullYear();
        
        // Update month/year display
        document.getElementById('currentMonth').textContent = new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long' });
        document.getElementById('currentYear').textContent = currentYear;
        
        // Get first day of month and total days
        const firstDay = new Date(currentYear, currentMonth, 1).getDay();
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        
        // Get days from previous month
        const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();
        
        // Clear calendar grid
        const calendarGrid = document.getElementById('calendarGrid');
        if (!calendarGrid) return;
        
        calendarGrid.innerHTML = '';
        
        // Add days from previous month
        for (let i = firstDay - 1; i >= 0; i--) {
            const dayElement = this.createDayElement(daysInPrevMonth - i, true);
            dayElement.classList.add('other-month');
            calendarGrid.appendChild(dayElement);
        }
        
        // Add days of current month
        const today = new Date();
        const isCurrentMonth = today.getMonth() === currentMonth && today.getFullYear() === currentYear;
        const todayDate = today.getDate();
        
        for (let i = 1; i <= daysInMonth; i++) {
            const dayElement = this.createDayElement(i, false);
            
            // Check if this day is today
            if (isCurrentMonth && i === todayDate) {
                dayElement.classList.add('today');
            }
            
            // Check if this day is selected
            if (this.selectedDate && 
                this.selectedDate.getDate() === i && 
                this.selectedDate.getMonth() === currentMonth && 
                this.selectedDate.getFullYear() === currentYear) {
                dayElement.classList.add('selected');
            }
            
            // Add sessions indicators
            const sessionCount = this.getSessionsForDay(new Date(currentYear, currentMonth, i)).length;
            if (sessionCount > 0) {
                this.addSessionIndicators(dayElement, new Date(currentYear, currentMonth, i));
            }
            
            calendarGrid.appendChild(dayElement);
        }
        
        // Add days from next month
        const totalDaysAdded = firstDay + daysInMonth;
        const daysToAdd = 42 - totalDaysAdded; // 6 rows of 7 days
        
        for (let i = 1; i <= daysToAdd; i++) {
            const dayElement = this.createDayElement(i, true);
            dayElement.classList.add('other-month');
            calendarGrid.appendChild(dayElement);
        }
    }

    createDayElement(day, isOtherMonth) {
        const dayElement = document.createElement('div');
        dayElement.classList.add('calendar-day');
        
        // Create a more prominent day number element
        const dayNumber = document.createElement('div');
        dayNumber.classList.add('day-number');
        dayNumber.textContent = day;
        dayNumber.style.fontSize = '1.3rem'; // Make the font size larger
        dayNumber.style.fontWeight = 'bold'; // Make it bold
        dayNumber.style.color = isOtherMonth ? '#adb5bd' : '#333'; // Better contrast
        
        const sessionIndicators = document.createElement('div');
        sessionIndicators.classList.add('session-indicators');
        
        dayElement.appendChild(dayNumber);
        dayElement.appendChild(sessionIndicators);
        
        // Add click event only for current month days
        if (!isOtherMonth) {
            dayElement.addEventListener('click', () => {
                const selectedDay = new Date(
                    this.currentDate.getFullYear(),
                    this.currentDate.getMonth(),
                    day
                );
                this.selectDay(selectedDay);
            });
        }
        
        return dayElement;
    }

    addSessionIndicators(dayElement, date) {
        const sessions = this.getSessionsForDay(date);
        const sessionTypes = new Set(sessions.map(session => session.type));
        const indicators = dayElement.querySelector('.session-indicators');
        
        indicators.innerHTML = '';
        
        // Limit to 3 indicators max
        const maxIndicators = Math.min(sessionTypes.size, 3);
        let count = 0;
        
        sessionTypes.forEach(type => {
            if (count < maxIndicators) {
                const indicator = document.createElement('div');
                indicator.classList.add('session-indicator');
                indicator.classList.add(type.toLowerCase());
                indicators.appendChild(indicator);
                count++;
            }
        });
        
        // If there are more sessions than indicators shown
        if (sessions.length > maxIndicators) {
            const moreIndicator = document.createElement('div');
            moreIndicator.classList.add('session-indicator');
            moreIndicator.style.backgroundColor = '#6c757d';
            indicators.appendChild(moreIndicator);
        }
    }

    getSessionsForDay(date) {
        return this.sessions.filter(session => {
            const sessionDate = new Date(session.date);
            return sessionDate.getDate() === date.getDate() && 
                   sessionDate.getMonth() === date.getMonth() && 
                   sessionDate.getFullYear() === date.getFullYear();
        });
    }

    selectDay(date) {
        // Remove selected class from previously selected day
        const selectedDay = document.querySelector('.calendar-day.selected');
        if (selectedDay) {
            selectedDay.classList.remove('selected');
        }
        
        // Add selected class to new selected day
        this.selectedDate = date;
        
        // Find the day element for the selected date
        const dayElements = document.querySelectorAll('.calendar-day:not(.other-month)');
        const dayIndex = date.getDate() - 1; // Adjust for 0-based index
        
        if (dayElements[dayIndex]) {
            dayElements[dayIndex].classList.add('selected');
        }
        
        // Show day details panel
        this.showDayDetails(date);
    }

    showDayDetails(date) {
        const panel = document.getElementById('dayDetailsPanel');
        const dateHeader = document.getElementById('selectedDate');
        const sessionsList = document.getElementById('daySessionsList');
        
        // Format date for header
        const formattedDate = date.toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric' 
        });
        
        dateHeader.textContent = formattedDate;
        
        // Get sessions for this day
        const sessions = this.getSessionsForDay(date);
        
        // Clear previous sessions
        sessionsList.innerHTML = '';
        
        if (sessions.length === 0) {
            // Show empty state
            const emptyMessage = document.createElement('div');
            emptyMessage.classList.add('empty-day-message');
            emptyMessage.innerHTML = `
                <i class="bi bi-calendar-x"></i>
                <p>No training sessions scheduled for this day</p>
            `;
            sessionsList.appendChild(emptyMessage);
        } else {
            // Add session items
            sessions.forEach(session => {
                const sessionItem = document.createElement('div');
                sessionItem.classList.add('session-item');
                sessionItem.classList.add(session.type.toLowerCase());
                
                sessionItem.innerHTML = `
                    <h5>${session.title}</h5>
                    <p>${session.description || 'No description'}</p>
                    <div class="session-time">
                        <i class="bi bi-clock"></i>
                        ${session.startTime || '00:00'} - ${session.endTime || '00:00'}
                    </div>
                `;
                
                sessionsList.appendChild(sessionItem);
            });
        }
        
        // Show panel
        panel.classList.add('active');
    }

    closeDayDetails() {
        const panel = document.getElementById('dayDetailsPanel');
        panel.classList.remove('active');
    }

    changeMonth(delta) {
        this.currentDate.setMonth(this.currentDate.getMonth() + delta);
        this.renderCalendar();
    }

    goToToday() {
        this.currentDate = new Date();
        this.renderCalendar();
        this.selectDay(new Date());
    }
}

// Initialize with performance optimization
document.addEventListener('DOMContentLoaded', () => {
    window.trainingManager = new TrainingManager();
    
    // Defer initialization to next frame
    requestAnimationFrame(() => {
        window.trainingManager.init();
    });
});
