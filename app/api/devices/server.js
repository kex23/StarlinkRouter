import express from "express";
import { exec } from "child_process";
import cors from "cors";
import db from './db.js'; // Assure-toi que ce fichier existe et exporte la db SQLite

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json()); // pour parser JSON dans les POST

function setDeviceStatus(mac, status) {
  const stmt = db.prepare(`
    INSERT INTO devices_status (mac, status, updated_at)
    VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(mac) DO UPDATE SET status=excluded.status, updated_at=CURRENT_TIMESTAMP
  `);
  stmt.run(mac, status);
}

function getDeviceStatus(mac) {
  const stmt = db.prepare(`SELECT status FROM devices_status WHERE mac = ?`);
  const row = stmt.get(mac);
  return row ? row.status : null;
}

app.post("/api/devices/block", (req, res) => {
  const { mac } = req.body;
  if (!mac) return res.status(400).json({ error: "MAC manquante" });

  // Commande à adapter selon ton routeur
  const cmd = `routeros-cli block ${mac}`; // ou iptables / Mikrotik command
  exec(cmd, (err) => {
    if (err) return res.status(500).json({ error: "Erreur blocage" });

    // Sauvegarde dans la DB
    setDeviceStatus(mac, "blocked");

    res.json({ success: true });
  });
});

app.post("/api/devices/allow", (req, res) => {
  const { mac } = req.body;
  if (!mac) return res.status(400).json({ error: "MAC manquante" });

  const cmd = `routeros-cli allow ${mac}`;
  exec(cmd, (err) => {
    if (err) return res.status(500).json({ error: "Erreur autorisation" });

    // Sauvegarde dans la DB
    setDeviceStatus(mac, "allowed");

    res.json({ success: true });
  });
});

app.get("/api/devices", (req, res) => {
  const command = "nmap -sn 192.168.88.0/24";
  console.log("✅ Lancement de la commande :", command);

  exec(command, { timeout: 90000 }, (err, stdout, stderr) => {
    if (err) {
      console.error("❌ Erreur Nmap:", err);
      return res.status(500).send("Erreur Nmap");
    }

    if (stderr) {
      console.warn("⚠️ STDERR:", stderr);
    }

    const lines = stdout.split("\n");
    const devices = [];
    let currentIP = null;

    for (const line of lines) {
      if (line.startsWith("Nmap scan report for ")) {
        currentIP = line.replace("Nmap scan report for ", "").trim();
      } else if (line.includes("MAC Address:") && currentIP) {
        const macMatch = line.match(/MAC Address: ([0-9A-F:]+) \((.*?)\)/i);
        if (macMatch) {
          devices.push({
            ip: currentIP,
            mac: macMatch[1],
            vendor: macMatch[2] || "Unknown"
          });
          currentIP = null;
        }
      }
    }

    // Injecter le statut depuis la DB dans chaque device
    for (const device of devices) {
      device.status = getDeviceStatus(device.mac) || "unknown";
    }

    console.log(`✅ Appareils détectés (${devices.length}) :`, devices);
    res.json(devices);
  });
});

app.listen(port, () => {
  console.log(`🚀 Serveur backend en ligne sur http://localhost:${port}`);
});
