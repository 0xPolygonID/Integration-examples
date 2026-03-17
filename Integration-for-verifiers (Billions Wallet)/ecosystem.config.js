module.exports = {
  apps: [{
    name: 'billions-verifier',
    script: 'src/index.js',
    instances: 'max', // Use all CPU cores
    exec_mode: 'cluster', // Enable cluster mode for load balancing

    // Environment configuration
    env: {
      NODE_ENV: 'development',
      PORT: 8080
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 8080
    },

    // Process management
    max_memory_restart: '1G',
    min_uptime: '10s',
    max_restarts: 10,
    restart_delay: 4000,

    // Logging
    log_file: 'logs/pm2-combined.log',
    out_file: 'logs/pm2-out.log',
    error_file: 'logs/pm2-error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,

    // Monitoring
    source_map_support: true,
    instance_var: 'INSTANCE_ID',

    // Health monitoring
    watch: false, // Set to true for development auto-restart
    ignore_watch: ['node_modules', 'logs', '.git'],

    // Production optimizations
    node_args: '--max-old-space-size=1024'
  }],

  // Deployment configuration
  deploy: {
    production: {
      user: 'deploy',
      host: ['your-server.com'],
      ref: 'origin/main',
      repo: 'git@github.com:your-username/billions-verifier.git',
      path: '/var/www/billions-verifier',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': 'apt-get install git -y'
    }
  }
};