class AssignmentManager {
    constructor() {
        this.tasks = new Map();
        this.boards = ['todoTasks', 'inProgressTasks', 'completedTasks'];
        this.initialized = false;
        this.storage = window.localStorage;
        this.STORAGE_KEY = 'academic_tasks';
    }

    async initialize() {
        try {
            await this.loadTasks();
            this.setupEventListeners();
            this.initializeBoards();
            this.initialized = true;
            console.log('✅ AssignmentManager initialized');
            return true;
        } catch (error) {
            console.error('❌ AssignmentManager initialization failed:', error);
            return false;
        }
    }

    setupEventListeners() {
        // Quick add form (desktop)
        document.getElementById('quickAddTaskForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTask('quick');
        });

        // Mobile add form
        document.getElementById('saveMobileTaskBtn')?.addEventListener('click', () => {
            this.addTask('mobile');
        });

        // Task action buttons
        this.boards.forEach(boardId => {
            document.getElementById(boardId)?.addEventListener('click', (e) => {
                if (e.target.matches('.task-action-btn')) {
                    const taskId = e.target.closest('.task-item').dataset.taskId;
                    const action = e.target.dataset.action;
                    this.handleTaskAction(taskId, action);
                }
            });
        });
    }

    addTask(formType) {
        const prefix = formType === 'quick' ? 'quickTask' : 'mobileTask';
        const task = {
            id: Date.now().toString(),
            title: document.getElementById(`${prefix}Title`).value,
            dueDate: document.getElementById(`${prefix}Due`).value,
            priority: document.getElementById(`${prefix}Priority`).value,
            notes: document.getElementById(`${prefix}Notes`).value,
            status: 'todo',
            createdAt: new Date().toISOString()
        };

        this.tasks.set(task.id, task);
        this.renderTask(task);
        this.saveTasks();
        this.updateTaskCounts();
    }

    renderTask(task) {
        const taskHtml = this.createTaskHtml(task);
        const board = document.getElementById(`${task.status}Tasks`);
        if (board) {
            board.insertAdjacentHTML('beforeend', taskHtml);
        }
    }

    createTaskHtml(task) {
        return `
            <div class="task-item" data-task-id="${task.id}">
                <span class="task-title">${task.title}</span>
                <span class="task-due">${task.dueDate}</span>
                <span class="task-priority ${task.priority}">${task.priority}</span>
                ${task.notes ? `<button class="view-notes-btn" onclick="window.assignmentManager.viewNotes('${task.id}')">
                    <i class="bi bi-text-paragraph"></i>
                </button>` : ''}
                <div class="task-actions">
                    ${this.getActionButtons(task.status)}
                </div>
            </div>`;
    }

    getActionButtons(status) {
        switch (status) {
            case 'todo':
                return '<button class="task-action-btn start-btn" data-action="start">Start</button>';
            case 'inProgress':
                return '<button class="task-action-btn complete-btn" data-action="complete">Complete</button>';
            default:
                return '';
        }
    }

    viewNotes(taskId) {
        const task = this.tasks.get(taskId);
        if (task?.notes) {
            const modal = new bootstrap.Modal(document.getElementById('taskNotesModal'));
            document.getElementById('taskNotesTitle').textContent = task.title;
            document.getElementById('taskNotesContent').textContent = task.notes;
            modal.show();
        }
    }

    async loadTasks() {
        try {
            const stored = this.storage.getItem(this.STORAGE_KEY);
            if (stored) {
                const tasks = JSON.parse(stored);
                this.tasks = new Map(Object.entries(tasks));
            }
        } catch (error) {
            console.error('Failed to load tasks:', error);
        }
    }

    saveTasks() {
        try {
            const tasksObj = Object.fromEntries(this.tasks);
            this.storage.setItem(this.STORAGE_KEY, JSON.stringify(tasksObj));
        } catch (error) {
            console.error('Failed to save tasks:', error);
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.assignmentManager = new AssignmentManager();
    window.assignmentManager.initialize();
});
