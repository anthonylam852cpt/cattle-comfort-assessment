import React from "react";
import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const API_URL = process.env.REACT_APP_API_URL;
const API_KEY = process.env.REACT_APP_API_KEY;

// Updated CCI thresholds and colors including cold stress (Fahrenheit)
const cciLevels = [
  { min: -Infinity, max: -40, color: "#1e3a8a", label: "Extreme Danger" }, // Very cold
  { min: -40, max: -22, color: "#3b82f6", label: "Extreme" },
  { min: -22, max: -4, color: "#60a5fa", label: "Severe" },
  { min: -4, max: 14, color: "#93c5fd", label: "Moderate" },
  { min: 14, max: 32, color: "#fbbf24", label: "Mild" },
  { min: 32, max: 77, color: "#22c55e", label: "No Stress" },              // Comfortable
  { min: 77, max: 86, color: "#fbbf24", label: "Mild" },
  { min: 86, max: 95, color: "#f59e42", label: "Moderate" },
  { min: 95, max: 104, color: "#f97316", label: "Severe" },
  { min: 104, max: 113, color: "#ef4444", label: "Extreme" },
  { min: 113, max: Infinity, color: "#b91c1c", label: "Extreme Danger" },  // Very hot
];

function getCciColor(val) {
  if (val == null || isNaN(val)) return "#888";
  for (const { min, max, color } of cciLevels) {
    if (val >= min && val < max) return color;
  }
  return "#888";
}

function getCciLevel(val) {
  if (val == null || isNaN(val)) return "No Data";
  for (const { min, max, label } of cciLevels) {
    if (val >= min && val < max) return label;
  }
  return "Unknown";
}

const WA_CENTER = [47.25, -120.74];
const WA_ZOOM = 7;

