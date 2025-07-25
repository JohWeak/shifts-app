// frontend/src/features/employee-requests/ui/PermanentConstraintForm/PermanentConstraintForm.js
import React, {useState, useEffect, useMemo} from 'react';
import {Card, Button, Form, Alert, Toast, ToastContainer} from 'react-bootstrap';
import {X} from 'react-bootstrap-icons';
import TextareaAutosize from 'react-textarea-autosize';
import {constraintAPI} from 'shared/api/apiService';
import {useI18n} from 'shared/lib/i18n/i18nProvider';
import {useShiftColor} from 'shared/hooks/useShiftColor';
import {useMediaQuery} from 'shared/hooks/useMediaQuery';
import {addNotification} from 'app/model/notificationsSlice'; // Для будущих уведомлений
import {getContrastTextColor, hexToRgba} from 'shared/lib/utils/colorUtils';

import ConfirmationModal from 'shared/ui/components/ConfirmationModal/ConfirmationModal';
import LoadingState from 'shared/ui/components/LoadingState/LoadingState';
import ErrorMessage from 'shared/ui/components/ErrorMessage/ErrorMessage';
import PermanentConstraintGrid from './PermanentConstraintGrid';
import './PermanentConstraintForm.css';

const DAYS_OF_WEEK_CANONICAL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const PermanentConstraintForm = ({onSubmitSuccess, onCancel}) => {
    const {t} = useI18n();
    const {getShiftColor, currentTheme} = useShiftColor();
    const isMobile = useMediaQuery('(max-width: 888px)');

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showConfirm, setShowConfirm] = useState(false);
    const [constraints, setConstraints] = useState({});
    const [message, setMessage] = useState('');
    const [showMessage, setShowMessage] = useState(false);
    const [shifts, setShifts] = useState([]);
    const [showHelpToast, setShowHelpToast] = useState(false);
    const toggleHelpToast = () => setShowHelpToast(!showHelpToast);

    // Загрузка данных
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const shiftsResponse = await constraintAPI.getEmployeeShifts();
                setShifts(shiftsResponse.data?.shifts || []);
            } catch (err) {
                setError(t('requests.load_shifts_error'));
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [t]);

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
                constraints[`${day}-${shift.id}`] === 'cannot_work'
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
            const newConstraints = {...prev};
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
            const newConstraints = {...prev};
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
            const newConstraints = {...prev};
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

        return {tdStyle, foregroundStyle, foregroundClasses, status};
    };

    const getShiftHeaderStyle = (shift) => {
        const baseColor = getShiftColor(shift);
        const style = {
            backgroundColor: baseColor,
            color: getContrastTextColor(baseColor)
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

        return {backgroundColor: hexToRgba(baseColor, neutralBgAlpha)};
    };

    const getDayHeaderStyle = (day) => {
        if (fullyBlockedDays.has(day)) {
            return {backgroundColor: '#dc3545', color: getContrastTextColor('#dc3545')};
        }
        return {};
    };


    // --- ОТПРАВКА ФОРМЫ ---
    const handleSubmit = async () => {
        setLoading(true);
        try {
            const constraintsArray = Object.entries(constraints).map(([key, constraint_type]) => {
                const [day_of_week, shift_id_str] = key.split('-');
                return {
                    day_of_week: day_of_week.toLowerCase(), // Приводим к lowercase
                    shift_id: parseInt(shift_id_str, 10),
                    constraint_type
                };
            });

            await constraintAPI.submitPermanentRequest({
                constraints: constraintsArray,
                message: showMessage ? message.trim() : null
            });

            if (onSubmitSuccess) onSubmitSuccess();
        } catch (err) {
            console.error('Submit error:', err);

            // Показываем ошибку пользователю
            const errorMessage = err.response?.data?.message || t('requests.submitError');

            // Если это ошибка о существующем запросе, показываем её
            if (errorMessage.includes('pending request')) {
                setError(t('requests.pendingRequestExists'));
            } else {
                setError(errorMessage);
            }

            // Не закрываем форму при ошибке
            setLoading(false);
            setShowConfirm(false);
            return;
        }
    };


    if (loading) return <LoadingState/>;
    if (error) {
        return (
            <div className="permanent-constraint-form-container">
                <Card className="permanent-constraint-card rounded-4">
                    <Card.Header>
                        <div className="d-flex justify-content-between align-items-center">
                            <h5 className="mb-0">{t('requests.permanentConstraints.title')}</h5>
                            <Button variant="link" onClick={onCancel} className="p-0 text-secondary">
                                <X size={28}/>
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
                        <h5 className="mb-0">{t('requests.permanentConstraints.title')}</h5>
                        <Button variant="link" onClick={onCancel} className="p-0 text-secondary">
                            <X size={28}/>
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
                onConfirm={handleSubmit}
                title={t('requests.confirmSubmit.title')}
                message={t('requests.confirmSubmit.message')}
                confirmText={t('common.submit')}
                loading={loading}
            />
        </div>
    );
};

export default PermanentConstraintForm;