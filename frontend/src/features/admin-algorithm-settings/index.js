import React from 'react';
import PageHeader from 'shared/ui/components/PageHeader';
import { useI18n } from 'shared/lib/i18n/i18nProvider';

import { Card, Container } from 'react-bootstrap';

const AlgorithmSettings = () => {
    const { t } = useI18n();

    return (
        <Container fluid className="px-0">
            <PageHeader
                icon="cpu-fill"
                title={t('settings.algorithmsSettings')}
                subtitle={t('settings.algorithmsSettingsSubtitle')}
            />

            <Card className="border-0 shadow-sm">
                <Card.Body className="text-center py-5">
                    <i className="bi bi-cpu-fill display-1 text-muted mb-3"></i>
                    <h4 className="text-muted">Coming Soon</h4>
                    <p className="text-muted">Algorithm configuration will be available here</p>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default AlgorithmSettings;