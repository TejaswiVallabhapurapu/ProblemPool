const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Register a new user
 * @param {Object} userData - { name, email, password }
 */
export const signupUser = async (userData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to register account');
    }
    return data;
  } catch (error) {
    console.error('signupUser error:', error);
    throw error;
  }
};

/**
 * Login user and receive token
 * @param {Object} credentials - { email, password }
 */
export const loginUser = async (credentials) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to login');
    }
    return data;
  } catch (error) {
    console.error('loginUser error:', error);
    throw error;
  }
};

/**
 * Get current authenticated user profile
 * @param {string} token - JWT Token
 */
export const getCurrentUser = async (token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch current user profile');
    }
    return data;
  } catch (error) {
    console.error('getCurrentUser error:', error);
    throw error;
  }
};

/**
 * Fetch all problems (newest first)
 */
export const getProblems = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/problems`);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch problems');
    }
    return data;
  } catch (error) {
    console.error('getProblems error:', error);
    throw error;
  }
};

/**
 * Fetch a single problem by ID
 * @param {string} id - MongoDB ObjectId
 */
export const getProblem = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/problems/${id}`);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch problem details');
    }
    return data;
  } catch (error) {
    console.error(`getProblem(${id}) error:`, error);
    throw error;
  }
};

/**
 * Create a new problem (Protected)
 * @param {Object} problemData - { title, description, category, location }
 * @param {string} token - JWT Token
 */
export const createProblem = async (problemData, token) => {
  try {
    const headers = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/problems`, {
      method: 'POST',
      headers,
      body: JSON.stringify(problemData),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to create problem');
    }
    return data;
  } catch (error) {
    console.error('createProblem error:', error);
    throw error;
  }
};

/**
 * Delete a problem by ID
 * @param {string} id - MongoDB ObjectId
 * @param {string} [token] - Optional JWT Token
 */
export const deleteProblem = async (id, token) => {
  try {
    const headers = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/problems/${id}`, {
      method: 'DELETE',
      headers,
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to delete problem');
    }
    return data;
  } catch (error) {
    console.error(`deleteProblem(${id}) error:`, error);
    throw error;
  }
};

/**
 * Fetch problems by category
 * @param {string} category
 */
export const getProblemsByCategory = async (category) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/problems/category/${encodeURIComponent(category)}`
    );
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch problems by category');
    }
    return data;
  } catch (error) {
    console.error(`getProblemsByCategory(${category}) error:`, error);
    throw error;
  }
};
