// frontend/src/i18n/messages.js
/**
 * Translatable messages for the application
 * All user-facing text should be stored here for easy translation
 * Organized by functional areas for better maintainability
 */

export const MESSAGES = {
    en: {
        // ==============================================
        // PAGE TITLES & NAVIGATION
        // ==============================================
        SCHEDULE_MANAGEMENT: 'Schedule Management',
        DASHBOARD: 'Dashboard',
        SCHEDULES: 'Schedules',
        EMPLOYEES: 'Employees',
        ALGORITHMS: 'Algorithms',
        SETTINGS: 'Settings',
        ANALYTICS: 'Analytics',

        // ==============================================
        // MAIN ACTIONS & BUTTONS
        // ==============================================
        GENERATE_SCHEDULE: 'Generate Schedule',
        COMPARE_ALGORITHMS: 'Compare Algorithms',
        VIEW_SCHEDULE: 'View Schedule',
        EDIT_SCHEDULE: 'Edit Schedule',
        DELETE_SCHEDULE: 'Delete Schedule',
        EXPORT_SCHEDULE: 'Export Schedule',
        PUBLISH_SCHEDULE: 'Publish Schedule',
        UNPUBLISH_EDIT: 'Unpublish & Edit',
        DUPLICATE: 'Duplicate',

        // Generic Actions
        CREATE: 'Create',
        EDIT: 'Edit',
        DELETE: 'Delete',
        SAVE: 'Save',
        CANCEL: 'Cancel',
        VIEW: 'View',
        SELECT: 'Select',
        EXPORT: 'Export',
        PUBLISH: 'Publish',
        UNPUBLISH: 'Unpublish',
        CLOSE: 'Close',
        ASSIGN: 'Assign',
        REMOVE: 'Remove',

        // ==============================================
        // PAGE DESCRIPTIONS & HELP TEXT
        // ==============================================
        CREATE_MANAGE_SCHEDULES: 'Create and manage employee schedules with advanced algorithms',
        SCHEDULE_DETAILS: 'Schedule Details',
        SCHEDULE_OVERVIEW: 'Schedule Overview',

        // ==============================================
        // LOADING & STATUS STATES
        // ==============================================
        LOADING: 'Loading...',
        SAVING: 'Saving...',
        GENERATING: 'Generating...',
        COMPARING: 'Comparing...',
        EXPORTING: 'Exporting...',
        DELETING: 'Deleting...',

        // Loading Messages
        LOADING_SCHEDULES: 'Loading schedules...',
        LOADING_RECOMMENDATIONS: 'Loading recommendations...',
        LOADING_WORK_SITES: 'Loading work sites...',
        GENERATION_IN_PROGRESS: 'Generating schedule...',
        LOADING_EMPLOYEES: 'Loading available employees...',

        // ==============================================
        // SCHEDULE STATUS & STATES
        // ==============================================
        SCHEDULE_STATUS_DRAFT: 'Draft',
        SCHEDULE_STATUS_PUBLISHED: 'Published',
        SCHEDULE_STATUS_ARCHIVED: 'Archived',
        PUBLISHED: 'Published',
        DRAFT: 'Draft',
        ARCHIVED: 'Archived',

        // Status descriptions
        PUBLISHED_VISIBLE: 'Published and visible to employees',
        VISIBLE_TO_EMPLOYEES: 'Visible to employees',
        READ_ONLY_PUBLISHED: 'Read-only (Published)',

        // ==============================================
        // TABLE HEADERS & COLUMNS
        // ==============================================
        SCHEDULE_PERIOD: 'Schedule Period',
        WEEK: 'Week',
        WEEK_PERIOD: 'Week Period',
        STATUS: 'Status',
        SITE: 'Site',
        CREATED: 'Created',
        CREATED_DATE: 'Created Date',
        ACTIONS: 'Actions',
        SHIFT: 'Shift',

        // Schedule details headers
        SCHEDULE_WEEK: 'Week',
        SCHEDULE_SITE: 'Site',
        SCHEDULE_STATUS: 'Status',
        SITE_LABEL: 'Site',
        WEEK_LABEL: 'Week',
        STATUS_LABEL: 'Status',

        // Assignment table headers
        EMPLOYEE_HEADER: 'Employee',
        POSITION_HEADER: 'Position',
        SHIFT_HEADER: 'Shift',
        TIME_HEADER: 'Time',
        STATUS_HEADER: 'Status',

        // ==============================================
        // DAYS OF THE WEEK
        // ==============================================
        SUNDAY: 'Sunday',
        MONDAY: 'Monday',
        TUESDAY: 'Tuesday',
        WEDNESDAY: 'Wednesday',
        THURSDAY: 'Thursday',
        FRIDAY: 'Friday',
        SATURDAY: 'Saturday',

        // ==============================================
        // EMPLOYEE MANAGEMENT
        // ==============================================
        ADD_EMPLOYEE: 'Add Employee',
        REMOVE_EMPLOYEE: 'Remove Employee',
        SELECT_EMPLOYEE: 'Select Employee',
        NO_AVAILABLE_EMPLOYEES: 'No available employees for this shift',
        AVAILABLE_EMPLOYEES: 'Available Employees',
        RECOMMENDED_EMPLOYEES: 'Recommended Employees',

        // Employee Status
        NEW: 'New',
        AVAILABLE: 'Available',
        PREFERRED: 'Preferred',
        CANNOT_WORK: 'Cannot Work',
        VIOLATES_CONSTRAINTS: 'Violates Constraints',

        // Employee Actions
        EMPLOYEE_ASSIGNED_SUCCESS: 'Employee successfully assigned to shift',
        EMPLOYEE_ASSIGN_ERROR: 'Error assigning employee to shift',
        EMPLOYEE_REMOVED_SUCCESS: 'Employee successfully removed from shift',
        EMPLOYEE_REMOVE_ERROR: 'Error removing employee from shift',
        EMPLOYEE_MARKED_FOR_REMOVAL: 'Employee marked for removal. Save changes to apply.',
        EMPLOYEE_MARKED_FOR_ASSIGNMENT: 'Employee marked for assignment. Save changes to apply.',

        // ==============================================
        // EDIT MODE & CHANGES
        // ==============================================
        EDIT_MODE: 'Edit Mode',
        SAVE_CHANGES: 'Save Changes',
        CANCEL_EDIT: 'Cancel Edit',
        CANCEL_CHANGES: 'Cancel Changes',
        UNSAVED_CHANGES: 'Unsaved changes',
        NO_CHANGES_TO_SAVE: 'No changes to save',
        SAVE_BEFORE_PUBLISH: 'Save all changes before publishing',
        SAVE_CHANGES_BEFORE_PUBLISH: 'Save all changes before publishing',
        EDIT_POSITION: 'Edit Position',
        STOP_EDITING: 'Stop Editing',

        // ==============================================
        // POSITION SCHEDULES
        // ==============================================
        POSITION_SCHEDULES: 'Position Schedules',
        NO_POSITIONS: 'No positions found',
        NEED_MORE_EMPLOYEES: 'Need {count} more',
        REQUIRED_EMPLOYEES: 'Required: {count} employees per shift',
        NO_POSITION_SELECTED: 'No position selected',

        // ==============================================
        // ALGORITHMS & GENERATION
        // ==============================================
        ALGORITHM: 'Algorithm',
        ALGORITHM_AUTO: 'Auto (Recommended)',
        ALGORITHM_CP_SAT: 'CP-SAT (Advanced)',
        ALGORITHM_SIMPLE: 'Simple Assignment',

        // Algorithm descriptions
        ALGORITHM_AUTO_DESC: 'Auto (Recommended) - Selects best available algorithm',
        ALGORITHM_CP_SAT_DESC: 'CP-SAT (Advanced) - Google OR-Tools constraint solver',
        ALGORITHM_SIMPLE_DESC: 'Simple Assignment - Basic round-robin assignment',

        // Algorithm comparison
        ALGORITHM_COMPARISON_RESULTS: 'Algorithm Comparison Results',
        BEST_ALGORITHM: 'Best Algorithm',
        BEST_ALGORITHM_INFO: 'Based on success rate, total assignments, and execution time.',
        USE_ALGORITHM: 'Use {algorithm} Algorithm',
        RECOMMENDATION: 'Recommendation',
        EXECUTION_TIME: 'Execution Time',
        COVERAGE: 'Coverage',
        EMPLOYEES_USED: 'Employees Used',
        ASSIGNMENTS: 'Assignments',
        CONSTRAINT_VIOLATIONS: 'constraint violations',

        // ==============================================
        // FORM FIELDS & LABELS
        // ==============================================
        WEEK_START_DATE: 'Week Start Date',
        SITE_ID: 'Site ID',
        WORK_SITE: 'Work Site',

        // Form help text
        SELECT_SUNDAY_HELP: 'Select the Sunday that starts the week to schedule.',
        SITE_ID_HELP: 'The workplace site to generate schedule for.',
        ALGORITHM_HELP: 'Choose the scheduling algorithm. Auto mode will select the best available option.',
        SELECT_WORK_SITE: 'Select the workplace site to generate schedule for.',
        FUTURE_DATES_ONLY: 'Select the Sunday that starts the week to schedule. Future dates only.',

        // ==============================================
        // MODAL TITLES
        // ==============================================
        GENERATE_SCHEDULE_MODAL: 'Generate Schedule',
        CONFIRM_DELETION: 'Confirm Schedule Deletion',
        EMPLOYEE_SELECTION_MODAL: 'Select Employee for Shift',
        ALGORITHM_COMPARISON_MODAL: 'Algorithm Comparison Results',

        // ==============================================
        // SCHEDULE CELLS & SHIFTS
        // ==============================================
        EMPTY_CELL: 'Click to add employee',
        ADD_EMPLOYEE_TO_SHIFT: 'Add employee to this shift',
        CLICK_TO_ASSIGN: 'Click to assign employee',
        SHIFT_FULL: 'Shift is full',
        SHIFT_PARTIALLY_FILLED: 'Shift partially filled',
        MULTIPLE_EMPLOYEES: '{count} employees assigned',
        PENDING_REMOVAL: 'Pending Removal',
        PENDING_ASSIGNMENT: 'Pending Assignment',

        // ==============================================
        // EXPORT FUNCTIONALITY
        // ==============================================
        EXPORT_PDF: 'Export PDF',
        EXPORT_CSV: 'Export CSV',
        EXPORT_SUCCESS: 'Schedule exported successfully',
        EXPORT_ERROR: 'Error exporting schedule',

        // PDF content
        WORK_SCHEDULE_TITLE: 'Work Schedule',
        GENERATED_ON: 'Generated on',
        TOTAL_ASSIGNMENTS_LABEL: 'Total Assignments',
        SYSTEM_NAME: 'Work Schedule Management System',
        EXPORT_ID_LABEL: 'Export ID',
        GENERATED_LABEL: 'Generated',
        PDF_GENERATION_ERROR: 'Failed to generate PDF',

        // ==============================================
        // EMPTY STATES & NO DATA
        // ==============================================
        NO_SCHEDULES: 'No schedules found',
        NO_SCHEDULES_FOUND: 'No schedules found',
        GENERATE_FIRST_SCHEDULE: 'Generate your first schedule to get started.',
        NO_RECOMMENDATIONS_AVAILABLE: 'No recommendations available',
        NO_WORK_SITES: 'No work sites available',
        NO_WORK_SITES_AVAILABLE: 'No work sites available',
        NO_ASSIGNMENTS: 'No assignments for this day',
        NO_DATA_AVAILABLE: 'No data available',

        // ==============================================
        // SUCCESS MESSAGES
        // ==============================================
        SCHEDULE_GENERATED_SUCCESS: 'Schedule generated successfully! {count} assignments created.',
        POSITION_CHANGES_SAVED: 'Position changes saved successfully! ({count} changes processed)',
        SCHEDULE_DELETED_SUCCESS: 'Schedule for week {week} has been deleted successfully.',
        SCHEDULE_STATUS_UPDATED: 'Schedule status updated successfully!',
        COMPARISON_COMPLETED: 'Algorithm comparison completed! Best algorithm: {algorithm}',
        SCHEDULE_UPDATED_SUCCESS: 'Schedule successfully updated',
        CHANGES_SAVED_SUCCESS: 'Changes saved successfully',
        OPERATION_COMPLETED: 'Operation completed successfully',

        // ==============================================
        // ERROR MESSAGES
        // ==============================================
        ERROR: 'Error',
        ERROR_OCCURRED: 'An error occurred',
        INTERNAL_SERVER_ERROR: 'Internal server error',
        SCHEDULE_NOT_FOUND: 'Schedule not found',
        FAILED_TO_SAVE: 'Failed to save changes',
        ERROR_SAVING_CHANGES: 'Error saving changes: {error}',
        SCHEDULE_GENERATION_ERROR: 'Error generating schedule: {error}',
        DELETE_SCHEDULE_ERROR: 'Error deleting schedule: {error}',
        COMPARISON_ERROR: 'Error comparing algorithms: {error}',
        COULD_NOT_LOAD_WORK_SITES: 'Could not load work sites. Using default site.',
        SCHEDULE_UPDATE_ERROR: 'Error updating schedule',
        NETWORK_ERROR: 'Network error occurred',
        UNEXPECTED_ERROR: 'An unexpected error occurred',
        TRY_AGAIN: 'Please try again',
        FETCH_ERROR: 'Error fetching data',

        // ==============================================
        // WARNING MESSAGES
        // ==============================================
        WARNING: 'Warning',
        SELECT_SUNDAY_REQUIRED: 'Please select a Sunday to start the schedule week. The generation button will be disabled until a valid date is selected.',
        SELECT_SUNDAY_TO_ENABLE: 'Please select a Sunday to enable schedule generation',
        WEEK_START_SUNDAY_WARNING: 'Schedule weeks should start on Sunday. Consider selecting a Sunday date.',
        DELETE_WARNING: 'Warning: This action cannot be undone.',
        CANNOT_DELETE_PUBLISHED: 'Cannot delete published schedule',
        UNSAVED_CHANGES_WARNING: 'You have unsaved changes that will be lost.',

        // ==============================================
        // CONFIRMATION DIALOGS
        // ==============================================
        CONFIRM_DELETE: 'Are you sure you want to delete this schedule?',
        CONFIRM_PUBLISH: 'Are you sure you want to publish this schedule?',
        CONFIRM_UNPUBLISH: 'Are you sure you want to unpublish this schedule?',
        CONFIRM_REMOVE_EMPLOYEE: 'Are you sure you want to remove this employee from the shift?',
        CONFIRM_DISCARD_CHANGES: 'Are you sure you want to discard unsaved changes?',
        DELETE_CONFIRMATION_TEXT: 'Are you sure you want to delete the schedule for:',
        DELETE_ASSIGNMENTS_WARNING: 'All employee assignments for this schedule will also be permanently removed.',
        PUBLISH_CONFIRMATION: 'Are you sure you want to publish this schedule? Once published, it will be visible to all employees and editing will be restricted.',

        // Publishing effects
        PUBLISHING_EFFECTS: 'Publishing Effects:',
        EFFECT_VISIBLE_TO_EMPLOYEES: 'Schedule becomes visible to all employees',
        EFFECT_EDITING_RESTRICTED: 'Editing becomes restricted (can be unpublished if needed)',
        EFFECT_NOTIFICATIONS: 'Employees will receive notifications about their assignments',
        EFFECT_APPEARS_IN_DASHBOARDS: 'Schedule appears in employee dashboards and mobile apps',

        // ==============================================
        // TOOLTIPS & HELP TEXT
        // ==============================================
        CLICK_TO_EDIT: 'Click to edit this position',
        CLICK_TO_ADD_EMPLOYEE: 'Click to add an employee to this shift',
        DRAG_TO_REASSIGN: 'Drag to reassign employee',
        SHIFT_REQUIREMENTS: 'This shift requires {count} employee(s)',
        POSITION_EDITING_HELP: 'Click edit to modify assignments for this position',
        SAVE_CHANGES_HELP: 'Save changes to apply modifications to the schedule',

        // ==============================================
        // NOTIFICATIONS & ALERTS
        // ==============================================
        INFO: 'Info',
        SUCCESS: 'Success',
        NOTIFICATION: 'Notification',
        ALERT: 'Alert',

        // ==============================================
        // GENERAL STATUS & INFO
        // ==============================================
        VIEW_DETAILS: 'View Details',
        GENERATION_INFO: 'This may take a few moments depending on the complexity of constraints and chosen algorithm.',
        PROCESSING: 'Processing...',
        COMPLETED: 'Completed',
        FAILED: 'Failed',
        PENDING: 'Pending',
        IN_PROGRESS: 'In Progress',

        // ==============================================
        // TIME & DATE FORMATTING
        // ==============================================
        TODAY: 'Today',
        YESTERDAY: 'Yesterday',
        TOMORROW: 'Tomorrow',
        THIS_WEEK: 'This Week',
        NEXT_WEEK: 'Next Week',
        LAST_WEEK: 'Last Week',
        DATE_FORMAT: 'MM/DD/YYYY',
        TIME_FORMAT: 'HH:mm',

        // ==============================================
        // ACCESSIBILITY & SCREEN READER
        // ==============================================
        SCREEN_READER_SCHEDULE_TABLE: 'Schedule table with employee assignments',
        SCREEN_READER_EDIT_BUTTON: 'Edit assignments for this position',
        SCREEN_READER_REMOVE_BUTTON: 'Remove employee from shift',
        SCREEN_READER_ADD_BUTTON: 'Add employee to shift',
        SCREEN_READER_LOADING: 'Content is loading',

        // Employee Selection Modal
        UNAVAILABLE: 'Unavailable',
        CROSS_POSITION_WARNING: 'These employees have a different primary position but can be assigned if needed.',
        ALREADY_WORKING: 'Already Working',
        CANNOT_WORK_CONSTRAINTS: 'Cannot Work (Constraints)',
        PREFER_DIFFERENT_TIME: 'Prefer Different Time',

        // Position related
        NO_POSITION: 'No position',
        PRIMARY_POSITION: 'Primary position',
        CROSS_POSITION: 'Cross-position',

        // Constraint messages
        HARD_CONSTRAINT: 'Cannot work - personal constraint',
        SOFT_CONSTRAINT: 'Prefers different time',
        ALREADY_ASSIGNED: 'Already working this shift',

        // Rest period messages
        INSUFFICIENT_REST: 'Insufficient rest period',
        REST_PERIOD_VIOLATION: 'Only {actual}h rest (need {required}h)',
    }
};

/**
 * Helper function to interpolate variables into message strings
 * @param {string} message - Message template with {variable} placeholders
 * @param {object} variables - Object with variable values
 * @returns {string} - Interpolated message
 */
export const interpolateMessage = (message, variables = {}) => {
    return message.replace(/\{(\w+)}/g, (match, key) => {
        return variables[key] !== undefined ? variables[key] : match;
    });
};

/**
 * Hook to get messages for a specific language
 * @param {string} language - Language code (default: 'en')
 * @returns {object} - Messages object for the specified language
 */
export const useMessages = (language = 'en') => {
    return MESSAGES[language] || MESSAGES.en;
};

// Default export is the hook since it's the recommended way to use messages
export default useMessages;