import React, { useEffect, useState } from "react";
import { fetchUserInfo, updateUserInfo, fetchPosts, SchedulerAPI } from "../components/api"; // Adjust the import path as necessary

const Profile = () => {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    date_of_birth: "",
    profile_picture: null,
  });

  const refreshUserInfo = async () => {
    try {
      const { data } = await fetchUserInfo();
      setUser(data.user);
      setFormData({
        first_name: data.user.first_name,
        last_name: data.user.last_name,
        date_of_birth: data.user.date_of_birth,
        profile_picture: data.user.profile_picture,
      });
      const postsResponse = await fetchPosts(data.user.id);
      setPosts(postsResponse.data);
      const tasksResponse = await SchedulerAPI.getTasks({ assigned_to_user: data.user.id });
      setTasks(tasksResponse.data);
    } catch (error) {
      console.error("Error fetching user info:", error);
    }
  };

  useEffect(() => {
    refreshUserInfo();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    setFormData((prevData) => ({
      ...prevData,
      profile_picture: e.target.files[0],
    }));
  };

  function getCSRFToken() {
    const meta = document.querySelector("meta[name='csrf-token']");
    return meta?.getAttribute("content");
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = new FormData();
    payload.append("auth[first_name]", formData.first_name);
    payload.append("auth[last_name]", formData.last_name);
    payload.append("auth[date_of_birth]", formData.date_of_birth);
  
    if (formData.profile_picture instanceof File) {
      payload.append("auth[profile_picture]", formData.profile_picture);
    }

    try {
      const res = await fetch("/api/update_profile", {
        method: "POST",
        body: payload,
        headers: {
          "Accept": "application/json",
          "X-CSRF-Token": getCSRFToken()
        },
        credentials: "include"
      });

      if (!res.ok) throw new Error("Update failed");

      setEditMode(false);
      refreshUserInfo();
    } catch (error) {
      console.error("Error updating user info:", error);
    }
  };

  const displayName = user
    ? ([user.first_name, user.last_name]
        .filter((n) => n && n !== "null")
        .join(" ") || "Unnamed User")
    : "";

  const initial = (user?.first_name || user?.email || "").charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4">
      <div className={`w-full max-w-4xl transition-opacity duration-500 ${editMode ? 'opacity-0' : 'opacity-100'}`}>
        {!editMode && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex flex-col md:flex-row items-center md:items-start text-center md:text-left">
              {/* Profile Image with a subtle border animation */}
              <div className="relative group">
                {user?.profile_picture && user.profile_picture !== 'null' ? (
                  <img
                    src={user.profile_picture}
                    alt="Profile"
                    className="w-40 h-40 rounded-full object-cover border-4 border-transparent group-hover:border-blue-300 transition-all duration-300"
                  />
                ) : (
                  <div className="w-40 h-40 rounded-full bg-gradient-to-tr from-indigo-500 to-blue-500 text-white text-6xl font-bold flex items-center justify-center">
                    {initial}
                  </div>
                )}
                <div className="absolute inset-0 rounded-full bg-black bg-opacity-25 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <p className="text-white text-lg">Change</p>
                </div>
              </div>

              {/* User Info with more spacing and better typography */}
              <div className="md:ml-8 mt-6 md:mt-0">
                <h1 className="text-4xl font-extrabold text-gray-800">
                  {user ? displayName : "Loading..."}
                </h1>
                <p className="text-md text-gray-500 mt-1">{user?.email}</p>
                {user?.date_of_birth && (
                  <p className="text-md text-gray-500">Born on {new Date(user.date_of_birth).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                )}
                <button
                  onClick={() => setEditMode(true)}
                  className="mt-6 px-6 py-2 bg-blue-500 text-white font-semibold rounded-full hover:bg-blue-600 active:bg-blue-700 transition transform hover:scale-105"
                >
                  Edit Profile
                </button>
              </div>
            </div>

            {/* Posts Section with a cleaner grid */}
            <div className="mt-12">
              <h2 className="text-2xl font-bold text-gray-700 mb-6">My Posts</h2>
              {posts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {posts.map((post) => (
                    <div key={post.id} className="bg-white rounded-xl shadow-md overflow-hidden transform hover:-translate-y-2 transition-transform duration-300">
                      {post.image_url && (
                        <img
                          src={post.image_url}
                          alt="Post"
                          className="w-full h-48 object-cover"
                        />
                      )}
                      <div className="p-5">
                        <p className="text-gray-600">{post.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">You haven't posted anything yet.</p>
              )}
            </div>

            {/* Tasks Section */}
            <div className="mt-12">
              <h2 className="text-2xl font-bold text-gray-700 mb-6">My Tasks</h2>
              {tasks.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {tasks.map((task) => (
                    <div key={task.id} className="bg-white rounded-xl shadow-md p-5">
                      <h3 className="text-lg font-semibold text-gray-800 break-all">{task.task_id}</h3>
                      <p className="text-sm text-gray-500 capitalize">{task.status}</p>
                      {task.due_date && (
                        <p className="text-sm text-gray-500">Due {new Date(task.due_date).toLocaleDateString()}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">No tasks assigned.</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Edit Form with a slide-in animation */}
      <div className={`w-full max-w-2xl mt-10 transition-transform duration-500 ${editMode ? 'translate-y-0' : 'translate-y-full'}`}>
        {editMode && (
          <form onSubmit={handleSubmit} className="bg-white shadow-2xl rounded-2xl p-8" encType="multipart/form-data">
            <h3 className="text-3xl font-bold text-gray-800 mb-8 text-center">Edit Your Profile</h3>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  placeholder="First Name"
                  className="w-full p-3 bg-gray-100 border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  required
                />
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  placeholder="Last Name"
                  className="w-full p-3 bg-gray-100 border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  required
                />
              </div>
              <input
                type="date"
                name="date_of_birth"
                value={formData.date_of_birth}
                onChange={handleInputChange}
                className="w-full p-3 bg-gray-100 border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
              />
              <div>
                <label htmlFor="profile_picture" className="block text-sm font-medium text-gray-600 mb-2">Update Profile Picture</label>
                <input
                  type="file"
                  id="profile_picture"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
            </div>

            <div className="flex justify-around mt-10">
              <button
                type="submit"
                className="px-8 py-3 bg-green-500 text-white font-bold rounded-full hover:bg-green-600 transition-transform transform hover:scale-105"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setEditMode(false)}
                className="px-8 py-3 bg-red-500 text-white font-bold rounded-full hover:bg-red-600 transition-transform transform hover:scale-105"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
export default Profile;
