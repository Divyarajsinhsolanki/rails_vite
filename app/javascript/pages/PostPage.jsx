import React, { useEffect, useState, useCallback, useContext } from "react";
import { Link } from "react-router-dom";
import { fetchPosts, SchedulerAPI, fetchProjects, getUsers } from "../components/api";
import { AuthContext } from "../context/AuthContext";
import PostForm from "../components/PostForm";
import PostList from "../components/PostList";
import { Toaster } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

// --- Icon Imports ---
import {
  FiMessageSquare, FiUsers, FiClock, FiCheckCircle,
  FiAlertTriangle, FiBriefcase, FiPlus, FiLoader,
  FiCheckSquare
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

const DueTaskItem = ({ task }) => (
    <div className="bg-white p-3 rounded-lg border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all">
        <p className="font-semibold text-slate-800 truncate">
            <Link
                to={`/projects/${task.project.id}/dashboard?tab=todo`}
                className="text-[var(--theme-color)] hover:underline"
            >
                {task.task_id}
            </Link>
            {task.title && ` - ${task.title}`}
        </p>
        {task.project && (
            <p className="text-xs text-slate-500 truncate">Project: {task.project.name}</p>
        )}
        <p className="text-xs text-red-600 font-medium">Due: {new Date(task.end_date).toLocaleDateString()}</p>
        <Link
            to={`/projects/${task.project.id}/dashboard?tab=todo`}
            className="mt-2 inline-block text-xs font-medium text-white bg-[var(--theme-color)] px-2 py-1 rounded hover:bg-[rgb(var(--theme-color-rgb)/0.9)]"
        >
            View Todo Board
        </Link>
    </div>
);

const GeneralTaskItem = ({ task }) => (
    <li className="flex items-center gap-2">
        <span className="text-xs text-slate-500 w-20">
            {task.end_date ? new Date(task.end_date).toLocaleDateString() : '--'}
        </span>
        <span className="font-medium text-slate-700 truncate">{task.title || task.task_id}</span>
    </li>
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
  const [birthdays, setBirthdays] = useState([]);
  const [generalTasks, setGeneralTasks] = useState([]);

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

    fetchProjects().then(({ data }) => {
      const userProjects = Array.isArray(data)
        ? data.filter((p) => p.users.some((u) => u.id === user.id))
        : [];
      setProjects(userProjects);

      const taskPromises = userProjects.map(project =>
        SchedulerAPI.getTasks({ project_id: project.id })
          .then(res => ({ project, tasks: res.data }))
          .catch(() => ({ project, tasks: [] }))
      );

      Promise.all(taskPromises)
        .then(results => {
          const due = results.flatMap(({ project, tasks }) =>
            (Array.isArray(tasks) ? tasks : [])
              .filter(t => t.end_date === today && t.status !== 'completed')
              .map(t => ({ ...t, project }))
          );
          setTasks(due);
        })
        .catch(() => setTasks([]));
    });

    getUsers()
      .then(({ data }) => {
        const today = new Date();
        const upcoming = (Array.isArray(data) ? data : [])
          .filter((u) => u.date_of_birth)
          .map((u) => {
            const dob = new Date(u.date_of_birth);
            const next = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
            if (next < today) next.setFullYear(next.getFullYear() + 1);
            return { ...u, nextBirthday: next };
          })
          .filter((u) => (u.nextBirthday - today) / (1000 * 60 * 60 * 24) <= 30)
          .sort((a, b) => a.nextBirthday - b.nextBirthday)
          .slice(0, 5);
        setBirthdays(upcoming);
      })
      .catch(() => setBirthdays([]));
  }, [user]);

  useEffect(() => {
    if (!user) return;
    SchedulerAPI.getTasks({ type: 'general', assigned_to_user: user.id })
      .then(({ data }) => setGeneralTasks(Array.isArray(data) ? data : []))
      .catch(() => setGeneralTasks([]));
  }, [user]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <Toaster position="top-right" />
      
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Sidebar: At a Glance */}
        <aside className="lg:col-span-3">
            <div className="space-y-8 sticky top-24 max-h-[calc(100vh-6rem)] overflow-y-auto">
                <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
                    <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <FiAlertTriangle className="text-red-500"/>
                        At a Glance
                    </h2>
                    {tasks.length > 0 ? (
                        <div className="space-y-3">
                            <p className="text-sm text-slate-600 mb-2">You have <span className="font-bold text-red-600">{tasks.length} task(s) due today</span>.</p>
                            {tasks.slice(0, 4).map((task) => <DueTaskItem key={task.id} task={task} />)}
                        </div>
                    ) : (
                        <div className="text-center py-4 bg-green-50 rounded-lg border border-green-200">
                            <FiCheckCircle className="mx-auto text-green-500 text-3xl mb-2"/>
                            <p className="text-sm font-medium text-green-700">All caught up!</p>
                            <p className="text-xs text-green-600">No tasks due today.</p>
                        </div>
                    )}
                </div>
                <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
                    <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <FiCheckSquare className="text-slate-600"/>
                        My Tasks
                    </h2>
                    {generalTasks.length > 0 ? (
                        <ul className="space-y-3">
                            {generalTasks.map((t) => (
                                <GeneralTaskItem key={t.id} task={t} />
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-slate-500 text-center py-4">No tasks found.</p>
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
            </div>
        </aside>

        {/* Main Content Feed */}
        <div className="lg:col-span-6">
            <header className="mb-8">
                <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight">
                    Welcome back, {[user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'User'}!
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
                            <FiLoader className="animate-spin text-[var(--theme-color)] text-4xl mb-4" />
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

        {/* Right Sidebar: Community Stats and Birthdays */}
        <aside className="lg:col-span-3">
            <div className="space-y-8 sticky top-24">
                <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
                    <h2 className="text-lg font-bold text-slate-800 mb-4">Community Stats</h2>
                    <div className="space-y-4">
                        <StatCard icon={<FiMessageSquare className="text-[var(--theme-color)]"/>} label="Total Posts" value={stats.totalPosts} color="bg-[rgb(var(--theme-color-rgb)/0.1)]" />
                        <StatCard icon={<FiUsers className="text-purple-500"/>} label="Active Users" value={stats.activeUsers} color="bg-purple-100" />
                        <StatCard icon={<FiClock className="text-green-500"/>} label="Last Activity" value={stats.recentActivity} color="bg-green-100" />
                    </div>
                </div>
                <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
                    <h2 className="text-lg font-bold text-slate-800 mb-4">Upcoming Birthdays</h2>
                    {birthdays.length > 0 ? (
                        <ul className="space-y-3">
                            {birthdays.map((b) => (
                                <li key={b.id} className="flex items-center justify-between">
                                    <span className="font-medium text-slate-700">{[b.first_name, b.last_name].filter(Boolean).join(' ')}</span>
                                    <span className="text-sm text-slate-500">{b.nextBirthday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-slate-500">No upcoming birthdays.</p>
                    )}
                </div>
            </div>
        </aside>

      </div>
    </div>
  );
};

export default PostPage;
