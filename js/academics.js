// Initialize Academic Dashboard
document.addEventListener('DOMContentLoaded', function() {
    // Chart instances object to store and manage charts
    let charts = {};

    // Initialize task manager
    window.taskManager = {
        createTaskElement: function(title, dueDate, priority, notes, buttonType) {
            const task = document.createElement('div');
            task.className = 'task-item';
            
            task.dataset.title = title;
            task.dataset.dueDate = dueDate;
            task.dataset.priority = priority;
            
            const formattedDate = new Date(dueDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
            });
            
            task.innerHTML = `
                <div class="task-title">${title}</div>
                <div class="task-meta">
                    <span class="task-due">Due ${formattedDate}</span>
                    <span class="task-priority ${priority}">${priority}</span>
                </div>
                ${notes ? `<div class="task-notes mt-2 p-2 bg-light rounded small" style="display: none;">${notes}</div>` : ''}
                <div class="task-actions mt-2">
                    ${getButtonHtml(buttonType)}
                    ${notes ? '<button class="btn btn-sm btn-outline-secondary toggle-notes-btn ms-2"><i class="bi bi-journal-text"></i> Details</button>' : ''}
                    <button class="btn btn-sm btn-outline-danger delete-task-btn ms-2"><i class="bi bi-trash"></i></button>
                </div>`;
            
            // Add event listeners
            task.querySelector('.task-action-btn')?.addEventListener('click', () => moveTask(task, buttonType));
            task.querySelector('.delete-task-btn')?.addEventListener('click', () => deleteTask(task));
            
            const notesBtn = task.querySelector('.toggle-notes-btn');
            const notesDiv = task.querySelector('.task-notes');
            if (notesBtn && notesDiv) {
                notesBtn.addEventListener('click', () => {
                    const isVisible = notesDiv.style.display !== 'none';
                    notesDiv.style.display = isVisible ? 'none' : 'block';
                    notesBtn.innerHTML = isVisible ? 
                        '<i class="bi bi-journal-text"></i> Details' : 
                        '<i class="bi bi-journal-minus"></i> Hide Details';
                });
            }
            
            return task;
        }
    };

    // Functions for overview to-do assignments
    function initOverviewTodoAssignments() {
        // Initial population of the overview to-do list
        updateOverviewTodoList();
        
        // Add event listener for task clicks in the overview
        const overviewTodoList = document.getElementById('overview-todo-list');
        if (overviewTodoList) {
            overviewTodoList.addEventListener('click', function(e) {
                // Handle task action button clicks
                if (e.target.matches('.overview-task-action-btn')) {
                    const taskId = e.target.closest('.overview-task-item').dataset.taskId;
                    const todoTaskElement = document.querySelector(`#todoTasks .task-item[data-task-id="${taskId}"]`);
                    
                    if (todoTaskElement) {
                        // Find and click the corresponding action button in the original task
                        const actionBtn = todoTaskElement.querySelector('.task-action-btn[data-action="start"]');
                        if (actionBtn) {
                            actionBtn.click();
                        }
                    }
                }
            });
        }
    }

    function updateOverviewTodoList() {
        const overviewTodoList = document.getElementById('overview-todo-list');
        const todoTasks = document.getElementById('todoTasks');
        
        if (!overviewTodoList || !todoTasks) return;
        
        const tasks = todoTasks.querySelectorAll('.task-item');
        const overviewTodoCount = document.getElementById('overview-todo-count');
        
        // Update count
        if (overviewTodoCount) {
            overviewTodoCount.textContent = tasks.length;
        }
        
        // Clear current content
        overviewTodoList.innerHTML = '';
        
        // Check if there are tasks
        if (tasks.length === 0) {
            overviewTodoList.innerHTML = `
                <div class="empty-state p-4 text-center">
                    <i class="bi bi-clipboard text-muted fs-1 mb-2"></i>
                    <p class="text-muted mb-0">No pending assignments</p>
                </div>
            `;
            return;
        }
        
        // Add tasks to the overview list
        tasks.forEach(task => {
            const taskId = task.dataset.taskId;
            const title = task.querySelector('.task-title')?.textContent;
            const dueDate = task.querySelector('.task-due')?.textContent;
            const priority = task.querySelector('.task-priority')?.textContent;
            const priorityClass = task.querySelector('.task-priority')?.className.split(' ')[1] || '';
            
            if (title && dueDate) {
                const priorityColors = {
                    high: 'danger',
                    medium: 'warning',
                    low: 'success'
                };
                
                const priorityColor = priorityColors[priority.toLowerCase()] || 'secondary';
                
                const taskHtml = `
                    <div class="overview-task-item p-3 border-bottom position-relative" data-task-id="${taskId}" style="transition: all 0.3s ease;">
                        <div class="d-flex align-items-center">
                            <div class="task-icon me-3 p-2 rounded-circle text-white d-flex align-items-center justify-content-center" 
                                 style="width: 40px; height: 40px; background: linear-gradient(45deg, var(--bs-${priorityColor}), var(--bs-${priorityColor}-rgb));">
                                <i class="bi bi-clipboard-check"></i>
                            </div>
                            <div class="task-info flex-grow-1">
                                <h6 class="mb-1 fw-bold">${title}</h6>
                                <div class="d-flex align-items-center text-muted" style="font-size: 0.85rem;">
                                    <i class="bi bi-calendar3 me-2"></i>
                                    <span>${dueDate}</span>
                                    <span class="badge bg-${priorityColor} ms-2 text-white">${priority}</span>
                                </div>
                            </div>
                            <button class="btn btn-sm btn-primary overview-task-action-btn rounded-pill" 
                                    style="background: linear-gradient(45deg, #4776E6, #8E54E9); border: none;">
                                <i class="bi bi-play-fill me-1"></i>Start
                            </button>
                        </div>
                    </div>
                `;
                
                overviewTodoList.insertAdjacentHTML('beforeend', taskHtml);
            }
        });
    }
    
    // Initialize AOS animations
    AOS.init({
        duration: 800,
        once: true,
        offset: 100
    });
    
    // Initialize grade form
    initGradeForm();
    
    // Initialize overview to-do assignments
    initOverviewTodoAssignments();
    
    // Mobile menu toggle
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const mobileSidebar = document.getElementById('mobileSidebar');
    const closeSidebarBtn = document.getElementById('closeSidebar');

    // Add event listeners only if elements exist
    if (mobileMenuToggle && mobileSidebar) {
        mobileMenuToggle.addEventListener('click', () => {
            mobileSidebar.classList.toggle('active');
            mobileMenuToggle.setAttribute('aria-expanded', 
                mobileSidebar.classList.contains('active') ? 'true' : 'false');
        });
    }

    if (closeSidebarBtn && mobileSidebar) {
        closeSidebarBtn.addEventListener('click', () => {
            mobileSidebar.classList.remove('active');
            if (mobileMenuToggle) {
                mobileMenuToggle.setAttribute('aria-expanded', 'false');
            }
        });
    }

    // Task Management
    const quickAddTaskForm = document.getElementById('quickAddTaskForm');
    if (quickAddTaskForm) {
        quickAddTaskForm.addEventListener('submit', handleTaskSubmit);
    }

    // Mobile form handler
    const saveMobileTaskBtn = document.getElementById('saveMobileTaskBtn');
    if (saveMobileTaskBtn) {
        saveMobileTaskBtn.addEventListener('click', function() {
            const title = document.getElementById('mobileTaskTitle').value;
            const dueDate = document.getElementById('mobileTaskDue').value;
            const priority = document.getElementById('mobileTaskPriority').value;
            const notes = document.getElementById('mobileTaskNotes').value;
            
            if (title && dueDate) {
                addNewTask(title, dueDate, priority, notes);
                // Close modal and reset form
                const modal = bootstrap.Modal.getInstance(document.getElementById('addTaskModal'));
                modal.hide();
                document.getElementById('mobileAddTaskForm').reset();
            }
        });
    }

    function handleTaskSubmit(e) {
        e.preventDefault();
        
        const isDesktop = e.target.id === 'quickAddTaskForm';
        const prefix = isDesktop ? 'quick' : 'mobile';
        
        const title = document.getElementById(`${prefix}TaskTitle`).value;
        const dueDate = document.getElementById(`${prefix}TaskDue`).value;
        const priority = document.getElementById(`${prefix}TaskPriority`).value;
        const notes = document.getElementById(`${prefix}TaskNotes`).value;
        
        addNewTask(title, dueDate, priority, notes);
        e.target.reset();
    }
    
    function addNewTask(title, dueDate, priority, notes) {
        const todoList = document.getElementById('todoTasks');
        const taskItem = window.taskManager.createTaskElement(title, dueDate, priority, notes, 'start');
        todoList.appendChild(taskItem);
        updateTaskCount('todo');
        
        // Add task to calendar events
        addTaskToCalendar({
            title: title,
            date: new Date(dueDate),
            type: 'task',
            priority: priority,
            notes: notes
        });
        
        // Update the overview to-do list
        updateOverviewTodoList();
    }

    function addTaskToCalendar(taskEvent) {
        if (window.calendarManager) {
            try {
                // Get existing events or initialize new array
                window.calendarManager.events = window.calendarManager.events || [];
                
                // Add new task event with special styling
                window.calendarManager.events.push({
                    ...taskEvent,
                    className: `task-event task-${taskEvent.priority}`,
                    eventType: 'task'
                });
                
                // Render the calendar
                window.calendarManager.render();
                
                // Add click handler for calendar days
                const calendarDays = document.querySelectorAll('.calendar-day');
                calendarDays.forEach(day => {
                    day.addEventListener('click', () => {
                        const dayNumber = day.querySelector('.day-number').textContent;
                        const currentDate = new Date(window.calendarManager.currentDate);
                        currentDate.setDate(parseInt(dayNumber));
                        showDayEventsModal(currentDate);
                    });
                });
            } catch (error) {
                console.error('Error adding task to calendar:', error);
            }
        }
    }

    function showDayEventsModal(date) {
        const modal = document.getElementById('dayEventsModal');
        const modalTitle = modal.querySelector('.modal-title');
        const modalBody = modal.querySelector('.modal-body');
        
        // Format the date for display
        const dateString = date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        modalTitle.textContent = dateString;
        
        // Get all events and tasks for this day
        const dayEvents = window.calendarManager.events.filter(event => 
            event.date.getDate() === date.getDate() &&
            event.date.getMonth() === date.getMonth() &&
            event.date.getFullYear() === date.getFullYear()
        );
        
        if (dayEvents.length === 0) {
            modalBody.innerHTML = '<p class="text-center text-muted my-3">No events or tasks scheduled for this day</p>';
        } else {
            // Separate tasks and events
            const tasks = dayEvents.filter(e => e.eventType === 'task');
            const events = dayEvents.filter(e => e.eventType !== 'task');
            
            let content = '';
            
            // Add tasks section if there are tasks
            if (tasks.length > 0) {
                content += `
                    <div class="tasks-section mb-4">
                        <h6 class="mb-3">Tasks</h6>
                        ${tasks.map(task => `
                            <div class="task-item ${task.className} mb-2 p-2 rounded">
                                <h6 class="mb-1">${task.title}</h6>
                                <div class="small">Priority: ${task.priority}</div>
                                ${task.notes ? `<div class="small text-muted mt-1">${task.notes}</div>` : ''}
                            </div>
                        `).join('')}
                    </div>
                `;
            }
            
            // Add events section if there are events
            if (events.length > 0) {
                content += `
                    <div class="events-section">
                        <h6 class="mb-3">Events</h6>
                        ${events.map(event => `
                            <div class="event-item mb-2 p-2 rounded bg-light">
                                <h6 class="mb-1">${event.title}</h6>
                                ${event.notes ? `<div class="small text-muted">${event.notes}</div>` : ''}
                            </div>
                        `).join('')}
                    </div>
                `;
            }
            
            modalBody.innerHTML = content;
        }
        
        // Show the modal
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
    }
    
    function getButtonHtml(type) {
        switch(type) {
            case 'start':
                return '<button class="btn btn-sm btn-primary task-action-btn start-btn"><i class="bi bi-play-fill"></i> Start</button>';
            case 'complete':
                return '<button class="btn btn-sm btn-success task-action-btn complete-btn"><i class="bi bi-check-lg"></i> Complete</button>';
            default:
                return '';
        }
    }
    
    // Make moveTask available globally
    window.moveTask = function(taskElement, currentStatus) {
        let targetList, newButtonType;
        
        if (currentStatus === 'start') {
            targetList = document.getElementById('inProgressTasks');
            newButtonType = 'complete';
            
            // Show a notification when task is started
            if (window.notificationSystem) {
                window.notificationSystem.showToast({
                    title: 'Task Started',
                    message: `You've started working on: ${taskElement.dataset.title}`,
                    type: 'info',
                    duration: 5000
                });
            }
        } else if (currentStatus === 'complete') {
            targetList = document.getElementById('completedTasks');
            newButtonType = '';
            
            // Show a notification when task is completed
            if (window.notificationSystem) {
                window.notificationSystem.showToast({
                    title: 'Task Completed',
                    message: `Congratulations! You've completed: ${taskElement.dataset.title}`,
                    type: 'success',
                    duration: 5000
                });
            }
        }
        
        if (targetList) {
            // Get the old list for updating counts
            const oldList = taskElement.parentElement;
            
            // Create a new task element with updated button
            const newTask = window.taskManager.createTaskElement(
                taskElement.dataset.title,
                taskElement.dataset.dueDate,
                taskElement.dataset.priority,
                taskElement.querySelector('.task-notes')?.textContent,
                newButtonType
            );
            
            // Move task to new list
            targetList.appendChild(newTask);
            oldList.removeChild(taskElement);
            
            // Update counts
            updateTaskCount('todo');
            updateTaskCount('inProgress');
            updateTaskCount('completed');
            
            // Update the overview to-do list
            updateOverviewTodoList();
            
            // Update calendar event status
            const taskTitle = taskElement.querySelector('.task-title').textContent;
            const taskDate = new Date(taskElement.querySelector('.task-due').textContent.replace('Due ', ''));
            updateCalendarTaskStatus(taskTitle, taskDate, newButtonType);
        }
    };
    
    // Alias for backward compatibility
    function moveTask(taskElement, currentStatus) {
        window.moveTask(taskElement, currentStatus);
    }

    function updateOverviewTodoList() {
        const todoList = document.getElementById('todoTasks');
        const overviewTodoList = document.getElementById('overviewTodoList');
        
        if (todoList && overviewTodoList) {
            const todoItems = Array.from(todoList.children);
            const todoListHtml = todoItems.map(item => item.outerHTML).join('');
            overviewTodoList.innerHTML = todoListHtml;
        }
    }

    function deleteTask(taskElement) {
        // Get task information for notifications and calendar updates
        const taskTitle = taskElement.dataset.title;
        const taskDueDate = new Date(taskElement.dataset.dueDate);
        
        // Confirm deletion with the user
        if (confirm(`Are you sure you want to delete the task "${taskTitle}"?`)) {
            // Remove the task from the DOM
            const parentList = taskElement.parentElement;
            parentList.removeChild(taskElement);
            
            // Update task counts
            updateTaskCount('todo');
            updateTaskCount('inProgress');
            updateTaskCount('completed');
            
            // Remove the task from the calendar
            removeTaskFromCalendar(taskTitle, taskDueDate);
            
            // Update the overview to-do list
            updateOverviewTodoList();
            
            // Show a notification
            if (window.notificationSystem) {
                window.notificationSystem.showToast({
                    title: 'Task Deleted',
                    message: `Task "${taskTitle}" has been deleted`,
                    type: 'warning',
                    duration: 5000
                });
            }
        }
    }

    function removeTaskFromCalendar(title, date) {
        if (window.calendarManager && window.calendarManager.events) {
            const events = window.calendarManager.events;
            
            // Find the matching task event
            const taskIndex = events.findIndex(event => 
                event.eventType === 'task' && 
                event.title === title && 
                event.date.getMonth() === date.getMonth() && 
                event.date.getDate() === date.getDate()
            );
            
            if (taskIndex !== -1) {
                // Remove the task from events array
                events.splice(taskIndex, 1);
                
                // Re-render the calendar
                window.calendarManager.render();
            }
        }
    }
    
    function updateTaskCount(status) {
        const lists = {
            'todo': 'todoTasks',
            'inProgress': 'inProgressTasks',
            'completed': 'completedTasks'
        };
        
        const list = document.getElementById(lists[status]);
        if (list) {
            const countElement = list.closest('.card')?.querySelector('.task-count');
            if (countElement) {
                const taskCount = list.children.length;
                countElement.textContent = taskCount;
            }
        }
    }
});

