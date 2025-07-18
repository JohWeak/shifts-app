// frontend/src/features/employee-archive/ui/MonthlyStats/MonthlyStats.js
import React from 'react';
import { Card, Row, Col } from 'react-bootstrap';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import './MonthlyStats.css';

const MonthlyStats = ({ monthData }) => {
    const { t } = useI18n();

    if (!monthData || !monthData.stats) {
        return null;
    }

    const { totalShifts, totalDays, totalHours } = monthData.stats;

    const formatHours = (minutes) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}:${mins.toString().padStart(2, '0')}`;
    };

    return (
        <Card className="monthly-stats">
            <Card.Body>
                <Row>
                    <Col xs={4} className="stat-item">
                        <div className="stat-value">{totalShifts}</div>
                        <div className="stat-label">{t('employee.archive.totalShifts')}</div>
                    </Col>
                    <Col xs={4} className="stat-item">
                        <div className="stat-value">{totalDays}</div>
                        <div className="stat-label">{t('employee.archive.totalDays')}</div>
                    </Col>
                    <Col xs={4} className="stat-item">
                        <div className="stat-value">{formatHours(totalHours)}</div>
                        <div className="stat-label">{t('employee.archive.totalHours')}</div>
                    </Col>
                </Row>
            </Card.Body>
        </Card>
    );
};

export default MonthlyStats;