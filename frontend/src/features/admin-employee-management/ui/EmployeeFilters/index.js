// frontend/src/features/admin-employee-management/ui/EmployeeFilters/index.js
import React, {useCallback, useEffect, useMemo} from 'react';
import {Accordion, Button, Col, Form, Row} from 'react-bootstrap';
import {useDispatch, useSelector} from 'react-redux';
import {debounce} from 'lodash';
import {useI18n} from 'shared/lib/i18n/i18nProvider';
import {setFilters} from '../../model/employeeSlice';
import {fetchPositions, fetchWorkSites} from 'features/admin-workplace-settings/model/workplaceSlice';
import './EmployeeFilters.css';

const EmployeeFilters = () => {
    const {t} = useI18n();
    const dispatch = useDispatch();
    const {filters} = useSelector((state) => state.employees);
    const {workSites, positions: allPositions} = useSelector((state) => state.workplace);

    const selectedWorkSite = filters.work_site || 'all';


    const filteredPositions = useMemo(() => {
        if (selectedWorkSite === 'all') {
            const positionMap = new Map();
            (allPositions || []).forEach(pos => {
                if (!positionMap.has(pos.pos_name)) {
                    positionMap.set(pos.pos_name, {pos_id: pos.pos_name, pos_name: pos.pos_name});
                }
            });
            return Array.from(positionMap.values());
        }
        return (allPositions || []).filter(pos => pos.site_id === parseInt(selectedWorkSite));
    }, [allPositions, selectedWorkSite]);

    const handleFilterChange = useCallback((field, value) => {
        dispatch(setFilters({[field]: value}));
    }, [dispatch]);

    useEffect(() => {
        // Загружаем сайты, если их нет
        if (!workSites || workSites.length === 0) {
            dispatch(fetchWorkSites());
        }
        // Загружаем должности, если их нет
        if (!allPositions || allPositions.length === 0) {
            dispatch(fetchPositions({}));
        }
    }, [dispatch, workSites, allPositions]);


    const handleWorkSiteChange = (value) => {
        dispatch(setFilters({work_site: value, position: 'all'}));
    };

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
                                    <option value="admin">{t('common.admin')}</option>
                                </Form.Select>
                            </Col>

                            <Col lg={3} md={6} xs={12}>
                                <Form.Select
                                    value={filters.work_site || 'all'}
                                    onChange={(e) => handleWorkSiteChange(e.target.value)}
                                    className="filter-select"
                                >
                                    <option value="all">{t('common.all')} {t('workSite.workSite')}</option>
                                    <option value="any">{t('employee.commonWorkSite')}</option>
                                    {workSites
                                        ?.filter(site => site.is_active)
                                        .map((site) => (
                                            <option key={site.site_id} value={site.site_id}>
                                                {site.site_name}
                                            </option>
                                        ))}
                                </Form.Select>
                            </Col>

                            {/* Должность */}
                            <Col lg={3} md={6} xs={12}>
                                <Form.Select
                                    value={filters.position}
                                    onChange={(e) => handleFilterChange('position', e.target.value)}
                                    className="filter-select"
                                    disabled={selectedWorkSite !== 'all' && filteredPositions.length === 0}
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