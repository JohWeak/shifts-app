// backend/src/constants/algorithms.js
module.exports = {
    AVAILABLE_ALGORITHMS: ['cp-sat', 'simple', 'auto'],

    ALGORITHM_NAMES: {
        CP_SAT: 'cp-sat',
        SIMPLE: 'simple',
        AUTO: 'auto'
    },

    ALGORITHM_DISPLAY_NAMES: {
        'cp-sat': 'CP-SAT (Advanced)',
        'simple': 'Simple Assignment',
        'auto': 'Auto Selection'
    },

    ALGORITHM_DESCRIPTIONS: {
        'cp-sat': 'Google OR-Tools constraint solver for optimal scheduling',
        'simple': 'Basic round-robin assignment algorithm',
        'auto': 'Automatically selects the best available algorithm'
    }
};