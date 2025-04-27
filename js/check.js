/**
 * check.js - Section Display Validation
 * Controls section visibility and manages dashboard stats
 */

const STORAGE_KEYS = {
    ACTIVE_TIMERS: 'academic_active_timers',
    STUDY_HOURS: 'academic_study_hours',
    TASKS_HISTORY: 'academic_tasks_history',
    ASSIGNMENTS: 'academic_assignments',
    GRADES: 'academic_grades'
};

const appManager = {
    timers: new Map(),
    stats: new Map(),
    
    initializeManagers() {
        try {
            this.restoreTimers();
            this.initializeStats();
            this.setupEventListeners();
            console.log('✅ App manager initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize app manager:', error);
            this.handleError(error);
        }
    },

    handleError(error, context = '') {
        console.error(`Error ${context ? 'in ' + context : ''}:`, error);
        // You could add error reporting service here
    },

    restoreTimers() {
        try {
            const savedTimers = localStorage.getItem(STORAGE_KEYS.ACTIVE_TIMERS);
            if (!savedTimers) {
                console.log('No saved timers found');
                return;
            }

            let timerData;
            try {
                timerData = JSON.parse(savedTimers);
                if (!Array.isArray(timerData)) {
                    throw new Error('Invalid timer data format');
                }
            } catch (parseError) {
                console.error('Failed to parse timer data:', parseError);
                this.handleTimerDataCorruption();
                return;
            }

            const currentTime = new Date().getTime();
            const validTimers = timerData.filter(timer => {
                // Validate timer object structure
                if (!timer || typeof timer !== 'object') return false;
                if (!timer.id || !timer.startTime || !timer.subject) return false;
                
                // Check for reasonable time values
                const startTime = new Date(timer.startTime).getTime();
                if (isNaN(startTime) || startTime > currentTime) return false;
                
                // Check for maximum session duration (24 hours)
                const maxSessionDuration = 24 * 60 * 60 * 1000;
                if (currentTime - startTime > maxSessionDuration) {
                    this.logExpiredTimer(timer);
                    return false;
                }

                return true;
            });

            if (validTimers.length !== timerData.length) {
                console.warn(`Found ${timerData.length - validTimers.length} invalid timers`);
                this.saveTimers(validTimers); // Update storage with only valid timers
            }

            // Restore valid timers
            validTimers.forEach(timer => {
                try {
                    const restoredTimer = this.startTimer(timer.id, {
                        subject: timer.subject,
                        startTime: new Date(timer.startTime),
                        metadata: timer.metadata || {}
                    });

                    if (restoredTimer) {
                        this.synchronizeTimerWithServer(restoredTimer);
                    }
                } catch (timerError) {
                    console.error(`Failed to restore timer ${timer.id}:`, timerError);
                }
            });

            // Notify if any timers were restored
            if (validTimers.length > 0) {
                this.notifyTimersRestored(validTimers.length);
            }
        } catch (error) {
            this.handleError(error, 'restoring timers');
            this.attemptTimerRecovery();
        }
    },

    handleTimerDataCorruption() {
        // Backup corrupted data for potential recovery
        const corruptedData = localStorage.getItem(STORAGE_KEYS.ACTIVE_TIMERS);
        if (corruptedData) {
            localStorage.setItem('academic_timer_backup_' + new Date().getTime(), corruptedData);
        }
        // Clear corrupted timer data
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_TIMERS);
        console.warn('Timer data was corrupted and has been reset');
    },

    logExpiredTimer(timer) {
        // Log expired timer to study history
        const studyHistory = JSON.parse(localStorage.getItem(STORAGE_KEYS.STUDY_HOURS) || '[]');
        studyHistory.push({
            subject: timer.subject,
            startTime: timer.startTime,
            endTime: new Date(timer.startTime).getTime() + (24 * 60 * 60 * 1000),
            status: 'expired'
        });
        localStorage.setItem(STORAGE_KEYS.STUDY_HOURS, JSON.stringify(studyHistory));
    },

    saveTimers(timers) {
        try {
            localStorage.setItem(STORAGE_KEYS.ACTIVE_TIMERS, JSON.stringify(timers));
        } catch (error) {
            console.error('Failed to save timers:', error);
        }
    },

    synchronizeTimerWithServer(timer) {
        // Adjust timer based on server time if needed
        fetch('/api/server-time')
            .then(response => response.json())
            .then(data => {
                const serverTime = new Date(data.serverTime).getTime();
                const localTime = new Date().getTime();
                const timeDiff = Math.abs(serverTime - localTime);
                
                if (timeDiff > 5000) { // If time difference is more than 5 seconds
                    timer.adjust(serverTime - localTime);
                    console.log(`Timer ${timer.id} synchronized with server time`);
                }
            })
            .catch(error => {
                console.warn('Failed to synchronize timer with server:', error);
            });
    },

    notifyTimersRestored(count) {
        const event = new CustomEvent('timersRestored', {
            detail: { count, timestamp: new Date().getTime() }
        });
        window.dispatchEvent(event);
    },

    attemptTimerRecovery() {
        // Try to recover from backup if available
        const backups = Object.keys(localStorage)
            .filter(key => key.startsWith('academic_timer_backup_'))
            .sort()
            .reverse();

        if (backups.length > 0) {
            try {
                const latestBackup = localStorage.getItem(backups[0]);
                const recoveredData = JSON.parse(latestBackup);
                if (Array.isArray(recoveredData)) {
                    this.saveTimers(recoveredData);
                    console.log('Successfully recovered timers from backup');
                    return true;
                }
            } catch (error) {
                console.error('Failed to recover timers from backup:', error);
            }
        }
        return false;
    },

    initializeStats() {
        this.updateTaskCounts();
        this.updateGradeStats();
        this.updateStudyHourStats();
    },

    updateTaskCounts() {
        try {
            const counts = ['todo', 'inProgress', 'completed'].reduce((acc, type) => {
                acc[type] = document.querySelector(`#${type}Tasks`)?.querySelectorAll('.task-item:not(.template)').length || 0;
                return acc;
            }, {});

            requestAnimationFrame(() => {
                Object.entries(counts).forEach(([key, count]) => {
                    const element = document.querySelector(`.${key}-card .task-count`);
                    if (element) element.textContent = count;
                });

                const assignmentCount = document.querySelector('[data-stat="assignmentCount"]');
                if (assignmentCount) {
                    assignmentCount.textContent = counts.todo + counts.inProgress;
                }
            });
        } catch (error) {
            this.handleError(error, 'updating task counts');
        }
    },

    setupEventListeners() {
        try {
            const statsObserver = new MutationObserver(() => {
                requestAnimationFrame(() => this.synchronizeStats());
            });

            ['#gradeHistoryTable', '#todoTasks', '#inProgressTasks', '#completedTasks'].forEach(selector => {
                const element = document.querySelector(selector);
                if (element) {
                    statsObserver.observe(element, { childList: true, subtree: true });
                }
            });
        } catch (error) {
            this.handleError(error, 'setting up event listeners');
        }
    },

    synchronizeStats() {
        this.updateTaskCounts();
        this.updateGradeStats();
        this.updateStudyHourStats();
    },

    updateGradeStats() {
        try {
            const grades = Array.from(document.querySelectorAll('#gradeHistoryTable tr:not(.template)'))
                .map(row => parseFloat(row.querySelector('.grade-value')?.textContent))
                .filter(grade => !isNaN(grade));

            if (grades.length > 0) {
                const average = grades.reduce((sum, grade) => sum + grade, 0) / grades.length;
                const element = document.querySelector('[data-stat="gradeAverage"]');
                if (element) {
                    element.textContent = average.toFixed(1);
                }
            }
        } catch (error) {
            this.handleError(error, 'updating grade stats');
        }
    },

    updateStudyHourStats() {
        try {
            const studyHours = localStorage.getItem(STORAGE_KEYS.STUDY_HOURS);
            if (studyHours) {
                const hours = JSON.parse(studyHours);
                const totalHours = Object.values(hours).reduce((sum, h) => sum + h, 0);
                const element = document.querySelector('[data-stat="studyHours"]');
                if (element) {
                    element.textContent = totalHours.toFixed(1);
                }
            }
        } catch (error) {
            this.handleError(error, 'updating study hour stats');
        }
    },

    studySessionManager: {
        startSession(subject) {
            try {
                const session = {
                    subject,
                    startTime: Date.now(),
                };
                localStorage.setItem(`study_session_${subject}`, JSON.stringify(session));
                return session;
            } catch (error) {
                appManager.handleError(error, 'starting study session');
                return null;
            }
        },

        endSession(subject) {
            try {
                const sessionData = localStorage.getItem(`study_session_${subject}`);
                if (sessionData) {
                    const session = JSON.parse(sessionData);
                    const duration = (Date.now() - session.startTime) / (1000 * 60 * 60); // Convert to hours
                    
                    const studyHours = JSON.parse(localStorage.getItem(STORAGE_KEYS.STUDY_HOURS) || '{}');
                    studyHours[subject] = (studyHours[subject] || 0) + duration;
                    localStorage.setItem(STORAGE_KEYS.STUDY_HOURS, JSON.stringify(studyHours));
                    
                    localStorage.removeItem(`study_session_${subject}`);
                    return duration;
                }
            } catch (error) {
                appManager.handleError(error, 'ending study session');
                return 0;
            }
        }
    }
};

