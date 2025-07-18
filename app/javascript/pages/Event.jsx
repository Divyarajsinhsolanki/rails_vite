import React from "react";
import { bookEvent } from "../components/api";
import { Toaster, toast } from "react-hot-toast";

const Event = () => {
  const handleBook = async () => {
    try {
      const { data } = await bookEvent();
      window.location.href = data.url; // Redirect to Stripe Checkout
    } catch {
      toast.error("Unable to start checkout. Please try again.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8">
      <Toaster position="top-right" />
      <h1 className="text-3xl font-bold mb-4">Tech Conference 2024</h1>
      <p className="mb-2">Join us for an exciting day of talks and workshops about the latest in technology.</p>
      <ul className="mb-4">
        <li><strong>Date:</strong> June 30, 2024</li>
        <li><strong>Time:</strong> 10:00 AM - 4:00 PM</li>
        <li><strong>Place:</strong> Innovation Hall, San Francisco</li>
      </ul>
      <button
        onClick={handleBook}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
      >
        Book Tickets
      </button>
    </div>
  );
};

export default Event;
