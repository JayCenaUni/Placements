/**
 * @file TanStack Router instance creation and type registration.
 *
 * @description
 * Creates the application's router from the auto-generated route tree. This
 * file is the bridge between TanStack Router's code-gen (which produces
 * `routeTree.gen.ts` from the `src/routes/` file structure) and the runtime
 * router instance used by TanStack Start to handle navigation and SSR.
 *
 * @architecture
 * - `routeTree.gen.ts` is **auto-generated** by TanStack Router's Vite plugin
 *   whenever route files are added/removed. It must not be edited by hand.
 * - `scrollRestoration: true` enables TanStack Router's built-in scroll
 *   position tracking, so navigating back restores the user's scroll position.
 * - The `declare module` block registers the router's type with TanStack
 *   Router's global type registry, enabling fully typed `Link`, `useNavigate`,
 *   `useParams`, and `useRouteContext` throughout the application.
 *
 * @consumers Imported by TanStack Start's entry points during SSR and
 *   client-side hydration.
 */
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
  const router = createRouter({
    routeTree,
    scrollRestoration: true,
  });

  return router;
}

/**
 * Module augmentation: registers this app's router type globally so that
 * TanStack Router hooks (`Link`, `useNavigate`, etc.) are fully typed
 * with this application's route paths and params.
 */
declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
