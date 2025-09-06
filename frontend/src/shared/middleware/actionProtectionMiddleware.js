// frontend/src/shared/middleware/actionProtectionMiddleware.js

const ACTION_THRESHOLD = 50; // max actions per second
const MONITORING_WINDOW = 1000; // 1 second
const BLOCKED_ACTIONS_COOLDOWN = 2000; // 2 seconds

class ActionProtectionMonitor {
    constructor() {
        this.actionCounts = new Map();
        this.blockedActions = new Set();
        this.windowStart = Date.now();
    }

    shouldBlockAction(actionType) {
        const now = Date.now();

        // Reset window if needed
        if (now - this.windowStart >= MONITORING_WINDOW) {
            this.actionCounts.clear();
            this.windowStart = now;
        }

        // Check if action is currently blocked
        if (this.blockedActions.has(actionType)) {
            return true;
        }

        // Count this action
        const currentCount = this.actionCounts.get(actionType) || 0;
        this.actionCounts.set(actionType, currentCount + 1);

        const timeSinceWindowStart = now - this.windowStart;
        const actionsPerSecond = (currentCount / timeSinceWindowStart) * 1000;

        // Block if threshold exceeded
        if (actionsPerSecond > ACTION_THRESHOLD) {
            console.error(
                `[ActionProtection] BLOCKING action "${actionType}" due to excessive frequency: ` +
                `${actionsPerSecond.toFixed(1)} actions/sec (${currentCount} in ${timeSinceWindowStart}ms)`,
            );

            this.blockedActions.add(actionType);

            // Unblock after cooldown
            setTimeout(() => {
                this.blockedActions.delete(actionType);
                console.log(`[ActionProtection] Action "${actionType}" unblocked after cooldown`);
            }, BLOCKED_ACTIONS_COOLDOWN);

            return true;
        }

        // Warn at 50% of threshold
        if (actionsPerSecond > ACTION_THRESHOLD * 0.5 && currentCount % 10 === 0) {
            console.warn(
                `[ActionProtection] High frequency for action "${actionType}": ` +
                `${actionsPerSecond.toFixed(1)} actions/sec`,
            );
        }

        return false;
    }

    getStats() {
        return {
            blockedActions: Array.from(this.blockedActions),
            actionCounts: Object.fromEntries(this.actionCounts),
            windowStart: this.windowStart,
        };
    }
}

const monitor = new ActionProtectionMonitor();

export const actionProtectionMiddleware = (store) => (next) => (action) => {
    // Skip protection for certain system actions
    const exemptActions = [
        '@@redux/INIT',
        '@@INIT',
        'persist/',
        'notifications/add',  // Don't block notification actions
    ];

    const isExempt = exemptActions.some(exempt =>
        action.type && action.type.startsWith(exempt),
    );

    if (!isExempt && monitor.shouldBlockAction(action.type)) {
        // Instead of completely blocking, we could:
        // 1. Return the current state unchanged
        // 2. Add a notification about the blocked action
        // 3. Log for debugging

        console.warn(`[ActionProtection] Blocked action: ${action.type}`);

        // Optionally dispatch a notification about the block
        if (action.type !== 'notifications/add') {
            store.dispatch({
                type: 'notifications/add',
                payload: {
                    id: `blocked-action-${Date.now()}`,
                    message: `Action ${action.type} was blocked due to excessive frequency`,
                    variant: 'warning',
                    timeout: 3000,
                },
            });
        }

        return store.getState(); // Return current state unchanged
    }

    return next(action);
};

// Export monitor for debugging
export const getActionProtectionStats = () => monitor.getStats();