// frontend/src/features/admin-schedule-management/ui/ActionButtons/index.js
import React, {useRef, useState, useEffect} from 'react';
import {Button, Dropdown, OverlayTrigger, Spinner, Tooltip} from 'react-bootstrap';
import ReactDOM from 'react-dom';
import {useI18n} from 'shared/lib/i18n/i18nProvider';
import {
    canDeleteSchedule,
    canPublishSchedule,
    canUnpublishSchedule,
    canEditSchedule
} from 'shared/lib/utils/scheduleUtils';
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
                                   hasUnsavedChanges = false,
                                   className = '',
                                   onAutofill,
                                   isAutofilling,
                               }) => {
    const {t, direction} = useI18n();
    const dropdownRef = useRef(null);
    const menuRef = useRef(null);
    const [showMenu, setShowMenu] = useState(false);
    const [menuPosition, setMenuPosition] = useState({top: 0, left: 0});

    // Use schedule utils for permissions
    const canDelete = canDeleteSchedule(schedule);
    const canPublish = canPublishSchedule(schedule);
    const canUnpublish = canUnpublishSchedule(schedule);
    const canEdit = canEditSchedule(schedule);

    useEffect(() => {
        if (showMenu && dropdownRef.current && variant === 'dropdown') {
            const button = dropdownRef.current.querySelector('.action-dropdown-toggle');
            if (button) {
                const rect = button.getBoundingClientRect();
                const menuWidth = 160; // Menu width

                // Calculate position based on direction
                if (direction === 'rtl') {
                    setMenuPosition({
                        top: rect.bottom + 2,
                        left: rect.left // Align to left edge in RTL
                    });
                } else {
                    setMenuPosition({
                        top: rect.bottom + 2,
                        left: rect.right - menuWidth // Align to right edge in LTR
                    });
                }
            }
        }
    }, [showMenu, variant, direction]);

    // Handle click outside to close menu
    useEffect(() => {
        if (!showMenu) return;

        const handleClickOutside = (event) => {
            // Check if click is outside both button and menu
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target) &&
                menuRef.current &&
                !menuRef.current.contains(event.target)
            ) {
                setShowMenu(false);
            }
        };

        const handleEscKey = (event) => {
            if (event.key === 'Escape') {
                setShowMenu(false);
            }
        };

        // Add delay to prevent immediate closing
        setTimeout(() => {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleEscKey);
        }, 0);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscKey);
        };
    }, [showMenu]);

    // Close other dropdowns when opening this one
    useEffect(() => {
        if (!showMenu) return;

        const closeOtherDropdowns = () => {
            // Dispatch custom event to close other dropdowns
            const event = new CustomEvent('closeDropdowns', {detail: {exceptId: dropdownRef.current?.id}});
            document.dispatchEvent(event);
        };

        closeOtherDropdowns();
    }, [showMenu]);

    // Listen for close events from other dropdowns
    useEffect(() => {
        const handleCloseEvent = (event) => {
            if (dropdownRef.current?.id !== event.detail.exceptId) {
                setShowMenu(false);
            }
        };

        document.addEventListener('closeDropdowns', handleCloseEvent);
        return () => document.removeEventListener('closeDropdowns', handleCloseEvent);
    }, []);

    // Generate unique ID for this dropdown
    useEffect(() => {
        if (dropdownRef.current && !dropdownRef.current.id) {
            dropdownRef.current.id = `dropdown-${Math.random().toString(36).substr(2, 9)}`;
        }
    }, []);

    const handleToggle = () => {
        setShowMenu(!showMenu);
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
        // Tooltip for disabled publish button
        const renderPublishTooltip = (props) => (
            <Tooltip id="publish-disabled-tooltip" {...props}>
                {t('schedule.saveChangesBeforePublish')}
            </Tooltip>
        );
        return (
            <div className={`schedule-action-buttons ${className}`}>
                {/* Status action button */}
                <div className="status-action">
                    {hasUnsavedChanges &&(
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={onAutofill}
                            disabled={isAutofilling}
                            className="autofill-all-btn me-2"
                        >
                            {isAutofilling ? (
                                <>
                                    <Spinner size="sm" className="me-1"/>
                                    {t('schedule.autofillInProgress')}
                                </>
                            ) : (
                                <>
                                    <i className="bi bi-magic me-1"></i>
                                    {t('schedule.autofillSchedule')}
                                </>
                            )}
                        </Button>
                    )}
                    {canPublish && onPublish && (
                        hasUnsavedChanges ? (
                            <OverlayTrigger
                                placement="top"
                                delay={{show: 250, hide: 400}}
                                overlay={renderPublishTooltip}
                            >
                                <span className="d-inline-block">
                                    <Button
                                        variant="success"
                                        size={size}
                                        disabled
                                        style={{pointerEvents: 'none'}}
                                        className="publish-btn"
                                    >
                                        <i className="bi bi-check-circle me-2"></i>
                                        {t('schedule.publish')}
                                    </Button>
                                </span>
                            </OverlayTrigger>
                        ) : (
                            <Button
                                variant="success"
                                size={size}
                                onClick={() => onPublish()}
                                className="publish-btn"
                            >
                                <i className="bi bi-check-circle me-2"></i>
                                {t('schedule.publish')}
                            </Button>
                        )
                    )}
                    {canUnpublish && onUnpublish && (
                        <Button
                            variant="warning"
                            size={size}
                            onClick={() => onUnpublish()}
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
                <button
                    type="button"
                    className={`btn btn-light btn-sm action-dropdown-toggle ${showMenu ? 'show' : ''}`}
                    onClick={handleToggle}
                    aria-expanded={showMenu}
                >
                    <i className="bi bi-three-dots-vertical"></i>
                </button>
            </div>

            {/* Portal for dropdown menu */}
            {showMenu && ReactDOM.createPortal(
                <div
                    ref={menuRef}
                    className="schedule-action-menu-portal"
                    style={{
                        position: 'fixed',
                        top: menuPosition.top,
                        left: menuPosition.left,
                        zIndex: 9999
                    }}
                    onClick={(e) => e.stopPropagation()}
                    dir={direction}
                >
                    <div className="dropdown-menu show">
                        {onView && (
                            <button
                                className="dropdown-item"
                                onClick={handleItemClick(onView)}
                            >
                                <i className="bi bi-eye"></i>
                                <span>{t('common.view')}</span>
                            </button>
                        )}

                        {canEdit && onEdit && (
                            <button
                                className="dropdown-item"
                                onClick={handleItemClick(onEdit)}
                            >
                                <i className="bi bi-pencil"></i>
                                <span>{t('common.edit')}</span>
                            </button>
                        )}

                        {canPublish && onPublish && !hasUnsavedChanges && (
                            <button
                                className="dropdown-item text-success"
                                onClick={handleItemClick(onPublish)}
                            >
                                <i className="bi bi-upload"></i>
                                <span>{t('schedule.publish')}</span>
                            </button>
                        )}

                        {canUnpublish && onUnpublish && (
                            <button
                                className="dropdown-item text-warning"
                                onClick={handleItemClick(onUnpublish)}
                            >
                                <i className="bi bi-pencil-square"></i>
                                <span>{t('schedule.unpublish')}</span>
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
                                    <span>{t('schedule.export')}</span>
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
                                    <span>{t('common.delete')}</span>
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