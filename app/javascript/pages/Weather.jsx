import React, { useState, useEffect } from 'react';
import { getWeather } from '../components/api';
import {
  MapPinIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  CloudIcon,
} from '@heroicons/react/24/outline';

const defaultCities = [
  { name: 'Ahmedabad', query: 'Ahmedabad,320008' },
  { name: 'Gandhinagar', query: 'Gandhinagar,382001' },
  { name: 'Adalaj', query: 'Adalaj,382421' },
  { name: 'Mumbai', query: 'Mumbai' },
  { name: 'Delhi', query: 'Delhi' },
  { name: 'Bengaluru', query: 'Bangalore' }
];

const Weather = () => {
  const [city, setCity] = useState('');
  const [weather, setWeather] = useState(null);
  const [defaultWeather, setDefaultWeather] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchByLocation = () => {
    if (!navigator.geolocation) return;
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { data } = await getWeather({ lat: pos.coords.latitude, lon: pos.coords.longitude });
          setWeather(data);
          setError(null);
        } catch {
          setError('Unable to retrieve weather.');
        } finally {
          setLoading(false);
        }
      },
      () => setLoading(false)
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!city) return;
    setLoading(true);
    try {
      const { data } = await getWeather({ city });
      setWeather(data);
      setError(null);
    } catch {
      setError('Unable to retrieve weather.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchByLocation();
    const fetchDefaults = async () => {
      try {
        const results = await Promise.all(
          defaultCities.map(async (c) => {
            const { data } = await getWeather({ city: c.query });
            return { ...data, name: c.name };
          })
        );
        setDefaultWeather(results);
      } catch {
        // ignore errors for defaults
      }
    };
    fetchDefaults();
  }, []);

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg space-y-4">
      <h1 className="flex items-center justify-center text-xl font-semibold">
        <CloudIcon className="h-6 w-6 text-blue-600 mr-2" />
        Weather
      </h1>
      <form onSubmit={handleSubmit} className="flex items-center space-x-2">
        <input
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Enter city"
          className="flex-grow border border-gray-300 rounded px-3 py-2 focus:outline-none"
        />
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded"
        >
          <MagnifyingGlassIcon className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={fetchByLocation}
          className="p-2 border border-gray-300 rounded hover:bg-gray-100"
          title="Use my location"
        >
          <MapPinIcon className="h-5 w-5 text-gray-600" />
        </button>
      </form>
      {loading && <p className="text-center text-sm text-gray-500 flex items-center justify-center"><ArrowPathIcon className="h-4 w-4 mr-1 animate-spin" /> Loading...</p>}
      {error && <p className="text-red-600 text-center text-sm">{error}</p>}

      {/* Default cities */}
      {defaultWeather.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {defaultWeather.map((w) => (
            <div key={w.name} className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700 shadow text-center">
              <h3 className="font-semibold mb-2 text-gray-700 dark:text-gray-200">{w.name}</h3>
              {w.current.icon_url && (
                <img src={w.current.icon_url} alt="icon" className="mx-auto h-12" />
              )}
              <p className="text-sm">
                {w.current.temp_c}&deg;C / {w.current.temp_f}&deg;F
              </p>
              <p className="text-xs capitalize text-gray-600">{w.current.description}</p>
            </div>
          ))}
        </div>
      )}

      {weather && !loading && (
        <div className="text-center space-y-2">
          <h2 className="text-xl font-medium">{weather.location}</h2>
          {weather.current.icon_url && (
            <img src={weather.current.icon_url} alt="icon" className="mx-auto h-16" />
          )}
          <p className="text-lg font-medium">
            {weather.current.temp_c}&deg;C / {weather.current.temp_f}&deg;F
          </p>
          <p className="capitalize text-gray-600 mb-4">{weather.current.description}</p>
          {weather.forecast && (
            <div className="flex overflow-x-auto space-x-2 justify-center">
              {weather.forecast.map((day) => (
                <div key={day.date} className="bg-gray-100 dark:bg-gray-700 p-2 rounded w-24 flex-shrink-0 text-gray-700 dark:text-gray-200">
                  <p className="text-xs mb-1">{day.date}</p>
                  {day.icon_url && (
                    <img src={day.icon_url} alt="icon" className="mx-auto h-8" />
                  )}
                  <p className="text-xs text-center">
                    {day.max_temp_c}&deg;/{day.min_temp_c}&deg;C
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Weather;
