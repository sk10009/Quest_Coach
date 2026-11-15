const API_BASE = '/api/v1';

export async function fetchProfile() {
  const res = await fetch(`${API_BASE}/profile`);
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error(`Failed to fetch profile: ${res.statusText}`);
  }
  return res.json();
}

export async function setupProfile(payload) {
  const res = await fetch(`${API_BASE}/profile/setup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Profile setup failed');
  }
  return res.json();
}

export async function fetchPathway() {
  const res = await fetch(`${API_BASE}/pathway`);
  if (!res.ok) throw new Error('Failed to fetch pathway');
  return res.json();
}

export async function fetchLevelToday() {
  const res = await fetch(`${API_BASE}/level/today`);
  if (!res.ok) throw new Error('Failed to fetch daily level');
  return res.json();
}

export async function fetchCatalogue() {
  const res = await fetch(`${API_BASE}/catalogue`);
  if (!res.ok) throw new Error('Failed to fetch catalogue');
  return res.json();
}

export async function logExercise(payload) {
  const res = await fetch(`${API_BASE}/log/exercise`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to log exercise');
  return res.json();
}

export async function logFood(payload) {
  const res = await fetch(`${API_BASE}/log/food`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to log food');
  return res.json();
}

export async function logCustomMeal(payload) {
  const res = await fetch(`${API_BASE}/log/custom-meal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to create custom meal');
  return res.json();
}

export async function logMindful(payload) {
  const res = await fetch(`${API_BASE}/log/mindful`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to log mindful session');
  return res.json();
}

export async function skipTask(taskPillar) {
  const res = await fetch(`${API_BASE}/tokens/skip-task`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ task_pillar: taskPillar }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to skip task');
  }
  return res.json();
}

export async function activateRestDay() {
  const res = await fetch(`${API_BASE}/tokens/rest-day`, {
    method: 'POST',
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to activate rest day');
  }
  return res.json();
}
