const API_URL = 'https://chatflow-production-fd36.up.railway.app';

export async function login(email: string, password: string) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
}

export async function register(username: string, email: string, password: string) {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password }),
  });
  return res.json();
}

export async function searchUsers(username: string) {
  const res = await fetch(`${API_URL}/users/search?username=${username}`);
  return res.json();
}

export async function getConversation(userId1: string, userId2: string) {
  const res = await fetch(`${API_URL}/chats/conversation/${userId1}/${userId2}`);
  return res.json();
}

export async function sendMessage(senderId: string, receiverId: string, content: string) {
  const res = await fetch(`${API_URL}/chats/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ senderId, receiverId, content }),
  });
  return res.json();
}