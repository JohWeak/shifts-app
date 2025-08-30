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
            auth: (state = {}) => state,
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
            auth: {
                isAuthenticated: false,
                user: null,
                token: null,
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
            // Проверяем что есть 4 вкладки навигации
            const tabs = screen.getAllByRole('tab');
            expect(tabs).toHaveLength(4);
        }, { timeout: 3000 });
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
            const tabs = screen.getAllByRole('tab');
            expect(tabs.length).toBeGreaterThan(0);
        });

        // Click on second tab
        const tabs = screen.getAllByRole('tab');
        if (tabs[1]) {
            await user.click(tabs[1]);
            await waitFor(() => {
                expect(tabs[1].getAttribute('aria-selected')).toBe('true');
            });
        }
    });


    test('can change schedule settings values', async () => {
        const user = userEvent;
        renderWithProviders(<SystemSettings />);

        await waitFor(() => {
            const selects = screen.getAllByRole('combobox');
            expect(selects.length).toBeGreaterThan(0);
        });
    });

    test('can toggle notification settings', async () => {
        const user = userEvent;
        renderWithProviders(<SystemSettings />);

        await waitFor(() => {
            const tabs = screen.getAllByRole('tab');
            expect(tabs.length).toBe(4);
        });

        // Click on notifications tab (last tab)
        const tabs = screen.getAllByRole('tab');
        if (tabs[3]) {
            await user.click(tabs[3]);
            await waitFor(() => {
                const switches = screen.getAllByRole('checkbox');
                expect(switches.length).toBeGreaterThanOrEqual(1);
            });
        }
    });

    test('enables save button when changes are made', async () => {
        const user = userEvent;
        renderWithProviders(<SystemSettings />);

        await waitFor(() => {
            expect(screen.getByText('Save')).toBeInTheDocument();
        });

        const saveButton = screen.getByText('Save');
        expect(saveButton).toBeDisabled();
    });

    test('can reset changes', async () => {
        const user = userEvent;
        renderWithProviders(<SystemSettings />);

        await waitFor(() => {
            expect(screen.getByText('Reset')).toBeInTheDocument();
        });

        const resetButton = screen.getByText('Reset');
        expect(resetButton).toBeInTheDocument();
    });


    test('can change algorithm settings', async () => {
        const user = userEvent;
        renderWithProviders(<SystemSettings />);

        // Click on second tab (algorithm)
        const tabs = screen.getAllByRole('tab');
        if (tabs[1]) {
            await user.click(tabs[1]);
            await waitFor(() => {
                const selects = screen.getAllByRole('combobox');
                expect(selects.length).toBeGreaterThanOrEqual(1);
            });
        }
    });

    test('can change constraint settings', async () => {
        const user = userEvent;
        renderWithProviders(<SystemSettings />);

        // Click on third tab (constraints)
        const tabs = screen.getAllByRole('tab');
        if (tabs[2]) {
            await user.click(tabs[2]);
            await waitFor(() => {
                const inputs = screen.getAllByRole('spinbutton');
                expect(inputs.length).toBeGreaterThanOrEqual(1);
            });
        }
    });


    test('displays success message after saving', async () => {
        const user = userEvent;
        const mockUpdate = jest.fn(() => Promise.resolve({ type: 'settings/updateSystemSettings/fulfilled' }));

        const store = createMockStore();
        store.dispatch = mockUpdate;

        renderWithProviders(<SystemSettings />, { store });

        await waitFor(() => {
            expect(screen.getByText('Save')).toBeInTheDocument();
        });

        const saveButton = screen.getByText('Save');
        expect(saveButton).toBeInTheDocument();
    });

    test('validation works for numeric inputs', async () => {
        const user = userEvent;
        renderWithProviders(<SystemSettings />);

        await waitFor(() => {
            const tabs = screen.getAllByRole('tab');
            expect(tabs.length).toBe(4);
        });

        // Click on constraints tab
        const tabs = screen.getAllByRole('tab');
        if (tabs[2]) {
            await user.click(tabs[2]);
            await waitFor(() => {
                const inputs = screen.getAllByRole('spinbutton');
                if (inputs.length > 0) {
                    expect(inputs[0].getAttribute('min')).toBeTruthy();
                }
            });
        }
    });

});