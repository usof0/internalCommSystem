import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from './../app/store';
import { useGetMeQuery, useRefreshMutation } from './../api/authApi';
import { setCredentials, setUser, setAuthz } from './../app/slices/authSlice';

export const AuthBootstrap: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useDispatch();
  const token = useSelector((s: RootState) => s.auth.token);
  const [refresh] = useRefreshMutation();
  const [refreshChecked, setRefreshChecked] = React.useState(!!token);

  const { data, isSuccess } = useGetMeQuery(undefined, {
    skip: !token,
    refetchOnMountOrArgChange: true,
  });

  useEffect(() => {
    if (token || refreshChecked) return;

    let cancelled = false;
    refresh()
      .unwrap()
      .then((session) => {
        if (cancelled) return;
        dispatch(setCredentials({
          user: session.user,
          token: session.token,
          authz: session.authz,
        }));
      })
      .catch(() => {
        // No refresh cookie or expired session. Protected routes will redirect.
      })
      .finally(() => {
        if (!cancelled) setRefreshChecked(true);
      });

    return () => {
      cancelled = true;
    };
  }, [token, refreshChecked, refresh, dispatch]);

  useEffect(() => {
    if (token) setRefreshChecked(true);
  }, [token]);

  useEffect(() => {
    if (!isSuccess || !data) return;

    dispatch(setUser(data.user));
    dispatch(setAuthz({ permissions: data.authz.permissions, roles: data.authz.roles }));
  }, [isSuccess, data, dispatch]);

  if (!refreshChecked) return null;

  return <>{children}</>;
};
