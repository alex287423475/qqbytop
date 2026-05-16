const fs = require("fs");
const path = require("path");

function readEnvFile(filename) {
  const filePath = path.resolve(__dirname, "../..", filename);
  if (!fs.existsSync(filePath)) return {};

  return fs
    .readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .reduce((env, rawLine) => {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) return env;

      const equalsIndex = line.indexOf("=");
      if (equalsIndex <= 0) return env;

      const key = line.slice(0, equalsIndex).trim();
      let value = line.slice(equalsIndex + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      env[key] = value;
      return env;
    }, {});
}

module.exports = {
  apps: [
    {
      name: "qqbytop-next",
      cwd: "/var/www/qqbytop-next",
      script: "node_modules/next/dist/bin/next",
      args: "start -H 127.0.0.1 -p 3000",
      env: {
        ...readEnvFile(".env.production"),
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
