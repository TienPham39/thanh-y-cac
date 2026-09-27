export function developmentEnvironment(source) {
  const env = { ...source };
  // Existing local installations used DATABASE_URL. Preserve that database during migration.
  if (env.DATABASE_URL) {
    const database = new URL(env.DATABASE_URL);
    env.DB_HOST ||= database.hostname;
    env.DB_PORT ||= database.port || '3306';
    env.DB_NAME ||= decodeURIComponent(database.pathname.slice(1));
    env.DB_USER ||= decodeURIComponent(database.username);
    env.DB_PASSWORD ||= decodeURIComponent(database.password);
  }
  env.DB_NAME ||= env.MYSQL_DATABASE || '';
  env.DB_USER ||= env.MYSQL_USER || '';
  env.DB_PASSWORD ||= env.MYSQL_PASSWORD || '';
  env.PHP_API_ORIGIN ||= 'http://127.0.0.1:8787';
  env.APP_ORIGIN ||= `http://localhost:${env.APP_PORT || '3000'}`;
  env.APP_ENV = 'development';
  return env;
}
