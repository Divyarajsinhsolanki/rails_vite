import React, { useEffect, useState } from "react";
import { fetchJoke } from "../components/api";

const Joke = () => {
  const [joke, setJoke] = useState("");
  const [loading, setLoading] = useState(true);

  const loadJoke = async () => {
    try {
      const { data } = await fetchJoke();
      setJoke(data.joke);
    } catch (e) {
      setJoke("Failed to load joke.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJoke();
  }, []);

  return (
    <div className="max-w-xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-4">Random Programming Joke</h1>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <p className="text-lg">{joke}</p>
      )}
      <button
        onClick={() => {
          setLoading(true);
          loadJoke();
        }}
        className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded"
      >
        New Joke
      </button>
    </div>
  );
};

export default Joke;
