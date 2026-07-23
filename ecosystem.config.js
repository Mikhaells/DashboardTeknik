const path = require('path');

const projectRoot = path.resolve(__dirname);
const standaloneDir = path.join(projectRoot, '.next', 'standalone');
const logsDir = path.join(projectRoot, 'logs');

module.exports = {
  apps: [{
    name: 'dashboard-teknik-tvri',
    script: path.join(standaloneDir, 'server.js'),
    cwd: standaloneDir,
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      HOSTNAME: '0.0.0.0',
      // UPLOAD_DIR akan dibaca dari .env via env_file, bisa juga diisi manual:
      // UPLOAD_DIR: 'D:\\AplikasiTVRI\\uploads',
    },
    env_file: path.join(projectRoot, '.env'),
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '512M',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    error_file: path.join(logsDir, 'error.log'),
    out_file: path.join(logsDir, 'output.log'),
    merge_logs: true,
    autorestart: true,
    max_restarts: 10,
    restart_delay: 5000,
    windows: true,
  }],
};
