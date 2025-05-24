import './ConstraintsList.css';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ConstraintCard from './ConstraintCard';

const ConstraintsList = ({ userId }) => {
    const [constraints, setConstraints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        fetchConstraints();
    }, [userId]);

    const fetchConstraints = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `http://localhost:5000/api/constraints/employee/${userId}`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            setConstraints(response.data);
            setLoading(false);
        } catch (err) {
            setError(err.response?.data?.message || 'Error fetching constraints');
            setLoading(false);
        }
    };

    const handleDeleteConstraint = async (constraintId) => {
        if (!window.confirm('Are you sure you want to delete this constraint?')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            await axios.delete(
                `http://localhost:5000/api/constraints/${constraintId}`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            // Refresh the list
            fetchConstraints();
        } catch (err) {
            setError(err.response?.data?.message || 'Error deleting constraint');
        }
    };

    const filteredConstraints = constraints.filter(constraint => {
        if (filter === 'all') return true;
        if (filter === 'pending') return constraint.status === 'pending';
        if (filter === 'approved') return constraint.status === 'approved';
        if (filter === 'permanent') return constraint.is_permanent;
        if (filter === 'temporary') return !constraint.is_permanent;
        return true;
    });

    if (loading) return <div className="loading">Loading constraints...</div>;

    return (
        <div className="constraints-list">
            <div className="list-header">
                <h2>My Constraints</h2>
                <div className="filters">
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="filter-select"
                    >
                        <option value="all">All Constraints</option>
                        <option value="pending">Pending Approval</option>
                        <option value="approved">Approved</option>
                        <option value="permanent">Permanent</option>
                        <option value="temporary">Temporary</option>
                    </select>
                </div>
            </div>

            {error && <div className="error-message">{error}</div>}

            {filteredConstraints.length === 0 ? (
                <div className="no-constraints">
                    <p>No constraints found.</p>
                    <p>Click "Create Constraint" to add your preferences.</p>
                </div>
            ) : (
                <div className="constraints-grid">
                    {filteredConstraints.map(constraint => (
                        <ConstraintCard
                            key={constraint.id}
                            constraint={constraint}
                            onDelete={handleDeleteConstraint}
                            canEdit={!constraint.is_permanent && constraint.status !== 'pending'}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default ConstraintsList;