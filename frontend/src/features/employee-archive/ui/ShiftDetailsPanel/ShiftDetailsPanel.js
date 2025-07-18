// frontend/src/features/employee-archive/ui/ShiftDetailsPanel/ShiftDetailsPanel.js
import React from 'react';
import { Card } from 'react-bootstrap';
import { Clock, Calendar } from 'react-bootstrap-icons';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import { formatShiftTime, formatFullDate } from 'shared/lib/utils/scheduleUtils';
import './ShiftDetailsPanel.css';
import {getContrastTextColor} from "../../../../shared/lib/utils/colorUtils";

const ShiftDetailsPanel = ({ shift, selectedDate, getShiftColor }) => {
    const { t, locale } = useI18n();

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
        <Card className="shift-details-panel ">
            <Card.Header
                style={{
                    backgroundColor: shiftColor,
                    color: getContrastTextColor(shiftColor)
            }}
                className="shift-details-header d-flex align-items-center justify-content-between ">
                <div className="detail-item align-items-center ">
                    <span className="detail-label">{shift.shift_name}</span>
                    {/*<Clock className="detail-icon" />*/}
                    <span>
                        {formatShiftTime(shift.start_time, shift.end_time)}
                    </span>
                </div>
                <div className="detail-item">
                    <span>{shift.duration_hours} {t('common.hours')}</span>
                </div>

            </Card.Header>
            <Card.Body className="py-2 px-3">
                {/*<div className="detail-item">*/}
                {/*    <Calendar className="detail-icon" />*/}
                {/*    <span>{formatFullDate(selectedDate, locale)}</span>*/}
                {/*</div>*/}
                <div className="workplace-info d-flex gap-2">
                {shift.position_name && (
                    <div className="detail-item">
                        <span className="detail-label">{t('employee.archive.position')}:</span>
                        <span>{shift.position_name}</span>
                    </div>
                )}

                {shift.site_name && (
                    <div className="detail-item ">
                        <span className="detail-label">{t('employee.archive.worksite')}:</span>
                        <span>{shift.site_name}</span>
                    </div>
                )}
                </div>
            </Card.Body>
        </Card>
    );
};

export default ShiftDetailsPanel;