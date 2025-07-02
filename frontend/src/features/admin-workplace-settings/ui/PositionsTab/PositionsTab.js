// frontend/src/features/admin-workplace-settings/ui/PositionsTab/PositionsTab.js
import React, { useState, useEffect } from 'react';
import {
    Card,
    Table,
    Button,
    Badge,
    Alert,
    Form,
    InputGroup,
    Row,
    Col
} from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import ConfirmationModal from 'shared/ui/components/ConfirmationModal/ConfirmationModal';
import ManageShiftsModal from '../ManageShiftsModal/ManageShiftsModal';
import PositionModal from '../PositionModal/PositionModal';
import {
    fetchPositions,
    deletePosition,
    restorePosition,
    clearPositionOperationStatus,
    fetchWorkSites
} from '../../model/workplaceSlice';

import './PositionsTab.css';

const PositionsTab = ({ selectedSite }) => {
    const { t } = useI18n();
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const {
        positions = [],
        workSites = [],
        loading,
        positionsLoading,
        positionOperationStatus,
        error
    } = useSelector(state => state.workplace || {});

    const [showModal, setShowModal] = useState(false);
    const [selectedPosition, setSelectedPosition] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
    const [positionToDelete, setPositionToDelete] = useState(null);
    const [positionToRestore, setPositionToRestore] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterSite, setFilterSite] = useState('');
    const [showInactive, setShowInactive] = useState(
        localStorage.getItem('showInactivePositions') === 'true' || false
    );
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [isInitialized, setIsInitialized] = useState(false);
    const [showShiftsModal, setShowShiftsModal] = useState(false);
    const [positionForShifts, setPositionForShifts] = useState(null);

    useEffect(() => {
        if (selectedSite) {
            setFilterSite(selectedSite.site_id.toString());
        }
    }, [selectedSite]);

    useEffect(() => {
        dispatch(fetchPositions());
    }, [dispatch]);

    useEffect(() => {
        if (!isInitialized) {
            dispatch(fetchPositions());
            if (workSites.length === 0) {
                dispatch(fetchWorkSites());
            }
            setIsInitialized(true);
        }
    }, [dispatch, isInitialized, workSites.length]);

    useEffect(() => {
        if (positionOperationStatus === 'success') {
            setShowAlert(true);
            setAlertMessage(
                selectedPosition
                    ? t('workplace.positions.updated')
                    : positionToDelete
                        ? t('workplace.positions.deleted')
                        : positionToRestore
                            ? t('workplace.positions.restored')
                            : t('workplace.positions.created')
            );
            setTimeout(() => {
                setShowAlert(false);
                dispatch(clearPositionOperationStatus());
            }, 3000);
        }
    }, [positionOperationStatus, dispatch, t, selectedPosition, positionToDelete, positionToRestore]);

    // Сохранение состояния переключателя
    const handleShowInactiveChange = (checked) => {
        setShowInactive(checked);
        localStorage.setItem('showInactivePositions', checked.toString());
    };

    const handleEdit = (position) => {
        setSelectedPosition(position);
        setShowModal(true);
    };

    const handleAdd = () => {
        setSelectedPosition(null);
        setShowModal(true);
    };

    const handleDelete = (position) => {
        setPositionToDelete(position);
        setShowDeleteConfirm(true);
    };

    const handleRestore = (position) => {
        setPositionToRestore(position);
        setShowRestoreConfirm(true);
    };

    const confirmDelete = async () => {
        if (positionToDelete) {
            const result = await dispatch(deletePosition(positionToDelete.pos_id));
            if (deletePosition.fulfilled.match(result)) {
                // Показываем информацию о деактивированных работниках
                const deactivatedCount = result.payload.deactivatedEmployees || 0;
                if (deactivatedCount > 0) {
                    setAlertMessage(
                        t('workplace.positions.deletedWithEmployees', { count: deactivatedCount })
                    );
                }
            }
            setShowDeleteConfirm(false);
            setPositionToDelete(null);
            dispatch(fetchPositions());
        }
    };

    const confirmRestore = async () => {
        if (positionToRestore) {
            const result = await dispatch(restorePosition(positionToRestore.pos_id));
            if (restorePosition.fulfilled.match(result)) {
                // Показываем информацию о восстановленных работниках
                const restoredCount = result.payload.restoredEmployees || 0;
                if (restoredCount > 0) {
                    setAlertMessage(
                        t('workplace.positions.restoredWithEmployees', { count: restoredCount })
                    );
                }
            }
            setShowRestoreConfirm(false);
            setPositionToRestore(null);
            dispatch(fetchPositions());
        }
    };

    const handleModalClose = () => {
        setShowModal(false);
        setSelectedPosition(null);
    };

    const handleModalSuccess = () => {
        setShowModal(false);
        setSelectedPosition(null);
        dispatch(fetchPositions());
    };

    const handleManageShifts = (position) => {
        setPositionForShifts(position);
        setShowShiftsModal(true);
    };

    const handleCloseShiftsModal = () => {
        setShowShiftsModal(false);
        setPositionForShifts(null);
    };

    const handleViewEmployees = (position) => {
        navigate('/admin/employees', {
            state: {
                filters: {
                    position: position.pos_id.toString(),
                    work_site: position.site_id.toString()
                }
            }
        });
    };

    // Фильтрация и сортировка позиций
    const filteredPositions = React.useMemo(() => {
        if (!positions || !Array.isArray(positions)) return [];

        let filtered = positions.filter(position => {
            if (!position) return false;

            const matchesSearch = position.pos_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                position.profession?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesSite = !filterSite || position.site_id === parseInt(filterSite);
            const matchesActiveFilter = showInactive || position.is_active;

            return matchesSearch && matchesSite && matchesActiveFilter;
        });

        // Сортировка: сначала активные, потом неактивные
        return filtered.sort((a, b) => {
            if (a.is_active !== b.is_active) {
                return a.is_active ? -1 : 1;
            }
            return a.pos_name.localeCompare(b.pos_name);
        });
    }, [positions, searchTerm, filterSite, showInactive]);

    const getSiteName = (siteId) => {
        const site = workSites.find(s => s.site_id === siteId);
        return site ? site.site_name : '-';
    };

    // Подсчет деактивированных работников для предупреждения
    const getEmployeeCountForWarning = (position) => {
        return position.employeeCount || 0;
    };

    if (loading && positions.length === 0) {
        return (
            <Card className="workplace-tab-content">
                <Card.Body className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-3 text-muted">{t('common.loading')}</p>
                </Card.Body>
            </Card>
        );
    }

    return (
        <Card className="workplace-tab-content">
            <Card.Header className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">{t('workplace.positions.title')}</h5>
                <Button
                    variant="primary"
                    size="sm"
                    onClick={handleAdd}
                    disabled={workSites.filter(site => site.is_active).length === 0}
                >
                    <i className="bi bi-plus-circle me-2"></i>
                    {t('workplace.positions.add')}
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
                    <Alert variant="danger" dismissible onClose={() => dispatch(clearPositionOperationStatus())}>
                        {error}
                    </Alert>
                )}

                {workSites.filter(site => site.is_active).length === 0 ? (
                    <Alert variant="info">
                        {t('workplace.positions.noSitesWarning')}
                    </Alert>
                ) : (
                    <>
                        <Row className="mb-3">
                            <Col md={6}>
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
                                    value={filterSite}
                                    onChange={(e) => setFilterSite(e.target.value)}
                                >
                                    <option value="">{t('workplace.positions.allSites')}</option>
                                    {workSites
                                        .filter(site => site.is_active)
                                        .map(site => (
                                            <option key={site.site_id} value={site.site_id}>
                                                {site.site_name}
                                            </option>
                                        ))}
                                </Form.Select>
                            </Col>
                            <Col md={2} className="d-flex align-items-center">
                                <Form.Check
                                    type="switch"
                                    id="show-inactive-positions"
                                    label={t('workplace.positions.showInactive')}
                                    checked={showInactive}
                                    onChange={(e) => handleShowInactiveChange(e.target.checked)}
                                    className="mb-0"
                                />
                            </Col>
                        </Row>

                        {filteredPositions.length === 0 ? (
                            <div className="text-center py-5">
                                <i className="bi bi-briefcase text-muted" style={{ fontSize: '3rem' }}></i>
                                <p className="mt-3 text-muted">
                                    {searchTerm || filterSite
                                        ? t('workplace.positions.noPositionsFound')
                                        : t('workplace.positions.noPositions')}
                                </p>
                            </div>
                        ) : (
                            <Table responsive hover className="positions-table">
                                <thead>
                                <tr>
                                    <th>{t('workplace.positions.name')}</th>
                                    <th>{t('workplace.worksites.title')}</th>
                                    <th>{t('workplace.positions.profession')}</th>
                                    <th className="text-center">{t('workplace.positions.defaultStaffCount')}</th>
                                    <th className="text-center">{t('workplace.positions.currentStaff')}</th>
                                    <th className="text-center">{t('workplace.positions.shifts')}</th>
                                    <th>{t('common.status')}</th>
                                    <th></th>
                                </tr>
                                </thead>
                                <tbody>
                                {filteredPositions.map(position => (
                                    <tr
                                        key={position.pos_id}
                                        className={!position.is_active ? 'inactive-row' : ''}
                                    >
                                        <td className="fw-semibold">{position.pos_name}</td>
                                        <td>
                                            <Badge bg="secondary" className="site-badge">
                                                {getSiteName(position.site_id)}
                                            </Badge>
                                        </td>
                                        <td>{position.profession || '-'}</td>
                                        <td className="text-center">{position.num_of_emp || 1}</td>
                                        <td className="text-center">
                                            <Badge bg={position.employeeCount > 0 ? 'primary' : 'secondary'}>
                                                {position.employeeCount || 0}
                                            </Badge>
                                        </td>
                                        <td className="text-center">
                                            <Button
                                                variant="link"
                                                size="sm"
                                                onClick={() => handleManageShifts(position)}
                                                className="p-0"
                                            >
                                                <Badge bg="info">{position.totalShifts || 0}</Badge>
                                            </Button>
                                        </td>
                                        <td>
                                            <Badge bg={position.is_active ? 'success' : 'secondary'}>
                                                {position.is_active ? t('common.active') : t('common.inactive')}
                                            </Badge>
                                        </td>
                                        <td>
                                            <div className="workplace-actions">
                                                <Button
                                                    variant="outline-primary"
                                                    size="sm"
                                                    onClick={() => handleEdit(position)}
                                                    title={t('common.edit')}
                                                >
                                                    <i className="bi bi-pencil"></i>
                                                </Button>
                                                <Button
                                                    variant="outline-info"
                                                    size="sm"
                                                    onClick={() => handleViewEmployees(position)}
                                                    title={t('workplace.positions.viewEmployees')}
                                                >
                                                    <i className="bi bi-people"></i>
                                                </Button>
                                                {position.is_active ? (
                                                    <Button
                                                        variant="danger"
                                                        size="sm"
                                                        onClick={() => handleDelete(position)}
                                                        title={t('common.delete')}
                                                    >
                                                        <i className="bi bi-trash"></i>
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        variant="success"
                                                        size="sm"
                                                        onClick={() => handleRestore(position)}
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
                    </>
                )}
            </Card.Body>

            <PositionModal
                show={showModal}
                onHide={handleModalClose}
                onSuccess={handleModalSuccess}
                position={selectedPosition}
                workSites={workSites.filter(site => site.is_active)}
                defaultSiteId={filterSite || selectedSite?.site_id}
            />

            <ManageShiftsModal
                show={showShiftsModal}
                onHide={handleCloseShiftsModal}
                position={positionForShifts}
            />

            <ConfirmationModal
                show={showDeleteConfirm}
                onHide={() => setShowDeleteConfirm(false)}
                onConfirm={confirmDelete}
                title={t('common.confirm')}
                message={
                    positionToDelete && getEmployeeCountForWarning(positionToDelete) > 0
                        ? t('workplace.positions.deleteConfirmWithEmployees', {
                            count: getEmployeeCountForWarning(positionToDelete)
                        })
                        : t('workplace.positions.deleteConfirm')
                }
                confirmVariant="danger"
            />

            <ConfirmationModal
                show={showRestoreConfirm}
                onHide={() => setShowRestoreConfirm(false)}
                onConfirm={confirmRestore}
                title={t('common.confirm')}
                message={t('workplace.positions.restoreConfirm')}
                confirmVariant="success"
            />
        </Card>
    );
};

export default PositionsTab;