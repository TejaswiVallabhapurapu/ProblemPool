/**
 * ProblemPool API Client
 * Automatically normalizes and selects API_BASE_URL for both localhost and production deployments (Vercel / Render)
 */
export const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;

  // Determine if running locally
  const isLocalhost =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname === '0.0.0.0' ||
      window.location.hostname === '');

  // If in browser on a production domain (e.g., *.vercel.app, custom domain)
  if (typeof window !== 'undefined' && !isLocalhost) {
    // If VITE_API_URL is missing or incorrectly set to localhost, fallback to live Render backend
    if (
      !envUrl ||
      typeof envUrl !== 'string' ||
      envUrl.trim() === '' ||
      envUrl.includes('localhost') ||
      envUrl.includes('127.0.0.1')
    ) {
      return 'https://problempool.onrender.com/api';
    }
  }

  // Fallback for local development if VITE_API_URL is not provided
  let url = envUrl;
  if (!url || typeof url !== 'string' || url.trim() === '') {
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
 * Helper wrapper for network fetch with friendlier error handling
 */
const safeFetch = async (endpoint, options = {}) => {
  const baseUrl = getApiBaseUrl();
  const fullUrl = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  try {
    const response = await fetch(fullUrl, options);
    return await handleApiResponse(response);
  } catch (error) {
    console.error(`API Request to ${fullUrl} failed:`, error);
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error(
        'Unable to reach backend server. Please verify your connection or allow a moment for the server to wake up.'
      );
    }
    throw error;
  }
};

/**
 * Register a new user
 * @param {Object} userData - { name, email, password }
 */
export const signupUser = async (userData) => {
  return await safeFetch('/auth/signup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });
};

/**
 * Login user and receive token
 * @param {Object} credentials - { email, password }
 */
export const loginUser = async (credentials) => {
  return await safeFetch('/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });
};

/**
 * Get current authenticated user profile
 * @param {string} token - JWT Token
 */
export const getCurrentUser = async (token) => {
  const headers = {};
  if (token && token !== 'null' && token !== 'undefined') {
    headers.Authorization = `Bearer ${token.trim()}`;
  }

  return await safeFetch('/auth/me', {
    headers,
  });
};

/**
 * Fetch all problems (newest first)
 */
export const getProblems = async () => {
  return await safeFetch('/problems');
};

/**
 * Fetch a single problem by ID
 * @param {string} id - MongoDB ObjectId
 */
export const getProblem = async (id) => {
  return await safeFetch(`/problems/${id}`);
};

/**
 * Create a new problem (Protected)
 * @param {Object} problemData - { title, description, category, location }
 * @param {string} token - JWT Token
 */
export const createProblem = async (problemData, token) => {
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token && token !== 'null' && token !== 'undefined') {
    headers.Authorization = `Bearer ${token.trim()}`;
  }

  return await safeFetch('/problems', {
    method: 'POST',
    headers,
    body: JSON.stringify(problemData),
  });
};

/**
 * Delete a problem by ID
 * @param {string} id - MongoDB ObjectId
 * @param {string} [token] - Optional JWT Token
 */
export const deleteProblem = async (id, token) => {
  const headers = {};
  if (token && token !== 'null' && token !== 'undefined') {
    headers.Authorization = `Bearer ${token.trim()}`;
  }

  return await safeFetch(`/problems/${id}`, {
    method: 'DELETE',
    headers,
  });
};

/**
 * Fetch problems by category
 * @param {string} category
 */
export const getProblemsByCategory = async (category) => {
  return await safeFetch(`/problems/category/${encodeURIComponent(category)}`);
};

/**
 * Fetch all answers for a given problem
 * @param {string} problemId - MongoDB Problem ObjectId
 */
export const getProblemAnswers = async (problemId) => {
  return await safeFetch(`/problems/${problemId}/answers`);
};

/**
 * Submit an answer to a problem (Protected)
 * @param {string} problemId - MongoDB Problem ObjectId
 * @param {string} content - Answer text content
 * @param {string} token - JWT Token
 */
export const submitAnswer = async (problemId, content, token) => {
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token && token !== 'null' && token !== 'undefined') {
    headers.Authorization = `Bearer ${token.trim()}`;
  }

  return await safeFetch(`/problems/${problemId}/answers`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ content }),
  });
};

export const createAnswer = submitAnswer;

/**
 * Delete an answer from a problem (Protected)
 * @param {string} problemId - MongoDB Problem ObjectId
 * @param {string} answerId - MongoDB Answer ObjectId
 * @param {string} token - JWT Token
 */
export const deleteAnswer = async (problemId, answerId, token) => {
  const headers = {};
  if (token && token !== 'null' && token !== 'undefined') {
    headers.Authorization = `Bearer ${token.trim()}`;
  }

  return await safeFetch(`/problems/${problemId}/answers/${answerId}`, {
    method: 'DELETE',
    headers,
  });
};
