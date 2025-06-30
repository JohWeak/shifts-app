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
    const [siteToDelete, setSiteToDelete] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [isInitialized, setIsInitialized] = useState(false);
    const [selectedSiteId, setSelectedSiteId] = useState(null);
    const [showActiveOnly, setShowActiveOnly] = useState(true);


    useEffect(() => {
        if (operationStatus === 'success') {
            setShowAlert(true);
            setAlertMessage(
                selectedSite
                    ? t('workplace.worksites.updated')
                    : siteToDelete
                        ? t('workplace.worksites.deleted')
                        : t('workplace.worksites.created')
            );
            setTimeout(() => {
                setShowAlert(false);
                dispatch(clearOperationStatus());
            }, 3000);
        }
    }, [operationStatus, dispatch, t, selectedSite, siteToDelete]);

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

    const confirmDelete = async () => {
        if (siteToDelete) {
            await dispatch(deleteWorkSite(siteToDelete.site_id));
            setShowDeleteConfirm(false);
            setSiteToDelete(null);
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

    // Защищенная фильтрация
    const filteredSites = React.useMemo(() => {
        return workSites.filter(site => {
            const matchesSearch = site.site_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                site.address?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesActive = !showActiveOnly || site.is_active;

            return matchesSearch && matchesActive;
        });
    }, [workSites, searchTerm, showActiveOnly]);
    // Добавим загрузку данных при монтировании
    useEffect(() => {
        if (!isInitialized) {
            dispatch(fetchWorkSites());
            setIsInitialized(true);
        }
    }, [dispatch, isInitialized]);

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

                <div className="d-flex gap-3 mb-4">
                    <InputGroup style={{maxWidth: '400px'}}>
                        <InputGroup.Text>
                            <i className="bi bi-search"></i>
                        </InputGroup.Text>
                        <Form.Control
                            type="text"
                            placeholder={t('workplace.worksites.search')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </InputGroup>

                    <Form.Check
                        type="switch"
                        id="active-only-switch"
                        label={t('workplace.worksites.showActiveOnly')}
                        checked={showActiveOnly}
                        onChange={(e) => setShowActiveOnly(e.target.checked)}
                        className="d-flex align-items-center mb-0"
                    />

                    <Button
                        variant="primary"
                        onClick={handleAdd}
                        className="ms-auto"
                    >
                        <i className="bi bi-plus-circle me-2"></i>
                        {t('workplace.worksites.add')}
                    </Button>
                </div>

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
                                className="clickable-row"
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
                                            ? t('workplace.worksites.active')
                                            : t('workplace.worksites.inactive')
                                        }
                                    </Badge>
                                </td>
                                <td className="text-center">
                                    <Badge
                                        bg="warning"
                                        text="dark"
                                    >
                                        {site.positionCount || 0}
                                    </Badge>
                                </td>
                                <td className="text-center">
                                    <Badge
                                        bg="primary"
                                    >
                                        {site.employeeCount || 0}
                                    </Badge>
                                </td>
                                <td onClick={(e) => e.stopPropagation()}>
                                    <div className="workplace-actions">
                                        <Button
                                            variant="outline-primary"
                                            size="sm"
                                            onClick={() => handleEdit(site)}
                                            title={t('common.edit')}
                                        >
                                            <i className="bi bi-pencil"></i>
                                        </Button>
                                        <Button
                                            variant="outline-info"
                                            size="sm"
                                            onClick={() => handleViewEmployees(site)}
                                            title={t('workplace.worksites.viewEmployees')}
                                        >
                                            <i className="bi bi-people"></i>
                                        </Button>
                                        <Button
                                            variant="danger"
                                            size="sm"
                                            onClick={() => handleDelete(site)}
                                            title={t('common.delete')}
                                        >
                                            <i className="bi bi-trash"></i>
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredSites.length === 0 && (
                            <tr>
                                <td colSpan="6" className="text-center py-4">
                                    <Alert variant="info" className="mb-0">
                                        {searchTerm
                                            ? t('workplace.worksites.noSearchResults')
                                            : showActiveOnly
                                                ? t('workplace.worksites.noActiveSites')
                                                : t('workplace.worksites.noSites')
                                        }
                                    </Alert>
                                </td>
                            </tr>
                        )}
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
        </Card>
    );
};


export default WorkSitesTab;