import { useCallback, useMemo, useState, type ReactNode } from "react";
import GlobalLoader from "./GlobalLoader";
import { LoadingContext, type LoadingContextValue } from "./useLoading";

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [loadingCount, setLoadingCount] = useState(0);

  const showLoader = useCallback(() => setLoadingCount((c) => c + 1), []);
  const hideLoader = useCallback(() => setLoadingCount((c) => Math.max(0, c - 1)), []);

  const value = useMemo<LoadingContextValue>(
    () => ({ isLoading: loadingCount > 0, showLoader, hideLoader }),
    [loadingCount, showLoader, hideLoader],
  );

  return (
    <LoadingContext.Provider value={value}>
      {loadingCount > 0 && <GlobalLoader />}
      {children}
    </LoadingContext.Provider>
  );
}

export default LoadingProvider;
