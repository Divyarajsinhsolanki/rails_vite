import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { fetchUserInfo, updateUserInfo, fetchPosts, SchedulerAPI, fetchTeams } from "../components/api";
import { getStatusClasses } from '/utils/taskUtils';
import { Squares2X2Icon } from '@heroicons/react/24/outline';

const Avatar = ({ name, src }) => {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className="w-8 h-8 rounded-full object-cover border-2 border-white"
      />
    );
  }
  const initial = name ? name.charAt(0).toUpperCase() : "?";
  return (
    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-500 border-2 border-white">
      {initial}
    </div>
  );
};

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [teams, setTeams] = useState([]);
  const [projects, setProjects] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState('posts');
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    date_of_birth: "",
    profile_picture: null,
    cover_photo: null,
  });

  const refreshUserInfo = async () => {
    try {
      const { data } = await fetchUserInfo();
      setUser(data.user);

      const basicTeams = Array.isArray(data.teams) ? data.teams : [];
      try {
        const { data: allTeams } = await fetchTeams();
        const filtered = Array.isArray(allTeams) ? allTeams.filter(t => basicTeams.some(bt => bt.id === t.id)) : [];
        const merged = filtered.map(t => ({
          ...t,
          ...basicTeams.find(bt => bt.id === t.id)
        }));
        setTeams(merged);
      } catch {
        setTeams(basicTeams);
      }

      setProjects(Array.isArray(data.projects) ? data.projects : []);
      setFormData({
        first_name: data.user.first_name,
        last_name: data.user.last_name,
        date_of_birth: data.user.date_of_birth,
        profile_picture: data.user.profile_picture,
        cover_photo: data.user.cover_photo,
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
    const { name, files } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: files[0],
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
    if (formData.cover_photo instanceof File) {
      payload.append("auth[cover_photo]", formData.cover_photo);
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

  const todayStr = new Date().toISOString().split("T")[0];
  const dueTodayTasks = useMemo(
    () => tasks.filter((t) => (t.end_date || t.due_date) === todayStr),
    [tasks, todayStr]
  );
  const otherTasks = useMemo(
    () => tasks.filter((t) => (t.end_date || t.due_date) !== todayStr),
    [tasks, todayStr]
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 md:p-8">
      {/* Main Container */}
      <div className="max-w-7xl mx-auto">
        {/* Profile Header */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden mb-8">
          <div className="relative h-48 bg-gradient-to-r from-blue-500 to-indigo-600">
            {/* Cover Photo */}
            {user?.cover_photo && user.cover_photo !== 'null' && (
              <img src={user.cover_photo} alt="Cover" className="absolute inset-0 w-full h-full object-cover" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            {editMode && (
              <label className="absolute bottom-2 right-2 bg-white p-2 rounded-full shadow-md cursor-pointer hover:bg-gray-100 transition">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
                <input type="file" name="cover_photo" className="hidden" onChange={handleFileChange} accept="image/*" />
              </label>
            )}
          </div>
          
          <div className="px-8 pb-8 -mt-16 relative z-10">
            <div className="flex flex-col md:flex-row items-center md:items-end gap-6">
              {/* Profile Picture */}
              <div className="relative group">
                {user?.profile_picture && user.profile_picture !== 'null' ? (
                  <img
                    src={user.profile_picture}
                    alt="Profile"
                    className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-white shadow-lg transition-all duration-300 hover:shadow-xl"
                  />
                ) : (
                  <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-tr from-indigo-500 to-blue-500 text-white text-5xl md:text-6xl font-bold flex items-center justify-center border-4 border-white shadow-lg">
                    {initial}
                  </div>
                )}
                {editMode && (
                  <label className="absolute bottom-2 right-2 bg-white p-2 rounded-full shadow-md cursor-pointer hover:bg-gray-100 transition">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                    <input type="file" name="profile_picture" className="hidden" onChange={handleFileChange} accept="image/*" />
                  </label>
                )}
              </div>

              {/* User Info */}
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
                  {user ? displayName : "Loading..."}
                </h1>
                <p className="text-blue-600 mt-1">{user?.email}</p>
                {user?.date_of_birth && (
                  <p className="text-gray-500 mt-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                    Born on {new Date(user.date_of_birth).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                )}
                
                <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-3">
                  <div className="bg-blue-50 px-4 py-2 rounded-full flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v1h8v-1zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-1a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v1h-3zM4.75 12.094A5.973 5.973 0 004 15v1H1v-1a3 3 0 013.75-2.906z" />
                    </svg>
                    <span className="text-sm font-medium">{teams.length} Teams</span>
                  </div>
                  <div className="bg-purple-50 px-4 py-2 rounded-full flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2H5a1 1 0 010-2h12a2 2 0 001-2V4a2 2 0 00-2-2H6a2 2 0 00-2 2z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-medium">{projects.length} Projects</span>
                  </div>
                  <div className="bg-green-50 px-4 py-2 rounded-full flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-medium">{tasks.length} Tasks</span>
                  </div>
                </div>
              </div>

              {/* Edit Button */}
              {!editMode && (
                <button
                  onClick={() => setEditMode(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-full hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                  Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Content Tabs */}
        <div className="mb-8">
          <div className="flex overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => setActiveTab('posts')}
              className={`px-6 py-3 font-medium rounded-t-lg whitespace-nowrap ${activeTab === 'posts' ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              My Posts
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className={`px-6 py-3 font-medium rounded-t-lg whitespace-nowrap ${activeTab === 'tasks' ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              My Tasks
            </button>
            <button
              onClick={() => setActiveTab('teams')}
              className={`px-6 py-3 font-medium rounded-t-lg whitespace-nowrap ${activeTab === 'teams' ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              My Teams
            </button>
            <button
              onClick={() => setActiveTab('projects')}
              className={`px-6 py-3 font-medium rounded-t-lg whitespace-nowrap ${activeTab === 'projects' ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              My Projects
            </button>
          </div>
          <div className="bg-white rounded-b-xl rounded-tr-xl shadow-lg p-6">
            {activeTab === 'posts' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Recent Posts</h2>
                {posts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {posts.map((post) => (
                      <div key={post.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-300">
                        {post.image_url && (
                          <img
                            src={post.image_url}
                            alt="Post"
                            className="w-full h-48 object-cover"
                          />
                        )}
                        <div className="p-5">
                          <div className="flex items-center text-sm text-gray-500 mb-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                          <p className="text-gray-700 line-clamp-3">{post.message}</p>
                          <button className="mt-3 text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center">
                            Read more
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="mt-4 text-lg font-medium text-gray-700">No posts yet</h3>
                    <p className="mt-1 text-gray-500">Share your thoughts with your team!</p>
                    <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                      Create your first post
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'tasks' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">My Tasks</h2>
                {tasks.length > 0 ? (
                  <>
                    {dueTodayTasks.length > 0 && (
                      <div className="mb-8">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-xl font-semibold text-gray-700">Due Today</h3>
                          <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                            {dueTodayTasks.length} urgent
                          </span>
                        </div>
                        <div className="space-y-3">
                          {dueTodayTasks.map((task) => (
                            <div key={task.id} className="p-4 bg-white border border-gray-100 rounded-lg shadow-sm hover:shadow-md transition">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h3 className="font-medium text-gray-800">{task.task_id}</h3>
                                  <div className="flex items-center mt-1 space-x-3">
                                    <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${getStatusClasses(task.status)}`}>
                                      {task.status}
                                    </span>
                                    <span className="text-xs text-gray-500 flex items-center">
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                      </svg>
                                      Due today
                                    </span>
                                  </div>
                                </div>
                                <button className="text-gray-400 hover:text-gray-600">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                  </svg>
                                </button>
                              </div>
                              {task.sprint?.project_id && (
                                <button
                                  onClick={() => navigate(`/projects/${task.sprint.project_id}/dashboard`)}
                                  className="mt-2 flex items-center text-sm text-blue-600 hover:underline"
                                >
                                  <Squares2X2Icon className="h-4 w-4 mr-1" />Board
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <h3 className="text-xl font-semibold text-gray-700 mb-4">All Tasks</h3>
                      {otherTasks.length > 0 ? (
                        <div className="space-y-3">
                          {otherTasks.map((task) => (
                            <div key={task.id} className="p-4 bg-white border border-gray-100 rounded-lg shadow-sm hover:shadow-md transition">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h3 className="font-medium text-gray-800">{task.task_id}</h3>
                                  <div className="flex items-center mt-1 space-x-3">
                                    <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${getStatusClasses(task.status)}`}>
                                      {task.status}
                                    </span>
                                    <span className="text-xs text-gray-500 flex items-center">
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                      </svg>
                                      Due {new Date(task.end_date || task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </span>
                                  </div>
                                </div>
                                <button className="text-gray-400 hover:text-gray-600">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                  </svg>
                                </button>
                              </div>
                              {task.sprint?.project_id && (
                                <button
                                  onClick={() => navigate(`/projects/${task.sprint.project_id}/dashboard`)}
                                  className="mt-2 flex items-center text-sm text-blue-600 hover:underline"
                                >
                                  <Squares2X2Icon className="h-4 w-4 mr-1" />Board
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          <p className="mt-4 text-gray-500">No upcoming tasks</p>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <h3 className="mt-4 text-lg font-medium text-gray-700">No tasks assigned</h3>
                    <p className="mt-1 text-gray-500">You're all caught up!</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'teams' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">My Teams</h2>
                {teams.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {teams.map((team) => (
                      <div key={team.id} className="border border-gray-100 rounded-lg p-6 hover:shadow-md transition">
                        <div className="flex items-center mb-4">
                          <div className="flex -space-x-2">
                            {team.users.slice(0,3).map((m) => (
                              <Avatar key={m.id} name={m.name} src={m.profile_picture} />
                            ))}
                            {team.users.length > 3 && (
                              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs text-gray-500 border-2 border-white">
                                +{team.users.length - 3}
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <h3 className="font-bold text-gray-800">{team.name}</h3>
                            <span className="text-xs text-gray-500">{team.role}</span>
                          </div>
                        </div>
                        <div className="text-sm text-gray-500 mb-2">{team.users.length} members</div>
                        <button
                          onClick={() => navigate('/teams', { state: { teamId: team.id } })}
                          className="mt-4 w-full py-2 text-sm font-medium text-blue-600 hover:text-blue-800 border border-blue-100 rounded-lg hover:bg-blue-50 transition"
                        >
                          View Team
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <h3 className="mt-4 text-lg font-medium text-gray-700">No team memberships</h3>
                    <p className="mt-1 text-gray-500">Join or create a team to collaborate</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'projects' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">My Projects</h2>
                {projects.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map((project) => (
                      <div key={project.id} className="border border-gray-100 rounded-lg p-6 hover:shadow-md transition">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-bold text-gray-800">{project.name}</h3>
                          <span className="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded-full">{project.role}</span>
                        </div>
                        <p className="text-sm text-gray-500 mb-6 line-clamp-2">{project.description || 'No description provided.'}</p>
                        <div className="flex justify-between items-center">
                          <div className="flex -space-x-2">
                            {project.members.slice(0,3).map((m) => (
                              m.profile_picture ? (
                                <img
                                  key={m.id}
                                  src={m.profile_picture}
                                  alt={m.name}
                                  className="w-8 h-8 rounded-full border-2 border-white object-cover"
                                />
                              ) : (
                                <div
                                  key={m.id}
                                  className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs font-medium text-gray-500"
                                >
                                  {m.name.charAt(0).toUpperCase()}
                                </div>
                              )
                            ))}
                            {project.members.length > 3 && (
                              <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-xs text-gray-500">
                                +{project.members.length - 3}
                              </div>
                            )}
                          </div>
                          {project.end_date && (
                            <div className="text-xs text-gray-500">
                              Due {new Date(project.end_date).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => navigate(`/projects/${project.id}/dashboard`)}
                          className="mt-4 w-full py-2 text-sm font-medium text-purple-600 hover:text-purple-800 border border-purple-100 rounded-lg hover:bg-purple-50 transition"
                        >
                          View Project
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="mt-4 text-lg font-medium text-gray-700">No projects assigned</h3>
                    <p className="mt-1 text-gray-500">Get started by joining a project</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {editMode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white">
              <h3 className="text-2xl font-bold">Edit Profile</h3>
              <p className="opacity-90">Update your personal information</p>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6" encType="multipart/form-data">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    name="date_of_birth"
                    value={formData.date_of_birth}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Profile Picture</label>
                  <div className="mt-1 flex items-center">
                    <label className="inline-block w-full overflow-hidden rounded-lg bg-gray-100">
                      <div className="px-4 py-2 text-sm text-gray-500 flex items-center justify-between">
                        <span>{formData.profile_picture instanceof File ? formData.profile_picture.name : 'Choose file...'}</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <input
                        type="file"
                        id="profile_picture"
                        accept="image/*"
                        name="profile_picture"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cover Photo</label>
                  <div className="mt-1 flex items-center">
                    <label className="inline-block w-full overflow-hidden rounded-lg bg-gray-100">
                      <div className="px-4 py-2 text-sm text-gray-500 flex items-center justify-between">
                        <span>{formData.cover_photo instanceof File ? formData.cover_photo.name : 'Choose file...'}</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <input
                        type="file"
                        id="cover_photo"
                        name="cover_photo"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setEditMode(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;