// frontend/src/features/admin-schedule-management/model/hooks/useDragAndDrop.js
import { useState, useCallback } from 'react';

export const useDragAndDrop = (isEditMode) => {
    const [draggedItem, setDraggedItem] = useState(null); // Будет хранить { employee, fromCell }
    const [isDragging, setIsDragging] = useState(false);

    const handleDragStart = useCallback((e, employee, fromCell) => {
        if (!isEditMode) return;
        setIsDragging(true);
        setDraggedItem({ employee, fromCell });
        e.dataTransfer.effectAllowed = 'move';
        // Сохраняем данные в dataTransfer на случай, если что-то пойдет не так
        e.dataTransfer.setData('application/json', JSON.stringify({ employee, fromCell }));
        e.currentTarget.classList.add('dragging');
    }, [isEditMode]);

    const handleDragEnd = useCallback((e) => {
        if (!isEditMode) return;
        setIsDragging(false);
        setDraggedItem(null);
        // Убираем все визуальные эффекты
        document.querySelectorAll('.dragging').forEach(el => el.classList.remove('dragging'));
        document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
    }, [isEditMode]);

    const handleDragOver = useCallback((e) => {
        if (!isEditMode || !draggedItem) return;
        e.preventDefault();
    }, [isEditMode, draggedItem]);

    const handleDragEnterCell = useCallback((e) => {
        if (!isEditMode || !draggedItem) return;
        e.currentTarget.classList.add('drag-over');
    }, [isEditMode, draggedItem]);

    const handleDragLeaveCell = useCallback((e) => {
        if (!isEditMode) return;
        e.currentTarget.classList.remove('drag-over');
    }, [isEditMode]);

    const createChangesOnDrop = useCallback((targetCell, targetEmployee = null) => {
        if (!draggedItem) return [];

        const { employee: dragged, fromCell } = draggedItem;
        const changes = [];

        // --- SWAP ---
        if (targetEmployee && targetEmployee.empId !== dragged.empId) {
            // 1. Удалить обоих
            changes.push({ action: 'remove', ...fromCell, empId: dragged.empId, assignmentId: dragged.assignmentId });
            changes.push({ action: 'remove', ...targetCell, empId: targetEmployee.empId, assignmentId: targetEmployee.assignmentId });
            // 2. Добавить обоих на новые места
            changes.push({ action: 'assign', ...targetCell, empId: dragged.empId, empName: dragged.name });
            changes.push({ action: 'assign', ...fromCell, empId: targetEmployee.empId, empName: targetEmployee.name });
        }
        // --- MOVE ---
        else if (!targetEmployee) {
            if (fromCell.date === targetCell.date && fromCell.shiftId === targetCell.shiftId) {
                return []; // Не делаем изменений, если бросили в ту же ячейку
            }
            // 1. Удалить со старого места
            changes.push({ action: 'remove', ...fromCell, empId: dragged.empId, assignmentId: dragged.assignmentId });
            // 2. Добавить на новое место
            changes.push({ action: 'assign', ...targetCell, empId: dragged.empId, empName: dragged.name });
        }

        return changes;
    }, [draggedItem]);

    return {
        isDragging,
        handleDragStart,
        handleDragEnd,
        handleDragOver,
        handleDragEnterCell,
        handleDragLeaveCell,
        createChangesOnDrop,
    };
};