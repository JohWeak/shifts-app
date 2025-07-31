// frontend/src/shared/ui/components/DebugReduxState.js
import React from 'react';
import { useSelector } from 'react-redux';

const DebugReduxState = () => {
    const requests = useSelector(state => state.requests);
    const auth = useSelector(state => state.auth);

    if (process.env.NODE_ENV !== 'development') return null;

    return (
        <div style={{
            position: 'fixed',
            bottom: 80,
            right: 150,
            background: 'rgba(0,0,0,0.8)',
            color: 'white',
            padding: 10,
            fontSize: 12,
            maxWidth: 500,
            maxHeight: 300,
            overflow: 'auto',
            zIndex: 9999
        }}>
            <h6>Redux State Debug</h6>
            <pre>{JSON.stringify({ requests, auth }, null, 2)}</pre>
        </div>
    );
};

export default DebugReduxState;