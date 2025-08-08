import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: {
          title: "Cattle Comfort Index",
          modeled_title: "Modeled Cattle Comfort Index",
          location: "Location: ",
          station: "Station",
          zipcode: "Zip Code",
          recorded_at: "Recorded At",
          cci: "CCI (°F)",
          air_temp: "Air Temp (°F)",
          humidity: "Humidity (%)",
          environment: "Environment",
          solar_radiation: "Solar Radiation (W/m²)",
          wind_speed: "Wind Speed (mph)",
          temp_humidity_adj: "Temp & Humidity Adj (°F)",
          wind_speed_adj: "Wind Speed Adj (°F)",
          direct_solar_adj: "Direct Solar Adj (°F)",
          surface_temp_adj: "Surface Temp Adj (°F)",
          total_radiation_adj: "Total Radiation Adj (°F)",
          filter: "Filter",
          show_map: "Show Map",
          show_table: "Show Table",
          show_chart: "Show Chart",
          toggle_unit: "Toggle Unit (°F/°C)",
          toggle_lang: "Español",
          range_1d: "1 Day",
          range_1w: "1 Week",
          range_1m: "1 Month",
          range_6m: "6 Months"
        }
      },
      es: {
        translation: {
          title: "Índice de Confort del Ganado",
          modeled_title: "Índice Modelado de Confort del Ganado",
          location: "Ubicación: ",
          station: "Estación",
          zipcode: "Código Postal",
          recorded_at: "Registrado En",
          cci: "ICC (°C)",
          air_temp: "Temp. del Aire (°C)",
          humidity: "Humedad (%)",
          environment: "Ambiente",
          solar_radiation: "Radiación Solar (W/m²)",
          wind_speed: "Velocidad del Viento (km/h)",
          temp_humidity_adj: "Ajuste Temp/Humedad (°C)",
          wind_speed_adj: "Ajuste Vel. Viento (°C)",
          direct_solar_adj: "Ajuste Solar Directa (°C)",
          surface_temp_adj: "Ajuste Temp. Superficie (°C)",
          total_radiation_adj: "Ajuste Radiación Total (°C)",
          filter: "Filtrar",
          show_map: "Mostrar Mapa",
          show_table: "Mostrar Mesa",
          show_chart: "Mostrar Gráfico",
          toggle_unit: "Cambiar Unidad (°F/°C)",
          toggle_lang: "English",
          range_1d: "1 Día",
          range_1w: "1 Semana",
          range_1m: "1 Mes",
          range_6m: "6 Meses"
        }
      }
    },
    fallbackLng: "en",
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;