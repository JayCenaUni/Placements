/**
 * @file Root layout route — the outermost HTML shell wrapping every page.
 *
 * @description
 * This is TanStack Router's root route (`__root.tsx`). It renders the `<html>`,
 * `<head>`, and `<body>` elements and provides two critical injection points:
 * - `<HeadContent />` — Renders meta tags, title, and stylesheet links defined
 *   in the `head()` function (including the Tailwind CSS entry point).
 * - `<Outlet />` — Renders the matched child route component (either a public
 *   page like `/login` or the `_authed` layout which wraps all authenticated pages).
 * - `<Scripts />` — Injects TanStack Start's client-side hydration scripts.
 *
 * @architecture
 * In TanStack Router's file-based routing, `__root.tsx` is the root of the
 * route tree. Every route in the application is a descendant of this root.
 * The component hierarchy is:
 *   __root.tsx → (login.tsx | register.tsx | _authed.tsx → child routes)
 *
 * The `?url` suffix on the CSS import tells Vite to return the URL of the
 * processed stylesheet (rather than injecting it as a module side-effect),
 * which is then added as a `<link>` tag via the `head()` function.
 *
 * @styling
 * The `app.css` file is the Tailwind CSS v4 entry point. It defines theme
 * tokens, CSS custom properties, and shadcn/ui animation utilities. The
 * `antialiased` class applies font smoothing for better text rendering.
 */
/// <reference types="vite/client" />
import {
  Outlet,
  createRootRoute,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import appCss from "@/styles/app.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Placements Management" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
    ],
  }),
  component: RootComponent,
});

function RootComponent() {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="min-h-screen antialiased">
        <Outlet />
        <Scripts />
      </body>
    </html>
  );
}
