import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "./StationMap.css";

// Fix default Leaflet icon issue with React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

const API_URL = process.env.REACT_APP_API_URL;
const API_KEY = process.env.REACT_APP_API_KEY;

const StationMap = ({ onClose, onStationSelect }) => {
  const [stations, setStations] = useState([]);

  useEffect(() => {
    fetch(`${API_URL}/stations`, {
      headers: { 'x-api-key': API_KEY }
    })
      .then((res) => res.json())
      .then((data) => {
        setStations(data);
      })
      .catch((err) => console.error("Error fetching stations:", err));
  }, []);

  return (
    <div className="map-overlay">
      <button className="close-map" onClick={onClose}>
        ✖ Close Map
      </button>

      <MapContainer
        center={[47.5, -120.5]}
        zoom={7}
        style={{ height: "100vh", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {stations.map((station) =>
          station.latitude && station.longitude ? (
            <Marker
              key={station.id}
              position={[station.latitude, station.longitude]}
              eventHandlers={{
                click: () => {
                  onStationSelect(station.name);
                  onClose();
                },
              }}
            >
              <Tooltip direction="top" offset={[0, -10]} opacity={1} permanent={false}>
                <div>
                  <strong>{station.name}</strong>
                  <br />
                  Zip Code: {station.zipcode || "N/A"}
                </div>
              </Tooltip>
            </Marker>
          ) : null
        )}
      </MapContainer>
    </div>
  );
};

export default StationMap;