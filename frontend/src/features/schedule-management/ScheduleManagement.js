// frontend/src/features/schedule-management/ScheduleManagement.js
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Container, Spinner, Alert } from 'react-bootstrap';

// Widgets, UI, etc.
import AdminLayout from '../../widgets/AdminLayout/AdminLayout';
import ScheduleOverviewTable from './components/ScheduleOverviewTable';
import ScheduleDetailsView from './components/ScheduleDetailsView';
import GenerateScheduleModal from './components/GenerateScheduleModal';
import CompareAlgorithmsModal from './components/CompareAlgorithmsModal';
import EmployeeSelectionModal from './components/EmployeeSelectionModal';
import ScheduleHeader from './components/ScheduleHeader';
import ScheduleTabs from './components/ScheduleTabs';
import { useI18n } from '../../shared/lib/i18n/i18nProvider';

// Redux Actions
import {
    fetchSchedules,
    fetchScheduleDetails,
    //generateSchedule,
    compareAlgorithms,
    //deleteSchedule,
    setActiveTab,
    //resetScheduleView,
    addPendingChange,
} from '../../app/store/slices/scheduleSlice';
import { useScheduleActions } from './hooks/useScheduleActions';

// Utils
import './ScheduleManagement.css';


// --- Основной компонент ---
const ScheduleManagement = () => {
    const { t } = useI18n();
    const dispatch = useDispatch();

    const {
        schedules,
        scheduleDetails,
        loading: dataLoading,
        error: dataError,
        activeTab,
        selectedScheduleId,
        //editingPositions,
        //pendingChanges
    } = useSelector((state) => state.schedule);

    // 2. Инициализируем наш хук для выполнения действий
    const {
        loading: actionsLoading, // Переименуем
        error: actionsError, // Переименуем
        handleGenerate,
        handleDelete: performDelete, // Можно переименовать, чтобы было понятнее
    } = useScheduleActions();

    // --- Локальное состояние для UI, которое было утеряно ---
    const [alert, setAlert] = useState(null);
    const [showGenerateModal, setShowGenerateModal] = useState(false);
    const [showComparisonModal, setShowComparisonModal] = useState(false);
    const [showEmployeeModal, setShowEmployeeModal] = useState(false);
    const [comparisonResults, setComparisonResults] = useState(null);
    const [selectedCell, setSelectedCell] = useState(null);

    // --- Эффекты ---
    useEffect(() => {
        dispatch(fetchSchedules());
    }, [dispatch]);



    // --- Обработчики действий ---
    // 3. Создаем новую функцию-обертку для генерации расписания
    const onGenerateSubmit = async (settings) => {
        const result = await handleGenerate(settings); // Вызываем функцию из хука

        if (result.success) {
            setAlert({ type: 'success', message: t('schedule.generateSuccess') });
            setShowGenerateModal(false);
            dispatch(fetchSchedules()); // Обновляем список расписаний после успешной генерации
        } else {
            // Ошибку можно показать в алерте. Хук уже сохранил ее в actionsError.
            setAlert({ type: 'danger', message: result.error || t('errors.generateFailed') });
        }
    };

    // 4. Создаем обертку для удаления
    const onDeleteClick = async (id) => {
        if (window.confirm(t('confirmDelete'))) {
            const result = await performDelete(id); // Вызываем функцию из хука
            if (result.success) {
                setAlert({ type: 'success', message: t('alerts.scheduleDeletedSuccess') });
                // Список обновится автоматически благодаря thunk'у, который диспатчит fetchSchedules
            } else {
                setAlert({ type: 'danger', message: result.error || t('errors.deleteFailed') });
            }
        }
    };


    const handleCompare = async () => {
        const result = await dispatch(compareAlgorithms({})).unwrap();
        setComparisonResults(result);
        setShowComparisonModal(true);
    };


    const handleCellClick = (date, positionId, shiftId) => {
        setSelectedCell({ date, positionId, shiftId });
        setShowEmployeeModal(true);
    };

    const handleEmployeeSelect = (empId, empName) => {
        if (!selectedCell) return;
        const { date, shiftId, positionId } = selectedCell;
        const key = `${positionId}-${date}-${shiftId}-assign-${empId}`;
        dispatch(addPendingChange({ key, change: { action: 'assign', empId, empName, date, shiftId, positionId } }));
        setShowEmployeeModal(false);
        setSelectedCell(null);
    };

    return (
        <AdminLayout>
            <Container fluid className="px-0">
                {/* Отображение алертов */}
                {alert && (
                    <Alert variant={alert.type} onClose={() => setAlert(null)} dismissible>
                        {alert.message}
                    </Alert>
                )}

                {/* Отображение глобальной ошибки загрузки данных */}
                {dataError && <Alert variant="danger">{dataError}</Alert>}

                <ScheduleHeader
                    messages={t}
                    onGenerateClick={() => setShowGenerateModal(true)}
                    onCompareClick={handleCompare}
                    // Кнопки блокируются, если идет загрузка данных ИЛИ выполняется какое-то действие
                    loading={dataLoading === 'pending' || actionsLoading}
                />

                <ScheduleTabs
                    activeTab={activeTab}
                    onTabChange={(k) => dispatch(setActiveTab(k))}
                    isDetailsDisabled={!selectedScheduleId}
                >
                    {{
                        overview: (
                            <ScheduleOverviewTable
                                schedules={schedules}
                                loading={dataLoading === 'pending' && !schedules.length}
                                onViewDetails={(id) => dispatch(fetchScheduleDetails(id))}
                                onDelete={onDeleteClick}
                            />
                        ),
                        details: dataLoading === 'pending' && !scheduleDetails ? (
                            <div className="text-center p-5"><Spinner animation="border" /></div>
                        ) : (
                            <ScheduleDetailsView onCellClick={handleCellClick} />
                        )
                    }}
                </ScheduleTabs>

                <GenerateScheduleModal show={showGenerateModal} onHide={() => setShowGenerateModal(false)} onGenerate={onGenerateSubmit} generating={actionsLoading} />
                <CompareAlgorithmsModal show={showComparisonModal} onHide={() => setShowComparisonModal(false)} results={comparisonResults} onUseAlgorithm={() => {}} />
                <EmployeeSelectionModal show={showEmployeeModal} onHide={() => setShowEmployeeModal(false)} selectedPosition={selectedCell} onEmployeeSelect={handleEmployeeSelect} scheduleDetails={scheduleDetails} />
            </Container>
        </AdminLayout>
    );
};

export default ScheduleManagement;