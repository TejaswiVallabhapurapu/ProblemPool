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
        : response.status === 403
        ? 'You are not authorized to perform this action'
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
 * Fetch / Search all problems with advanced filters & sorting
 * @param {Object} [params] - { q, category, tag, status, sort }
 * @param {string} [token] - Optional JWT Token
 */
export const getProblems = async (params = {}, token = null) => {
  const queryParts = [];
  if (params && typeof params === 'object') {
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(val)}`);
      }
    });
  }

  const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
  const headers = {};
  if (token && token !== 'null' && token !== 'undefined') {
    headers.Authorization = `Bearer ${token.trim()}`;
  }

  return await safeFetch(`/problems${queryString}`, { headers });
};

export const searchProblems = getProblems;

/**
 * Fetch trending problems based on recent activity & engagement
 * @param {Object} [params] - { page, limit }
 * @param {string} [token]
 */
export const getTrendingProblems = async (params = {}, token = null) => {
  const queryParts = [];
  if (params && typeof params === 'object') {
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(val)}`);
      }
    });
  }
  const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
  const headers = {};
  if (token && token !== 'null' && token !== 'undefined') {
    headers.Authorization = `Bearer ${token.trim()}`;
  }

  return await safeFetch(`/problems/trending${queryString}`, { headers });
};

/**
 * Fetch popular problems ranked by views & answers
 * @param {Object} [params]
 * @param {string} [token]
 */
export const getPopularProblems = async (params = {}, token = null) => {
  const queryParts = [];
  if (params && typeof params === 'object') {
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(val)}`);
      }
    });
  }
  const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
  const headers = {};
  if (token && token !== 'null' && token !== 'undefined') {
    headers.Authorization = `Bearer ${token.trim()}`;
  }

  return await safeFetch(`/problems/popular${queryString}`, { headers });
};

/**
 * Fetch popular tags across problems
 */
export const getPopularTags = async () => {
  return await safeFetch('/problems/tags');
};

/**
 * Fetch problems by tag
 * @param {string} tag
 * @param {string} [token]
 */
export const getProblemsByTag = async (tag, token = null) => {
  const headers = {};
  if (token && token !== 'null' && token !== 'undefined') {
    headers.Authorization = `Bearer ${token.trim()}`;
  }

  return await safeFetch(`/problems/tag/${encodeURIComponent(tag)}`, { headers });
};

/**
 * Fetch a single problem by ID
 * @param {string} id - MongoDB ObjectId
 */
export const getProblem = async (id) => {
  return await safeFetch(`/problems/${id}`);
};

/**
 * Create a new problem with tags & category (Protected)
 * @param {Object} problemData - { title, description, category, location, tags }
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
 * Update an existing problem (Protected - Problem Creator Only)
 * @param {string} id
 * @param {Object} problemData
 * @param {string} token
 */
export const updateProblem = async (id, problemData, token) => {
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token && token !== 'null' && token !== 'undefined') {
    headers.Authorization = `Bearer ${token.trim()}`;
  }

  return await safeFetch(`/problems/${id}`, {
    method: 'PUT',
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
 * Mark an answer as the Best Answer for a problem (Protected - Problem Owner Only)
 * @param {string} problemId
 * @param {string} answerId
 * @param {string} token
 */
export const setBestAnswer = async (problemId, answerId, token) => {
  const headers = {};
  if (token && token !== 'null' && token !== 'undefined') {
    headers.Authorization = `Bearer ${token.trim()}`;
  }

  return await safeFetch(`/problems/${problemId}/best-answer/${answerId}`, {
    method: 'PUT',
    headers,
  });
};

/**
 * Remove Best Answer designation for a problem (Protected - Problem Owner Only)
 * @param {string} problemId
 * @param {string} token
 */
export const removeBestAnswer = async (problemId, token) => {
  const headers = {};
  if (token && token !== 'null' && token !== 'undefined') {
    headers.Authorization = `Bearer ${token.trim()}`;
  }

  return await safeFetch(`/problems/${problemId}/best-answer`, {
    method: 'DELETE',
    headers,
  });
};

/**
 * Fetch all answers for a given problem with sorting and user vote status
 * @param {string} problemId - MongoDB Problem ObjectId
 * @param {string} [sort='best_answer'] - 'best_answer' | 'most_helpful' | 'newest' | 'oldest'
 * @param {string} [token] - Optional JWT Token
 */
export const getProblemAnswers = async (problemId, sort = 'best_answer', token = null) => {
  const headers = {};
  if (token && token !== 'null' && token !== 'undefined') {
    headers.Authorization = `Bearer ${token.trim()}`;
  }

  return await safeFetch(`/problems/${problemId}/answers?sort=${encodeURIComponent(sort)}`, {
    headers,
  });
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

/**
 * Vote Helpful or Not Helpful on an answer (Protected)
 * @param {string} answerId
 * @param {'helpful' | 'not_helpful'} voteType
 * @param {string} token
 */
export const voteAnswer = async (answerId, voteType, token) => {
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token && token !== 'null' && token !== 'undefined') {
    headers.Authorization = `Bearer ${token.trim()}`;
  }

  return await safeFetch(`/answers/${answerId}/vote`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ voteType }),
  });
};

/**
 * Remove active vote on an answer (Protected)
 * @param {string} answerId
 * @param {string} token
 */
export const removeAnswerVote = async (answerId, token) => {
  const headers = {};
  if (token && token !== 'null' && token !== 'undefined') {
    headers.Authorization = `Bearer ${token.trim()}`;
  }

  return await safeFetch(`/answers/${answerId}/vote`, {
    method: 'DELETE',
    headers,
  });
};

/**
 * Get all reviews for an answer (with optional user token)
 * @param {string} answerId
 * @param {string} [sort='most_helpful'] - 'most_helpful' | 'newest' | 'oldest'
 * @param {string} [token]
 */
export const getAnswerReviews = async (answerId, sort = 'most_helpful', token = null) => {
  const headers = {};
  if (token && token !== 'null' && token !== 'undefined') {
    headers.Authorization = `Bearer ${token.trim()}`;
  }

  return await safeFetch(`/answers/${answerId}/reviews?sort=${encodeURIComponent(sort)}`, {
    headers,
  });
};

/**
 * Submit a review on an answer (Protected)
 * @param {string} answerId
 * @param {string} content
 * @param {string} token
 */
export const createAnswerReview = async (answerId, content, token) => {
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token && token !== 'null' && token !== 'undefined') {
    headers.Authorization = `Bearer ${token.trim()}`;
  }

  return await safeFetch(`/answers/${answerId}/reviews`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ content }),
  });
};

/**
 * Update an existing review (Protected - Author only)
 * @param {string} reviewId
 * @param {string} content
 * @param {string} token
 */
export const updateReview = async (reviewId, content, token) => {
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token && token !== 'null' && token !== 'undefined') {
    headers.Authorization = `Bearer ${token.trim()}`;
  }

  return await safeFetch(`/reviews/${reviewId}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ content }),
  });
};