// Navigation between sections
function initNavigation() {
    const navLinks = document.querySelectorAll('.nav-link, .nav-tab');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetSection = this.getAttribute('data-section');
            switchSection(targetSection);
            
            // Update active states
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

function switchSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.section-content').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        // Save last active section
        localStorage.setItem('lastActiveSection', sectionId);
        
        // Initialize section-specific functionality
        switch(sectionId) {
            case 'overview':
                initializeOverview();
                break;
            case 'grades':
                initializeGrades();
                break;
            case 'calendar':
                initializeCalendar();
                break;
            case 'assignments':
                initializeAssignments();
                break;
        }
    }
}

function initializeOverview() {
    if (window.chartManager) {
        window.chartManager.init();
    }
}

function initializeGrades() {
    // Load saved grades
    loadGrades();
}

function loadGrades() {
    // Get grades from localStorage
    const grades = JSON.parse(localStorage.getItem('academicGrades')) || [];
    
    // Update UI with loaded grades
    if (grades.length > 0) {
        updateGradeHistory(grades);
        updateStats(grades);
    }
}

function initializeCalendar() {
    if (typeof CalendarManager !== 'undefined' && window.calendarManager) {
        window.calendarManager.render();
    } else {
        console.error('CalendarManager not found. Please check if calendarManager.js is properly loaded.');
    }
}

