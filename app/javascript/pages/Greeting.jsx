import React, { useEffect, useState } from 'react';
import { fetchGreeting } from '../components/api';

const Greeting = () => {
  const [message, setMessage] = useState('Loading...');

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await fetchGreeting();
        setMessage(data.message);
      } catch {
        setMessage('Failed to load greeting');
      }
    };
    load();
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white shadow-md rounded-lg p-8">
        <h1 className="text-2xl font-bold mb-4 text-center">Greeting</h1>
        <p className="text-gray-700 text-center">{message}</p>
      </div>
    </div>
  );
};

export default Greeting;
