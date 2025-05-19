import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                // Retrieving a token from localStorage
                const token = localStorage.getItem('token');

                if (!token) {
                    navigate('/login');
                    return;
                }

                // Header configuration
                const config = {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                };

                // Employee list request
                const response = await axios.get('http://localhost:5000/api/employees', config);
                setEmployees(response.data);
                setLoading(false);
            } catch (err) {
                setError(err.response?.data?.message || 'Error fetching employees');
                setLoading(false);

                // If there is an authorization error, redirect to the login page.
                if (err.response?.status === 401 || err.response?.status === 403) {
                    navigate('/login');
                }
            }
        };

        fetchEmployees();
    }, [navigate]);

    // Log out function
    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div className="admin-dashboard">
            <h1>Admin Dashboard</h1>
            <button onClick={handleLogout} className="logout-btn">Logout</button>

            <h2>Employees</h2>
            {employees.length === 0 ? (
                <p>No employees found</p>
            ) : (
                <table className="employee-table">
                    <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {employees.map(employee => (
                        <tr key={employee.emp_id}>
                            <td>{employee.emp_id}</td>
                            <td>{`${employee.first_name} ${employee.last_name}`}</td>
                            <td>{employee.email}</td>
                            <td>{employee.status}</td>
                            <td>
                                <button>Edit</button>
                                <button>Delete</button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            )}

            <div className="action-buttons">
                <button>Add Employee</button>
                <button>Create Schedule</button>
                <button>Manage Positions</button>
            </div>
        </div>
    );
};

export default AdminDashboard;