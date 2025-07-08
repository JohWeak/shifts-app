// frontend/src/features/employee-schedule/ui/ArchiveTab.js
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Table, Card, Badge, Form, Button } from 'react-bootstrap';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import LoadingState from 'shared/ui/components/LoadingState/LoadingState';
import EmptyState from 'shared/ui/components/EmptyState/EmptyState';
import DatePicker from 'shared/ui/components/DatePicker/DatePicker';
import api from 'shared/api';
import { formatWeekRange, formatShiftTime, getDayName } from 'shared/lib/utils/scheduleUtils';
import { parseISO, startOfMonth, endOfMonth, format } from 'date-fns';
import './ArchiveTab.css';

const ArchiveTab = () => {
    const { t } = useI18n();
    const { user } = useSelector(state => state.auth);
    const [loading, setLoading] = useState(false);
    const [archiveData, setArchiveData] = useState([]);
    const [dateRange, setDateRange] = useState({
        start: startOfMonth(new Date()),
        end: endOfMonth(new Date())
    });

    useEffect(() => {
        fetchArchiveData();
    }, [dateRange]);

    const fetchArchiveData = async () => {
        setLoading(true);

        try {
            const response = await api.get('/api/schedules/employee/archive', {
                params: {
                    startDate: format(dateRange.start, 'yyyy-MM-dd'),
                    endDate: format(dateRange.end, 'yyyy-MM-dd')
                }
            });

            if (response.data.success) {
                setArchiveData(response.data.schedules);
            }
        } catch (err) {
            console.error('Error fetching archive:', err);
        } finally {
            setLoading(false);
        }
    };

    const calculateTotalHours = (assignments) => {
        return assignments.reduce((total, assignment) => {
            return total + (assignment.shift?.duration || 0);
        }, 0);
    };

    if (loading) {
        return <LoadingState message={t('common.loading')} />;
    }

    if (archiveData.length === 0) {
        return (
            <EmptyState
                icon={<i className="bi bi-archive display-1"></i>}
                title={t('employee.schedule.noArchiveData')}
                description={t('employee.schedule.noArchiveDataDesc')}
            />
        );
    }

    return (
        <div className="archive-content">
            <Card className="filter-card mb-4">
                <Card.Body>
                    <Form className="d-flex gap-3 align-items-end">
                        <Form.Group className="flex-1">
                            <Form.Label>{t('common.startDate')}</Form.Label>
                            <DatePicker
                                value={dateRange.start}
                                onChange={(date) => setDateRange({ ...dateRange, start: date })}
                            />
                        </Form.Group>
                        <Form.Group className="flex-1">
                            <Form.Label>{t('common.endDate')}</Form.Label>
                            <DatePicker
                                value={dateRange.end}
                                onChange={(date) => setDateRange({ ...dateRange, end: date })}
                            />
                        </Form.Group>
                        <Button
                            variant="primary"
                            onClick={fetchArchiveData}
                            disabled={loading}
                        >
                            <i className="bi bi-search me-2"></i>
                            {t('common.search')}
                        </Button>
                    </Form>
                </Card.Body>
            </Card>

            <div className="archive-schedules">
                {archiveData.map((schedule) => (
                    <Card key={schedule.id} className="schedule-archive-card mb-3">
                        <Card.Header className="d-flex justify-content-between align-items-center">
                            <h6 className="mb-0">
                                {formatWeekRange({ start: schedule.start_date, end: schedule.end_date })}
                            </h6>
                            <div className="d-flex gap-2">
                                <Badge bg="info">
                                    {calculateTotalHours(schedule.assignments)} {t('common.hours')}
                                </Badge>
                                <Badge bg="secondary">
                                    {schedule.assignments.length} {t('employee.schedule.shifts')}
                                </Badge>
                            </div>
                        </Card.Header>
                        <Card.Body className="p-0">
                            <Table className="archive-table mb-0" hover size="sm">
                                <thead>
                                <tr>
                                    <th>{t('employee.schedule.date')}</th>
                                    <th>{t('employee.schedule.day')}</th>
                                    <th>{t('employee.schedule.shift')}</th>
                                    <th>{t('employee.schedule.hours')}</th>
                                </tr>
                                </thead>
                                <tbody>
                                {schedule.assignments.map((assignment) => (
                                    <tr key={assignment.id}>
                                        <td>{format(parseISO(assignment.work_date), 'dd/MM')}</td>
                                        <td>{getDayName(parseISO(assignment.work_date).getDay(), t, true)}</td>
                                        <td>
                                            <div>
                                                <span className="fw-medium">{assignment.shift.shift_name}</span>
                                                <small className="text-muted d-block">
                                                    {formatShiftTime(assignment.shift.start_time, assignment.shift.duration)}
                                                </small>
                                            </div>
                                        </td>
                                        <td>{assignment.shift.duration}h</td>
                                    </tr>
                                ))}
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default ArchiveTab;