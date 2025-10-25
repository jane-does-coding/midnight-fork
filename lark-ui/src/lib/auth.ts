import { PUBLIC_API_URL } from "$env/static/public";

const apiUrl = PUBLIC_API_URL || '';

export async function checkAuthStatus() {
  const response = await fetch(`${apiUrl}/api/user/auth/me`, {
    credentials: 'include'
  });
  
  if (response.ok) {
    const userData = await response.json();
    return userData as {
        userId: string;
        email: string;
        username: string;
        name: string;
        birthday: Date;
        role: string;
        onboardComplete: boolean;
        createdAt: Date;
        updatedAt: Date;
    };
  } else {
    return null;
  }
}
