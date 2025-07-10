import React, { useState, useEffect } from 'react';
import { getWeather } from '../components/api';

const Weather = () => {
  const [city, setCity] = useState('');
  const [weather, setWeather] = useState(null);
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
  }, []);

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md mt-8">
      <h1 className="text-2xl font-semibold mb-4 text-center">Weather</h1>
      <form onSubmit={handleSubmit} className="flex mb-4 space-x-2">
        <input
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Enter city"
          className="flex-grow border border-gray-300 rounded px-3 py-2"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Search
        </button>
      </form>
      {loading && <p className="text-center">Loading...</p>}
      {error && <p className="text-red-600 text-center">{error}</p>}
      {weather && !loading && (
        <div className="text-center">
          <h2 className="text-xl font-medium mb-2">{weather.location}</h2>
          {weather.icon_url && (
            <img src={weather.icon_url} alt="icon" className="mx-auto h-16" />
          )}
          <p className="text-lg">
            {weather.temp_c}&deg;C / {weather.temp_f}&deg;F
          </p>
          <p className="capitalize text-gray-600">{weather.description}</p>
        </div>
      )}
    </div>
  );
};

export default Weather;
