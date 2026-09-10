/** PM2 configuration for a HostGator VPS. Do not add credentials here. */
module.exports = {
  apps: [
    {
      name: "financas-matheus",
      cwd: __dirname,
      script: "npm",
      args: "run start",
      interpreter: "none",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "production",
        PORT: "3000",
      },
    },
  ],
};
