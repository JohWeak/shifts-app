// frontend/src/features/employee-profile/index.js
import React, {useEffect, useRef, useState} from 'react';
import {Alert, Button, Card, Col, Form, FormGroup, InputGroup, Row} from 'react-bootstrap';
import {useDispatch, useSelector} from 'react-redux';
import {useI18n} from 'shared/lib/i18n/i18nProvider';
import PageHeader from 'shared/ui/components/PageHeader';
import {loadProfile, updateProfile} from './model/profileSlice';
import {addNotification} from 'app/model/notificationsSlice';
import './index.css';

const EmployeeProfile = () => {
    const {t} = useI18n();
    const dispatch = useDispatch();
    const {user, loading} = useSelector(state => state.profile);

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

    // Password visibility states
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

    const handlePasswordSubmit = async () => {
        try {
            console.log('Button clicked, starting password change');
            setPasswordValidation('');

            // Enhanced validation
            if (!passwordData.currentPassword.trim()) {
                console.log('Current password validation failed');
                setPasswordValidation(t('profile.security.currentPasswordRequired'));
                return;
            }
        } catch (error) {
            console.error('Error in handlePasswordSubmit start:', error);
            return;
        }

        try {
            if (!passwordData.newPassword.trim()) {
                console.log('New password validation failed');
                setPasswordValidation(t('profile.security.newPasswordRequired'));
                return;
            }

            if (passwordData.newPassword.length < 8) {
                console.log('Password too short validation failed');
                setPasswordValidation(t('profile.security.passwordTooShort'));
                return;
            }

            // Password strength is visual only, not blocking

            if (passwordData.newPassword !== passwordData.confirmPassword) {
                console.log('Password mismatch validation failed');
                setPasswordValidation(t('profile.security.passwordMismatch'));
                return;
            }

            if (passwordData.currentPassword === passwordData.newPassword) {
                console.log('Same password validation failed');
                setPasswordValidation(t('profile.security.passwordSameAsCurrent'));
                return;
            }

            console.log('All validations passed, submitting...');
        } catch (error) {
            console.error('Error in validation:', error);
            setPasswordValidation('Validation error occurred');
            return;
        }

        try {
            await dispatch(updateProfile({
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            })).unwrap();

            dispatch(addNotification({
                variant: 'success',
                message: t('profile.security.passwordUpdatedSuccess')
            }));

            setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
            });
            setShowPasswordChange(false);
            setShowCurrentPassword(false);
            setShowNewPassword(false);
            setShowConfirmPassword(false);

        } catch (error) {
            console.log('Password change error:', error);

            // Extract error message more reliably
            let errorMessage;
            if (typeof error === 'string') {
                errorMessage = error;
            } else if (error.message) {
                errorMessage = error.message;
            } else if (error.data?.message) {
                errorMessage = error.data.message;
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else {
                errorMessage = t('profile.security.passwordUpdateFailed');
            }

            // Show local validation error for current password issues
            if (errorMessage.includes('Current password is incorrect') ||
                errorMessage.includes('current password') ||
                errorMessage.includes('incorrect')) {
                setPasswordValidation(t('profile.security.currentPasswordIncorrect'));
            } else {
                dispatch(addNotification({
                    variant: 'danger',
                    message: errorMessage
                }));
            }
        }
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

    // Password strength checker
    const getPasswordStrength = (password) => {
        if (password.length < 8) {
            return {
                level: 'weak',
                text: t('profile.security.passwordTooShort'),
                color: 'danger',
                variant: 'danger'
            };
        }

        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChars = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);

        const strength = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChars].filter(Boolean).length;

        if (strength >= 3) {
            return {
                level: 'strong',
                text: t('profile.security.passwordStrong'),
                color: 'success',
                variant: 'success'
            };
        } else {
            return {
                level: 'medium',
                text: t('profile.security.passwordMedium'),
                color: 'warning',
                variant: 'warning'
            };
        }
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
                <Col lg={12}>
                    <Card>
                        <Card.Body>

                            {/* Read-only information */}
                            {user && (
                                <Card className="mb-4">
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

                                <Row>
                                    <Col md={6}>
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
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>{t('profile.phone')}</Form.Label>
                                            <Form.Control
                                                type="tel"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleChange}
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>
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
                                                        className="position-absolute w-100 bg-body border rounded shadow-sm mt-1"
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
                                                                className="px-3 py-2 hover-bg-body cursor-pointer"
                                                                style={{cursor: 'pointer'}}
                                                                onClick={() => handleCountrySelect(country)}
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
                                                        className="position-absolute w-100 bg-body border rounded shadow-sm mt-1"
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
                                        <div className="d-flex justify-content-between align-items-center">
                                            <h6 className="card-title mb-0">
                                                <i className="bi bi-shield-lock me-2"></i>
                                                {t('profile.security.title')}
                                            </h6>
                                            <Button
                                                variant="outline-secondary"
                                                className="px-4 py-2"
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
                                            <div>
                                                {passwordValidation && (
                                                    <Alert variant="danger" className="mb-3">
                                                        {passwordValidation}
                                                    </Alert>
                                                )}

                                                <Form.Group className="mb-3">
                                                    <Form.Label>{t('profile.security.currentPassword')}</Form.Label>
                                                    <InputGroup>
                                                        <Form.Control
                                                            type={showCurrentPassword ? "text" : "password"}
                                                            name="currentPassword"
                                                            value={passwordData.currentPassword}
                                                            onChange={handlePasswordChange}
                                                            required
                                                        />
                                                        <Button
                                                            variant="outline-secondary"
                                                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                                            style={{
                                                                borderLeft: 0,
                                                                borderColor: 'var(--bs-border-color)'
                                                            }}
                                                        >
                                                            <i className={`bi bi-eye${showCurrentPassword ? '-slash' : ''}`}></i>
                                                        </Button>
                                                    </InputGroup>
                                                </Form.Group>

                                                <Form.Group className="mb-3">
                                                    <Form.Label>
                                                        {t('profile.security.newPassword')}
                                                        {passwordData.newPassword && (
                                                            <small
                                                                className={`ms-2 text-${getPasswordStrength(passwordData.newPassword).color}`}>
                                                                <i className={`bi bi-${getPasswordStrength(passwordData.newPassword).level === 'strong' ? 'shield-check' : getPasswordStrength(passwordData.newPassword).level === 'medium' ? 'shield-exclamation' : 'shield-x'} me-1`}></i>
                                                                {getPasswordStrength(passwordData.newPassword).text}
                                                            </small>
                                                        )}
                                                    </Form.Label>
                                                    <InputGroup>
                                                        <Form.Control
                                                            type={showNewPassword ? "text" : "password"}
                                                            name="newPassword"
                                                            value={passwordData.newPassword}
                                                            onChange={handlePasswordChange}
                                                            required
                                                        />
                                                        <Button
                                                            variant="outline-secondary"
                                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                                            style={{
                                                                borderLeft: 0,
                                                                borderColor: 'var(--bs-border-color)'
                                                            }}
                                                        >
                                                            <i className={`bi bi-eye${showNewPassword ? '-slash' : ''}`}></i>
                                                        </Button>
                                                    </InputGroup>
                                                </Form.Group>

                                                <Form.Group className="mb-3">
                                                    <Form.Label>{t('profile.security.confirmPassword')}</Form.Label>
                                                    <InputGroup>
                                                        <Form.Control
                                                            type={showConfirmPassword ? "text" : "password"}
                                                            name="confirmPassword"
                                                            value={passwordData.confirmPassword}
                                                            onChange={handlePasswordChange}
                                                            required
                                                        />
                                                        <Button
                                                            variant="outline-secondary"
                                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                            style={{
                                                                borderLeft: 0,
                                                                borderColor: 'var(--bs-border-color)'
                                                            }}
                                                        >
                                                            <i className={`bi bi-eye${showConfirmPassword ? '-slash' : ''}`}></i>
                                                        </Button>
                                                    </InputGroup>
                                                </Form.Group>

                                                <div className="d-grid">
                                                    <Button
                                                        type="button"
                                                        variant="warning"
                                                        className="px-4 py-3"
                                                        disabled={loading}
                                                        onClick={handlePasswordSubmit}
                                                    >
                                                        <i className="bi bi-shield-lock me-2"></i>
                                                        {loading ? t('common.saving') : t('profile.security.updatePassword')}
                                                    </Button>
                                                </div>
                                            </div>
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