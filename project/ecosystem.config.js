module.exports = {
  apps: [{
    name: 'warzone-app',
    script: 'server.js',
    instances: 'max', // Use all CPU cores
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development',
      PORT: 5000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: process.env.PORT || 5000
    },
    // Logging
    log_file: './logs/pm2-combined.log',
    out_file: './logs/pm2-out.log',
    error_file: './logs/pm2-error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    
    // Process management
    max_memory_restart: '1G',
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s',
    
    // Monitoring
    monitoring: false,
    pmx: true,
    
    // Advanced features
    watch: false, // Set to true for development
    ignore_watch: ['node_modules', 'logs', 'dist'],
    watch_options: {
      followSymlinks: false
    },
    
    // Graceful shutdown
    kill_timeout: 5000,
    listen_timeout: 3000,
    
    // Environment variables
    env_file: '.env',
    
    // Auto restart on file changes (development only)
    watch_delay: 1000,
    
    // Merge logs from all instances
    merge_logs: true,
    
    // Time zone
    time: true,
    
    // Interpreter
    interpreter: 'node',
    interpreter_args: '--max-old-space-size=1024'
  }],

  deploy: {
    production: {
      user: 'node',
      host: 'your-server.com',
      ref: 'origin/main',
      repo: 'git@github.com:your-username/warzone-tournament-app.git',
      path: '/var/www/warzone-app',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};