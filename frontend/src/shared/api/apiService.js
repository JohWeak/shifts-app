// frontend/src/shared/api/apiService.js
import api from './index';
import { API_ENDPOINTS } from '../config/apiEndpoints';


export const authAPI = {
    loginUser: (credentials) => api.post(API_ENDPOINTS.AUTH.LOGIN, credentials),
};

export const scheduleAPI = {
    fetchSchedules: () => api.get(API_ENDPOINTS.SCHEDULES.BASE),
    fetchScheduleDetails: (scheduleId) => api.get(API_ENDPOINTS.SCHEDULES.DETAILS(scheduleId)),
    fetchWeeklySchedule: (weekStart) => api.get(API_ENDPOINTS.SCHEDULES.WEEKLY, {
        params: weekStart ? { date: weekStart } : {},
    }),
    fetchPositionWeeklySchedule: (positionId, weekStart) => api.get(API_ENDPOINTS.SCHEDULES.WEEKLY_BY_POSITION(positionId), {
        params: weekStart ? { date: weekStart } : {},
    }),
    generateSchedule: (settings) => api.post(API_ENDPOINTS.SCHEDULES.GENERATE, settings),
    updateScheduleStatus: (scheduleId, status) => api.put(API_ENDPOINTS.SCHEDULES.STATUS(scheduleId), { status }),
    deleteSchedule: (scheduleId) => api.delete(API_ENDPOINTS.SCHEDULES.DETAILS(scheduleId)),
    compareAlgorithms: (settings) => api.post(API_ENDPOINTS.SCHEDULES.COMPARE_ALGORITHMS, settings),
    updateScheduleAssignments: (scheduleId, changes) => api.put(API_ENDPOINTS.SCHEDULES.ASSIGNMENTS(scheduleId), { changes }),
    exportSchedule: async (scheduleId, format) => {
        try {
            const response = await api.get(API_ENDPOINTS.SCHEDULES.EXPORT(scheduleId), {
                params: { format },
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `schedule_${scheduleId}.${format}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            return { success: true };
        } catch (error) {
            console.error('Export failed:', error);
            throw error;
        }
    },
    fetchEmployeeArchiveSummary: () => api.get(API_ENDPOINTS.SCHEDULES.EMPLOYEE_ARCHIVE_SUMMARY),
    fetchEmployeeArchiveMonth: (year, month) => api.get(API_ENDPOINTS.SCHEDULES.EMPLOYEE_ARCHIVE_MONTH, {
        params: { year, month },
    }),
    validateScheduleChanges: (scheduleId, changes) => api.post(API_ENDPOINTS.SCHEDULES.VALIDATE(scheduleId), {
        scheduleId,
        changes,
    }),
};

export const worksiteAPI = {
    fetchWorkSites: (params = {}) => api.get(API_ENDPOINTS.WORKSITES.BASE, { params }),
    createWorkSite: (siteData) => api.post(API_ENDPOINTS.WORKSITES.BASE, siteData),
    updateWorkSite: (siteId, data) => api.put(API_ENDPOINTS.WORKSITES.DETAILS(siteId), data),
    deleteWorkSite: (siteId) => api.delete(API_ENDPOINTS.WORKSITES.DETAILS(siteId)),
    restoreWorkSite: (siteId) => api.post(API_ENDPOINTS.WORKSITES.RESTORE(siteId)),
    fetchWorkSiteStats: (siteId, params) => api.get(API_ENDPOINTS.WORKSITES.STATS_OVERVIEW(siteId), { params }),
};

export const employeeAPI = {
    fetchEmployees: (filters) => api.get(API_ENDPOINTS.EMPLOYEES.BASE, { params: filters }),
    fetchEmployeeDetails: (employeeId) => api.get(API_ENDPOINTS.EMPLOYEES.DETAILS(employeeId)),
    createEmployee: (employeeData) => api.post(API_ENDPOINTS.EMPLOYEES.BASE, employeeData),
    updateEmployee: (employeeId, data) => api.put(API_ENDPOINTS.EMPLOYEES.DETAILS(employeeId), data),
    deleteEmployee: (employeeId) => api.delete(API_ENDPOINTS.EMPLOYEES.DETAILS(employeeId)),
    fetchRecommendations: (scheduleId, positionId, shiftId, date, virtualChanges = null) => {
        console.log('fetchRecommendations called with:', {
            scheduleId,
            positionId,
            shiftId,
            date,
            virtualChanges,
        });

        // If there are virtualChanges, send a POST request.
        if (virtualChanges && virtualChanges.length > 0) {
            console.log('Sending POST request with virtualChanges');
            return api.post(API_ENDPOINTS.EMPLOYEES.RECOMMENDATIONS,
                { virtualChanges },
                {
                    params: {
                        position_id: positionId,
                        shift_id: shiftId,
                        date,
                        schedule_id: scheduleId,
                    },
                },
            );
        }

        // Otherwise, a regular GET request
        console.log('Sending GET request without virtualChanges');
        return api.get(API_ENDPOINTS.EMPLOYEES.RECOMMENDATIONS, {
            params: {
                position_id: positionId,
                shift_id: shiftId,
                date,
                schedule_id: scheduleId,
            },
        });
    },
    getEmployeeShifts: () => api.get(API_ENDPOINTS.EMPLOYEES.MY_SHIFTS),
    getProfile: () => apiService.get(API_ENDPOINTS.EMPLOYEES.PROFILE),
    updateProfile: (data) => apiService.put(API_ENDPOINTS.EMPLOYEES.PROFILE, data),
};

export const constraintAPI = {
    getWeeklyConstraints: (params) => api.get(API_ENDPOINTS.CONSTRAINTS.WEEKLY_GRID, { params }),
    submitWeeklyConstraints: (data) => api.post(API_ENDPOINTS.CONSTRAINTS.SUBMIT_WEEKLY, data),
    getMyPermanentRequests: () => api.get(API_ENDPOINTS.CONSTRAINTS.MY_PERMANENT_REQUESTS),
    submitPermanentRequest: (data) => api.post(API_ENDPOINTS.CONSTRAINTS.SUBMIT_PERMANENT_REQUEST, data),
    getMyPermanentConstraints: () => api.get(API_ENDPOINTS.CONSTRAINTS.MY_PERMANENT_CONSTRAINTS),
    getAllPermanentRequests: (params = {}) => api.get(API_ENDPOINTS.CONSTRAINTS.ALL_PERMANENT_REQUESTS, { params }),
    reviewRequest: (requestId, data) => api.put(API_ENDPOINTS.CONSTRAINTS.REVIEW_REQUEST(requestId), data),
    deletePermanentRequest: (requestId) => api.delete(API_ENDPOINTS.CONSTRAINTS.DELETE_PERMANENT_REQUEST(requestId)),
};

export const positionAPI = {
    fetchPositions: (siteId) => api.get(API_ENDPOINTS.WORKSITES.POSITIONS(siteId)),
    fetchAllPositions: () => api.get(API_ENDPOINTS.POSITIONS.BASE),
    createPosition: (positionData) => api.post(API_ENDPOINTS.POSITIONS.BASE, positionData),
    updatePosition: (positionData) => api.put(API_ENDPOINTS.POSITIONS.DETAILS(positionData.pos_id), positionData),
    deletePosition: (positionId) => api.delete(API_ENDPOINTS.POSITIONS.DETAILS(positionId)),
    restorePosition: (positionId) => api.post(API_ENDPOINTS.POSITIONS.RESTORE(positionId)),
    fetchPositionShifts: (positionId, params = {}) => api.get(API_ENDPOINTS.SHIFTS.BY_POSITION(positionId), { params }),
    createPositionShift: (positionId, shiftData) => api.post(API_ENDPOINTS.SHIFTS.BY_POSITION(positionId), shiftData),
    updatePositionShift: (shiftId, shiftData) => api.put(API_ENDPOINTS.SHIFTS.DETAILS(shiftId), shiftData),
    deletePositionShift: (shiftId) => api.delete(API_ENDPOINTS.SHIFTS.DETAILS(shiftId)),
    restorePositionShift: (shiftId) => api.post(`${API_ENDPOINTS.SHIFTS.DETAILS(shiftId)}/restore`),
    fetchRequirementsMatrix: (positionId) => api.get(API_ENDPOINTS.POSITIONS.REQUIREMENTS_MATRIX(positionId)),
};

export const requirementAPI = {
    createShiftRequirement: (shiftId, data) => api.post(API_ENDPOINTS.REQUIREMENTS.BY_SHIFT(shiftId), data),
    updateShiftRequirement: (requirementId, data) => api.put(API_ENDPOINTS.REQUIREMENTS.DETAILS(requirementId), data),
};


export const settingsAPI = {
    fetchSystemSettings: (siteId = null) => api.get(API_ENDPOINTS.SETTINGS.SYSTEM, {
        params: siteId ? { site_id: siteId } : {}
    }),
    updateSystemSettings: (settings, siteId = null) => api.put(API_ENDPOINTS.SETTINGS.SYSTEM, settings, {
        params: siteId ? { site_id: siteId } : {}
    }),
};


export const apiService = {
    ...api, //  get, post, put, delete
    auth: authAPI,
    schedule: scheduleAPI,
    worksite: worksiteAPI,
    employee: employeeAPI,
    constraint: constraintAPI,
    position: positionAPI,
    requirement: requirementAPI,
    settings: settingsAPI,
};

export default apiService;