// @ts-nocheck
require('dotenv').config()
const express = require("express");
const pm2 = require("pm2");
const app = express();
const port = process.env.CLUSTER_PORT || 3000;

app.get("/health", (req, res) => {
  pm2.connect(function (err) {
    if (err) {
      console.error(err);
      process.exit(2);
    }

    pm2.list(async (err, processDescriptionList) => {
      if (err) {
        res.status(500).send("Error retrieving PM2 process list");
      } else {
        const filteredProcesses = processDescriptionList.filter(
          (process) => process.name !== "cluster-health"
        );

        const statusList = filteredProcesses.map((process) => {
          return {
            status: process.pm2_env.status,
            pmID: process.pm_id,

            pid: process.pid,
            // @ts-ignore
            createdAt: process.pm2_env.created_at,
            uptime: process.pm2_env.pm_uptime,
            memory: process.monit.memory,
            cpu: process.monit.cpu,
            debug: {
              restarts: process.pm2_env.restart_time,
              unstableRestarts: process.pm2_env.unstable_restarts,
            },
          };
        });
        const mainInstanse = filteredProcesses[0];
        const rootData = {
          status: mainInstanse.pm2_env.status,
          application: mainInstanse.name,
          version: mainInstanse.pm2_env.version,
          node: mainInstanse.pm2_env.node_version,
          instances: mainInstanse.pm2_env.instances,
          mode: mainInstanse.pm2_env.exec_mode,
          interpreter: mainInstanse.pm2_env.exec_interpreter,
        };
        const envData = {
          NODE_ENV: mainInstanse.pm2_env.env.NODE_ENV,
          TZ: mainInstanse.pm2_env.env.TZ,
        };
        const versioningData = {
          type: mainInstanse.pm2_env?.versioning.type,
          url: mainInstanse.pm2_env?.versioning.url,
          revision: mainInstanse.pm2_env?.versioning.revision,
          branch: mainInstanse.pm2_env?.versioning.branch,
          remote: mainInstanse.pm2_env?.versioning.remote,
          updated: mainInstanse.pm2_env?.versioning.update_time,
        };
        const connectorsData = [
          {
            cloudflare: {
              status: "online",
            },
            s3: {
              status: "online",
            },
            redis: {
              status: "online",
            },
            sqlite: {
              status: "online",
            },
          },
        ];
        res.json({
          ...rootData,
          clusters: statusList,
          connectors: connectorsData,
          versioning: versioningData,
          env: envData,
        });
      }

      pm2.disconnect();
    });
  });
});
app.listen(port, () => {
  console.log(`Listening on ${port}`);
});