//frontend/src/features/admin-schedule-management/ui/ScheduleView/components/Position/components/PositionScheduleHeader/index.js

import React from 'react';
import {Button, Badge, Form, Spinner, Tooltip, OverlayTrigger} from 'react-bootstrap';
import {useI18n} from 'shared/lib/i18n/i18nProvider';
import './PositionScheduleHeader.css'


const PositionScheduleHeader = ({
                                    position,
                                    isEditing,
                                    canEdit,
                                    isPublished,
                                    isSaving,
                                    shortage,
                                    currentStats,
                                    totalRequired,
                                    positionPendingChanges,
                                    showFirstNameOnly,
                                    onNameToggle,
                                    onToggleEdit,
                                    onSaveClick,
                                    onAutofill,
                                    isAutofilling,
                                }) => {
    const {t} = useI18n();

    const renderEditTooltip = (props) => (
        <Tooltip id="edit-disabled-tooltip" {...props}>
            {isPublished
                ? t('schedule.unpublishToEdit')
                : t('schedule.cannotEditStatus')}
        </Tooltip>
    );

    return (
        <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
                <h6 className="mb-1">{position.pos_name}</h6>
                <div className="d-flex align-items-center gap-2 flex-wrap">
                    <Form.Check
                        type="switch"
                        id={`name-switch-${position.pos_id}`}
                        label={t('employee.showFirstNameOnly')}
                        className="d-inline-block text-muted"
                        checked={showFirstNameOnly}
                        onChange={(e) => onNameToggle(e.target.checked)}
                    />

                    <Badge bg={shortage === 0 ? 'success' : shortage > 0 ? 'danger' : 'warning'}>
                        {t('schedule.assignments')}: {currentStats.afterChanges}/{totalRequired}
                    </Badge>

                    {positionPendingChanges.length > 0 && (
                        <Badge bg="info">
                            {t('schedule.pending')}: {positionPendingChanges.length}
                        </Badge>
                    )}

                    {shortage !== 0 && (
                        <Badge bg={shortage > 0 ? 'danger' : 'warning'}>
                            {shortage > 0
                                ? `↓ ${shortage}`
                                : `↑ ${Math.abs(shortage)}`}
                        </Badge>
                    )}
                </div>
            </div>
            <div>
                {!isEditing && (
                    <>
                        {!canEdit ? (
                            <OverlayTrigger
                                placement="top"
                                delay={{show: 250, hide: 400}}
                                overlay={renderEditTooltip}
                            >
                                <span className="d-inline-block">
                                    <Button
                                        variant="outline-primary"
                                        size="sm"
                                        disabled
                                        style={{pointerEvents: 'none'}}
                                    >
                                        <i className="bi bi-pencil me-1"></i>
                                        {t('common.edit')}
                                    </Button>
                                </span>
                            </OverlayTrigger>
                        ) : (
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={() => onToggleEdit(position.pos_id)}
                            >
                                <i className="bi bi-pencil me-1"></i>
                                {t('common.edit')}
                            </Button>
                        )}
                    </>
                )}

                {isEditing && (
                    <div className="d-flex gap-2">
                        <Button
                            variant="primary"
                            className={`autofilling-button ${shortage > 0 ? 'show' : 'hide'}`}
                            size="sm"
                            onClick={onAutofill}
                            disabled={isAutofilling || isSaving}
                            title={t('schedule.autofillTooltip')}
                        >
                            {isAutofilling ? (
                                <>
                                    <Spinner size="sm" className="mx-2"/>
                                    {t('schedule.autofilling')}
                                </>
                            ) : (
                                <>
                                    <i className="bi bi-magic me-1"></i>
                                    {t('schedule.autofill')}
                                </>
                            )}
                        </Button>

                        <Button
                            variant="success"
                            size="sm"
                            onClick={onSaveClick}
                            disabled={isSaving || positionPendingChanges.length === 0}
                        >
                            {isSaving ? (
                                <>
                                    <Spinner size="sm" className="me-1"/>
                                    {t('common.saving')}
                                </>
                            ) : (
                                <>
                                    <i className="bi bi-check me-1"></i>
                                    {t('common.save')}
                                </>
                            )}
                        </Button>
                        <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => onToggleEdit(position.pos_id)}
                            disabled={isSaving}
                        >
                            {t('common.cancel')}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PositionScheduleHeader;