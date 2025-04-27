export class PerformanceMonitor {
    constructor() {
        this.metrics = new Map();
        this.marks = new Map();
        this.observers = new Set();
    }

    startMeasure(name) {
        if (window.performance) {
            const mark = `${name}_start`;
            performance.mark(mark);
            this.marks.set(name, mark);
        }
    }

    endMeasure(name) {
        if (window.performance && this.marks.has(name)) {
            const startMark = this.marks.get(name);
            const endMark = `${name}_end`;
            performance.mark(endMark);
            
            try {
                performance.measure(name, startMark, endMark);
                const entries = performance.getEntriesByName(name);
                const duration = entries[entries.length - 1].duration;
                
                this.logMetric(name, duration);
                return duration;
            } catch (error) {
                console.error(`Failed to measure ${name}:`, error);
                return null;
            }
        }
    }

    logMetric(name, value) {
        if (!this.metrics.has(name)) {
            this.metrics.set(name, []);
        }
        this.metrics.get(name).push({
            value,
            timestamp: Date.now()
        });
        
        this._notifyObservers(name, value);
    }

    getMetrics(name) {
        return this.metrics.get(name) || [];
    }

    addObserver(callback) {
        this.observers.add(callback);
        return () => this.observers.delete(callback);
    }

    // Using underscore prefix instead of 'private' modifier
    _notifyObservers(name, value) {
        this.observers.forEach(callback => {
            try {
                callback(name, value);
            } catch (error) {
                console.error('Observer notification failed:', error);
            }
        });
    }
}
