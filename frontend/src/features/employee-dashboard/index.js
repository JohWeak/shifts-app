// frontend/src/features/employee-dashboard/weeklySchedule.js
import React, {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {useDispatch, useSelector} from 'react-redux';
import {Dropdown} from 'react-bootstrap';
import {useSwipeable} from 'react-swipeable';
import {useI18n} from '../../shared/lib/i18n/i18nProvider';
import {LanguageSwitch} from '../../shared/ui/LanguageSwitch/LanguageSwitch';
// Импортируем фичи, которые используются на дашборде
import WeeklySchedule from '../employee-schedule';
import ConstraintsSchedule from '../employee-constraints';
import {logout} from '../../app/store/slices/authSlice';

// Стили теперь будут в этой же папке
import './index.css';

const EmployeeDashboard = () => {
    const {t} = useI18n();

    const [activeTab, setActiveTab] = useState('schedule');
    const [showUserMenu, setShowUserMenu] = useState(false);

    const navigate = useNavigate();
    const dispatch = useDispatch();

    // Получаем пользователя из Redux, а не из localStorage
    const {user} = useSelector(state => state.auth);

    //const tabs = ['schedule', 'constraints', 'permanent-requests'];
    const handlers = useSwipeable({ /* ... ваш код handlers ... */});

    const handleLogout = () => {
        dispatch(logout());
        navigate('/login', {replace: true});
    };

    if (!user) {
        // Такое может быть на мгновение, пока стейт не обновился
        return <div className="loading">{t('common.loading')}</div>;
    }

    return (
        <div className="employee-dashboard">
            <header className="dashboard-header">
                <div className="header-content">
                    <h1>{t('common.appName')}</h1>
                    <div className="user-info">
                        <span className="welcome-text">{t('auth.welcome')}, {user.name}</span>
                        <div className="header-actions">
                            <LanguageSwitch/>
                            <Dropdown show={showUserMenu} onToggle={setShowUserMenu} className="user-dropdown"
                                      align="end">
                                <Dropdown.Toggle variant="outline-light" id="user-dropdown" className="user-btn">
                                    <i className="bi bi-person-circle"></i>
                                </Dropdown.Toggle>
                                <Dropdown.Menu>
                                    <Dropdown.Header>
                                        <strong>{user.name}</strong>
                                        <small className="text-muted d-block">ID: {user.id}</small>
                                    </Dropdown.Header>
                                    <Dropdown.Divider/>
                                    <Dropdown.Item onClick={() => { /* Navigate to settings */
                                    }}>
                                        <i className="bi bi-gear me-2"></i>{t('common.settings')}
                                    </Dropdown.Item>
                                    <Dropdown.Divider/>
                                    <Dropdown.Item onClick={handleLogout} className="text-danger">
                                        <i className="bi bi-box-arrow-right me-2"></i>י{t('auth.logout')}
                                    </Dropdown.Item>
                                </Dropdown.Menu>
                            </Dropdown>
                        </div>
                    </div>
                </div>
            </header>

            {/* Navigation Tabs - Mobile Version */}
            <nav className="dashboard-nav">
                <div className="nav-tabs-mobile d-md-none">
                    <button
                        className={`nav-tab ${activeTab === 'schedule' ? 'active' : ''}`}
                        onClick={() => setActiveTab('schedule')}
                    >
                        <i className="bi bi-calendar-week"></i>
                    </button>
                    <button
                        className={`nav-tab ${activeTab === 'constraints' ? 'active' : ''}`}
                        onClick={() => setActiveTab('constraints')}
                    >
                        <i className="bi bi-clock-history"></i>
                    </button>
                    <button
                        className={`nav-tab ${activeTab === 'permanent-requests' ? 'active' : ''}`}
                        onClick={() => setActiveTab('permanent-requests')}
                    >
                        <i className="bi bi-file-earmark-text"></i>
                    </button>
                </div>

                {/* Desktop Navigation */}
                <div className="d-none d-md-flex w-100">
                    <button
                        className={`nav-tab ${activeTab === 'schedule' ? 'active' : ''}`}
                        onClick={() => setActiveTab('schedule')}
                    >
                        <i className="bi bi-calendar-week me-1"></i>
                        <span className="tab-name">{t('schedule.scheduleDetails')}</span>
                    </button>
                    <button
                        className={`nav-tab ${activeTab === 'constraints' ? 'active' : ''}`}
                        onClick={() => setActiveTab('constraints')}
                    >
                        <i className="bi bi-clock-history me-1"></i>
                        <span className="tab-name">{t('employee.setConstraints')}</span>
                    </button>
                    <button
                        className={`nav-tab ${activeTab === 'permanent-requests' ? 'active' : ''}`}
                        onClick={() => setActiveTab('permanent-requests')}
                    >
                        <i className="bi bi-file-earmark-text me-1"></i>
                        <span className="tab-name">{t('employee.requests.permanent')}</span>
                    </button>
                </div>
            </nav>
            {/* Content */}
            <main className="dashboard-content" {...handlers}>
                {/* Tab 1: Current and Next Week Schedule */}
                {activeTab === 'schedule' && (
                    <div className="tab-content">
                        <WeeklySchedule/>
                    </div>
                )}

                {/* Tab 2: Set Constraints for Next Week */}
                {activeTab === 'constraints' && (
                    <div className="tab-content">
                        <ConstraintsSchedule/>
                    </div>
                )}

                {/* Tab 3: Permanent Requests (Coming Soon) */}
                {activeTab === 'permanent-requests' && (
                    <div className="tab-content">
                        <div className="coming-soon">
                            <div className="text-center">
                                <i className="bi bi-tools display-1 text-muted mb-3"></i>
                                <h2>Permanent Requests</h2>
                                <p className="text-muted">
                                    This section will allow you to request permanent schedule changes.
                                    <br/>
                                    Coming soon...
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};
export default EmployeeDashboard;

