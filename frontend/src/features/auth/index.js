// frontend/src/features/auth/weeklySchedule.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { login } from '../../app/store/slices/authSlice'; // Импортируем наш Thunk
import './index.css';
import { Spinner } from 'react-bootstrap';
import { useI18n } from '../../shared/lib/i18n/i18nProvider';


const Login = () => {
    const { t } = useI18n();

    // Локальное состояние для полей формы
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const navigate = useNavigate();
    const dispatch = useDispatch();

    // Получаем состояние аутентификации из Redux
    const { loading, error, isAuthenticated, user } = useSelector((state) => state.auth);

    const handlePasswordToggle = () => {
        setShowPassword(!showPassword);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Диспатчим экшен `login`, передавая данные из формы
        dispatch(login({ login: identifier, password }));
    };

    // Эффект для редиректа после успешного входа
    useEffect(() => {
        if (isAuthenticated && user) {
            const redirectPath = user.role === 'admin' ? '/admin' : '/employee/dashboard';
            navigate(redirectPath, { replace: true });
        }
    }, [isAuthenticated, user, navigate]);

    return (
        <div className="login-page-container">
            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-lg-5 col-md-7 col-sm-9">
                        <div className="card login-card p-4">
                            <div className="card-body">
                                <div className="text-center mb-4">
                                    <h3 className="card-title fw-bold">{t('auth.login')}</h3>
                                    <p className="text-muted">{t('auth.welcome')}</p>
                                </div>

                                {/* Показываем ошибку из Redux store */}
                                {error && (
                                    <div className="alert alert-danger" role="alert">
                                        {error}
                                    </div>
                                )}

                                <form id="loginForm" onSubmit={handleSubmit}>
                                    <div className="form-floating mb-3">
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="identifier"
                                            placeholder="Username or Email"
                                            value={identifier}
                                            onChange={(e) => setIdentifier(e.target.value)}
                                            required
                                            autoComplete="username"
                                        />
                                        <label htmlFor="identifier">{t('auth.username')} </label>
                                    </div>

                                    <div className="input-group mb-3">
                                        <div className="form-floating flex-grow-1">
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                className="form-control"
                                                id="password"
                                                placeholder="Password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required
                                                autoComplete="current-password"
                                            />
                                            <label htmlFor="password">{t('auth.password')}</label>
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

                                    <button
                                        type="submit"
                                        className="btn btn-primary w-100 py-2 fw-semibold"
                                        disabled={loading === 'pending'} // Блокируем кнопку во время загрузки
                                    >
                                        {loading === 'pending' ? (
                                            <>
                                                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                                                <span className="ms-2">{t('login.loggingIn')}</span>
                                            </>
                                        ) : (
                                            'Login'
                                        )}
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

