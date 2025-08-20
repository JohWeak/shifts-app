// frontend/src/features/admin-workplace-settings/ui/WorkSitesTab/components/WorkSitesToolbar/index.js

import React from 'react';
import { Row, Col, InputGroup, Form } from 'react-bootstrap';
import { useI18n } from 'shared/lib/i18n/i18nProvider';

const WorkSitesToolbar = ({
                              searchTerm,
                              onSearchTermChange,
                              statusFilter,
                              onStatusFilterChange
                          }) => {
    const { t } = useI18n();

    return (
        <Row className="mb-3">
            <Col md={8}>
                <InputGroup>
                    <InputGroup.Text><i className="bi bi-search"></i></InputGroup.Text>
                    <Form.Control
                        type="text"
                        placeholder={t('common.search')}
                        value={searchTerm}
                        onChange={(e) => onSearchTermChange(e.target.value)}
                    />
                </InputGroup>
            </Col>
            <Col md={4}>
                <Form.Select value={statusFilter} onChange={(e) => onStatusFilterChange(e.target.value)}>
                    <option value="active">{t('workplace.worksites.activeOnly')}</option>
                    <option value="all">{t('workplace.worksites.allSites')}</option>
                </Form.Select>
            </Col>
        </Row>
    );
};

export default WorkSitesToolbar;