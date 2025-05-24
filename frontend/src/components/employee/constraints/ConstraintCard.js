import './ConstraintCard.css';
import React from 'react';

const ConstraintCard = ({ constraint, onDelete, canEdit }) => {
    const getTypeDisplay = (type) => {
        switch (type) {
            case 'cannot_work': return { text: 'Cannot Work', color: 'red' };
            case 'prefer_work': return { text: 'Prefer Work', color: 'green' };
            case 'neutral': return { text: 'Neutral', color: 'gray' };
            case 'permanent_schedule': return { text: 'Permanent Schedule', color: 'blue' };
            default: return { text: type, color: 'gray' };
        }
    };

    const getStatusDisplay = (status) => {
        switch (status) {
            case 'pending': return { text: 'Pending Approval', color: 'orange' };
            case 'approved': return { text: 'Approved', color: 'green' };
            case 'rejected': return { text: 'Rejected', color: 'red' };
            default: return { text: status, color: 'gray' };
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return null;
        return new Date(dateString).toLocaleDateString();
    };

    const typeDisplay = getTypeDisplay(constraint.type);
    const statusDisplay = getStatusDisplay(constraint.status);

    return (
        <div className={`constraint-card ${constraint.is_permanent ? 'permanent' : 'temporary'}`}>
            {/* Header */}
            <div className="card-header">
                <div className="type-badge" style={{ backgroundColor: typeDisplay.color }}>
                    {typeDisplay.text}
                </div>
                <div className="status-badge" style={{ backgroundColor: statusDisplay.color }}>
                    {statusDisplay.text}
                </div>
            </div>

            {/* Content */}
            <div className="card-content">
                {/* Priority */}
                <div className="priority-section">
                    <span className="label">Priority:</span>
                    <div className="priority-bar">
                        <div
                            className="priority-fill"
                            style={{ width: `${(constraint.priority / 10) * 100}%` }}
                        ></div>
                        <span className="priority-number">{constraint.priority}/10</span>
                    </div>
                </div>

                {/* Time Application */}
                <div className="applies-to-section">
                    <span className="label">Applies to:</span>
                    <span className="value">
            {constraint.applies_to === 'specific_date' && (
                <>
                    {formatDate(constraint.start_date)}
                    {constraint.end_date && constraint.end_date !== constraint.start_date
                        ? ` - ${formatDate(constraint.end_date)}`
                        : ''
                    }
                </>
            )}
                        {constraint.applies_to === 'day_of_week' && (
                            <>Every {constraint.day_of_week}</>
                        )}
                        {constraint.applies_to === 'shift_type' && constraint.shift && (
                            <>Shift: {constraint.shift.shift_name}</>
                        )}
          </span>
                </div>

                {/* Reason */}
                {constraint.reason && (
                    <div className="reason-section">
                        <span className="label">Reason:</span>
                        <p className="reason-text">{constraint.reason}</p>
                    </div>
                )}

                {/* Permanent indicator */}
                {constraint.is_permanent && (
                    <div className="permanent-indicator">
                        <span className="permanent-badge">Permanent Constraint</span>
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="card-actions">
                {canEdit && (
                    <button className="edit-btn" onClick={() => {/* TODO: implement edit */}}>
                        Edit
                    </button>
                )}
                {!constraint.is_permanent && (
                    <button
                        className="delete-btn"
                        onClick={() => onDelete(constraint.id)}
                    >
                        Delete
                    </button>
                )}
            </div>
        </div>
    );
};

export default ConstraintCard;