/**
 * Delete an existing review (Protected - Author only)
 * @param {string} reviewId
 * @param {string} token
 */
export const deleteReview = async (reviewId, token) => {
  const headers = {};
  if (token && token !== 'null' && token !== 'undefined') {
    headers.Authorization = `Bearer ${token.trim()}`;
  }

  return await safeFetch(`/reviews/${reviewId}`, {
    method: 'DELETE',
    headers,
  });
};

/**
 * Vote Helpful on a review (Protected)
 * @param {string} reviewId
 * @param {string} token
 */
export const voteReview = async (reviewId, token) => {
  const headers = {};
  if (token && token !== 'null' && token !== 'undefined') {
    headers.Authorization = `Bearer ${token.trim()}`;
  }

  return await safeFetch(`/reviews/${reviewId}/vote`, {
    method: 'POST',
    headers,
  });
};

/**
 * Remove Helpful vote on a review (Protected)
 * @param {string} reviewId
 * @param {string} token
 */
export const removeReviewVote = async (reviewId, token) => {
  const headers = {};
  if (token && token !== 'null' && token !== 'undefined') {
    headers.Authorization = `Bearer ${token.trim()}`;
  }

  return await safeFetch(`/reviews/${reviewId}/vote`, {
    method: 'DELETE',
    headers,
  });
};

/**
 * Get all replies for a review
 * @param {string} reviewId
 */
export const getReviewReplies = async (reviewId) => {
  return await safeFetch(`/reviews/${reviewId}/replies`);
};

/**
 * Submit a reply to a review (Protected)
 * @param {string} reviewId
 * @param {string} content
 * @param {string} token
 */
export const createReviewReply = async (reviewId, content, token) => {
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token && token !== 'null' && token !== 'undefined') {
    headers.Authorization = `Bearer ${token.trim()}`;
  }

  return await safeFetch(`/reviews/${reviewId}/replies`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ content }),
  });
};

/**
 * Update an existing reply (Protected - Author only)
 * @param {string} replyId
 * @param {string} content
 * @param {string} token
 */
