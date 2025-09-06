// frontend/src/shared/hooks/useRenderProtection.js
import { useEffect, useRef, useState } from 'react';

const MAX_RENDERS_PER_SECOND = 60;
const WARNING_RENDERS_PER_SECOND = 30;
const MONITORING_WINDOW = 1000; // 1 second

export const useRenderProtection = (componentName = 'Unknown Component') => {
    const renderCountRef = useRef(0);
    const windowStartRef = useRef(Date.now());
    const lastWarningRef = useRef(0);
    const [isBlocked, setIsBlocked] = useState(false);

    useEffect(() => {
        const now = Date.now();
        const timeSinceWindowStart = now - windowStartRef.current;

        // Reset counter if monitoring window has passed
        if (timeSinceWindowStart >= MONITORING_WINDOW) {
            renderCountRef.current = 0;
            windowStartRef.current = now;
            if (isBlocked) {
                console.log(`[RenderProtection] ${componentName}: Unblocking after cooldown`);
                setIsBlocked(false);
            }
        }

        renderCountRef.current++;
        const rendersPerSecond = (renderCountRef.current / timeSinceWindowStart) * 1000;

        // Warning threshold
        if (rendersPerSecond > WARNING_RENDERS_PER_SECOND &&
            now - lastWarningRef.current > 5000) {
            console.warn(
                `[RenderProtection] ${componentName}: High render rate detected (${rendersPerSecond.toFixed(1)} renders/sec). ` +
                `Current count: ${renderCountRef.current} in ${timeSinceWindowStart}ms`,
            );
            lastWarningRef.current = now;
        }

        // Block threshold
        if (rendersPerSecond > MAX_RENDERS_PER_SECOND && !isBlocked) {
            console.error(
                `[RenderProtection] ${componentName}: BLOCKING due to excessive renders (${rendersPerSecond.toFixed(1)} renders/sec). ` +
                `Component will be blocked for ${MONITORING_WINDOW}ms to prevent infinite loops.`,
            );
            setIsBlocked(true);

            // Force a cooldown period
            setTimeout(() => {
                renderCountRef.current = 0;
                windowStartRef.current = Date.now();
                setIsBlocked(false);
                console.log(`[RenderProtection] ${componentName}: Cooldown complete, component unblocked`);
            }, MONITORING_WINDOW);
        }
    });

    return {
        isBlocked,
        renderCount: renderCountRef.current,
        rendersInWindow: renderCountRef.current,
    };
};

// HOC version
export const withRenderProtection = (WrappedComponent, componentName) => {
    return function ProtectedComponent(props) {
        const { isBlocked } = useRenderProtection(componentName || WrappedComponent.name);

        if (isBlocked) {
            return (
                <div style={{
                    padding: '20px',
                    border: '2px solid #ff6b6b',
                    borderRadius: '8px',
                    backgroundColor: '#ffe0e0',
                    textAlign: 'center',
                    margin: '10px',
                }}>
                    <h4 style={{ color: '#d63031', margin: '0 0 10px 0' }}>
                        🚨 Render Loop Protection
                    </h4>
                    <p style={{ margin: '0', color: '#636e72' }}>
                        Component "{componentName || WrappedComponent.name}" was temporarily blocked due to excessive
                        re-renders.
                        <br />
                        This prevents browser freeze. The component will resume shortly.
                    </p>
                </div>
            );
        }

        return <WrappedComponent {...props} />;
    };
};