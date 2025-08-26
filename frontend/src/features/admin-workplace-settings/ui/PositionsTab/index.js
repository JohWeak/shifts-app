// frontend/src/features/admin-workplace-settings/ui/PositionsTab/index.js
import React, {useEffect, useMemo, useState} from 'react';
import {Alert, Button, Card} from 'react-bootstrap';
import {useDispatch, useSelector} from 'react-redux';
import {useNavigate} from 'react-router-dom';
import {useSortableData} from 'shared/hooks/useSortableData';
import {useI18n} from 'shared/lib/i18n/i18nProvider';

// Slices & Actions
import {deletePosition, fetchPositions, restorePosition} from '../../model/workplaceSlice';
import {useWorkplaceActionHandler} from '../../model/hooks/useWorkplaceActionHandler';

// UI Components
import ConfirmationModal from 'shared/ui/components/ConfirmationModal/ConfirmationModal';
import PositionModal from './components/PositionModal';
import WorkplaceToolbar from "../WorkplaceToolbar";
import PositionsTable from './components/PositionsTable';
import LoadingState from 'shared/ui/components/LoadingState/LoadingState';

import './PositionsTab.css';


const PositionsTab = ({selectedSite}) => {
    const {t} = useI18n();
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const {positions = [], workSites = [], loading} = useSelector(state => state.workplace || {});

    // --- STATE MANAGEMENT ---
    const [showModal, setShowModal] = useState(false);
    const [selectedPosition, setSelectedPosition] = useState(null);
    const [positionToProcess, setPositionToProcess] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
    const [showInactive, setShowInactive] = useState(() =>
        localStorage.getItem('showInactivePositions') === 'true');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterSite, setFilterSite] = useState('');
    const [expandedPositionId, setExpandedPositionId] = useState(null);
    const [isClosingPositionId, setIsClosingPositionId] = useState(null);

    // --- ACTION HANDLERS using custom hook ---
    const {execute: confirmDelete, isLoading: isDeleting} = useWorkplaceActionHandler({
        actionThunk: (id) => deletePosition(id),
        refetchThunk: fetchPositions,
        messages: {
            processing: 'common.processing',
            success: 'workplace.positions.deleted',
            error: 'errors.generic'
        }
    });

    const {execute: confirmRestore, isLoading: isRestoring} = useWorkplaceActionHandler({
        actionThunk: (id) => restorePosition(id),
        refetchThunk: fetchPositions,
        messages: {
            processing: 'common.processing',
            success: 'workplace.positions.restored',
            error: 'errors.generic'
        }
    });

    // --- DATA FETCHING & SYNC ---
    useEffect(() => {
        if (selectedSite) setFilterSite(selectedSite.site_id.toString());
    }, [selectedSite]);

    // --- DATA PREPARATION ---
    const filteredPositions = useMemo(() => {
        if (!Array.isArray(positions)) return [];
        return positions.filter(pos => {
            if (!pos) return false;
            const matchesSearch = pos.pos_name?.toLowerCase().includes(searchTerm.toLowerCase()) || pos.profession?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesSite = !filterSite || pos.site_id === parseInt(filterSite);
            const matchesActive = showInactive || pos.is_active;
            return matchesSearch && matchesSite && matchesActive;
        });
    }, [positions, searchTerm, filterSite, showInactive]);

    const getSiteName = (siteId) => workSites.find(s => s.site_id === siteId)?.site_name || '-';

    const sortingAccessors = useMemo(() => ({
        name: p => p.pos_name,
        site: p => getSiteName(p.site_id),
        profession: p => p.profession || '',
        defaultStaff: p => p.num_of_emp || 1,
        shifts: p => p.totalShifts || 0,
        employees: p => p.totalEmployees || 0,
        status: p => p.is_active ? 0 : 1,
    }), [workSites]);

    const {sortedItems: sortedPositions, requestSort, sortConfig} = useSortableData(filteredPositions, {
        field: 'status',
        order: 'ASC'
    }, sortingAccessors);

    // --- HANDLERS ---
    const handleAdd = () => {
        setSelectedPosition(null);
        setShowModal(true);
    };
    const handleEdit = (position) => {
        setSelectedPosition(position);
        setShowModal(true);
    };
    const handleDelete = (position) => {
        setPositionToProcess(position);
        setShowDeleteConfirm(true);
    };
    const handleRestore = (position) => {
        setPositionToProcess(position);
        setShowRestoreConfirm(true);
    };


    const handleRowClick = (position) => {
        const positionId = position.pos_id;
        if (expandedPositionId === positionId) {
            setIsClosingPositionId(positionId);
            setTimeout(() => {
                setExpandedPositionId(null);
                setIsClosingPositionId(null);
            }, 250);
        } else {
            setExpandedPositionId(positionId);
        }
    };

    const handleViewEmployees = (position) =>
        navigate('/admin/employees',
            {
                state: {
                    filters: {
                        position: position.pos_id.toString(),
                        work_site: position.site_id.toString()
                    }
                }
            }
        );

    // --- RENDER ---
    if (loading && positions.length === 0) {
        return <LoadingState/>;
    }

    return (
        <Card className="workplace-tab-content">
            <Card.Header className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">{t('workplace.positions.title')}</h5>
                <Button variant="primary" size="sm" onClick={handleAdd}
                        disabled={workSites.filter(site => site.is_active).length === 0}>
                    <i className="bi bi-plus-circle me-2"></i>{t('workplace.positions.add')}
                </Button>
            </Card.Header>
            <Card.Body>
                {workSites.filter(site => site.is_active).length === 0 ? (
                    <Alert variant="info">{t('workplace.positions.noSitesWarning')}</Alert>
                ) : (
                    <>
                        <WorkplaceToolbar
                            searchTerm={searchTerm}
                            onSearchTermChange={setSearchTerm}
                            showInactive={showInactive}
                            onShowInactiveChange={(checked) => {
                                setShowInactive(checked);
                                localStorage.setItem('showInactivePositions', checked.toString());
                            }}
                            siteFilter={filterSite}
                            onSiteFilterChange={setFilterSite}
                            sites={workSites}
                            inactiveSwitchId="show-inactive-positions"
                        />
                        {sortedPositions.length === 0 ? (
                            <div className="workplace-empty"><i className="bi bi-person-badge"></i><p
                                className="mt-3 text-muted">{searchTerm || filterSite ? t('workplace.positions.noPositionsFound') : t('workplace.positions.noPositions')}</p>
                            </div>
                        ) : (
                            <PositionsTable
                                positions={sortedPositions}
                                sortConfig={sortConfig}
                                requestSort={requestSort}
                                getSiteName={getSiteName}
                                expandedPositionId={expandedPositionId}
                                isClosingPositionId={isClosingPositionId}
                                onRowClick={handleRowClick}
                                onEdit={handleEdit}
                                onViewEmployees={handleViewEmployees}
                                onDelete={handleDelete}
                                onRestore={handleRestore}
                            />
                        )}
                    </>
                )}
            </Card.Body>

            <PositionModal
                show={showModal}
                onHide={() => setShowModal(false)}
                onSuccess={() => {
                    setShowModal(false);
                    dispatch(fetchPositions());
                }}
                position={selectedPosition}
                workSites={workSites}
                defaultSiteId={filterSite || selectedSite?.site_id}
            />


            <ConfirmationModal
                show={showDeleteConfirm}
                onHide={() => setShowDeleteConfirm(false)}
                onConfirm={() => {
                    confirmDelete({
                        id: positionToProcess.pos_id
                    });
                    setShowDeleteConfirm(false);
                }}
                title={t('common.confirm')}
                message={t('workplace.positions.deleteConfirm')}
                confirmVariant="danger"
                loading={isDeleting}
            />
            <ConfirmationModal
                show={showRestoreConfirm}
                onHide={() => setShowRestoreConfirm(false)}
                onConfirm={() => {
                    confirmRestore({
                        id: positionToProcess.pos_id
                    });
                    setShowRestoreConfirm(false);
                }}
                title={t('common.confirm')}
                message={t('workplace.positions.restoreConfirm')}
                confirmVariant="success"
                loading={isRestoring}
            />
        </Card>
    );
};

export default PositionsTab;