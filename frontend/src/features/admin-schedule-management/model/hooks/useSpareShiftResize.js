// frontend/src/features/admin-schedule-management/model/hooks/useSpareShiftResize.js

import {useCallback, useRef, useState} from 'react';
import {useSelector} from 'react-redux';

export const useSpareShiftResize = (onResizeComplete = null) => {
    // Get legal constraints from system settings
    const systemSettings = useSelector(state => state.settings?.systemSettings);
    // TODO: Add maxDailyHours to system settings API response
    const MAX_DAILY_HOURS = systemSettings?.maxDailyHours || 12; // Fallback to 12 if not available
    const [isResizing, setIsResizing] = useState(false);
    const [resizeData, setResizeData] = useState(null);
    const [tempTime, setTempTime] = useState(null);

    const resizeDataRef = useRef(null);
    const isResizingRef = useRef(false);
    const tempTimeRef = useRef(null);

    // Stable functions for event listeners
    const handleResizeMove = useCallback((event) => {
        if (!isResizingRef.current || !resizeDataRef.current) return;
        
        // Removed frequent mouse move logs

        const resizeData = resizeDataRef.current;
        const deltaY = event.clientY - resizeData.startY;
        const timeChangeMinutes = Math.round(deltaY / 12) * 30; // Increased sensitivity: 12px = 30min (was 20px)

        const parseTime = (timeStr) => {
            if (!timeStr || typeof timeStr !== 'string') {
                console.warn('Invalid timeStr:', timeStr);
                return 0;
            }
            const [hours, minutes] = timeStr.split(':').map(Number);
            return hours * 60 + minutes;
        };

        const formatTime = (totalMinutes) => {
            const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
            const mins = (totalMinutes % (24 * 60)) % 60;
            return `${hours.toString().padStart(2, '0')}:${Math.abs(mins).toString().padStart(2, '0')}`;
        };

        let newStartTime = resizeData.originalStartTime;
        let newEndTime = resizeData.originalEndTime;

        // Check if this is a spare shift
        const isSpareShift = resizeData.employee.assignment_type === 'spare';
        
        if (resizeData.direction === 'start') {
            // Adjust start time
            const startMinutes = parseTime(resizeData.originalStartTime) + timeChangeMinutes;
            if (isSpareShift) {
                // For spare shifts, limit to 7:00 minimum
                newStartTime = formatTime(Math.max(7 * 60, startMinutes)); // 7:00 = 420 minutes
            } else {
                newStartTime = formatTime(Math.max(0, startMinutes));
            }
        } else {
            // Adjust end time
            const endMinutes = parseTime(resizeData.originalEndTime) + timeChangeMinutes;
            if (isSpareShift) {
                // For spare shifts, limit to 19:00 maximum
                newEndTime = formatTime(Math.min(19 * 60, endMinutes)); // 19:00 = 1140 minutes
            } else {
                newEndTime = formatTime(Math.max(0, endMinutes));
            }
        }

        // Validate duration constraints (minimum 1 hour, maximum 12 hours)
        const startMins = parseTime(newStartTime);
        const endMins = parseTime(newEndTime);
        let duration = endMins - startMins;

        // Handle overnight shifts
        if (duration <= 0) {
            duration = (24 * 60 - startMins) + endMins;
        }

        // Check legal constraints: minimum 1 hour, maximum from system settings
        if (duration >= 60 && duration <= MAX_DAILY_HOURS * 60) { // 1-12 hours
            const newTempTime = {
                start_time: newStartTime,
                end_time: newEndTime,
                duration: Math.round(duration / 60 * 10) / 10 // Round to 0.1h
            };

            // Only update if time actually changed
            const currentTime = tempTimeRef.current;
            if (!currentTime || 
                currentTime.start_time !== newTempTime.start_time || 
                currentTime.end_time !== newTempTime.end_time) {
                
                console.log('🕐 Time updated during move:', newTempTime);
                setTempTime(newTempTime);
                tempTimeRef.current = newTempTime;
            }
        } else if (duration < 60) {
            console.log('⚠️ Duration too short:', duration, 'minutes');
        } else if (duration > MAX_DAILY_HOURS * 60) {
            console.log('⚠️ Duration too long:', duration, `minutes (max ${MAX_DAILY_HOURS} hours)`);
        }
    }, []);

    const handleResizeEnd = useCallback(() => {
        if (!isResizingRef.current || !resizeDataRef.current) return;

        // Remove global listeners
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);

        // Remove visual feedback
        document.body.style.cursor = '';
        const resizingElements = document.querySelectorAll('.resizing');
        resizingElements.forEach(el => el.classList.remove('resizing'));

        // Get current values from ref - don't rely on closure
        const currentTempTime = tempTimeRef.current;
        
        console.log('🔄 handleResizeEnd - currentTempTime from ref:', currentTempTime);
        
        // Apply the resize if valid
        if (currentTempTime && onResizeComplete) {
            const resizeResult = {
                employee: resizeDataRef.current.employee,
                cellData: resizeDataRef.current.cellData,
                newTimes: currentTempTime,
                direction: resizeDataRef.current.direction
            };

            console.log('✅ Resize completed, calling onResizeComplete:', resizeResult);
            onResizeComplete(resizeResult);
        } else {
            console.log('❌ Resize not applied:', { tempTime: currentTempTime, hasCallback: !!onResizeComplete });
        }

        // Reset state
        setIsResizing(false);
        setResizeData(null);
        setTempTime(null);
        resizeDataRef.current = null;
        isResizingRef.current = false;
        tempTimeRef.current = null;
    }, [tempTime, onResizeComplete, handleResizeMove]);

    const handleResizeStart = useCallback((event, direction, employee, cellData) => {
        event.preventDefault();
        event.stopPropagation();

        // Check if this is a spare shift resize - for spare shifts, use fixed 7:00-19:00 times
        const isSpareShiftResize = employee.assignment_type === 'spare';
        
        let originalStartTime, originalEndTime;
        
        if (isSpareShiftResize) {
            // For spare shifts, always use 7:00-19:00 range
            originalStartTime = employee.custom_start_time || '07:00';
            originalEndTime = employee.custom_end_time || '19:00';
        } else {
            // For regular employees, use their shift times
            const defaultStartTime = '08:00';
            const defaultEndTime = '16:00';
            
            // Convert shift times from "HH:MM:SS" to "HH:MM" format
            const shiftStartTime = employee.shift_start_time?.substring(0, 5);
            const shiftEndTime = employee.shift_end_time?.substring(0, 5);
            
            originalStartTime = employee.custom_start_time || employee.start_time || shiftStartTime || defaultStartTime;
            originalEndTime = employee.custom_end_time || employee.end_time || shiftEndTime || defaultEndTime;
        }

        // Debug removed

        const newResizeData = {
            direction,
            employee,
            cellData,
            startY: event.clientY,
            originalStartTime,
            originalEndTime,
        };

        setIsResizing(true);
        setResizeData(newResizeData);
        setTempTime(null);
        resizeDataRef.current = newResizeData;
        isResizingRef.current = true;
        tempTimeRef.current = null;

        // Add global mouse move and mouse up listeners
        document.addEventListener('mousemove', handleResizeMove);
        document.addEventListener('mouseup', handleResizeEnd);

        // Add visual feedback
        document.body.style.cursor = direction === 'start' ? 'n-resize' : 's-resize';
        const employeeElement = event.target.closest('.draggable-employee');
        if (employeeElement) {
            employeeElement.classList.add('resizing');
        }
    }, []);


    const cancelResize = useCallback(() => {
        if (isResizing) {
            document.removeEventListener('mousemove', handleResizeMove);
            document.removeEventListener('mouseup', handleResizeEnd);
            document.body.style.cursor = '';

            const resizingElements = document.querySelectorAll('.resizing');
            resizingElements.forEach(el => el.classList.remove('resizing'));

            setIsResizing(false);
            setResizeData(null);
            setTempTime(null);
            tempTimeRef.current = null;
        }
    }, [isResizing, handleResizeMove, handleResizeEnd]);

    return {
        isResizing,
        resizeData,
        tempTime,
        handleResizeStart,
        cancelResize,
    };
};