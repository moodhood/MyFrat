const API_BASE = 'http://localhost:3000/api';

export async function register(data) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function login(data) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function fetchProfile(token) {
  const res = await fetch(`${API_BASE}/profile`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function listEvents() {
  const res = await fetch(`${API_BASE}/events`, {
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  })
  return res.json()
}

export async function createEvent(data) {
  const res = await fetch(`${API_BASE}/events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify(data)
  })
  return res.json()
}

export async function updateEvent(id, data) {
  const res = await fetch(`${API_BASE}/events/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify(data)
  })
  return res.json()
}

export async function deleteEvent(id) {
  await fetch(`${API_BASE}/events/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`
    }
  })
}

// Duties
export async function listDuties() {
  const res = await fetch(`${API_BASE}/duties`, {
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  })
  return res.json()
}

export async function assignDuty(data) {
  const res = await fetch(`${API_BASE}/duties`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify(data)
  })
  return res.json()
}

export async function updateDuty(id, data) {
  const res = await fetch(`${API_BASE}/duties/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify(data)
  })
  return res.json()
}

export async function deleteDuty(id) {
  await fetch(`${API_BASE}/duties/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`
    }
  })
}

// Users (for officer dropdown)
export async function listUsers() {
  const res = await fetch(`${API_BASE}/users`, {
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  })
  return res.json()
}

// Philanthropy Logs
export async function listLogs() {
  const res = await fetch(`${API_BASE}/philanthropy`, {
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  })
  return res.json()
}

export async function createLog(data) {
  const res = await fetch(`${API_BASE}/philanthropy`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify(data)
  })
  return res.json()
}

export async function updateLog(id, data) {
  const res = await fetch(`${API_BASE}/philanthropy/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify(data)
  })
  return res.json()
}

export async function deleteLog(id) {
  await fetch(`${API_BASE}/philanthropy/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`
    }
  })
}
