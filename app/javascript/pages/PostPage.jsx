import React, { useEffect, useState, useCallback, useContext } from "react";
import { Link } from "react-router-dom";
import { fetchPosts, SchedulerAPI, fetchProjects } from "../components/api";
import { AuthContext } from "../context/AuthContext";
import PostForm from "../components/PostForm";
import PostList from "../components/PostList";
import { Toaster } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

// --- Icon Imports ---
import {
  FiMessageSquare, FiUsers, FiClock, FiCheckCircle,
  FiAlertTriangle, FiBriefcase, FiPlus, FiLoader
} from "react-icons/fi";

// --- Reusable Components ---

const StatCard = ({ icon, label, value, color }) => (
  <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-4">
    <div className={`p-3 rounded-lg ${color}`}>
      {icon}
    </div>
    <div>
      <p className="text-sm text-slate-500 font-medium">{label}</p>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
    </div>
  </div>
);

const OverdueTaskItem = ({ task }) => (
    <div className="bg-white p-3 rounded-lg border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all">
        <p className="font-semibold text-slate-800 truncate">{task.title || task.task_id}</p>
        <p className="text-xs text-red-600 font-medium">Due: {new Date(task.end_date).toLocaleDateString()}</p>
    </div>
);

const ProjectItem = ({ project }) => (
    <Link
        to={`/projects/${project.id}/dashboard`}
        className="bg-white p-4 rounded-lg border border-slate-200 flex items-center gap-3 hover:bg-slate-50 transition-colors"
    >
        <div className="p-2 bg-slate-100 rounded-md">
            <FiBriefcase className="text-slate-500" />
        </div>
        <div className="min-w-0">
            <p className="font-semibold text-slate-700 truncate">{project.name}</p>
            <p className="text-xs text-slate-500 truncate">
                {project.start_date}
                {project.end_date && ` - ${project.end_date}`}
                {project.status && ` • ${project.status}`}
            </p>
        </div>
    </Link>
);


// --- Main Page Component ---

const PostPage = () => {
  const { user } = useContext(AuthContext);
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ totalPosts: 0, activeUsers: 0, recentActivity: '--' });
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
      
      setStats({
        totalPosts: sortedPosts.length,
        activeUsers: new Set(sortedPosts.map(post => post.user.id)).size,
        recentActivity: sortedPosts.length > 0 ? new Date(sortedPosts[0].created_at).toLocaleDateString() : '--'
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
      .then(({ data }) => {
        const overdue = (Array.isArray(data) ? data : []).filter(
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
    <div className="min-h-screen bg-slate-50 font-sans">
      <Toaster position="top-right" />
      
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Sidebar: At a Glance */}
        <aside className="lg:col-span-3 space-y-8">
            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
                <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <FiAlertTriangle className="text-red-500"/>
                    At a Glance
                </h2>
                {tasks.length > 0 ? (
                    <div className="space-y-3">
                        <p className="text-sm text-slate-600 mb-2">You have <span className="font-bold text-red-600">{tasks.length} overdue task(s)</span>.</p>
                        {tasks.slice(0, 4).map((task) => <OverdueTaskItem key={task.id} task={task} />)}
                    </div>
                ) : (
                    <div className="text-center py-4 bg-green-50 rounded-lg border border-green-200">
                        <FiCheckCircle className="mx-auto text-green-500 text-3xl mb-2"/>
                        <p className="text-sm font-medium text-green-700">All caught up!</p>
                        <p className="text-xs text-green-600">No overdue tasks.</p>
                    </div>
                )}
            </div>
            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
                <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <FiBriefcase className="text-slate-600"/>
                    My Projects
                </h2>
                 {projects.length > 0 ? (
                    <div className="space-y-3">
                        {projects.map((p) => <ProjectItem key={p.id} project={p} />)}
                    </div>
                 ) : (
                    <p className="text-sm text-slate-500 text-center py-4">No projects found.</p>
                 )}
            </div>
        </aside>

        {/* Main Content Feed */}
        <div className="lg:col-span-6">
            <header className="mb-8">
                <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight">
                    Welcome back, {user?.name || 'User'}!
                </h1>
                <p className="text-slate-500 mt-2">
                    Here's what's happening in your community today.
                </p>
            </header>
            
            <main className="space-y-8">
                <PostForm refreshPosts={refreshPosts} />
                
                <AnimatePresence>
                    {isLoading ? (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-20 text-center">
                            <FiLoader className="animate-spin text-blue-500 text-4xl mb-4" />
                            <p className="text-slate-600 font-medium">Loading Community Feed...</p>
                        </motion.div>
                    ) : posts.length > 0 ? (
                        <PostList posts={posts} refreshPosts={refreshPosts} />
                    ) : (
                         <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm">
                            <div className="mx-auto w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                <FiMessageSquare className="text-slate-400 text-3xl" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">It's quiet in here...</h3>
                            <p className="text-slate-500 max-w-md mx-auto">
                                Be the first to share something with the community! Your post will appear here.
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>

        {/* Right Sidebar: Community Stats */}
        <aside className="lg:col-span-3">
            <div className="sticky top-8 p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
                <h2 className="text-lg font-bold text-slate-800 mb-4">Community Stats</h2>
                <div className="space-y-4">
                    <StatCard icon={<FiMessageSquare className="text-blue-500"/>} label="Total Posts" value={stats.totalPosts} color="bg-blue-100" />
                    <StatCard icon={<FiUsers className="text-purple-500"/>} label="Active Users" value={stats.activeUsers} color="bg-purple-100" />
                    <StatCard icon={<FiClock className="text-green-500"/>} label="Last Activity" value={stats.recentActivity} color="bg-green-100" />
                </div>
            </div>
        </aside>

      </div>
    </div>
  );
};

export default PostPage;
