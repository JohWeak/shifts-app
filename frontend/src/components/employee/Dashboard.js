// frontend/src/components/employee/Dashboard.js
import './Dashboard.css';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ConstraintsList from './constraints/ConstraintsList';
import CreateConstraint from './constraints/CreateConstraint';
import WeeklySchedule from './schedule/WeeklySchedule';

const EmployeeDashboard = () => {
    const [activeTab, setActiveTab] = useState('schedule'); // CHANGED: Make schedule first tab
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        // Get user info from localStorage
        const userData = localStorage.getItem('user');
        if (userData) {
            const parsedUser = JSON.parse(userData);
            setUser(parsedUser);

            // Redirect if user is admin
            if (parsedUser.role === 'admin') {
                navigate('/admin/dashboard');
            }
        } else {
            navigate('/login');
        }
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    if (!user) {
        return <div className="loading">Loading...</div>;
    }

    return (
        <div className="employee-dashboard">
            {/* Header */}
            <header className="dashboard-header">
                <div className="header-content">
                    <h1>Shifts - Employee Portal</h1>
                    <div className="user-info">
                        <span className="welcome-text">Welcome, {user.name}</span>
                        <button onClick={handleLogout} className="logout-btn">
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            {/* Navigation Tabs */}
            <nav className="dashboard-nav">
                {/* CHANGED: Schedule is now the first tab */}
                <button
                    className={`nav-tab ${activeTab === 'schedule' ? 'active' : ''}`}
                    onClick={() => setActiveTab('schedule')}
                >
                    My Schedule
                </button>
                <button
                    className={`nav-tab ${activeTab === 'constraints' ? 'active' : ''}`}
                    onClick={() => setActiveTab('constraints')}
                >
                    My Constraints
                </button>
                <button
                    className={`nav-tab ${activeTab === 'create' ? 'active' : ''}`}
                    onClick={() => setActiveTab('create')}
                >
                    Create Constraint
                </button>
            </nav>

            {/* Content */}
            <main className="dashboard-content">
                {/* CHANGED: Schedule tab now renders the WeeklySchedule component */}
                {activeTab === 'schedule' && (
                    <WeeklySchedule />
                )}
                {activeTab === 'constraints' && (
                    <ConstraintsList userId={user.id} />
                )}
                {activeTab === 'create' && (
                    <CreateConstraint
                        userId={user.id}
                        onConstraintCreated={() => setActiveTab('constraints')}
                    />
                )}
            </main>
        </div>
    );
};

export default EmployeeDashboard;