/**
 * Section Display Management
 * Validates and manages the visibility of sections in the application
 * @returns {boolean} True if validation passes, false otherwise
 */
function validateSectionDisplay() {
    const sections = document.querySelectorAll('.section-content');
    if (!sections.length) {
        console.warn('⚠️ No sections found with class .section-content');
        return false;
    }

    const validation = {
        visibleSections: 0,
        activeSections: 0,
        lastVisibleSection: null,
        errors: []
    };

    try {
        sections.forEach(section => {
            const style = window.getComputedStyle(section);
            const isVisible = style.display === 'block';
            const isActive = section.classList.contains('active');

            validateSection(section, isVisible, isActive, validation);
        });

        return handleValidationResult(validation, sections.length);
    } catch (error) {
        console.error('❌ Validation error:', error);
        fixSectionDisplay();
        return false;
    }
}

/**
 * Validates an individual section's visibility and active state
 * @param {HTMLElement} section - The section element to validate
 * @param {boolean} isVisible - Whether the section is visible
 * @param {boolean} isActive - Whether the section is active
 * @param {Object} validation - The validation state object
 */
function validateSection(section, isVisible, isActive, validation) {
    if (isVisible) {
        validation.visibleSections++;
        validation.lastVisibleSection = section;
        if (!isActive) {
            validation.errors.push(`Section #${section.id} is visible but not active`);
        }
    }

    if (isActive) {
        validation.activeSections++;
        if (!isVisible) {
            validation.errors.push(`Section #${section.id} is active but not visible`);
        }
    }

    if (!section.id) {
        validation.errors.push('Section missing ID');
    }
}

