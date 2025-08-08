import { useState, useEffect } from "react";
import "leaflet/dist/leaflet.css";
import "./App.css";
import CattleComfortChart from "./components/CattleComfortChart";
import StationMap from "./components/StationMap";
import CattleComfortMap from "./components/CattleComfortMap";
import { useTranslation } from "react-i18next";

// Utility converters
const API_URL = process.env.REACT_APP_API_URL;
const API_KEY = process.env.REACT_APP_API_KEY;
const toCelsius = (f) => ((f - 32) * 5) / 9;
const toKph = (mph) => mph * 1.60934;

function App() {
  const { t, i18n } = useTranslation();

  const [data, setData] = useState([]);
  const [stations, setStations] = useState([]);
  const [station, setStation] = useState("");
  const [start, setStart] = useState(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split("T")[0];
  });
  const [end, setEnd] = useState(() => new Date().toISOString().split("T")[0]);
  const [showMap, setShowMap] = useState(false);
  const [useCelsius, setUseCelsius] = useState(false);
  const [view, setView] = useState("graph"); // "graph" or "list"
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/stations`, {
      headers: { 'x-api-key': API_KEY }
    })
      .then((res) => res.json())
      .then((data) => {
        setStations(data);
        if (data.length > 0 && !station) setStation(data[0].name);
      })
      .catch((err) => console.error("Error fetching stations:", err));
  }, []);

  useEffect(() => {
    if (station) fetchData();
    // eslint-disable-next-line
  }, [station, start, end]);

  const fetchData = () => {
    setLoading(true);
    let url = `${API_URL}/comfort?`;
    if (station) url += `station=${encodeURIComponent(station)}&`;
    if (start) url += `start=${start}&`;
    if (end) url += `end=${end}&`;

    fetch(url, {
      headers: { 'x-api-key': API_KEY }
    })
      .then((res) => res.json())
      .then((data) => {
        const parsed = data.map((row) => {
          const parseSafe = (v) => {
            const num = parseFloat(v);
            return isNaN(num) ? null : num;
          };

          const airTempF = parseSafe(row.air_temp_f);
          const cciF = parseSafe(row.cci_f);
          const windMph = parseSafe(row.wind_speed_mph);

          return {
            ...row,
            air_temp_f: airTempF,
            air_temp_c: airTempF != null ? toCelsius(airTempF) : null,
            cci_f: cciF,
            cci_c: cciF != null ? toCelsius(cciF) : null,
            rel_humidity: parseSafe(row.rel_humidity),
            wind_speed_mph: windMph,
            wind_speed_kph: windMph != null ? toKph(windMph) : null,
            solar_radiation: parseSafe(row.solar_radiation),
            temp_humidity_adjustment: parseSafe(row.temp_humidity_adjustment),
            temp_humidity_adjustment_c: toCelsius(parseSafe(row.temp_humidity_adjustment)),
            wind_speed_adjustment: parseSafe(row.wind_speed_adjustment),
            wind_speed_adjustment_c: toCelsius(parseSafe(row.wind_speed_adjustment)),
            direct_solar_adjustment: parseSafe(row.direct_solar_adjustment),
            direct_solar_adjustment_c: toCelsius(parseSafe(row.direct_solar_adjustment)),
            surface_temp_adjustment: parseSafe(row.surface_temp_adjustment),
            surface_temp_adjustment_c: toCelsius(parseSafe(row.surface_temp_adjustment)),
            total_radiation_adjustment: parseSafe(row.total_radiation_adjustment),
            total_radiation_adjustment_c: toCelsius(parseSafe(row.total_radiation_adjustment)),
          };
        });

        parsed.sort((a, b) => new Date(a.recorded_at) - new Date(b.recorded_at));
        setData(parsed);
      })
      .catch((err) => console.error("Error fetching comfort data:", err))
      .finally(() => setLoading(false));
  };

  const handleQuickRange = (value, type = "days") => {
    const end = new Date();
    const start = new Date(end);
    if (type === "months") start.setMonth(end.getMonth() - value);
    else start.setDate(end.getDate() - value);
    setStart(start.toISOString().split("T")[0]);
    setEnd(end.toISOString().split("T")[0]);
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === "en" ? "es" : "en";
    i18n.changeLanguage(newLang);
  };

  const renderVal = (v) => (v != null ? v.toFixed(1) : "—");

  // Helper for dynamic unit headers
  const getHeader = (key) => {
    switch (key) {
      case "cci":
        return i18n.language === "es"
          ? `Índice de Confort del Ganado (${useCelsius ? "°C" : "°F"})`
          : `Cattle Comfort Index (${useCelsius ? "°C" : "°F"})`;
      case "air_temp":
        return i18n.language === "es"
          ? `Temp. del Aire (${useCelsius ? "°C" : "°F"})`
          : `Air Temp (${useCelsius ? "°C" : "°F"})`;
      case "wind_speed":
        return i18n.language === "es"
          ? `Velocidad del Viento (${useCelsius ? "kph" : "mph"})`
          : `Wind (${useCelsius ? "kph" : "mph"})`;
      case "temp_humidity_adj":
        return i18n.language === "es"
          ? `Ajuste Temp/Humedad (${useCelsius ? "°C" : "°F"})`
          : `Temp/Hum Adj (${useCelsius ? "°C" : "°F"})`;
      case "wind_speed_adj":
        return i18n.language === "es"
          ? `Ajuste Vel. Viento (${useCelsius ? "°C" : "°F"})`
          : `Wind Adj (${useCelsius ? "°C" : "°F"})`;
      case "direct_solar_adj":
        return i18n.language === "es"
          ? `Ajuste Solar Directa (${useCelsius ? "°C" : "°F"})`
          : `Solar Adj (${useCelsius ? "°C" : "°F"})`;
      case "surface_temp_adj":
        return i18n.language === "es"
          ? `Ajuste Temp. Superficie (${useCelsius ? "°C" : "°F"})`
          : `Surface Adj (${useCelsius ? "°C" : "°F"})`;
      case "total_radiation_adj":
        return i18n.language === "es"
          ? `Ajuste Radiación Total (${useCelsius ? "°C" : "°F"})`
          : `Total Rad Adj (${useCelsius ? "°C" : "°F"})`;
      default:
        // fallback to i18n translation
        return t(key);
    }
  };

  return (
    <div className="container">
      {/* Top Navigation Bar */}
      <div className="topbar">
        <div className="branding">
          <img src="/AWNAW.png" alt="WSU Logo" className="logo" />
        </div>
        <div className="topbar-buttons">
          <button onClick={toggleLanguage} title="Toggle Language">
            {i18n.language === "en" ? "ES" : "EN"}
          </button>
          <button onClick={() => setUseCelsius(!useCelsius)} title="Toggle Temperature Unit">
            {useCelsius ? "Switch to English" : "Switch to Metric"}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <h1>{t("title") || "Cattle Comfort Index Monitor"}</h1>

        {/* Filters Section */}
        <div className="filters fade-in">
          <select 
            value={station} 
            onChange={(e) => setStation(e.target.value)}
            disabled={stations.length === 0}
          >
            {stations.length === 0 ? (
              <option>Loading stations...</option>
            ) : (
              stations.map((s, idx) => (
                <option key={idx} value={s.name}>{s.name}</option>
              ))
            )}
          </select>

          <input 
            type="date" 
            value={start} 
            onChange={(e) => setStart(e.target.value)} 
            max={end}
          />
          <input 
            type="date" 
            value={end} 
            onChange={(e) => setEnd(e.target.value)} 
            min={start}
            max={new Date().toISOString().split("T")[0]}
          />
          <button onClick={fetchData} disabled={loading}>
            {loading ? "Loading..." : (t("filter") || "Update Data")}
          </button>

          <div className="quick-buttons">
            <button onClick={() => handleQuickRange(1)} title="Last 24 hours">
              {t("range_1d") || "1D"}
            </button>
            <button onClick={() => handleQuickRange(7)} title="Last 7 days">
              {t("range_1w") || "1W"}
            </button>
            <button onClick={() => handleQuickRange(1, "months")} title="Last month">
              {t("range_1m") || "1M"}
            </button>
            <button onClick={() => handleQuickRange(6, "months")} title="Last 6 months">
              {t("range_6m") || "6M"}
            </button>
          </div>

          {/* Buttons aligned together in a flex row */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={() => setShowMap(true)}>
              {t("show_map") || "Show Map"}
            </button>
            <button onClick={() => setView(view === "graph" ? "list" : "graph")}>
              {view === "graph" 
                ? t("show_table") || "Show Table" 
                : t("show_chart") || "Show Chart"}
            </button>
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="loading">
            <div>Loading data...</div>
          </div>
        ) : (
          <div className="fade-in">
            {view === "graph" ? (
              <>
                {/* Chart Section */}
                <div className="chart-wrapper">
                  <CattleComfortChart
                    data={data}
                    useCelsius={useCelsius}
                    stationName={station}
                    zipcode={data.length > 0 ? data[0].zipcode : ""}
                  />
                </div>
                
                {/* CCI Map Section - This should appear right below the chart */}
                <CattleComfortMap
                  stations={stations}
                  data={data}
                  useCelsius={useCelsius}
                />
              </>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>{t("station") || "Station"}</th>
                      <th>{t("zipcode") || "ZIP"}</th>
                      <th>{t("recorded_at") || "Date/Time"}</th>
                      <th>{getHeader("cci")}</th>
                      <th>{t("environment") || "Environment"}</th>
                      <th>{getHeader("air_temp")}</th>
                      <th>{t("humidity") || "Humidity (%)"}</th>
                      <th>{t("solar_radiation") || "Solar Rad"}</th>
                      <th>{getHeader("wind_speed")}</th>
                      <th>{getHeader("temp_humidity_adj")}</th>
                      <th>{getHeader("wind_speed_adj")}</th>
                      <th>{getHeader("direct_solar_adj")}</th>
                      <th>{getHeader("surface_temp_adj")}</th>
                      <th>{getHeader("total_radiation_adj")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.length > 0 ? data.map((row, idx) => (
                      <tr key={idx}>
                        <td>{row.name}</td>
                        <td>{row.zipcode}</td>
                        <td>{new Date(row.recorded_at).toLocaleString()}</td>
                        <td>
                          {renderVal(useCelsius ? row.cci_c : row.cci_f)}
                        </td>
                        <td>
                          <span style={{ 
                            padding: '0.25rem 0.5rem', 
                            borderRadius: '4px', 
                            backgroundColor: '#f1f5f9',
                            fontSize: '0.75rem',
                            fontWeight: '600'
                          }}>
                            {row.environment}
                          </span>
                        </td>
                        <td>{renderVal(useCelsius ? row.air_temp_c : row.air_temp_f)}</td>
                        <td>{renderVal(row.rel_humidity)}</td>
                        <td>{renderVal(row.solar_radiation)}</td>
                        <td>{renderVal(useCelsius ? row.wind_speed_kph : row.wind_speed_mph)}</td>
                        <td>{renderVal(useCelsius ? row.temp_humidity_adjustment_c : row.temp_humidity_adjustment)}</td>
                        <td>{renderVal(useCelsius ? row.wind_speed_adjustment_c : row.wind_speed_adjustment)}</td>
                        <td>{renderVal(useCelsius ? row.direct_solar_adjustment_c : row.direct_solar_adjustment)}</td>
                        <td>{renderVal(useCelsius ? row.surface_temp_adjustment_c : row.surface_temp_adjustment)}</td>
                        <td>{renderVal(useCelsius ? row.total_radiation_adjustment_c : row.total_radiation_adjustment)}</td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="14" className="no-data">
                          {loading ? "Loading data..." : "No data available for the selected filters"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Map Overlay */}
      {showMap && (
        <div className="map-overlay fade-in">
          <div className="map-container">
            <div className="map-header">
              <h2>Weather Stations</h2>
              <button className="close-map-btn" onClick={() => setShowMap(false)}>
                ✕ Close Map
              </button>
            </div>
            <div className="map-content">
              <StationMap
                onClose={() => setShowMap(false)}
                onStationSelect={(selected) => {
                  setStation(selected);
                  setShowMap(false);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;