// frontend/src/features/schedule-management/components/ScheduleOverviewTable.js
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card, Table, Spinner } from 'react-bootstrap';
import LoadingState from '../../../shared/ui/LoadingState/LoadingState';
import ConfirmationModal from '../../../shared/ui/ConfirmationModal';
import { deleteSchedule } from '../../../app/store/slices/scheduleSlice'; // Импортируем наш thunk
import {
    formatScheduleDate,
    canDeleteSchedule,
    getSiteName
} from '../../../shared/lib/utils/scheduleUtils';

import { useI18n } from '../../../shared/lib/i18n/i18nProvider';
import EmptyState from '../../../shared/ui/EmptyState/EmptyState';
import StatusBadge from '../../../shared/ui/StatusBadge/StatusBadge';
import ActionButtons from '../../../shared/ui/ActionButtons/ActionButtons';

const ScheduleOverviewTable = ({ schedules, loading, onViewDetails }) => {
    const { t } = useI18n();
    const dispatch = useDispatch();

    // Получаем состояние загрузки из Redux, чтобы блокировать кнопку
    const isDeleting = useSelector(state => state.schedule.loading === 'pending');

    // Локальное состояние для модального окна
    const [scheduleToDelete, setScheduleToDelete] = useState(null);

    const handleDeleteClick = (schedule) => {
        setScheduleToDelete(schedule);
    };

    const handleDeleteCancel = () => {
        setScheduleToDelete(null);
    };

    const handleDeleteConfirm = async () => {
        if (!scheduleToDelete) return;

        // Диспатчим экшен удаления
        await dispatch(deleteSchedule(scheduleToDelete.id));
        setScheduleToDelete(null); // Закрываем модальное окно
    };

    if (loading) {
        return <LoadingState size="lg" message={t('schedule.loading')} />;
    }

    if (!schedules || schedules.length === 0) {
        return (
            <EmptyState
                icon={<i className="bi bi-calendar-x display-1"></i>}
                title={t('schedule.noSchedulesFound')}
                description={t('schedule.generateFirstSchedule')}
            />
        );
    }

    return (
        <>
            <Card>
                <Card.Body>
                    <Table responsive hover>
                        <thead>
                        <tr>
                            <th>{t.WEEK}</th>
                            <th>{t.STATUS}</th>
                            <th>{t.SITE}</th>
                            <th>{t.CREATED}</th>
                            <th>{t.ACTIONS}</th>
                        </tr>
                        </thead>
                        <tbody>
                        {schedules.map(schedule => (
                            <tr key={schedule.id}>
                                <td>{formatScheduleDate(schedule.start_date)} - {formatScheduleDate(schedule.end_date)}</td>
                                <td><StatusBadge status={schedule.status} /></td>
                                <td>{getSiteName(schedule)}</td>
                                <td>{formatScheduleDate(schedule.createdAt)}</td>
                                <td>
                                    <div className="d-flex gap-2 align-items-center">
                                        <ActionButtons variant="outline-primary" size="sm" onClick={() => onViewDetails(schedule.id)} title={messages.VIEW_DETAILS}>
                                            <i className="bi bi-eye"></i>
                                        </ActionButtons>
                                        {canDeleteSchedule(schedule) && (
                                            <ActionButtons variant="outline-danger" size="sm" onClick={() => handleDeleteClick(schedule)} disabled={isDeleting} title={messages.DELETE_SCHEDULE}>
                                                {isDeleting && scheduleToDelete?.id === schedule.id ? <Spinner size="sm" /> : <i className="bi bi-trash"></i>}
                                            </ActionButtons>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </Table>
                </Card.Body>
            </Card>

            <ConfirmationModal
                show={!!scheduleToDelete}
                title={messages.CONFIRM_DELETION}
                message={messages.DELETE_CONFIRMATION_TEXT}
                onConfirm={handleDeleteConfirm}
                onCancel={handleDeleteCancel}
                loading={isDeleting}
                confirmText={messages.DELETE_SCHEDULE}
                variant="danger"
            >
                {scheduleToDelete && (
                    <div className="schedule-info bg-light p-3 rounded">
                        <p><strong>{messages.WEEK}:</strong> {formatScheduleDate(scheduleToDelete.start_date)} - {formatScheduleDate(scheduleToDelete.end_date)}</p>
                        <p><strong>{messages.SITE}:</strong> {getSiteName(scheduleToDelete)}</p>
                        <p className="mt-3 text-muted">{messages.DELETE_ASSIGNMENTS_WARNING}</p>
                    </div>
                )}
            </ConfirmationModal>
        </>
    );
};

export default ScheduleOverviewTable;