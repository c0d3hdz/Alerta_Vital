// Si estás usando un teléfono físico, apunta al IP local de tu PC en la red Wi-Fi.
// Ejemplo: 'http://192.168.0.31:4000' si ese es el IP de tu máquina.
const API_BASE_URL = 'http://192.168.0.31:4000';

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
