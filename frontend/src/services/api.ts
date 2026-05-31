const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

const processQueue = (token: string) => {
  refreshQueue.forEach((cb) => cb(token));
  refreshQueue = [];
};

export const getStoredTokens = () => {
  return {
    accessToken: localStorage.getItem('accessToken'),
    refreshToken: localStorage.getItem('refreshToken'),
  };
};

export const setStoredTokens = (accessToken: string, refreshToken: string) => {
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
};

export const clearStoredTokens = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
};

export class APIClient {
  public static async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const headers = new Headers(options.headers || {});
    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    const { accessToken } = getStoredTokens();
    if (accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`);
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    let response = await fetch(url, config);

    if (response.status === 401) {
      let errorData;
      try {
        errorData = await response.clone().json();
      } catch (e) {
      }

      if (errorData && (errorData.code === 'TOKEN_EXPIRED' || errorData.code === 'UNAUTHORIZED')) {
        const { refreshToken } = getStoredTokens();
        
        if (!refreshToken) {
          clearStoredTokens();
          window.dispatchEvent(new Event('auth-logout'));
          throw new Error('Access session has expired and no refresh token was found.');
        }

        if (isRefreshing) {
          return new Promise<T>((resolve, reject) => {
            refreshQueue.push((newToken: string) => {
              headers.set('Authorization', `Bearer ${newToken}`);
              fetch(url, { ...options, headers })
                .then((res) => {
                  if (!res.ok) {
                    return res.json().then((err) => reject(err));
                  }
                  return res.json().then((data) => resolve(data.data as T));
                })
                .catch((err) => reject(err));
            });
          });
        }

        isRefreshing = true;

        try {
          const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refreshToken }),
          });

          if (!refreshRes.ok) {
            clearStoredTokens();
            window.dispatchEvent(new Event('auth-logout'));
            throw new Error('Your session has expired. Please log in again.');
          }

          const refreshPayload = await refreshRes.json();
          const { accessToken: newAccess, refreshToken: newRefresh } = refreshPayload.data;
          
          setStoredTokens(newAccess, newRefresh);
          isRefreshing = false;
          
          processQueue(newAccess);

          headers.set('Authorization', `Bearer ${newAccess}`);
          const retryResponse = await fetch(url, { ...options, headers });
          
          if (!retryResponse.ok) {
            const errBody = await retryResponse.json();
            throw errBody;
          }
          
          const retryData = await retryResponse.json();
          return retryData.data as T;
        } catch (refreshError) {
          isRefreshing = false;
          refreshQueue = [];
          clearStoredTokens();
          window.dispatchEvent(new Event('auth-logout'));
          throw refreshError;
        }
      }
    }

    if (!response.ok) {
      let errorBody;
      try {
        errorBody = await response.json();
      } catch (e) {
        throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
      }
      throw errorBody;
    }

    const responsePayload = await response.json();
    return responsePayload.data as T;
  }

  public static get<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  public static post<T = any>(endpoint: string, body?: any, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public static patch<T = any>(endpoint: string, body?: any, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public static delete<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}
