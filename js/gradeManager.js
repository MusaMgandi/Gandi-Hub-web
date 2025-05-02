class GradeManager {
    constructor() {
        this.grades = JSON.parse(localStorage.getItem('grades')) || [];
        this.init();
    }

    init() {
        this.bindEvents();
        this.updateGradeHistory();
        this.updateAnalytics();
    }

    bindEvents() {
        // Modal form submit
        document.getElementById('saveGradeBtn').addEventListener('click', () => this.saveGrade());
        
        // Regular form submit
        document.getElementById('addGradeForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveGrade(true);
        });
    }

    saveGrade(isRegularForm = false) {
        const prefix = isRegularForm ? '' : 'modal';
        const grade = {
            id: Date.now(),
            year: document.getElementById(`${prefix}YearOfStudy`).value,
            semester: document.getElementById(`${prefix}Semester`).value,
            gpa: parseFloat(document.getElementById(`${prefix}GpaInput`).value),
            date: document.getElementById(`${prefix}GradeDate`).value,
            notes: document.getElementById(`${prefix}GradeNotes`).value,
            timestamp: Date.now() // Add timestamp for accurate sorting
        };

        if (this.validateGrade(grade)) {
            // Sort grades by date before adding new grade
            this.grades = [...this.grades]
                .sort((a, b) => new Date(b.date) - new Date(a.date));
            
            this.grades.unshift(grade); // Add new grade at the beginning
            this.persistGrades();
            this.updateGradeHistory();
            this.updateAnalytics();
            this.resetForm(isRegularForm);
            
            if (!isRegularForm) {
                bootstrap.Modal.getInstance(document.getElementById('addGradeModal')).hide();
            }
            
            // Update charts with sorted grades
            if (window.chartManager) {
                window.chartManager.updateCharts(this.grades);
            }
            
            this.showToast('Grade added successfully!');
        }
    }

    validateGrade(grade) {
        if (!grade.year || !grade.semester || !grade.date) {
            this.showToast('Please fill all required fields', 'error');
            return false;
        }
        if (grade.gpa < 0 || grade.gpa > 4 || isNaN(grade.gpa)) {
            this.showToast('GPA must be between 0 and 4', 'error');
            return false;
        }
        return true;
    }

    updateGradeHistory() {
        const tableBody = document.getElementById('gradeHistoryTable');
        const emptyState = tableBody.querySelector('.grades-empty-state');

        if (this.grades.length === 0) {
            emptyState.style.display = '';
            return;
        }

        emptyState.style.display = 'none';
        const rows = this.grades.map(grade => this.createGradeRow(grade));
        
        // Clear existing rows except empty state
        Array.from(tableBody.children)
            .filter(child => !child.classList.contains('grades-empty-state'))
            .forEach(child => child.remove());
        
        // Add new rows
        rows.forEach(row => tableBody.appendChild(row));

        // Update charts after updating grade history
        if (window.chartManager) {
            window.chartManager.updateAll(this.grades);
        }
    }

    createGradeRow(grade) {
        const row = document.createElement('tr');
        row.dataset.gradeId = grade.id;
        row.innerHTML = `
            <td>${grade.year}</td>
            <td>${grade.semester}</td>
            <td><span class="badge bg-primary">${grade.gpa.toFixed(1)}</span></td>
            <td>${new Date(grade.date).toLocaleDateString()}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-1" onclick="gradeManager.viewGradeDetails('${grade.id}')">
                    <i class="bi bi-eye"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="gradeManager.deleteGrade('${grade.id}')">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;
        return row;
    }

    updateAnalytics() {
        if (this.grades.length === 0) return;

        const sortedGrades = [...this.grades].sort((a, b) => new Date(b.date) - new Date(a.date));
        const gpas = sortedGrades.map(g => g.gpa);
        
        // Update analytics displays
        document.getElementById('highestGpa').textContent = Math.max(...gpas).toFixed(2);
        document.getElementById('lowestGpa').textContent = Math.min(...gpas).toFixed(2);
        document.getElementById('averageGpa').textContent = (gpas.reduce((a, b) => a + b) / gpas.length).toFixed(2);
        
        // Calculate trend based on most recent grades
        const currentGpa = gpas[0];
        const previousGpa = gpas[1] || gpas[0];
        const trend = currentGpa >= previousGpa ? 
            '<i class="bi bi-arrow-up-circle text-success"></i>' : 
            '<i class="bi bi-arrow-down-circle text-danger"></i>';
        
        document.getElementById('gpaTrend').innerHTML = trend;
    }

    updateCharts() {
        // Implement chart updates using Chart.js
        // This will be covered in the next step
    }

    deleteGrade(gradeId) {
        if (confirm('Are you sure you want to delete this grade?')) {
            this.grades = this.grades.filter(g => g.id !== parseInt(gradeId));
            this.persistGrades();
            this.updateGradeHistory();
            this.updateAnalytics();
            this.showToast('Grade deleted successfully!');
        }
    }

    viewGradeDetails(gradeId) {
        const grade = this.grades.find(g => g.id === parseInt(gradeId));
        if (grade) {
            document.getElementById('gradeDetailGpa').textContent = grade.gpa.toFixed(1);
            document.getElementById('gradeDetailYear').textContent = grade.year;
            document.getElementById('gradeDetailSemester').textContent = grade.semester;
            document.getElementById('gradeDetailDate').textContent = new Date(grade.date).toLocaleDateString();
            document.getElementById('gradeDetailNotes').textContent = grade.notes || 'No notes available';
            
            const modal = new bootstrap.Modal(document.getElementById('gradeDetailsModal'));
            modal.show();
        }
    }

    persistGrades() {
        localStorage.setItem('grades', JSON.stringify(this.grades));
    }

    resetForm(isRegularForm) {
        const formId = isRegularForm ? 'addGradeForm' : 'addGradeModalForm';
        document.getElementById(formId).reset();
    }

    showToast(message, type = 'success') {
        // Implement toast notification
        // This will be covered in a subsequent step
    }
}

// Initialize and expose to window
window.gradeManager = new GradeManager();