function initializeAssignments() {
    // Load assignments
    loadAssignments();
}

function loadAssignments() {
    const assignments = JSON.parse(localStorage.getItem('academicAssignments')) || [];
    
    ['todo', 'inProgress', 'completed'].forEach(status => {
        const columnElement = document.querySelector(`.assignment-column[data-status="${status}"]`);
        const listElement = document.getElementById(`${status}List`);
        const countElement = document.querySelector(`[data-task-count="${status}"]`);
        const filteredAssignments = assignments.filter(a => a.status === status);
        
        if (listElement) {
            if (filteredAssignments.length === 0) {
                listElement.innerHTML = `
                    <div class="text-center p-4 empty-state">
                        <i class="bi bi-clipboard text-muted fs-1 mb-2"></i>
                        <p class="text-muted mb-0">No ${status.replace(/([A-Z])/g, ' $1').toLowerCase()} assignments</p>
                    </div>
                `;
            } else {
                listElement.innerHTML = filteredAssignments
                    .map(assignment => createAssignmentElement(assignment, status))
                    .join('');
            }
        }
        
        if (countElement) {
            countElement.textContent = filteredAssignments.length;
        }
    });
}

function createAssignmentElement(assignment, status) {
    const priorityClasses = {
        high: 'bg-danger',
        medium: 'bg-warning',
        low: 'bg-success'
    };

    const statusIcons = {
        todo: 'bi-circle',
        inProgress: 'bi-play-circle',
        completed: 'bi-check-circle-fill'
    };

    const statusColors = {
        todo: 'text-danger',
        inProgress: 'text-primary',
        completed: 'text-success'
    };

    const dueDateObj = new Date(assignment.dueDate);
    const isOverdue = dueDateObj < new Date() && status !== 'completed';

    return `
        <div class="assignment-card" data-id="${assignment.id}" data-status="${status}">
            <div class="card-wrapper">
                <div class="assignment-priority ${priorityClasses[assignment.priority]}"></div>
                <h6 class="assignment-title">
                    <i class="bi ${statusIcons[status]} ${statusColors[status]} me-2"></i>
                    ${assignment.title}
                </h6>
                <div class="assignment-meta">
                    <span class="meta-item">
                        <i class="bi bi-calendar-event"></i>
                        <span class="${isOverdue ? 'text-danger' : ''}">${formatDate(assignment.dueDate)}</span>
                    </span>
                    ${assignment.subject ? `
                        <span class="meta-item">
                            <i class="bi bi-book"></i>
                            <span>${assignment.subject}</span>
                        </span>
                    ` : ''}
                </div>
                ${assignment.description ? `
                    <p class="assignment-description text-muted small mb-3">${assignment.description}</p>
                ` : ''}
                <div class="assignment-actions">
                    <button class="btn btn-sm btn-light" onclick="moveAssignment('${assignment.id}', '${status}')" title="Change Status">
                        <i class="bi bi-arrow-left-right"></i>
                    </button>
                    <button class="btn btn-sm btn-light" onclick="editAssignment('${assignment.id}')" title="Edit">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteAssignment('${assignment.id}')" title="Delete">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
}

function moveAssignment(id, currentStatus) {
    const statusOrder = ['todo', 'inProgress', 'completed'];
    const currentIndex = statusOrder.indexOf(currentStatus);
    const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length];
    
    let assignments = JSON.parse(localStorage.getItem('academicAssignments')) || [];
    const assignmentIndex = assignments.findIndex(a => a.id === id);
    
    if (assignmentIndex !== -1) {
        assignments[assignmentIndex].status = nextStatus;
        localStorage.setItem('academicAssignments', JSON.stringify(assignments));
        loadAssignments();
    }
}

function getPriorityClass(priority) {
    switch (priority) {
        case 'high': return 'bg-danger';
        case 'medium': return 'bg-warning';
        case 'low': return 'bg-success';
        default: return 'bg-secondary';
    }
}

// Initialize Grade Form
function initGradeForm() {
    // Main form in grades section
    const addGradeForm = document.getElementById('addGradeForm');
    if (addGradeForm) {
        addGradeForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveGrade(
                document.getElementById('yearOfStudy').value,
                document.getElementById('semester').value,
                document.getElementById('gpaInput').value,
                document.getElementById('gradeDate').value,
                document.getElementById('gradeNotes').value
            );
            this.reset();
        });
    }
    
    // Modal form
    const saveGradeBtn = document.getElementById('saveGradeBtn');
    if (saveGradeBtn) {
        saveGradeBtn.addEventListener('click', function() {
            const yearOfStudy = document.getElementById('modalYearOfStudy').value;
            const semester = document.getElementById('modalSemester').value;
            const gpa = document.getElementById('modalGpaInput').value;
            const date = document.getElementById('modalGradeDate').value;
            const notes = document.getElementById('modalGradeNotes').value;
            
            if (!yearOfStudy || !semester || !gpa || !date) {
                alert('Please fill in all required fields');
                return;
            }
            
            saveGrade(yearOfStudy, semester, gpa, date, notes);
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('addGradeModal'));
            modal.hide();
            
            // Reset form
            document.getElementById('addGradeModalForm').reset();
        });
    }
    
    // Set today's date as default for date inputs
    const dateInputs = document.querySelectorAll('input[type="date"]');
    const today = new Date().toISOString().split('T')[0];
    dateInputs.forEach(input => {
        input.value = today;
    });
}

// Save Grade Function
function saveGrade(year, semester, gpa, date, notes) {
    // Validate inputs
    if (!year || !semester || !gpa || !date) {
        alert('Please fill in all required fields');
        return false;
    }
    
    // Format semester text
    const semesterText = semester === '1' ? 'Semester 1' : 
                        semester === '2' ? 'Semester 2' : 'Summer';
    
    // Create grade object
    const grade = {
        id: Date.now(),
        year: year,
        yearText: `Year ${year}`,
        semester: semester,
        semesterText: semesterText,
        gpa: parseFloat(gpa),
        date: date,
        notes: notes || ''
    };
    
    // Get existing grades from localStorage or initialize empty array
    let grades = JSON.parse(localStorage.getItem('academicGrades')) || [];
    
    // Add new grade
    grades.push(grade);
    
    // Sort by date (newest first)
    grades.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Save to localStorage
    localStorage.setItem('academicGrades', JSON.stringify(grades));
    
    // Update UI
    updateGradeHistory(grades);
    updateStats(grades);
    
    return true;
}

// Update Grade History Table
function updateGradeHistory(grades) {
    const tableBody = document.getElementById('gradeHistoryTable');
    if (!tableBody) return;
    
    // Clear table
    tableBody.innerHTML = '';
    
    if (grades.length === 0) {
        tableBody.innerHTML = `
            <tr class="grades-empty-state">
                <td colspan="5" class="text-center py-5">
                    <i class="bi bi-journal-x d-block mb-3 fs-1 text-muted"></i>
                    <h6>No Grades Added Yet</h6>
                    <p class="text-muted">Add your first grade to start tracking your academic progress</p>
                </td>
            </tr>
        `;
        return;
    }
    
    // Add grades to table
    grades.forEach(grade => {
        const row = document.createElement('tr');
        row.dataset.id = grade.id; // Add data-id attribute
        row.innerHTML = `
            <td>${grade.yearText}</td>
            <td>${grade.semesterText}</td>
            <td>${grade.gpa.toFixed(1)}</td>
            <td>${formatDate(grade.date)}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-1" onclick="viewGradeDetails('${grade.id}')">
                    <i class="bi bi-eye"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteGrade('${grade.id}')">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

function deleteGrade(id) {
    if (!confirm('Are you sure you want to delete this grade?')) return;
    
    // Get grades from localStorage
    let grades = JSON.parse(localStorage.getItem('academicGrades')) || [];
    
    // Remove grade with matching id
    grades = grades.filter(grade => grade.id !== parseInt(id));
    
    // Save updated grades
    localStorage.setItem('academicGrades', JSON.stringify(grades));
    
    // Update UI
    updateGradeHistory(grades);
    updateStats(grades);
}

function viewGradeDetails(id) {
    // Get grades from localStorage
    const grades = JSON.parse(localStorage.getItem('academicGrades')) || [];
    
    // Find grade with matching id
    const grade = grades.find(g => g.id === parseInt(id));
    if (!grade) return;
    
    // Update modal with grade details
    document.getElementById('gradeDetailGpa').textContent = grade.gpa.toFixed(1);
    document.getElementById('gradeDetailYear').textContent = grade.yearText;
    document.getElementById('gradeDetailSemester').textContent = grade.semesterText;
    document.getElementById('gradeDetailDate').textContent = formatDate(grade.date);
    document.getElementById('gradeDetailNotes').textContent = grade.notes || 'No notes available';
    
    // Show modal
    const gradeDetailsModal = new bootstrap.Modal(document.getElementById('gradeDetailsModal'));
    gradeDetailsModal.show();
}

// Update Stats
function updateStats(grades) {
    const gpaElement = document.querySelector('[data-stat="gpa"]');
    const semesterElement = document.querySelector('[data-stat="semesterCount"]');
    const highestElement = document.getElementById('highestGpa');
    const lowestElement = document.getElementById('lowestGpa');
    const averageElement = document.getElementById('averageGpa');
    const trendElement = document.getElementById('gpaTrend');

    if (!grades || grades.length === 0) {
        // Reset stats if no grades
        if (gpaElement) gpaElement.textContent = '0.0';
        if (semesterElement) semesterElement.textContent = '0';
        if (highestElement) highestElement.textContent = '0.0';
        if (lowestElement) lowestElement.textContent = '0.0';
        if (averageElement) averageElement.textContent = '0.0';
        if (trendElement) trendElement.innerHTML = '<i class="bi bi-dash"></i>';
        
        // Update charts with empty data through ChartManager
        if (window.chartManager) {
            window.chartManager.updateCharts([]);
        }
        return;
    }
    
    // Calculate current GPA (most recent)
    const currentGpa = grades[0].gpa;
    
    // Count unique semesters
    const uniqueSemesters = new Set();
    grades.forEach(grade => {
        uniqueSemesters.add(`${grade.year}-${grade.semester}`);
    });
    const semesterCount = uniqueSemesters.size;
    
    // Update stats in UI
    document.querySelector('[data-stat="gpa"]').textContent = currentGpa.toFixed(1);
    document.querySelector('[data-stat="semesterCount"]').textContent = semesterCount;
    
    // Update GPA chart using ChartManager
    if (window.chartManager) {
        window.chartManager.initGpaChart();
    }
    
    // Update charts through ChartManager
    if (window.chartManager && typeof window.chartManager.updateCharts === 'function') {
        try {
            window.chartManager.updateCharts(grades);
        } catch (error) {
            console.error('Error updating charts:', error);
        }
    }

    // Calculate analytics
    updateGradeAnalytics(grades);
}

// Update Grade Analytics
function updateGradeAnalytics(grades) {
    // Calculate highest GPA
    const highestGpa = Math.max(...grades.map(grade => grade.gpa));
    const lowestGpa = Math.min(...grades.map(grade => grade.gpa));
    const totalGpa = grades.reduce((sum, grade) => sum + grade.gpa, 0);
    const averageGpa = totalGpa / grades.length;
    
    // Calculate GPA trend comparing the two most recent grades
    let trendIcon = '<i class="bi bi-dash-circle-fill text-muted"></i>'; // Default neutral icon
    
    if (grades.length >= 2) {
        const latestGpa = parseFloat(grades[0].gpa);  // Most recent grade
        const previousGpa = parseFloat(grades[1].gpa); // Second most recent grade
        
        // Compare with precision to avoid floating point issues
        const diff = (latestGpa - previousGpa).toFixed(2);
        
        if (diff > 0) {
            // GPA has improved
            trendIcon = '<i class="bi bi-arrow-up-circle-fill text-success fs-4"></i>';
        } else if (diff < 0) {
            // GPA has decreased
            trendIcon = '<i class="bi bi-arrow-down-circle-fill text-danger fs-4"></i>';
        } else {
            // GPA unchanged
            trendIcon = '<i class="bi bi-dash-circle-fill text-muted fs-4"></i>';
        }
    }
    
    // Update UI elements
    document.getElementById('highestGpa').textContent = highestGpa.toFixed(1);
    document.getElementById('lowestGpa').textContent = lowestGpa.toFixed(1);
    document.getElementById('averageGpa').textContent = averageGpa.toFixed(1);
    document.getElementById('gpaTrend').innerHTML = trendIcon;
}

// Format date as DD/MM/YYYY
function formatDate(dateString) {
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
}

// Load saved grades on page load
document.addEventListener('DOMContentLoaded', function() {
    const grades = JSON.parse(localStorage.getItem('academicGrades')) || [];
    if (grades.length > 0) {
        updateGradeHistory(grades);
        updateStats(grades);
    }
});

// Navigation and Section Visibility
document.addEventListener('DOMContentLoaded', function() {
    const navLinks = document.querySelectorAll('.nav-link');
    const sectionContents = document.querySelectorAll('.section-content');
    const addGradeBtn = document.getElementById('addGradeBtn');
    
    // Function to show section based on nav link
    function showSection(sectionId) {
        if (!sectionId) return;
        
        // Hide all sections
        sectionContents.forEach(section => {
            if (section) {
                section.classList.remove('active');
            }
        });
        
        // Show selected section
        const selectedSection = document.getElementById(sectionId);
        if (selectedSection) {
            selectedSection.classList.add('active');
            
            // Show/hide Add Grade button based on section
            if (addGradeBtn) {
                if (sectionId === 'grades') {
                    addGradeBtn.classList.remove('d-none');
                } else {
                    addGradeBtn.classList.add('d-none');
                }
            }
        } else {
            console.warn(`Section with id "${sectionId}" not found`);
        }
    }

    // Add click event to nav links
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all links
            navLinks.forEach(navLink => {
                navLink.classList.remove('active');
            });
            
            // Add active class to clicked link
            this.classList.add('active');
            
            // Get section id from data attribute
            const sectionId = this.getAttribute('data-section');
            if (sectionId) {
                showSection(sectionId);
                
                // Close mobile menu if open
                const sidebar = document.querySelector('.sidebar');
                if (sidebar && sidebar.classList.contains('active')) {
                    sidebar.classList.remove('active');
                }
            }
        });
    });

    // Check URL hash on page load
    if (window.location.hash) {
        const hash = window.location.hash.substring(1);
        const link = document.querySelector(`.nav-link[data-section="${hash}"]`);
        if (link) {
            link.click();
        }
    } else {
        // Show default section if no hash
        const defaultLink = document.querySelector('.nav-link[data-section="overview"]');
        if (defaultLink) {
            defaultLink.click();
        }
    }
});

