// frontend/src/shared/hoc/withGlobalProtection.js
import React, { useEffect, useState } from 'react';
import { withRenderProtection } from '../hooks/useRenderProtection';

const GLOBAL_RENDER_THRESHOLD = 100; // renders per second across all components
const MONITORING_WINDOW = 1000; // 1 second

class GlobalRenderMonitor {
    constructor() {
        this.renderCounts = new Map();
        this.lastReset = Date.now();
        this.isGloballyBlocked = false;
        this.listeners = new Set();
    }

    addRender(componentName) {
        const now = Date.now();

        // Reset counters if monitoring window passed
        if (now - this.lastReset >= MONITORING_WINDOW) {
            this.renderCounts.clear();
            this.lastReset = now;
            if (this.isGloballyBlocked) {
                this.isGloballyBlocked = false;
                this.notifyListeners();
            }
        }

        // Increment counter for this component
        const current = this.renderCounts.get(componentName) || 0;
        this.renderCounts.set(componentName, current + 1);

        // Calculate total renders
        const totalRenders = Array.from(this.renderCounts.values()).reduce((sum, count) => sum + count, 0);
        const rendersPerSecond = (totalRenders / (now - this.lastReset)) * 1000;

        // Check if we should block globally
        if (rendersPerSecond > GLOBAL_RENDER_THRESHOLD && !this.isGloballyBlocked) {
            console.error(
                `[GlobalProtection] GLOBAL BLOCK activated! Too many renders across app: ${rendersPerSecond.toFixed(1)} renders/sec. ` +
                `Components: ${Array.from(this.renderCounts.entries()).map(([name, count]) => `${name}(${count})`).join(', ')}`,
            );
            this.isGloballyBlocked = true;
            this.notifyListeners();

            // Auto-unblock after cooldown
            setTimeout(() => {
                this.isGloballyBlocked = false;
                this.renderCounts.clear();
                this.lastReset = Date.now();
                this.notifyListeners();
                console.log('[GlobalProtection] Global block lifted after cooldown');
            }, MONITORING_WINDOW);
        }
    }

    subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    notifyListeners() {
        this.listeners.forEach(listener => listener(this.isGloballyBlocked));
    }

    getStatus() {
        return {
            isBlocked: this.isGloballyBlocked,
            totalComponents: this.renderCounts.size,
            renderCounts: new Map(this.renderCounts),
        };
    }
}

const globalMonitor = new GlobalRenderMonitor();

export const useGlobalRenderProtection = (componentName) => {
    const [isGloballyBlocked, setIsGloballyBlocked] = useState(false);

    useEffect(() => {
        const unsubscribe = globalMonitor.subscribe(setIsGloballyBlocked);
        return unsubscribe;
    }, []);

    useEffect(() => {
        globalMonitor.addRender(componentName);
    });

    return { isGloballyBlocked, globalStatus: globalMonitor.getStatus() };
};

export const withGlobalProtection = (WrappedComponent, componentName) => {
    return function GloballyProtectedComponent(props) {
        const { isGloballyBlocked } = useGlobalRenderProtection(componentName || WrappedComponent.name);

        if (isGloballyBlocked) {
            return (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999,
                    color: 'white',
                    textAlign: 'center',
                }}>
                    <div style={{
                        backgroundColor: '#2d3748',
                        padding: '40px',
                        borderRadius: '12px',
                        border: '3px solid #e53e3e',
                    }}>
                        <h2 style={{ color: '#e53e3e', margin: '0 0 20px 0' }}>
                            🚨 Application Protection Mode
                        </h2>
                        <p style={{ margin: '0 0 10px 0', fontSize: '18px' }}>
                            The application detected excessive re-rendering that could freeze your browser.
                        </p>
                        <p style={{ margin: '0', fontSize: '14px', opacity: 0.8 }}>
                            Please wait a moment while the system recovers...
                        </p>
                        <div style={{ marginTop: '20px' }}>
                            <div className="spinner-border text-warning" role="status"
                                 style={{ width: '3rem', height: '3rem' }}>
                                <span className="sr-only">Loading...</span>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        return <WrappedComponent {...props} />;
    };
};

// Combined HOC that provides both local and global protection
export const withFullProtection = (WrappedComponent, componentName) => {
    const LocalProtected = withRenderProtection(WrappedComponent, componentName);
    return withGlobalProtection(LocalProtected, componentName);
};