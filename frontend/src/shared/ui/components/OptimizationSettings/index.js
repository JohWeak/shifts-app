import React from 'react';
import { Button, Col, Form, OverlayTrigger, Row, Tooltip } from 'react-bootstrap';
import { useI18n } from 'shared/lib/i18n/i18nProvider';
import './OptimizationSettings.css';

const OptimizationSettings = ({ 
    optimizationMode = 'balanced', 
    fairnessWeight = 50, 
    onOptimizationModeChange, 
    onFairnessWeightChange,
    className = '',
    showTitle = true,
    layout = 'row' // 'row' or 'column'
}) => {
    const { t } = useI18n();

    const renderHelpButton = (tooltipKey) => (
        <OverlayTrigger
            placement="top"
            overlay={
                <Tooltip id={`tooltip-${tooltipKey}`}>
                    {t(`settings.help.${tooltipKey}`)}
                </Tooltip>
            }
        >
            <Button 
                variant="link" 
                size="sm" 
                className="help-button p-0 ms-1"
            >
                <i className="bi bi-question-circle"></i>
            </Button>
        </OverlayTrigger>
    );

    const optimizationModeGroup = (
        <Form.Group className="mb-4">
            <Form.Label className="settings-label d-flex align-items-center">
                <i className="bi bi-speedometer2 me-2"></i>
                {t('settings.optimizationMode')}
                {renderHelpButton('optimizationMode')}
            </Form.Label>
            <Form.Select
                value={optimizationMode}
                onChange={(e) => onOptimizationModeChange?.(e.target.value)}
                className="settings-input"
            >
                <option value="fast">{t('settings.optimizationFast')}</option>
                <option value="balanced">{t('settings.optimizationBalanced')}</option>
                <option value="thorough">{t('settings.optimizationThorough')}</option>
            </Form.Select>
        </Form.Group>
    );

    const fairnessWeightGroup = (
        <Form.Group className="mb-4">
            <Form.Label className="settings-label d-flex align-items-center">
                <i className="bi bi-graph-up me-2"></i>
                {t('settings.fairnessWeight')}
                {renderHelpButton('fairnessBalance')}
            </Form.Label>
            <Form.Range
                min={0}
                max={100}
                value={fairnessWeight}
                onChange={(e) => onFairnessWeightChange?.(parseInt(e.target.value))}
                className="settings-range"
            />
            <div className="d-flex justify-content-between">
                <small className="text-muted">{t('settings.efficiency')}</small>
                <small className="text-muted">{fairnessWeight}%</small>
                <small className="text-muted">{t('settings.fairness')}</small>
            </div>
        </Form.Group>
    );

    return (
        <div className={`optimization-settings ${className}`}>
            {showTitle && (
                <h6 className="settings-section-title">
                    <i className="bi bi-gear-wide-connected me-2"></i>
                    {t('settings.optimizationSettings')}
                </h6>
            )}

            {layout === 'row' ? (
                <Row>
                    <Col md={6}>
                        {optimizationModeGroup}
                    </Col>
                    <Col md={6}>
                        {fairnessWeightGroup}
                    </Col>
                </Row>
            ) : (
                <>
                    {optimizationModeGroup}
                    {fairnessWeightGroup}
                </>
            )}
        </div>
    );
};

export default OptimizationSettings;