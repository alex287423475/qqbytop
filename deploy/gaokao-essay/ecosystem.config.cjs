module.exports = {
  apps: [
    {
      name: "qqbytop-next",
      cwd: "/var/www/qqbytop-next",
      script: "node_modules/next/dist/bin/next",
      args: "start -H 127.0.0.1 -p 3000",
      env: {
        NODE_ENV: "production",
      },
      max_memory_restart: "900M",
    },
    {
      name: "gaokao-essay-api",
      cwd: "/var/www/qqbytop-next/backend",
      script: ".venv/bin/python",
      args: "-m uvicorn app.main:app --host 127.0.0.1 --port 8000",
      max_memory_restart: "700M",
    },
  ],
};
