import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css';

export const Login = () => {
    // This state will hold either the username or the email entered by the user
    const [identifier, setIdentifier] = useState(''); // 'identifier' can be username or email
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handlePasswordToggle = () => {
        setShowPassword(!showPassword);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); // Reset previous errors

        try {
            // Send the login request to the API
            // The 'login' field sent to the backend will contain either the username or email
            const response = await axios.post('http://localhost:5000/api/auth/login', {
                login: identifier, // Send the 'identifier' (username or email) as 'login'
                password
            });

            // Store token and user data in localStorage
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify({
                id: response.data.id,
                name: response.data.name,
                role: response.data.role
                // Add any other user data you receive and need
            }));

            // Redirect based on user role
            if (response.data.role === 'admin') {
                navigate('/admin');
            } else {
                navigate('/employee/dashboard');
            }
        } catch (err) {
            // Display error message
            setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
            console.error("Login error:", err.response || err.message || err); // Log more detailed error
        }
    };

    return (
        <div className="login-page-container">
            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-lg-5 col-md-7 col-sm-9">
                        <div className="card login-card p-4">
                            <div className="card-body">
                                <div className="text-center mb-4">
                                    <h3 className="card-title fw-bold">Login to Shifts App</h3>
                                    <p className="text-muted">Welcome back!</p>
                                </div>

                                {error && (
                                    <div className="alert alert-danger" role="alert">
                                        {error}
                                    </div>
                                )}

                                <form id="loginForm" onSubmit={handleSubmit}>
                                    {/* Input field for Username or Email */}
                                    <div className="form-floating mb-3">
                                        <input
                                            type="text" // Changed from "email" to "text" to allow non-email usernames
                                            className="form-control"
                                            id="identifier" // Changed id to match state variable
                                            name="identifier" // Name attribute for form handling (and potentially accessibility)
                                            placeholder="Username or Email" // Updated placeholder
                                            value={identifier}
                                            onChange={(e) => setIdentifier(e.target.value)}
                                            required
                                            autoComplete="username" // 'username' is a common value that browsers use for login/email fields
                                        />
                                        <label htmlFor="identifier">Username or Email</label> {/* Updated label */}
                                    </div>

                                    {/* Password field */}
                                    <div className="input-group mb-3">
                                        <div className="form-floating flex-grow-1">
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                className="form-control"
                                                id="password"
                                                name="password"
                                                placeholder="Password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required
                                                autoComplete="current-password"
                                            />
                                            <label htmlFor="password">Password</label>
                                        </div>
                                        <button
                                            className="btn btn-outline-secondary btn-toggle-password"
                                            type="button"
                                            id="togglePassword"
                                            onClick={handlePasswordToggle}
                                            title={showPassword ? "Hide password" : "Show password"}
                                        >
                                            <i className={showPassword ? "bi bi-eye" : "bi bi-eye-slash"}></i>
                                        </button>
                                    </div>

                                    <div className="d-flex justify-content-end align-items-center mb-3">
                                        <a href="#" className="text-decoration-none small">Forgot password?</a>
                                    </div>

                                    <button type="submit" className="btn btn-primary w-100 py-2 fw-semibold">
                                        Login
                                    </button>

                                    <hr className="my-4" />

                                    <div className="text-center biometric-placeholder">
                                        <p className="mb-1">Soon: Sign in with Face ID / Fingerprint</p>
                                        <i className="bi bi-fingerprint" style={{ fontSize: '1.5rem' }}></i>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;