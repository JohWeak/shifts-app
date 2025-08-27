// frontend/src/features/admin-workplace-settings/ui/WorkSitesTab/index.js
import React, { useMemo, useState } from 'react';
import { Button, Card } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useSortableData } from 'shared/hooks/useSortableData';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import { deleteWorkSite, fetchWorkSites, restoreWorkSite } from '../../model/workplaceSlice';
import { useWorkplaceActionHandler } from '../../model/hooks/useWorkplaceActionHandler';

// UI Components
import ConfirmationModal from 'shared/ui/components/ConfirmationModal';
import WorkSiteModal from './components/WorkSiteModal';
import WorkPlaceToolbar from '../WorkplaceToolbar/';
import WorkSitesTable from './components/WorkSitesTable';
import LoadingState from 'shared/ui/components/LoadingState';

import './WorkSitesTab.css';

const WorkSitesTab = ({ onSelectSite }) => {
    const { t } = useI18n();
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { workSites = [], loading } = useSelector(state => state.workplace || {});

    // --- STATE ---
    const [showModal, setShowModal] = useState(false);
    const [selectedSite, setSelectedSite] = useState(null);
    const [siteToProcess, setSiteToProcess] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showInactive, setShowInactive] = useState(() =>
        localStorage.getItem('showInactiveWorkSites') === 'true');

    // --- ACTION HANDLERS using custom hook ---
    const { execute: confirmDelete, isLoading: isDeleting } = useWorkplaceActionHandler({
        actionThunk: (id) => deleteWorkSite(id),
        refetchThunk: fetchWorkSites,
        messages: {
            processing: 'common.processing',
            success: 'workplace.worksites.deleted',
            error: 'errors.generic',
        },
    });

    const { execute: confirmRestore, isLoading: isRestoring } = useWorkplaceActionHandler({
        actionThunk: (id) => restoreWorkSite(id),
        refetchThunk: fetchWorkSites,
        messages: {
            processing: 'common.processing',
            success: 'workplace.worksites.restored',
            error: 'errors.generic',
        },
    });

    // --- DATA ---
    const filteredSites = useMemo(() => {
        if (!Array.isArray(workSites)) return [];
        return workSites.filter(site => {
            const matchesSearch = site.site_name?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesActive = showInactive || site.is_active;
            return matchesSearch && matchesActive;
        });
    }, [workSites, searchTerm, showInactive]);

    const sortingAccessors = useMemo(() => ({
        name: s => s.site_name,
        address: s => s.address || '',
        phone: s => s.phone || '',
        status: s => s.is_active ? 0 : 1,
        positions: s => s.positionCount || 0,
        employees: s => s.employeeCount || 0,
    }), []);

    const { sortedItems: sortedSites, requestSort, sortConfig } = useSortableData(filteredSites, {
        field: 'status',
        order: 'ASC',
    }, sortingAccessors);

    // --- HANDLERS ---
    const handleAdd = () => {
        setSelectedSite(null);
        setShowModal(true);
    };
    const handleEdit = (site) => {
        setSelectedSite(site);
        setShowModal(true);
    };
    const handleDelete = (site) => {
        setSiteToProcess(site);
        setShowDeleteConfirm(true);
    };
    const handleRestore = (site) => {
        setSiteToProcess(site);
        setShowRestoreConfirm(true);
    };

    const handleViewEmployees = (site) => navigate('/admin/employees', { state: { filters: { work_site: site.site_id.toString() } } });

    // --- RENDER ---
    if (loading && workSites.length === 0) return <LoadingState />;

    return (
        <Card className="workplace-tab-content">
            <Card.Header className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">{t('workplace.worksites.title')}</h5>
                <Button variant="primary" size="sm" onClick={handleAdd}><i
                    className="bi bi-plus-circle me-2"></i>{t('workplace.worksites.add')}</Button>
            </Card.Header>
            <Card.Body>
                <WorkPlaceToolbar
                    searchTerm={searchTerm}
                    onSearchTermChange={setSearchTerm}
                    showInactive={showInactive}
                    onShowInactiveChange={(checked) => {
                        setShowInactive(checked);
                        localStorage.setItem('showInactiveWorkSites', checked.toString());
                    }}
                    inactiveSwitchId="show-inactive-sites"

                />
                {sortedSites.length === 0 ? (
                    <div className="workplace-empty"><i className="bi bi-building"></i>
                        <p>{t('workplace.worksites.noSitesFound')}</p></div>
                ) : (
                    <WorkSitesTable
                        sites={sortedSites}
                        sortConfig={sortConfig}
                        requestSort={requestSort}
                        onRowClick={onSelectSite}
                        onEdit={handleEdit}
                        onViewEmployees={handleViewEmployees}
                        onDelete={handleDelete}
                        onRestore={handleRestore}
                    />
                )}
            </Card.Body>

            <WorkSiteModal
                show={showModal}
                onHide={() => setShowModal(false)}
                onSuccess={() => {
                    setShowModal(false);
                    dispatch(fetchWorkSites());
                }}
                site={selectedSite}
            />

            <ConfirmationModal
                show={showDeleteConfirm}
                onHide={() => setShowDeleteConfirm(false)}
                onConfirm={() => {
                    confirmDelete({
                        id: siteToProcess.site_id,
                    });
                    setShowDeleteConfirm(false);
                }}
                title={t('common.confirm')}
                message={t('workplace.worksites.deleteConfirm')}
                confirmVariant="danger"
                loading={isDeleting}
            />
            <ConfirmationModal
                show={showRestoreConfirm}
                onHide={() => setShowRestoreConfirm(false)}
                onConfirm={() => {
                    confirmRestore({
                        id: siteToProcess.site_id,
                    });
                    setShowRestoreConfirm(false);
                }}
                title={t('common.confirm')}
                message={t('workplace.worksites.restoreConfirm')}
                confirmVariant="success"
                loading={isRestoring}
            />
        </Card>
    );
};

export default WorkSitesTab;