// Initialize Modals
function initModals() {
    // Add Course Modal
    const saveCourseBtn = document.getElementById('saveCourseBtn');
    if (saveCourseBtn) {
        saveCourseBtn.addEventListener('click', function() {
            // Validate form
            const courseName = document.getElementById('courseName').value;
            const courseCode = document.getElementById('courseCode').value;
            
            if (!courseName || !courseCode) {
                alert('Please fill in all required fields');
                return;
            }
            
            // For demonstration, just close the modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('addCourseModal'));
            modal.hide();
            
            // Show success message
            alert('Course added successfully!');
            
            // Reset form
            document.getElementById('addCourseForm').reset();
        });
    }
    
    // Add Assignment Modal
    const saveAssignmentBtn = document.getElementById('saveAssignmentBtn');
    if (saveAssignmentBtn) {
        saveAssignmentBtn.addEventListener('click', function() {
            // Validate form
            const assignmentTitle = document.getElementById('assignmentTitle').value;
            const dueDate = document.getElementById('dueDate').value;
            
            if (!assignmentTitle || !dueDate) {
                alert('Please fill in all required fields');
                return;
            }
            
            // For demonstration, just close the modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('addAssignmentModal'));
            modal.hide();
            
            // Show success message
            alert('Assignment added successfully!');
            
            // Reset form
            document.getElementById('addAssignmentForm').reset();
        });
    }
}