export const updateReply = async (replyId, content, token) => {
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token && token !== 'null' && token !== 'undefined') {
    headers.Authorization = `Bearer ${token.trim()}`;
  }

  return await safeFetch(`/replies/${replyId}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ content }),
  });
};

/**
 * Delete an existing reply (Protected - Author only)
 * @param {string} replyId
 * @param {string} token
 */
export const deleteReply = async (replyId, token) => {
  const headers = {};
  if (token && token !== 'null' && token !== 'undefined') {
    headers.Authorization = `Bearer ${token.trim()}`;
  }

  return await safeFetch(`/replies/${replyId}`, {
    method: 'DELETE',
    headers,
  });
};

/**
 * Save a problem for later (Protected)
 * @param {string} problemId
 * @param {string} token
 */
export const saveProblem = async (problemId, token) => {
  const headers = {};
  if (token && token !== 'null' && token !== 'undefined') {
    headers.Authorization = `Bearer ${token.trim()}`;
  }

  return await safeFetch(`/problems/${problemId}/save`, {
    method: 'POST',
    headers,
  });
};

/**
 * Remove a problem from saved (Protected)
 * @param {string} problemId
 * @param {string} token
 */
export const unsaveProblem = async (problemId, token) => {
  const headers = {};
  if (token && token !== 'null' && token !== 'undefined') {
    headers.Authorization = `Bearer ${token.trim()}`;
  }

  return await safeFetch(`/problems/${problemId}/save`, {
    method: 'DELETE',
    headers,
  });
};

/**
 * Get all saved problems for the current user (Protected)
 * @param {string} token
 */
export const getMySavedProblems = async (token) => {
  const headers = {};
  if (token && token !== 'null' && token !== 'undefined') {
    headers.Authorization = `Bearer ${token.trim()}`;
  }

  return await safeFetch('/users/me/saved-problems', {
    headers,
  });
};

/**
 * Get list of saved problem IDs for the current user for quick lookup (Protected)
 * @param {string} token
 */
export const getMySavedProblemIds = async (token) => {
  const headers = {};
  if (token && token !== 'null' && token !== 'undefined') {
    headers.Authorization = `Bearer ${token.trim()}`;
  }

  return await safeFetch('/users/me/saved-problems/ids', {
    headers,
  });
};

/**
 * Get complete profile statistics, reputation, level, achievements, and completion
 * @param {string} token
 */
export const getMyProfileStats = async (token) => {
  const headers = {};
  if (token && token !== 'null' && token !== 'undefined') {
    headers.Authorization = `Bearer ${token.trim()}`;
  }

  return await safeFetch('/users/me/stats', {
    headers,
  });
};

/**
 * Update user profile details (name, username, bio, location, title, avatar)
 * @param {Object} profileData
 * @param {string} token
 */
export const updateMyProfile = async (profileData, token) => {
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token && token !== 'null' && token !== 'undefined') {
    headers.Authorization = `Bearer ${token.trim()}`;
  }

  return await safeFetch('/users/me/profile', {
    method: 'PUT',
    headers,
    body: JSON.stringify(profileData),
  });
};

/**
 * Get user reputation history events
 * @param {string} token
 */
export const getMyReputationHistory = async (token) => {
  const headers = {};
  if (token && token !== 'null' && token !== 'undefined') {
    headers.Authorization = `Bearer ${token.trim()}`;
  }

  return await safeFetch('/users/me/reputation-history', {
    headers,
  });
};

/**
 * Get user activity timeline
 * @param {string} token
 */
export const getMyActivityTimeline = async (token) => {
  const headers = {};
  if (token && token !== 'null' && token !== 'undefined') {
    headers.Authorization = `Bearer ${token.trim()}`;
  }

  return await safeFetch('/users/me/activity', {
    headers,
  });
};

/**
 * Get problems posted by current user
 * @param {string} token
 */
export const getMyProblems = async (token) => {
  const headers = {};
  if (token && token !== 'null' && token !== 'undefined') {
    headers.Authorization = `Bearer ${token.trim()}`;
  }

  return await safeFetch('/users/me/problems', {
    headers,
  });
};

/**
 * Get answers posted by current user
 * @param {string} token
 */
export const getMyAnswers = async (token) => {
  const headers = {};
  if (token && token !== 'null' && token !== 'undefined') {
    headers.Authorization = `Bearer ${token.trim()}`;
  }

  return await safeFetch('/users/me/answers', {
    headers,
  });
};

/**
 * Get public profile by username or userId
 * @param {string} idOrUsername
 * @param {string} [token]
 */
export const getPublicUserProfile = async (idOrUsername, token = null) => {
  const headers = {};
  if (token && token !== 'null' && token !== 'undefined') {
    headers.Authorization = `Bearer ${token.trim()}`;
  }
  return await safeFetch(`/users/profile/${encodeURIComponent(idOrUsername)}`, { headers });
};

/**
 * Get list of followers for a user
 * @param {string} idOrUsername
 * @param {string} [token]
 */
export const getUserFollowers = async (idOrUsername, token = null) => {
  const headers = {};
  if (token && token !== 'null' && token !== 'undefined') {
    headers.Authorization = `Bearer ${token.trim()}`;
  }
  return await safeFetch(`/users/profile/${encodeURIComponent(idOrUsername)}/followers`, { headers });
};

/**
 * Get list of users followed by a user
 * @param {string} idOrUsername
 * @param {string} [token]
 */
export const getUserFollowing = async (idOrUsername, token = null) => {
  const headers = {};
  if (token && token !== 'null' && token !== 'undefined') {
    headers.Authorization = `Bearer ${token.trim()}`;
  }
  return await safeFetch(`/users/profile/${encodeURIComponent(idOrUsername)}/following`, { headers });
};

/**
 * Update user learning/domain interests (Protected)
 * @param {Array<string>} interests
 * @param {string} token
 */
export const updateUserInterests = async (interests, token) => {
  const headers = {};
  if (token && token !== 'null' && token !== 'undefined') {
    headers.Authorization = `Bearer ${token.trim()}`;
  }
  return await safeFetch('/users/me/interests', {
    method: 'PUT',
    headers,
    body: JSON.stringify({ interests }),
  });
};

/**
 * Get Personalized Feed for Home page (Recommended, Following, Trending, Unanswered, Recent)
 * @param {string} [token]
 */
export const getPersonalizedFeed = async (token = null) => {
  const headers = {};
  if (token && token !== 'null' && token !== 'undefined') {
    headers.Authorization = `Bearer ${token.trim()}`;
  }
  return await safeFetch('/problems/feed', { headers });
};

/**
 * Follow or unfollow a user (Protected)
 * @param {string} userId
 * @param {string} token
 */
export const followUser = async (userId, token) => {
  const headers = {};
  if (token && token !== 'null' && token !== 'undefined') {
    headers.Authorization = `Bearer ${token.trim()}`;
  }

  return await safeFetch(`/users/${userId}/follow`, {
    method: 'POST',
    headers,
  });
};

/**
 * Get notifications for authenticated user
 * @param {Object} [params] - { page, limit, unreadOnly }
 * @param {string} token
 */
export const getNotifications = async (params = {}, token = null) => {
  const queryParts = [];
  if (params && typeof params === 'object') {
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(val)}`);
      }
    });
  }
  const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';

  const headers = {};
  if (token && token !== 'null' && token !== 'undefined') {
    headers.Authorization = `Bearer ${token.trim()}`;
  }

  return await safeFetch(`/notifications${queryString}`, { headers });
};

