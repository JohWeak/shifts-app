// frontend/src/features/admin-schedule-management/ui/ScheduleView/components/ContextMenu/index.js

import React, { useEffect, useRef } from 'react';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import './ContextMenu.css';

const ContextMenu = ({ 
    isVisible, 
    position = { x: 0, y: 0 }, 
    onClose, 
    employee, 
    cellData,
    onMakeFlexible,
    onRemoveFlexible,
    onRemoveAssignment
}) => {
    const { t } = useI18n();
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                onClose();
            }
        };

        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        if (isVisible) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleEscape);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isVisible, onClose]);

    if (!isVisible || !employee) return null;

    const isFlexible = employee.assignment_type === 'flexible' || employee.isFlexible;

    const handleAction = (action, ...args) => {
        action(...args);
        onClose();
    };

    return (
        <div
            ref={menuRef}
            className="context-menu"
            style={{
                left: position.x,
                top: position.y,
            }}
        >
            <div className="context-menu-header">
                <small className="text-muted">{employee.name}</small>
            </div>
            
            <div className="context-menu-items">
                {!isFlexible ? (
                    <button 
                        className="context-menu-item"
                        onClick={() => handleAction(onMakeFlexible, employee, cellData)}
                    >
                        <i className="bi bi-shuffle me-2"></i>
                        {t('schedule.makeFlexible')}
                    </button>
                ) : (
                    <button 
                        className="context-menu-item"
                        onClick={() => handleAction(onRemoveFlexible, employee, cellData)}
                    >
                        <i className="bi bi-arrow-clockwise me-2"></i>
                        {t('schedule.makeRegular')}
                    </button>
                )}
                
                <div className="context-menu-divider"></div>
                
                <button 
                    className="context-menu-item context-menu-item-danger"
                    onClick={() => handleAction(onRemoveAssignment, employee, cellData)}
                >
                    <i className="bi bi-x-circle me-2"></i>
                    {t('schedule.removeAssignment')}
                </button>
            </div>
        </div>
    );
};

export default ContextMenu;