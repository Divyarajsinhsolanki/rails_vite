import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { fetchTicket } from "../components/api";

const Ticket = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [qrData, setQrData] = useState(null);

  useEffect(() => {
    const loadTicket = async () => {
      try {
        const { data } = await fetchTicket(sessionId);
        setQrData(data.qr_data);
      } catch (err) {
        console.error("Failed to load ticket", err);
      }
    };
    if (sessionId) loadTicket();
  }, [sessionId]);

  if (!sessionId) {
    return <div className="p-8 text-center">Invalid ticket session.</div>;
  }

  return (
    <div className="max-w-xl mx-auto p-8 text-center">
      <h1 className="text-2xl font-bold mb-4">Your Ticket</h1>
      {qrData ? (
        <>
          <img src={`data:image/png;base64,${qrData}`} alt="QR Code" className="mx-auto mb-4" />
          <a
            href={`/api/ticket/download?session_id=${sessionId}`}
            className="text-blue-600 underline"
          >
            Download Ticket
          </a>
        </>
      ) : (
        <p>Loading ticket...</p>
      )}
    </div>
  );
};

export default Ticket;
