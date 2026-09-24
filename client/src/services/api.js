/**
 * ProblemPool API Client
 * Automatically normalizes API_BASE_URL for both localhost and production deployment (Render/Vercel)
 */
const getApiBaseUrl = () => {
  let url = import.meta.env.VITE_API_URL;
  if (!url || typeof url !== 'string' || url.trim() === '') {
    // Default for local development
    return 'http://localhost:5000/api';
  }

  // Trim whitespace and trailing slashes
  url = url.trim().replace(/\/+$/, '');

  // If the user provided the base URL without /api (e.g. https://problempool.onrender.com)
  if (!url.endsWith('/api')) {
    url = `${url}/api`;
  }
  return url;
};

const API_BASE_URL = getApiBaseUrl();

/**
 * Helper to safely parse JSON or text response
 */
const handleApiResponse = async (response) => {
  const contentType = response.headers.get('content-type') || '';
  let data = null;

  if (contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  } else {
    try {
      const text = await response.text();
      data = { message: text };
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const errorMessage =
      data?.message ||
      (response.status === 401
        ? 'Invalid credentials or session expired'
        : response.status === 404
        ? 'Requested endpoint not found'
        : `Request failed with status ${response.status}`);
    throw new Error(errorMessage);
  }

  return data || { success: true };
};

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
    return await handleApiResponse(response);
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
    return await handleApiResponse(response);
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
    const headers = {};
    if (token && token !== 'null' && token !== 'undefined') {
      headers.Authorization = `Bearer ${token.trim()}`;
    }

    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers,
    });
    return await handleApiResponse(response);
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
    return await handleApiResponse(response);
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
    return await handleApiResponse(response);
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
    if (token && token !== 'null' && token !== 'undefined') {
      headers.Authorization = `Bearer ${token.trim()}`;
    }

    const response = await fetch(`${API_BASE_URL}/problems`, {
      method: 'POST',
      headers,
      body: JSON.stringify(problemData),
    });
    return await handleApiResponse(response);
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
    if (token && token !== 'null' && token !== 'undefined') {
      headers.Authorization = `Bearer ${token.trim()}`;
    }

    const response = await fetch(`${API_BASE_URL}/problems/${id}`, {
      method: 'DELETE',
      headers,
    });
    return await handleApiResponse(response);
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
    return await handleApiResponse(response);
  } catch (error) {
    console.error(`getProblemsByCategory(${category}) error:`, error);
    throw error;
  }
};
