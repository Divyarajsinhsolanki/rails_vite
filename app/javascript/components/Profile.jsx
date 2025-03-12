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
      console.log(postsResponse);
      console.log(postsResponse.data);
      console.log(postsResponse.data);
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
        <div className="flex flex-col md:flex-row justify-between items-start p-6 bg-gray-100 rounded-lg shadow-md">
          {/* Profile Section */}
          <div className="w-full md:w-1/3 bg-white p-4 rounded-lg shadow">
            <h2 className="text-3xl font-bold mb-6">User Profile</h2>
            {/* Profile Image */}
            {user?.profile_picture ? (
              <img
                src={user.profile_picture}
                alt="Profile"
                className="w-32 h-32 rounded-full object-cover mb-4"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-gray-300 mb-4 flex items-center justify-center">
                <span className="text-gray-500">No Image</span>
              </div>
            )}
    
            {/* User Info */}
            <div className="text-lg">
              {user ? (
                <>
                  <p className="font-semibold">{user.first_name} {user.last_name}</p>
                  <p className="text-gray-600">{user.email}</p>
                  {user.date_of_birth && (<p className="text-gray-600">DOB: {user.date_of_birth}</p>)}
                  <button className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition duration-200" onClick={() => setEditMode(true)}>
                    Edit Profile
                  </button>
                </>
              ) : (
                <p className="text-gray-500">Loading user information...</p>
              )}
            </div>
          </div>
    
          {/* Posts Section */}
          <div className="w-full md:w-2/3 bg-white p-4 rounded-lg shadow mt-4 md:mt-0 md:ml-4">
            <h2 className="text-2xl font-bold mb-4">Posts</h2>
            {posts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {posts.map(post => (
                  <div key={post.id} className="border rounded-lg overflow-hidden shadow">
                    {post.image_url && (
                      <img
                        src={post.image_url}
                        alt="No image available"
                        className="w-full h-48 object-cover"
                      />
                    )}
                    <div className="p-4">
                      <p className="text-gray-600">{post.message}</p>
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
        <form onSubmit={handleSubmit} className="mt-6 bg-white shadow-md rounded px-8 py-6" encType="multipart/form-data">
          <h3 className="text-xl font-semibold mb-4">Edit Profile</h3>

          <div className="mb-4">
            <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">First Name</label>
            <input
              type="text"
              id="first_name"
              name="first_name"
              value={formData.first_name}
              onChange={handleInputChange}
              placeholder="Enter your first name"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 p-2"
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">Last Name</label>
            <input
              type="text"
              id="last_name"
              name="last_name"
              value={formData.last_name}
              onChange={handleInputChange}
              placeholder="Enter your last name"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 p-2"
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="date_of_birth" className="block text-sm font-medium text-gray-700">Date of Birth</label>
            <input
              type="date"
              id="date_of_birth"
              name="date_of_birth"
              value={formData.date_of_birth}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 p-2"
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="profile_picture" className="block text-sm font-medium text-gray-700">Profile Picture</label>
            <input
              type="file"
              id="profile_picture"
              accept="image/*"
              onChange={handleFileChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 p-2"
            />
          </div>

          <div className="flex items-center justify-between mt-6">
            <button
              type="submit"
              className="px-4 py-2 bg-green-500 text-white font-semibold rounded hover:bg-green-600 transition duration-200"
            >
              Save Changes
            </button>
            <button
              type="button"
              onClick={() => setEditMode(false)}
              className="px-4 py-2 bg-red-500 text-white font-semibold rounded hover:bg-red-600 transition duration-200"
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
