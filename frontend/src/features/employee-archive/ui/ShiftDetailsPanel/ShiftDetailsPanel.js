// frontend/src/features/employee-archive/ui/ShiftDetailsPanel/ShiftDetailsPanel.js
import React from 'react';
import { Card } from 'react-bootstrap';
import { Clock, Calendar } from 'react-bootstrap-icons';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import { formatShiftTime, formatFullDate } from 'shared/lib/utils/scheduleUtils';
import './ShiftDetailsPanel.css';

const ShiftDetailsPanel = ({ shift, selectedDate, getShiftColor }) => {
    const { t } = useI18n();

    if (!shift) {
        return (
            <Card className="shift-details-panel">
                <Card.Body className="text-center text-muted">
                    <Calendar size={48} className="mb-3" />
                    <p>{t('employee.archive.noShiftOnDate')}</p>
                </Card.Body>
            </Card>
        );
    }

    const shiftColor = getShiftColor({ shift_id: shift.shift_id, color: shift.color });

    return (
        <Card className="shift-details-panel">
            <Card.Header style={{ backgroundColor: shiftColor, color: '#fff' }}>
                <h5 className="mb-0">{shift.shift_name}</h5>
            </Card.Header>
            <Card.Body>
                <div className="detail-item">
                    <Calendar className="detail-icon" />
                    <span>{formatFullDate(selectedDate)}</span>
                </div>

                <div className="detail-item">
                    <Clock className="detail-icon" />
                    <span>
                        {formatShiftTime(shift.start_time, shift.end_time)}
                    </span>
                </div>

                <div className="detail-item">
                    <span className="detail-label">{t('employee.archive.duration')}:</span>
                    <span>{shift.duration_hours} {t('common.hours')}</span>
                </div>

                {shift.position_name && (
                    <div className="detail-item">
                        <span className="detail-label">{t('employee.archive.position')}:</span>
                        <span>{shift.position_name}</span>
                    </div>
                )}

                {shift.site_name && (
                    <div className="detail-item">
                        <span className="detail-label">{t('employee.archive.worksite')}:</span>
                        <span>{shift.site_name}</span>
                    </div>
                )}
            </Card.Body>
        </Card>
    );
};

export default ShiftDetailsPanel;