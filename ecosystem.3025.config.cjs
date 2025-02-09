module.exports = {
  apps: [{
    name: 'ggd-next-woo-3025',
    script: 'node_modules/next/dist/bin/next',
    args: 'start -p 3025 -H 0.0.0.0',
    instances: 6,
    exec_mode: 'cluster',
    watch: false,
    env: {
      NODE_ENV: 'production'
    },
    max_memory_restart: '1G'
  }]
};
