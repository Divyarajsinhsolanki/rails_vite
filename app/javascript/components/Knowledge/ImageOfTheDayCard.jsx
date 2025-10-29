import React, { useEffect, useMemo, useState } from "react";
import BookmarkToggle from "./BookmarkToggle";

const fetchers = [
  () =>
    fetch("https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY")
      .then((res) => res.json())
      .then((data) => {
        if (data?.url && data.media_type === "image")
          return { url: data.url, title: data.title, copyright: data.copyright };
        throw new Error("Invalid NASA APOD response");
      }),
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

export default function ImageOfTheDayCard({
  cardType = "image_of_the_day",
  bookmarkHelpers,
  initialData = null,
  savedBookmark = null,
}) {
  const hasInitialData = initialData !== null && initialData !== undefined;
  const [image, setImage] = useState(() => (hasInitialData ? initialData : null));
  const [loading, setLoading] = useState(!hasInitialData);

  useEffect(() => {
    if (hasInitialData) return;

    let mounted = true;

    async function fetchWithFallback() {
      setLoading(true);
      for (const fetcher of fetchers) {
        try {
          const result = await fetcher();
          if (mounted) {
            setImage({ ...result, fetched_at: new Date().toISOString() });
            setLoading(false);
          }
          return;
        } catch (error) {
          console.warn("Image fetch failed, trying next:", error.message);
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
  }, [hasInitialData]);

  const bookmarkPayload = useMemo(() => {
    if (!image?.url) return null;
    return {
      cardType,
      sourceId: image.url,
      payload: image,
      title: "Image of the Day",
      subtitle: image.title,
      collectionName: savedBookmark?.collection_name,
      reminderIntervalDays: savedBookmark?.reminder_interval_days,
    };
  }, [cardType, image, savedBookmark]);

  const existingBookmark = bookmarkPayload
    ? bookmarkHelpers?.find?.(bookmarkPayload) || savedBookmark
    : savedBookmark;
  const isBookmarked = Boolean(existingBookmark);

  const handleToggle = () => {
    if (!bookmarkPayload) return;
    bookmarkHelpers?.toggle?.({
      ...bookmarkPayload,
      collectionName: existingBookmark?.collection_name ?? bookmarkPayload.collectionName,
    });
  };

  return (
    <div className="bg-white shadow-md rounded-2xl p-4 flex flex-col min-h-[260px]">
      <div className="flex items-start justify-between mb-3">
        <h2 className="text-lg font-semibold">🖼️ Image of the Day</h2>
        <BookmarkToggle
          isBookmarked={isBookmarked}
          onToggle={handleToggle}
          collectionName={existingBookmark?.collection_name}
          disabled={!bookmarkPayload}
        />
      </div>
      {loading ? (
        <div className="text-sm text-gray-500">Loading...</div>
      ) : (
        <div className="flex-1 flex flex-col">
          <img
            src={image?.url}
            alt={image?.title || "Image of the day"}
            className="rounded-md object-cover mb-2 w-full h-48"
            loading="lazy"
          />
          {image?.title && <p className="text-sm text-gray-700">{image.title}</p>}
        </div>
      )}
    </div>
  );
}
