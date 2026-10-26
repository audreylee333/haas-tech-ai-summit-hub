import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { QUERY_DEFAULTS } from "./lib/refresh";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: QUERY_DEFAULTS } });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
