import React, { useEffect, useState } from "react";

const fetchers = [
  // 1) NASA Astronomy Picture of the Day
  () =>
    fetch("https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY")
      .then((res) => res.json())
      .then((data) => {
        if (data?.url && data.media_type === "image")
          return { url: data.url, title: data.title };
        throw new Error("Invalid NASA APOD response");
      }),

  // 2) Bing Image of the Day
  () =>
    fetch("https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1")
      .then((res) => res.json())
      .then((data) => {
        const img = data?.images?.[0];
        if (img?.url)
          return {
            url: `https://www.bing.com${img.url}`,
            title: img.copyright || "Bing Image",
          };
        throw new Error("Invalid Bing response");
      }),

  // 3) Picsum random image
  () =>
    Promise.resolve({
      url: "https://picsum.photos/800/600",
      title: "Random Image",
    }),
];

const fallbackImage = {
  url: "https://via.placeholder.com/800x600?text=No+Image",
  title: "No image available",
};

export default function ImageOfTheDayCard() {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function fetchWithFallback() {
      setLoading(true);
      for (const fetcher of fetchers) {
        try {
          const result = await fetcher();
          if (mounted) {
            setImage(result);
            setLoading(false);
          }
          return;
        } catch (e) {
          console.warn("Image fetch failed, trying next:", e.message);
        }
      }
      if (mounted) {
        setImage(fallbackImage);
        setLoading(false);
      }
    }

    fetchWithFallback();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="bg-white shadow-md rounded-2xl p-4 h-full flex flex-col">
      <h2 className="text-lg font-semibold mb-2">🖼️ Image of the Day</h2>
      {loading ? (
        <div className="text-sm text-gray-500">Loading...</div>
      ) : (
        <div className="flex-1 flex flex-col">
          <img
            src={image.url}
            alt={image.title}
            className="rounded-md object-cover mb-2 w-full h-48"
            loading="lazy"
          />
          {image.title && (
            <p className="text-sm text-gray-700">
              {image.title}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
