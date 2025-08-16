import React from 'react';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import EmployeeList from '../EmployeeList';
import './UnavailableEmployeeGroups.css';

const UnavailableEmployeeGroups = ({ recommendations, onItemClick, searchTerm }) => {
    const { t } = useI18n();

    const groupUnavailableEmployees = () => {
        const groups = { temporary: [], permanent: [], legal: [] };

        if (recommendations?.unavailable_soft) {
            groups.temporary.push(...recommendations.unavailable_soft);
        }
        if (recommendations?.unavailable_hard) {
            groups.temporary.push(...recommendations.unavailable_hard.filter(
                emp => emp.unavailable_reason !== 'permanent_constraint' && emp.unavailable_reason !== 'rest_violation'
            ));
            groups.legal.push(...recommendations.unavailable_hard.filter(
                emp => emp.unavailable_reason === 'rest_violation'
            ));
        }
        if (recommendations?.unavailable_permanent) {
            groups.permanent.push(...recommendations.unavailable_permanent);
        }
        if (recommendations?.unavailable_busy) {
            groups.legal.push(...recommendations.unavailable_busy);
        }

        return groups;
    };

    const groups = groupUnavailableEmployees();

    return (
        <div className="unavailable-groups">
            {groups.temporary.length > 0 && (
                <div className="unavailable-group">
                    <h6 className="group-title">{t('employee.temporaryConstraints')}</h6>
                    <EmployeeList employees={groups.temporary} type="unavailable_temporary" onItemClick={onItemClick} searchTerm={searchTerm} />
                </div>
            )}

            {groups.permanent.length > 0 && (
                <div className="unavailable-group">
                    <h6 className="group-title">{t('employee.permanentConstraints')}</h6>
                    <EmployeeList employees={groups.permanent} type="unavailable_permanent" onItemClick={onItemClick} searchTerm={searchTerm} />
                </div>
            )}

            {groups.legal.length > 0 && (
                <div className="unavailable-group">
                    <h6 className="group-title">{t('employee.legalConstraints')}</h6>
                    <EmployeeList employees={groups.legal} type="unavailable_legal" onItemClick={onItemClick} searchTerm={searchTerm} />
                </div>
            )}
        </div>
    );
};

export default UnavailableEmployeeGroups;