// frontend/src/features/employee-dashboard/hooks/useEmployeeData.js
import { useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    fetchEmployeeSchedule,
    fetchEmployeeConstraints,
    fetchEmployeeArchiveSummary,
    checkScheduleUpdates,
    selectNewUpdatesCount,
    setDashboardStats,
} from '../model/employeeDataSlice';

export const useEmployeeData = () => {
    const dispatch = useDispatch();
    const employeeData = useSelector(state => state.employeeData);
    const intervalRef = useRef(null);

    // Load schedule with cache
    const loadSchedule = useCallback((forceRefresh = false) => {
        return dispatch(fetchEmployeeSchedule({ forceRefresh }));
    }, [dispatch]);

    // Load constraints with cache
    const loadConstraints = useCallback((weekStart, forceRefresh = false) => {
        return dispatch(fetchEmployeeConstraints({ weekStart, forceRefresh }));
    }, [dispatch]);

    // Load archive with cache
    const loadArchive = useCallback((month, forceRefresh = false) => {
        return dispatch(fetchEmployeeArchiveSummary({ month, forceRefresh }));
    }, [dispatch]);

    // 2. Создаем новую функцию, которая будет диспатчить действие
    const setStats = useCallback((stats) => {
        dispatch(setDashboardStats(stats));
    }, [dispatch]);

    // Set up periodic update checks
    useEffect(() => {
        // Initial check
        dispatch(checkScheduleUpdates());

        // Check for updates every 30 seconds
        intervalRef.current = setInterval(() => {
            dispatch(checkScheduleUpdates());
        }, 30000);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [dispatch]);

    return {
        ...employeeData,
        loadSchedule,
        loadConstraints,
        loadArchive,
        setDashboardStats: setStats, // 3. Возвращаем эту функцию под нужным именем
    };
};