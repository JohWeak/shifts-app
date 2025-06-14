// frontend/src/CompareAlgorithmsModal.js/admin/schedule/NoPositionsMessage.js
import React from 'react';
import { useMessages } from '../lib/i18n/messages';

const NoPositionsMessage = () => {
    const messages = useMessages('en');

    return (
        <div className="text-center text-muted py-5">
            <i className="bi bi-person-workspace fs-1 mb-3 d-block"></i>
            <h5>{messages.NO_POSITIONS}</h5>
            <p className="text-muted">
                This schedule doesn't have any position assignments yet.
            </p>
        </div>
    );
};

export default NoPositionsMessage;