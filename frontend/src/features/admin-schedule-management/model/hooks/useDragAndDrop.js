import {useCallback, useState} from 'react';

export const useDragAndDrop = (isEditMode, pendingChanges = {}, assignments = []) => {
    const [draggedItem, setDraggedItem] = useState(null);
    const [dragOverEmployeeId, setDragOverEmployeeId] = useState(null);


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

            // 2. Добавляем на новое место
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
    }, [draggedItem, pendingChanges, checkEmployeeInCellWithTempChanges]);


    return {
        dragOverEmployeeId,
        handleDragStart,
        handleDragEnd,
        handleDragOver,
        handleDragLeave,
        handleDragEnterEmployee,
        handleDragLeaveEmployee,
        createChangesOnDrop,
    };
};