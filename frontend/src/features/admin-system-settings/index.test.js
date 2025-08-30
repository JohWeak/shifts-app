import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { I18nProvider } from 'shared/lib/i18n/i18nProvider';
import SystemSettings from './index';
import settingsReducer from './model/settingsSlice';
import scheduleReducer from '../admin-schedule-management/model/scheduleSlice';

// Setup jest-dom
import '@testing-library/jest-dom';

// Mock motion components
jest.mock('motion/react', () => ({
    motion: {
        div: ({ children, ...props }) => <div {...props}>{children}</div>,
    },
    AnimatePresence: ({ children }) => children,
}));

// Mock date-fns locale
jest.mock('date-fns/locale', () => ({
    enUS: {},
    he: {},
    ru: {},
}));

// Mock scheduleUtils
jest.mock('shared/lib/utils/scheduleUtils', () => ({
    formatDate: jest.fn((date) => date.toISOString().split('T')[0]),
    formatTime: jest.fn((time) => time),
}));

// Mock API calls
jest.mock('shared/api/apiService', () => ({
    settingsAPI: {
        fetchSystemSettings: jest.fn(() => Promise.resolve({
            data: {
                weekStartDay: 1,
                timeFormat: '24h',
                dateFormat: 'DD/MM/YYYY',
                defaultScheduleDuration: 7,
                minRestBetweenShifts: 11,
                enableNotifications: true,
            },
        })),
        updateSystemSettings: jest.fn(() => Promise.resolve({ data: {} })),
    },
}));

// Mock components
jest.mock('../admin-position-settings', () => {
    return function MockPositionSettings({ siteId }) {
        return <div data-testid="position-settings">Position Settings for site: {siteId}</div>;
    };
});

const createMockStore = (initialState = {}) => {
    return configureStore({
        reducer: {
            settings: settingsReducer,
            schedule: scheduleReducer,
        },
        preloadedState: {
            settings: {
                systemSettings: {
                    weekStartDay: 1,
                    timeFormat: '24h',
                    dateFormat: 'DD/MM/YYYY',
                    defaultScheduleDuration: 7,
                    minRestBetweenShifts: 11,
                    enableNotifications: true,
                },
                loading: 'idle',
                error: null,
            },
            schedule: {
                workSites: [
                    { site_id: '1', site_name: 'Main Office' },
                    { site_id: '2', site_name: 'Branch Office' },
                ],
                workSitesLoading: 'idle',
            },
            ...initialState,
        },
    });
};

const renderWithProviders = (ui, { store = createMockStore() } = {}) => {
    return render(
        <Provider store={store}>
            <I18nProvider>
                {ui}
            </I18nProvider>
        </Provider>,
    );
};

