import './CreateConstraint.css';import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ConstraintForm from './ConstraintForm';

const CreateConstraint = ({ userId, onConstraintCreated }) => {
    const [shifts, setShifts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchShifts();
    }, []);

    const fetchShifts = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                'http://localhost:5000/api/shifts',
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            setShifts(response.data);
        } catch (err) {
            console.error('Error fetching shifts:', err);
        }
    };

    const handleSubmit = async (formData) => {
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                'http://localhost:5000/api/constraints',
                {
                    ...formData,
                    emp_id: userId
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            setSuccess('Constraint created successfully!');
            setTimeout(() => {
                onConstraintCreated();
            }, 1500);

        } catch (err) {
            setError(err.response?.data?.message || 'Error creating constraint');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="create-constraint">
            <h2>Create New Constraint</h2>

            <div className="info-section">
                <h3>Constraint Types:</h3>
                <ul className="constraint-types-info">
                    <li><strong>Cannot Work:</strong> Days/shifts you're unavailable</li>
                    <li><strong>Prefer Work:</strong> Days/shifts you'd like to work</li>
                    <li><strong>Neutral:</strong> Days/shifts you can work (default)</li>
                </ul>

                <div className="priority-info">
                    <h4>Priority Levels:</h4>
                    <p><strong>1-3:</strong> Low priority (nice to have)</p>
                    <p><strong>4-6:</strong> Medium priority (preferred)</p>
                    <p><strong>7-8:</strong> High priority (important)</p>
                    <p><strong>9-10:</strong> Critical priority (essential)</p>
                </div>
            </div>

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <ConstraintForm
                onSubmit={handleSubmit}
                shifts={shifts}
                loading={loading}
            />
        </div>
    );
};

export default CreateConstraint;