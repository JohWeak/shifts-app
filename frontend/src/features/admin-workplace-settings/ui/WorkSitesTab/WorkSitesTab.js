// frontend/src/features/admin-workplace-settings/ui/WorkSitesTab/WorkSitesTab.js
import React, {useState, useEffect} from 'react';
import {
    Card,
    Table,
    Button,
    Badge,
    Alert,
    Form,
    InputGroup,
    Row,
    Col, Spinner
} from 'react-bootstrap';
import {useDispatch, useSelector} from 'react-redux';
import {useNavigate} from 'react-router-dom';
import { useSortableData } from 'shared/hooks/useSortableData';
import SortableHeader from 'shared/ui/components/SortableHeader/SortableHeader';
import {useI18n} from 'shared/lib/i18n/i18nProvider';
import ConfirmationModal from 'shared/ui/components/ConfirmationModal/ConfirmationModal';
import WorkSiteModal from '../WorkSiteModal/WorkSiteModal';
import { nanoid } from '@reduxjs/toolkit';
import { addNotification, updateNotification } from 'app/model/notificationsSlice';
import {
    fetchWorkSites,
    deleteWorkSite,
    restoreWorkSite,
    clearOperationStatus
} from '../../model/workplaceSlice';

import './WorkSitesTab.css';

