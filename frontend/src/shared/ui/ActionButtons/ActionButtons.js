import React from 'react';
import { Button, ButtonGroup, Dropdown } from 'react-bootstrap';
import { useI18n } from '../../lib/i18n/i18nProvider';
import './ActionButtons.css';

const ActionButtons = ({ actions, size = 'sm', variant = 'light' }) => {
    const { t } = useI18n();

    if (!actions || actions.length === 0) return null;

    // If only one action, show as a simple button
    if (actions.length === 1) {
        const action = actions[0];
        return (
            <Button
                size={size}
                variant={action.variant || variant}
                onClick={action.onClick}
                disabled={action.disabled}
            >
                {action.icon && <i className={`${action.icon} me-1`}></i>}
                {action.label}
            </Button>
        );
    }

    // Multiple actions - show as dropdown
    return (
        <Dropdown as={ButtonGroup} size={size}>
            <Button
                variant={variant}
                size={size}
                onClick={actions[0].onClick}
                disabled={actions[0].disabled}
            >
                {actions[0].icon && <i className={`${actions[0].icon} me-1`}></i>}
                {actions[0].label}
            </Button>
            <Dropdown.Toggle split variant={variant} />
            <Dropdown.Menu>
                {actions.slice(1).map((action, index) => (
                    <Dropdown.Item
                        key={index}
                        onClick={action.onClick}
                        disabled={action.disabled}
                    >
                        {action.icon && <i className={`${action.icon} me-2`}></i>}
                        {action.label}
                    </Dropdown.Item>
                ))}
            </Dropdown.Menu>
        </Dropdown>
    );
};

export default ActionButtons;