/**
 * Get unread notification count
 * @param {string} token
 */
export const getUnreadNotificationCount = async (token) => {
  const headers = {};
  if (token && token !== 'null' && token !== 'undefined') {
    headers.Authorization = `Bearer ${token.trim()}`;
  }

  return await safeFetch('/notifications/unread-count', { headers });
};

/**
 * Mark a single notification as read
 * @param {string} id - Notification ID
 * @param {string} token
 */
export const markNotificationAsRead = async (id, token) => {
  const headers = {};
  if (token && token !== 'null' && token !== 'undefined') {
    headers.Authorization = `Bearer ${token.trim()}`;
  }

  return await safeFetch(`/notifications/${id}/read`, {
    method: 'PUT',
    headers,
  });
};

/**
 * Mark all notifications as read
 * @param {string} token
 */
export const markAllNotificationsAsRead = async (token) => {
  const headers = {};
  if (token && token !== 'null' && token !== 'undefined') {
    headers.Authorization = `Bearer ${token.trim()}`;
  }

  return await safeFetch('/notifications/read-all', {
    method: 'PUT',
    headers,
  });
};

/**
 * Delete a single notification
 * @param {string} id - Notification ID
 * @param {string} token
 */
export const deleteNotification = async (id, token) => {
  const headers = {};
  if (token && token !== 'null' && token !== 'undefined') {
    headers.Authorization = `Bearer ${token.trim()}`;
  }

  return await safeFetch(`/notifications/${id}`, {
    method: 'DELETE',
    headers,
  });
};

/**
 * Clear all read notifications
 * @param {string} token
 */
export const clearAllNotifications = async (token) => {
  const headers = {};
  if (token && token !== 'null' && token !== 'undefined') {
    headers.Authorization = `Bearer ${token.trim()}`;
  }

  return await safeFetch('/notifications/clear-read', {
    method: 'DELETE',
    headers,
  });
};


