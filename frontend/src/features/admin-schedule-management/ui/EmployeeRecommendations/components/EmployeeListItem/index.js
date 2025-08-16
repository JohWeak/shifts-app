//frontend/src/features/admin-schedule-management/ui/EmployeeRecommendations/components/EmployeeListItem/index.js

import React from 'react';
import { ListGroup, Badge } from 'react-bootstrap';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import './EmployeeListItem.css'

const EmployeeListItem = ({ employee, type, onItemClick }) => {
    const { t } = useI18n();

    const isFlexible = !employee.default_position_id || employee.flexible_position;
    const isAvailable = type === 'available' || type === 'cross_position' || type === 'other_site';
    const showWarning = !isAvailable;
    const isBecameAvailable = employee.recommendation?.reasons?.includes('became_available');

    const handleItemClick = () => {
        if (showWarning) {
            const confirmAssign = window.confirm(
                t('employee.confirmOverride', {
                    name: `${employee.first_name} ${employee.last_name}`,
                    reason: employee.unavailable_reason?.replace('_', ' ') || 'N/A',
                    note: employee.note || ''
                })
            );
            if (confirmAssign) {
                onItemClick(employee);
            }
        } else {
            onItemClick(employee);
        }
    };

    return (
        <ListGroup.Item
            action
            onClick={handleItemClick}
            className={`employee-list-item ${showWarning ? 'list-group-item-warning' : ''} ${isFlexible ? 'flexible-employee' : ''}`}
        >
            <div className="employee-info">
                <div>
                    <div className="employee-name">
                        {employee.first_name} {employee.last_name}
                    </div>
                    <div className="employee-site">
                        <i className="bi bi-building me-1"></i>
                        {employee.work_site_name || t('employee.noWorkSite')}
                    </div>
                    <div className="employee-position">
                        <i className="bi bi-person-badge me-1"></i>
                        {employee.default_position_name || t('employee.flexiblePosition')}
                    </div>
                    {isBecameAvailable && (
                        <div className="mt-2 text-info">
                            <i className="bi bi-arrow-clockwise me-1"></i>
                            {t('recommendation.became_available_in_edit')}
                        </div>
                    )}
                    {showWarning && (
                        <>
                            {/* ... (Вся логика отображения причин недоступности) ... */}
                            {employee.unavailable_reason === 'already_assigned' && (
                                <div className="mt-2 text-danger">
                                    <i className="bi bi-calendar-check me-1"></i>
                                    {t('recommendation.already_assigned_to', [employee.assigned_shift || t('recommendation.unknown_shift')])}
                                </div>
                            )}
                            {employee.unavailable_reason === 'permanent_constraint' && employee.constraint_details?.[0] && (
                                <div className="permanent-constraint-info mt-2">
                                    <div className="text-danger"><i className="bi bi-lock-fill me-1"></i>{t('employee.permanentConstraint')}</div>
                                    <small className="text-muted d-block ms-3">{t('employee.approvedBy', { approver: employee.constraint_details[0].approved_by, date: new Date(employee.constraint_details[0].approved_at).toLocaleDateString() })}</small>
                                </div>
                            )}
                            {employee.unavailable_reason === 'rest_violation' && employee.rest_details && (
                                <div className="mt-2 text-danger">
                                    <i className="bi bi-moon me-1"></i>
                                    {employee.rest_details.type === 'after' ? t('recommendation.rest_violation_after', [employee.rest_details.restHours, employee.rest_details.previousShift, employee.rest_details.requiredRest]) : t('recommendation.rest_violation_before', [employee.rest_details.restHours, employee.rest_details.nextShift, employee.rest_details.requiredRest])}
                                </div>
                            )}
                            {employee.unavailable_reason === 'hard_constraint' && <div className="mt-2 text-danger"><i className="bi bi-x-circle me-1"></i>{t('recommendation.Cannot work')}</div>}
                            {employee.unavailable_reason === 'soft_constraint' && <div className="mt-2 text-danger"><i className="bi bi-dash-circle me-1"></i>{t('recommendation.prefer_different_time')}</div>}
                        </>
                    )}
                    {isAvailable && !isBecameAvailable && (
                        <>
                            {employee.recommendation?.reasons?.map((reason, idx) => {
                                const [key, ...params] = reason.split(':');
                                const translationKey = `recommendation.${key}`;
                                const translation = t(translationKey, params);
                                if (translation && translation !== translationKey) {
                                    return <small key={idx} className="d-block text-success"><i className="bi bi-check-circle me-1"></i>{translation}</small>;
                                }
                                return null;
                            })}
                            {employee.recommendation?.warnings?.map((warning, idx) => {
                                const [key, ...params] = warning.split(':');
                                const translationKey = `recommendation.${key}`;
                                const translation = t(translationKey, params);
                                if (translation && translation !== translationKey) {
                                    return <small key={idx} className="d-block text-warning"><i className="bi bi-exclamation-triangle me-1"></i>{translation}</small>;
                                }
                                return null;
                            })}
                        </>
                    )}
                </div>
            </div>
            <div className="employee-badges">
                <small className="score-badge">{t('employee.score')}: {employee.recommendation?.score || 0}</small>
                {type === 'available' && <Badge bg="success">{t('employee.available')}</Badge>}
                {type === 'cross_position' && <Badge bg="warning" text="dark">{t('employee.crossPosition')}</Badge>}
                {type === 'other_site' && <Badge bg="info">{t('employee.otherSite')}</Badge>}
                {isFlexible && <Badge bg="secondary">{t('employee.flexible')}</Badge>}
                {showWarning && <Badge bg="danger">{t('employee.unavailable')}</Badge>}
            </div>
        </ListGroup.Item>
    );
};

export default EmployeeListItem;