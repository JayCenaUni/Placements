/**
 * @file Vite configuration — build tool and dev server setup.
 *
 * @description
 * Configures Vite 7 as the build tool and development server. The plugin
 * chain processes the application through several transforms:
 *
 * @plugins
 * - `vite-tsconfig-paths` — Resolves the `@/*` path alias defined in
 *   `tsconfig.json` (maps to `src/*`), so imports like `@/db/schema` work.
 *
 * - `@tanstack/react-start/plugin/vite` — The TanStack Start framework plugin.
 *   Handles server function extraction (`createServerFn`), SSR integration,
 *   and triggers the TanStack Router code-gen that produces `routeTree.gen.ts`
 *   from the `src/routes/` file tree.
 *
 * - `@tailwindcss/vite` — Tailwind CSS v4's native Vite plugin. Processes
 *   the `src/styles/app.css` entry point and generates utility CSS.
 *
 * - `@vitejs/plugin-react` — Provides React Fast Refresh for instant component
 *   updates during development without losing state.
 *
 * @server
 * The dev server runs on port 3000, matching the `BETTER_AUTH_URL` default
 * and the base URL configured in `lib/auth-client.ts`.
 */
import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  server: {
    port: 3000,
  },
  plugins: [
    tsConfigPaths(),
    tanstackStart(),
    tailwindcss(),
    react(),
  ],
});
