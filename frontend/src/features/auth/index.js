// frontend/src/features/auth/weeklySchedule.js
import React, {useState, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import {useDispatch, useSelector} from 'react-redux';
import {login} from './model/authSlice'; // Импортируем наш Thunk
import {Spinner} from 'react-bootstrap';
import {useI18n} from 'shared/lib/i18n/i18nProvider';
import './index.css';
import {LanguageSwitch} from "../../shared/ui/components/LanguageSwitch/LanguageSwitch";
import ThemeToggle from "../../shared/ui/components/ThemeToggle/ThemeToggle";

const Login = () => {
    const {t} = useI18n();

    // Локальное состояние для полей формы
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const navigate = useNavigate();
    const dispatch = useDispatch();

    // Получаем состояние аутентификации из Redux
    const {loading, error, isAuthenticated, user} = useSelector((state) => state.auth);

    const handlePasswordToggle = () => {
        setShowPassword(!showPassword);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Диспатчим экшен `login`, передавая данные из формы
        dispatch(login({login: identifier, password}));
    };

    // Эффект для редиректа после успешного входа
    useEffect(() => {
        if (isAuthenticated && user) {
            const redirectPath = user.role === 'admin' ? '/admin' : '/employee/schedule';
            navigate(redirectPath, {replace: true});
        }
    }, [isAuthenticated, user, navigate]);

    return (
        <div className="auth-container">

            <div className="auth-card">

                <div className="auth-header">
                    <h2>{t('auth.login')}</h2>
                    <p>{t('auth.welcome')}</p>

                </div>

                <div className="auth-body">
                    {/* Показываем ошибку из Redux store */}
                    {error && (
                        <div className="alert alert-danger" role="alert">
                            <i className="bi bi-exclamation-triangle me-2"></i>
                            {error}
                        </div>
                    )}

                    <form className="auth-form" onSubmit={handleSubmit}>
                        <div className="mb-3">
                            <label htmlFor="identifier" className="form-label">
                                {t('auth.username')}
                            </label>
                            <input
                                type="text"
                                className="form-control"
                                id="identifier"
                                placeholder="Enter username or email"
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                required
                                autoComplete="username"
                            />
                        </div>

                        <div className="mb-3">
                            <label htmlFor="password" className="form-label">
                                {t('auth.password')}
                            </label>
                            <div className="input-group">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    className="form-control"
                                    id="password"
                                    placeholder="Enter password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    autoComplete="current-password"
                                />
                                <button
                                    className="btn btn-outline-secondary password-toggle"
                                    type="button"
                                    onClick={handlePasswordToggle}
                                    title={showPassword ? "Hide password" : "Show password"}
                                >
                                    <i className={`bi bi-${showPassword ? 'eye' : 'eye-slash'}`}></i>
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary auth-submit"
                            disabled={loading === 'pending'}
                        >
                            {loading === 'pending' ? (
                                <>
                                    <Spinner
                                        as="span"
                                        animation="border"
                                        size="sm"
                                        role="status"
                                        aria-hidden="true"
                                        className="me-2"
                                    />
                                    {t('login.loggingIn')}
                                </>
                            ) : (
                                t('auth.login')
                            )}
                        </button>
                    </form>

                    {/* Loading overlay */}
                    {loading === 'pending' && (
                        <div className="auth-loading">
                            <Spinner animation="border" variant="primary"/>
                        </div>
                    )}
                </div>

                <div className="auth-footer">

                    <div className="biometric-placeholder">
                        <p className="mb-2 text-muted">
                            <i className="bi bi-fingerprint me-2" style={{fontSize: '1.5rem'}}></i>
                            Soon: Sign in with Face ID / Fingerprint
                        </p>
                    </div>
                    {/* Контролы в углу */}
                    <div className="auth-controls">
                        <ThemeToggle variant="icon" />
                        <LanguageSwitch />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;

