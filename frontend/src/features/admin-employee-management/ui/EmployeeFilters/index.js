// frontend/src/features/admin-employee-management/ui/EmployeeFilters/index.js
import React, {useCallback, useEffect, useMemo} from 'react';
import {Accordion, Button, Col, Form, Row} from 'react-bootstrap';
import {useDispatch, useSelector} from 'react-redux';
import {debounce} from 'lodash';
import {useI18n} from 'shared/lib/i18n/i18nProvider';
import {clearCache, setFilters} from '../../model/employeeSlice';
import {fetchPositions, fetchWorkSites} from 'features/admin-workplace-settings/model/workplaceSlice';
import './EmployeeFilters.css';

const EmployeeFilters = () => {
    const {t} = useI18n();
    const dispatch = useDispatch();
    const {filters, employees, loading} = useSelector((state) => state.employees);
    const {workSites, positions: allPositions} = useSelector((state) => state.workplace);
    const {user} = useSelector((state) => state.auth);
    const [flexiblePositionsCache, setFlexiblePositionsCache] = React.useState(null);
    const [waitingForFreshData, setWaitingForFreshData] = React.useState(false);

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
                    positionMap.set(pos.pos_name, {pos_id: pos.pos_name, pos_name: pos.pos_name});
                }
            });
            return Array.from(positionMap.values());
        } else if (selectedWorkSite === 'any') {
            // For flexible employees, use cached positions to avoid dependency on current filtered list
            return flexiblePositionsCache || [];
        }
        return (allPositions || []).filter(pos => pos.site_id === parseInt(selectedWorkSite));
    }, [allPositions, selectedWorkSite, isSuperAdmin, accessibleSites, flexiblePositionsCache]);

    const handleFilterChange = useCallback((field, value) => {
        dispatch(setFilters({[field]: value}));
    }, [dispatch]);

    const handleWorkSiteChange = useCallback((value) => {
        dispatch(setFilters({work_site: value, position: 'all'}));

        // Reset flexible positions cache when changing work site
        setFlexiblePositionsCache(null);

        // Clear employee cache to force fresh data fetch for flexible employees
        if (value === 'any') {
            dispatch(clearCache());
            setWaitingForFreshData(true);
        } else {
            setWaitingForFreshData(false);
        }
    }, [dispatch]);

    // Cache flexible positions when we have fresh flexible employee data
    useEffect(() => {
        const shouldCache = selectedWorkSite === 'any' &&
            filters.position === 'all' &&
            employees?.length > 0 &&
            !flexiblePositionsCache &&
            !loading &&
            waitingForFreshData &&
            employees.some(emp => emp.work_site_id === null);

        if (shouldCache) {
            const flexibleEmployeePositions = new Set();
            let hasFlexibleWithoutPosition = false;

            employees.forEach(emp => {
                if (emp.work_site_id !== null) return;

                if (emp.position_name) {
                    flexibleEmployeePositions.add(emp.position_name);
                }
                if (emp.default_position_id && emp.defaultPosition?.pos_name) {
                    flexibleEmployeePositions.add(emp.defaultPosition.pos_name);
                }

                const hasNoPosition = !emp.position_name && !emp.default_position_id && !emp.defaultPosition?.pos_name;
                if (hasNoPosition) {
                    hasFlexibleWithoutPosition = true;
                }
            });

            const positions = Array.from(flexibleEmployeePositions).map(posName => ({
                pos_id: posName,
                pos_name: posName,
            }));

            if (hasFlexibleWithoutPosition) {
                positions.unshift({pos_id: 'none', pos_name: t('employee.noPosition', 'No Position')});
            }

            setFlexiblePositionsCache(positions);
            setWaitingForFreshData(false);
        }
    }, [selectedWorkSite, filters.position, employees, flexiblePositionsCache, loading, waitingForFreshData, t]);

    useEffect(() => {
        if (!workSites || workSites.length === 0) {
            dispatch(fetchWorkSites());
        }

        if (!allPositions || allPositions.length === 0) {
            dispatch(fetchPositions({}));
        }

        // Auto-select work site based on admin access
        if (!isSuperAdmin && accessibleSites !== 'all' && workSites && workSites.length > 0 && 
            (filters.work_site === 'all' || !filters.work_site)) {
            
            if (accessibleSites.length === 1) {
                // If admin has access to only one site, auto-select it
                const firstAccessibleSite = workSites.find(site => accessibleSites.includes(site.site_id));
                if (firstAccessibleSite) {
                    handleWorkSiteChange(firstAccessibleSite.site_id.toString());
                }
            }
            // If admin has access to multiple sites, keep "all" as default (already set)
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
            role: 'all',
        }));
    };

    return (
        <Accordion defaultActiveKey="0" className="filters-accordion">
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
                            {/* Search and Reset Button Row */}
                            <Col xs={12}>
                                <Row className="g-2">
                                    <Col>
                                        <Form.Control
                                            type="text"
                                            placeholder={t('employee.searchPlaceholder')}
                                            value={filters.search}
                                            onChange={(e) => debouncedSearch(e.target.value)}
                                            className="filter-input"
                                        />
                                    </Col>
                                    <Col xs="auto">
                                        <Button
                                            variant="secondary"
                                            onClick={handleReset}
                                            className="reset-button"
                                        >
                                            <i className="bi bi-arrow-clockwise"></i>
                                        </Button>
                                    </Col>
                                </Row>
                            </Col>

                            {/* Status Filter */}
                            <Col lg={3} md={6} xs={12}>
                                <div className="filter-group">
                                    <label className="filter-label">{t('employee.status')}</label>
                                    <Form.Select
                                        value={filters.status}
                                        onChange={(e) => handleFilterChange('status', e.target.value)}
                                        className="filter-select"
                                    >
                                        <option value="all">{t('common.all')}</option>
                                        <option value="active">{t('status.active')}</option>
                                        <option value="inactive">{t('status.inactive')}</option>
                                    </Form.Select>
                                </div>
                            </Col>

                            {/* Work Site Filter */}
                            <Col lg={3} md={6} xs={12}>
                                <div className="filter-group">
                                    <label className="filter-label">{t('workSite.workSite')}</label>
                                    <Form.Select
                                        value={filters.work_site || 'all'}
                                        onChange={(e) => handleWorkSiteChange(e.target.value)}
                                        className="filter-select"
                                    >
                                        {(isSuperAdmin || (accessibleSites !== 'all' && accessibleSites.length > 0)) && (
                                            <option value="all">{t('common.all')}</option>
                                        )}
                                        {workSites
                                            ?.filter(site => {
                                                if (!site.is_active) return false;
                                                if (!isSuperAdmin && accessibleSites !== 'all') {
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
                                </div>
                            </Col>

                            {/* Position Filter */}
                            <Col lg={3} md={6} xs={12}>
                                <div className="filter-group">
                                    <label className="filter-label">{t('employee.position')}</label>
                                    <Form.Select
                                        value={filters.position}
                                        onChange={(e) => handleFilterChange('position', e.target.value)}
                                        className="filter-select"
                                        disabled={selectedWorkSite !== 'all' && selectedWorkSite !== 'any' && filteredPositions.length === 0}
                                    >
                                        <option value="all">{t('common.all')}</option>
                                        {filteredPositions.map((position) => (
                                            <option key={position.pos_id} value={position.pos_id}>
                                                {position.pos_name}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </div>
                            </Col>

                            {/* Role Filter */}
                            <Col lg={3} md={6} xs={12}>
                                <div className="filter-group">
                                    <label className="filter-label">{t('employee.role')}</label>
                                    <Form.Select
                                        value={filters.role}
                                        onChange={(e) => handleFilterChange('role', e.target.value)}
                                        className="filter-select"
                                    >
                                        <option value="all">{t('common.all')}</option>
                                        <option value="employee">{t('role.employee')}</option>
                                        <option value="admin">{t('role.admin')}</option>
                                    </Form.Select>
                                </div>
                            </Col>
                        </Row>
                    </Form>
                </Accordion.Body>
            </Accordion.Item>
        </Accordion>
    );
};

export default EmployeeFilters;