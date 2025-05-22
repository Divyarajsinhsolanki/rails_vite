import React, { useEffect, useState } from "react";
import { fetchUserInfo, updateUserInfo, fetchPosts } from "../components/api"; // Adjust the import path as necessary

const Profile = () => {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateUserInfo({auth: formData});
      setEditMode(false);
      refreshUserInfo();
    } catch (error) {
      console.error("Error updating user info:", error);
    }
  };

  return (
    <div className="flex flex-col items-center mt-10">
      {!editMode && (
        <div className="flex flex-col md:flex-row gap-6 p-8 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl shadow-lg w-full max-w-7xl">
          
          {/* Profile Section */}
          <div className="w-full md:w-1/3 bg-white p-6 rounded-2xl shadow-md">
            <h2 className="text-3xl font-bold text-gray-800 mb-6 border-b pb-2">My Profile</h2>
            
            {/* Profile Image */}
            {user?.profile_picture ? (
              <img
                src={user.profile_picture}
                alt="Profile"
                className="w-36 h-36 mx-auto rounded-full object-cover mb-6 border-4 border-blue-200 shadow"
              />
            ) : (
              <div className="w-36 h-36 mx-auto rounded-full bg-gray-300 mb-6 flex items-center justify-center text-lg text-gray-600 shadow-inner">
                No Image
              </div>
            )}

            {/* User Info */}
            <div className="text-center text-gray-700 space-y-2">
              {user ? (
                <>
                  <p className="text-xl font-semibold">{user.first_name} {user.last_name}</p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                  {user.date_of_birth && (<p className="text-sm text-gray-500">DOB: {user.date_of_birth}</p>)}
                  <button
                    className="mt-5 px-5 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition shadow"
                    onClick={() => setEditMode(true)}
                  >
                    Edit Profile
                  </button>
                </>
              ) : (
                <p className="text-gray-400">Loading user information...</p>
              )}
            </div>
          </div>

          {/* Posts Section */}
          <div className="w-full md:w-2/3 bg-white p-6 rounded-2xl shadow-md">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">Posts</h2>
            {posts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {posts.map(post => (
                  <div key={post.id} className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition">
                    {post.image_url && (
                      <img
                        src={post.image_url}
                        alt="No image available"
                        className="w-full h-48 object-cover"
                      />
                    )}
                    <div className="p-4 text-gray-600">
                      <p>{post.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No posts available.</p>
            )}
          </div>
        </div>
      )}

      {/* Edit Form */}
      {editMode && (
        <form onSubmit={handleSubmit} className="mt-10 bg-white shadow-lg rounded-2xl p-8 w-full max-w-2xl" encType="multipart/form-data">
          <h3 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">Edit Profile</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input
                type="text"
                id="first_name"
                name="first_name"
                value={formData.first_name}
                onChange={handleInputChange}
                placeholder="First name"
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                required
              />
            </div>

            <div>
              <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input
                type="text"
                id="last_name"
                name="last_name"
                value={formData.last_name}
                onChange={handleInputChange}
                placeholder="Last name"
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                required
              />
            </div>
          </div>

          <div className="mt-6">
            <label htmlFor="date_of_birth" className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
            <input
              type="date"
              id="date_of_birth"
              name="date_of_birth"
              value={formData.date_of_birth}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              required
            />
          </div>

          <div className="mt-6">
            <label htmlFor="profile_picture" className="block text-sm font-medium text-gray-700 mb-1">Profile Picture</label>
            <input
              type="file"
              id="profile_picture"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>

          <div className="flex justify-between mt-8">
            <button
              type="submit"
              className="px-6 py-2 bg-green-600 text-white font-semibold rounded-full hover:bg-green-700 transition shadow"
            >
              Save Changes
            </button>
            <button
              type="button"
              onClick={() => setEditMode(false)}
              className="px-6 py-2 bg-red-500 text-white font-semibold rounded-full hover:bg-red-600 transition shadow"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default Profile;
