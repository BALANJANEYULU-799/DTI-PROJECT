document.addEventListener('DOMContentLoaded', () => {
    // Ensure initial state: hide all forms except login
    document.getElementById('signupForm').classList.add('hidden');
    document.getElementById('otpForm').classList.add('hidden');
    document.getElementById('profileContent').classList.add('hidden');
    document.getElementById('loginForm').classList.remove('hidden');

    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
        console.log('User found in localStorage:', user);
        updateUIAfterLogin(user);
    } else {
        console.log('No user in localStorage, showing login form');
        showLogin();
    }
});

function updateUIAfterLogin(user) {
    // Hide all other forms
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('signupForm').classList.add('hidden');
    document.getElementById('otpForm').classList.add('hidden');
    
    // Show profile content
    const profileContent = document.getElementById('profileContent');
    profileContent.classList.remove('hidden');
    
    const profileMessage = document.getElementById('profileMessage');
    profileMessage.innerHTML = `
        Welcome, ${user.username}!<br>
        Email: ${user.email}<br>
        User ID: ${user.userId}
    `;
    profileMessage.style.color = '#263238';
    console.log('UI updated after login:', user.username);
    
    // Ensure dropdown is visible
    document.getElementById('profileDropdown').classList.remove('hidden');
}

function showSignup() {
    // Hide all other forms
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('otpForm').classList.add('hidden');
    document.getElementById('profileContent').classList.add('hidden');
    
    // Show signup form
    document.getElementById('signupForm').classList.remove('hidden');
    clearMessages();
}

function showLogin() {
    // Hide all other forms
    document.getElementById('signupForm').classList.add('hidden');
    document.getElementById('otpForm').classList.add('hidden');
    document.getElementById('profileContent').classList.add('hidden');
    
    // Show login form
    document.getElementById('loginForm').classList.remove('hidden');
    document.getElementById('profileDropdown').classList.remove('hidden');
    clearMessages();
}

function showOtpForm() {
    // Hide all other forms
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('signupForm').classList.add('hidden');
    document.getElementById('profileContent').classList.add('hidden');
    
    // Show OTP form
    document.getElementById('otpForm').classList.remove('hidden');
    clearMessages();
}

function clearMessages() {
    document.getElementById('authMessage').textContent = '';
    document.getElementById('signupMessage').textContent = '';
    document.getElementById('otpMessage').textContent = '';
    document.getElementById('profileMessage').innerHTML = '';
}

async function signup() {
    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value.trim();
    const signupMessage = document.getElementById('signupMessage');

    if (!username || !email || !password) {
        signupMessage.textContent = 'Please fill in all fields';
        signupMessage.style.color = '#ff4444';
        return;
    }

    signupMessage.textContent = 'Creating account...';
    try {
        const response = await fetch('/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });
        const data = await response.json();
        console.log('Signup response:', data);
        if (response.ok) {
            signupMessage.textContent = 'Check your email for OTP!';
            signupMessage.style.color = '#4caf50';
            showOtpForm();
            localStorage.setItem('pendingUser', JSON.stringify({ email, type: 'signup' }));
        } else {
            signupMessage.textContent = data.error;
            signupMessage.style.color = '#ff4444';
        }
    } catch (error) {
        signupMessage.textContent = 'Signup failed: ' + error.message;
        signupMessage.style.color = '#ff4444';
        console.error('Signup error:', error);
    }
}

async function login() {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    const authMessage = document.getElementById('authMessage');

    if (!email || !password) {
        authMessage.textContent = 'Please fill in all fields';
        authMessage.style.color = '#ff4444';
        return;
    }

    authMessage.textContent = 'Signing in...';
    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        console.log('Login response:', data);
        if (response.ok && data.message === 'OTP sent') {
            authMessage.textContent = 'Check your email for OTP!';
            authMessage.style.color = '#4caf50';
            showOtpForm();
            localStorage.setItem('pendingUser', JSON.stringify({ email, type: 'login' }));
        } else if (response.ok) {
            const userData = { ...data, email };
            localStorage.setItem('user', JSON.stringify(userData));
            updateUIAfterLogin(userData);
        } else {
            authMessage.textContent = data.error;
            authMessage.style.color = '#ff4444';
        }
    } catch (error) {
        authMessage.textContent = 'Login failed: ' + error.message;
        authMessage.style.color = '#ff4444';
        console.error('Login error:', error);
    }
}

async function verifyOtp() {
    const pendingUser = JSON.parse(localStorage.getItem('pendingUser'));
    const email = pendingUser?.email;
    const type = pendingUser?.type;
    const otp = document.getElementById('otp').value.trim();
    const otpMessage = document.getElementById('otpMessage');

    if (!otp) {
        otpMessage.textContent = 'Please enter the OTP';
        otpMessage.style.color = '#ff4444';
        return;
    }

    otpMessage.textContent = 'Verifying...';
    try {
        const response = await fetch('/verify-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, otp, type })
        });
        const data = await response.json();
        console.log('OTP verification response:', data);
        if (response.ok) {
            const userData = { ...data, email };
            localStorage.setItem('user', JSON.stringify(userData));
            localStorage.removeItem('pendingUser');
            updateUIAfterLogin(userData);
        } else {
            otpMessage.textContent = data.error;
            otpMessage.style.color = '#ff4444';
        }
    } catch (error) {
        otpMessage.textContent = 'Verification failed: ' + error.message;
        otpMessage.style.color = '#ff4444';
        console.error('OTP verification error:', error);
    }
}

async function resendOtp() {
    const pendingUser = JSON.parse(localStorage.getItem('pendingUser'));
    const email = pendingUser?.email;
    const type = pendingUser?.type;
    const otpMessage = document.getElementById('otpMessage');

    if (!email) {
        otpMessage.textContent = 'No pending session found.';
        otpMessage.style.color = '#ff4444';
        return;
    }

    otpMessage.textContent = 'Resending OTP...';
    try {
        const endpoint = type === 'signup' ? '/signup' : '/login';
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, resend: true })
        });
        const data = await response.json();
        if (response.ok) {
            otpMessage.textContent = 'OTP resent! Check your email.';
            otpMessage.style.color = '#4caf50';
        } else {
            otpMessage.textContent = data.error;
            otpMessage.style.color = '#ff4444';
        }
    } catch (error) {
        otpMessage.textContent = 'Resend failed: ' + error.message;
        otpMessage.style.color = '#ff4444';
        console.error('Resend OTP error:', error);
    }
}

function logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('pendingUser');
    
    // Hide all other forms
    document.getElementById('signupForm').classList.add('hidden');
    document.getElementById('otpForm').classList.add('hidden');
    document.getElementById('profileContent').classList.add('hidden');
    
    // Show login form
    document.getElementById('loginForm').classList.remove('hidden');
    document.getElementById('authMessage').textContent = 'Logged out successfully';
    document.getElementById('authMessage').style.color = '#4caf50';
    document.getElementById('profileDropdown').classList.remove('hidden');
    clearMessages();
}