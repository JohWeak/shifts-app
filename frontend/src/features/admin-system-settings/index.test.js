import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { I18nProvider } from 'shared/lib/i18n/i18nProvider';
import SystemSettings from './index';
import settingsReducer from './model/settingsSlice';
import scheduleReducer from '../admin-schedule-management/model/scheduleSlice';

// Mock motion components
jest.mock('motion/react', () => ({
    motion: {
        div: ({ children, ...props }) => <div {...props}>{children}</div>,
    },
    AnimatePresence: ({ children }) => children,
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
                enableNotifications: true
            }
        })),
        updateSystemSettings: jest.fn(() => Promise.resolve({ data: {} })),
    }
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
                    { site_id: '2', site_name: 'Branch Office' }
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
        </Provider>
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
            expect(screen.getByText('General')).toBeInTheDocument();
            expect(screen.getByText('Schedule')).toBeInTheDocument();
            expect(screen.getByText('Algorithm')).toBeInTheDocument();
            expect(screen.getByText('Positions')).toBeInTheDocument();
            expect(screen.getByText('Constraints')).toBeInTheDocument();
            expect(screen.getByText('Notifications')).toBeInTheDocument();
            expect(screen.getByText('Security')).toBeInTheDocument();
        });
    });

    test('displays general settings form fields', async () => {
        renderWithProviders(<SystemSettings />);
        
        await waitFor(() => {
            expect(screen.getByLabelText(/Date Format/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/Time Format/i)).toBeInTheDocument();
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
            expect(screen.getByRole('alert')).toBeInTheDocument();
            expect(screen.getByText('Failed to fetch settings')).toBeInTheDocument();
        });
    });

    test('renders position settings when site is selected', async () => {
        renderWithProviders(<SystemSettings />);
        
        await waitFor(() => {
            // Click on positions tab
            const positionsTab = screen.getByText('Positions');
            positionsTab.click();
        });

        // Select a site
        const siteSelect = screen.getByDisplayValue('Select a work site...');
        expect(siteSelect).toBeInTheDocument();
    });

    test('shows save and reset buttons', async () => {
        renderWithProviders(<SystemSettings />);
        
        await waitFor(() => {
            expect(screen.getByText('Reset')).toBeInTheDocument();
            expect(screen.getByText('Save Changes')).toBeInTheDocument();
        });
    });
});