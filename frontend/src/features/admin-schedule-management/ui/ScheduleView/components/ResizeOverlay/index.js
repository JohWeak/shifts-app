// ResizeOverlay - shows real-time stretching during resize
import React from 'react';
import './ResizeOverlay.css';

const ResizeOverlay = ({ 
    resizeData, 
    tempTime, 
    formatEmployeeName, 
    shifts, 
    weekDates 
}) => {
    if (!resizeData || !tempTime) return null;

    // Find the cell being resized
    const cellData = resizeData.cellData;
    const employee = resizeData.employee;
    
    // Find start cell
    const startCell = document.querySelector(
        `td[data-position-id="${cellData.positionId}"][data-shift-id="${cellData.shiftId}"][data-date="${cellData.date}"]`
    );
    
    if (!startCell) return null;
    
    // Calculate partial stretching based on exact time
    const startTimeMinutes = parseTimeToMinutes(tempTime.start_time);
    const endTimeMinutes = parseTimeToMinutes(tempTime.end_time);
    
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
    
    // Find end cell
    let endCell = startCell; // Default to same cell
    if (endShift && endShift.shift_id !== cellData.shiftId) {
        endCell = document.querySelector(
            `td[data-position-id="${cellData.positionId}"][data-shift-id="${endShift.shift_id}"][data-date="${cellData.date}"]`
        ) || startCell;
    }
    
    // Calculate position with partial stretching
    const startRect = startCell.getBoundingClientRect();
    const endRect = endCell.getBoundingClientRect();
    const tableRect = startCell.closest('table').getBoundingClientRect();
    
    // Check if stretching vertically (different rows) or horizontally (different columns)
    const isVerticalStretch = Math.abs(startRect.top - endRect.top) > Math.abs(startRect.left - endRect.left);
    
    let position;
    
    if (isVerticalStretch) {
        // Calculate partial height based on end time within the end shift
        let height = endRect.bottom - startRect.top;
        
        if (endShift && endShift.shift_id !== cellData.shiftId) {
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
        
        if (endShift && endShift.shift_id !== cellData.shiftId) {
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

    // Helper function
    function parseTimeToMinutes(timeStr) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    }

    return (
        <div 
            className="resize-overlay"
            style={{
                position: 'absolute',
                left: position.left,
                top: position.top,
                width: position.width,
                height: position.height,
                backgroundColor: 'rgba(255, 193, 7, 0.3)', // Yellow for active resize
                border: '2px solid #ffc107',
                borderRadius: '4px',
                padding: '4px 8px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1001,
                pointerEvents: 'none'
            }}
        >
            <span className="employee-name fw-bold">
                {formatEmployeeName ? formatEmployeeName(employee) : employee.name}
            </span>
            <small className="text-warning fw-bold">
                {tempTime.start_time?.substring(0, 5)}
                -
                {tempTime.end_time?.substring(0, 5)}
                <span className="ms-1">({tempTime.duration}h)</span>
            </small>
        </div>
    );
};

export default ResizeOverlay;