const WorkSitesTab = ({onSelectSite}) => {
    const {t} = useI18n();
    const dispatch = useDispatch();
    const navigate = useNavigate();


    const {
        workSites = [], // Значение по умолчанию
        loading,
        operationLoading,
        error,
        operationStatus
    } = useSelector(state => state.workplace || {}); // Защита от undefined state

    const [showModal, setShowModal] = useState(false);
    const [selectedSite, setSelectedSite] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
    const [siteToDelete, setSiteToDelete] = useState(null);
    const [siteToRestore, setSiteToRestore] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('active');
    const [isInitialized, setIsInitialized] = useState(false);
    const [selectedSiteId, setSelectedSiteId] = useState(null);



    const handleEdit = (site) => {
        setSelectedSite(site);
        setShowModal(true);
    };

    const handleAdd = () => {
        setSelectedSite(null);
        setShowModal(true);
    };

    const handleDelete = (site) => {
        setSiteToDelete(site);
        setShowDeleteConfirm(true);
    };

    const handleRestore = (site) => {
        setSiteToRestore(site);
        setShowRestoreConfirm(true);
    };

    const confirmDelete = async () => {
        if (siteToDelete) {
            setShowDeleteConfirm(false);

            // 1. Создаем ID для нашего уведомления
            const notificationId = nanoid();

            // 2. Показываем начальное уведомление "В процессе..."
            dispatch(addNotification({
                id: notificationId,
                message: t('common.saving'), // Используем 'saving' или 'processing'
                variant: 'info',
                duration: null // Не исчезает само
            }));

            try {
                // 3. Выполняем асинхронную операцию
                const result = await dispatch(deleteWorkSite(siteToDelete.site_id)).unwrap();

                // 4. Успех! Обновляем существующее уведомление
                const { deactivatedPositions = 0, deactivatedEmployees = 0 } = result;
                const successMessage = (deactivatedPositions > 0 || deactivatedEmployees > 0)
                    ? t('workplace.worksites.deletedWithDetails', {
                        positions: deactivatedPositions,
                        employees: deactivatedEmployees
                    })
                    : t('workplace.worksites.deleted');

                dispatch(updateNotification({
                    id: notificationId,
                    message: successMessage,
                    variant: 'success',
                    duration: 3000 // Теперь оно закроется само через 3 сек
                }));

                // Обновляем данные в таблице
                dispatch(fetchWorkSites());

            } catch (error) {
                // 5. Ошибка! Обновляем существующее уведомление
                dispatch(updateNotification({
                    id: notificationId,
                    message: error.message || t('errors.generic'),
                    variant: 'danger',
                    duration: null // Ошибки не должны исчезать сами
                }));
            } finally {
                // 6. Очищаем состояние
                setSiteToDelete(null);
            }
        }
    };

    const confirmRestore = async () => {
        if (siteToRestore) {
            setShowRestoreConfirm(false);

            // 1. Создаем ID для нашего уведомления
            const notificationId = nanoid();

            // 2. Показываем начальное уведомление "В процессе..."
            dispatch(addNotification({
                id: notificationId,
                message: t('common.saving'),
                variant: 'info',
                duration: null // Не исчезает само
            }));

            try {
                // 3. Выполняем асинхронную операцию
                const result = await dispatch(restoreWorkSite(siteToRestore.site_id)).unwrap();

                // 4. Успех! Обновляем существующее уведомление
                const { restoredPositions = 0, restoredEmployees = 0 } = result;
                const successMessage = (restoredPositions > 0 || restoredEmployees > 0)
                    ? t('workplace.worksites.restoredWithDetails', {
                        positions: restoredPositions,
                        employees: restoredEmployees
                    })
                    : t('workplace.worksites.restored');

                dispatch(updateNotification({
                    id: notificationId,
                    message: successMessage,
                    variant: 'success',
                    duration: 3000 // Закроется само
                }));

                // Обновляем данные в таблице
                dispatch(fetchWorkSites());

            } catch (error) {
                // 5. Ошибка! Обновляем существующее уведомление
                dispatch(updateNotification({
                    id: notificationId,
                    message: error.message || t('errors.generic'),
                    variant: 'danger',
                    duration: null // Ошибки не исчезают сами
                }));
            } finally {
                // 6. Очищаем состояние
                setSiteToRestore(null);
            }
        }
    };

    const handleModalClose = () => {
        setShowModal(false);
        setSelectedSite(null);
    };

    const handleModalSuccess = () => {
        setShowModal(false);
        setSelectedSite(null);
        dispatch(fetchWorkSites());
    };

    // Функция для перехода к отфильтрованному списку сотрудников
    const handleViewEmployees = (site) => {
        // Переход на страницу сотрудников с фильтром по work site
        navigate('/admin/employees', {
            state: {
                filters: {
                    work_site: site.site_id.toString()
                }
            }
        });
    };
    const handleRowClick = (site) => {
        setSelectedSiteId(site.site_id);
        // Проверяем, что функция передана
        if (onSelectSite) {
            onSelectSite(site);
        }
    };

    // Создаем детальное предупреждение для удаления
    const getDeleteConfirmMessage = (site) => {
        if (!site) return '';

        const positionCount = site.positionCount || 0;
        const employeeCount = site.employeeCount || 0;

        if (positionCount === 0 && employeeCount === 0) {
            return t('workplace.worksites.deleteConfirm');
        }

        return t('workplace.worksites.deleteConfirmWithDetails', {
            site: site.site_name,
            positions: positionCount,
            employees: employeeCount
        });
    };

    // Фильтрация сайтов
    // Фильтрация и сортировка сайтов
    const filteredSites = React.useMemo(() => {
        if (!workSites || !Array.isArray(workSites)) return [];

        let filtered = workSites.filter(site => {
            const matchesSearch = site.site_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                site.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                site.phone?.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesSearch;
        });

        if (statusFilter === 'active') {
            filtered = filtered.filter(site => site.is_active);
        }

        return filtered;
    }, [workSites, searchTerm, statusFilter]);

// Определяем аксессоры для сортировки
    const sortingAccessors = React.useMemo(() => ({
        name: (site) => site.site_name,
        address: (site) => site.address || '',
        phone: (site) => site.phone || '',
        status: (site) => (site.is_active ? 0 : 1), // Сортируем по статусу (активные сначала)
        positions: (site) => site.positionCount || 0,
        employees: (site) => site.employeeCount || 0,
    }), []);

// Используем хук для сортировки
    const { sortedItems: sortedSites, requestSort, sortConfig } = useSortableData(
        filteredSites,
        { field: 'status', order: 'ASC' }, // Начальная сортировка по статусу
        sortingAccessors
    );

    if (!isInitialized) {
        dispatch(fetchWorkSites()).then(() => setIsInitialized(true));
    }

    // // Добавим загрузку данных при монтировании
    // useEffect(() => {
    //     if (!isInitialized) {
    //         dispatch(fetchWorkSites());
    //         setIsInitialized(true);
    //     }
    // }, [dispatch, isInitialized]);
    console.log('WorkSitesTab re-render, operationLoading:', operationLoading);
    return (
        <Card className="workplace-tab-content">
            <Card.Header className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">{t('workplace.worksites.title')}</h5>
                <Button
                    variant="primary"
                    size="sm"
                    onClick={handleAdd}
                >
                    <i className="bi bi-plus-circle me-2"></i>
                    {t('workplace.worksites.add')}
                </Button>
            </Card.Header>

            <Card.Body>
                <Row className="mb-3">
                    <Col md={8}>
                        <InputGroup>
                            <InputGroup.Text>
                                <i className="bi bi-search"></i>
                            </InputGroup.Text>
                            <Form.Control
                                type="text"
                                placeholder={t('common.search')}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </InputGroup>
                    </Col>
                    <Col md={4}>
                        <Form.Select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="status-filter"
                        >
                            <option value="active">{t('workplace.worksites.activeOnly')}</option>
                            <option value="all">{t('workplace.worksites.allSites')}</option>
                        </Form.Select>
                    </Col>
                </Row>

                {sortedSites.length === 0 ? (
                    <div className="workplace-empty">
                        <i className="bi bi-building"></i>
                        <p>
                            {searchTerm || statusFilter !== 'all'
                                ? t('workplace.worksites.noSitesFound')
                                : t('workplace.worksites.noSites')}
                        </p>
                    </div>
                ) : (
                    <Table responsive hover className="workplace-table">
                        <thead>
                        <tr>
                            <SortableHeader sortKey="name" sortConfig={sortConfig} onSort={requestSort}>
                                {t('workplace.worksites.name')}
                            </SortableHeader>
                            <SortableHeader sortKey="address" sortConfig={sortConfig} onSort={requestSort}>
                                {t('workplace.worksites.address')}
                            </SortableHeader>
                            <SortableHeader sortKey="phone" sortConfig={sortConfig} onSort={requestSort}>
                                {t('workplace.worksites.phone')}
                            </SortableHeader>
                            <SortableHeader sortKey="status" sortConfig={sortConfig} onSort={requestSort}>
                                {t('common.status')}
                            </SortableHeader>
                            <SortableHeader sortKey="positions" sortConfig={sortConfig} onSort={requestSort}>
                                {t('workplace.worksites.positions')}
                            </SortableHeader>
                            <SortableHeader sortKey="employees" sortConfig={sortConfig} onSort={requestSort}>
                                {t('workplace.worksites.employees')}
                            </SortableHeader>
                            <th className="text-muted text-center">{t('common.actions')}</th>
                        </tr>
                        </thead>
                        <tbody>
                        {sortedSites.map(site => (
                            <tr
                                key={site.site_id}
                                className={`clickable-row ${!site.is_active ? 'inactive-row' : ''}`}
                                onClick={() => handleRowClick(site)}
                                style={{cursor: 'pointer'}}
                            >
                                <td className="site-name">{site.site_name}</td>
                                <td>{site.address || '-'}</td>
                                <td>{site.phone || '-'}</td>
                                <td onClick={(e) => e.stopPropagation()}>
                                    <Badge
                                        bg={site.is_active ? 'success' : 'secondary'}
                                        className="status-badge"
                                    >
                                        {site.is_active
                                            ? t('common.active')
                                            : t('common.inactive')}
                                    </Badge>
                                </td>
                                <td className="text-center">
                                    <Badge
                                        bg={site.positionCount > 0 ? 'info' : 'secondary'}
                                        pill>
                                        {site.positionCount || 0}
                                    </Badge>
                                </td>
                                <td className="text-center">
                                    <Badge
                                        bg={site.employeeCount > 0 ? 'primary' : 'secondary'}
                                        pill>
                                        {site.employeeCount || 0}
                                    </Badge>
                                </td>
                                <td onClick={(e) => e.stopPropagation()}>
                                    <div className="workplace-actions">
                                        <Button
                                            variant="link"
                                            size="sm"
                                            className="p-1"
                                            onClick={() => handleEdit(site)}
                                            title={t('common.edit')}
                                        >
                                            <i className="bi bi-pencil"></i>
                                        </Button>
                                        <Button
                                            variant="link"
                                            size="sm"
                                            className="p-1"
                                            onClick={() => handleViewEmployees(site)}
                                            title={t('workplace.worksites.viewEmployees')}
                                        >
                                            <i className="bi bi-people"></i>
                                        </Button>
                                        {site.is_active ? (
                                            <Button
                                                variant="link"
                                                size="sm"
                                                className="p-1 text-danger"
                                                onClick={() => handleDelete(site)}
                                                title={t('common.delete')}
                                            >
                                                <i className="bi bi-trash"></i>
                                            </Button>
                                        ) : (
                                            <Button
                                                variant="link"
                                                size="sm"
                                                className="p-1 text-success"
                                                onClick={() => handleRestore(site)}
                                                title={t('common.restore')}
                                            >
                                                <i className="bi bi-arrow-clockwise"></i>
                                            </Button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </Table>
                )}
            </Card.Body>

            <WorkSiteModal
                show={showModal}
                onHide={handleModalClose}
                onSuccess={handleModalSuccess}
                site={selectedSite}
            />

            <ConfirmationModal
                show={showDeleteConfirm}
                onHide={() => !operationLoading && setShowDeleteConfirm(false)} // Блокируем закрытие во время обработки
                onConfirm={confirmDelete}
                title={t('common.confirm')}
                message={getDeleteConfirmMessage(siteToDelete)}
                confirmVariant="danger"
                confirmText={t('common.deactivate')}
                loading={operationLoading}
            />

            <ConfirmationModal
                show={showRestoreConfirm}
                onHide={() => !operationLoading && setShowRestoreConfirm(false)}
                onConfirm={confirmRestore}
                title={t('common.confirm')}
                message={t('workplace.worksites.restoreConfirm', { site: siteToRestore?.site_name })}
                confirmVariant="success"
                confirmText={t('common.restore')}
                loading={operationLoading}
            />
        </Card>
    );
};

export default WorkSitesTab;