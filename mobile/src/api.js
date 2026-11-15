// Set this to where your backend runs:
//  - Android emulator + backend on same PC: http://10.0.2.2:5000
//  - Real phone on same Wi-Fi: http://<your-PC-LAN-IP>:5000
//  - Deployed: https://your-app.example.com
export const BASE_URL = 'http://192.168.1.104:5000'; 

let token = null;
let onExpired = () => {};
export const setToken = t => { token = t; };
export const setOnExpired = f => { onExpired = f; };

export async function api(path, method = 'GET', body) {
  let r;
  try {
    r = await fetch(BASE_URL + '/api' + path, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch { throw new Error('Cannot reach the server. Check BASE_URL and your connection.'); }
  if (r.status === 401 && token) onExpired();
  if (!r.ok) {
    if (r.status === 401) throw new Error('Wrong username or password');
    if (r.status === 403) throw new Error('You do not have access to this');
    throw new Error(((await r.text()) || 'Something went wrong').replace(/^"|"$/g, ''));
  }
  return (r.headers.get('content-type') || '').includes('json') ? r.json() : null;
}
