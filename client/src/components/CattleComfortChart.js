import React, { useState, useEffect } from 'react';
import { useTranslation } from "react-i18next";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const CattleComfortChart = ({ data, useCelsius, stationName, zipcode }) => {
  const cciKey = useCelsius ? 'cci_c' : 'cci_f';
  const tempKey = useCelsius ? 'air_temp_c' : 'air_temp_f';
  const tempUnit = useCelsius ? '°C' : '°F';
  const { t, i18n } = useTranslation();

  const [visibleLines, setVisibleLines] = useState({
    [cciKey]: true,
    [tempKey]: true,
    rel_humidity: true,
  });

  useEffect(() => {
    setVisibleLines({
      [cciKey]: true,
      [tempKey]: true,
      rel_humidity: true,
    });
  }, [useCelsius]);

  const handleLegendClick = (key) => {
    setVisibleLines((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const renderLegend = () => (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
      <div style={{ display: 'flex', gap: 20 }}>
        {[cciKey, tempKey].map((key) => (
          <div
            key={key}
            style={{
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              opacity: visibleLines[key] ? 1 : 0.4,
              transition: 'opacity 0.2s ease',
            }}
            onClick={() => handleLegendClick(key)}
          >
            <span
              style={{
                width: 12,
                height: 2,
                backgroundColor: key === cciKey ? '#8884d8' : '#82ca9d',
                marginRight: 8,
              }}
            />
            <span style={{ fontSize: 12 }}>
              {key === cciKey ? 'Comfort Index' : `Air Temp (${tempUnit})`}
            </span>
          </div>
        ))}
      </div>

      <div
        style={{
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          opacity: visibleLines.rel_humidity ? 1 : 0.4,
          transition: 'opacity 0.2s ease',
        }}
        onClick={() => handleLegendClick('rel_humidity')}
      >
        <span
          style={{
            width: 12,
            height: 2,
            backgroundColor: '#ffc658',
            marginRight: 8,
          }}
        />
        <span style={{ fontSize: 12 }}>Humidity (%)</span>
      </div>
    </div>
  );

  return (
    <div style={{ width: '100%', height: 540 }}>
      <h3 style={{ textAlign: 'center', marginBottom: 5 }}>
        {t('modeled_title')}
      </h3>
      {stationName && zipcode && (
        <p style={{ textAlign: 'center', marginTop: 0, marginBottom: 10, fontSize: 14 }}>
          {t('location')} {stationName} ({zipcode})
        </p>
      )}
      {renderLegend()}
      <ResponsiveContainer width="100%" height={500}>
        <LineChart
          data={data}
          margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="recorded_at"
            tickFormatter={(val) =>
              new Date(val).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })
            }
            minTickGap={20}
          />
          <YAxis yAxisId="left" />
          <YAxis yAxisId="right" orientation="right" />
          <Tooltip
            labelFormatter={(val) => new Date(val).toLocaleString()}
            formatter={(value, name) =>
              typeof value === 'number'
                ? [value.toFixed(1), name]
                : [value, name]
            }
          />

          <Line
            type="monotone"
            dataKey={cciKey}
            stroke="#8884d8"
            name="Comfort Index"
            dot={false}
            yAxisId="left"
            strokeOpacity={visibleLines[cciKey] ? 1 : 0.1}
          />
          <Line
            type="monotone"
            dataKey={tempKey}
            stroke="#82ca9d"
            name={`Air Temp (${tempUnit})`}
            dot={false}
            yAxisId="left"
            strokeOpacity={visibleLines[tempKey] ? 1 : 0.1}
          />
          <Line
            type="monotone"
            dataKey="rel_humidity"
            stroke="#ffc658"
            name="Humidity (%)"
            dot={false}
            yAxisId="right"
            strokeOpacity={visibleLines.rel_humidity ? 1 : 0.1}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CattleComfortChart;