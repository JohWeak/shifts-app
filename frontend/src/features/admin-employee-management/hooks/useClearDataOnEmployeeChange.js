// frontend/src/features/admin-employee-management/hooks/useClearDataOnEmployeeChange.js
import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { clearAllCache } from 'features/employee-dashboard/model/employeeDataSlice';
import { clearRequestsData } from 'features/employee-requests/model/requestsSlice';
import { clearConstraintsData } from 'features/employee-constraints/model/constraintSlice';

export const useClearDataOnEmployeeChange = (employeeId) => {
    const dispatch = useDispatch();
    const previousEmployeeId = useRef(null);

    useEffect(() => {
        if (employeeId && previousEmployeeId.current && previousEmployeeId.current !== employeeId) {
            // Employee ID changed, clear all cached data across all slices
            dispatch(clearAllCache());
            dispatch(clearRequestsData());
            dispatch(clearConstraintsData());
        }
        previousEmployeeId.current = employeeId;
    }, [employeeId, dispatch]);
};