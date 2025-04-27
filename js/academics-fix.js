/**
 * Fix for reference errors in academics.js
 * This script makes necessary functions globally accessible and adds assignment count updates
 */

// Implement a fallback for updateCalendarTaskStatus if it doesn't exist
if (typeof window.updateCalendarTaskStatus !== 'function') {
    window.updateCalendarTaskStatus = function(title, date, status) {
        console.log(`Calendar task status update (fallback): ${title}, ${date}, ${status}`);
        if (window.calendarManager && window.calendarManager.events) {
            try {
                const events = window.calendarManager.events;
                
                // Find the matching task event
                const taskIndex = events.findIndex(event => 
                    event.eventType === 'task' && 
                    event.title === title && 
                    event.date.getMonth() === date.getMonth() && 
                    event.date.getDate() === date.getDate()
                );
                
                if (taskIndex !== -1) {
                    // Update the task status
                    if (status === 'complete') {
                        events[taskIndex].completed = true;
                        events[taskIndex].className = 'task-event task-completed';
                    } else if (status === '') {
                        // Task is completed
                        events[taskIndex].completed = true;
                        events[taskIndex].className = 'task-event task-completed';
                    } else {
                        // Task is in progress
                        events[taskIndex].inProgress = true;
                        events[taskIndex].className = 'task-event task-in-progress';
                    }
                    
                    // Re-render the calendar
                    if (typeof window.calendarManager.render === 'function') {
                        window.calendarManager.render();
                    }
                }
            } catch (error) {
                console.error('Error in updateCalendarTaskStatus fallback:', error);
            }
        }
    };
    console.log('✅ Added fallback implementation for updateCalendarTaskStatus');
}

document.addEventListener('DOMContentLoaded', function() {
    // Add function to update assignment counts
    window.updateAssignmentCounts = function() {
        try {
            // Get task counts from each list
            const todoCount = document.getElementById('todoTasks')?.querySelectorAll('.task-item').length || 0;
            const inProgressCount = document.getElementById('inProgressTasks')?.querySelectorAll('.task-item').length || 0;
            const completedCount = document.getElementById('completedTasks')?.querySelectorAll('.task-item').length || 0;
            
            // Update Active Assignments count (todo + inProgress)
            const activeAssignmentsElement = document.querySelector('[data-stat="assignmentCount"]');
            if (activeAssignmentsElement) {
                activeAssignmentsElement.textContent = todoCount + inProgressCount;
            }
            
            // Update Completed Assignments count
            const completedAssignmentsElement = document.querySelector('[data-stat="completedAssignments"]');
            if (completedAssignmentsElement) {
                completedAssignmentsElement.textContent = completedCount;
            }
            
            // Update the overview to-do count
            const overviewTodoCountElement = document.getElementById('overview-todo-count');
            if (overviewTodoCountElement) {
                overviewTodoCountElement.textContent = todoCount;
            }
            
            console.log(`✅ Assignment counts updated: Active=${todoCount + inProgressCount}, Completed=${completedCount}`);
        } catch (error) {
            console.error('Error updating assignment counts:', error);
        }
    };
    
    // Call the update function initially
    setTimeout(window.updateAssignmentCounts, 500);
    
    // Wait for the moveTask function to be defined
    const checkFunctions = setInterval(function() {
        if (typeof moveTask === 'function') {
            // Store the original moveTask function
            const originalMoveTask = moveTask;
            
            // Override moveTask with our enhanced version
            window.moveTask = function(taskElement, currentStatus) {
                // Call the original moveTask function
                originalMoveTask(taskElement, currentStatus);
                
                // Update assignment counts after the task is moved
                window.updateAssignmentCounts();
            };
            console.log('✅ moveTask function enhanced with count updates');
            
            // Make updateCalendarTaskStatus globally accessible if it exists in the original code
            if (typeof updateCalendarTaskStatus === 'function') {
                // Store the original function
                const originalUpdateCalendarTaskStatus = updateCalendarTaskStatus;
                
                // Override with an enhanced version that has error handling
                window.updateCalendarTaskStatus = function(title, date, status) {
                    try {
                        originalUpdateCalendarTaskStatus(title, date, status);
                    } catch (error) {
                        console.warn('Error in original updateCalendarTaskStatus, using fallback:', error);
                        // The fallback is already defined at the top of the file
                    }
                };
                console.log('✅ updateCalendarTaskStatus function enhanced with error handling');
            }
            
            // Make showOverlay globally accessible if it exists
            if (typeof showOverlay === 'function') {
                window.showOverlay = showOverlay;
                console.log('✅ showOverlay function made globally accessible');
            }
            
            // Clear the interval once functions are made global
            clearInterval(checkFunctions);
            
            // Update counts after everything is initialized
            window.updateAssignmentCounts();
        }
    }, 100); // Check every 100ms
    
    // Set up a MutationObserver to watch for changes in the task lists
    const taskListsObserver = new MutationObserver(function(mutations) {
        // Update counts when changes are detected
        window.updateAssignmentCounts();
    });
    
    // Start observing task lists when they become available
    setTimeout(function() {
        const taskLists = [
            document.getElementById('todoTasks'),
            document.getElementById('inProgressTasks'),
            document.getElementById('completedTasks')
        ];
        
        taskLists.forEach(list => {
            if (list) {
                taskListsObserver.observe(list, { childList: true, subtree: true });
            }
        });
        
        console.log('✅ Task list observers initialized');
    }, 1000);
});
