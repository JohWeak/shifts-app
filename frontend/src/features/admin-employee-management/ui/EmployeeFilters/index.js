// frontend/src/features/admin-employee-management/ui/EmployeeFilters/index.js
import React, { useCallback, useEffect, useMemo } from 'react';
import { Accordion, Button, Col, Form, Row } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { debounce } from 'lodash';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import { setFilters, clearCache } from '../../model/employeeSlice';
import { fetchPositions, fetchWorkSites } from 'features/admin-workplace-settings/model/workplaceSlice';
import './EmployeeFilters.css';

const EmployeeFilters = () => {
    const { t } = useI18n();
    const dispatch = useDispatch();
    const { filters, employees, loading } = useSelector((state) => state.employees);
    const { workSites, positions: allPositions } = useSelector((state) => state.workplace);
    const { user } = useSelector((state) => state.auth);

    // Check if current user is super admin
    const isSuperAdmin = user && (user.emp_id === 1 || user.is_super_admin);

    // Get accessible sites for limited admins
    const accessibleSites = useMemo(() => {
        if (isSuperAdmin) return 'all';
        // console.log('EmployeeFilters - accessibleSites:', sites, 'user:', user);
        return user?.admin_work_sites_scope || [];
    }, [user, isSuperAdmin]);

    const selectedWorkSite = filters.work_site || 'all';


    const filteredPositions = useMemo(() => {
        if (selectedWorkSite === 'all') {
            const positionMap = new Map();
            (allPositions || []).forEach(pos => {
                // For restricted admins, only show positions from accessible sites
                if (!isSuperAdmin && accessibleSites !== 'all') {
                    if (!accessibleSites.includes(pos.site_id)) {
                        return; // Skip positions from inaccessible sites
                    }
                }

                if (!positionMap.has(pos.pos_name)) {
                    positionMap.set(pos.pos_name, { pos_id: pos.pos_name, pos_name: pos.pos_name });
                }
            });
            return Array.from(positionMap.values());
        } else if (selectedWorkSite === 'any') {
            // For flexible employees, get positions from current flexible employees in the list
            const flexibleEmployeePositions = new Set();
            let hasFlexibleWithoutPosition = false;

            // Process employees to find truly flexible ones (work_site_id = null)
            (employees || []).forEach(emp => {
                // Only process truly flexible employees (work_site_id should be null)
                const isFlexible = emp.work_site_id === null;
                if (!isFlexible) {
                    return;
                }
                
                if (emp.position_name) {
                    flexibleEmployeePositions.add(emp.position_name);
                }
                if (emp.default_position_id && emp.defaultPosition?.pos_name) {
                    flexibleEmployeePositions.add(emp.defaultPosition.pos_name);
                }

                // Check for flexible employees without positions
                const hasNoPosition = !emp.position_name && !emp.default_position_id && !emp.defaultPosition?.pos_name;
                if (hasNoPosition) {
                    hasFlexibleWithoutPosition = true;
                }
            });

            // Convert to array format
            const positions = Array.from(flexibleEmployeePositions).map(posName => ({
                pos_id: posName,
                pos_name: posName,
            }));

            if (hasFlexibleWithoutPosition) {
                positions.unshift({ pos_id: 'none', pos_name: t('employee.noPosition', 'No Position') });
            }

            return positions;
        }
        return (allPositions || []).filter(pos => pos.site_id === parseInt(selectedWorkSite));
    }, [allPositions, selectedWorkSite, isSuperAdmin, accessibleSites, employees, t]);

    const handleFilterChange = useCallback((field, value) => {
        dispatch(setFilters({ [field]: value }));
    }, [dispatch]);

    const handleWorkSiteChange = useCallback((value) => {
        dispatch(setFilters({ work_site: value, position: 'all' }));
        
        // Clear employee cache to force fresh data fetch, especially for flexible employees
        if (value === 'any') {
            console.log('Clearing employee cache for flexible employees');
            dispatch(clearCache());
            // Small delay to allow fresh data to load
            setTimeout(() => {
                console.log('Cache cleared, fresh data should be loading...');
            }, 100);
        }
    }, [dispatch]);


    useEffect(() => {
        if (!workSites || workSites.length === 0) {
            dispatch(fetchWorkSites());
        }

        if (!allPositions || allPositions.length === 0) {
            dispatch(fetchPositions({}));
        }

        // For restricted admin with access to only one site, auto-select it
        if (!isSuperAdmin && accessibleSites !== 'all' && accessibleSites.length === 1 &&
            workSites && workSites.length > 0 && (filters.work_site === 'all' || !filters.work_site)) {
            const firstAccessibleSite = workSites.find(site => accessibleSites.includes(site.site_id));
            if (firstAccessibleSite) {
                handleWorkSiteChange(firstAccessibleSite.site_id.toString());
            }
        }
    }, [dispatch, workSites, allPositions, isSuperAdmin, accessibleSites, filters.work_site, handleWorkSiteChange]);


    const debouncedSearch = useMemo(
        () => debounce((value) => {
            handleFilterChange('search', value);
        }, 50),
        [handleFilterChange],
    );

    const handleReset = () => {
        dispatch(setFilters({
            status: 'active',
            position: 'all',
            search: '',
            work_site: 'all',
        }));
    };

    return (
        <Accordion defaultActiveKey="1" className="filters-accordion">
            <Accordion.Item eventKey="0">
                <Accordion.Header>
                    <h6 className="mb-0 d-flex align-items-center">
                        <i className="bi bi-funnel me-1"></i>
                        {t('common.filter')}
                    </h6>
                </Accordion.Header>
                <Accordion.Body>
                    <Form>
                        <Row className="g-3">
                            <Col xs={12}>
                                <Form.Control
                                    type="text"
                                    placeholder={t('employee.searchPlaceholder')}
                                    value={filters.search}
                                    onChange={(e) => debouncedSearch(e.target.value)}
                                    className="filter-input"
                                />
                            </Col>

                            <Col lg={3} md={6} xs={12}>
                                <Form.Select
                                    value={filters.status}
                                    onChange={(e) => handleFilterChange('status', e.target.value)}
                                    className="filter-select"
                                >
                                    <option value="all">{t('common.all')} {t('employee.status')}</option>
                                    <option value="active">{t('status.active')}</option>
                                    <option value="inactive">{t('status.inactive')}</option>
                                </Form.Select>
                            </Col>

                            <Col lg={3} md={6} xs={12}>
                                <Form.Select
                                    value={filters.work_site || 'all'}
                                    onChange={(e) => handleWorkSiteChange(e.target.value)}
                                    className="filter-select"
                                >
                                    {(isSuperAdmin || (accessibleSites !== 'all' && accessibleSites.length > 1)) && (
                                        <option value="all">{t('common.all')} {t('workSite.workSite')}</option>
                                    )}
                                    {workSites
                                        ?.filter(site => {
                                            if (!site.is_active) return false;
                                            // For restricted admins, only show accessible sites
                                            if (!isSuperAdmin && accessibleSites !== 'all') {
                                                // console.log('EmployeeFilters - filtering site:', site.site_name, site.site_id, 'hasAccess:', hasAccess);
                                                return accessibleSites.includes(site.site_id);
                                            }
                                            return true;
                                        })
                                        .map((site) => (
                                            <option key={site.site_id} value={site.site_id}>
                                                {site.site_name}
                                            </option>
                                        ))}
                                    <option value="any">{t('employee.commonWorkSite')}</option>
                                </Form.Select>
                            </Col>

                            {/* Должность */}
                            <Col lg={3} md={6} xs={12}>
                                <Form.Select
                                    value={filters.position}
                                    onChange={(e) => handleFilterChange('position', e.target.value)}
                                    className="filter-select"
                                    disabled={selectedWorkSite !== 'all' && selectedWorkSite !== 'any' && filteredPositions.length === 0}
                                >
                                    <option value="all">{t('common.all')} {t('employee.position')}</option>
                                    {filteredPositions.map((position) => (
                                        <option key={position.pos_id} value={position.pos_id}>
                                            {position.pos_name}
                                        </option>
                                    ))}
                                </Form.Select>
                            </Col>

                            <Col lg={3} md={6} xs={12}>
                                <Button
                                    variant="secondary"
                                    className="w-100 reset-button"
                                    onClick={handleReset}
                                >
                                    <i className="bi bi-arrow-clockwise me-2"></i>
                                    {t('common.reset')}
                                </Button>
                            </Col>
                        </Row>
                    </Form>
                </Accordion.Body>
            </Accordion.Item>
        </Accordion>
    );
};

export default EmployeeFilters;