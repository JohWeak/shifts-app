// frontend/src/hooks/useScheduleOperations.js
import { useState } from 'react';
import { useScheduleAPI } from './useScheduleAPI';
import { MESSAGES, interpolateMessage } from '../i18n/messages';

// Утилита для генерации ключей изменений
const generateChangeKey = (positionId, date, shiftId, action, empId) => {
    return `${positionId}-${date}-${shiftId}-${action}-${empId}`;
};

export const useScheduleOperations = (state) => {
    const {
        schedules,
        setSchedules,
        setScheduleDetails,
        setSelectedSchedule,
        setActiveTab,
        pendingChanges,
        setPendingChanges,
        setRecommendations,
        setLoadingRecommendations,
        setComparisonResults,
        setShowComparisonModal,
        setShowEmployeeModal,
        setSelectedCell,
        setSelectedPosition,
        setIsModalOpen,
        showAlert,
        toggleEditPosition,
        isCellEditing,
        clearPendingChangesForPosition,
        resetScheduleView
    } = state;

    const api = useScheduleAPI();

    const handleFetchSchedules = async () => {
        try {
            const schedulesData = await api.fetchSchedules();
            setSchedules(schedulesData);
        } catch (err) {
            showAlert('danger', err.message);
        }
    };

    const handleViewScheduleDetails = async (scheduleId) => {
        try {
            const detailsData = await api.fetchScheduleDetails(scheduleId);
            setScheduleDetails(detailsData);
            setSelectedSchedule(scheduleId);
            setActiveTab('view');
        } catch (err) {
            showAlert('danger', err.message);
        }
    };

    const handleGenerateSchedule = async (settings) => {
        try {
            const result = await api.generateSchedule(settings);

            showAlert('success', `Schedule generated successfully! ${result?.assignments || 0} assignments created.`);

            await handleFetchSchedules();

            if (result?.schedule?.id) {
                await handleViewScheduleDetails(result.schedule.id);
            }
        } catch (err) {
            showAlert('danger', `Error generating schedule: ${err.message}`);
        }
    };

    const handleCompareAlgorithms = async (settings = {}) => {
        try {
            const result = await api.compareAlgorithms(settings);

            setComparisonResults({
                comparison: result.comparison,
                best_algorithm: result.comparison.recommended,
                recommendation: result.message
            });
            setShowComparisonModal(true);

            showAlert('success', `Algorithm comparison completed! Best algorithm: ${result.comparison.recommended}`);
        } catch (err) {
            showAlert('danger', `Error comparing algorithms: ${err.message}`);
        }
    };

    const handleScheduleDeleted = async (deletedSchedule) => {
        showAlert('success',
            `Schedule for week ${new Date(deletedSchedule.start_date).toLocaleDateString()} - ${new Date(deletedSchedule.end_date).toLocaleDateString()} has been deleted successfully.`
        );

        await handleFetchSchedules();

        if (state.selectedSchedule === deletedSchedule.id) {
            resetScheduleView();
        }
    };

    const handleScheduleStatusUpdate = async (scheduleId, newStatus) => {
        try {
            await api.updateScheduleStatus(scheduleId, newStatus);

            setSchedules(prevSchedules =>
                prevSchedules.map(schedule =>
                    schedule.id === scheduleId
                        ? { ...schedule, status: newStatus }
                        : schedule
                )
            );

            if (state.selectedSchedule === scheduleId && state.scheduleDetails) {
                setScheduleDetails(prevDetails => ({
                    ...prevDetails,
                    schedule: {
                        ...prevDetails.schedule,
                        status: newStatus
                    }
                }));
            }

            showAlert('success', `Schedule status updated to ${newStatus} successfully!`);
            return true;
        } catch (err) {
            showAlert('danger', `Error updating schedule status: ${err.message}`);
            return false;
        }
    };

    const handleCellClick = (date, positionId, shiftId) => {
        console.log('handleCellClick called:', { date, positionId, shiftId });

        if (isCellEditing && isCellEditing(date, positionId, shiftId)) {
            console.log('Cell is in editing mode, not opening modal');
            return;
        }

        setSelectedPosition({
            date,
            positionId,
            shiftId,
            key: `${date}-${positionId}-${shiftId}`
        });
        setIsModalOpen(true);
        console.log('Modal should open now');
    };

    // ИСПРАВЛЕНО: handleRemoveEmployee для существующих работников
    const handleRemoveEmployee = async (date, positionId, shiftId, empId) => {
        try {
            console.log('=== handleRemoveEmployee (SIMPLE) ===');
            console.log('Removing employee:', { date, positionId, shiftId, empId });

            // Проверим, это pending assignment или существующий работник
            const pendingAssignmentKey = Object.keys(state.pendingChanges).find(key => {
                const change = state.pendingChanges[key];
                return change.action === 'assign' &&
                    change.empId === empId &&
                    change.date === date &&
                    change.shiftId === shiftId &&
                    change.positionId === positionId;
            });

            if (pendingAssignmentKey) {
                // Удаляем pending assignment
                setPendingChanges(prev => {
                    const newChanges = { ...prev };
                    delete newChanges[pendingAssignmentKey];
                    return newChanges;
                });
                showAlert('success', 'Employee removed');
                return;
            }

            // Для существующего работника - добавляем в pending removals
            const existingAssignment = state.scheduleDetails?.assignments?.find(assignment =>
                assignment.position_id === positionId &&
                assignment.shift_id === shiftId &&
                assignment.work_date === date &&
                assignment.emp_id === empId
            );

            if (existingAssignment) {
                const changeKey = generateChangeKey(positionId, date, shiftId, 'remove', empId);

                setPendingChanges(prev => ({
                    ...prev,
                    [changeKey]: {
                        action: 'remove',
                        empId,
                        assignmentId: existingAssignment.id,
                        date,
                        shiftId,
                        positionId
                    }
                }));

                showAlert('success', 'Employee removed');
            }
        } catch (error) {
            console.error('Error removing employee:', error);
            showAlert('danger', 'Error removing employee');
        }
    };

// НОВАЯ функция для клика на работника (замена)
    const handleEmployeeClick = (date, positionId, shiftId, currentEmpId) => {
        console.log('handleEmployeeClick for replacement:', { date, positionId, shiftId, currentEmpId });

        // Сохраняем информацию о текущем работнике для замены
        setSelectedPosition({
            date,
            positionId,
            shiftId,
            key: `${date}-${positionId}-${shiftId}`,
            replaceEmployeeId: currentEmpId // Добавляем ID работника для замены
        });
        setIsModalOpen(true);
    };


    // ИСПРАВЛЕНО: handleEmployeeAssign для назначения работников
    const handleEmployeeAssign = (empId, empName) => {
        if (!state.selectedPosition) {
            showAlert('danger', MESSAGES.en.NO_POSITION_SELECTED);
            return;
        }

        const { date, shiftId, positionId, replaceEmployeeId } = state.selectedPosition;

        console.log('=== handleEmployeeAssign (WITH REPLACEMENT) ===');
        console.log('New employee:', { empId, empName });
        console.log('Replace employee ID:', replaceEmployeeId);

        // Если это замена существующего работника
        if (replaceEmployeeId) {
            console.log('Replacing existing employee');

            // Сначала удаляем старого работника
            const existingAssignment = state.scheduleDetails?.assignments?.find(assignment =>
                assignment.position_id === positionId &&
                assignment.shift_id === shiftId &&
                assignment.work_date === date &&
                assignment.emp_id === replaceEmployeeId
            );

            if (existingAssignment) {
                const removeKey = generateChangeKey(positionId, date, shiftId, 'remove', replaceEmployeeId);
                const assignKey = generateChangeKey(positionId, date, shiftId, 'assign', empId);

                setPendingChanges(prev => ({
                    ...prev,
                    [removeKey]: {
                        action: 'remove',
                        empId: replaceEmployeeId,
                        assignmentId: existingAssignment.id,
                        date,
                        shiftId,
                        positionId
                    },
                    [assignKey]: {
                        action: 'assign',
                        empId,
                        empName,
                        date,
                        shiftId,
                        positionId
                    }
                }));
            }
        } else {
            // Обычное назначение на пустую ячейку
            const changeKey = generateChangeKey(positionId, date, shiftId, 'assign', empId);

            setPendingChanges(prev => ({
                ...prev,
                [changeKey]: {
                    action: 'assign',
                    empId,
                    empName,
                    date,
                    shiftId,
                    positionId
                }
            }));
        }

        setIsModalOpen(false);
        setSelectedPosition(null);
        showAlert('success', replaceEmployeeId ? 'Employee replaced' : 'Employee assigned');
    };

    const handleEmployeeRemove = (date, shiftId, positionId, assignmentId) => {
        const changeKey = generateChangeKey(positionId, date, shiftId, 'remove', assignmentId);

        setPendingChanges(prev => ({
            ...prev,
            [changeKey]: {
                action: 'remove',
                assignmentId,
                date,
                shiftId,
                positionId
            }
        }));
    };

    const handleSavePositionChanges = async (positionId) => {
        try {
            const positionChanges = Object.values(pendingChanges).filter(
                change => change.positionId === positionId
            );

            if (positionChanges.length === 0) {
                showAlert('info', MESSAGES.en.NO_CHANGES_TO_SAVE);
                toggleEditPosition(positionId);
                return;
            }

            console.log('Saving position changes:', positionChanges);

            const result = await api.updateScheduleAssignments(state.selectedSchedule, positionChanges);

            await handleViewScheduleDetails(state.selectedSchedule);
            clearPendingChangesForPosition(positionId);
            toggleEditPosition(positionId);

            showAlert('success', interpolateMessage(MESSAGES.en.POSITION_CHANGES_SAVED, {
                count: result?.changesProcessed || positionChanges.length
            }));
        } catch (err) {
            showAlert('danger', interpolateMessage(MESSAGES.en.ERROR_SAVING_CHANGES, {
                error: err.message
            }));
        }
    };

    return {
        handleFetchSchedules,
        handleViewScheduleDetails,
        handleGenerateSchedule,
        handleCompareAlgorithms,
        handleScheduleDeleted,
        handleCellClick,
        handleEmployeeClick,
        handleRemoveEmployee,
        handleEmployeeAssign,
        handleEmployeeRemove,
        handleSavePositionChanges,
        handleScheduleStatusUpdate,
        apiLoading: api.loading,
        apiError: api.error
    };
};

export default useScheduleOperations;