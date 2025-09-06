// frontend/src/shared/hooks/useRenderTracker.js
import { useEffect, useRef } from 'react';

export const useRenderTracker = (componentName, logProps = false) => {
    const renderCount = useRef(0);
    const propsRef = useRef();

    // Only log in development
    if (process.env.NODE_ENV === 'development') {
        renderCount.current++;

        // eslint-disable-next-line react-hooks/rules-of-hooks
        useEffect(() => {
            console.log(`[RenderTracker] ${componentName} rendered ${renderCount.current} times`);

            if (logProps && propsRef.current) {
                const currentProps = JSON.stringify(propsRef.current, null, 2);
                console.log(`[RenderTracker] ${componentName} props:`, currentProps);
            }
        });
    }

    return {
        renderCount: renderCount.current,
        setProps: (props) => {
            if (process.env.NODE_ENV === 'development') {
                propsRef.current = props;
            }
        },
    };
};