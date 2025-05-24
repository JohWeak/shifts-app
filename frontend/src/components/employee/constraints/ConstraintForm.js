import './ConstraintForm.css';
import React, { useState } from 'react';

const ConstraintForm = ({ onSubmit, shifts, loading }) => {
    const [formData, setFormData] = useState({
        type: 'cannot_work',
        applies_to: 'specific_date',
        start_date: '',
        end_date: '',
        day_of_week: 'sunday',
        shift_id: '',
        priority: 5,
        reason: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Validate form
        if (formData.applies_to === 'specific_date' && !formData.start_date) {
            alert('Please select a start date');
            return;
        }

        if (formData.applies_to === 'shift_type' && !formData.shift_id) {
            alert('Please select a shift');
            return;
        }

        // Clean up data based on applies_to
        const cleanData = { ...formData };

        if (formData.applies_to !== 'specific_date') {
            delete cleanData.start_date;
            delete cleanData.end_date;
        }

        if (formData.applies_to !== 'day_of_week') {
            delete cleanData.day_of_week;
        }

        if (formData.applies_to !== 'shift_type') {
            delete cleanData.shift_id;
        }

        onSubmit(cleanData);
    };

    const resetForm = () => {
        setFormData({
            type: 'cannot_work',
            applies_to: 'specific_date',
            start_date: '',
            end_date: '',
            day_of_week: 'sunday',
            shift_id: '',
            priority: 5,
            reason: ''
        });
    };

    return (
        <form onSubmit={handleSubmit} className="constraint-form">
            {/* Constraint Type */}
            <div className="form-group">
                <label htmlFor="type">Constraint Type *</label>
                <select
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    required
                >
                    <option value="cannot_work">Cannot Work</option>
                    <option value="prefer_work">Prefer to Work</option>
                    <option value="neutral">Neutral</option>
                </select>
            </div>

            {/* Applies To */}
            <div className="form-group">
                <label htmlFor="applies_to">Applies To *</label>
                <select
                    id="applies_to"
                    name="applies_to"
                    value={formData.applies_to}
                    onChange={handleChange}
                    required
                >
                    <option value="specific_date">Specific Date(s)</option>
                    <option value="day_of_week">Day of Week</option>
                    <option value="shift_type">Specific Shift</option>
                </select>
            </div>

            {/* Date Range (if specific_date) */}
            {formData.applies_to === 'specific_date' && (
                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="start_date">Start Date *</label>
                        <input
                            type="date"
                            id="start_date"
                            name="start_date"
                            value={formData.start_date}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="end_date">End Date (optional)</label>
                        <input
                            type="date"
                            id="end_date"
                            name="end_date"
                            value={formData.end_date}
                            onChange={handleChange}
                            min={formData.start_date}
                        />
                    </div>
                </div>
            )}

            {/* Day of Week (if day_of_week) */}
            {formData.applies_to === 'day_of_week' && (
                <div className="form-group">
                    <label htmlFor="day_of_week">Day of Week *</label>
                    <select
                        id="day_of_week"
                        name="day_of_week"
                        value={formData.day_of_week}
                        onChange={handleChange}
                        required
                    >
                        <option value="sunday">Sunday</option>
                        <option value="monday">Monday</option>
                        <option value="tuesday">Tuesday</option>
                        <option value="wednesday">Wednesday</option>
                        <option value="thursday">Thursday</option>
                        <option value="friday">Friday</option>
                        <option value="saturday">Saturday</option>
                    </select>
                </div>
            )}

            {/* Shift Selection (if shift_type) */}
            {formData.applies_to === 'shift_type' && (
                <div className="form-group">
                    <label htmlFor="shift_id">Shift *</label>
                    <select
                        id="shift_id"
                        name="shift_id"
                        value={formData.shift_id}
                        onChange={handleChange}
                        required
                    >
                        <option value="">Select a shift</option>
                        {shifts.map(shift => (
                            <option key={shift.shift_id} value={shift.shift_id}>
                                {shift.shift_name} ({shift.start_time} - {shift.duration}h)
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {/* Priority */}
            <div className="form-group">
                <label htmlFor="priority">Priority (1-10) *</label>
                <div className="priority-input">
                    <input
                        type="range"
                        id="priority"
                        name="priority"
                        min="1"
                        max="10"
                        value={formData.priority}
                        onChange={handleChange}
                        className="priority-slider"
                    />
                    <span className="priority-value">{formData.priority}</span>
                </div>
                <div className="priority-labels">
                    <span>Low (1-3)</span>
                    <span>Medium (4-6)</span>
                    <span>High (7-8)</span>
                    <span>Critical (9-10)</span>
                </div>
            </div>

            {/* Reason */}
            <div className="form-group">
                <label htmlFor="reason">
                    Reason
                    {formData.type === 'cannot_work' && ' (required for permanent requests)'}
                </label>
                <textarea
                    id="reason"
                    name="reason"
                    value={formData.reason}
                    onChange={handleChange}
                    placeholder="Explain why this constraint is needed..."
                    rows="3"
                />
                {formData.type === 'cannot_work' && formData.reason && (
                    <small className="help-text">
                        Constraints with reasons may require admin approval for permanent status.
                    </small>
                )}
            </div>

            {/* Submit Buttons */}
            <div className="form-actions">
                <button
                    type="button"
                    onClick={resetForm}
                    className="reset-btn"
                    disabled={loading}
                >
                    Reset
                </button>
                <button
                    type="submit"
                    className="submit-btn"
                    disabled={loading}
                >
                    {loading ? 'Creating...' : 'Create Constraint'}
                </button>
            </div>
        </form>
    );
};

export default ConstraintForm;