const Legend = () => (
  <div
    style={{
      background: "rgba(255,255,255,0.95)",
      borderRadius: 8,
      padding: 10,
      position: "absolute",
      bottom: 18,
      left: 12,
      zIndex: 1000,
      fontSize: 11,
      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      maxWidth: "220px",
    }}
  >
    <b style={{ fontSize: 12 }}>CCI Thresholds (°F)</b>
    <div style={{ display: "flex", flexDirection: "column", gap: 1, marginTop: 4 }}>
      {cciLevels.map(({ color, label, min, max }) => (
        <div key={label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span
            style={{
              display: "inline-block",
              width: 16,
              height: 8,
              background: color,
              borderRadius: 2,
              border: "1px solid #bbb",
            }}
          />
          <span style={{ fontSize: "10px" }}>
            {label}{" "}
            <span style={{ color: "#666" }}>
              ({min === -Infinity ? "<" + max : min === 32 && max === 77 ? ">" + min : min + " to " + (max === Infinity ? ">" + min : max)})
            </span>
          </span>
        </div>
      ))}
    </div>
  </div>
);

const CattleComfortMap = ({ stations, data, useCelsius }) => {
  const [allStationData, setAllStationData] = React.useState({});
  const [loading, setLoading] = React.useState(true);

  // Get current local time for finding closest data
  const getCurrentLocalTime = () => {
    return new Date();
  };

  // Find the data point closest to current time
  const findClosestToCurrentTime = (dataArray) => {
    if (!dataArray || dataArray.length === 0) return null;

    const currentTime = getCurrentLocalTime();
    let closest = dataArray[0];
    let minDiff = Math.abs(new Date(closest.recorded_at) - currentTime);

    for (let i = 1; i < dataArray.length; i++) {
      const diff = Math.abs(new Date(dataArray[i].recorded_at) - currentTime);
      if (diff < minDiff) {
        minDiff = diff;
        closest = dataArray[i];
      }
    }

    return closest;
  };

  // Fetch latest CCI data for all stations
  React.useEffect(() => {
    const fetchAllStationData = async () => {
      setLoading(true);
      try {
        // First try the latest endpoint
        const response = await fetch(`${API_URL}/comfort/latest`, {
          headers: { 'x-api-key': API_KEY }
        });
        const latestData = await response.json();

        // Convert array to object keyed by station name
        const latestByStation = {};
        latestData.forEach((row) => {
          const key = row.name || row.station || row.station_name;
          if (key) {
            const parseSafe = (v) => {
              const num = parseFloat(v);
              return isNaN(num) ? null : num;
            };

            const airTempF = parseSafe(row.air_temp_f);
            const cciF = parseSafe(row.cci_f);
            const windMph = parseSafe(row.wind_speed_mph);

            latestByStation[key] = {
              ...row,
              air_temp_f: airTempF,
              air_temp_c: airTempF != null ? ((airTempF - 32) * 5) / 9 : null,
              cci_f: cciF,
              cci_c: cciF != null ? ((cciF - 32) * 5) / 9 : null,
              rel_humidity: parseSafe(row.rel_humidity),
              wind_speed_mph: windMph,
              wind_speed_kph: windMph != null ? windMph * 1.60934 : null,
              solar_radiation: parseSafe(row.solar_radiation),
            };
          }
        });

        setAllStationData(latestByStation);
      } catch (error) {
        console.error("Error fetching latest station data:", error);

        // Fallback: Get data from the last 3 days and find closest to current time
        try {
          const threeDaysAgo = new Date();
          threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
          const startDate = threeDaysAgo.toISOString().split("T")[0];

          const response = await fetch(
            `${API_URL}/comfort?start=${startDate}`,
            { headers: { 'x-api-key': API_KEY } }
          );
          const allData = await response.json();

          // Group data by station
          const dataByStation = {};
          allData.forEach((row) => {
            const key = row.name || row.station || row.station_name;
            if (!key) return;

            if (!dataByStation[key]) {
              dataByStation[key] = [];
            }
            dataByStation[key].push(row);
          });

          // Find closest data to current time for each station
          const latestByStation = {};
          Object.keys(dataByStation).forEach((stationName) => {
            const stationData = dataByStation[stationName];
            const closest = findClosestToCurrentTime(stationData);

            if (closest) {
              const parseSafe = (v) => {
                const num = parseFloat(v);
                return isNaN(num) ? null : num;
              };

              const airTempF = parseSafe(closest.air_temp_f);
              const cciF = parseSafe(closest.cci_f);
              const windMph = parseSafe(closest.wind_speed_mph);

              latestByStation[stationName] = {
                ...closest,
                air_temp_f: airTempF,
                air_temp_c: airTempF != null ? ((airTempF - 32) * 5) / 9 : null,
                cci_f: cciF,
                cci_c: cciF != null ? ((cciF - 32) * 5) / 9 : null,
                rel_humidity: parseSafe(closest.rel_humidity),
                wind_speed_mph: windMph,
                wind_speed_kph: windMph != null ? windMph * 1.60934 : null,
                solar_radiation: parseSafe(closest.solar_radiation),
              };
            }
          });

          setAllStationData(latestByStation);
        } catch (fallbackError) {
          console.error("Fallback fetch also failed:", fallbackError);
        }
      }
      setLoading(false);
    };

    if (stations && stations.length > 0) {
      fetchAllStationData();
    }
  }, [stations]);

  if (!stations || stations.length === 0) {
    return (
      <div style={{
        height: 400,
        margin: "1.5rem 0",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f8fafc",
        border: "1px solid #e2e8f0",
        borderRadius: "8px"
      }}>
        <p>Loading stations...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{
        height: 400,
        margin: "1.5rem 0",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f8fafc",
        border: "1px solid #e2e8f0",
        borderRadius: "8px"
      }}>
        <p>Loading CCI data for all stations...</p>
      </div>
    );
  }

  return (
    <div style={{
      position: "relative",
      height: 400,
      margin: "1.5rem 0",
      border: "1px solid #e2e8f0",
      borderRadius: "8px",
      overflow: "hidden"
    }}>
      <h3 style={{
        position: "absolute",
        top: 10,
        right: 10,
        zIndex: 1000,
        background: "rgba(255,255,255,0.9)",
        padding: "4px 8px",
        borderRadius: "4px",
        margin: 0,
        fontSize: "14px"
      }}>
        Current CCI Values
      </h3>

      <MapContainer
        center={WA_CENTER}
        zoom={WA_ZOOM}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom
        dragging
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {stations
          .filter((s) => s.latitude && s.longitude)
          .map((s, index) => {
            const latest = allStationData[s.name];

            // Safely calculate CCI with proper null checking
            let cci = null;
            if (latest) {
              if (useCelsius) {
                cci = latest.cci_c || (latest.cci_f ? (latest.cci_f - 32) * 5 / 9 : null);
              } else {
                cci = latest.cci_f;
              }
            }

            if (cci !== null && !isNaN(cci)) {
              // valid
            } else {
              cci = null;
            }

            const formatTime = (dateStr) => {
              if (!dateStr) return "No data";
              const date = new Date(dateStr);
              return date.toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              });
            };

            return (
              <CircleMarker
                key={`${s.name}-${index}`}
                center={[parseFloat(s.latitude), parseFloat(s.longitude)]}
                radius={17}
                fillColor={getCciColor(cci)}
                fillOpacity={0.87}
                stroke
                weight={2}
                color="#fff"
              >
                <Tooltip direction="top" offset={[0, -8]} opacity={0.95}>
                  <div style={{ textAlign: "center", minWidth: "120px" }}>
                    <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 2 }}>
                      {s.name}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>
                      CCI: {cci !== null && !isNaN(cci) ? cci.toFixed(1) : "—"}{useCelsius ? "°C" : "°F"}
                    </div>
                    <div style={{ fontSize: 11, color: "#666", marginBottom: 2 }}>
                      {getCciLevel(cci)}
                    </div>
                    <div style={{ fontSize: 10, color: "#888" }}>
                      {formatTime(latest?.recorded_at)}
                    </div>
                    {latest && (
                      <div style={{ fontSize: 10, color: "#888", marginTop: 2 }}>
                        Air: {latest.air_temp_f ? (useCelsius ? latest.air_temp_c?.toFixed(1) : latest.air_temp_f.toFixed(1)) : "—"}{useCelsius ? "°C" : "°F"}
                        {latest.rel_humidity && ` | RH: ${latest.rel_humidity.toFixed(0)}%`}
                      </div>
                    )}
                  </div>
                </Tooltip>
              </CircleMarker>
            );
          })}
      </MapContainer>
      <Legend />
    </div>
  );
};

export default CattleComfortMap;