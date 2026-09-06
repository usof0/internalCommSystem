import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryApi, BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { logout, setCredentials } from '../app/slices/authSlice';
import type { RootState } from '../app/store';

type RefreshResponse = {
  user: any;
  accessToken?: string;
  access_token?: string;
  token?: string;
  authz?: { permissions?: string[]; roles?: string[] };
  permissions?: string[];
  roles?: string[];
};

const rawBaseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1',
  credentials: 'include',
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.token;
    if (token) headers.set('authorization', `Bearer ${token}`);
    return headers;
  },
});

let refreshPromise: Promise<RefreshResponse | null> | null = null;

const getRequestUrl = (args: string | FetchArgs) => (typeof args === 'string' ? args : args.url);

const isPublicAuthRequest = (args: string | FetchArgs) => {
  const url = getRequestUrl(args);
  return url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/refresh');
};

const clearSession = (api: BaseQueryApi) => {
  api.dispatch(logout());
  api.dispatch({ type: 'RESET_RTK_QUERY' });
};

export const baseQueryWithAuth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error?.status === 401 && !isPublicAuthRequest(args)) {
    if (!refreshPromise) {
      refreshPromise = (async () => {
        const refreshResult = await rawBaseQuery(
          { url: '/auth/refresh', method: 'POST' },
          api,
          extraOptions,
        );

        if (refreshResult.error) return null;
        return refreshResult.data as RefreshResponse;
      })().finally(() => {
        refreshPromise = null;
      });
    }

    const refreshData = await refreshPromise;
    const token = refreshData?.accessToken ?? refreshData?.access_token ?? refreshData?.token;

    if (refreshData?.user && token) {
      api.dispatch(setCredentials({
        user: refreshData.user,
        token,
        authz: {
          permissions: refreshData.authz?.permissions ?? refreshData.permissions ?? [],
          roles: refreshData.authz?.roles ?? refreshData.roles ?? [],
        },
      }));
      result = await rawBaseQuery(args, api, extraOptions);
    } else {
      clearSession(api);
      window.location.href = '/login';
    }
  }

  return result;
};
