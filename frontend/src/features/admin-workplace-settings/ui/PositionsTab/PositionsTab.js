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
    Dropdown, Row, Col
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
    clearPositionOperationStatus, fetchWorkSites
} from '../../model/workplaceSlice';

import './PositionsTab.css';

const PositionsTab = () => {
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
    const [positionToDelete, setPositionToDelete] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterSite, setFilterSite] = useState('');
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [isInitialized, setIsInitialized] = useState(false);
    const [showShiftsModal, setShowShiftsModal] = useState(false);
    const [positionForShifts, setPositionForShifts] = useState(null);

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
                        : t('workplace.positions.created')
            );
            setTimeout(() => {
                setShowAlert(false);
                dispatch(clearPositionOperationStatus());
            }, 3000);
        }
    }, [positionOperationStatus, dispatch, t, selectedPosition, positionToDelete]);

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

    const confirmDelete = async () => {
        if (positionToDelete) {
            await dispatch(deletePosition(positionToDelete.pos_id));
            setShowDeleteConfirm(false);
            setPositionToDelete(null);
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
        // Переход на страницу сотрудников с фильтром по позиции
        navigate('/admin/employees', {
            state: {
                filters: {
                    position: position.pos_id.toString(),
                    work_site: position.site_id.toString()
                }
            }
        });
    };

    // Защищенная фильтрация
    const filteredPositions = (positions && Array.isArray(positions))
        ? positions.filter(position => {
            const matchesSearch = position.pos_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                position.profession?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesSite = !filterSite || position.site_id === parseInt(filterSite);
            return matchesSearch && matchesSite;
        })
        : [];


    const getSiteName = (siteId) => {
        const site = workSites.find(s => s.site_id === siteId);
        return site ? site.site_name : '-';
    };

    return (
        <Card className="workplace-tab-content">
            <Card.Header className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">{t('workplace.positions.title')}</h5>
                <Button
                    variant="primary"
                    size="sm"
                    onClick={handleAdd}
                    disabled={workSites.length === 0}
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

                {workSites.length === 0 ? (
                    <Alert variant="info">
                        {t('workplace.positions.noSitesWarning')}
                    </Alert>
                ) : (
                    <>
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
                                    value={filterSite}
                                    onChange={(e) => setFilterSite(e.target.value)}
                                >
                                    <option value="">{t('workplace.positions.allSites')}</option>
                                    {workSites.map(site => (
                                        <option key={site.site_id} value={site.site_id}>
                                            {site.site_name}
                                        </option>
                                    ))}
                                </Form.Select>
                            </Col>
                        </Row>

                        {filteredPositions.length === 0 ? (
                            <div className="workplace-empty">
                                <i className="bi bi-person-badge"></i>
                                <p>{t('workplace.positions.noPositions')}</p>
                            </div>
                        ) : (
                            <Table responsive hover className="workplace-table">
                                <thead>
                                <tr>
                                    <th>{t('workplace.positions.name')}</th>
                                    <th>{t('workplace.worksites.title')}</th>
                                    <th>{t('workplace.positions.roles')}</th>
                                    <th className="text-center">{t('workplace.positions.defaultStaff')}</th>
                                    <th className="text-center">{t('workplace.positions.shifts')}</th>
                                    <th className="text-center">{t('workplace.positions.employees')}</th>
                                    <th></th>
                                </tr>
                                </thead>
                                <tbody>
                                {filteredPositions.map(position => (
                                    <tr key={position.pos_id}>
                                        <td className="fw-semibold">{position.pos_name}</td>
                                        <td>
                                            <Badge bg="secondary" className="site-badge">
                                                {getSiteName(position.site_id)}
                                            </Badge>
                                        </td>
                                        <td>{position.profession || '-'}</td>
                                        <td className="text-center">
                                            <Badge bg="info">{position.num_of_emp || 1}</Badge>
                                        </td>
                                        <td className="text-center">
                                            <Badge bg="warning" text="dark">
                                                {position.num_of_shifts || 0}
                                            </Badge>
                                        </td>
                                        <td className="text-center">
                                            <Badge bg="primary">
                                                {position.totalEmployees || 0}
                                            </Badge>
                                        </td>
                                        <td>
                                            <Dropdown align="end">
                                                <Dropdown.Toggle
                                                    variant="outline-secondary"
                                                    size="sm"
                                                    id={`dropdown-${position.pos_id}`}
                                                >
                                                    <i className="bi bi-three-dots"></i>
                                                </Dropdown.Toggle>
                                                <Dropdown.Menu>
                                                    <Dropdown.Item onClick={() => handleManageShifts(position)}>
                                                        <i className="bi bi-clock me-2"></i>
                                                        {t('workplace.positions.manageShifts')}
                                                    </Dropdown.Item>
                                                    <Dropdown.Item onClick={() => handleViewEmployees(position)}>
                                                        <i className="bi bi-people me-2"></i>
                                                        {t('workplace.positions.viewEmployees')}
                                                    </Dropdown.Item>
                                                    <Dropdown.Divider />
                                                    <Dropdown.Item onClick={() => handleEdit(position)}>
                                                        <i className="bi bi-pencil me-2"></i>
                                                        {t('common.edit')}
                                                    </Dropdown.Item>
                                                    <Dropdown.Item
                                                        onClick={() => handleDelete(position)}
                                                        className="text-danger"
                                                        disabled={position.totalEmployees > 0}
                                                    >
                                                        <i className="bi bi-trash me-2"></i>
                                                        {t('common.delete')}
                                                    </Dropdown.Item>
                                                </Dropdown.Menu>
                                            </Dropdown>
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
                workSites={workSites}
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
                message={t('workplace.positions.deleteConfirm')}
                confirmVariant="danger"
            />
        </Card>
    );
};

export default PositionsTab;