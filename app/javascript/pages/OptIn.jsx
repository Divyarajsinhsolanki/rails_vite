import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { sendEmail, sendSMS } from '../utils/notifications';

// --- SVG Icon Components ---
const Icon = ({ path, className = "w-5 h-5 text-gray-400" }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">{path}</svg>;
const UserIcon = () => <Icon path="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />;
const EmailIcon = () => <Icon path="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />;
const PhoneIcon = () => <Icon path="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.02.75-.25 1.02l-2.2 2.2z" />;
const InstagramIcon = () => <Icon path="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8A3.6 3.6 0 0 0 7.6 20h8.8A3.6 3.6 0 0 0 20 16.4V7.6A3.6 3.6 0 0 0 16.4 4H7.6m9.65 1.5a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5M12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10m0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />;
const LocationIcon = () => <Icon path="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>;
const Spinner = ({ className = "animate-spin h-5 w-5 text-white" }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>;

// --- Reusable Input Field ---
const InputField = ({ name, type, placeholder, value, onChange, required, icon }) => (
  <div>
    <label htmlFor={name} className="text-sm font-medium text-gray-700 sr-only">{placeholder}</label>
    <div className="relative">
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
        {icon}
      </div>
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        className="block w-full rounded-lg border border-gray-300 bg-gray-50 py-2.5 pl-10 pr-3 text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
      />
    </div>
  </div>
);

// --- Main Opt-In Component ---
const OptIn = () => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    instagram_handle: '',
    location: null,
  });
  const [fans, setFans] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });
  const [locationDisplay, setLocationDisplay] = useState('');

  const fetchFans = useCallback(async () => {
    const { data, error } = await supabase
      .from('fans')
      .select('id, first_name, last_name, email, joined_at')
      .order('joined_at', { ascending: false });
    if (error) {
      console.error("Error fetching fans:", error.message);
    } else {
      setFans(data);
    }
  }, []);

  useEffect(() => {
    fetchFans();
  }, [fetchFans]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
        setNotification({ show: true, type: 'error', message: 'Geolocation is not supported by your browser.' });
        return;
    }
    setIsFetchingLocation(true);
    setLocationDisplay('Fetching location...');
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            const locationData = { latitude, longitude };
            setFormData(prev => ({ ...prev, location: locationData }));
            setLocationDisplay(`Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}`);
            setIsFetchingLocation(false);
        },
        (error) => {
            setNotification({ show: true, type: 'error', message: `Unable to retrieve location: ${error.message}` });
            setLocationDisplay('');
            setIsFetchingLocation(false);
        }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setNotification({ show: false, type: '', message: '' });

    // Prepare data for insertion, ensuring optional fields are handled
    const submissionData = {
        ...formData,
        phone: formData.phone || null,
        instagram_handle: formData.instagram_handle || null,
    };

    try {
      // 1. Insert into Supabase
      const { error: dbError } = await supabase.from('fans').insert(submissionData);
      if (dbError) throw new Error(`Database error: ${dbError.message}`);

      // 2. Send Notifications
      await sendEmail(formData.email);
      if (formData.phone) {
        await sendSMS(formData.phone);
      }

      // 3. Success state update
      setNotification({ show: true, type: 'success', message: "You're on the list! Welcome. 🎉" });
      fetchFans();
      setFormData({ first_name: '', last_name: '', email: '', phone: '', instagram_handle: '', location: null });
      setLocationDisplay('');

    } catch (err) {
        setNotification({ show: true, type: 'error', message: err.message || 'An unexpected error occurred.' });
    } finally {
        setIsLoading(false);
    }
  };
  
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4 font-sans">
      <div className="w-full max-w-6xl rounded-xl bg-white p-8 shadow-xl">
        <div className="grid grid-cols-1 gap-x-12 gap-y-8 md:grid-cols-2">

          {/* --- Left Column: Information & Fan List --- */}
          <div className="flex flex-col justify-center">
            <h1 className="text-4xl font-bold text-gray-800">Join the Community</h1>
            <p className="mt-3 text-gray-600">
              Be the first to get updates, exclusive content, and behind-the-scenes access. Fill out the form to connect.
            </p>
            <div className="mt-8 overflow-hidden rounded-lg border border-gray-200">
                <h3 className="bg-slate-800 p-4 text-lg font-semibold text-white">Most Recent Fans ✨</h3>
                <div className="max-h-96 overflow-y-auto">
                    <table className="min-w-full text-left text-sm">
                        <thead className="sticky top-0 bg-slate-100 uppercase text-slate-600">
                            <tr>
                                <th className="px-4 py-3">Name</th>
                                <th className="px-4 py-3">Email</th>
                                <th className="px-4 py-3">Joined</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {fans.length > 0 ? fans.map((fan) => (
                                <tr key={fan.id} className="hover:bg-slate-50">
                                    <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900">{fan.first_name} {fan.last_name}</td>
                                    <td className="whitespace-nowrap px-4 py-3 text-gray-600">{fan.email}</td>
                                    <td className="whitespace-nowrap px-4 py-3 text-gray-500">{new Date(fan.joined_at).toLocaleDateString()}</td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="3" className="py-4 text-center text-gray-500">No fans yet. Be the first!</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
          </div>

          {/* --- Right Column: Form --- */}
          <div>
            <h2 className="text-2xl font-semibold text-gray-800">Sign Up Now</h2>
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <InputField name="first_name" type="text" placeholder="First Name" value={formData.first_name} onChange={handleChange} required icon={<UserIcon />} />
                <InputField name="last_name" type="text" placeholder="Last Name" value={formData.last_name} onChange={handleChange} required icon={<UserIcon />} />
              </div>
              <InputField name="email" type="email" placeholder="Email Address" value={formData.email} onChange={handleChange} required icon={<EmailIcon />} />
              <InputField name="phone" type="tel" placeholder="Phone (Optional)" value={formData.phone} onChange={handleChange} icon={<PhoneIcon />} />
              <InputField name="instagram_handle" type="text" placeholder="Instagram Handle (Optional)" value={formData.instagram_handle} onChange={handleChange} icon={<InstagramIcon />} />
              
              <div>
                <div className="relative">
                   <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <LocationIcon />
                   </div>
                    <input
                        type="text"
                        readOnly
                        value={locationDisplay}
                        placeholder="Location (Optional)"
                        className="block w-full rounded-lg border border-gray-300 bg-gray-50 py-2.5 pl-10 pr-3 text-gray-900 placeholder:text-gray-400 sm:text-sm"
                    />
                    <button 
                        type="button"
                        onClick={handleGetLocation}
                        disabled={isFetchingLocation}
                        className="absolute inset-y-0 right-0 flex items-center rounded-r-lg bg-gray-200 px-3 text-sm font-medium text-gray-600 hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                       {isFetchingLocation ? <Spinner className="animate-spin h-4 w-4 text-gray-600"/> : 'Get'}
                    </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-base font-semibold text-white shadow-sm transition-colors duration-300 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-indigo-400"
              >
                {isLoading ? <Spinner /> : 'Submit & Join'}
              </button>
            </form>

            {notification.show && (
              <div className={`mt-5 flex items-start space-x-3 rounded-lg p-4 ${notification.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                <div className="flex-shrink-0">
                  <Icon path={notification.type === 'success' ? "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" : "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"} />
                </div>
                <p className="flex-1 text-sm font-medium">{notification.message}</p>
                <button onClick={() => setNotification(prev => ({ ...prev, show: false }))} className="text-inherit hover:bg-black/10 rounded-full p-1 -mr-2 -mt-2">
                  <Icon path="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};

export default OptIn;
