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
    console.log('schedules prop:', schedules);
    console.log('schedules type:', typeof schedules);
    console.log('Is array:', Array.isArray(schedules));
    const schedulesList = Array.isArray(schedules) ? schedules : [];
    return (
        <>
            <Card>
                <Card.Body>
                    <Table responsive hover>
                        <thead>
                        <tr>
                            <th>{t('schedule.weekPeriod')}</th>
                            <th>{t('schedule.status')}</th>
                            <th>{t('schedule.site')}</th>
                            <th>{t('schedule.created')}</th>
                            <th>{t('schedule.actions')}</th>
                        </tr>
                        </thead>
                        <tbody>
                        {schedulesList.map(schedule => {
                            console.log('Schedule object:', schedule); // Временно для отладки
                            return (
                                <tr key={schedule.id}>
                                <td>{formatScheduleDate(schedule.start_date)} - {formatScheduleDate(schedule.end_date)}</td>
                                <td><StatusBadge status={schedule.status} /></td>
                                    <td>{schedule.workSite?.site_name || 'N/A'}</td>
                                <td>{formatScheduleDate(schedule.createdAt)}</td>
                                <td>
                                    <ActionButtons
                                        actions={[
                                            {
                                                label: t('schedule.view'),
                                                icon: 'bi bi-eye',
                                                onClick: () => onViewDetails(schedule.id),
                                                variant: 'primary'
                                            },
                                            {
                                                label: t('common.delete'),
                                                icon: 'bi bi-trash',
                                                onClick: () => handleDeleteClick(schedule),
                                                disabled: !canDeleteSchedule(schedule),
                                                variant: 'danger'
                                            }
                                        ]}
                                        size="sm"
                                    />
                                </td>
                            </tr>
                            );
                        })}
                        </tbody>
                    </Table>
                </Card.Body>
            </Card>

            <ConfirmationModal
                show={!!scheduleToDelete}
                title={t('schedule.deleteSchedule')}
                message={t('schedule.confirmDelete')}
                onConfirm={handleDeleteConfirm}
                onCancel={handleDeleteCancel}
                loading={isDeleting}
                confirmText={t('schedule.deleteSuccess')}
                variant="danger"
            >
                {scheduleToDelete && (
                    <div className="schedule-info bg-light p-3 rounded">
                        <p><strong>{t('schedule.weekPeriod')}:</strong> {formatScheduleDate(scheduleToDelete.start_date)} - {formatScheduleDate(scheduleToDelete.end_date)}</p>
                        <p><strong>{t('schedule.site')}:</strong> {getSiteName(scheduleToDelete)}</p>
                        <p className="mt-3 text-muted">{t('common.warning')}</p>
                    </div>
                )}
            </ConfirmationModal>
        </>
    );
};

export default ScheduleOverviewTable;