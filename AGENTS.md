# Project architecture and deployment constraints

These instructions apply to the entire repository.

## Backend and API

- Implement all backend features and API endpoints in PHP 8.1+ under `directadmin/api`.
- Use MySQL/MariaDB for persistent data.
- Do not introduce a Node.js backend, Express, NestJS, Next.js API routes, server actions, or a production Node.js server.
- The hosting environment is DirectAdmin with Apache/PHP. Production must run without Node.js, Prisma, or Redis services.
- The `prisma/` directory is historical schema reference only. Do not use it as the runtime database layer or migration runner.

## Frontend and delivery

- Next.js/React is the frontend. Production frontend output must remain static.
- Always use Tailwind CSS utility classes for frontend styling, including layout, spacing, colors, typography, borders, responsive behavior, and interaction states.
- When adding or changing UI styles, implement them with Tailwind classes in the relevant components. Do not add custom CSS rules, CSS Modules, styled-components, or other styling frameworks when Tailwind can express the required styles.
- Use Tailwind arbitrary values when a design requires precise values, for example `rounded-[2px]`.
- Existing global CSS may remain for font setup, shared design tokens, resets, and styles that Tailwind cannot reasonably express. Do not rewrite unrelated existing styles; migrate the styles you change to Tailwind where practical.
- Node.js is allowed for local frontend development, tests, and frontend builds in GitHub Actions. Do not remove build tooling merely because it uses Node.js.
- GitHub Actions builds the static frontend and deploys the resulting files together with the PHP API to DirectAdmin. It does not host or run the API.
- Use same-origin `/api/*` requests. Local Next.js development proxies API requests to PHP, normally at `http://127.0.0.1:8787`.
- Preserve uploaded images, private configuration, and existing database data during deployment.
- Do not change these architecture constraints unless the user explicitly requests an architecture change.

See `README.md`, `docs/deploy-directadmin-php.md`, and `docs/catalog-api.md` for implementation and deployment details.
