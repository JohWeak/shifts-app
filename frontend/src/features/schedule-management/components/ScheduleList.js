// frontend/src/CompareAlgorithmsModal.js/admin/schedule/ScheduleList.js
import React from 'react';
import { Table, Badge, Button, ButtonGroup } from 'react-bootstrap';
import { useMessages } from '../../../i18n/messages';

const ScheduleList = ({
                          schedules,
                          loading,
                          onView,
                          onEdit,
                          onDelete,
                          onExport
                      }) => {
    const messages = useMessages('en');

    const getStatusBadge = (status) => {
        const variants = {
            draft: 'warning',
            published: 'success',
            archived: 'secondary'
        };

        const statusLabels = {
            draft: messages.SCHEDULE_STATUS_DRAFT,
            published: messages.SCHEDULE_STATUS_PUBLISHED,
            archived: messages.SCHEDULE_STATUS_ARCHIVED
        };

        return (
            <Badge bg={variants[status] || 'secondary'}>
                {statusLabels[status] || status}
            </Badge>
        );
    };

    const formatDateRange = (startDate, endDate) => {
        const start = new Date(startDate).toLocaleDateString();
        const end = new Date(endDate).toLocaleDateString();
        return `${start} - ${end}`;
    };

    if (loading) {
        return (
            <div className="text-center py-4">
                <div className="spinner-border" role="status">
                    <span className="visually-hidden">{messages.LOADING}</span>
                </div>
                <p className="mt-2">{messages.LOADING}</p>
            </div>
        );
    }

    if (!schedules || schedules.length === 0) {
        return (
            <div className="text-center py-4 text-muted">
                <i className="bi bi-calendar-x fs-1 mb-3 d-block"></i>
                <p>{messages.NO_SCHEDULES}</p>
            </div>
        );
    }

    return (
        <Table responsive striped hover>
            <thead>
            <tr>
                <th>{messages.SCHEDULE_PERIOD}</th>
                <th>{messages.STATUS}</th>
                <th>{messages.SITE}</th>
                <th>{messages.CREATED}</th>
                <th className="text-center">{messages.ACTIONS}</th>
            </tr>
            </thead>
            <tbody>
            {schedules.map(schedule => (
                <tr key={schedule.id}>
                    <td className="fw-medium">
                        {formatDateRange(schedule.start_date, schedule.end_date)}
                    </td>
                    <td>
                        {getStatusBadge(schedule.status)}
                    </td>
                    <td>
                        {schedule.work_site?.site_name || 'Unknown'}
                    </td>
                    <td>
                        {new Date(schedule.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                        <ButtonGroup size="sm">
                            <Button
                                variant="outline-primary"
                                onClick={() => onView(schedule.id)}
                                title={messages.VIEW_SCHEDULE}
                            >
                                <i className="bi bi-eye"></i>
                            </Button>

                            {schedule.status === 'draft' && (
                                <Button
                                    variant="outline-secondary"
                                    onClick={() => onEdit(schedule.id)}
                                    title={messages.EDIT_SCHEDULE}
                                >
                                    <i className="bi bi-pencil"></i>
                                </Button>
                            )}

                            <Button
                                variant="outline-danger"
                                onClick={() => onDelete(schedule.id)}
                                title={messages.DELETE_SCHEDULE}
                                disabled={schedule.status === 'published'}
                            >
                                <i className="bi bi-trash"></i>
                            </Button>
                        </ButtonGroup>
                    </td>
                </tr>
            ))}
            </tbody>
        </Table>
    );
};

export default ScheduleList;