import React, { useEffect, useState, useCallback } from "react";
import { fetchPosts } from "../components/api";
import PostForm from "../components/PostForm";
import PostList from "../components/PostList";
import { Toaster } from "react-hot-toast";

const PostPage = () => {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Use useCallback to prevent re-creation of this function on every render
  const refreshPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await fetchPosts();
      // Ensure posts are sorted newest first
      const sortedPosts = (Array.isArray(data) ? data : []).sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );
      setPosts(sortedPosts);
    } catch (error) {
      console.error("Error fetching posts:", error);
      setPosts([]); // Clear posts on error
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshPosts();
  }, [refreshPosts]);

  return (
    <div className="bg-slate-50 min-h-screen py-10 font-sans">
      <Toaster position="top-right" />
      <div className="max-w-2xl mx-auto px-4">
        {/* Page Header */}
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-slate-800 tracking-tight">Community Feed 📢</h1>
          <p className="text-slate-500 mt-2">Share your thoughts and see what others are up to.</p>
        </header>

        {/* Main Content */}
        <main>
          <PostForm refreshPosts={refreshPosts} />

          <div className="mt-12">
            <h2 className="text-xl font-semibold text-slate-700 mb-6 pl-2">Recent Posts</h2>
            {isLoading ? (
              <p className="text-center text-slate-500 py-8">Loading posts...</p>
            ) : posts.length > 0 ? (
              <PostList posts={posts} refreshPosts={refreshPosts} />
            ) : (
              <div className="text-center bg-white p-8 rounded-lg shadow-sm border">
                <p className="text-slate-600 font-medium">No posts yet. Be the first to share! ✨</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default PostPage;