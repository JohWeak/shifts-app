// frontend/src/features/admin-schedule-management/ui/schedule-list/ExportDropdown.js
import React from 'react';
import { Dropdown, Button } from 'react-bootstrap';
import { useI18n } from 'shared/lib/i18n/i18nProvider';

const ExportDropdown = ({ onExport, isExporting, size = 'sm' }) => {
    const { t } = useI18n();

    const exportOptions = [
        { format: 'pdf', icon: 'bi-file-earmark-pdf', label: 'PDF' },
        { format: 'csv', icon: 'bi-file-earmark-excel', label: 'CSV' }
    ];

    return (
        <Dropdown>
            <Dropdown.Toggle
                as={Button}
                variant="outline-primary"
                size={size}
                disabled={isExporting}
                className="export-button"
            >
                <i className="bi bi-download me-2"></i>
                {isExporting ? t('common.exporting') : t('schedule.export')}
            </Dropdown.Toggle>

            <Dropdown.Menu>
                {exportOptions.map(option => (
                    <Dropdown.Item
                        key={option.format}
                        onClick={() => onExport(option.format)}
                        disabled={isExporting}
                    >
                        <i className={`${option.icon} me-2`}></i>
                        {option.label}
                    </Dropdown.Item>
                ))}
            </Dropdown.Menu>
        </Dropdown>
    );
};

export default ExportDropdown;