// Initialize Study Timer
document.addEventListener('DOMContentLoaded', function() {
    // Initialize timer variables
    let timerInterval;
    let timerRunning = false;
    let timerMinutes = 25;
    let timerSeconds = 0;
    let totalSeconds = timerMinutes * 60;
    
    // Get timer elements
    const minutesDisplay = document.getElementById('timerMinutes');
    const secondsDisplay = document.getElementById('timerSeconds');
    const startBtn = document.getElementById('startTimerBtn');
    const pauseBtn = document.getElementById('pauseTimerBtn');
    const resetBtn = document.getElementById('resetTimerBtn');
    const studyTimerBtn = document.getElementById('studyTimerBtn');
    
    // Study Timer Button click event
    if (studyTimerBtn) {
        studyTimerBtn.addEventListener('click', function() {
            const studyTimerModal = new bootstrap.Modal(document.getElementById('studyTimerModal'));
            studyTimerModal.show();
        });
    }
    
    // Add Grade Button click event
    const addGradeBtn = document.getElementById('addGradeBtn');
    if (addGradeBtn) {
        addGradeBtn.addEventListener('click', function() {
            const addGradeModal = new bootstrap.Modal(document.getElementById('addGradeModal'));
            addGradeModal.show();
        });
    }
    
    // Timer Start button click event
    if (startBtn) {
        startBtn.addEventListener('click', function() {
            if (!timerRunning) {
                startTimer();
                timerRunning = true;
                startBtn.disabled = true;
                pauseBtn.disabled = false;
            }
        });
    }
    
    // Timer Pause button click event
    if (pauseBtn) {
        pauseBtn.addEventListener('click', function() {
            if (timerRunning) {
                clearInterval(timerInterval);
                timerRunning = false;
                startBtn.disabled = false;
                pauseBtn.disabled = true;
            }
        });
    }
    
    // Timer Reset button click event
    if (resetBtn) {
        resetBtn.addEventListener('click', function() {
            resetTimer();
        });
    }
    
    // Start timer function
    function startTimer() {
        timerInterval = setInterval(function() {
            if (totalSeconds <= 0) {
                clearInterval(timerInterval);
                timerRunning = false;
                startBtn.disabled = false;
                pauseBtn.disabled = true;
                
                // Play notification sound
                playTimerEndSound();
                
                // Record study session
                recordStudySession();
                
                // Show notification
                alert('Study session completed! Take a 5-minute break.');
                
                // Reset timer
                resetTimer();
                return;
            }
            
            totalSeconds--;
            timerMinutes = Math.floor(totalSeconds / 60);
            timerSeconds = totalSeconds % 60;
            
            // Update display
            updateTimerDisplay();
        }, 1000);
    }
    
    // Reset timer function
    function resetTimer() {
        clearInterval(timerInterval);
        timerRunning = false;
        timerMinutes = 25;
        timerSeconds = 0;
        totalSeconds = timerMinutes * 60;
        
        // Update display
        updateTimerDisplay();
        
        // Reset buttons
        startBtn.disabled = false;
        pauseBtn.disabled = true;
    }
    
    // Update timer display
    function updateTimerDisplay() {
        minutesDisplay.textContent = timerMinutes.toString().padStart(2, '0');
        secondsDisplay.textContent = timerSeconds.toString().padStart(2, '0');
    }
    
    // Play timer end sound
    function playTimerEndSound() {
        // Create audio element
        const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-alarm-digital-clock-beep-989.mp3');
        audio.play();
    }
    
    

// Record study session
function recordStudySession() {
    const subject = document.getElementById('timerSubject').value;
        
        // Get study hours from localStorage
        let studyHours = parseFloat(localStorage.getItem('academicStudyHours')) || 0;
        
        // Add 25 minutes (0.42 hours) to total
        studyHours += 0.42;
        
        // Save to localStorage
        localStorage.setItem('academicStudyHours', studyHours.toString());
        
        // Update study hours display
        const studyHoursDisplay = document.querySelector('[data-stat="studyHours"]');
        if (studyHoursDisplay) {
            studyHoursDisplay.textContent = Math.round(studyHours);
        }
        
        // Update subject performance
        updateSubjectPerformance(subject);
    }
    
    // Update subject performance
    function updateSubjectPerformance(subject) {
        // Get subject performance from localStorage
        let subjectPerformance = JSON.parse(localStorage.getItem('academicSubjectPerformance')) || {
            mathematics: 0,
            science: 0,
            literature: 0,
            history: 0,
            other: 0
        };
        
        // Increment subject performance
        subjectPerformance[subject] += 1;
        
        // Save to localStorage
        localStorage.setItem('academicSubjectPerformance', JSON.stringify(subjectPerformance));
        
        // Update subject performance display
        updateSubjectPerformanceDisplay(subjectPerformance);
    }
    
    // Update subject performance display
    function updateSubjectPerformanceDisplay(performance) {
        // Calculate total
        const total = Object.values(performance).reduce((a, b) => a + b, 0);
        
        // Skip if total is 0
        if (total === 0) return;
        
        // Update each subject
        for (const subject in performance) {
            const percentage = Math.round((performance[subject] / total) * 100);
            const subjectItem = document.querySelector(`[data-subject="${subject}"]`);
            
            if (subjectItem) {
                const percentageDisplay = subjectItem.querySelector('.subject-percentage');
                const progressBar = subjectItem.querySelector('.progress-bar');
                
                if (percentageDisplay) percentageDisplay.textContent = `${percentage}%`;
                if (progressBar) progressBar.style.width = `${percentage}%`;
            }
        }
    }
    
    // Load study data on page load
    function loadStudyData() {
        // Load study hours
        const studyHours = parseFloat(localStorage.getItem('academicStudyHours')) || 0;
        const studyHoursDisplay = document.querySelector('[data-stat="studyHours"]');
        if (studyHoursDisplay) {
            studyHoursDisplay.textContent = Math.round(studyHours);
        }
        
        // Load subject performance
        const subjectPerformance = JSON.parse(localStorage.getItem('academicSubjectPerformance')) || {
            mathematics: 0,
            science: 0,
            literature: 0,
            history: 0,
            other: 0
        };
        
        updateSubjectPerformanceDisplay(subjectPerformance);
    }
    
    // Call load study data
    loadStudyData();
});

