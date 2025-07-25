// frontend/src/features/employee-requests/ui/PermanentConstraintForm/PermanentConstraintForm.js
import React, { useState, useEffect, useMemo } from 'react';
import { Card, Button, Form, Alert } from 'react-bootstrap';
import { X } from 'react-bootstrap-icons';
import { constraintAPI } from 'shared/api/apiService';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import { useShiftColor } from 'shared/hooks/useShiftColor';
import { useMediaQuery } from 'shared/hooks/useMediaQuery';
import { addNotification } from 'app/model/notificationsSlice'; // Для будущих уведомлений
import { getContrastTextColor, hexToRgba } from 'shared/lib/utils/colorUtils';
import { getDayName } from "shared/lib/utils/scheduleUtils";
// Наши новые компоненты
import ConfirmationModal from 'shared/ui/components/ConfirmationModal/ConfirmationModal';
import LoadingState from 'shared/ui/components/LoadingState/LoadingState';
import ErrorMessage from 'shared/ui/components/ErrorMessage/ErrorMessage';
import PermanentConstraintGrid from './PermanentConstraintGrid';
import './PermanentConstraintForm.css';

const DAYS_OF_WEEK_CANONICAL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const PermanentConstraintForm = ({ onSubmitSuccess, onCancel }) => {
    const { t } = useI18n();
    const { getShiftColor, currentTheme } = useShiftColor();
    const isMobile = useMediaQuery('(max-width: 768px)');

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showConfirm, setShowConfirm] = useState(false);
    const [constraints, setConstraints] = useState({});
    const [message, setMessage] = useState('');
    const [showMessage, setShowMessage] = useState(false);
    const [shifts, setShifts] = useState([]);

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

    // --- ФУНКЦИИ СТИЛИЗАЦИИ ---
    const getCellStyles = (day, shiftId) => {
        const status = constraints[`${day}-${shiftId}`] || 'neutral';
        const shift = shifts.find(s => s.id === shiftId);

        // 1. Определяем цвет фона. Это будет ЛИБО красный, ЛИБО полупрозрачный цвет смены.
        let backgroundColor;
        if (status === 'cannot_work') {
            backgroundColor = '#dc3545'; // Красный цвет для блокировки
        } else {
            // Полупрозрачный фон для пустой ячейки. Тема учитывается.
            const neutralBgAlpha = currentTheme === 'dark' ? 0.5 : 0.5;
            // ВАЖНО: getShiftColor(shift) вернет серый, если цвет не задан.
            // Ваша ручная проверка с '#0f5faf' была правильной.
            backgroundColor = hexToRgba(shift ? getShiftColor(shift) : '#afceea', neutralBgAlpha);
        }
        console.log("[Shift and colors]",
            "Shift: ", shift,
            "BGColor: ", backgroundColor || "НЕТ ЦВЕТА",

        );

        // 2. Определяем цвет текста
        const textColor = status === 'cannot_work' ? getContrastTextColor(backgroundColor) : 'inherit';

        // 3. Собираем стили ТОЛЬКО для внутреннего div'а
        const foregroundStyle = {
            backgroundColor: backgroundColor,
            color: textColor
        };

        const foregroundClasses = `constraint-cell ${status} clickable`;


        // 4. tdStyle больше не нужен!
        return { tdStyle: {}, foregroundStyle, foregroundClasses, status };
    };

    const getDayHeaderStyle = (day) => {
        if (fullyBlockedDays.has(day)) {
            return { backgroundColor: '#dc3545', color: getContrastTextColor('#dc3545') };
        }
        return {};
    };


    const getShiftHeaderCellStyle = (shift) => {
        const neutralBgAlpha = currentTheme === 'dark' ? 0.1 : 0.5;
        const baseColor = getShiftColor(shift);
        return { backgroundColor: hexToRgba(baseColor, neutralBgAlpha) };
    };



    // --- ОТПРАВКА ФОРМЫ ---
    const handleSubmit = async () => {
        setLoading(true);
        try {
            const constraintsArray = Object.entries(constraints).map(([key, constraint_type]) => {
                const [day_of_week, shift_id_str] = key.split('-');
                return { day_of_week, shift_id: parseInt(shift_id_str, 10), constraint_type };
            });

            await constraintAPI.submitPermanentRequest({
                constraints: constraintsArray,
                message: showMessage ? message.trim() : null
            });

            if (onSubmitSuccess) onSubmitSuccess();
        } catch (err) {
            setError(t('requests.submitError'));
        } finally {
            setLoading(false);
            setShowConfirm(false);
        }
    };

    if (loading) return <LoadingState />;
    if (error) return <ErrorMessage message={error} />;

    return (
        <div className="permanent-constraint-form-container">
            <Card>
                <Card.Header>
                    <div className="d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">{t('requests.permanentConstraints.title')}</h5>
                        <Button variant="link" onClick={onCancel} className="p-0 text-body">
                            <X size={24} />
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
                            onCellClick={handleCellClick}
                            onDayClick={handleDayClick}
                            getCellStyles={getCellStyles}
                            getShiftHeaderStyle={getShiftHeaderCellStyle}
                            getDayHeaderStyle={getDayHeaderStyle}
                            getShiftColor={getShiftColor}
                            isMobile={isMobile}
                        />
                    )}
                </Card.Body>

                {/* Футер с сообщением и кнопками */}
                <Card.Footer className="bg-transparent border-top-1 mt-1">
                    <Form.Group className="mt-3">
                        <Form.Check
                            type="checkbox"
                            id="include-message"
                            label={t('requests.includeMessage')}
                            checked={showMessage}
                            onChange={(e) => setShowMessage(e.target.checked)}
                        />
                    </Form.Group>

                    {showMessage && (
                        <Form.Group className="mt-2">
                            <Form.Control
                                as="textarea"
                                rows={2}
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder={t('requests.messagePlaceholder')}
                            />
                        </Form.Group>
                    )}

                    <div className="mt-3 d-flex justify-content-end gap-2">
                        <Button variant="secondary" onClick={onCancel}>
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
                </Card.Footer>
            </Card>

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