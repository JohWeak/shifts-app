import axios from 'axios';

// Action types
export const LOGIN_REQUEST = 'LOGIN_REQUEST';
export const LOGIN_SUCCESS = 'LOGIN_SUCCESS';
export const LOGIN_FAILURE = 'LOGIN_FAILURE';
export const LOGOUT = 'LOGOUT';

// Login action - dispatches async actions
export const login = (loginData, password) => {
    return async (dispatch) => {
        // Dispatch login request action
        dispatch({ type: LOGIN_REQUEST });
        try {
            // Make API call to login endpoint
            const response = await axios.post('http://localhost:5000/api/auth/login', {
                login: loginData,
                password
            });

            const { token, id, name, role } = response.data;

            // Save auth data to localStorage for persistence
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify({ id, name, role }));

            // Set default Authorization header for future requests
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            // Dispatch success action with user data
            dispatch({
                type: LOGIN_SUCCESS,
                payload: { id, name, role, token }
            });

            return { success: true, role };
        } catch (error) {
            // Dispatch failure action with error message
            dispatch({
                type: LOGIN_FAILURE,
                payload: error.response?.data?.message || 'Login failed'
            });

            return { success: false, error: error.response?.data?.message || 'Login failed' };
        }
    };
};

// Logout action - clears auth state
export const logout = () => {
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    // Remove Authorization header
    delete axios.defaults.headers.common['Authorization'];

    return { type: LOGOUT };
};