// frontend/src/features/employee-archive/ui/ShiftDetailsPanel/ShiftDetailsPanel.js
import React from 'react';
import { Card, Button } from 'react-bootstrap';
import { Clock, Calendar, Palette } from 'react-bootstrap-icons';
import { format } from 'date-fns';
import { enUS, he, ru } from 'date-fns/locale';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import { formatShiftTime } from 'shared/lib/utils/scheduleUtils';
import './ShiftDetailsPanel.css';

const ShiftDetailsPanel = ({ shift, selectedDate, getShiftColor, onColorChange }) => {
    const { t, locale: currentLocale } = useI18n();

    const getDateFnsLocale = () => {
        const localeMap = {
            en: enUS,
            he: he,
            ru: ru
        };
        return localeMap[currentLocale] || enUS;
    };

    const dateLocale = getDateFnsLocale();

    if (!shift) {
        return (
            <Card className="shift-details-panel">
                <Card.Body className="text-center text-muted">
                    <Calendar size={48} className="mb-3" />
                    <p>{t('employee.archiveNoShiftOnDate')}</p>
                </Card.Body>
            </Card>
        );
    }

    const shiftColor = getShiftColor({ shift_id: shift.shift_id, color: shift.color });

    return (
        <Card className="shift-details-panel">
            <Card.Header style={{ backgroundColor: shiftColor, color: '#fff' }}>
                <div className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">{shift.shift_name}</h5>
                    <Button
                        variant="light"
                        size="sm"
                        onClick={() => onColorChange(shift)}
                        title={t('common.changeColor')}
                    >
                        <Palette />
                    </Button>
                </div>
            </Card.Header>
            <Card.Body>
                <div className="detail-item">
                    <Calendar className="detail-icon" />
                    <span>{format(selectedDate, 'EEEE, MMMM d, yyyy', { locale: dateLocale })}</span>
                </div>

                <div className="detail-item">
                    <Clock className="detail-icon" />
                    <span>
                        {formatShiftTime(shift.start_time)} - {formatShiftTime(shift.end_time)}
                    </span>
                </div>

                <div className="detail-item">
                    <span className="detail-label">{t('employee.archiveDuration')}:</span>
                    <span>{shift.duration_hours} {t('common.hours')}</span>
                </div>

                {shift.position_name && (
                    <div className="detail-item">
                        <span className="detail-label">{t('employee.archivePosition')}:</span>
                        <span>{shift.position_name}</span>
                    </div>
                )}

                {shift.site_name && (
                    <div className="detail-item">
                        <span className="detail-label">{t('employee.archiveWorksite')}:</span>
                        <span>{shift.site_name}</span>
                    </div>
                )}
            </Card.Body>
        </Card>
    );
};

export default ShiftDetailsPanel;