/**
 * Handles the result of section validation
 * @param {Object} validation - The validation state object
 * @param {number} totalSections - Total number of sections
 * @returns {boolean} True if validation passes, false otherwise
 */
function handleValidationResult(validation, totalSections) {
    const { visibleSections, activeSections, lastVisibleSection, errors } = validation;
    const timestamp = new Date().toISOString();

    if (visibleSections === 1 && activeSections === 1 && errors.length === 0) {
        if (window.DEBUG) {
            console.log(`✅ Section display validation passed:
                - Active section: #${lastVisibleSection.id}
                - Total sections: ${totalSections}
                - Timestamp: ${timestamp}`);
        }
        return true;
    }

    console.error(`❌ Section display validation failed:
        - Visible sections: ${visibleSections} (expected: 1)
        - Active sections: ${activeSections} (expected: 1)
        - Total sections: ${totalSections}
        - Last visible: ${lastVisibleSection ? '#' + lastVisibleSection.id : 'none'}
        - Validation errors: ${errors.join('\n\t')}
        - Timestamp: ${timestamp}`);
    
    fixSectionDisplay();
    return false;
}

/**
 * Fixes section display issues by resetting all sections and showing the default one
 */
function fixSectionDisplay() {
    const sections = document.querySelectorAll('.section-content');
    const activeLink = document.querySelector('.nav-link.active');
    let sectionToShow = 'overview';

    if (activeLink?.dataset?.section) {
        sectionToShow = activeLink.dataset.section;
    }

    sections.forEach(section => {
        const shouldShow = section.id === sectionToShow;
        section.style.display = shouldShow ? 'block' : 'none';
        section.classList.toggle('active', shouldShow);
    });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    appManager.initializeManagers();
});
