/* ============================================
   Ipvideo - Auth Utilities (Production API)
   ============================================ */

function getToken() {
  return localStorage.getItem('ipvideo_token');
}

function setToken(token) {
  localStorage.setItem('ipvideo_token', token);
}

function getUser() {
  try {
    return JSON.parse(localStorage.getItem('ipvideo_user'));
  } catch {
    return null;
  }
}

function setUser(user) {
  localStorage.setItem('ipvideo_user', JSON.stringify(user));
}

function isAuthenticated() {
  return !!getToken() && !!getUser();
}

function checkAuth() {
  if (!isAuthenticated()) {
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

async function loginUser(email, password) {
  try {
    const data = await authAPI.login({ email, password });
    if (data.success && data.token) {
      setToken(data.token);
      setUser(data.user);
      return true;
    }
    return false;
  } catch (err) {
    console.error('Login error:', err);
    throw err;
  }
}

async function registerUser(userData) {
  try {
    const data = await authAPI.register(userData);
    if (data.success && data.token) {
      setToken(data.token);
      setUser(data.user);
      return true;
    }
    return false;
  } catch (err) {
    console.error('Register error:', err);
    throw err;
  }
}

function logout() {
  localStorage.removeItem('ipvideo_token');
  localStorage.removeItem('ipvideo_user');
  window.location.href = 'index.html';
}

// Load user on page load if token exists
async function loadUser() {
  if (getToken()) {
    try {
      const data = await authAPI.me();
      if (data.success && data.user) {
        setUser(data.user);
        return data.user;
      }
    } catch {
      logout();
    }
  }
  return null;
}
