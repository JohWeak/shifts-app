// frontend/src/features/admin-schedule-management/ui/ActionButtons/ScheduleActionButtons.js
import React, { useRef, useState, useEffect } from 'react';
import { Button, Dropdown } from 'react-bootstrap';
import ReactDOM from 'react-dom';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import './ScheduleActionButtons.css';

const ScheduleActionButtons = ({
                                   schedule,
                                   variant = 'dropdown', // 'dropdown' | 'buttons'
                                   size = 'sm',
                                   onView,
                                   onEdit,
                                   onPublish,
                                   onUnpublish,
                                   onDelete,
                                   onExport,
                                   isExporting = false,
                                   className = ''
                               }) => {
    const { t } = useI18n();
    const dropdownRef = useRef(null);
    const [showMenu, setShowMenu] = useState(false);
    const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

    const canDelete = ['draft', 'unpublished'].includes(schedule?.status?.toLowerCase());
    const canPublish = schedule?.status === 'draft';
    const canUnpublish = schedule?.status === 'published';
    const canEdit = schedule?.status === 'draft';

    useEffect(() => {
        if (showMenu && dropdownRef.current && variant === 'dropdown') {
            const button = dropdownRef.current.querySelector('.action-dropdown-toggle');
            if (button) {
                const rect = button.getBoundingClientRect();
                setMenuPosition({
                    top: rect.bottom + 2,
                    left: rect.right - 160 // Menu width
                });
            }
        }
    }, [showMenu, variant]);

    const handleToggle = (isOpen) => {
        setShowMenu(isOpen);
    };

    const handleItemClick = (callback) => {
        return (e) => {
            e.stopPropagation();
            setShowMenu(false);
            if (callback) callback();
        };
    };

    // Button group variant (for ScheduleInfo)
    if (variant === 'buttons') {
        return (
            <div className={`schedule-action-buttons ${className}`}>
                {/* Status action button */}
                <div className="status-action">
                    {canPublish && (
                        <Button
                            variant="success"
                            size={size}
                            onClick={onPublish}
                            className="publish-btn"
                        >
                            <i className="bi bi-check-circle me-2"></i>
                            {t('schedule.publish')}
                        </Button>
                    )}
                    {canUnpublish && (
                        <Button
                            variant="warning"
                            size={size}
                            onClick={onUnpublish}
                            className="unpublish-btn"
                        >
                            <i className="bi bi-pencil-square me-2"></i>
                            {t('schedule.unpublishEdit')}
                        </Button>
                    )}
                </div>

                {/* Export button */}
                {onExport && (
                    <div className="export-action">
                        <Button
                            variant="outline-primary"
                            size={size}
                            onClick={() => onExport('pdf')}
                            disabled={isExporting}
                            className="export-btn"
                        >
                            {isExporting ? (
                                <>
                                    <div className="spinner-border spinner-border-sm me-2" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                    </div>
                                    {t('common.loading')}
                                </>
                            ) : (
                                <>
                                    <i className="bi bi-upload me-2"></i>
                                    {t('schedule.export')}
                                </>
                            )}
                        </Button>
                    </div>
                )}
            </div>
        );
    }

    // Dropdown variant (for table rows)
    return (
        <>
            <div
                className={`schedule-action-dropdown ${className}`}
                onClick={(e) => e.stopPropagation()}
                ref={dropdownRef}
            >
                <Dropdown show={showMenu} onToggle={handleToggle}>
                    <Dropdown.Toggle
                        variant="light"
                        size={size}
                        className="action-dropdown-toggle"
                    >
                        <i className="bi bi-three-dots-vertical"></i>
                    </Dropdown.Toggle>
                </Dropdown>
            </div>

            {/* Portal for dropdown menu */}
            {showMenu && ReactDOM.createPortal(
                <div
                    className="schedule-action-menu-portal"
                    style={{
                        position: 'fixed',
                        top: menuPosition.top,
                        left: menuPosition.left,
                        zIndex: 9999
                    }}
                >
                    <div className="dropdown-menu show">
                        {onView && (
                            <button
                                className="dropdown-item"
                                onClick={handleItemClick(onView)}
                            >
                                <i className="bi bi-eye"></i>
                                {t('common.view')}
                            </button>
                        )}

                        {canEdit && onEdit && (
                            <button
                                className="dropdown-item"
                                onClick={handleItemClick(onEdit)}
                            >
                                <i className="bi bi-pencil"></i>
                                {t('common.edit')}
                            </button>
                        )}

                        {canPublish && onPublish && (
                            <button
                                className="dropdown-item text-success"
                                onClick={handleItemClick(onPublish)}
                            >
                                <i className="bi bi-upload"></i>
                                {t('schedule.publish')}
                            </button>
                        )}

                        {canUnpublish && onUnpublish && (
                            <button
                                className="dropdown-item text-warning"
                                onClick={handleItemClick(onUnpublish)}
                            >
                                <i className="bi bi-pencil-square"></i>
                                {t('schedule.unpublish')}
                            </button>
                        )}

                        {onExport && (
                            <>
                                <div className="dropdown-divider"></div>
                                <button
                                    className="dropdown-item"
                                    onClick={handleItemClick(() => onExport('pdf'))}
                                >
                                    <i className="bi bi-file-pdf"></i>
                                    {t('schedule.export')}
                                </button>
                            </>
                        )}

                        {canDelete && onDelete && (
                            <>
                                <div className="dropdown-divider"></div>
                                <button
                                    className="dropdown-item text-danger"
                                    onClick={handleItemClick(onDelete)}
                                >
                                    <i className="bi bi-trash"></i>
                                    {t('common.delete')}
                                </button>
                            </>
                        )}
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};

export default ScheduleActionButtons;