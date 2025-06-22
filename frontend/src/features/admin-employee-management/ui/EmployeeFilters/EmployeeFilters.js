// frontend/src/features/admin-employee-management/ui/EmployeeFilters/EmployeeFilters.js
import React, { useEffect } from 'react';
import { Card, Form, Button } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import { setFilters } from '../../model/employeeSlice';
import { fetchSystemSettings } from 'features/admin-system-settings/model/settingsSlice';
import './EmployeeFilters.css';

const EmployeeFilters = () => {
    const { t } = useI18n();
    const dispatch = useDispatch();
    const { filters } = useSelector((state) => state.employees);
    const { systemSettings } = useSelector((state) => state.settings || {});

    const positions = systemSettings?.positions || [];

    useEffect(() => {
        // Load positions if not already loaded
        if (!systemSettings) {
            dispatch(fetchSystemSettings());
        }
    }, [dispatch, systemSettings]);

    const handleFilterChange = (field, value) => {
        dispatch(setFilters({ [field]: value }));
    };

    const handleReset = () => {
        dispatch(setFilters({
            status: 'all',
            position: 'all',
            search: ''
        }));
    };

    return (
        <Card className="employee-filters-card">
            <Card.Header className="bg-primary text-white">
                <h6 className="mb-0 d-flex align-items-center">
                    <i className="bi bi-funnel me-2"></i>
                    {t('common.filter')}
                </h6>
            </Card.Header>
            <Card.Body>
                <Form>
                    <Form.Group className="mb-3">
                        <Form.Label>{t('common.search')}</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder={t('employee.searchPlaceholder')}
                            value={filters.search}
                            onChange={(e) => handleFilterChange('search', e.target.value)}
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>{t('employee.status')}</Form.Label>
                        <Form.Select
                            value={filters.status}
                            onChange={(e) => handleFilterChange('status', e.target.value)}
                        >
                            <option value="all">{t('common.all')}</option>
                            <option value="active">{t('status.active')}</option>
                            <option value="inactive">{t('status.inactive')}</option>
                            <option value="admin">{t('common.admin')}</option>
                        </Form.Select>
                    </Form.Group>

                    <Form.Group className="mb-4">
                        <Form.Label>{t('employee.position')}</Form.Label>
                        <Form.Select
                            value={filters.position}
                            onChange={(e) => handleFilterChange('position', e.target.value)}
                        >
                            <option value="all">{t('common.all')}</option>
                            {positions.map((position) => (
                                <option key={position.pos_id} value={position.pos_id}>
                                    {position.pos_name}
                                </option>
                            ))}
                        </Form.Select>
                    </Form.Group>

                    <Button
                        variant="outline-secondary"
                        size="sm"
                        className="w-100"
                        onClick={handleReset}
                    >
                        <i className="bi bi-arrow-clockwise me-2"></i>
                        {t('common.reset')}
                    </Button>
                </Form>
            </Card.Body>
        </Card>
    );
};

export default EmployeeFilters;