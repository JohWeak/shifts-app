import React, { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { format, subMonths } from 'date-fns';
import {
    Container,
    Row,
    Col,
    Card,
    Form,
    Button,
    Spinner,
    Table
} from 'react-bootstrap';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';
import PageHeader from 'shared/ui/components/PageHeader/PageHeader';
import {worksiteAPI} from 'shared/api/apiService';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import StatusBadge from 'shared/ui/components/StatusBadge/StatusBadge';
import EmptyState from 'shared/ui/components/EmptyState/EmptyState';
import { fetchWorkSites } from 'features/admin-workplace-settings/model/workplaceSlice';
import './index.css';

const Reports = () => {
    const { t, i18n } = useI18n(); // Достаем i18n для локали
    const dispatch = useDispatch();

    const { workSites: sites, loading: sitesLoading } = useSelector((state) => state.workplace);

    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState(null);
    const [selectedSite, setSelectedSite] = useState('');
    const [dateRange, setDateRange] = useState({
        startDate: format(subMonths(new Date(), 1), 'yyyy-MM-dd'),
        endDate: format(new Date(), 'yyyy-MM-dd'),
    });

    useEffect(() => {
        if (!sites || (sites.length === 0 && !sitesLoading)) {
            dispatch(fetchWorkSites({ includeStats: false }));
        }
    }, [dispatch, sites, sitesLoading]);

    useEffect(() => {
        if (sites && sites.length > 0 && !selectedSite) {
            setSelectedSite(sites[0].site_id);
        }
    }, [sites, selectedSite]);

    const handleFetchStats = async () => {
        if (!selectedSite) return;
        setLoading(true);
        setStats(null);
        try {
            // Передаем параметры как объект `params`
            const response = await worksiteAPI.fetchWorkSiteStats(selectedSite, {
                startDate: dateRange.startDate,
                endDate: dateRange.endDate
            });
            if (response.success) {
                setStats(response.data);
            }
        } catch (error) {
            console.error('Error fetching dashboard overview:', error);
            setStats(null);
        } finally {
            setLoading(false);
        }
    };

    const chartData = useMemo(() => {
        if (!stats || !stats.schedules) return [];
        // Используем реальные данные из s.statistics, которое является summary
        return stats.schedules.map(s => ({
            name: format(new Date(s.start_date), 'dd/MM/yy'),
            coverage: s.statistics.overall_coverage,
            issues: s.statistics.issues_count
        }));
    }, [stats]);

    // Функция для форматирования даты в зависимости от локали
    const formatDate = (dateString) => {
        try {
            return new Intl.DateTimeFormat(i18n.language, { dateStyle: 'long' }).format(new Date(dateString));
        } catch (e) {
            return dateString;
        }
    };

    return (
        <Container fluid className="p-2 reports-container">
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
                                    onChange={e => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group controlId="endDate">
                                <Form.Label>{t('common.endDate')}</Form.Label>
                                <Form.Control
                                    type="date"
                                    value={dateRange.endDate}
                                    onChange={e => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={2}>
                            <Button onClick={handleFetchStats} className="w-100" disabled={loading || !selectedSite}>
                                {loading ? <Spinner as="span" animation="border" size="sm" /> : t('common.apply')}
                            </Button>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {loading && <div className="text-center p-5"><Spinner animation="border" variant="primary" /></div>}

            {!loading && stats && (
                <>
                    <Row className="mb-4">
                        <Col md={4} className="mb-3">
                            <Card className="summary-card border-primary shadow-sm">
                                <Card.Body>
                                    <div className="metric-value">{stats.schedules_count}</div>
                                    <div className="metric-label">{t('reports.schedulesInPeriod')}</div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={4} className="mb-3">
                            <Card className="summary-card border-success shadow-sm">
                                <Card.Body>
                                    <div className="metric-value">{stats.avg_coverage || 0}%</div>
                                    <div className="metric-label">{t('reports.avgCoverage')}</div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={4} className="mb-3">
                            <Card className="summary-card border-danger shadow-sm">
                                <Card.Body>
                                    <div className="metric-value">{stats.total_issues}</div>
                                    <div className="metric-label">{t('reports.totalIssues')}</div>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

                    <Card className="shadow-sm mb-4">
                        <Card.Header as="h5">{t('reports.chartTitle')}</Card.Header>
                        <Card.Body className="chart-container">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis yAxisId="left" orientation="left" stroke="var(--bs-primary)" />
                                    <YAxis yAxisId="right" orientation="right" stroke="var(--bs-danger)" />
                                    <Tooltip contentStyle={{
                                        backgroundColor: 'var(--bs-body-bg)',
                                        borderColor: 'var(--bs-border-color)'
                                    }}/>
                                    <Legend />
                                    <Bar yAxisId="left" dataKey="coverage" fill="var(--bs-primary)" name={t('reports.coverage')} />
                                    <Bar yAxisId="right" dataKey="issues" fill="var(--bs-danger)" name={t('reports.issues')} />
                                </BarChart>
                            </ResponsiveContainer>
                        </Card.Body>
                    </Card>

                    {/* === НАЧАЛО ОБНОВЛЕННОЙ ТАБЛИЦЫ === */}
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
                                {stats.schedules.map(s => s.statistics && ( // Добавляем проверку, что статистика есть
                                    <tr key={s.id}>
                                        <td>{formatDate(s.start_date)}</td>
                                        <td><StatusBadge status={s.status} /></td>
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
                    {/* === КОНЕЦ ОБНОВЛЕННОЙ ТАБЛИЦЫ === */}
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