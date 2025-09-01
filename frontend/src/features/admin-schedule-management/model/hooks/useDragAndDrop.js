import {useCallback, useState} from 'react';

export const useDragAndDrop = (isEditMode, pendingChanges = {}, assignments = [], positions = [], onCreateFlexibleShift = null) => {
    const [draggedItem, setDraggedItem] = useState(null);
    const [dragOverEmployeeId, setDragOverEmployeeId] = useState(null);
    const [isSpanning, setIsSpanning] = useState(false);
    // const [spanningCells, setSpanningCells] = useState([]); // Not used yet


    const checkEmployeeInCellWithTempChanges = useCallback((empId, cell, tempChanges) => {

        const hasPendingRemoval = Object.values(tempChanges).some(change => {
            return change.action === 'remove' &&
                change.empId === empId &&
                change.date === cell.date &&
                change.shiftId === cell.shiftId &&
                change.positionId === cell.positionId;
        });

        if (hasPendingRemoval) {
            return false;
        }
        const existingInCell = assignments.some(emp => {
            return emp.emp_id === empId &&
                emp.work_date === cell.date &&
                emp.shift_id === cell.shiftId &&
                emp.position_id === cell.positionId;
        });

        if (existingInCell) {
            return true;
        }

        return Object.values(tempChanges).some(change => {
            return change.action === 'assign' &&
                change.empId === empId &&
                change.date === cell.date &&
                change.shiftId === cell.shiftId &&
                change.positionId === cell.positionId;
        });
    }, [assignments]);

    const checkEmployeeInCell = useCallback((empId, cell) => {
        if (!cell || cell.date === undefined || cell.shiftId === undefined || cell.positionId === undefined) {
            console.error('Invalid cell data:', cell);
            return false;
        }

        if (!empId) {
            console.error('Invalid empId:', empId);
            return false;
        }

        const hasPendingRemoval = Object.values(pendingChanges).some(change => {
            return change.action === 'remove' &&
                change.empId === empId &&
                change.date === cell.date &&
                change.shiftId === cell.shiftId &&
                change.positionId === cell.positionId;
        });

        if (hasPendingRemoval) {
            console.log('Employee has pending removal from this cell, can be re-added');
            return false;
        }

        const existingInCell = assignments.some(emp => {
            return emp.emp_id === empId &&
                emp.work_date === cell.date &&
                emp.shift_id === cell.shiftId &&
                emp.position_id === cell.positionId;
        });

        if (existingInCell) {

            console.log('Employee exists in cell without pending removal');
            return true;
        }

        const hasPendingAddition = Object.values(pendingChanges).some(change => {
            return change.action === 'assign' &&
                change.empId === empId &&
                change.date === cell.date &&
                change.shiftId === cell.shiftId &&
                change.positionId === cell.positionId;
        });

        if (hasPendingAddition) {
            console.log('Employee has pending addition to this cell');
            return true;
        }

        return false;
    }, [pendingChanges, assignments]);

    // Check if dragging across multiple cells to create flexible shift
    const detectSpanningAttempt = useCallback((fromCell, targetCell, currentPosition) => {
        if (!fromCell || !targetCell || !currentPosition) return false;
        
        // Same position, different dates or shifts
        const samePosition = fromCell.positionId === targetCell.positionId;
        const differentCells = fromCell.date !== targetCell.date || fromCell.shiftId !== targetCell.shiftId;
        
        // Additional check for cross-day spanning
        if (samePosition && differentCells) {
            const fromDate = new Date(fromCell.date);
            const targetDate = new Date(targetCell.date);
            const dayDiff = Math.abs((targetDate - fromDate) / (1000 * 60 * 60 * 24));
            
            // Allow spanning within 2 consecutive days for cross-day shifts
            return dayDiff <= 1 && differentCells;
        }
        
        return samePosition && differentCells;
    }, []);

    // Calculate spanning cells and time range
    const calculateSpanningDetails = useCallback((fromCell, targetCell, positionData) => {
        if (!positionData || !positionData.shifts) return null;
        
        const fromShift = positionData.shifts.find(s => s.id === fromCell.shiftId);
        const targetShift = positionData.shifts.find(s => s.id === targetCell.shiftId);
        
        if (!fromShift || !targetShift || fromShift.is_flexible || targetShift.is_flexible) {
            return null; // Can't span with or to flexible shifts
        }

        // Check if this is cross-day spanning
        const isCrossDay = fromCell.date !== targetCell.date;
        const fromDate = new Date(fromCell.date);
        const targetDate = new Date(targetCell.date);
        const isConsecutiveDays = Math.abs((targetDate - fromDate) / (1000 * 60 * 60 * 24)) === 1;

        let start_time, end_time, suggested_name, spanning_shifts;
        
        if (isCrossDay && isConsecutiveDays) {
            // Cross-day spanning: earlier date shift to later date shift
            if (fromDate < targetDate) {
                start_time = fromShift.start_time;
                end_time = targetShift.end_time;
                suggested_name = `Cross-day ${fromShift.start_time.substring(0,5)}-${targetShift.end_time.substring(0,5)}`;
            } else {
                start_time = targetShift.start_time;
                end_time = fromShift.end_time;
                suggested_name = `Cross-day ${targetShift.start_time.substring(0,5)}-${fromShift.end_time.substring(0,5)}`;
            }
            spanning_shifts = [fromShift.id, targetShift.id];
        } else {
            // Same day spanning
            const times = [
                { time: fromShift.start_time, shift: fromShift },
                { time: targetShift.start_time, shift: targetShift }
            ].sort((a, b) => a.time.localeCompare(b.time));

            const endTimes = [
                { time: fromShift.end_time, shift: fromShift },
                { time: targetShift.end_time, shift: targetShift }
            ].sort((a, b) => b.time.localeCompare(a.time));

            start_time = times[0].time;
            end_time = endTimes[0].time;
            spanning_shifts = [fromShift.id, targetShift.id];
            suggested_name = `Flexible ${start_time.substring(0,5)}-${end_time.substring(0,5)}`;
        }
        
        // Check for overnight shifts
        const startHour = parseInt(start_time.split(':')[0]);
        const endHour = parseInt(end_time.split(':')[0]);
        const isOvernight = endHour < startHour || isCrossDay;
        
        return {
            start_time,
            end_time,
            spanning_shifts,
            is_overnight: isOvernight,
            is_cross_day: isCrossDay,
            suggested_name,
            date: fromCell.date < targetCell.date ? fromCell.date : targetCell.date, // Use earlier date
            end_date: isCrossDay ? (fromCell.date > targetCell.date ? fromCell.date : targetCell.date) : null
        };
    }, []);

    const checkForDuplicateOnSwap = useCallback((draggedEmp, fromCell, targetEmp, targetCell) => {
        const tempChanges = {...pendingChanges};
        const timestamp = Date.now();

        tempChanges[`temp-${timestamp}-1`] = {
            action: 'remove',
            empId: draggedEmp.empId,
            date: fromCell.date,
            shiftId: fromCell.shiftId,
            positionId: fromCell.positionId
        };

        tempChanges[`temp-${timestamp}-2`] = {
            action: 'remove',
            empId: targetEmp.empId,
            date: targetCell.date,
            shiftId: targetCell.shiftId,
            positionId: targetCell.positionId
        };

        const draggedWillDuplicate = checkEmployeeInCellWithTempChanges(
            draggedEmp.empId,
            targetCell,
            tempChanges
        );

        const targetWillDuplicate = checkEmployeeInCellWithTempChanges(
            targetEmp.empId,
            fromCell,
            tempChanges
        );

        return draggedWillDuplicate || targetWillDuplicate;
    }, [pendingChanges, checkEmployeeInCellWithTempChanges]);

    const handleDragStart = useCallback((e, employee, fromCell) => {
        if (!isEditMode) return;
        setDraggedItem({employee, fromCell});
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', employee.empId);
        e.currentTarget.classList.add('dragging');
    }, [isEditMode]);

    const handleDragEnd = useCallback(() => {
        if (!isEditMode) return;
        setDraggedItem(null);
        setDragOverEmployeeId(null);
        document.querySelectorAll('.dragging').forEach(el => el.classList.remove('dragging'));
        document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
    }, [isEditMode]);

    const handleDragOver = useCallback((e, targetCell) => {
        if (!isEditMode || !draggedItem) return;
        e.preventDefault();

        const targetEmployeeEl = e.target.closest('.draggable-employee');
        const targetEmployeeData = targetEmployeeEl ?
            JSON.parse(targetEmployeeEl.dataset.employeeData || '{}') : null;

        // Check for spanning attempt
        const currentPosition = positions.find(p => p.pos_id === targetCell.positionId);
        const isSpanningAttempt = detectSpanningAttempt(draggedItem.fromCell, targetCell, currentPosition);
        
        if (isSpanningAttempt && !targetEmployeeData) {
            setIsSpanning(true);
            const spanDetails = calculateSpanningDetails(draggedItem.fromCell, targetCell, currentPosition);
            if (spanDetails) {
                e.currentTarget.classList.add('spanning-attempt');
                e.dataTransfer.dropEffect = 'copy'; // Visual indicator for flexible shift creation
                return;
            }
        } else {
            setIsSpanning(false);
            e.currentTarget.classList.remove('spanning-attempt');
        }

        if (targetEmployeeData && targetEmployeeData.empId) {
            setDragOverEmployeeId(targetEmployeeData.empId);

            if (draggedItem.employee.empId !== targetEmployeeData.empId) {
                const wouldCreateDuplicate = checkForDuplicateOnSwap(
                    draggedItem.employee,
                    draggedItem.fromCell,
                    targetEmployeeData,
                    targetCell
                );

                if (wouldCreateDuplicate) {
                    targetEmployeeEl.classList.add('is-duplicate');
                    e.dataTransfer.dropEffect = 'none';
                } else {
                    targetEmployeeEl.classList.remove('is-duplicate');
                    e.dataTransfer.dropEffect = 'move';
                }
            }
        } else {
            setDragOverEmployeeId(null);

            const wouldCreateDuplicate = checkEmployeeInCell(
                draggedItem.employee.empId,
                targetCell
            );

            if (wouldCreateDuplicate) {
                e.currentTarget.classList.add('has-duplicate');
                e.dataTransfer.dropEffect = 'none';
            } else {
                e.currentTarget.classList.remove('has-duplicate');
                e.dataTransfer.dropEffect = 'move';
            }
        }

        e.currentTarget.classList.add('drag-over');
    }, [isEditMode, draggedItem, checkEmployeeInCell, checkForDuplicateOnSwap]);

    const handleDragLeave = useCallback((e) => {
        if (!isEditMode) return;

        if (!e.currentTarget.contains(e.relatedTarget)) {
            e.currentTarget.classList.remove('drag-over', 'has-duplicate');

            const employees = e.currentTarget.querySelectorAll('.draggable-employee');
            employees.forEach(el => el.classList.remove('is-duplicate', 'drag-over'));

            setDragOverEmployeeId(null);
        }
    }, [isEditMode]);

    const handleDragEnterEmployee = useCallback((targetEmpId) => {
        if (draggedItem && draggedItem.employee.empId !== targetEmpId) {
            setDragOverEmployeeId(targetEmpId);
        }
    }, [draggedItem]);

    const handleDragLeaveEmployee = useCallback(() => {
        setDragOverEmployeeId(null);
    }, []);


    const createChangesOnDrop = useCallback((targetCell, targetEmployee = null) => {
        if (!draggedItem) {
            console.log('No dragged item');
            return [];
        }

        if (!targetCell || !targetCell.date || targetCell.shiftId === undefined || targetCell.positionId === undefined) {
            console.error('Invalid target cell:', targetCell);
            return [];
        }

        const {employee: dragged, fromCell} = draggedItem;

        if (!fromCell || !fromCell.date || fromCell.shiftId === undefined || fromCell.positionId === undefined) {
            console.error('Invalid from cell:', fromCell);
            return [];
        }

        const changes = [];
        const timestamp = Date.now();

        // Check for flexible shift creation (spanning)
        const currentPosition = positions.find(p => p.pos_id === targetCell.positionId);
        const isSpanningAttempt = detectSpanningAttempt(fromCell, targetCell, currentPosition);
        
        if (isSpanningAttempt && !targetEmployee && onCreateFlexibleShift) {
            console.log('Flexible shift creation detected');
            const spanDetails = calculateSpanningDetails(fromCell, targetCell, currentPosition);
            
            if (spanDetails) {
                // Trigger flexible shift creation
                const dragContext = {
                    start_time: spanDetails.start_time,
                    end_time: spanDetails.end_time,
                    employeeId: dragged.empId,
                    employeeName: dragged.name,
                    positionId: targetCell.positionId,
                    date: spanDetails.date,
                    spanning_shifts: spanDetails.spanning_shifts
                };
                
                onCreateFlexibleShift(dragContext);
                
                // Return empty changes as the flexible shift creation will be handled by the modal
                return [{
                    action: 'createFlexibleShift',
                    dragContext
                }];
            }
        }


        if (fromCell.date === targetCell.date &&
            fromCell.shiftId === targetCell.shiftId &&
            fromCell.positionId === targetCell.positionId) {
            console.log('Dropping in same cell, cancelling');
            return [];
        }

        // SWAP
        if (targetEmployee && targetEmployee.empId !== dragged.empId) {
            console.log('SWAP operation detected');


            const tempPendingChanges = {...pendingChanges};

            tempPendingChanges[`temp-${timestamp}-1`] = {
                action: 'remove',
                empId: dragged.empId,
                date: fromCell.date,
                shiftId: fromCell.shiftId,
                positionId: fromCell.positionId
            };

            tempPendingChanges[`temp-${timestamp}-2`] = {
                action: 'remove',
                empId: targetEmployee.empId,
                date: targetCell.date,
                shiftId: targetCell.shiftId,
                positionId: targetCell.positionId
            };

            const draggedWillDuplicate = checkEmployeeInCellWithTempChanges(
                dragged.empId,
                targetCell,
                tempPendingChanges
            );

            const targetWillDuplicate = checkEmployeeInCellWithTempChanges(
                targetEmployee.empId,
                fromCell,
                tempPendingChanges
            );

            if (draggedWillDuplicate || targetWillDuplicate) {
                console.warn('SWAP would create duplicates');
                return [{
                    action: 'error',
                    message: 'Cannot swap: employee already assigned to this shift'
                }];
            }

            console.log('SWAP is valid, creating changes');


            if (!draggedWillDuplicate && !targetWillDuplicate) {
                if (dragged.isPending && dragged.pendingKey) {
                    changes.push({
                        action: 'removePending',
                        pendingKey: dragged.pendingKey
                    });
                } else {
                    changes.push({
                        key: `remove-${dragged.empId}-${timestamp}-from`,
                        change: {
                            action: 'remove',
                            date: fromCell.date,
                            shiftId: fromCell.shiftId,
                            positionId: fromCell.positionId,
                            empId: dragged.empId,
                            assignmentId: dragged.assignmentId
                        }
                    });
                }

                if (targetEmployee.isPending && targetEmployee.pendingKey) {
                    changes.push({
                        action: 'removePending',
                        pendingKey: targetEmployee.pendingKey
                    });
                } else {
                    changes.push({
                        key: `remove-${targetEmployee.empId}-${timestamp}-target`,
                        change: {
                            action: 'remove',
                            date: targetCell.date,
                            shiftId: targetCell.shiftId,
                            positionId: targetCell.positionId,
                            empId: targetEmployee.empId,
                            assignmentId: targetEmployee.assignmentId
                        }
                    });
                }

                changes.push({
                    key: `assign-${dragged.empId}-${timestamp}-to-target`,
                    change: {
                        action: 'assign',
                        date: targetCell.date,
                        shiftId: targetCell.shiftId,
                        positionId: targetCell.positionId,
                        empId: dragged.empId,
                        empName: dragged.name
                    }
                });

                changes.push({
                    key: `assign-${targetEmployee.empId}-${timestamp}-to-from`,
                    change: {
                        action: 'assign',
                        date: fromCell.date,
                        shiftId: fromCell.shiftId,
                        positionId: fromCell.positionId,
                        empId: targetEmployee.empId,
                        empName: targetEmployee.name
                    }
                });
            }
        } else if (!targetEmployee) {
            console.log('MOVE operation detected');

            const tempPendingChanges = {...pendingChanges};

            if (!dragged.isPending) {
                tempPendingChanges[`temp-${timestamp}`] = {
                    action: 'remove',
                    empId: dragged.empId,
                    date: fromCell.date,
                    shiftId: fromCell.shiftId,
                    positionId: fromCell.positionId
                };
            }
            const alreadyInTarget = checkEmployeeInCellWithTempChanges(
                dragged.empId,
                targetCell,
                tempPendingChanges
            );

            if (alreadyInTarget) {
                console.warn('Employee already in target cell');
                return [{
                    action: 'error',
                    message: 'Employee already assigned to this shift'
                }];
            }

            console.log('MOVE is valid, creating changes');

            if (dragged.isPending && dragged.pendingKey) {
                changes.push({
                    action: 'removePending',
                    pendingKey: dragged.pendingKey
                });
            } else {
                changes.push({
                    key: `remove-${dragged.empId}-${timestamp}-origin`,
                    change: {
                        action: 'remove',
                        date: fromCell.date,
                        shiftId: fromCell.shiftId,
                        positionId: fromCell.positionId,
                        empId: dragged.empId,
                        assignmentId: dragged.assignmentId
                    }
                });
            }

            // 2. Add to new location
            changes.push({
                key: `assign-${dragged.empId}-${timestamp}-new`,
                change: {
                    action: 'assign',
                    date: targetCell.date,
                    shiftId: targetCell.shiftId,
                    positionId: targetCell.positionId,
                    empId: dragged.empId,
                    empName: dragged.name
                }
            });
        }

        console.log('Created changes:', changes);
        return changes;
    }, [draggedItem, pendingChanges, checkEmployeeInCellWithTempChanges, positions, detectSpanningAttempt, calculateSpanningDetails, onCreateFlexibleShift]);


    return {
        dragOverEmployeeId,
        isSpanning,
        // spanningCells, // Not used yet
        handleDragStart,
        handleDragEnd,
        handleDragOver,
        handleDragLeave,
        handleDragEnterEmployee,
        handleDragLeaveEmployee,
        createChangesOnDrop,
        detectSpanningAttempt,
        calculateSpanningDetails,
    };
};