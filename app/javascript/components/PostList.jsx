import React from "react";
import toast from "react-hot-toast";
import { formatDistanceToNow } from 'date-fns';
import { FiTrash2 } from 'react-icons/fi';
import { deletePost } from "../components/api";

const PostList = ({ posts, refreshPosts }) => {
  const handleDelete = async (id) => {
    // Add confirmation dialog for better UX
    if (window.confirm("Are you sure you want to delete this post? This action cannot be undone.")) {
      try {
        await deletePost(id);
        toast.success("Post deleted!");
        refreshPosts();
      } catch (error) {
        toast.error("Failed to delete post.");
        console.error(error);
      }
    }
  };

  return (
    <div className="space-y-6">
      {posts.map((post) => (
        <article key={post.id} className="bg-white shadow-md rounded-xl overflow-hidden transition-shadow hover:shadow-lg border">
          <div className="p-5">
            {/* Post Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-11 h-11 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {post.user.email[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-slate-800 font-semibold">{post.user.email}</p>
                  <p className="text-slate-500 text-sm">
                    {/* Format timestamp to be user-friendly */}
                    {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleDelete(post.id)}
                className="text-slate-400 hover:text-red-500 p-2 rounded-full transition-colors"
                aria-label="Delete post"
              >
                <FiTrash2 size={18} />
              </button>
            </div>

            {/* Message Content */}
            {post.message && (
              <p className="text-slate-700 text-base whitespace-pre-wrap">{post.message}</p>
            )}
          </div>
          
          {/* Attached Image */}
          {post.image_url && (
            <div className="mt-1 bg-slate-100">
              <img src={post.image_url} alt="Post content" className="w-full h-auto max-h-[500px] object-contain" />
            </div>
          )}
        </article>
      ))}
    </div>
  );
};

export default PostList;