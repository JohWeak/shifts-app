// frontend/src/features/admin-schedule-management/ui/ScheduleView/components/StretchedEmployee/index.js
import React from 'react';
import './StretchedEmployee.css';

const StretchedEmployee = ({ 
    employee, 
    startCell, 
    endCell, 
    customTimes,
    formatEmployeeName,
    isPending = false,
    shifts = [],
    originalShift = null
}) => {
    if (!startCell || !endCell) return null;
    
    // Debug removed

    const calculatePosition = () => {
        // Use the same partial stretching logic as ResizeOverlay
        if (!customTimes) return null;
        
        const endTimeMinutes = parseTimeToMinutes(customTimes.end_time);
        
        // Find which shift the end time falls into
        const endShift = shifts.find(shift => {
            const shiftStart = parseTimeToMinutes(shift.start_time.substring(0, 5));
            const shiftEnd = parseTimeToMinutes(shift.end_time.substring(0, 5));
            
            if (shiftEnd < shiftStart) {
                // Overnight shift
                return endTimeMinutes >= shiftStart || endTimeMinutes <= shiftEnd;
            } else {
                return endTimeMinutes >= shiftStart && endTimeMinutes <= shiftEnd;
            }
        });
        
        // Use endCell that was found, but calculate partial stretching
        const startRect = startCell.getBoundingClientRect();
        const endRect = endCell.getBoundingClientRect();
        const tableRect = startCell.closest('table').getBoundingClientRect();
        
        // Check if stretching vertically (different rows) or horizontally (different columns)
        const isVerticalStretch = Math.abs(startRect.top - endRect.top) > Math.abs(startRect.left - endRect.left);
        
        let position;
        
        if (isVerticalStretch) {
            // Calculate partial height based on end time within the end shift
            let height = endRect.bottom - startRect.top;
            
            if (endShift && originalShift && endShift.shift_id !== originalShift.shift_id) {
                // Calculate how far into the end shift we should stretch
                const endShiftStart = parseTimeToMinutes(endShift.start_time.substring(0, 5));
                const endShiftEnd = parseTimeToMinutes(endShift.end_time.substring(0, 5));
                const endShiftDuration = endShiftEnd - endShiftStart;
                
                if (endShiftDuration > 0) {
                    const progressIntoEndShift = (endTimeMinutes - endShiftStart) / endShiftDuration;
                    const partialEndCellHeight = endRect.height * Math.max(0, Math.min(1, progressIntoEndShift));
                    height = (endRect.top - startRect.top) + partialEndCellHeight;
                }
            }
            
            position = {
                left: startRect.left - tableRect.left,
                top: startRect.top - tableRect.top,
                width: startRect.width,
                height: height
            };
        } else {
            // Horizontal stretching with partial width
            let width = endRect.right - startRect.left;
            
            if (endShift && originalShift && endShift.shift_id !== originalShift.shift_id) {
                const endShiftStart = parseTimeToMinutes(endShift.start_time.substring(0, 5));
                const endShiftEnd = parseTimeToMinutes(endShift.end_time.substring(0, 5));
                const endShiftDuration = endShiftEnd - endShiftStart;
                
                if (endShiftDuration > 0) {
                    const progressIntoEndShift = (endTimeMinutes - endShiftStart) / endShiftDuration;
                    const partialEndCellWidth = endRect.width * Math.max(0, Math.min(1, progressIntoEndShift));
                    width = (endRect.left - startRect.left) + partialEndCellWidth;
                }
            }
            
            position = {
                left: startRect.left - tableRect.left,
                top: startRect.top - tableRect.top,
                width: width,
                height: startRect.height
            };
        }
        
        return position;
    };
    
    // Helper function
    function parseTimeToMinutes(timeStr) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    }

    const position = calculatePosition();
    
    if (!position) return null;

    return (
        <div 
            className="stretched-employee"
            style={{
                position: 'absolute',
                left: position.left,
                top: position.top,
                width: position.width,
                height: position.height,
                backgroundColor: isPending ? 'rgba(40, 167, 69, 0.2)' : 'rgba(156, 39, 176, 0.2)',
                border: isPending ? '2px solid #28a745' : '2px solid #9c27b0',
                borderRadius: '4px',
                padding: '4px 8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                zIndex: 1000,
                pointerEvents: 'none'
            }}
        >
            <span className="employee-name fw-bold text-dark">
                {employee.name || `Employee ${employee.emp_id}`}
            </span>
            {customTimes && (
                <small className="text-primary fw-bold">
                    {customTimes.start_time?.substring(0, 5)}
                    -
                    {customTimes.end_time?.substring(0, 5)}
                </small>
            )}
        </div>
    );
};

export default StretchedEmployee;