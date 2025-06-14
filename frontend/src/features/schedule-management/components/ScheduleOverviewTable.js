// frontend/src/features/schedule-management/components/ScheduleOverviewTable.js
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card, Table, Badge, Button, Spinner } from 'react-bootstrap';
import { useMessages } from '../../../shared/lib/i18n/messages';
import LoadingSpinner from '../../../shared/ui/LoadingSpinner';
import ConfirmationModal from '../../../shared/ui/ConfirmationModal';
import { deleteSchedule } from '../../../app/store/slices/scheduleSlice'; // Импортируем наш thunk
import {
    formatScheduleDate,
    getStatusBadgeVariant,
    canDeleteSchedule,
    getSiteName
} from '../../../shared/lib/utils/scheduleUtils';

const ScheduleOverviewTable = ({ schedules, loading, onViewDetails }) => {
    const messages = useMessages('en');
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
        return <LoadingSpinner message={messages.LOADING_SCHEDULES} />;
    }

    if (!schedules || schedules.length === 0) {
        return (
            <Card>
                <Card.Body className="text-center py-5">
                    <i className="bi bi-calendar-x display-1 text-muted"></i>
                    <h4>{messages.NO_SCHEDULES_FOUND}</h4>
                    <p>{messages.GENERATE_FIRST_SCHEDULE}</p>
                </Card.Body>
            </Card>
        );
    }

    return (
        <>
            <Card>
                <Card.Body>
                    <Table responsive hover>
                        <thead>
                        <tr>
                            <th>{messages.WEEK}</th>
                            <th>{messages.STATUS}</th>
                            <th>{messages.SITE}</th>
                            <th>{messages.CREATED}</th>
                            <th>{messages.ACTIONS}</th>
                        </tr>
                        </thead>
                        <tbody>
                        {schedules.map(schedule => (
                            <tr key={schedule.id}>
                                <td>{formatScheduleDate(schedule.start_date)} - {formatScheduleDate(schedule.end_date)}</td>
                                <td><Badge bg={getStatusBadgeVariant(schedule.status)}>{schedule.status}</Badge></td>
                                <td>{getSiteName(schedule)}</td>
                                <td>{formatScheduleDate(schedule.createdAt)}</td>
                                <td>
                                    <div className="d-flex gap-2 align-items-center">
                                        <Button variant="outline-primary" size="sm" onClick={() => onViewDetails(schedule.id)} title={messages.VIEW_DETAILS}>
                                            <i className="bi bi-eye"></i>
                                        </Button>
                                        {canDeleteSchedule(schedule) && (
                                            <Button variant="outline-danger" size="sm" onClick={() => handleDeleteClick(schedule)} disabled={isDeleting} title={messages.DELETE_SCHEDULE}>
                                                {isDeleting && scheduleToDelete?.id === schedule.id ? <Spinner size="sm" /> : <i className="bi bi-trash"></i>}
                                            </Button>
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