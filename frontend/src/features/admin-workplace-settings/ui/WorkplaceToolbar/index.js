// frontend/src/features/admin-workplace-settings/ui/WorkplaceToolbar/index.js

import React from 'react';
import { Row, Col, InputGroup, Form } from 'react-bootstrap';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import './WorkplaceToolbar.css'; // Подключаем стили

const WorkplaceToolbar = ({
                              // Общие props
                              searchTerm,
                              onSearchTermChange,
                              showInactive,
                              onShowInactiveChange,

                              siteFilter,
                              onSiteFilterChange,
                              sites = [],

                              inactiveSwitchId
                          }) => {
    const { t } = useI18n();

    return (
        <Row className="mb-3 workplace-toolbar-row align-items-center">
            <Col md className="flex-grow-1">
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
            {onSiteFilterChange && (
                <Col md={4}>
                    <Form.Select value={siteFilter} onChange={(e) => onSiteFilterChange(e.target.value)}>
                        <option value="">{t('workplace.positions.allSites')}</option>
                        {sites
                            .filter(site => site.is_active)
                            .map(site => (
                                <option key={site.site_id} value={site.site_id}>{site.site_name}</option>
                            ))}
                    </Form.Select>
                </Col>
            )}
            <Col md="auto" className="d-flex align-items-center">
                <Form.Check
                    type="switch"
                    id={inactiveSwitchId}
                    label={t('workplace.positions.showInactive')}
                    checked={showInactive}
                    onChange={(e) => onShowInactiveChange(e.target.checked)}
                />
            </Col>
        </Row>
    );
};

export default WorkplaceToolbar;