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
    const { filters, employees } = useSelector((state) => state.employees);
    const { systemSettings } = useSelector((state) => state.settings || {});
    const { workSites } = useSelector((state) => state.schedule || {});

    const [selectedWorkSite, setSelectedWorkSite] = useState(filters.work_site || 'all');

    // Get all positions
    const allPositions = systemSettings?.positions || [];

    // Filter positions based on selected work site
    const getFilteredPositions = () => {
        if (selectedWorkSite === 'all') {
            // Show unique position names across all work sites
            const uniquePositions = [];
            const positionMap = new Map();

            allPositions.forEach(pos => {
                if (!positionMap.has(pos.pos_name)) {
                    positionMap.set(pos.pos_name, {
                        pos_id: pos.pos_name, // Use position name as ID for display
                        pos_name: pos.pos_name,
                        actual_ids: [pos.pos_id] // Store actual IDs
                    });
                } else {
                    // Add this position's ID to the list
                    positionMap.get(pos.pos_name).actual_ids.push(pos.pos_id);
                }
            });

            positionMap.forEach(value => uniquePositions.push(value));
            return uniquePositions;
        } else if (selectedWorkSite === 'any') {
            // Show only positions that exist among employees without work site
            const positionIdsFromFlexibleEmployees = [...new Set(
                employees
                    .filter(emp => !emp.work_site_id && emp.default_position_id)
                    .map(emp => emp.default_position_id)
            )];
            return allPositions.filter(pos => positionIdsFromFlexibleEmployees.includes(pos.pos_id));
        } else {
            // Show positions for specific work site
            return allPositions.filter(pos => pos.site_id === parseInt(selectedWorkSite));
        }
    };

    const filteredPositions = getFilteredPositions();

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
        // Special handling for position filter when work_site is 'all'
        if (field === 'position' && selectedWorkSite === 'all' && value !== 'all') {
            // Find the position object to get all IDs
            const position = filteredPositions.find(p => p.pos_id === value);
            if (position && position.actual_ids) {
                // For now, just use the position name as the filter value
                // The backend will handle filtering by position name
                dispatch(setFilters({ [field]: value }));
            } else {
                dispatch(setFilters({ [field]: value }));
            }
        } else {
            dispatch(setFilters({ [field]: value }));
        }
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
        <Card className="filters-card shadow-sm">
            <Card.Header className="filters-header">
                <h6 className="mb-0 d-flex align-items-center">
                    <i className="bi bi-funnel me-2"></i>
                    {t('common.filter')}
                </h6>
            </Card.Header>
            <Card.Body className="filters-body">
                <Form>
                    <Form.Group className="mb-3">
                        <Form.Label className="filter-label">{t('common.search')}</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder={t('employee.searchPlaceholder')}
                            value={filters.search}
                            onChange={(e) => handleFilterChange('search', e.target.value)}
                            className="filter-input"
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label className="filter-label">{t('employee.status')}</Form.Label>
                        <Form.Select
                            value={filters.status}
                            onChange={(e) => handleFilterChange('status', e.target.value)}
                            className="filter-select"
                        >
                            <option value="all">{t('common.all')}</option>
                            <option value="active">{t('status.active')}</option>
                            <option value="inactive">{t('status.inactive')}</option>
                            <option value="admin">{t('common.admin')}</option>
                        </Form.Select>
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label className="filter-label">{t('workSite.workSite')}</Form.Label>
                        <Form.Select
                            value={selectedWorkSite}
                            onChange={(e) => handleWorkSiteChange(e.target.value)}
                            className="filter-select"
                        >
                            <option value="all">{t('common.all')}</option>
                            <option value="any">{t('employee.commonWorkSite')}</option>
                            {workSites?.map((site) => (
                                <option key={site.site_id} value={site.site_id}>
                                    {site.site_name}
                                </option>
                            ))}
                        </Form.Select>
                    </Form.Group>

                    <Form.Group className="mb-4">
                        <Form.Label className="filter-label">{t('employee.position')}</Form.Label>
                        <Form.Select
                            value={filters.position}
                            onChange={(e) => handleFilterChange('position', e.target.value)}
                            className="filter-select"
                            disabled={filteredPositions.length === 0}
                        >
                            <option value="all">{t('common.all')}</option>
                            {filteredPositions.map((position) => (
                                <option key={position.pos_id} value={position.pos_id}>
                                    {position.pos_name}
                                </option>
                            ))}
                        </Form.Select>
                        {selectedWorkSite !== 'all' && filteredPositions.length === 0 && (
                            <Form.Text className="text-muted mt-1">
                                {t('employee.noPositionsForSite')}
                            </Form.Text>
                        )}
                    </Form.Group>

                    <Button
                        variant="secondary"
                        size="sm"
                        className="w-100 reset-button"
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