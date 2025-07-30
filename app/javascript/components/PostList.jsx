import React, { useContext } from "react";
import toast from "react-hot-toast";
import { formatDistanceToNow } from 'date-fns';
import { FiTrash2, FiHeart, FiMessageCircle, FiShare2 } from 'react-icons/fi';
import { deletePost } from "../components/api";
import Avatar from "./ui/Avatar";
import { AuthContext } from "../context/AuthContext";

const PostList = ({ posts, refreshPosts }) => {
  const [likedPosts, setLikedPosts] = React.useState(new Set());
  const [expandedComments, setExpandedComments] = React.useState(new Set());
  const { user } = useContext(AuthContext);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this post? This action cannot be undone.")) {
      try {
        await deletePost(id);
        toast.success("Post deleted successfully");
        refreshPosts();
      } catch (error) {
        toast.error("Failed to delete post");
        console.error(error);
      }
    }
  };

  const toggleLike = (postId) => {
    const newLikedPosts = new Set(likedPosts);
    if (newLikedPosts.has(postId)) {
      newLikedPosts.delete(postId);
    } else {
      newLikedPosts.add(postId);
    }
    setLikedPosts(newLikedPosts);
  };

  const toggleComments = (postId) => {
    const newExpandedComments = new Set(expandedComments);
    if (newExpandedComments.has(postId)) {
      newExpandedComments.delete(postId);
    } else {
      newExpandedComments.add(postId);
    }
    setExpandedComments(newExpandedComments);
  };

  return (
    <div className="space-y-5">
      {posts.map((post) => (
        <article key={post.id} className="bg-white rounded-lg shadow-xs border border-slate-200 hover:shadow-md transition-shadow">
          <div className="p-5">
            {/* Post Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start space-x-3">
                <Avatar
                  name={post.user.email}
                  src={post.user.profile_picture}
                  className="w-10 h-10"
                />
                <div>
                  <p className="text-slate-800 font-semibold">{post.user.email}</p>
                  <p className="text-slate-500 text-xs">
                    {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
              {user?.id === post.user.id && (
                <button
                  onClick={() => handleDelete(post.id)}
                  className="text-slate-400 hover:text-red-500 p-1 rounded-full transition-colors"
                  aria-label="Delete post"
                >
                  <FiTrash2 size={16} />
                </button>
              )}
            </div>

            {/* Message Content */}
            {post.message && (
              <p className="text-slate-700 text-base mb-4 whitespace-pre-wrap">
                {post.message}
              </p>
            )}
          </div>
          
          {/* Attached Image */}
          {post.image_url && (
            <div className="border-t border-b border-slate-100 bg-slate-50">
              <img 
                src={post.image_url} 
                alt="Post content" 
                className="w-full h-auto max-h-[500px] object-contain mx-auto" 
              />
            </div>
          )}

          {/* Post Actions */}
          <div className="px-5 py-3 border-t border-slate-100">
            <div className="flex items-center justify-between text-slate-500">
              <button 
                onClick={() => toggleLike(post.id)}
                className={`flex items-center space-x-1 px-3 py-1 rounded-md transition-colors ${likedPosts.has(post.id) ? 'text-red-500 bg-red-50' : 'hover:bg-slate-100'}`}
              >
                <FiHeart size={18} className={likedPosts.has(post.id) ? 'fill-current' : ''} />
                <span>{likedPosts.has(post.id) ? 'Liked' : 'Like'}</span>
              </button>
              
              <button 
                onClick={() => toggleComments(post.id)}
                className="flex items-center space-x-1 px-3 py-1 rounded-md hover:bg-slate-100 transition-colors"
              >
                <FiMessageCircle size={18} />
                <span>Comment</span>
              </button>
              
              <button className="flex items-center space-x-1 px-3 py-1 rounded-md hover:bg-slate-100 transition-colors">
                <FiShare2 size={18} />
                <span>Share</span>
              </button>
            </div>

            {/* Comments Section */}
            {expandedComments.has(post.id) && (
              <div className="mt-3 pt-3 border-t border-slate-100">
                <div className="flex items-start space-x-3">
                  <Avatar name="Current User" className="w-8 h-8 text-sm" />
                  <div className="flex-1 bg-slate-100 rounded-xl px-3 py-2">
                    <input 
                      type="text" 
                      placeholder="Write a comment..." 
                      className="w-full bg-transparent outline-none text-sm text-slate-700"
                    />
                  </div>
                </div>
                
                {/* Sample comments - replace with actual comments */}
                <div className="mt-3 space-y-3">
                  <div className="flex items-start space-x-2">
                    <Avatar name="User 1" className="w-8 h-8 text-sm" />
                    <div className="bg-slate-100 rounded-xl px-3 py-2 text-sm">
                      <p className="font-medium text-slate-800">User 1</p>
                      <p className="text-slate-700">This is a great post!</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </article>
      ))}
    </div>
  );
};

export default PostList;