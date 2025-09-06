// frontend/src/features/employee-requests/ui/PermanentConstraintForm/index.js
import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Alert, Button, Card, Form, Toast, ToastContainer } from 'react-bootstrap';
import { X } from 'react-bootstrap-icons';
import TextareaAutosize from 'react-textarea-autosize';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import { useShiftColor } from 'shared/hooks/useShiftColor';
import { useMediaQuery } from 'shared/hooks/useMediaQuery';
import { getContrastTextColor, hexToRgba } from 'shared/lib/utils/colorUtils';
import { constraintAPI, employeeAPI } from 'shared/api/apiService';
import { fetchEmployeePermanentConstraintsAsAdmin, fetchMyPermanentConstraints } from '../../model/requestsSlice';
import ConfirmationModal from 'shared/ui/components/ConfirmationModal';
import LoadingState from 'shared/ui/components/LoadingState';
import ErrorMessage from 'shared/ui/components/ErrorMessage';
import PermanentConstraintGrid from '../PermanentConstraintGrid';
import './PermanentConstraintForm.css';
import store from '../../../../app/store/store';


const DAYS_OF_WEEK_CANONICAL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const PermanentConstraintForm = ({ onSubmitSuccess, onCancel, initialData = null, employeeId = null }) => {
    const { t } = useI18n();
    const dispatch = useDispatch();

    const { getShiftColor, currentTheme } = useShiftColor();
    const isMobile = useMediaQuery('(max-width: 888px)');

    const permanentConstraints = useSelector(state => state.requests.permanentConstraints);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showConfirm, setShowConfirm] = useState(false);
    const [constraints, setConstraints] = useState({});
    const [message, setMessage] = useState('');
    const [showMessage, setShowMessage] = useState(false);
    const [shifts, setShifts] = useState([]);
    const [showHelpToast, setShowHelpToast] = useState(false);
    const toggleHelpToast = () => setShowHelpToast(!showHelpToast);

    useEffect(() => {
        console.log('[PermanentConstraintForm] Current permanentConstraints from Redux:', permanentConstraints);


    }, [permanentConstraints]);

    // Загрузка данных
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);

                // Загружаем смены (для админского режима или обычного)
                const shiftsResponse = employeeId
                    ? await employeeAPI.getEmployeeShifts(employeeId)
                    : await constraintAPI.getEmployeeShifts();
                setShifts(shiftsResponse.data?.shifts || []);

                // Загружаем permanent constraints через Redux
                const constraintsData = employeeId
                    ? await dispatch(fetchEmployeePermanentConstraintsAsAdmin(employeeId)).unwrap()
                    : await dispatch(fetchMyPermanentConstraints()).unwrap();
                console.log('[PermanentConstraintForm] Loaded constraints data:', constraintsData);

                // Временно: проверим что в Redux
                const state = store.getState();
                console.log('[PermanentConstraintForm] Redux state permanentConstraints:', state.requests.permanentConstraints);

            } catch (err) {
                console.error('[PermanentConstraintForm] Error loading data:', err);
                setError(t('requests.loadError'));
            } finally {
                setLoading(false);
            }
        };
        void loadData();
    }, [dispatch, t, employeeId]);

    // Обновим эффект для инициализации из initialData (при редактировании)
    useEffect(() => {
        if (initialData && initialData.constraints) {
            console.log('[PermanentConstraintForm] Initializing from initialData:', initialData);

            const constraintsMap = {};
            initialData.constraints.forEach(constraint => {
                // Формируем ключ с правильным форматом
                const dayCapitalized = constraint.day_of_week.charAt(0).toUpperCase() +
                    constraint.day_of_week.slice(1).toLowerCase();
                const shiftKey = constraint.shift_id ? String(constraint.shift_id) : 'all';
                const key = `${dayCapitalized}-${shiftKey}`;

                console.log(`[PermanentConstraintForm] Loading constraint: ${key} = ${constraint.constraint_type}`);
                constraintsMap[key] = constraint.constraint_type;
            });

            setConstraints(constraintsMap);

            if (initialData.message) {
                setMessage(initialData.message);
                setShowMessage(true);
            }
        }
    }, [initialData]);

