// frontend/src/features/admin-employee-management/model/hooks/useEmployeeDataAsAdmin.js
import { useCallback, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    fetchEmployeeArchiveMonthAsAdmin,
    fetchEmployeeArchiveSummaryAsAdmin,
    fetchEmployeeConstraintsAsAdmin,
    fetchEmployeeScheduleAsAdmin,
    fetchPositionScheduleAsAdmin,
    setCurrentEmployeeId,
} from '../adminEmployeeDataSlice';

export const useEmployeeDataAsAdmin = (employeeId) => {
    const dispatch = useDispatch();
    const adminEmployeeData = useSelector(state => state.adminEmployeeData);

    // Set current employee ID and clear data if changed
    useEffect(() => {
        if (employeeId) {
            dispatch(setCurrentEmployeeId(employeeId));
        }
    }, [dispatch, employeeId]);

    // Load schedule for specific employee
    const loadSchedule = useCallback((forceRefresh = false) => {
        if (!employeeId) return;
        return dispatch(fetchEmployeeScheduleAsAdmin({ employeeId, forceRefresh }));
    }, [dispatch, employeeId]);

    // Load constraints for specific employee
    const loadConstraints = useCallback((forceRefresh = false) => {
        if (!employeeId) return;
        return dispatch(fetchEmployeeConstraintsAsAdmin({ employeeId, forceRefresh }));
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

    // Load position schedule
    const loadPositionSchedule = useCallback((positionId, forceRefresh = false) => {
        if (!positionId) return;
        return dispatch(fetchPositionScheduleAsAdmin({ positionId, forceRefresh }));
    }, [dispatch]);

    // Load initial data when component mounts or employeeId changes
    useEffect(() => {
        if (employeeId) {
            loadSchedule();
            loadConstraints();
            loadArchiveSummary();
        }
    }, [employeeId, loadSchedule, loadConstraints, loadArchiveSummary]);

    // Extract primitive values to avoid object reference issues
    const {
        currentEmployeeId,
        personalScheduleLoading,
        personalScheduleError,
        positionScheduleLoading,
        positionScheduleError,
        constraintsLoading,
        constraintsError,
        archiveSummaryLoading,
        archiveSummaryError,
        archiveLoading,
        archiveError,
    } = adminEmployeeData;

    // Create stable references for complex objects
    const stablePersonalSchedule = useMemo(() => adminEmployeeData.personalSchedule,
        [JSON.stringify(adminEmployeeData.personalSchedule)]);

    const stablePositionSchedule = useMemo(() => adminEmployeeData.positionSchedule,
        [JSON.stringify(adminEmployeeData.positionSchedule)]);

    const stableConstraints = useMemo(() => adminEmployeeData.constraints,
        [JSON.stringify(adminEmployeeData.constraints)]);

    const stableArchiveSummary = useMemo(() => adminEmployeeData.archiveSummary,
        [JSON.stringify(adminEmployeeData.archiveSummary)]);

    const stableArchiveCache = useMemo(() => adminEmployeeData.archiveCache,
        [JSON.stringify(adminEmployeeData.archiveCache)]);

    // Memoize the return object with stable dependencies
    return useMemo(() => ({
        // Data from redux state
        currentEmployeeId,
        personalSchedule: stablePersonalSchedule,
        personalScheduleLoading,
        personalScheduleError,
        positionSchedule: stablePositionSchedule,
        positionScheduleLoading,
        positionScheduleError,
        constraints: stableConstraints,
        constraintsLoading,
        constraintsError,
        archiveSummary: stableArchiveSummary,
        archiveSummaryLoading,
        archiveSummaryError,
        archiveCache: stableArchiveCache,
        archiveLoading,
        archiveError,
        // Action functions
        loadSchedule,
        loadConstraints,
        loadArchiveSummary,
        loadArchiveMonth,
        loadPositionSchedule,
    }), [
        currentEmployeeId,
        stablePersonalSchedule,
        personalScheduleLoading,
        personalScheduleError,
        stablePositionSchedule,
        positionScheduleLoading,
        positionScheduleError,
        stableConstraints,
        constraintsLoading,
        constraintsError,
        stableArchiveSummary,
        archiveSummaryLoading,
        archiveSummaryError,
        stableArchiveCache,
        archiveLoading,
        archiveError,
        loadSchedule,
        loadConstraints,
        loadArchiveSummary,
        loadArchiveMonth,
        loadPositionSchedule,
    ]);
};