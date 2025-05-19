import {
    LOGIN_REQUEST,
    LOGIN_SUCCESS,
    LOGIN_FAILURE,
    LOGOUT
} from '../actions/authActions';

// Initial state for auth
const initialState = {
    user: null,
    token: null,
    loading: false,
    error: null,
    isAuthenticated: false
};

// Auth reducer to handle auth-related actions
const authReducer = (state = initialState, action) => {
    switch (action.type) {
        case LOGIN_REQUEST:
            return {
                ...state,
                loading: true,
                error: null
            };

        case LOGIN_SUCCESS:
            return {
                ...state,
                loading: false,
                user: {
                    id: action.payload.id,
                    name: action.payload.name,
                    role: action.payload.role
                },
                token: action.payload.token,
                isAuthenticated: true,
                error: null
            };

        case LOGIN_FAILURE:
            return {
                ...state,
                loading: false,
                error: action.payload,
                isAuthenticated: false
            };

        case LOGOUT:
            return {
                ...initialState
            };

        default:
            return state;
    }
};

export default authReducer;