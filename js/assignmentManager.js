class AssignmentManager {
    constructor() {
        this.STORAGE_KEY = 'assignments_data';
        this.tasks = new Map();
        this.db = firebase.firestore();
        this.tasksCollection = this.db.collection('tasks');
        this.initialize();
        this.initializeLocalStorage();
    }

    initialize() {
        this.setupEventListeners();
        this.renderTasks();
        this.updateTaskCounts();
    }

    initializeLocalStorage() {
        // Initialize if storage is empty
        if (!localStorage.getItem(this.STORAGE_KEY)) {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify([]));
        }
        this.loadTasks();
    }

    loadTasks() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            const tasks = stored ? JSON.parse(stored) : [];
            this.tasks = new Map(tasks.map(task => [task.id, task]));
            
            // After loading, render tasks
            this.renderAllTasks();
        } catch (error) {
            console.error('Error loading tasks:', error);
            this.tasks = new Map();
        }
    }

    saveTasks() {
        try {
            const tasksArray = Array.from(this.tasks.values());
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(tasksArray));
            
            // Also sync with Firestore if available
            if (this.tasksCollection) {
                this.syncToFirestore();
            }
        } catch (error) {
            console.error('Error saving tasks:', error);
        }
    }

    async syncToFirestore() {
        const batch = this.db.batch();

        // Get existing documents
        const snapshot = await this.tasksCollection.get();

        // Delete existing documents
        snapshot.forEach(doc => {
            batch.delete(doc.ref);
        });

        // Add new documents
        this.tasks.forEach(task => {
            const docRef = this.tasksCollection.doc(task.id);
            batch.set(docRef, task);
        });

        // Commit the batch
        await batch.commit();
    }

    async addTask(formType) {
        const prefix = formType === 'quick' ? 'quickTask' : 'mobileTask';
        const task = {
            id: Date.now().toString(),
            title: document.getElementById(`${prefix}Title`).value,
            dueDate: document.getElementById(`${prefix}Due`).value,
            priority: document.getElementById(`${prefix}Priority`).value,
            notes: document.getElementById(`${prefix}Notes`).value,
            status: 'todo',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        try {
            // Add to Firestore first
            await this.tasksCollection.doc(task.id).set(task);

            // If successful, update local state
            this.tasks.set(task.id, task);
            this.saveTasks();
            this.renderTask(task);

            // Clear form and show success
            this.clearTaskForm(prefix);
            this.showNotification('Task added successfully', 'success');

            if (formType === 'mobile') {
                const modal = bootstrap.Modal.getInstance(document.getElementById('addTaskModal'));
                if (modal) modal.hide();
            }
        } catch (error) {
            console.error('Error adding task:', error);
            this.showNotification('Failed to add task. Please try again.', 'error');
        }
    }

    async startTask(taskId) {
        try {
            const task = this.tasks.get(taskId);
            if (task) {
                task.status = 'inProgress';
                task.updatedAt = new Date().toISOString();

                await this.tasksCollection.doc(taskId).update({
                    status: 'inProgress',
                    updatedAt: task.updatedAt
                });

                this.tasks.set(taskId, task);
                this.saveTasks();
                this.renderAllTasks();
            }
        } catch (error) {
            console.error('Error updating task:', error);
            this.showNotification('Failed to update task. Please try again.', 'error');
        }
    }

    async completeTask(taskId) {
        try {
            const task = this.tasks.get(taskId);
            if (task) {
                task.status = 'completed';
                task.completedAt = new Date().toISOString();
                task.updatedAt = new Date().toISOString();

                await this.tasksCollection.doc(taskId).update({
                    status: 'completed',
                    completedAt: task.completedAt,
                    updatedAt: task.updatedAt
                });

                this.tasks.set(taskId, task);
                this.saveTasks();
                this.renderAllTasks();
            }
        } catch (error) {
            console.error('Error completing task:', error);
            this.showNotification('Failed to complete task. Please try again.', 'error');
        }
    }

    clearTaskForm(prefix) {
        document.getElementById(`${prefix}Title`).value = '';
        document.getElementById(`${prefix}Due`).value = '';
        document.getElementById(`${prefix}Priority`).value = 'medium';
        document.getElementById(`${prefix}Notes`).value = '';
    }

    renderAllTasks() {
        // Clear all task boards
        ['todo', 'inProgress', 'completed'].forEach(status => {
            const board = document.getElementById(`${status}Tasks`);
            if (board) {
                board.innerHTML = '';
            }
        });

        // Render each task in its appropriate board
        this.tasks.forEach(task => {
            this.renderTask(task);
        });
    }

    renderTask(task) {
        const board = document.getElementById(`${task.status}Tasks`);
        if (!board) return;

        const taskElement = document.createElement('div');
        taskElement.className = 'task-item p-3 border-bottom';
        taskElement.dataset.taskId = task.id;

        const date = new Date(task.dueDate).toLocaleDateString();

        taskElement.innerHTML = `
            <div class="d-flex justify-content-between align-items-start">
                <div>
                    <h6 class="task-title mb-1">${task.title}</h6>
                    <div class="task-details">
                        <span class="text-muted me-3">
                            <i class="bi bi-calendar me-1"></i>
                            ${date}
                        </span>
                        <span class="badge bg-${this.getPriorityBadgeClass(task.priority)}">${task.priority}</span>
                    </div>
                </div>
                <div class="task-actions">
                    ${this.getTaskActionButtons(task)}
                </div>
            </div>
            ${task.notes ? `<div class="task-notes mt-2 small text-muted">${task.notes}</div>` : ''}
        `;

        // Add the task to the beginning of the list
        if (board.firstChild) {
            board.insertBefore(taskElement, board.firstChild);
        } else {
            board.appendChild(taskElement);
        }
    }

    getPriorityBadgeClass(priority) {
        switch (priority.toLowerCase()) {
            case 'high': return 'danger';
            case 'medium': return 'warning';
            case 'low': return 'info';
            default: return 'secondary';
        }
    }

    getTaskActionButtons(task) {
        switch (task.status) {
            case 'todo':
                return `
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="window.assignmentManager.startTask('${task.id}')">
                        <i class="bi bi-play-fill"></i>
                    </button>`;
            case 'inProgress':
                return `
                    <button class="btn btn-sm btn-outline-success me-1" onclick="window.assignmentManager.completeTask('${task.id}')">
                        <i class="bi bi-check-lg"></i>
                    </button>`;
            case 'completed':
                return ''; // No actions for completed tasks
        }
    }

    updateTaskCounts() {
        // Count tasks in each status
        const counts = {
            todo: 0,
            inProgress: 0,
            completed: 0
        };

        this.tasks.forEach(task => {
            counts[task.status]++;
        });

        // Update the counters in each board
        Object.keys(counts).forEach(status => {
            const counter = document.querySelector(`#${status}Card .task-count`);
            if (counter) {
                counter.textContent = counts[status];
            }
        });

        // Update overview counter
        const overviewCounter = document.getElementById('overview-todo-count');
        if (overviewCounter) {
            overviewCounter.textContent = counts.todo;
        }
    }

    showNotification(message, type = 'info') {
        // Create toast notification
        const toastContainer = document.createElement('div');
        toastContainer.className = 'position-fixed bottom-0 end-0 p-3';
        toastContainer.style.zIndex = '1050';

        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-white bg-${type} border-0`;
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>`;

        toastContainer.appendChild(toast);
        document.body.appendChild(toastContainer);

        const bsToast = new bootstrap.Toast(toast, { autohide: true, delay: 3000 });
        bsToast.show();

        toast.addEventListener('hidden.bs.toast', () => {
            document.body.removeChild(toastContainer);
        });
    }

    setupEventListeners() {
        // Quick add form
        const quickAddForm = document.getElementById('quickAddTaskForm');
        if (quickAddForm) {
            quickAddForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addTask('quick');
            });
        }

        // Mobile add form
        const saveMobileBtn = document.getElementById('saveMobileTaskBtn');
        if (saveMobileBtn) {
            saveMobileBtn.addEventListener('click', () => {
                this.addTask('mobile');
            });
        }
    }

    deleteTask(taskId) {
        if (this.tasks.has(taskId)) {
            this.tasks.delete(taskId);
            this.saveTasks();
            this.renderAllTasks();
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.assignmentManager = new AssignmentManager();
});