// Убедимся, что при редактировании не загружаем permanent constraints
    useEffect(() => {
        // Загружаем permanent constraints только если НЕ редактируем существующий запрос
        if (!initialData && permanentConstraints && permanentConstraints.length > 0) {
            console.log('[PermanentConstraintForm] Initializing from permanent constraints');
            const constraintsMap = {};

            permanentConstraints.forEach(constraint => {
                if (constraint.is_active === true || constraint.is_active === 1) {
                    const dayCapitalized = constraint.day_of_week.charAt(0).toUpperCase() +
                        constraint.day_of_week.slice(1).toLowerCase();
                    const shiftKey = constraint.shift_id ? String(constraint.shift_id) : 'all';
                    const key = `${dayCapitalized}-${shiftKey}`;

                    constraintsMap[key] = constraint.constraint_type;
                }
            });

            setConstraints(constraintsMap);
        }
    }, [permanentConstraints, initialData]);

    useEffect(() => {
        const savedMessage = localStorage.getItem('permanent_constraint_message');
        if (savedMessage) {
            setMessage(savedMessage);
            setShowMessage(true);
        }
    }, []);

    useEffect(() => {
        if (showMessage) {
            localStorage.setItem('permanent_constraint_message', message);
        }
    }, [message, showMessage]);


    const fullyBlockedDays = useMemo(() => {
        const blocked = new Set();
        if (!shifts.length) return blocked;

        DAYS_OF_WEEK_CANONICAL.forEach(day => {
            const allShiftsForDayBlocked = shifts.every(shift => constraints[`${day}-${shift.id}`] === 'cannot_work');
            if (allShiftsForDayBlocked) {
                blocked.add(day);
            }
        });
        return blocked;
    }, [constraints, shifts]);

    const fullyBlockedShifts = useMemo(() => {
        const blocked = new Set();
        if (DAYS_OF_WEEK_CANONICAL.length === 0) return blocked;

        shifts.forEach(shift => {
            const allDaysForShiftBlocked = DAYS_OF_WEEK_CANONICAL.every(day =>
                constraints[`${day}-${shift.id}`] === 'cannot_work',
            );
            if (allDaysForShiftBlocked) {
                blocked.add(shift.id);
            }
        });
        return blocked;
    }, [constraints, shifts]);

    // --- ОБРАБОТЧИКИ КЛИКОВ ---
    const handleCellClick = (day, shiftId) => {
        const key = `${day}-${shiftId}`;
        setConstraints(prev => {
            const newConstraints = { ...prev };
            if (newConstraints[key] === 'cannot_work') {
                delete newConstraints[key];
            } else {
                newConstraints[key] = 'cannot_work';
            }
            return newConstraints;
        });
    };

    const handleDayClick = (day) => {
        const dayKeys = shifts.map(s => `${day}-${s.id}`);
        const allSelected = dayKeys.every(key => constraints[key] === 'cannot_work');

        setConstraints(prev => {
            const newConstraints = { ...prev };
            if (allSelected) {
                dayKeys.forEach(key => delete newConstraints[key]);
            } else {
                dayKeys.forEach(key => newConstraints[key] = 'cannot_work');
            }
            return newConstraints;
        });
    };

    const handleShiftClick = (shiftId) => {
        setConstraints(prev => {
            const shiftKeys = DAYS_OF_WEEK_CANONICAL.map(day => `${day}-${shiftId}`);
            const allSelected = shiftKeys.every(key => prev[key] === 'cannot_work');
            const newConstraints = { ...prev };
            if (allSelected) {
                shiftKeys.forEach(key => delete newConstraints[key]);
            } else {
                shiftKeys.forEach(key => newConstraints[key] = 'cannot_work');
            }
            return newConstraints;
        });
    };
    // --- ФУНКЦИИ СТИЛИЗАЦИИ ---
    const getCellStyles = (day, shiftId) => {
        const status = constraints[`${day}-${shiftId}`] || 'neutral';
        const shift = shifts.find(s => s.id === shiftId);

        const neutralBgAlpha = currentTheme === 'dark' ? 0.05 : 0.5;
        const tdStyle = {
            backgroundColor: hexToRgba(shift ? getShiftColor(shift) : '#6c757d', neutralBgAlpha),
        };

        const foregroundClasses = `constraint-cell ${status} clickable`;
        const foregroundStyle = {};
        if (status === 'cannot_work') {
            foregroundStyle.backgroundColor = '#dc3545';
            foregroundStyle.color = getContrastTextColor(foregroundStyle.backgroundColor);
        }

        return { tdStyle, foregroundStyle, foregroundClasses, status };
    };

    const getShiftHeaderStyle = (shift) => {
        const baseColor = getShiftColor(shift);
        const style = {
            backgroundColor: baseColor,
            color: getContrastTextColor(baseColor),
        };

        // Если смена полностью заблокирована, добавляем внутреннюю тень
        if (fullyBlockedShifts.has(shift.id)) {
            // Красная рамка/тень внутри элемента
            style.boxShadow = 'inset 0 0 0 4px rgba(220, 53, 69, 0.7)';
        }

        return style;
    };

    const getShiftHeaderCellStyle = (shift) => {
        const neutralBgAlpha = currentTheme === 'dark' ? 0.1 : 0.5;
        const baseColor = getShiftColor(shift);

        return { backgroundColor: hexToRgba(baseColor, neutralBgAlpha) };
    };

    const getDayHeaderStyle = (day) => {
        if (fullyBlockedDays.has(day)) {
            return { backgroundColor: '#dc3545', color: getContrastTextColor('#dc3545') };
        }
        return {};
    };

    const hasActiveConstraints = permanentConstraints && permanentConstraints.some(c => c.is_active);

    // --- ОТПРАВКА ФОРМЫ ---
    const handleConfirmSubmit = async () => {
        try {
            const constraintsArray = Object.entries(constraints).map(([key, constraint_type]) => {
                const [day_of_week, shift_id_str] = key.split('-');
                return {
                    day_of_week: day_of_week.toLowerCase(),
                    shift_id: parseInt(shift_id_str, 10),
                    constraint_type,
                };
            });

            const requestData = {
                constraints: constraintsArray,
                message: showMessage ? message.trim() : null,
            };

            // Создаем оптимистичный объект запроса
            const optimisticRequest = {
                id: `temp_${Date.now()}`,
                emp_id: null,
                constraints: constraintsArray,
                message: requestData.message,
                status: 'pending',
                requested_at: new Date().toISOString(),
                reviewed_at: null,
                reviewer: null,
                admin_response: null,
            };

            // Закрываем модальное окно
            setShowConfirm(false);
            localStorage.removeItem('permanent_constraint_message');

            // Передаем ID редактируемого запроса, если есть
            if (onSubmitSuccess) {
                onSubmitSuccess(
                    optimisticRequest,
                    requestData,
                    initialData?.id || null,
                );
            }

        } catch (err) {
            console.error('Submit preparation error:', err);
            setError(t('requests.submitError'));
            setShowConfirm(false);
        }
    };


    if (loading) return <LoadingState />;

    if (error) {
        return (
            <div className="permanent-constraint-form-container">
                <Card className="permanent-constraint-card rounded-4">
                    <Card.Header>
                        <div className="d-flex justify-content-between align-items-center">
                            <h5 className="mb-0">
                                {initialData
                                    ? t('requests.editRequest')
                                    : t('requests.permanentConstraints.title')
                                }
                            </h5>
                            <Button variant="link" onClick={onCancel} className="p-0 text-secondary">
                                <X size={28} />
                            </Button>
                        </div>
                    </Card.Header>
                    <Card.Body>
                        <ErrorMessage
                            message={error}
                            onRetry={() => {
                                setError(null);
                                setLoading(false);
                            }}
                        />
                    </Card.Body>
                </Card>
            </div>
        );
    }

    return (
        <div className="permanent-constraint-form-container">
            <Card className="permanent-constraint-card rounded-4">
                <Card.Header>
                    <div className="d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">
                            {initialData
                                ? t('requests.editRequest')
                                : t('requests.permanentConstraints.title')
                            }
                        </h5>
                        <Button variant="link"
                                onClick={onCancel}
                                className="p-0 text-secondary"
                        >
                            <X size={28} />
                        </Button>
                    </div>
                </Card.Header>

                <Card.Body className="p-0">
                    {shifts.length === 0 ? (
                        <Alert variant="info">{t('requests.no_position_assigned')}</Alert>
                    ) : (
                        <PermanentConstraintGrid
                            daysOfWeek={DAYS_OF_WEEK_CANONICAL}
                            shifts={shifts}
                            isMobile={isMobile}
                            onCellClick={handleCellClick}
                            onDayClick={handleDayClick}
                            onShiftClick={handleShiftClick}
                            getCellStyles={getCellStyles}
                            getShiftHeaderStyle={getShiftHeaderStyle}
                            getShiftHeaderCellStyle={getShiftHeaderCellStyle}
                            getDayHeaderStyle={getDayHeaderStyle}
                            fullyBlockedDays={fullyBlockedDays}
                        />
                    )}
                </Card.Body>

                {/* Футер с сообщением и кнопками */}
                <Card.Footer className="bg-transparent border-top ">
                    {isMobile ? (
                        // --- МОБИЛЬНАЯ ВЕРСТКА  ---
                        <>
                            <div className="d-flex justify-content-between align-items-center mb-1">
                                <Form.Check
                                    type="checkbox"
                                    id="include-message-mobile"
                                    label={t('requests.includeMessage')}
                                    className="include-message-checkbox mobile"
                                    checked={showMessage}
                                    onChange={(e) => setShowMessage(e.target.checked)}
                                />
                                <Button
                                    variant="outline-secondary"
                                    onClick={toggleHelpToast}
                                    className="help-button mobile"
                                >
                                    <i className="bi bi-question"></i>
                                </Button>
                            </div>
                            {showMessage && (
                                <Form.Group className="mb-1">
                                    <TextareaAutosize
                                        minRows={2}
                                        className="form-control"
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        placeholder={t('requests.messagePlaceholder')}
                                    />
                                </Form.Group>
                            )}
                            <div
                                className="d-flex action-buttons-group justify-content-between gap-2 border-top pt-2 mb-2">
                                <Button
                                    variant="outline-secondary"
                                    onClick={onCancel}
                                >
                                    {t('common.cancel')}
                                </Button>
                                <Button
                                    variant="primary"
                                    onClick={() => setShowConfirm(true)}
                                    disabled={Object.keys(constraints).length === 0}
                                >
                                    {t('common.submit')}
                                </Button>
                            </div>
                        </>
                    ) : (
                        // --- ДЕСКТОПНАЯ ВЕРСТКА  ---
                        <>
                            <div className="d-flex justify-content-between align-items-center">
                                <Form.Group>
                                    <Form.Check
                                        type="checkbox"
                                        id="include-message-desktop"
                                        label={t('requests.includeMessage')}
                                        className="include-message-checkbox desktop"
                                        checked={showMessage}
                                        onChange={(e) => setShowMessage(e.target.checked)}
                                    />
                                </Form.Group>

                                <div className="d-flex gap-2">
                                    <Button
                                        variant="outline-secondary"
                                        onClick={toggleHelpToast}
                                        className="help-button desktop"
                                    >
                                        <i className="bi bi-question"></i>
                                    </Button>
                                    <Button
                                        variant="outline-secondary"
                                        onClick={onCancel}
                                    >
                                        {t('common.cancel')}
                                    </Button>
                                    <Button
                                        variant="primary"
                                        onClick={() => setShowConfirm(true)}
                                        disabled={Object.keys(constraints).length === 0}
                                    >
                                        {t('common.submit')}
                                    </Button>
                                </div>
                            </div>

                            {showMessage && (
                                <Form.Group className="my-2">
                                    <TextareaAutosize
                                        minRows={2}
                                        className="form-control"
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        placeholder={t('requests.messagePlaceholder')}
                                    />
                                </Form.Group>
                            )}
                        </>
                    )}
                </Card.Footer>
            </Card>

            <ToastContainer position="bottom-center" className="p-3">
                <Toast show={showHelpToast} onClose={toggleHelpToast} autohide delay={10000}>
                    <Toast.Header closeButton={true}>
                        <i className="bi bi-info-circle-fill me-2"></i>
                        <strong className="me-auto">{t('requests.helpToastTitle')}</strong>
                    </Toast.Header>
                    <Toast.Body>{t('requests.helpToastBody')}</Toast.Body>
                </Toast>
            </ToastContainer>

            <ConfirmationModal
                show={showConfirm}
                onHide={() => setShowConfirm(false)}
                onConfirm={handleConfirmSubmit}
                title={t('requests.confirmSubmit.title')}
                confirmText={t('common.submit')}
                confirmVariant="primary"
            >
                <p>
                    {t('requests.confirmSubmit.message')}
                </p>

                {hasActiveConstraints && (
                    <p className="mb-0 mt-2  text-danger">
                        {t('requests.previousConstraintsWarning')}
                    </p>
                )}
            </ConfirmationModal>
        </div>
    );
};

export default PermanentConstraintForm;