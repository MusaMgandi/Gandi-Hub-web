export class ValidationManager {
    static validateGrade(grade) {
        const errors = [];
        
        if (!grade.value || grade.value < 0 || grade.value > 4.0) {
            errors.push('Grade must be between 0 and 4.0');
        }
        
        if (!grade.date || isNaN(new Date(grade.date).getTime())) {
            errors.push('Invalid date');
        }
        
        if (!grade.yearLevel || !Number.isInteger(grade.yearLevel)) {
            errors.push('Invalid year level');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    static validateAssignment(assignment) {
        const errors = [];
        
        if (!assignment.title?.trim()) {
            errors.push('Title is required');
        }
        
        if (!assignment.dueDate || isNaN(new Date(assignment.dueDate).getTime())) {
            errors.push('Invalid due date');
        }
        
        if (!['low', 'medium', 'high'].includes(assignment.priority)) {
            errors.push('Invalid priority level');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    static validateEvent(event) {
        const errors = [];
        const now = new Date();
        const eventDate = new Date(event.date);
        
        if (!event.title?.trim()) {
            errors.push('Title is required');
        }
        
        if (isNaN(eventDate.getTime())) {
            errors.push('Invalid date');
        } else if (eventDate < now) {
            errors.push('Event date cannot be in the past');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
}