describe('SystemSettings Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('renders system settings page', async () => {
        renderWithProviders(<SystemSettings />);

        await waitFor(() => {
            expect(screen.getByText('System Settings')).toBeInTheDocument();
        });
    });

    test('displays navigation tabs', async () => {
        renderWithProviders(<SystemSettings />);

        await waitFor(() => {
            // Проверяем что есть 7 вкладок навигации
            const tabs = screen.getAllByRole('tab');
            expect(tabs).toHaveLength(7);

            // Проверяем текст в навигации (первые элементы)
            expect(screen.getAllByText('General')[0]).toBeInTheDocument();
            expect(screen.getAllByText('Schedule')[0]).toBeInTheDocument();
        }, { timeout: 3000 });
    });

    test('displays general settings form fields', async () => {
        renderWithProviders(<SystemSettings />);

        await waitFor(() => {
            const selects = screen.getAllByRole('combobox');
            expect(selects.length).toBeGreaterThanOrEqual(2);
        });
    });

    test('shows loading state', () => {
        const store = createMockStore({
            settings: {
                systemSettings: {},
                loading: 'pending',
                error: null,
            },
        });

        renderWithProviders(<SystemSettings />, { store });
        expect(screen.getByRole('status')).toBeInTheDocument();
    });

    test('displays error message when fetch fails', async () => {
        const store = createMockStore({
            settings: {
                systemSettings: {},
                loading: 'idle',
                error: 'Failed to fetch settings',
            },
        });

        renderWithProviders(<SystemSettings />, { store });

        await waitFor(() => {
            const alerts = screen.getAllByRole('alert');
            expect(alerts.length).toBeGreaterThanOrEqual(1);
            expect(screen.getByText('Failed to fetch settings')).toBeInTheDocument();
        });
    });

    test('renders position settings when site is selected', async () => {
        const user = userEvent;
        renderWithProviders(<SystemSettings />);

        // Click on positions tab
        const positionsTab = screen.getByRole('tab', { name: /positions/i });
        await user.click(positionsTab);

        // Check that site selector appears
        await waitFor(() => {
            expect(screen.getByRole('combobox')).toBeInTheDocument();
        }, { timeout: 5000 });
    });

    test('shows save and reset buttons', async () => {
        renderWithProviders(<SystemSettings />);

        await waitFor(() => {
            expect(screen.getByText('Reset')).toBeInTheDocument();
            expect(screen.getByText('Save')).toBeInTheDocument();
        });
    });

    test('can switch between tabs', async () => {
        const user = userEvent;
        renderWithProviders(<SystemSettings />);

        await waitFor(() => {
            expect(screen.getAllByText('General')[0]).toBeInTheDocument();
        });

        // Click on Schedule tab
        const scheduleTab = screen.getAllByRole('tab').find(tab => tab.textContent.includes('Schedule') && !tab.textContent.includes('Algorithm'));
        await user.click(scheduleTab);

        await waitFor(() => {
            expect(scheduleTab.getAttribute('aria-selected')).toBe('true');
        });

        // Click on Algorithm tab
        const algorithmTab = screen.getAllByRole('tab').find(tab => tab.textContent.includes('Algorithm'));
        await user.click(algorithmTab);

        await waitFor(() => {
            expect(algorithmTab.getAttribute('aria-selected')).toBe('true');
        });
    });

    test('can change general settings values', async () => {
        const user = userEvent;
        renderWithProviders(<SystemSettings />);

        await waitFor(() => {
            const selects = screen.getAllByRole('combobox');
            expect(selects.length).toBeGreaterThanOrEqual(2);
        });

        const selects = screen.getAllByRole('combobox');
        const dateFormatSelect = selects.find(select => select.value === 'DD/MM/YYYY');
        const timeFormatSelect = selects.find(select => select.value === '24h');

        if (dateFormatSelect) {
            await user.selectOptions(dateFormatSelect, 'MM/DD/YYYY');
            expect(dateFormatSelect.value).toBe('MM/DD/YYYY');
        }

        if (timeFormatSelect) {
            await user.selectOptions(timeFormatSelect, '12h');
            expect(timeFormatSelect.value).toBe('12h');
        }
    });

    test('can change schedule settings values', async () => {
        const user = userEvent;
        renderWithProviders(<SystemSettings />);

        // Switch to schedule tab
        const scheduleTab = screen.getAllByText('Schedule')[0];
        await user.click(scheduleTab);

        await waitFor(() => {
            expect(screen.getByLabelText(/Week Start Day/i)).toBeInTheDocument();
        });

        const weekStartSelect = screen.getByLabelText(/Week Start Day/i);
        await user.selectOptions(weekStartSelect, '0');
        expect(weekStartSelect.value).toBe('0');

        const durationSelect = screen.getByLabelText(/Default Schedule Duration/i);
        await user.selectOptions(durationSelect, '14');
        expect(durationSelect.value).toBe('14');
    });

    test('can toggle notification settings', async () => {
        const user = userEvent;
        renderWithProviders(<SystemSettings />);

        // Switch to notifications tab
        const notificationsTab = screen.getAllByText('Notifications')[0];
        await user.click(notificationsTab);

        await waitFor(() => {
            expect(screen.getByLabelText(/Enable Notifications/i)).toBeInTheDocument();
        });

        const enableNotificationsSwitch = screen.getByLabelText(/Enable Notifications/i);
        expect(enableNotificationsSwitch).toBeChecked();

        await user.click(enableNotificationsSwitch);
        expect(enableNotificationsSwitch).not.toBeChecked();
    });

    test('enables save button when changes are made', async () => {
        const user = userEvent;
        renderWithProviders(<SystemSettings />);

        await waitFor(() => {
            expect(screen.getByText('Save')).toBeInTheDocument();
        });

        const saveButton = screen.getByText('Save');
        expect(saveButton).toBeDisabled();

        // Make a change
        const dateFormatSelect = screen.getByDisplayValue('DD/MM/YYYY');
        await user.selectOptions(dateFormatSelect, 'MM/DD/YYYY');

        await waitFor(() => {
            expect(saveButton).toBeEnabled();
        });
    });

    test('can reset changes', async () => {
        const user = userEvent;
        renderWithProviders(<SystemSettings />);

        await waitFor(() => {
            expect(screen.getByDisplayValue('DD/MM/YYYY')).toBeInTheDocument();
        });

        const dateFormatSelect = screen.getByDisplayValue('DD/MM/YYYY');
        const resetButton = screen.getByText('Reset');

        // Make a change
        await user.selectOptions(dateFormatSelect, 'MM/DD/YYYY');
        expect(dateFormatSelect.value).toBe('MM/DD/YYYY');

        // Reset changes
        await user.click(resetButton);

        await waitFor(() => {
            expect(dateFormatSelect.value).toBe('DD/MM/YYYY');
        });
    });

    test('shows position settings when site is selected', async () => {
        const user = userEvent;
        renderWithProviders(<SystemSettings />);

        // Switch to positions tab
        const positionsTab = screen.getByRole('tab', { name: /positions/i });
        await user.click(positionsTab);

        await waitFor(() => {
            expect(screen.getByRole('combobox')).toBeInTheDocument();
        });

        // Select a site
        const siteSelect = screen.getByRole('combobox');
        await user.selectOptions(siteSelect, '1');

        await waitFor(() => {
            expect(screen.getByTestId('position-settings')).toBeInTheDocument();
            expect(screen.getByText('Position Settings for site: 1')).toBeInTheDocument();
        });
    });

    test('can change algorithm settings', async () => {
        const user = userEvent;
        renderWithProviders(<SystemSettings />);

        // Switch to algorithm tab
        const algorithmTab = screen.getAllByText('Algorithm')[0];
        await user.click(algorithmTab);

        await waitFor(() => {
            expect(screen.getByLabelText(/Algorithm Max Time/i)).toBeInTheDocument();
        });

        const maxTimeInput = screen.getByLabelText(/Algorithm Max Time/i);
        await user.clear(maxTimeInput);
        await user.type(maxTimeInput, '180');

        expect(maxTimeInput.value).toBe('180');

        const optimizationSelect = screen.getByLabelText(/Optimization Mode/i);
        await user.selectOptions(optimizationSelect, 'thorough');
        expect(optimizationSelect.value).toBe('thorough');
    });

    test('can change constraint settings', async () => {
        const user = userEvent;
        renderWithProviders(<SystemSettings />);

        // Switch to constraints tab
        const constraintsTab = screen.getAllByText('Constraints')[0];
        await user.click(constraintsTab);

        await waitFor(() => {
            expect(screen.getByLabelText(/Max Cannot Work Days/i)).toBeInTheDocument();
        });

        const maxCannotWorkInput = screen.getByLabelText(/Max Cannot Work Days/i);
        await user.clear(maxCannotWorkInput);
        await user.type(maxCannotWorkInput, '3');

        expect(maxCannotWorkInput.value).toBe('3');
    });

    test('can change security settings', async () => {
        const user = userEvent;
        renderWithProviders(<SystemSettings />);

        // Switch to security tab
        const securityTab = screen.getAllByText('Security')[0];
        await user.click(securityTab);

        await waitFor(() => {
            expect(screen.getByLabelText(/Session Timeout/i)).toBeInTheDocument();
        });

        const sessionTimeoutInput = screen.getByLabelText(/Session Timeout/i);
        await user.clear(sessionTimeoutInput);
        await user.type(sessionTimeoutInput, '90');

        expect(sessionTimeoutInput.value).toBe('90');

        const passwordLengthInput = screen.getByLabelText(/Password Min Length/i);
        await user.clear(passwordLengthInput);
        await user.type(passwordLengthInput, '10');

        expect(passwordLengthInput.value).toBe('10');
    });

    test('displays success message after saving', async () => {
        const user = userEvent;
        const mockUpdate = jest.fn(() => Promise.resolve({ type: 'settings/updateSystemSettings/fulfilled' }));

        const store = createMockStore();
        store.dispatch = mockUpdate;

        renderWithProviders(<SystemSettings />, { store });

        await waitFor(() => {
            expect(screen.getByDisplayValue('DD/MM/YYYY')).toBeInTheDocument();
        });

        // Make a change
        const dateFormatSelect = screen.getByDisplayValue('DD/MM/YYYY');
        await user.selectOptions(dateFormatSelect, 'MM/DD/YYYY');

        // Save changes
        const saveButton = screen.getByText('Save');
        await user.click(saveButton);

        expect(mockUpdate).toHaveBeenCalled();
    });

    test('validation works for numeric inputs', async () => {
        const user = userEvent;
        renderWithProviders(<SystemSettings />);

        // Switch to algorithm tab
        const algorithmTab = screen.getAllByText('Algorithm')[0];
        await user.click(algorithmTab);

        await waitFor(() => {
            expect(screen.getByLabelText(/Algorithm Max Time/i)).toBeInTheDocument();
        });

        const maxTimeInput = screen.getByLabelText(/Algorithm Max Time/i);
        expect(maxTimeInput.getAttribute('min')).toBe('30');
        expect(maxTimeInput.getAttribute('max')).toBe('300');

        const employeesInput = screen.getByLabelText(/Default Employees Per Shift/i);
        expect(employeesInput.getAttribute('min')).toBe('1');
        expect(employeesInput.getAttribute('max')).toBe('10');
    });

    test('legal compliance settings are disabled', async () => {
        const user = userEvent;
        renderWithProviders(<SystemSettings />);

        // Switch to constraints tab
        const constraintsTab = screen.getAllByText('Constraints')[0];
        await user.click(constraintsTab);

        await waitFor(() => {
            expect(screen.getByLabelText('12')).toBeInTheDocument();
        });

        const maxHoursInput = screen.getByLabelText('12');
        expect(maxHoursInput).toBeDisabled();

        const minRestInput = screen.getByLabelText('11');
        expect(minRestInput).toBeDisabled();
    });
});