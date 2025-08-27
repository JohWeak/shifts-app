//frontend/src/features/admin-reports/index.js

import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {format, subMonths} from 'date-fns';
import {Button, Card, Col, Container, Form, Row, Spinner, Table} from 'react-bootstrap';
import {ResponsiveBar} from '@nivo/bar';
import PageHeader from 'shared/ui/components/PageHeader/PageHeader';
import {worksiteAPI} from 'shared/api/apiService';
import {useI18n} from 'shared/lib/i18n/i18nProvider';
import StatusBadge from 'shared/ui/components/StatusBadge/StatusBadge';
import EmptyState from 'shared/ui/components/EmptyState/EmptyState';
import {fetchWorkSites} from 'features/admin-workplace-settings/model/workplaceSlice';
import {formatScheduleDate, formatWeekRange} from "../../shared/lib/utils/scheduleUtils";
import './index.css';


const Reports = () => {
    const {t, locale} = useI18n();
    const dispatch = useDispatch();

    const {workSites: sites, loading: sitesLoading} = useSelector((state) => state.workplace);
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState(null);
    const [selectedSite, setSelectedSite] = useState('');
    const [dateRange, setDateRange] = useState({
        startDate: format(subMonths(new Date(), 1), 'yyyy-MM-dd'),
        endDate: format(new Date(), 'yyyy-MM-dd'),
    });

    useEffect(() => {
        dispatch(fetchWorkSites());
    }, [dispatch]);

    useEffect(() => {
        if (sites && sites.length > 0 && !selectedSite) {
            setSelectedSite(sites[0].site_id);
        }

    }, [sites, selectedSite]);


    const handleFetchStats = useCallback(async () => {
        if (!selectedSite) return;

        setLoading(true);
        setStats(null);
        try {
            const responseData = await worksiteAPI.fetchWorkSiteStats(selectedSite, {
                startDate: dateRange.startDate,
                endDate: dateRange.endDate
            });
            setStats(responseData);
            console.log('Worksite stats overview:', responseData);
        } catch (error) {
            console.error('Error fetching dashboard overview:', error);
            setStats(null);
        } finally {
            setLoading(false);
        }

    }, [dateRange.endDate, dateRange.startDate, selectedSite]);

    useEffect(() => {
        void handleFetchStats();
    }, [handleFetchStats]);

    const chartData = useMemo(() => {
        if (!stats || !stats.schedules) return [];
        return stats.schedules.map(s => ({
            date: (formatScheduleDate(s.start_date, s.end_date)),
            [t('reports.coverage')]: s.statistics.overall_coverage,
            [t('reports.issues')]: s.statistics.issues_count,
        })).reverse();
    }, [stats, t]);
    const nivoTheme = {
        background: 'transparent',
        axis: {
            domain: {line: {stroke: 'transparent'}},
            legend: {text: {fill: 'var(--bs-secondary)'}},
            ticks: {line: {stroke: 'var(--bs-secondary)', strokeWidth: 1}, text: {fill: 'var(--bs-secondary)'}},
        },
        grid: {line: {stroke: 'var(--bs-border-color)', strokeDasharray: '3 3'}},
        tooltip: {
            container: {
                background: 'var(--bs-body-bg)',
                color: 'var(--bs-body-color)',
                border: '1px solid var(--bs-border-color)',
                boxShadow: 'var(--shadow-lg)',
                borderRadius: 'var(--radius-md)'
            }
        },
        legends: {
            text: {
                fill: 'var(--bs-body-color)'
            }
        }
    };

    return (
        <Container fluid className="p-2 reports-page">
            <PageHeader
                icon="graph-up-arrow"
                title={t('reports.title')}
                subtitle={t('reports.description')}
            />

            <Card className="filter-bar shadow-sm">
                <Card.Body>
                    <Row className="align-items-end g-3">
                        <Col md={4}>
                            <Form.Group controlId="siteSelect">
                                <Form.Label>{t('schedule.workSite')}</Form.Label>
                                <Form.Select
                                    value={selectedSite}
                                    onChange={(e) => setSelectedSite(e.target.value)}
                                    disabled={sitesLoading || sites.length === 0}
                                >
                                    {sitesLoading ? (
                                        <option>{t('common.loading')}...</option>
                                    ) : (
                                        sites.map(site => (
                                            <option key={site.site_id} value={site.site_id}>
                                                {site.site_name}
                                            </option>
                                        ))
                                    )}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group controlId="startDate">
                                <Form.Label>{t('common.startDate')}</Form.Label>
                                <Form.Control
                                    type="date"
                                    value={dateRange.startDate}
                                    onChange={e => setDateRange(prev => ({...prev, startDate: e.target.value}))}
                                />

                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group controlId="endDate">
                                <Form.Label>{t('common.endDate')}</Form.Label>
                                <Form.Control
                                    type="date"
                                    value={dateRange.endDate}
                                    onChange={e => setDateRange(prev => ({...prev, endDate: e.target.value}))}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={2}>
                            <Button onClick={handleFetchStats} className="w-100" disabled={loading || !selectedSite}>
                                {loading ? <Spinner as="span" animation="border" size="sm"/> : t('common.apply')}
                            </Button>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {loading && <div className="text-center p-5"><Spinner animation="border" variant="primary"/></div>}

            {!loading && stats && (
                <>
                    <Row className="mb-4">
                        <Col md={4} className="mb-3">
                            <Card className="summary-card border-primary">
                                <Card.Body>
                                    <div className="metric-value">{stats.schedules_count}</div>
                                    <div className="metric-label">{t('reports.schedulesInPeriod')}</div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={4} className="mb-3">
                            <Card className="summary-card border-success">
                                <Card.Body>
                                    <div className="metric-value">{stats.avg_coverage || 0}%</div>
                                    <div className="metric-label">{t('reports.avgCoverage')}</div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={4} className="mb-3">
                            <Card className="summary-card border-danger">
                                <Card.Body>
                                    <div className="metric-value">{stats.total_issues}</div>
                                    <div className="metric-label">{t('reports.totalIssues')}</div>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

                    <Card>
                        <Card.Header as="h5">{t('reports.chartTitle')}</Card.Header>
                        <Card.Body>
                            <div className="chart-wrapper">
                                <ResponsiveBar
                                    data={chartData}
                                    keys={[t('reports.coverage'), t('reports.issues')]}
                                    indexBy="date"
                                    margin={{top: 50, right: 130, bottom: 50, left: 60}}
                                    padding={0.3}
                                    groupMode="grouped"
                                    valueScale={{type: 'linear'}}
                                    indexScale={{type: 'band', round: true}}
                                    colors={['var(--bs-primary)', 'var(--bs-danger)']}
                                    theme={nivoTheme}
                                    borderColor={{from: 'color', modifiers: [['darker', 1.6]]}}
                                    axisTop={null}
                                    axisRight={null}
                                    axisBottom={{
                                        tickSize: 5,
                                        tickPadding: 5,
                                        tickRotation: 0,
                                        legend: t('common.date'),
                                        legendPosition: 'middle',
                                        legendOffset: 32
                                    }}
                                    axisLeft={{
                                        tickSize: 5,
                                        tickPadding: 5,
                                        tickRotation: 0,
                                        legend: t('common.value'),
                                        legendPosition: 'middle',
                                        legendOffset: -40
                                    }}
                                    enableLabel={false}
                                    legends={[
                                        {
                                            dataFrom: 'keys',
                                            anchor: 'bottom-right',
                                            direction: 'column',
                                            justify: false,
                                            translateX: 120,
                                            translateY: 0,
                                            itemsSpacing: 2,
                                            itemWidth: 100,
                                            itemHeight: 20,
                                            itemDirection: 'left-to-right',
                                            itemOpacity: 0.85,
                                            symbolSize: 20,
                                            effects: [{on: 'hover', style: {itemOpacity: 1}}],
                                        },
                                    ]}
                                    motionConfig="stiff"
                                    isInteractive={true}
                                />
                            </div>
                        </Card.Body>
                    </Card>

                    <Card className="shadow-sm">
                        <Card.Header as="h5">{t('reports.details')}</Card.Header>
                        <Card.Body>
                            <Table responsive hover>
                                <thead>
                                <tr>
                                    <th>{t('common.startDate')}</th>
                                    <th>{t('common.status')}</th>
                                    <th>{t('reports.coverage')} (%)</th>
                                    <th>{t('reports.assignments')}</th>
                                    <th>{t('reports.employeesUsed')}</th>
                                    <th>{t('reports.issues')}</th>
                                </tr>
                                </thead>
                                <tbody>
                                {stats.schedules.map(s => s.statistics && (
                                    <tr key={s.id}>
                                        <td>{formatWeekRange(s.start_date, locale)}</td>
                                        <td><StatusBadge status={s.status}/></td>
                                        <td>{s.statistics.overall_coverage}</td>
                                        <td>{`${s.statistics.total_assignments} / ${s.statistics.total_required}`}</td>
                                        <td>{s.statistics.employees_used}</td>
                                        <td>{s.statistics.issues_count}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                </>
            )}

            {!loading && !stats && (
                <EmptyState
                    icon="bi-graph-up"
                    title={t('reports.empty.title')}
                    message={t('reports.empty.message')}
                    actionText={t('reports.empty.action')}
                    onAction={handleFetchStats}
                    showAction={!!selectedSite}
                />
            )}
        </Container>
    );
};

export default Reports;