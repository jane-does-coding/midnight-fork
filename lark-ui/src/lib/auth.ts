import { env } from "$env/dynamic/public";

const apiUrl = env.PUBLIC_API_URL || '';

export async function checkAuthStatus() {
  const response = await fetch(`${apiUrl}/api/user/auth/me`, {
    credentials: 'include'
  });
  
  if (response.ok) {
    const userData = await response.json();
    return userData as {
        userId: string;
        email: string;
        firstName: string;
        lastName: string;
        birthday: string;
        role: string;
        onboardComplete: boolean;
        createdAt: string;
        updatedAt: string;
    };
  } else {
    return null;
  }
}

async function updateUser() {
  const response = await fetch(`${apiUrl}/api/user`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      firstName: 'Jane',
      lastName: 'Smith',
      birthday: '1995-06-15',
      city: 'San Francisco'
    })
  });
}