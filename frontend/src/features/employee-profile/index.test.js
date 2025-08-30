import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { I18nProvider } from 'shared/lib/i18n/i18nProvider';
import EmployeeProfile from './index';
import profileReducer from './model/profileSlice';

// Mock API calls
jest.mock('shared/api/apiService', () => ({
    employeeAPI: {
        getProfile: jest.fn(() => Promise.resolve({
            data: {
                id: '1',
                first_name: 'John',
                last_name: 'Doe',
                email: 'john@example.com',
                phone: '+1234567890',
                receive_schedule_emails: true
            }
        })),
        updateProfile: jest.fn(() => Promise.resolve({ data: {} })),
    }
}));

const createMockStore = (initialState = {}) => {
    return configureStore({
        reducer: {
            profile: profileReducer,
        },
        preloadedState: {
            profile: {
                user: {
                    id: '1',
                    first_name: 'John',
                    last_name: 'Doe', 
                    email: 'john@example.com',
                    phone: '+1234567890',
                    receive_schedule_emails: true
                },
                loading: false,
                error: null,
                success: false,
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

describe('EmployeeProfile Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('renders employee profile page', async () => {
        await act(async () => {
            renderWithProviders(<EmployeeProfile />);
        });
        
        await waitFor(() => {
            expect(screen.getByText('My Profile')).toBeInTheDocument();
        });
    });

    test('displays loading state', async () => {
        const store = createMockStore({
            profile: {
                user: {
                    id: '1',
                    first_name: 'John',
                    last_name: 'Doe', 
                    email: 'john@example.com',
                    phone: '+1234567890',
                    receive_schedule_emails: true
                },
                loading: true,
                error: null,
                success: false,
            },
        });
        
        await act(async () => {
            renderWithProviders(<EmployeeProfile />, { store });
        });
        
        // Component renders with loading state
        expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
    });

    test('displays error message when fetch fails', async () => {
        const store = createMockStore({
            profile: {
                user: null,
                loading: false,
                error: 'Failed to load profile',
                success: false,
            },
        });
        
        await act(async () => {
            renderWithProviders(<EmployeeProfile />, { store });
        });
        
        await waitFor(() => {
            expect(screen.getByRole('alert')).toBeInTheDocument();
            expect(screen.getByText('Failed to load profile')).toBeInTheDocument();
        });
    });

    test('renders profile form when data is loaded', async () => {
        await act(async () => {
            renderWithProviders(<EmployeeProfile />);
        });
        
        await waitFor(() => {
            expect(screen.getByDisplayValue('John')).toBeInTheDocument();
            expect(screen.getByDisplayValue('Doe')).toBeInTheDocument(); 
            expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument();
        });
    });
});