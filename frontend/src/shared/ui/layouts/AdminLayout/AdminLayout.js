// frontend/src/shared/ui/layouts/AdminLayout/AdminLayout.js
import React, {useState, useEffect} from 'react';
import {Outlet} from 'react-router-dom';
import {
    Container,
    Navbar,
    Nav,
    Dropdown,
    Button,
    Badge
} from 'react-bootstrap';
import {useNavigate, useLocation, Link} from 'react-router-dom';
import {useDispatch, useSelector} from 'react-redux';
import {useMediaQuery} from 'shared/hooks/useMediaQuery';
import {logout} from 'features/auth/model/authSlice';
import {LanguageSwitch} from '../../components/LanguageSwitch/LanguageSwitch';
import {useI18n} from "shared/lib/i18n/i18nProvider";

import GlobalAlerts from 'shared/ui/components/GlobalAlerts/GlobalAlerts';
import ThemeToggle from 'shared/ui/components/ThemeToggle/ThemeToggle';
import {setActiveTab, setSelectedScheduleId} from 'features/admin-schedule-management/model/scheduleSlice';
import {fetchAllRequests} from 'features/admin-permanent-requests/model/adminRequestsSlice';
import './AdminLayout.css';

const AdminLayout = () => {
    const {t} = useI18n();
    const navigate = useNavigate();
    const location = useLocation();
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1592);
    const dispatch = useDispatch();
    const {pendingCount} = useSelector(state => state.adminRequests);


    useEffect(() => {
        // Загружаем счетчик запросов для админа
        dispatch(fetchAllRequests());
    }, [dispatch]);

    const handleLogout = () => {
        dispatch(logout()); // Диспатчим экшен
        navigate('/login'); // Перенаправляем на логин
    };
    // Отслеживание размера экрана
    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 1592;
            setIsMobile(mobile);
            if (!mobile) {
                setShowMobileMenu(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (showMobileMenu) {
            document.body.classList.add('mobile-sidebar-open');
        } else {
            document.body.classList.remove('mobile-sidebar-open');
        }

        // Cleanup
        return () => {
            document.body.classList.remove('mobile-sidebar-open');
        };
    }, [showMobileMenu]);


    const navigationItems = [
        {
            key: 'dashboard',
            label: t('navigation.dashboard'),
            icon: 'speedometer2',
            path: '/admin',
            badge: null
        },
        {
            key: 'schedules',
            label: t('navigation.schedules'),
            icon: 'calendar-week',
            path: '/admin/schedules',
            badge: 'New'
        },
        {
            key: 'algorithms',
            label: t('navigation.algorithms'),
            icon: 'cpu-fill',
            path: '/admin/algorithms',
            badge: null
        },
        {
            key: 'employees',
            label: t('navigation.employees'),
            icon: 'people-fill',
            path: '/admin/employees',
            badge: null
        },
        {
            key: 'workplace',
            label: t('navigation.workplace'),
            icon: 'building',
            path: '/admin/workplace',
            badge: null
        },
        {
            key: 'reports',
            label: t('navigation.reports'),
            icon: 'graph-up-arrow',
            path: '/admin/reports',
            badge: null
        },
        {
            key: 'requests',
            label: t('navigation.requests'),
            icon: 'clipboard-check',
            path: '/admin/permanent-requests',
            badge: pendingCount > 0 ? pendingCount : null
        },
    ];

    const currentPath = location.pathname;
    const isActive = (path) => {
        // Для дашборда '/admin' требуется точное совпадение
        if (path === '/admin') {
            return currentPath === '/admin';
        }
        // Для всех остальных страниц - проверка на startsWith
        return currentPath.startsWith(path);
    };

    // Обновленная функция закрытия
    const handleCloseMobileMenu = () => {
        setIsClosing(true);
        setTimeout(() => {
            setShowMobileMenu(false);
            setIsClosing(false);
        }, 300); // Время анимации
    };

