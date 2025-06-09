// frontend/src/i18n/messages.js
/**
 * Translatable messages for the application
 * All user-facing text should be stored here for easy translation
 */

export const MESSAGES = {
    // Schedule Management
    SCHEDULE_MANAGEMENT: 'Schedule Management',
    CREATE_MANAGE_SCHEDULES: 'Create and manage employee schedules with advanced algorithms',
    GENERATE_SCHEDULE: 'Generate Schedule',

    // Edit Mode
    EDIT_MODE: 'Edit Mode',
    SAVE_CHANGES: 'Save Changes',
    CANCEL_EDIT: 'Cancel Edit',
    UNSAVED_CHANGES: 'Unsaved changes',
    ADD_EMPLOYEE: 'Add Employee',
    REMOVE_EMPLOYEE: 'Remove Employee',

    // Status Messages
    NEED_MORE_EMPLOYEES: 'Need {count} more',
    REQUIRED_EMPLOYEES: 'Required: {count} employees per shift',
    POSITION_CHANGES_SAVED: 'Position changes saved successfully! ({count} changes processed)',
    FAILED_TO_SAVE: 'Failed to save changes',
    NO_CHANGES_TO_SAVE: 'No changes to save',

    // Buttons
    SELECT: 'Select',
    CANCEL: 'Cancel',
    SAVE: 'Save',
    EDIT: 'Edit',

    // Employee Status
    NEW: 'New',
    AVAILABLE: 'Available',
    PREFERRED: 'Preferred',
    CANNOT_WORK: 'Cannot Work',
    VIOLATES_CONSTRAINTS: 'Violates Constraints',

    // Days of Week
    SUNDAY: 'Sunday',
    MONDAY: 'Monday',
    TUESDAY: 'Tuesday',
    WEDNESDAY: 'Wednesday',
    THURSDAY: 'Thursday',
    FRIDAY: 'Friday',
    SATURDAY: 'Saturday',

    // Errors
    ERROR_SAVING_CHANGES: 'Error saving changes: {error}',
    INTERNAL_SERVER_ERROR: 'Internal server error',
    SCHEDULE_NOT_FOUND: 'Schedule not found',
    SELECT_SUNDAY_REQUIRED: 'Please select a Sunday to start the schedule week. The generation button will be disabled until a valid date is selected.',
    SELECT_SUNDAY_TO_ENABLE: 'Please select a Sunday to enable schedule generation',
    NO_WORK_SITES_AVAILABLE: 'No work sites available',

    // Loading Messages
    LOADING_SCHEDULES: 'Loading schedules...',
    LOADING_RECOMMENDATIONS: 'Loading recommendations...',
    SAVING: 'Saving...',
    GENERATING: 'Generating...',

    // Empty States
    NO_SCHEDULES_FOUND: 'No schedules found',
    GENERATE_FIRST_SCHEDULE: 'Generate your first schedule to get started.',
    NO_RECOMMENDATIONS_AVAILABLE: 'No recommendations available',

    // Table Headers
    WEEK: 'Week',
    STATUS: 'Status',
    SITE: 'Site',
    CREATED: 'Created',
    ACTIONS: 'Actions',
    SHIFT: 'Shift',

    // Actions
    VIEW_DETAILS: 'View Details',
    EXPORT: 'Export',
    DUPLICATE: 'Duplicate',

    // Modal Titles
    SELECT_EMPLOYEE: 'Select Employee',
    GENERATE_SCHEDULE_MODAL: 'Generate Schedule',

    // Form Labels
    WEEK_START_DATE: 'Week Start Date',
    ALGORITHM: 'Algorithm',
    ALGORITHM_AUTO: 'Auto (Recommended)',
    ALGORITHM_CP_SAT: 'CP-SAT (Advanced)',
    ALGORITHM_SIMPLE: 'Simple Assignment',
    SITE_ID: 'Site ID',

    // Statuses
    PUBLISHED: 'Published',
    DRAFT: 'Draft',
    ARCHIVED: 'Archived',

    // Tab Titles
    SCHEDULE_OVERVIEW: 'Schedule Overview',
    SCHEDULE_DETAILS: 'Schedule Details',
    POSITION_SCHEDULES: 'Position Schedules',

    // Generation Messages
    SCHEDULE_GENERATED_SUCCESS: 'Schedule generated successfully! {count} assignments created.',
    SCHEDULE_GENERATION_ERROR: 'Error generating schedule: {error}',
    GENERATION_IN_PROGRESS: 'Generating schedule...',
    GENERATION_INFO: 'This may take a few moments depending on the complexity of constraints and chosen algorithm.',

    // Algorithms
    ALGORITHM_AUTO_DESC: 'Auto (Recommended) - Selects best available algorithm',
    ALGORITHM_CP_SAT_DESC: 'CP-SAT (Advanced) - Google OR-Tools constraint solver',
    ALGORITHM_SIMPLE_DESC: 'Simple Assignment - Basic round-robin assignment',

    // Form Help Text
    SELECT_SUNDAY_HELP: 'Select the Sunday that starts the week to schedule.',
    SITE_ID_HELP: 'The workplace site to generate schedule for.',
    ALGORITHM_HELP: 'Choose the scheduling algorithm. Auto mode will select the best available option.',

    // Algorithm Comparison
    COMPARE_ALGORITHMS: 'Compare Algorithms',
    COMPARING: 'Comparing...',
    ALGORITHM_COMPARISON_RESULTS: 'Algorithm Comparison Results',
    BEST_ALGORITHM: 'Best Algorithm',
    BEST_ALGORITHM_INFO: 'Based on success rate, total assignments, and execution time.',
    COMPARISON_COMPLETED: 'Algorithm comparison completed! Best algorithm: {algorithm}',
    COMPARISON_ERROR: 'Error comparing algorithms: {error}',
    USE_ALGORITHM: 'Use {algorithm} Algorithm',
    RECOMMENDATION: 'Recommendation',
    EXECUTION_TIME: 'Execution Time',
    COVERAGE: 'Coverage',
    EMPLOYEES_USED: 'Employees Used',
    ASSIGNMENTS: 'Assignments',
    CONSTRAINT_VIOLATIONS: 'constraint violations',

    // Work Sites
    WORK_SITE: 'Work Site',
    SELECT_WORK_SITE: 'Select the workplace site to generate schedule for.',
    LOADING_WORK_SITES: 'Loading work sites...',
    NO_WORK_SITES: 'No work sites available',
    WEEK_START_SUNDAY_WARNING: 'Schedule weeks should start on Sunday. Consider selecting a Sunday date.',
    FUTURE_DATES_ONLY: 'Select the Sunday that starts the week to schedule. Future dates only.',
    COULD_NOT_LOAD_WORK_SITES: 'Could not load work sites. Using default site.',
};



/**
 * Helper function to interpolate variables into message strings
 * @param {string} message - Message template with {variable} placeholders
 * @param {object} variables - Object with variable values
 * @returns {string} - Interpolated message
 */
export const interpolateMessage = (message, variables = {}) => {
    return message.replace(/\{(\w+)\}/g, (match, key) => {
        return variables[key] !== undefined ? variables[key] : match;
    });
};

export default MESSAGES;