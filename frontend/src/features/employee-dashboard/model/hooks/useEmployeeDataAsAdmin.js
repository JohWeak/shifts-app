// frontend/src/features/employee-dashboard/model/hooks/useEmployeeDataAsAdmin.js
import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    fetchEmployeeArchiveMonthAsAdmin,
    fetchEmployeeArchiveSummaryAsAdmin,
    fetchEmployeeScheduleAsAdmin,
} from '../employeeDataSlice';
import { fetchWeeklyConstraints } from '../../../employee-constraints/model/constraintSlice';

export const useEmployeeDataAsAdmin = (employeeId) => {
    const dispatch = useDispatch();
    const employeeData = useSelector(state => state.employeeData);

    // Load schedule for specific employee
    const loadSchedule = useCallback((forceRefresh = false) => {
        if (!employeeId) return;
        return dispatch(fetchEmployeeScheduleAsAdmin({ employeeId, forceRefresh }));
    }, [dispatch, employeeId]);

    // Load constraints for specific employee
    const loadConstraints = useCallback((forceRefresh = false) => {
        if (!employeeId) return;
        return dispatch(fetchWeeklyConstraints({ employeeId, forceRefresh }));
    }, [dispatch, employeeId]);

    // Load archive for specific employee
    const loadArchiveSummary = useCallback((forceRefresh = false) => {
        if (!employeeId) return;
        return dispatch(fetchEmployeeArchiveSummaryAsAdmin({ employeeId, forceRefresh }));
    }, [dispatch, employeeId]);

    const loadArchiveMonth = useCallback((year, month, forceRefresh = false) => {
        if (!employeeId) return;
        return dispatch(fetchEmployeeArchiveMonthAsAdmin({ employeeId, year, month, forceRefresh }));
    }, [dispatch, employeeId]);

    // Load initial data when component mounts or employeeId changes
    useEffect(() => {
        if (employeeId) {
            loadSchedule();
            loadConstraints();
            loadArchiveSummary();
        }
    }, [employeeId, loadSchedule, loadConstraints, loadArchiveSummary]);

    return {
        ...employeeData,
        loadSchedule,
        loadConstraints,
        loadArchiveSummary,
        loadArchiveMonth,
    };
};