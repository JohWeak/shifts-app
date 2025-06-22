// frontend/src/features/admin-employee-management/ui/EmployeeFilters/EmployeeFilters.js
import React, { useEffect, useState } from 'react';
import { Card, Form, Button } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import { setFilters } from '../../model/employeeSlice';
import { fetchSystemSettings } from 'features/admin-system-settings/model/settingsSlice';
import { fetchWorkSites } from 'features/admin-schedule-management/model/scheduleSlice';
import './EmployeeFilters.css';

const EmployeeFilters = () => {
    const { t } = useI18n();
    const dispatch = useDispatch();
    const { filters } = useSelector((state) => state.employees);
    const { systemSettings } = useSelector((state) => state.settings || {});
    const { workSites } = useSelector((state) => state.schedule || {});

    const [selectedWorkSite, setSelectedWorkSite] = useState(filters.work_site || 'all');

    // Get all positions or filter by work site
    const allPositions = systemSettings?.positions || [];
    const filteredPositions = selectedWorkSite === 'all' || selectedWorkSite === 'any'
        ? allPositions
        : allPositions.filter(pos => pos.site_id === parseInt(selectedWorkSite));

    useEffect(() => {
        // Load system settings if not already loaded
        if (!systemSettings || !systemSettings.positions) {
            dispatch(fetchSystemSettings());
        }
        // Load work sites if not already loaded
        if (!workSites || workSites.length === 0) {
            dispatch(fetchWorkSites());
        }
    }, [dispatch]);

    const handleFilterChange = (field, value) => {
        dispatch(setFilters({ [field]: value }));
    };

    const handleWorkSiteChange = (value) => {
        setSelectedWorkSite(value);
        // Update work_site filter
        handleFilterChange('work_site', value);
        // Reset position filter when work site changes
        handleFilterChange('position', 'all');
    };

    const handleReset = () => {
        dispatch(setFilters({
            status: 'active',
            position: 'all',
            search: '',
            work_site: 'all'
        }));
        setSelectedWorkSite('all');
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

                    <Form.Group className="mb-3">
                        <Form.Label>{t('workSite.workSite')}</Form.Label>
                        <Form.Select
                            value={selectedWorkSite}
                            onChange={(e) => handleWorkSiteChange(e.target.value)}
                        >
                            <option value="all">{t('common.all')}</option>
                            <option value="any">{t('employee.anyWorkSite')}</option>
                            {workSites?.map((site) => (
                                <option key={site.site_id} value={site.site_id}>
                                    {site.site_name}
                                </option>
                            ))}
                        </Form.Select>
                    </Form.Group>

                    <Form.Group className="mb-4">
                        <Form.Label>{t('employee.position')}</Form.Label>
                        <Form.Select
                            value={filters.position}
                            onChange={(e) => handleFilterChange('position', e.target.value)}
                            disabled={filteredPositions.length === 0}
                        >
                            <option value="all">{t('common.all')}</option>
                            {filteredPositions.map((position) => (
                                <option key={position.pos_id} value={position.pos_id}>
                                    {position.pos_name}
                                </option>
                            ))}
                        </Form.Select>
                        {selectedWorkSite !== 'all' && selectedWorkSite !== 'any' && filteredPositions.length === 0 && (
                            <Form.Text className="text-muted">
                                {t('employee.noPositionsForSite')}
                            </Form.Text>
                        )}
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