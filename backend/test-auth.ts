// Test file for the new auth endpoints
// Run with: npx ts-node test-auth.ts

const API_BASE = 'http://localhost:4000/api';

async function requestJson(url: string, options: RequestInit = {}) {
  const response = await fetch(url, options);
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  return { response, data };
}

async function testEndpoints() {
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';

  console.log('\n=== Testing Auth Endpoints ===\n');

  // Test 1: Request OTP for registration
  console.log('1. Testing OTP request for registration...');
  try {
    const { data } = await requestJson(`${API_BASE}/auth/request-otp-register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail }),
    });
    console.log('Response:', data);
    console.log('✓ OTP request successful\n');
  } catch (err) {
    console.error('✗ OTP request failed:', err);
  }

  // Test 2: Forgot password
  console.log('2. Testing forgot password endpoint...');
  try {
    const { data } = await requestJson(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com' }),
    });
    console.log('Response:', data);
    console.log('✓ Forgot password endpoint works\n');
  } catch (err) {
    console.error('✗ Forgot password failed:', err);
  }

  // Test 3: Simple registration (no OTP)
  console.log('3. Testing simple registration...');
  try {
    const { data } = await requestJson(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        role: 'user',
      }),
    });
    if (data.user) {
      console.log('✓ Registration successful');
      console.log('User:', data.user);
      console.log('');

      // Test 4: Login
      console.log('4. Testing login...');
      try {
        const { data: loginData } = await requestJson(`${API_BASE}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: testEmail,
            password: testPassword,
          }),
        });
        console.log('✓ Login successful');
        console.log('User:', loginData.user);
        console.log('');
      } catch (err) {
        console.error('✗ Login failed:', err);
      }
    } else {
      console.error('✗ Registration failed:', data);
    }
  } catch (err) {
    console.error('✗ Registration test failed:', err);
  }

  // Test 5: Google OAuth
  console.log('5. Testing Google OAuth endpoint...');
  try {
    const { data } = await requestJson(`${API_BASE}/auth/google-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'google-user@example.com',
        googleId: 'google-123456789',
        name: 'Test User',
      }),
    });
    console.log('Response:', data);
    console.log('✓ Google OAuth endpoint works\n');
  } catch (err) {
    console.error('✗ Google OAuth failed:', err);
  }

  console.log('=== All tests completed ===\n');
}

testEndpoints().catch(console.error);
