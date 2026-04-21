module.exports = {
  apps: [
    {
      name: 'gaoge-api',
      cwd: __dirname,
      script: 'dist/main.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: process.env.APP_PORT || 3000,
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      combine_logs: true,
      max_memory_restart: '512M',
    },
  ],
}
