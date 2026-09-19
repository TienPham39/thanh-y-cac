import { cp, mkdtemp, rm, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const stage = await mkdtemp(path.join(root, ".directadmin-build-"));
const dist = path.join(root, "dist");
try {
  for (const name of ["src", "public", "tsconfig.json", "next-env.d.ts", "postcss.config.mjs", "tailwind.config.ts", "package.json", "eslint.config.mjs"]) {
    await cp(path.join(root, name), path.join(stage, name), {
      recursive: true,
      filter: (source) => source !== path.join(root, "src", "app", "api"),
    });
  }
  await writeFile(path.join(stage, "next.config.mjs"), `export default {
    output: "export", trailingSlash: true, poweredByHeader: false,
    images: { unoptimized: true },
    env: { NEXT_PUBLIC_STATIC_SITE: "true" },
  };\n`);
  const result = spawnSync(process.execPath, [path.join(root, "node_modules/next/dist/bin/next"), "build"], {
    cwd: stage, stdio: "inherit", env: process.env,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`Static build failed (${result.status})`);
  await rm(dist, { recursive: true, force: true });
  await cp(path.join(stage, "out"), dist, { recursive: true });
  await cp(path.join(root, "directadmin", "api"), path.join(dist, "api"), { recursive: true });
  // The real database password lives only on the hosting server.
  await writeFile(path.join(dist, "api", ".db-password"), "CHANGE_ME\n");
  await writeFile(path.join(dist, "deployment.json"), '{\n  "apiOrigin": ""\n}\n');
  await writeFile(path.join(dist, ".htaccess"), `Options -Indexes
DirectoryIndex index.html
ErrorDocument 404 /404.html
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteRule ^api(?:/.*)?$ api/index.php [L,QSA]
<IfModule mod_headers.c>
  <Files "deployment.json">
    Header set Cache-Control "no-store"
  </Files>
  Header always set X-Content-Type-Options "nosniff"
  Header always set X-Frame-Options "SAMEORIGIN"
  Header always set Referrer-Policy "strict-origin-when-cross-origin"
  <FilesMatch "\\.(?:webp|png|jpe?g|woff2?)$">
    Header set Cache-Control "public, max-age=2592000"
  </FilesMatch>
</IfModule>
`);
  console.log(`DirectAdmin files ready: ${dist}`);
} finally {
  await rm(stage, { recursive: true, force: true });
}
