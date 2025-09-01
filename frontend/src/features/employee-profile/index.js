// frontend/src/features/employee-profile/index.js
import React, {useEffect, useRef, useState} from 'react';
import {Alert, Button, Card, Col, Form, FormGroup, Row} from 'react-bootstrap';
import {useDispatch, useSelector} from 'react-redux';
import {useI18n} from 'shared/lib/i18n/i18nProvider';
import PageHeader from 'shared/ui/components/PageHeader';
import {loadProfile, updateProfile} from './model/profileSlice';
import './index.css';

const EmployeeProfile = () => {
    const {t} = useI18n();
    const dispatch = useDispatch();
    const {user, loading, error, success} = useSelector(state => state.profile);

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        username: '',
        country: '',
        city: '',
        address: '',
        receive_schedule_emails: false,
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    const [showPasswordChange, setShowPasswordChange] = useState(false);
    const [countrySearch, setCountrySearch] = useState('');
    const [citySearch, setCitySearch] = useState('');
    const [passwordValidation, setPasswordValidation] = useState('');
    const [showCountryOptions, setShowCountryOptions] = useState(false);
    const [showCityOptions, setShowCityOptions] = useState(false);
    const countryInputRef = useRef(null);
    const cityInputRef = useRef(null);

    // Import location data
    const {locationData, citiesData} = require('shared/utils/locationData');
    const {locale} = useSelector(state => state.i18n) || 'en';

    // Get localized country names
    const localizedCountries = Object.values(locationData[locale]?.countries || locationData.en.countries);
    const cities = {};

    // Build cities object using localized country names
    Object.keys(citiesData).forEach(countryKey => {
        const localizedCountryName = (locationData[locale]?.countries || locationData.en.countries)[countryKey];
        cities[localizedCountryName] = citiesData[countryKey];
    });

    const filteredCountries = localizedCountries.filter(country =>
        countrySearch ? country.toLowerCase().includes(countrySearch.toLowerCase()) : true
    );

    const filteredCities = formData.country ?
        (cities[formData.country] || []).filter(city =>
            citySearch ? city.toLowerCase().includes(citySearch.toLowerCase()) : true
        ) : [];

    useEffect(() => {
        dispatch(loadProfile());
    }, [dispatch]);

    useEffect(() => {
        if (user) {
            setFormData({
                first_name: user.first_name || '',
                last_name: user.last_name || '',
                email: user.email || '',
                phone: user.phone || '',
                username: user.login || '',
                country: user.country || '',
                city: user.city || '',
                address: user.address || '',
                receive_schedule_emails: user.receive_schedule_emails || false,
            });
        }
    }, [user]);

    const handleSubmit = (e) => {
        e.preventDefault();

        // Validate country
        if (formData.country && !localizedCountries.includes(formData.country)) {
            alert(t('profile.invalidCountry'));
            return;
        }

        // Validate city
        if (formData.city && formData.country) {
            const validCities = cities[formData.country] || [];
            if (!validCities.includes(formData.city)) {
                alert(t('profile.invalidCity'));
                return;
            }
        }

        // Send username as login to match backend field naming
        const profileUpdateData = {
            ...formData,
            login: formData.username
        };
        delete profileUpdateData.username;
        dispatch(updateProfile(profileUpdateData));
    };

    const handleChange = (e) => {
        const {name, value, type, checked} = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handlePasswordChange = (e) => {
        const {name, value} = e.target;
        setPasswordData(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    const handlePasswordSubmit = (e) => {
        e.preventDefault();
        setPasswordValidation('');

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setPasswordValidation(t('profile.security.passwordMismatch'));
            return;
        }

        if (passwordData.newPassword.length < 6) {
            setPasswordValidation(t('profile.security.passwordTooShort'));
            return;
        }

        dispatch(updateProfile({
            currentPassword: passwordData.currentPassword,
            newPassword: passwordData.newPassword
        })).then((result) => {
            if (result.type === 'profile/updateProfile/fulfilled') {
                setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: '',
                });
                setShowPasswordChange(false);
            } else if (result.payload && result.payload.includes('Current password is incorrect')) {
                setPasswordValidation(t('profile.security.currentPasswordIncorrect'));
            }
        });
    };

    const handleCountrySelect = (country) => {
        setFormData(prev => ({
            ...prev,
            country: country,
            city: '' // Reset city when country changes
        }));
        setCountrySearch('');
        setCitySearch('');
        setShowCountryOptions(false);
    };

    const handleCitySelect = (city) => {
        setFormData(prev => ({
            ...prev,
            city: city
        }));
        setCitySearch('');
        setShowCityOptions(false);
    };

    const handleCountryInputChange = (e) => {
        const value = e.target.value;
        setCountrySearch(value);
        setFormData(prev => ({
            ...prev,
            country: value,
            city: '' // Reset city when country changes
        }));
        setShowCountryOptions(true);
    };

    const handleCityInputChange = (e) => {
        const value = e.target.value;
        setCitySearch(value);
        setFormData(prev => ({
            ...prev,
            city: value
        }));
        setShowCityOptions(true);
    };

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (countryInputRef.current && !countryInputRef.current.contains(event.target)) {
                setShowCountryOptions(false);
            }
            if (cityInputRef.current && !cityInputRef.current.contains(event.target)) {
                setShowCityOptions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="employee-profile">
            <PageHeader
                title={t('profile.title')}
                subtitle={t('profile.subtitle')}
            />

            <Row className="justify-content-center">
                <Col md={8} lg={6}>
                    <Card>
                        <Card.Body>
                            {error && <Alert variant="danger">{error}</Alert>}
                            {success && <Alert variant="success">{t('profile.updateSuccess')}</Alert>}

                            {/* Read-only information */}
                            {user && (
                                <Card className="mb-4 bg-light">
                                    <Card.Body>
                                        <h6 className="card-title text-muted mb-3">
                                            <i className="bi bi-info-circle me-2"></i>
                                            {t('profile.accountInfo')}
                                        </h6>
                                        <Row>
                                            <Col md={6}>
                                                <div className="mb-2">
                                                    <strong>{t('profile.position')}: </strong>
                                                    <span className="text-muted">
                                                        {user.defaultPosition?.pos_name || user.position?.pos_name || t('profile.notAssigned')}
                                                    </span>
                                                </div>
                                                <div className="mb-2">
                                                    <strong>{t('profile.site')}: </strong>
                                                    <span className="text-muted">
                                                        {user.workSite?.site_name || user.site?.site_name || t('profile.notAssigned')}
                                                    </span>
                                                </div>
                                            </Col>
                                            <Col md={6}>
                                                <div className="mb-2">
                                                    <strong>{t('profile.role')}: </strong>
                                                    <span
                                                        className="text-muted">{user.role || t('profile.notAssigned')}</span>
                                                </div>
                                                <div className="mb-2">
                                                    <strong>{t('profile.status')}: </strong>
                                                    <span
                                                        className={`badge bg-${user.status === 'active' ? 'success' : 'secondary'}`}>
                                                        {t(`profile.${user.status}`) || user.status}
                                                    </span>
                                                </div>
                                            </Col>
                                        </Row>
                                    </Card.Body>
                                </Card>
                            )}

                            <Form onSubmit={handleSubmit}>
                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>{t('profile.firstName')}</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="first_name"
                                                value={formData.first_name}
                                                onChange={handleChange}
                                                required
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>{t('profile.lastName')}</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="last_name"
                                                value={formData.last_name}
                                                onChange={handleChange}
                                                required
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Form.Group className="mb-3">
                                    <Form.Label>{t('profile.username')}</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="username"
                                        value={formData.username}
                                        onChange={handleChange}
                                        required
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>{t('profile.email')}</Form.Label>
                                    <Form.Control
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>{t('profile.phone')}</Form.Label>
                                    <Form.Control
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                    />
                                </Form.Group>

                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3" ref={countryInputRef}>
                                            <Form.Label>{t('profile.country')}</Form.Label>
                                            <div className="position-relative">
                                                <Form.Control
                                                    type="text"
                                                    value={countrySearch || formData.country}
                                                    onChange={handleCountryInputChange}
                                                    onFocus={() => {
                                                        setCountrySearch(formData.country);
                                                        setShowCountryOptions(true);
                                                    }}
                                                    placeholder={t('profile.searchCountry')}
                                                    autoComplete="country"
                                                />
                                                {showCountryOptions && (
                                                    <div
                                                        className="position-absolute w-100 bg-white border rounded shadow-sm mt-1"
                                                        style={{
                                                            zIndex: 1050,
                                                            maxHeight: '200px',
                                                            overflowY: 'auto',
                                                            top: '100%'
                                                        }}
                                                    >
                                                        {filteredCountries.map((country) => (
                                                            <div
                                                                key={country}
                                                                className="px-3 py-2 hover-bg-light cursor-pointer"
                                                                style={{cursor: 'pointer'}}
                                                                onClick={() => handleCountrySelect(country)}
                                                                onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                                                                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                                                            >
                                                                {country}
                                                            </div>
                                                        ))}
                                                        {filteredCountries.length === 0 && (
                                                            <div className="px-3 py-2 text-muted">
                                                                {t('profile.noCountriesFound')}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3" ref={cityInputRef}>
                                            <Form.Label>{t('profile.city')}</Form.Label>
                                            <div className="position-relative">
                                                <Form.Control
                                                    type="text"
                                                    value={citySearch || formData.city}
                                                    onChange={handleCityInputChange}
                                                    onFocus={() => {
                                                        setCitySearch(formData.city);
                                                        setShowCityOptions(true);
                                                    }}
                                                    placeholder={t('profile.searchCity')}
                                                    disabled={!formData.country}
                                                    autoComplete="address-level2"
                                                />
                                                {showCityOptions && formData.country && (
                                                    <div
                                                        className="position-absolute w-100 bg-white border rounded shadow-sm mt-1"
                                                        style={{
                                                            zIndex: 1050,
                                                            maxHeight: '200px',
                                                            overflowY: 'auto',
                                                            top: '100%'
                                                        }}
                                                    >
                                                        {filteredCities.map((city) => (
                                                            <div
                                                                key={city}
                                                                className="px-3 py-2 hover-bg-light cursor-pointer"
                                                                style={{cursor: 'pointer'}}
                                                                onClick={() => handleCitySelect(city)}
                                                                onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                                                                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                                                            >
                                                                {city}
                                                            </div>
                                                        ))}
                                                        {filteredCities.length === 0 && (
                                                            <div className="px-3 py-2 text-muted">
                                                                {t('profile.noCitiesFound')}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Form.Group className="mb-3">
                                    <Form.Label>{t('profile.address')}</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={2}
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                    />
                                </Form.Group>

                                {/* Password Change Section */}
                                <Card className="mb-3">
                                    <Card.Body>
                                        <div className="d-flex justify-content-between align-items-center mb-3">
                                            <h6 className="card-title mb-0">
                                                <i className="bi bi-shield-lock me-2"></i>
                                                {t('profile.security.title')}
                                            </h6>
                                            <Button
                                                variant="outline-secondary"
                                                className="rounded-pill px-4 py-2"
                                                style={{minHeight: '48px'}}
                                                onClick={() => {
                                                    setShowPasswordChange(!showPasswordChange);
                                                    if (showPasswordChange) {
                                                        setPasswordData({
                                                            currentPassword: '',
                                                            newPassword: '',
                                                            confirmPassword: '',
                                                        });
                                                        setPasswordValidation('');
                                                    }
                                                }}
                                            >
                                                {showPasswordChange ? t('common.cancel') : t('profile.security.changePassword')}
                                            </Button>
                                        </div>

                                        {showPasswordChange && (
                                            <Form onSubmit={handlePasswordSubmit}>
                                                {passwordValidation && (
                                                    <Alert variant="danger" className="mb-3">
                                                        {passwordValidation}
                                                    </Alert>
                                                )}

                                                <Form.Group className="mb-3">
                                                    <Form.Label>{t('profile.security.currentPassword')}</Form.Label>
                                                    <Form.Control
                                                        type="password"
                                                        name="currentPassword"
                                                        value={passwordData.currentPassword}
                                                        onChange={handlePasswordChange}
                                                        required
                                                    />
                                                </Form.Group>

                                                <Form.Group className="mb-3">
                                                    <Form.Label>{t('profile.security.newPassword')}</Form.Label>
                                                    <Form.Control
                                                        type="password"
                                                        name="newPassword"
                                                        value={passwordData.newPassword}
                                                        onChange={handlePasswordChange}
                                                        required
                                                    />
                                                </Form.Group>

                                                <Form.Group className="mb-3">
                                                    <Form.Label>{t('profile.security.confirmPassword')}</Form.Label>
                                                    <Form.Control
                                                        type="password"
                                                        name="confirmPassword"
                                                        value={passwordData.confirmPassword}
                                                        onChange={handlePasswordChange}
                                                        required
                                                    />
                                                </Form.Group>

                                                <div className="d-grid">
                                                    <Button
                                                        type="submit"
                                                        variant="warning"
                                                        className="rounded-pill px-4 py-3"
                                                        style={{minHeight: '50px'}}
                                                        disabled={loading}
                                                    >
                                                        <i className="bi bi-shield-lock me-2"></i>
                                                        {loading ? t('common.saving') : t('profile.security.updatePassword')}
                                                    </Button>
                                                </div>
                                            </Form>
                                        )}
                                    </Card.Body>
                                </Card>

                                <Card className="mb-3">
                                    <Card.Body>
                                        <FormGroup>
                                            <Form.Label className="text-muted">
                                                {t('profile.notifications.title')}
                                            </Form.Label>
                                            <Form.Check
                                                type="switch"
                                                className="mb-2"
                                                id="receive_schedule_emails"
                                                name="receive_schedule_emails"
                                                label={t('profile.notifications.receiveScheduleEmails')}
                                                checked={formData.receive_schedule_emails}
                                                onChange={handleChange}
                                            />
                                        </FormGroup>
                                        <Form.Text className="text-muted">
                                            {t('profile.notifications.scheduleEmailsDescription')}
                                        </Form.Text>

                                    </Card.Body>
                                </Card>

                                <div className="d-grid gap-2">
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        disabled={loading}
                                    >
                                        {loading ? t('common.saving') : t('common.save')}
                                    </Button>
                                </div>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default EmployeeProfile;