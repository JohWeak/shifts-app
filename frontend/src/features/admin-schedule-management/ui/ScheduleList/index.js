// frontend/src/features/admin-schedule-management/ui/ScheduleList/index.js

import React, { useState, useMemo, useEffect } from 'react';
import { Alert } from 'react-bootstrap';
import { useDispatch } from 'react-redux';
import { parseISO, isAfter, startOfWeek, endOfWeek } from 'date-fns';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import { useSortableData } from 'shared/hooks/useSortableData';
import { deleteSchedule, updateScheduleStatus } from '../../model/scheduleSlice';
import { formatWeekRange, classifySchedules } from "shared/lib/utils/scheduleUtils";
import ConfirmationModal from 'shared/ui/components/ConfirmationModal/ConfirmationModal';
import ScheduleTableList from './components/ScheduleTableList'; // <-- Новый импорт
import './ScheduleList.css';

const ScheduleList = ({ schedules, onViewDetails, onScheduleDeleted }) => {
    const dispatch = useDispatch();
    const { t, locale } = useI18n();

    // --- STATE MANAGEMENT ---
    const [scheduleToDelete, setScheduleToDelete] = useState(null);
    const [scheduleToPublish, setScheduleToPublish] = useState(null);
    const [scheduleToUnpublish, setScheduleToUnpublish] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const [showError, setShowError] = useState(null);
    const [openStates, setOpenStates] = useState(() => {
        const saved = localStorage.getItem('schedulesOpenStates');
        return saved ? JSON.parse(saved) : { active: true, inactive: true };
    });

    useEffect(() => {
        localStorage.setItem('schedulesOpenStates', JSON.stringify(openStates));
    }, [openStates]);

    // --- DATA PREPARATION ---
    const { activeSchedules, inactiveSchedules, currentWeekScheduleIds } = useMemo(() => {
        return classifySchedules(schedules);
    }, [schedules]);

    const sortAccessors = useMemo(() => ({
        'week': (s) => s.start_date,
        'site': (s) => s.workSite?.site_name || '',
        'status': (s) => s.status,
        'updatedAt': (s) => s.updatedAt || s.createdAt,
    }), []);

    const { sortedItems: sortedActive, requestSort: requestActiveSort, sortConfig: activeSortConfig } = useSortableData(activeSchedules, { field: 'week', order: 'ASC' }, sortAccessors);
    const { sortedItems: sortedInactive, requestSort: requestInactiveSort, sortConfig: inactiveSortConfig } = useSortableData(inactiveSchedules, { field: 'week', order: 'DESC' }, sortAccessors);

    // --- ACTION HANDLERS ---
    const handleDeleteConfirm = async () => {
        if (!scheduleToDelete) return;
        setIsDeleting(true);
        setShowError(null);
        try {
            await dispatch(deleteSchedule(scheduleToDelete.id)).unwrap();
            setScheduleToDelete(null);
            if (onScheduleDeleted) onScheduleDeleted(scheduleToDelete.id);
        } catch (error) {
            setShowError(error.message || t('errors.deleteFailed'));
        } finally {
            setIsDeleting(false);
        }
    };

    const handleStatusUpdate = async (schedule, status) => {
        setIsUpdatingStatus(true);
        setShowError(null);
        try {
            await dispatch(updateScheduleStatus({ scheduleId: schedule.id, status })).unwrap();
            setScheduleToPublish(null);
            setScheduleToUnpublish(null);
        } catch (error) {
            setShowError(error.message || t('errors.statusUpdateFailed'));
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    return (
        <>
            <ScheduleTableList
                schedules={sortedActive}
                className='active'
                sortConfig={activeSortConfig}
                requestSort={requestActiveSort}
                title={t('schedule.activeSchedules')}
                emptyMessage={t('schedule.noActiveSchedules')}
                currentWeekScheduleIds={currentWeekScheduleIds}
                isCollapsible={true}
                isOpen={openStates.active}
                onToggle={() => setOpenStates(s => ({ ...s, active: !s.active }))}
                onView={onViewDetails}
                onPublish={setScheduleToPublish}
                onUnpublish={setScheduleToUnpublish}
                onDelete={setScheduleToDelete}
            />

            {sortedInactive.length > 0 && (
                <ScheduleTableList
                    schedules={sortedInactive}
                    className='inactive'
                    sortConfig={inactiveSortConfig}
                    requestSort={requestInactiveSort}
                    title={t('schedule.inactiveSchedules')}
                    emptyMessage={t('schedule.noInactiveSchedules')}
                    currentWeekScheduleIds={currentWeekScheduleIds}
                    isCollapsible={true}
                    isOpen={openStates.inactive}
                    onToggle={() => setOpenStates(s => ({ ...s, inactive: !s.inactive }))}
                    onView={onViewDetails}
                    onPublish={setScheduleToPublish}
                    onUnpublish={setScheduleToUnpublish}
                    onDelete={setScheduleToDelete}
                />
            )}

            {/* MODALS & ALERTS */}
            <ConfirmationModal show={!!scheduleToDelete} title={t('schedule.deleteSchedule')} message={t('schedule.confirmDelete')} onConfirm={handleDeleteConfirm} onHide={() => setScheduleToDelete(null)} loading={isDeleting} confirmText={t('schedule.deleteSchedule')} variant="danger">
                {scheduleToDelete && <div className="schedule-info bg-danger bg-opacity-10 p-3 rounded"><p><strong>{t('schedule.weekPeriod')}:</strong> {formatWeekRange(scheduleToDelete.start_date, locale)}</p><p><strong>{t('schedule.site')}:</strong> {scheduleToDelete.workSite?.site_name || 'N/A'}</p></div>}
            </ConfirmationModal>
            <ConfirmationModal show={!!scheduleToPublish} title={t('schedule.publishSchedule')} message={t('schedule.confirmPublish')} onConfirm={() => handleStatusUpdate(scheduleToPublish, 'published')} onCancel={() => setScheduleToPublish(null)} loading={isUpdatingStatus} confirmText={t('schedule.publishSchedule')} variant="success" />
            <ConfirmationModal show={!!scheduleToUnpublish} title={t('schedule.unpublish')} message={t('schedule.confirmUnpublish')} onConfirm={() => handleStatusUpdate(scheduleToUnpublish, 'draft')} onCancel={() => setScheduleToUnpublish(null)} loading={isUpdatingStatus} confirmText={t('schedule.unpublish')} variant="warning" />
            {showError && <Alert variant="danger" dismissible onClose={() => setShowError(null)} className="mt-3">{showError}</Alert>}
        </>
    );
};

export default ScheduleList;