// frontend/src/shared/ui/components/ProtectionMonitor/index.js
import React, { useEffect, useState } from 'react';
import { Badge, Button, Card, Collapse } from 'react-bootstrap';
import { useGlobalRenderProtection } from '../../hoc/withGlobalProtection';
import { getActionProtectionStats } from '../../middleware/actionProtectionMiddleware';
import './ProtectionMonitor.css';

const ProtectionMonitor = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [actionStats, setActionStats] = useState({});
    const { globalStatus } = useGlobalRenderProtection('ProtectionMonitor');

    // Only show in development mode
    const isDev = process.env.NODE_ENV === 'development';

    useEffect(() => {
        if (!isDev) return;

        const interval = setInterval(() => {
            setActionStats(getActionProtectionStats());
        }, 1000);

        return () => clearInterval(interval);
    }, [isDev]);

    if (!isDev) return null;

    const hasIssues = globalStatus.isBlocked || actionStats.blockedActions?.length > 0;

    return (
        <div className="protection-monitor">
            <Button
                variant={hasIssues ? 'danger' : 'secondary'}
                size="sm"
                onClick={() => setIsVisible(!isVisible)}
                className="protection-monitor-toggle"
            >
                🛡️ Protection
                {hasIssues && <Badge bg="danger" className="ms-1">!</Badge>}
            </Button>

            <Collapse in={isVisible}>
                <Card className="protection-monitor-panel">
                    <Card.Header>
                        <h6 className="mb-0">Protection Monitor</h6>
                    </Card.Header>
                    <Card.Body>
                        {/* Render Protection Status */}
                        <div className="mb-3">
                            <strong>Render Protection:</strong>
                            <div className="d-flex align-items-center mt-1">
                                <Badge bg={globalStatus.isBlocked ? 'danger' : 'success'} className="me-2">
                                    {globalStatus.isBlocked ? 'BLOCKED' : 'OK'}
                                </Badge>
                                <span className="small">
                                    Components: {globalStatus.totalComponents}
                                </span>
                            </div>
                            {globalStatus.renderCounts && globalStatus.renderCounts.size > 0 && (
                                <div className="small text-muted mt-1">
                                    Active: {Array.from(globalStatus.renderCounts.entries())
                                    .map(([name, count]) => `${name}(${count})`)
                                    .join(', ')}
                                </div>
                            )}
                        </div>

                        {/* Action Protection Status */}
                        <div>
                            <strong>Action Protection:</strong>
                            <div className="d-flex align-items-center mt-1">
                                <Badge bg={actionStats.blockedActions?.length > 0 ? 'warning' : 'success'}
                                       className="me-2">
                                    {actionStats.blockedActions?.length > 0 ?
                                        `${actionStats.blockedActions.length} BLOCKED` :
                                        'OK'
                                    }
                                </Badge>
                            </div>
                            {actionStats.blockedActions?.length > 0 && (
                                <div className="small text-warning mt-1">
                                    Blocked: {actionStats.blockedActions.join(', ')}
                                </div>
                            )}
                            {actionStats.actionCounts && Object.keys(actionStats.actionCounts).length > 0 && (
                                <div className="small text-muted mt-1">
                                    Active: {Object.entries(actionStats.actionCounts)
                                    .slice(0, 3)
                                    .map(([action, count]) => `${action}(${count})`)
                                    .join(', ')}
                                    {Object.keys(actionStats.actionCounts).length > 3 && '...'}
                                </div>
                            )}
                        </div>

                        {hasIssues && (
                            <div className="mt-3 p-2 bg-warning bg-opacity-10 rounded">
                                <small className="text-warning">
                                    ⚠️ Protection systems are actively preventing potential issues
                                </small>
                            </div>
                        )}
                    </Card.Body>
                </Card>
            </Collapse>
        </div>
    );
};

export default ProtectionMonitor;