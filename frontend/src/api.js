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

export async function fetchMealOverview(foodId) {
  const res = await fetch(`${API_BASE}/meal/${foodId}/overview`);
  if (!res.ok) throw new Error('Failed to fetch meal overview');
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

export async function resetProfile() {
  const res = await fetch(`${API_BASE}/profile/reset`, {
    method: 'POST',
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to reset profile');
  }
  return res.json();
}

export async function deleteFoodLog(entryId) {
  const res = await fetch(`${API_BASE}/log/food/${entryId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete food log');
  return res.json();
}

export async function deleteExerciseLog(entryId) {
  const res = await fetch(`${API_BASE}/log/exercise/${entryId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete exercise log');
  return res.json();
}

export async function deleteMindfulLog(entryId) {
  const res = await fetch(`${API_BASE}/log/mindful/${entryId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete mindful log');
  return res.json();
}

export async function defeatBoss() {
  const res = await fetch(`${API_BASE}/boss/defeat`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to defeat boss');
  return res.json();
}

export async function testAdvanceDay() {
  const res = await fetch(`${API_BASE}/test/advance-day`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to advance day');
  return res.json();
}

export async function testSimulateMissedDay() {
  const res = await fetch(`${API_BASE}/test/simulate-missed-day`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to simulate missed day');
  return res.json();
}

export async function fetchAgentTelemetry() {
  const res = await fetch(`${API_BASE}/test/agent-telemetry`);
  if (!res.ok) throw new Error('Failed to fetch agent telemetry');
  return res.json();
}

