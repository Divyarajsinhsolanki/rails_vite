import React, { useEffect, useState, useCallback, useContext } from "react";
import { fetchPosts, SchedulerAPI, fetchProjects } from "../components/api";
import { AuthContext } from "../context/AuthContext";
import PostForm from "../components/PostForm";
import PostList from "../components/PostList";
import { Toaster } from "react-hot-toast";
import { FiActivity, FiUsers, FiMessageSquare } from "react-icons/fi";

const PostPage = () => {
  const { user } = useContext(AuthContext);
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ totalPosts: 0, activeUsers: 0 });
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);

  const refreshPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await fetchPosts();
      const sortedPosts = (Array.isArray(data) ? data : []).sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );
      setPosts(sortedPosts);
      
      // Simulate stats (replace with actual API calls in a real app)
      setStats({
        totalPosts: sortedPosts.length,
        activeUsers: new Set(sortedPosts.map(post => post.user.id)).size
      });
    } catch (error) {
      console.error("Error fetching posts:", error);
      setPosts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshPosts();
  }, [refreshPosts]);

  useEffect(() => {
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];

    SchedulerAPI.getTasks({ assigned_to_user: user.id })
      .then((res) => {
        const overdue = (Array.isArray(res.data) ? res.data : []).filter(
          (t) => t.end_date && t.status !== 'completed' && t.end_date < today
        );
        setTasks(overdue);
      })
      .catch(() => setTasks([]));

    fetchProjects().then(({ data }) => {
      const userProjects = Array.isArray(data)
        ? data.filter((p) => p.users.some((u) => u.id === user.id))
        : [];
      setProjects(userProjects);
    });
  }, [user]);

  return (
    <div className="bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen font-sans">
      <Toaster position="top-right" toastOptions={{
        style: {
          borderRadius: '12px',
          background: '#334155',
          color: '#fff',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
        }
      }} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        <aside className="lg:col-span-3">
          <h2 className="text-xl font-semibold mb-4">Today's Overdue Tasks</h2>
          {tasks.length ? (
            <ul className="space-y-3">
              {tasks.map((task) => (
                <li key={task.id} className="bg-white p-4 rounded-lg shadow border">
                  <p className="font-medium">
                    {task.title || task.task_id}
                  </p>
                  <p className="text-sm text-gray-500">Due {task.end_date}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p>No overdue tasks for today.</p>
          )}
        </aside>

        <div className="lg:col-span-6">
          {/* Page Header */}
        <header className="mb-10 text-center">
          <div className="inline-flex items-center justify-center bg-white p-3 rounded-full shadow-sm border border-slate-200 mb-6">
            <div className="bg-[rgb(var(--theme-color-rgb)/0.1)] p-3 rounded-full">
              <FiMessageSquare className="text-[var(--theme-color)] text-2xl" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-slate-800 tracking-tight mb-3">
            Home
          </h1>
          <p className="text-slate-600 max-w-lg mx-auto">
            Connect with others, share your thoughts, and discover what's happening in our community.
          </p>
        </header>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center">
              <div className="bg-[rgb(var(--theme-color-rgb)/0.1)] p-3 rounded-lg mr-4">
                <FiMessageSquare className="text-[var(--theme-color)]" />
              </div>
              <div>
                <p className="text-slate-500 text-sm">Total Posts</p>
                <p className="text-2xl font-bold text-slate-800">{stats.totalPosts}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center">
              <div className="bg-[rgb(var(--theme-color-rgb)/0.1)] p-3 rounded-lg mr-4">
                <FiUsers className="text-[var(--theme-color)]" />
              </div>
              <div>
                <p className="text-slate-500 text-sm">Active Users</p>
                <p className="text-2xl font-bold text-slate-800">{stats.activeUsers}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center">
              <div className="bg-[rgb(var(--theme-color-rgb)/0.1)] p-3 rounded-lg mr-4">
                <FiActivity className="text-[var(--theme-color)]" />
              </div>
              <div>
                <p className="text-slate-500 text-sm">Recent Activity</p>
                <p className="text-2xl font-bold text-slate-800">
                  {posts.length > 0 ? 
                    new Date(posts[0].created_at).toLocaleDateString() : 
                    '--'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="space-y-8">
          <PostForm refreshPosts={refreshPosts} />

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-xl font-semibold text-slate-800 flex items-center">
                <FiMessageSquare className="mr-2 text-[var(--theme-color)]" />
                Recent Posts
              </h2>
            </div>
            
            <div className="p-6">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
                  <p className="text-slate-600">Loading community posts...</p>
                </div>
              ) : posts.length > 0 ? (
                <PostList posts={posts} refreshPosts={refreshPosts} />
              ) : (
                <div className="text-center py-12">
                  <div className="mx-auto w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <FiMessageSquare className="text-slate-400 text-3xl" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-800 mb-2">No posts yet</h3>
                  <p className="text-slate-600 max-w-md mx-auto">
                    Be the first to share something with the community!
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>
        </div>

        <aside className="lg:col-span-3">
          <h2 className="text-xl font-semibold mb-4">My Projects</h2>
          {projects.length ? (
            <ul className="space-y-3">
              {projects.map((p) => (
                <li key={p.id} className="bg-white p-4 rounded-lg shadow border">
                  {p.name}
                </li>
              ))}
            </ul>
          ) : (
            <p>No associated projects.</p>
          )}
        </aside>
      </div>
    </div>
  );
};

export default PostPage;