// frontend/src/features/employee-archive/index.js
import React from 'react';
import { Container } from 'react-bootstrap';
import PageHeader from 'shared/ui/components/PageHeader/PageHeader';
import { useI18n } from 'shared/lib/i18n/i18nProvider';

const EmployeeArchive = () => {
    const { t } = useI18n();

    return (
        <Container fluid className="employee-archive-container">
            <PageHeader
                icon="archive"
                title={t('employee.archive')}
                subtitle={t('employee.archiveSubtitle')}
            />
            {/* Контент архива будет добавлен позже */}
        </Container>
    );
};

export default EmployeeArchive;