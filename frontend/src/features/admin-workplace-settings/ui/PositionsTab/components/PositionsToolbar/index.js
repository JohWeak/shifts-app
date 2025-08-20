// frontend/src/features/admin-workplace-settings/ui/PositionsTab/components/PositionsToolbar/index.js

import React from 'react';
import { Row, Col, InputGroup, Form } from 'react-bootstrap';
import { useI18n } from 'shared/lib/i18n/i18nProvider';

const PositionsToolbar = ({
                              searchTerm,
                              onSearchTermChange,
                              filterSite,
                              onFilterSiteChange,
                              workSites,
                              showInactive,
                              onShowInactiveChange
                          }) => {
    const { t } = useI18n();

    return (
        <Row className="mb-3">
            <Col md={6}>
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
                <Form.Select value={filterSite} onChange={(e) => onFilterSiteChange(e.target.value)}>
                    <option value="">{t('workplace.positions.allSites')}</option>
                    {workSites
                        .filter(site => site.is_active)
                        .map(site => (
                            <option key={site.site_id} value={site.site_id}>{site.site_name}</option>
                        ))}
                </Form.Select>
            </Col>
            <Col md={2} className="d-flex align-items-center">
                <Form.Check
                    type="switch"
                    id="show-inactive-positions"
                    label={t('workplace.positions.showInactive')}
                    checked={showInactive}
                    onChange={(e) => onShowInactiveChange(e.target.checked)}
                />
            </Col>
        </Row>
    );
};

export default PositionsToolbar;