// Обновленная функция навигации
    const handleNavigation = (path) => {
        if (path === '/admin/schedules') {
            dispatch(setActiveTab('overview'));
            dispatch(setSelectedScheduleId(null));
        }
        navigate(path);
        if (isMobile) {
            handleCloseMobileMenu(); // Используем новую функцию
        }
    };


    const SidebarContent = () => (
        <Nav className="flex-column admin-nav">
            {navigationItems.map(item => (
                <Nav.Item key={item.key}>
                    {/* ИЗМЕНЕНИЕ: используем Link вместо Nav.Link с onClick */}
                    <Nav.Link
                        as={Link}
                        to={item.path}
                        className={`admin-nav-link ${isActive(item.path) ? 'active' : ''}`}
                        onClick={(e) => {
                            e.preventDefault(); // Prevent default Link behavior
                            handleNavigation(item.path);
                        }}
                    >
                        <i className={`bi bi-${item.icon} nav-icon `}></i>
                        <span
                            className="flex-grow-1">{item.label}</span> {/* me-auto прижмет текст влево, а остальное вправо */}
                        {item.badge && <Badge bg="primary">{item.badge}</Badge>}
                    </Nav.Link>
                </Nav.Item>
            ))}
        </Nav>
    );

    return (
        <div className="admin-layout">
            {/* Top Navigation Bar */}
            <Navbar className="admin-navbar shadow-sm sticky-top">
                <Container fluid className="px-3">

                    <div className="d-flex align-items-center">
                        {/* Mobile Menu Toggle */}
                        {isMobile && (
                            <Button
                                variant="outline-secondary"
                                size="sm"
                                className={`me-3 mobile-menu-btn ${showMobileMenu ? 'active' : ''}`}
                                onClick={() => showMobileMenu ? handleCloseMobileMenu() : setShowMobileMenu(true)}
                            >
                                <i className="bi bi-list"></i>
                            </Button>
                        )}

                        {/* Brand */}
                        <Navbar
                            as={Link}
                            to="/admin"
                            className="brand-logo mb-0"
                            onClick={(e) => {
                                // Предотвращаем стандартное действие Link, чтобы полностью контролировать навигацию
                                e.preventDefault();
                                // Используем вашу готовую функцию навигации для '/admin'
                                handleNavigation('/admin');
                            }}
                        >
                            <i className="bi bi-calendar-check-fill text-primary me-2"></i>
                                <span className="brand-text">{t('common.appName')}</span>
                                <Badge bg="secondary" className=" ms-2 brand-badge">{t('common.admin')}</Badge>
                        </Navbar>

                    </div>


                    {/* Right side - User menu */}
                    <div className="d-flex align-items-center gap-2">
                        <ThemeToggle variant="icon"/>
                        <LanguageSwitch/>

                        <Dropdown align="end" className='ms-1'>
                            <Dropdown.Toggle
                                className="user-dropdown-btn border-0 shadow-sm"
                                id="user-dropdown"
                            >
                                <div className="d-flex align-items-center">
                                    <div className="user-avatar mt-3">
                                        <i className="bi bi-person-circle"></i>
                                    </div>
                                </div>
                            </Dropdown.Toggle>

                            <Dropdown.Menu className="user-dropdown-menu shadow">
                                <Dropdown.Header>
                                    <div className="text-muted small">{t('auth.signedInAs')}</div>
                                    <div className="fw-semibold">{t('common.admin')}</div>
                                </Dropdown.Header>
                                <Dropdown.Divider/>
                                <Dropdown.Item>
                                    <i className="bi bi-person me-2"></i>
                                    {t('common.profile')}
                                </Dropdown.Item>
                                <Dropdown.Item>
                                    <i className="bi bi-gear me-2"></i>
                                    {t('common.settings')}
                                </Dropdown.Item>
                                <Dropdown.Divider/>
                                <Dropdown.Item onClick={handleLogout} className="text-danger">
                                    <i className="bi bi-box-arrow-right me-2"></i>
                                    {t('auth.logout')}
                                </Dropdown.Item>
                            </Dropdown.Menu>
                        </Dropdown>
                    </div>
                </Container>
            </Navbar>

            {/* Main Container  */}
            <div className="admin-main-container">
                {/* Desktop Sidebar */}
                {!isMobile && (
                    <div className="admin-sidebar-desktop">
                        <div className="sidebar-content">
                            <div className="sidebar-header">
                                <h6 className="sidebar-title text-muted text-uppercase small fw-bold px-3 mb-3">
                                    {t('navigation.title')}
                                </h6>
                            </div>
                            <SidebarContent/>
                        </div>
                    </div>
                )}

                {/* Main Content Area */}
                <div className="admin-content-area">
                    <main className="admin-main-content">
                        <Outlet/>
                    </main>
                </div>
            </div>

            {/* Mobile Sidebar (Offcanvas) */}
            {showMobileMenu && (
                <>
                    {/* Overlay */}
                    <div
                        className={`mobile-sidebar-overlay ${isClosing ? 'closing' : ''}`}
                        onClick={handleCloseMobileMenu}
                    />

                    {/* Sidebar */}
                    <div className={`mobile-sidebar ${isClosing ? 'closing' : ''}`}>
                        <div className="mobile-sidebar-content">
                            <div className="sidebar-header">
                                <h6 className="sidebar-title text-muted text-uppercase small fw-bold px-3 mb-3 mt-3">
                                    {t('navigation.title')}
                                </h6>
                            </div>
                            <SidebarContent/>
                        </div>
                    </div>
                </>
            )}
            <GlobalAlerts/>
        </div>
    );
};

export default AdminLayout;