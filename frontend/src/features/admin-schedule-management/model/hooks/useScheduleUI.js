import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';

export const useScheduleUI = () => {
    const { editingPositions, activeTab } = useSelector((state) => state.schedule);

    const [selectedCell, setSelectedCell] = useState(null);
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [showEmployeeModal, setShowEmployeeModal] = useState(false);
    const [isLargeScreen, setIsLargeScreen] = useState(window.innerWidth >= 1500);

    useEffect(() => {
        const handleResize = () => {
            const newIsLarge = window.innerWidth >= 1500;
            if (newIsLarge !== isLargeScreen) {
                setIsLargeScreen(newIsLarge);
                // Если экран стал маленьким, а панель была открыта - открываем модалку
                if (!newIsLarge && isPanelOpen) {
                    setIsPanelOpen(false);
                    setShowEmployeeModal(true);
                }
                // Если экран стал большим, а модалка была открыта - открываем панель
                if (newIsLarge && showEmployeeModal) {
                    setShowEmployeeModal(false);
                    setIsPanelOpen(true);
                }
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [isLargeScreen, isPanelOpen, showEmployeeModal]);

    // Закрывать панель, если вышли из режима редактирования
    useEffect(() => {
        const isEditing = Object.values(editingPositions || {}).some(Boolean);
        if (!isEditing && isPanelOpen) {
            setIsPanelOpen(false);
            setSelectedCell(null);
        }
    }, [editingPositions, isPanelOpen]);

    // Закрывать панель, если ушли со страницы детального просмотра
    useEffect(() => {
        if (activeTab !== 'view' && isPanelOpen) {
            setIsPanelOpen(false);
            setSelectedCell(null);
        }
    }, [activeTab, isPanelOpen]);

    const handleCellClick = (date, positionId, shiftId, employeeIdToReplace = null, assignmentIdToReplace = null) => {
        if (!editingPositions?.[positionId]) return;

        const cell = { date, positionId, shiftId, employeeIdToReplace, assignmentIdToReplace };
        setSelectedCell(cell);

        if (isLargeScreen) {
            setIsPanelOpen(true);
        } else {
            setShowEmployeeModal(true);
        }
    };

    const closeAllModals = () => {
        setIsPanelOpen(false);
        setShowEmployeeModal(false);
        setSelectedCell(null);
    };

    return {
        selectedCell,
        isPanelOpen,
        showEmployeeModal,
        isLargeScreen,
        handleCellClick,
        closeAllModals
    };
};