const API_BASE_URL = 'http://localhost:4000';

const request = async (path, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'API request failed');
  }

  return response.json();
};

export const createOrUpdateUser = (user) =>
  request('/users', {
    method: 'POST',
    body: JSON.stringify(user),
  });

export const registerDevice = (device) =>
  request('/devices', {
    method: 'POST',
    body: JSON.stringify(device),
  });

export const createSession = (session) =>
  request('/sessions', {
    method: 'POST',
    body: JSON.stringify(session),
  });

export const createReading = (reading) =>
  request('/readings', {
    method: 'POST',
    body: JSON.stringify(reading),
  });

export const createAlert = (alert) =>
  request('/alerts', {
    method: 'POST',
    body: JSON.stringify(alert),
  });

export const getAlertsForUser = (user_id) =>
  request(`/alerts?user_id=${user_id}`);