// Assignment Card Overlay Functionality
document.addEventListener('DOMContentLoaded', function() {
    // Get the assignment cards
    const todoCard = document.getElementById('todoCard');
    const progressCard = document.getElementById('progressCard');
    const completedCard = document.getElementById('completedCard');
    
    // Get the overlay elements
    const assignmentOverlay = document.getElementById('assignmentOverlay');
    const overlayTitle = document.getElementById('overlayTitle');
    const overlayTasks = document.getElementById('overlayTasks');
    const overlayEmptyState = document.getElementById('overlayEmptyState');
    const closeOverlay = document.getElementById('closeOverlay');
    
    // Function to show overlay with tasks
    function showOverlay(title, taskListId) {
        // Set the overlay title
        overlayTitle.textContent = title;
        
        // Get the tasks from the corresponding task list
        const taskList = document.getElementById(taskListId);
        const tasks = taskList.querySelectorAll('.task-item');
        
        // Clear the overlay tasks
        overlayTasks.innerHTML = '';
        
        // Check if there are tasks
        if (tasks.length === 0) {
            overlayEmptyState.classList.remove('d-none');
        } else {
            overlayEmptyState.classList.add('d-none');
            
            // Clone and add each task to the overlay
            tasks.forEach(task => {
                const taskClone = task.cloneNode(true);
                
                // Remove existing event listeners by replacing with a new copy
                const taskTitle = taskClone.querySelector('.task-title').textContent;
                const taskDueDate = taskClone.dataset.dueDate;
                const taskPriority = taskClone.dataset.priority;
                
                // Get notes if they exist
                const notesElement = taskClone.querySelector('.task-notes');
                const notes = notesElement ? notesElement.innerHTML : '';
                
                // Replace action buttons with appropriate ones for the overlay
                const actionsDiv = taskClone.querySelector('.task-actions');
                if (actionsDiv) {
                    // Determine which action button to show based on current status
                    let actionButton = '';
                    if (taskListId === 'todoTasks') {
                        actionButton = '<button class="btn btn-sm btn-primary overlay-action-btn"><i class="bi bi-play-fill"></i> Start</button>';
                    } else if (taskListId === 'inProgressTasks') {
                        actionButton = '<button class="btn btn-sm btn-success overlay-action-btn"><i class="bi bi-check-lg"></i> Complete</button>';
                    }
                    
                    actionsDiv.innerHTML = `
                        ${actionButton}
                        ${notes ? '<button class="btn btn-sm btn-outline-secondary overlay-notes-btn ms-2"><i class="bi bi-journal-text"></i> Details</button>' : ''}
                        <button class="btn btn-sm btn-outline-danger overlay-delete-btn ms-2"><i class="bi bi-trash"></i></button>
                    `;
                }
                
                // Add to overlay
                overlayTasks.appendChild(taskClone);
                
                // Add event listeners to the cloned buttons
                const actionBtn = taskClone.querySelector('.overlay-action-btn');
                if (actionBtn) {
                    actionBtn.addEventListener('click', function(e) {
                        e.stopPropagation();
                        const originalTask = document.querySelector(`[data-title="${taskTitle}"]`);
                        if (originalTask) {
                            const inProgressList = document.getElementById('inProgressTasks');
                            const completedList = document.getElementById('completedTasks');
                            let targetList, newStatus;

                            // Determine where to move the task
                            if (taskListId === 'todoTasks') {
                                targetList = inProgressList;
                                newStatus = 'inProgress';
                            } else if (taskListId === 'inProgressTasks') {
                                targetList = completedList;
                                newStatus = 'completed';
                            }
                            
                            // Move the task
                            if (targetList) {
                                moveTask(originalTask, newStatus === 'inProgress' ? 'start' : 'complete');
                                
                                // Update the overlay
                                showOverlay(title, taskListId);
                            }
                        }
                    });
                }
                
                // Add event listener for notes toggle
                const notesBtn = taskClone.querySelector('.overlay-notes-btn');
                const notesDiv = taskClone.querySelector('.task-notes');
                if (notesBtn && notesDiv) {
                    notesBtn.addEventListener('click', function() {
                        const isVisible = notesDiv.style.display !== 'none';
                        notesDiv.style.display = isVisible ? 'none' : 'block';
                        notesBtn.innerHTML = isVisible ? 
                            '<i class="bi bi-journal-text"></i> Details' : 
                            '<i class="bi bi-journal-minus"></i> Hide Details';
                    });
                }
                
                // Add event listener for delete button
                const deleteBtn = taskClone.querySelector('.overlay-delete-btn');
                if (deleteBtn) {
                    deleteBtn.addEventListener('click', function() {
                        const originalTask = document.querySelector(`[data-title="${taskTitle}"]`);
                        if (originalTask) {
                            deleteTask(originalTask);
                            
                            // Update the overlay
                            showOverlay(title, taskListId);
                        }
                    });
                }
            });
        }
        
        // Show the overlay
        assignmentOverlay.style.display = 'flex';
        document.body.style.overflow = 'hidden'; // Prevent scrolling
    }
    
    // Event listeners for the assignment cards
    if (todoCard) {
        todoCard.addEventListener('click', function() {
            showOverlay('To Do Tasks', 'todoTasks');
        });
    }
    
    if (progressCard) {
        progressCard.addEventListener('click', function() {
            showOverlay('In Progress Tasks', 'inProgressTasks');
        });
    }
    
    if (completedCard) {
        completedCard.addEventListener('click', function() {
            showOverlay('Completed Tasks', 'completedTasks');
        });
    }
    
    // Close overlay when close button is clicked
    if (closeOverlay) {
        closeOverlay.addEventListener('click', function() {
            assignmentOverlay.style.display = 'none';
            document.body.style.overflow = ''; // Restore scrolling
        });
    }
    
    // Close overlay when clicking outside the content
    assignmentOverlay.addEventListener('click', function(e) {
        if (e.target === assignmentOverlay) {
            assignmentOverlay.style.display = 'none';
            document.body.style.overflow = ''; // Restore scrolling
        }
    });
    
    // Close overlay with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && assignmentOverlay.style.display === 'flex') {
            assignmentOverlay.style.display = 'none';
            document.body.style.overflow = ''; // Restore scrolling
        }
    });
});

// Function to update task counts
function updateTaskCounts() {
    const todoCount = document.getElementById('todoTasks').querySelectorAll('.task-item').length;
    const inProgressCount = document.getElementById('inProgressTasks').querySelectorAll('.task-item').length;
    const completedCount = document.getElementById('completedTasks').querySelectorAll('.task-item').length;
    
    // Update the count displays
    const todoCountEl = document.querySelector('.todo-card .task-count');
    const inProgressCountEl = document.querySelector('.progress-card .task-count');
    const completedCountEl = document.querySelector('.completed-card .task-count');
    
    if (todoCountEl) todoCountEl.textContent = todoCount;
    if (inProgressCountEl) inProgressCountEl.textContent = inProgressCount;
    if (completedCountEl) completedCountEl.textContent = completedCount;
}

