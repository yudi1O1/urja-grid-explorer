import axios, { AxiosRequestConfig } from 'axios';
import { config } from '../config/env';
import { getSessionCookie, clearSession } from '../services/urjaAuth.service';

export const urjaClient = axios.create({
  baseURL: config.urjaBaseUrl,
  timeout: 10000,
});


const isAuthenticationFailure = (error: unknown): boolean => {
  if (axios.isAxiosError(error) && error.response) {
    return error.response.status === 401 || error.response.status === 403;
  }
  return false;
};

export const authenticatedUrjaGet = async <T>(
  url: string,
  requestConfig: AxiosRequestConfig = {}
): Promise<T> => {
  let cookie = await getSessionCookie();

  try {
    const response = await urjaClient.get<T>(url, {
      ...requestConfig,
      headers: {
        ...requestConfig.headers,
        Cookie: cookie,
      },
    });
    return response.data;
  } catch (error) {
    console.error(
      '[Urja Client] Request failed:',
      axios.isAxiosError(error) ? error.response?.status ?? 'network error' : 'unexpected error'
    );

    if (isAuthenticationFailure(error)) {
      clearSession();
      cookie = await getSessionCookie();

      const retryResponse = await urjaClient.get<T>(url, {
        ...requestConfig,
        headers: {
          ...requestConfig.headers,
          Cookie: cookie,
        },
      });
      return retryResponse.data;
    }
    throw error;
  }
};
