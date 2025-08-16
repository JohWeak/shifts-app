// frontend/src/features/admin-schedule-management/ui/EmployeeRecommendations/EmployeeRecommendationsPanel.js
import React, {useState, useEffect, useRef} from 'react';
import ReactDOM from 'react-dom';
import {Button} from 'react-bootstrap';
import {useI18n} from 'shared/lib/i18n/i18nProvider';
import EmployeeRecommendations from '../';
import './EmployeeRecommendationsPanel.css';

const EmployeeRecommendationsPanel = ({
                                          isOpen,
                                          onClose,
                                          selectedPosition,
                                          onEmployeeSelect,
                                          scheduleDetails,
                                          panelWidth,
                                          onWidthChange
                                      }) => {
    const {t, direction} = useI18n();
    const [isResizing, setIsResizing] = useState(false);
    const panelRef = useRef(null);
    const startXRef = useRef(0);
    const startWidthRef = useRef(0);

    // Handle resize
    const handleMouseDown = (e) => {
        setIsResizing(true);
        startXRef.current = e.pageX;
        startWidthRef.current = panelWidth;
        e.preventDefault();
    };

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isResizing) return;

            requestAnimationFrame(() => {
                const containerWidth = window.innerWidth;
                const isRTL = direction === 'rtl';

                let diff = isRTL ? startXRef.current - e.pageX : e.pageX - startXRef.current;
                let newWidthPercent = startWidthRef.current - (diff / containerWidth * 100);

                newWidthPercent = Math.max(20, Math.min(50, newWidthPercent)); // Ограничения

                onWidthChange(newWidthPercent);
            });
        };

        const handleMouseUp = () => {
            setIsResizing(false);
        };

        if (isResizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };
    }, [isResizing, onWidthChange]);


    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!isOpen) return;
            if (e.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    const getPanelTitle = () => {
        if (!selectedPosition || !scheduleDetails) return t('employee.selectEmployee');

        const shift = scheduleDetails.shifts?.find(s => s.shift_id === selectedPosition.shiftId);
        const position = scheduleDetails.positions?.find(p => p.pos_id === selectedPosition.positionId);
        const date = new Date(selectedPosition.date).toLocaleDateString();

        return `${position?.pos_name || ''} - ${shift?.shift_name || ''} (${date})`;
    };

    return ReactDOM.createPortal(
        <div
            ref={panelRef}
            className={`recommendation-panel ${isOpen ? 'open' : ''}`}
            style={{width: `${panelWidth}%`}}
        >
            <div
                className="resize-handle"
                onMouseDown={handleMouseDown}
            />

            <div className="panel-header">
                <div className="panel-title">
                    <h5>{getPanelTitle()}</h5>
                    <Button
                        variant="link"
                        className="close-btn"
                        onClick={onClose}
                    >
                        <i className="bi bi-x-lg"></i>
                    </Button>
                </div>
            </div>

            <div className="panel-content">
                <EmployeeRecommendations
                    selectedPosition={selectedPosition}
                    onEmployeeSelect={onEmployeeSelect}
                    scheduleDetails={scheduleDetails}
                    isVisible={isOpen}
                />
            </div>
        </div>,
        document.body
    );
};

export default EmployeeRecommendationsPanel;