// Toast notification function
function showToast(message, type = 'info') {
    // Create toast container if it doesn't exist
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        document.body.appendChild(toastContainer);
    }
    
    // Create toast element
    const toastEl = document.createElement('div');
    toastEl.className = `toast align-items-center text-white bg-${type} border-0`;
    toastEl.setAttribute('role', 'alert');
    toastEl.setAttribute('aria-live', 'assertive');
    toastEl.setAttribute('aria-atomic', 'true');
    
    // Create toast content
    toastEl.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `;
    
    // Add toast to container
    toastContainer.appendChild(toastEl);
    
    // Initialize and show toast
    const toast = new bootstrap.Toast(toastEl, {
        autohide: true,
        delay: 3000
    });
    toast.show();
    
    // Remove toast after it's hidden
    toastEl.addEventListener('hidden.bs.toast', function() {
        toastEl.remove();
    });
}

// Add notification function
function addNotification(type, title, message, time) {
    try {
        if (window.notificationSystem) {
            window.notificationSystem.addNotification({
                type: type,
                title: title, 
                message: message,
                time: time
            });
        }
    } catch (error) {
        console.log('Notification system not available');
    }
}

// Academic Data Model
const academicData = {
    gpa: 0.0,
    semesterCount: 0,
    assignmentCount: 0,
    studyHours: 0,
    subjects: {
        mathematics: 0,
        science: 0,
        literature: 0,
        history: 0
    },
    grades: [],
    assignments: []
};

// Handle grades section visibility
document.addEventListener('DOMContentLoaded', () => {
    const navLinks = document.querySelectorAll('.nav-link');
    const addGradeBtn = document.getElementById('addGradeBtn');
    const sectionContents = document.querySelectorAll('.section-content');
    
    // Define showSection function in the scope
    function showSection(sectionId) {
        // Hide all sections
        sectionContents.forEach(section => {
            section.classList.remove('active');
        });
        
        // Show selected section
        const selectedSection = document.getElementById(sectionId);
        if (selectedSection) {
            selectedSection.classList.add('active');
        }
        
        // Show/hide Add Grade button based on section
        if (addGradeBtn) {
            if (sectionId === 'grades') {
                addGradeBtn.classList.remove('d-none');
            } else {
                addGradeBtn.classList.add('d-none');
            }
        }
    }
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.dataset.section;
            
            // Update active state
            navLinks.forEach(t => t.classList.remove('active'));
            link.classList.add('active');
            
            // Show corresponding section using local function
            showSection(section);
        });
    });
});

// Mobile Interactions
class MobileInteractions {
    constructor() {
        // Initialize elements
        this.bottomSheet = document.getElementById('eventsBottomSheet');
        this.bottomSheetContent = document.getElementById('bottomSheetContent');
        
        // Create pull-to-refresh element if it doesn't exist
        this.initializePullToRefresh();
        
        this.floatingBtn = document.getElementById('addEventFloatingBtn');
        this.mobileNavTabs = document.querySelectorAll('.nav-tab');
        
        this.startY = 0;
        this.currentY = 0;
        this.isRefreshing = false;
        
        this.initializeEventListeners();
    }

    initializePullToRefresh() {
        // Check if pull-to-refresh element exists
        let pullToRefresh = document.getElementById('pullToRefresh');
        
        // Create element if it doesn't exist
        if (!pullToRefresh) {
            pullToRefresh = document.createElement('div');
            pullToRefresh.id = 'pullToRefresh';
            pullToRefresh.className = 'pull-to-refresh';
            pullToRefresh.innerHTML = '<span>Pull to refresh</span>';
            document.body.insertBefore(pullToRefresh, document.body.firstChild);
        }
        
        this.pullToRefresh = pullToRefresh;
    }
    
    resetPullToRefresh() {
        if (this.pullToRefresh) {
            this.pullToRefresh.classList.remove('visible');
            this.pullToRefresh.innerHTML = '<span>Pull to refresh</span>';
        }
        document.body.style.overflow = '';
        this.isRefreshing = false;
        this.startY = 0;
        this.currentY = 0;
    }

    refresh() {
        if (!this.pullToRefresh) return;
        
        this.isRefreshing = true;
        this.pullToRefresh.innerHTML = '<i class="bi bi-arrow-repeat spin"></i> Refreshing...';
        
        // Simulate refresh
        setTimeout(() => {
            if (window.calendarManager) {
                window.calendarManager.loadEvents();
                window.calendarManager.render();
            }
            this.resetPullToRefresh();
        }, 1500);
    }

    initializeEventListeners() {
        // Bottom Sheet Touch Events with passive listeners
        if (this.bottomSheet) {
            let startY = 0;
            let currentTranslate = 0;
            
            this.bottomSheet.addEventListener('touchstart', (e) => {
                startY = e.touches[0].clientY;
                this.bottomSheet.style.transition = 'none';
            }, { passive: true });
            
            this.bottomSheet.addEventListener('touchmove', (e) => {
                const deltaY = e.touches[0].clientY - startY;
                currentTranslate = Math.max(0, deltaY);
                this.bottomSheet.style.transform = `translateY(${currentTranslate}px)`;
            }, { passive: true });
            
            this.bottomSheet.addEventListener('touchend', () => {
                this.bottomSheet.style.transition = 'transform 0.3s ease-out';
                if (currentTranslate > 150) {
                    this.hideBottomSheet();
                } else {
                    this.bottomSheet.style.transform = `translateY(0)`;
                }
            });
        }
        
        // Pull to Refresh with passive listeners
        document.addEventListener('touchstart', (e) => {
            this.startY = e.touches[0].clientY;
        }, { passive: true });
        
        document.addEventListener('touchmove', (e) => {
            if (window.scrollY === 0 && !this.isRefreshing) {
                this.currentY = e.touches[0].clientY;
                const pullDistance = this.currentY - this.startY;
                
                if (pullDistance > 0) {
                    this.pullToRefresh.classList.add('visible');
                    document.body.style.overflow = 'hidden';
                }
            }
        }, { passive: true });
        
        // Floating Action Button
        if (this.floatingBtn) {
            this.floatingBtn.addEventListener('click', () => {
                window.calendarManager.showAddEventModal();
            });
            
            // Hide/Show on scroll
            let lastScroll = 0;
            window.addEventListener('scroll', () => {
                const currentScroll = window.scrollY;
                if (currentScroll > lastScroll && currentScroll > 100) {
                    this.floatingBtn.style.transform = 'translateY(80px)';
                } else {
                    this.floatingBtn.style.transform = 'translateY(0)';
                }
                lastScroll = currentScroll;
            });
        }
        
        // Mobile Navigation
        this.mobileNavTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                const section = tab.dataset.section;
                
                // Update active state
                this.mobileNavTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                // Show corresponding section
                this.showSection(section);
            });
        });
    }
    
    showBottomSheet(content) {
        if (this.bottomSheetContent) {
            this.bottomSheetContent.innerHTML = content;
        }
        if (this.bottomSheet) {
            this.bottomSheet.classList.add('show');
        }
    }
    
    hideBottomSheet() {
        if (this.bottomSheet) {
            this.bottomSheet.classList.remove('show');
        }
    }
    
    showSection(section) {
        // Hide all sections
        document.querySelectorAll('.section').forEach(s => {
            s.classList.add('d-none');
        });
        
        // Show selected section
        const selectedSection = document.querySelector(`.section[data-section="${section}"]`);
        if (selectedSection) {
            selectedSection.classList.remove('d-none');
        }
        
        // Handle special cases
        if (section === 'calendar') {
            window.calendarManager.render();
        }
    }
}

// Initialize mobile interactions when document is ready
document.addEventListener('DOMContentLoaded', () => {
    window.mobileInteractions = new MobileInteractions();
    
    // Wait for calendarManager to be initialized
    const initMobileCalendar = () => {
        if (window.calendarManager && window.calendarManager.showDayEvents) {
            const originalShowDayEvents = window.calendarManager.showDayEvents.bind(window.calendarManager);
            
            window.calendarManager.showDayEvents = function(date) {
                if (window.innerWidth < 768) {
                    const dayEvents = this.events.filter(event => 
                        event.date.getDate() === date.getDate() &&
                        event.date.getMonth() === date.getMonth() &&
                        event.date.getFullYear() === date.getFullYear()
                    );
                    
                    const content = dayEvents.length > 0 
                        ? dayEvents.map(event => this.createEventElement(event)).join('')
                        : '<div class="text-center p-3">No events for this day</div>';
                        
                    window.mobileInteractions.showBottomSheet(content);
                } else if (originalShowDayEvents) {
                    originalShowDayEvents(date);
                }
            };
        } else {
            // Retry after a short delay if calendar manager isn't ready
            setTimeout(initMobileCalendar, 100);
        }
    };

    // Start the initialization process
    initMobileCalendar();
});

// Close sidebar when clicking outside
document.addEventListener('click', function(event) {
    const sidebar = document.querySelector('.sidebar');
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    
    if (!sidebar || !mobileMenuToggle) return; // Early return if elements don't exist
    
    if (!sidebar.contains(event.target) && !mobileMenuToggle.contains(event.target) && 
        sidebar.classList.contains('active')) {
        sidebar.classList.remove('active');
        mobileMenuToggle.setAttribute('aria-expanded', 'false');
    }
});

// Close sidebar when clicking outside
document.addEventListener('click', function(e) {
    const sidebar = document.getElementById('mobileSidebar');
    const toggleBtn = document.getElementById('mobileMenuToggle');
    
    // Early return if elements don't exist
    if (!sidebar || !toggleBtn) return;
    
    try {
        if (!sidebar.contains(e.target) && !toggleBtn.contains(e.target) && 
            sidebar.classList.contains('show')) {
            sidebar.classList.remove('show');
        }
    } catch (error) {
        console.warn('Error handling sidebar click:', error);
    }
});

// Sidebar navigation click handlers
const sidebarNavLinks = document.querySelectorAll('.sidebar-nav .nav-link');
if (sidebarNavLinks && sidebarNavLinks.length > 0) {
    sidebarNavLinks.forEach(link => {
        if (link) {
            link.addEventListener('click', function() {
                const mobileSidebar = document.getElementById('mobileSidebar');
                if (window.innerWidth < 768 && mobileSidebar) {
                    mobileSidebar.classList.remove('show');
                }
            });
        }
    });
}

// Add fallback for missing empty calendar image
const emptyCalendarImg = document.querySelector('img[src*="empty-calendar.svg"]');
if (emptyCalendarImg) {
    emptyCalendarImg.onerror = function() {
        this.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxyZWN0IHg9IjMiIHk9IjQiIHdpZHRoPSIxOCIgaGVpZ2h0PSIxOCIgcng9IjIiIHJ5PSIyIj48L3JlY3Q+PGxpbmUgeDE9IjE2IiB5MT0iMiIgeDI9IjE2IiB5Mj0iNiI+PC9saW5lPjxsaW5lIHgxPSI4IiB5MT0iMiIgeDI9IjgiIHkyPSI2Ij48L2xpbmU+PGxpbmUgeDE9IjMiIHkxPSIxMCIgeDI9IjIxIiB5Mj0iMTAiPjwvbGluZT48L3N2Zz4=';
        this.alt = 'Calendar';
    };
}

// Assignment Card Overlay Functionality
document.addEventListener('DOMContentLoaded', function() {
    // Get the assignment cards
    const todoCard = document.getElementById('todoCard');
    const progressCard = document.getElementById('progressCard');
    const completedCard = document.getElementById('completedCard');
    
    // Get the overlay elements
    const assignmentOverlay = document.getElementById('assignmentOverlay');
    const overlayTitle = document.getElementById('overlayTitle');
    const overlayTasks = document.getElementById('overlayTasks');
    const overlayEmptyState = document.getElementById('overlayEmptyState');
    const closeOverlay = document.getElementById('closeOverlay');
    
    // Function to show overlay with tasks
    function showOverlay(title, taskListId) {
        // Set the overlay title
        overlayTitle.textContent = title;
        
        // Get the tasks from the corresponding task list
        const taskList = document.getElementById(taskListId);
        const tasks = taskList.querySelectorAll('.task-item');
        
        // Clear the overlay tasks
        overlayTasks.innerHTML = '';
        
        // Check if there are tasks
        if (tasks.length === 0) {
            overlayEmptyState.classList.remove('d-none');
        } else {
            overlayEmptyState.classList.add('d-none');
            
            // Clone and add each task to the overlay
            tasks.forEach(task => {
                const taskClone = task.cloneNode(true);
                
                // Remove existing event listeners by replacing with a new copy
                const taskTitle = taskClone.querySelector('.task-title').textContent;
                const taskDueDate = taskClone.dataset.dueDate;
                const taskPriority = taskClone.dataset.priority;
                
                // Get notes if they exist
                const notesElement = taskClone.querySelector('.task-notes');
                const notes = notesElement ? notesElement.innerHTML : '';
                
                // Replace action buttons with appropriate ones for the overlay
                const actionsDiv = taskClone.querySelector('.task-actions');
                if (actionsDiv) {
                    // Determine which action button to show based on current status
                    let actionButton = '';
                    if (taskListId === 'todoTasks') {
                        actionButton = '<button class="btn btn-sm btn-primary overlay-action-btn"><i class="bi bi-play-fill"></i> Start</button>';
                    } else if (taskListId === 'inProgressTasks') {
                        actionButton = '<button class="btn btn-sm btn-success overlay-action-btn"><i class="bi bi-check-lg"></i> Complete</button>';
                    }
                    
                    actionsDiv.innerHTML = `
                        ${actionButton}
                        ${notes ? '<button class="btn btn-sm btn-outline-secondary overlay-notes-btn ms-2"><i class="bi bi-journal-text"></i> Details</button>' : ''}
                        <button class="btn btn-sm btn-outline-danger overlay-delete-btn ms-2"><i class="bi bi-trash"></i></button>
                    `;
                }
                
                // Add to overlay
                overlayTasks.appendChild(taskClone);
                
                // Add event listeners to the cloned buttons
                const actionBtn = taskClone.querySelector('.overlay-action-btn');
                if (actionBtn) {
                    actionBtn.addEventListener('click', function(e) {
                        e.stopPropagation();
                        const originalTask = document.querySelector(`[data-title="${taskTitle}"]`);
                        if (originalTask) {
                            const inProgressList = document.getElementById('inProgressTasks');
                            const completedList = document.getElementById('completedTasks');
                            let targetList, newStatus;

                            // Determine where to move the task
                            if (taskListId === 'todoTasks') {
                                targetList = inProgressList;
                                newStatus = 'inProgress';
                            } else if (taskListId === 'inProgressTasks') {
                                targetList = completedList;
                                newStatus = 'completed';
                            }
                            
                            // Move the task
                            if (targetList) {
                                moveTask(originalTask, newStatus === 'inProgress' ? 'start' : 'complete');
                                
                                // Update the overlay
                                showOverlay(title, taskListId);
                            }
                        }
                    });
                }
                
                // Add event listener for notes toggle
                const notesBtn = taskClone.querySelector('.overlay-notes-btn');
                const notesDiv = taskClone.querySelector('.task-notes');
                if (notesBtn && notesDiv) {
                    notesBtn.addEventListener('click', function() {
                        const isVisible = notesDiv.style.display !== 'none';
                        notesDiv.style.display = isVisible ? 'none' : 'block';
                        notesBtn.innerHTML = isVisible ? 
                            '<i class="bi bi-journal-text"></i> Details' : 
                            '<i class="bi bi-journal-minus"></i> Hide Details';
                    });
                }
                
                // Add event listener for delete button
                const deleteBtn = taskClone.querySelector('.overlay-delete-btn');
                if (deleteBtn) {
                    deleteBtn.addEventListener('click', function() {
                        const originalTask = document.querySelector(`[data-title="${taskTitle}"]`);
                        if (originalTask) {
                            deleteTask(originalTask);
                            
                            // Update the overlay
                            showOverlay(title, taskListId);
                        }
                    });
                }
            });
        }
        
        // Show the overlay
        assignmentOverlay.style.display = 'flex';
        document.body.style.overflow = 'hidden'; // Prevent scrolling
    }
    
    // Event listeners for the assignment cards
    if (todoCard) {
        todoCard.addEventListener('click', function() {
            showOverlay('To Do Tasks', 'todoTasks');
        });
    }
    
    if (progressCard) {
        progressCard.addEventListener('click', function() {
            showOverlay('In Progress Tasks', 'inProgressTasks');
        });
    }
    
    if (completedCard) {
        completedCard.addEventListener('click', function() {
            showOverlay('Completed Tasks', 'completedTasks');
        });
    }
    
    // Close overlay when close button is clicked
    if (closeOverlay) {
        closeOverlay.addEventListener('click', function() {
            assignmentOverlay.style.display = 'none';
            document.body.style.overflow = ''; // Restore scrolling
        });
    }
    
    // Close overlay when clicking outside the content
    assignmentOverlay.addEventListener('click', function(e) {
        if (e.target === assignmentOverlay) {
            assignmentOverlay.style.display = 'none';
            document.body.style.overflow = ''; // Restore scrolling
        }
    });
    
    // Close overlay with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && assignmentOverlay.style.display === 'flex') {
            assignmentOverlay.style.display = 'none';
            document.body.style.overflow = ''; // Restore scrolling
        }
    });
});

// Function to update task counts
function updateTaskCounts() {
    const todoCount = document.getElementById('todoTasks').querySelectorAll('.task-item').length;
    const inProgressCount = document.getElementById('inProgressTasks').querySelectorAll('.task-item').length;
    const completedCount = document.getElementById('completedTasks').querySelectorAll('.task-item').length;
    
    // Update the count displays
    const todoCountEl = document.querySelector('.todo-card .task-count');
    const inProgressCountEl = document.querySelector('.progress-card .task-count');
    const completedCountEl = document.querySelector('.completed-card .task-count');
    
    if (todoCountEl) todoCountEl.textContent = todoCount;
    if (inProgressCountEl) inProgressCountEl.textContent = inProgressCount;
    if (completedCountEl) completedCountEl.textContent = completedCount;
}

// Toast notification function
function showToast(message, type = 'info') {
    // Create toast container if it doesn't exist
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        document.body.appendChild(toastContainer);
    }
    
    // Create toast element
    const toastEl = document.createElement('div');
    toastEl.className = `toast align-items-center text-white bg-${type} border-0`;
    toastEl.setAttribute('role', 'alert');
    toastEl.setAttribute('aria-live', 'assertive');
    toastEl.setAttribute('aria-atomic', 'true');
    
    // Create toast content
    toastEl.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `;
    
    // Add toast to container
    toastContainer.appendChild(toastEl);
    
    // Initialize and show toast
    const toast = new bootstrap.Toast(toastEl, {
        autohide: true,
        delay: 3000
    });
    toast.show();
    
    // Remove toast after it's hidden
    toastEl.addEventListener('hidden.bs.toast', function() {
        toastEl.remove();
    });
}

// Add notification function
function addNotification(type, title, message, time) {
    try {
        if (window.notificationSystem) {
            window.notificationSystem.addNotification({
                type: type,
                title: title, 
                message: message,
                time: time
            });
        }
    } catch (error) {
        console.log('Notification system not available');
    }
}
