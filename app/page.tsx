"use client";

import React, { useEffect, useState } from "react";

export default function Home() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDevices = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("http://localhost:3001/api/devices");
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();

      // Si le backend ne renvoie pas le status, par défaut 'unknown'
      // Ici on assure que chaque device a un statut (à remplacer par un appel réel si possible)
      const devicesWithStatus = data.map((device) => ({
        ...device,
        status: device.status || "unknown",
      }));

      setDevices(devicesWithStatus);
    } catch (error) {
      console.error("Erreur lors du chargement des appareils.", error);
      setDevices([]);
      setError("Impossible de charger les appareils.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  // Statistiques
  const totalDevices = devices.length;
  const macKnown = devices.filter((d) => d.mac).length;
  const macUnknown = totalDevices - macKnown;
  const uniqueVendors = new Set(devices.map((d) => d.vendor).filter(Boolean)).size;

  const handleBlock = async (mac) => {
    try {
      const res = await fetch("http://localhost:3001/api/devices/block", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mac }),
      });
      if (!res.ok) throw new Error("Erreur blocage");
      alert(`Appareil ${mac} bloqué ✅`);
      fetchDevices(); // rafraîchir la liste après action
    } catch (error) {
      console.error("Blocage échoué", error);
      alert("Échec du blocage");
    }
  };

  const handleAllow = async (mac) => {
    try {
      const res = await fetch("http://localhost:3001/api/devices/allow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mac }),
      });
      if (!res.ok) throw new Error("Erreur autorisation");
      alert(`Appareil ${mac} autorisé ✅`);
      fetchDevices(); // rafraîchir la liste après action
    } catch (error) {
      console.error("Autorisation échouée", error);
      alert("Échec de l'autorisation");
    }
  };

  return (
    <div className="font-sans bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 min-h-screen py-16 px-4 sm:px-10">
      <div className="max-w-4xl mx-auto bg-white shadow-2xl rounded-3xl p-8 space-y-6 animate-fade-in">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-purple-600 tracking-tight drop-shadow-sm">AdminRouter</h1>
          <p className="text-lg mt-2 text-gray-600">Appareils connectés</p>
        </div>

        {/* Dashboard */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-purple-100 p-4 rounded-xl text-center shadow">
            <p className="text-sm text-purple-600">Appareils détectés</p>
            <p className="text-2xl font-bold text-gray-800">{totalDevices}</p>
          </div>
          <div className="bg-green-100 p-4 rounded-xl text-center shadow">
            <p className="text-sm text-green-600">MAC connues</p>
            <p className="text-2xl font-bold text-gray-800">{macKnown}</p>
          </div>
          <div className="bg-yellow-100 p-4 rounded-xl text-center shadow">
            <p className="text-sm text-yellow-600">Fournisseurs uniques</p>
            <p className="text-2xl font-bold text-gray-800">{uniqueVendors}</p>
          </div>
        </div>

        {/* Bouton Rafraîchir */}
        <div className="flex justify-end">
          <button
            onClick={fetchDevices}
            className="px-4 py-2 bg-purple-600 text-white font-medium rounded-xl hover:bg-purple-700 transition"
          >
            🔄 Rafraîchir
          </button>
        </div>

        {/* Liste des appareils */}
        {loading ? (
          <div className="text-center text-purple-500 animate-pulse text-lg">Chargement des appareils...</div>
        ) : error ? (
          <div className="text-center text-red-500">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-auto border-collapse rounded-lg overflow-hidden shadow">
              <thead className="bg-purple-600 text-white">
                <tr>
                  <th className="text-left px-4 py-3">Adresse IP</th>
                  <th className="text-left px-4 py-3">Adresse MAC</th>
                  <th className="text-left px-4 py-3">Nom (Fabricant)</th>
                  <th className="text-left px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="text-gray-700">
                {devices.length > 0 ? (
                  devices.map(({ ip, mac, vendor, status }, idx) => (
                    <tr key={idx} className="border-t hover:bg-purple-50 transition">
                      <td className="px-4 py-2">{ip}</td>
                      <td className="px-4 py-2">{mac || <em>Inconnue</em>}</td>
                      <td className="px-4 py-2">{vendor || <em>Non identifié</em>}</td>
                      <td className="px-4 py-2 font-semibold space-x-2">
                        {status === "blocked" ? (
                          <>
                            <span className="text-red-600">🚫 Bloqué</span>
                            <button
                              onClick={() => handleAllow(mac)}
                              className="ml-2 px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition"
                            >
                              Autoriser
                            </button>
                          </>
                        ) : status === "allowed" ? (
                          <>
                            <span className="text-green-600">✅ Autorisé</span>
                            <button
                              onClick={() => handleBlock(mac)}
                              className="ml-2 px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition"
                            >
                              Bloquer
                            </button>
                          </>
                        ) : (
                          <>
                            <span className="text-gray-500">Inconnu</span>
                            <button
                              onClick={() => handleBlock(mac)}
                              className="ml-2 px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition"
                            >
                              Bloquer
                            </button>
                            <button
                              onClick={() => handleAllow(mac)}
                              className="ml-2 px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition"
                            >
                              Autoriser
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-4 text-center text-gray-500 italic">
                      Aucun appareil détecté
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
