import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { sendEmail, sendSMS } from '../utils/notifications';

const OptIn = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    ig_handle: '',
    keyword: ''
  });
  const [messages, setMessages] = useState([]);
  const [fans, setFans] = useState([]);

  const fetchFans = async () => {
    const { data, error } = await supabase
      .from('fans')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error) setFans(data);
  };

  useEffect(() => {
    fetchFans();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const msgs = [];
    setMessages([]);

    try {
      const { error } = await supabase.from('fans').insert(formData);
      if (error) throw new Error(error.message);
      msgs.push('main done');

      await sendEmail(formData.email);
      msgs.push('mail done');

      if (formData.phone) {
        await sendSMS(formData.phone);
        msgs.push('sms done');
      }

      setMessages(msgs);
      fetchFans();
      setFormData({ name: '', email: '', phone: '', ig_handle: '', keyword: '' });
    } catch (err) {
      msgs.push(`error: ${err.message}`);
      setMessages(msgs);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md p-6 bg-white rounded-xl shadow-md">
        <h2 className="text-2xl font-bold mb-4 text-center">Join the List</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            name="name"
            placeholder="Name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full border px-3 py-2 rounded"
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full border px-3 py-2 rounded"
          />
          <input
            type="tel"
            name="phone"
            placeholder="Phone"
            value={formData.phone}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
          />
          <input
            type="text"
            name="ig_handle"
            placeholder="Instagram Handle"
            value={formData.ig_handle}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
          />
          <input
            type="text"
            name="keyword"
            placeholder="Keyword"
            value={formData.keyword}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
          />
          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded"
          >
            Submit
          </button>
        </form>
        {messages.length > 0 && (
          <div className="mt-4 p-2 rounded bg-green-100 text-green-700 space-y-1">
            {messages.map((msg, idx) => (
              <div key={idx}>{msg}</div>
            ))}
          </div>
        )}

        {fans.length > 0 && (
          <div className="mt-6">
            <h3 className="font-bold mb-2 text-center">Current Fans</h3>
            <ul className="space-y-2">
              {fans.map((fan) => (
                <li key={fan.id} className="border rounded p-2">
                  <div className="font-medium">{fan.name}</div>
                  <div className="text-sm text-gray-600">{fan.email}</div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default OptIn;
