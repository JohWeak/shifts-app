// frontend/src/features/employee-archive/ui/ShiftDetailsPanel/ShiftDetailsPanel.js
import React from 'react';
import {Card} from 'react-bootstrap';
import {Clock, Calendar, PersonBadge, Building} from 'react-bootstrap-icons';
import {useI18n} from 'shared/lib/i18n/i18nProvider';
import {formatShiftTime, formatFullDate} from 'shared/lib/utils/scheduleUtils';
import './ShiftDetailsPanel.css';
import {getContrastTextColor} from "../../../../shared/lib/utils/colorUtils";

const ShiftDetailsPanel = ({shift, selectedDate, getShiftColor}) => {
    const {t, locale} = useI18n();
    const shiftColor = shift ? getShiftColor({shift_id: shift.shift_id, color: shift.color}) : null;

    return (
        <Card className="shift-details-panel">
            <Card.Header
                // Стиль применяется только если есть shiftColor
                style={shiftColor ? {
                    backgroundColor: shiftColor,
                    color: getContrastTextColor(shiftColor)
                } : {}}
                // Динамически добавляем класс для выравнивания
                className={`shift-details-header d-flex align-items-center ${shift ? 'justify-content-between' : ''}`}
            >
                {/* --- Левый блок (всегда видимый контейнер) --- */}
                <div className="d-flex align-items-center gap-2">
                    <Clock size={20} className="detail-icon opacity-50 "/>
                    {/* Дополнительная информация появляется только при наличии смены */}
                    {shift ? (
                        <div className="detail-item">
                            <span className="detail-label">{formatShiftTime(shift.start_time, shift.end_time)}</span>
                            <span>({shift.shift_name})</span>

                        </div>
                    ) : (
                        <div className="text-muted small">
                            <span>{t('employee.archive.noShiftOnDate')}</span>
                        </div>
                    )}
                </div>

                {/* --- Правый блок (появляется только при наличии смены) --- */}
                {shift && (
                    <div className="detail-item">
                        <span>{shift.duration_hours} {t('common.hours')}</span>
                    </div>
                )}

            </Card.Header>
            <Card.Body className="py-2 px-3">
                <div className="detail-item">
                    <Calendar size={20} className="detail-icon opacity-50 me-1"/>
                    <span>{formatFullDate(selectedDate, locale)}</span>
                </div>
                {shift && (
                    <div className="workplace-info d-flex justify-content-between">
                        {shift.position_name && (
                            <div className="detail-item">
                                <PersonBadge className="detail-icon opacity-50 me-1"/>
                                <span className="detail-label">{t('employee.archive.position')}:</span>
                                <span>{shift.position_name}</span>
                            </div>
                        )}
                        {shift.site_name && (
                            <div className="detail-item ">
                                <Building className="detail-icon opacity-50 me-1"/>
                                <span className="detail-label">{t('employee.archive.worksite')}:</span>
                                <span>{shift.site_name}</span>
                            </div>
                        )}
                    </div>


                )}

            </Card.Body>
        </Card>
    );
};

export default ShiftDetailsPanel;