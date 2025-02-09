module.exports = {
  apps: [
    {
      name: 'ggd-next-woo-3040',
      script: 'npm',
      args: 'start',
      instances: -1, // Use all available CPU cores
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '1G',
      env: {
        PORT: 3040,
        NODE_ENV: 'production',
        PUBLIC_DOMAIN: process.env.PUBLIC_DOMAIN,
        PUBLIC_HTTP_ENDPOINT: process.env.PUBLIC_HTTP_ENDPOINT,
        NEXT_PUBLIC_WOOCOMMERCE_KEY: process.env.NEXT_PUBLIC_WOOCOMMERCE_KEY,
        NEXT_PUBLIC_WOOCOMMERCE_SECRET: process.env.NEXT_PUBLIC_WOOCOMMERCE_SECRET,
        NEXT_PUBLIC_WOOCOMMERCE_URL: process.env.NEXT_PUBLIC_WOOCOMMERCE_URL
      }
    }
  ]
};
