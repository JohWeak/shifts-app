// frontend/src/components/admin/schedule/ScheduleOverviewTable.js
import React, { useState } from 'react';
import { Card, Table, Badge, Button, Spinner } from 'react-bootstrap';
import { useMessages } from '../../../i18n/messages';
import LoadingSpinner from '../common/LoadingSpinner';
import ConfirmationModal from '../common/ConfirmationModal';
import { useScheduleAPI } from '../../../hooks/useScheduleAPI';
import {
    formatScheduleDate,
    getStatusBadgeVariant,
    canDeleteSchedule,
    getSiteName
} from '../../../utils/scheduleUtils';

const ScheduleOverviewTable = ({
                                   schedules,
                                   loading,
                                   onViewDetails,
                                   onScheduleDeleted
                               }) => {
    const messages = useMessages('en');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [scheduleToDelete, setScheduleToDelete] = useState(null);
    const api = useScheduleAPI();

    const handleDeleteClick = (schedule) => {
        setScheduleToDelete(schedule);
        setShowDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (!scheduleToDelete) return;

        try {
            await api.deleteSchedule(scheduleToDelete.id);
            onScheduleDeleted(scheduleToDelete);
            setShowDeleteModal(false);
            setScheduleToDelete(null);
        } catch (err) {
            console.error('Error deleting schedule:', err);
        }
    };

    const handleDeleteCancel = () => {
        setShowDeleteModal(false);
        setScheduleToDelete(null);
    };

    if (loading) {
        return (
            <LoadingSpinner
                message={messages.LOADING_SCHEDULES}
            />
        );
    }

    if (schedules.length === 0) {
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
                                <td>
                                    {formatScheduleDate(schedule.start_date)} - {formatScheduleDate(schedule.end_date)}
                                </td>
                                <td>
                                    <Badge bg={getStatusBadgeVariant(schedule.status)}>
                                        {schedule.status}
                                    </Badge>
                                </td>
                                <td>{getSiteName(schedule)}</td>
                                <td>{formatScheduleDate(schedule.createdAt)}</td>
                                <td>
                                    <div className="d-flex gap-2 align-items-center">
                                        <Button
                                            variant="outline-primary"
                                            size="sm"
                                            onClick={() => onViewDetails(schedule.id)}
                                            title={messages.VIEW_DETAILS}
                                        >
                                            <i className="bi bi-eye"></i>
                                        </Button>

                                        {canDeleteSchedule(schedule) && (
                                            <Button
                                                variant="outline-danger"
                                                size="sm"
                                                onClick={() => handleDeleteClick(schedule)}
                                                disabled={api.loading}
                                                title={messages.DELETE_SCHEDULE}
                                            >
                                                {api.loading && scheduleToDelete?.id === schedule.id ? (
                                                    <Spinner size="sm" />
                                                ) : (
                                                    <i className="bi bi-trash"></i>
                                                )}
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
                show={showDeleteModal}
                title={messages.CONFIRM_DELETION}
                message={messages.DELETE_CONFIRMATION_TEXT}
                onConfirm={handleDeleteConfirm}
                onCancel={handleDeleteCancel}
                loading={api.loading}
                confirmText={messages.DELETE_SCHEDULE}
                variant="danger"
            >
                {scheduleToDelete && (
                    <div className="schedule-info bg-light p-3 rounded">
                        <div className="row">
                            <div className="col-sm-4"><strong>Week:</strong></div>
                            <div className="col-sm-8">
                                {formatScheduleDate(scheduleToDelete.start_date)} - {formatScheduleDate(scheduleToDelete.end_date)}
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-sm-4"><strong>Site:</strong></div>
                            <div className="col-sm-8">{getSiteName(scheduleToDelete)}</div>
                        </div>
                        <div className="row">
                            <div className="col-sm-4"><strong>Status:</strong></div>
                            <div className="col-sm-8">
                                <Badge bg={getStatusBadgeVariant(scheduleToDelete.status)}>
                                    {scheduleToDelete.status}
                                </Badge>
                            </div>
                        </div>
                    </div>
                )}
                <p className="mt-3 text-muted">
                    {messages.DELETE_ASSIGNMENTS_WARNING}
                </p>
            </ConfirmationModal>
        </>
    );
};

export default ScheduleOverviewTable;