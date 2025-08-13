// frontend/src/features/admin-schedule-management/model/hooks/useDragAndDrop.js
import { useState, useCallback } from 'react';

export const useDragAndDrop = (onAddPendingChange, isEditMode) => {
    const [draggedEmployee, setDraggedEmployee] = useState(null);
    const [draggedFrom, setDraggedFrom] = useState(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleDragStart = useCallback((e, employee, fromCell) => {
        if (!isEditMode) return;

        setDraggedEmployee(employee);
        setDraggedFrom(fromCell);
        setIsDragging(true);

        // Set drag data
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('employee', JSON.stringify(employee));
        e.dataTransfer.setData('fromCell', JSON.stringify(fromCell));

        // Add dragging class
        e.target.classList.add('dragging');

        // Create drag image
        const dragImage = e.target.cloneNode(true);
        dragImage.style.opacity = '0.8';
        document.body.appendChild(dragImage);
        e.dataTransfer.setDragImage(dragImage, e.nativeEvent.offsetX, e.nativeEvent.offsetY);
        setTimeout(() => document.body.removeChild(dragImage), 0);
    }, [isEditMode]);

    const handleDragEnd = useCallback((e) => {
        e.target.classList.remove('dragging');
        setDraggedEmployee(null);
        setDraggedFrom(null);
        setIsDragging(false);

        // Remove all drag-over classes
        document.querySelectorAll('.drag-over').forEach(el => {
            el.classList.remove('drag-over');
        });
    }, []);

    const handleDragOver = useCallback((e) => {
        if (!isEditMode) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';

        // Add visual feedback for valid drop zone
        const cell = e.currentTarget;
        if (!cell.classList.contains('drag-over')) {
            cell.classList.add('drag-over');
        }
    }, [isEditMode]);

    const handleDragEnter = useCallback((e) => {
        if (!isEditMode) return;
        e.preventDefault();
        e.currentTarget.classList.add('drag-over');
    }, [isEditMode]);

    const handleDragLeave = useCallback((e) => {
        // Only remove class if we're leaving the cell entirely
        if (e.currentTarget === e.target || !e.currentTarget.contains(e.relatedTarget)) {
            e.currentTarget.classList.remove('drag-over');
        }
    }, []);

    const handleDrop = useCallback((e, targetCell, targetEmployee = null) => {
        if (!isEditMode || !onAddPendingChange) return;

        e.preventDefault();
        e.stopPropagation();

        // Remove drag-over class
        e.currentTarget.classList.remove('drag-over');
        document.querySelectorAll('.drag-over').forEach(el => {
            el.classList.remove('drag-over');
        });

        const employee = JSON.parse(e.dataTransfer.getData('employee'));
        const fromCell = JSON.parse(e.dataTransfer.getData('fromCell'));

        // Don't do anything if dropping in the same place
        if (fromCell.date === targetCell.date &&
            fromCell.shiftId === targetCell.shiftId &&
            fromCell.positionId === targetCell.positionId) {
            return;
        }

        // Create pending changes instead of direct updates
        const timestamp = Date.now();

        // If dropping on another employee - swap them
        if (targetEmployee && targetEmployee.empId !== employee.empId) {
            // Remove target employee from target cell
            onAddPendingChange({
                key: `remove-${targetEmployee.empId}-${timestamp}`,
                action: 'remove',
                assignmentId: targetEmployee.assignmentId,
                empId: targetEmployee.empId,
                empName: targetEmployee.name,
                date: targetCell.date,
                shiftId: targetCell.shiftId,
                positionId: targetCell.positionId
            });

            // Add target employee to source cell (if not pending)
            if (!targetEmployee.isPending) {
                onAddPendingChange({
                    key: `assign-${targetEmployee.empId}-${timestamp}`,
                    action: 'assign',
                    empId: targetEmployee.empId,
                    empName: targetEmployee.name,
                    shiftId: fromCell.shiftId,
                    positionId: fromCell.positionId,
                    date: fromCell.date
                });
            }
        }

        // Remove dragged employee from source (if not pending)
        if (employee.assignmentId && !employee.isPending) {
            onAddPendingChange({
                key: `remove-${employee.empId}-${timestamp}-source`,
                action: 'remove',
                assignmentId: employee.assignmentId,
                empId: employee.empId,
                empName: employee.name,
                date: fromCell.date,
                shiftId: fromCell.shiftId,
                positionId: fromCell.positionId
            });
        }

        // Add dragged employee to target
        onAddPendingChange({
            key: `assign-${employee.empId}-${timestamp}-target`,
            action: 'assign',
            empId: employee.empId,
            empName: employee.name,
            shiftId: targetCell.shiftId,
            positionId: targetCell.positionId,
            date: targetCell.date
        });

        // Reset drag state
        setDraggedEmployee(null);
        setDraggedFrom(null);
        setIsDragging(false);

    }, [isEditMode, onAddPendingChange]);

    return {
        draggedEmployee,
        draggedFrom,
        isDragging,
        handleDragStart,
        handleDragEnd,
        handleDragOver,
        handleDragEnter,
        handleDragLeave,
        handleDrop
    };
};