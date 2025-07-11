import React from 'react';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import { Button } from 'react-bootstrap';
import { format, parseISO } from 'date-fns';
import './WeekSelector.css';


export const WeekSelector = ({ activeWeek, onWeekChange, currentWeekData, nextWeekData }) => {
    const { t } = useI18n();

    return (
        <div className="week-selector-fixed">
            <Button
                variant={activeWeek === 'current' ? 'primary' : 'outline-primary'}
                size="sm"
                onClick={() => onWeekChange('current')}
                className="me-2"
                disabled={!currentWeekData}
            >
                {t('employee.schedule.currentWeek')}
                {currentWeekData?.week && (
                    <small className="d-block">
                        {format(parseISO(currentWeekData.week.start), 'dd/MM')} -
                        {format(parseISO(currentWeekData.week.end), 'dd/MM')}
                    </small>
                )}
            </Button>
            <Button
                variant={activeWeek === 'next' ? 'primary' : 'outline-primary'}
                size="sm"
                onClick={() => onWeekChange('next')}
                disabled={!nextWeekData}
            >
                {t('employee.schedule.nextWeek')}
                {nextWeekData?.week && (
                    <small className="d-block">
                        {format(parseISO(nextWeekData.week.start), 'dd/MM')} -
                        {format(parseISO(nextWeekData.week.end), 'dd/MM')}
                    </small>
                )}
            </Button>
        </div>
    );
};