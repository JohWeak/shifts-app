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
    Dropdown
} from 'react-bootstrap';
import {useDispatch, useSelector} from 'react-redux';
import {useNavigate} from 'react-router-dom';
import {useI18n} from 'shared/lib/i18n/i18nProvider';
import ConfirmationModal from 'shared/ui/components/ConfirmationModal/ConfirmationModal';
import WorkSiteModal from '../WorkSiteModal/WorkSiteModal';
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
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [isInitialized, setIsInitialized] = useState(false);
    const [selectedSiteId, setSelectedSiteId] = useState(null);


    useEffect(() => {
        if (operationStatus === 'success') {
            setShowAlert(true);
            setAlertMessage(
                selectedSite
                    ? t('workplace.worksites.updated')
                    : siteToDelete
                        ? t('workplace.worksites.deleted')
                        : siteToRestore
                            ? t('workplace.worksites.restored')
                            : t('workplace.worksites.created')
            );
            setTimeout(() => {
                setShowAlert(false);
                dispatch(clearOperationStatus());
            }, 3000);
        }
    }, [operationStatus, dispatch, t, selectedSite, siteToDelete, siteToRestore]);

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
            await dispatch(deleteWorkSite(siteToDelete.site_id));
            setShowDeleteConfirm(false);
            setSiteToDelete(null);
            dispatch(fetchWorkSites());
        }
    };

    const confirmRestore = async () => {
        if (siteToRestore) {
            await dispatch(restoreWorkSite(siteToRestore.site_id));
            setShowRestoreConfirm(false);
            setSiteToRestore(null);
            dispatch(fetchWorkSites());
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

    // Фильтрация сайтов
    const filteredSites = (workSites && Array.isArray(workSites))
        ? workSites.filter(site => {
            const matchesSearch = site.site_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                site.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                site.phone?.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesSearch;
        })
        : [];

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
                {showAlert && (
                    <Alert
                        variant="success"
                        dismissible
                        onClose={() => setShowAlert(false)}
                    >
                        {alertMessage}
                    </Alert>
                )}

                {error && (
                    <Alert variant="danger" dismissible onClose={() => dispatch(clearOperationStatus())}>
                        {error}
                    </Alert>
                )}

                <InputGroup className="mb-3">
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

                {filteredSites.length === 0 ? (
                    <div className="workplace-empty">
                        <i className="bi bi-building"></i>
                        <p>{t('workplace.worksites.noSites')}</p>
                    </div>
                ) : (
                    <Table responsive hover className="workplace-table">
                        <thead>
                        <tr>
                            <th>{t('workplace.worksites.name')}</th>
                            <th>{t('workplace.worksites.address')}</th>
                            <th>{t('workplace.worksites.phone')}</th>
                            <th>{t('common.status')}</th>
                            <th className="text-center">{t('workplace.worksites.positions')}</th>
                            <th className="text-center">{t('workplace.worksites.employees')}</th>
                            <th></th>
                        </tr>
                        </thead>
                        <tbody>
                        {filteredSites.map(site => (
                            <tr
                                key={site.site_id}
                                className={`clickable-row ${!site.is_active ? 'inactive-row' : ''}`}
                                onClick={() => handleRowClick(site)}
                                style={{cursor: 'pointer'}}
                            >
                                <td className="fw-semibold">{site.site_name}</td>
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
                                    <Badge bg="info" pill>
                                        {site.positionCount || 0}
                                    </Badge>
                                </td>
                                <td className="text-center">
                                    <Badge bg="primary" pill>
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
                onHide={() => setShowDeleteConfirm(false)}
                onConfirm={confirmDelete}
                title={t('common.confirm')}
                message={t('workplace.worksites.deleteConfirm')}
                confirmVariant="danger"
            />

            <ConfirmationModal
                show={showRestoreConfirm}
                onHide={() => setShowRestoreConfirm(false)}
                onConfirm={confirmRestore}
                title={t('common.confirm')}
                message={t('workplace.worksites.restoreConfirm')}
                confirmVariant="success"
            />
        </Card>
    );
};

export default WorkSitesTab;