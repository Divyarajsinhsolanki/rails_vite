import React from "react";
import { deletePost } from "../components/api";

const PostList = ({ posts, refreshPosts }) => {
  const handleDelete = async (id) => {
    await deletePost(id);
    refreshPosts();
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {posts.map((post) => (
        <div key={post.id} className="bg-white shadow-lg rounded-lg overflow-hidden p-4 border">
          {/* Post Header (User info & Timestamp) */}
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 font-bold">
              {post.user.email[0].toUpperCase()}
            </div>
            <div>
              <p className="text-gray-800 font-semibold">{post.user.email}</p>
              <p className="text-gray-500 text-sm">{post.created_at}</p>
            </div>
          </div>

          {/* Message Content */}
          <p className="text-gray-700 text-lg mb-3">{post.message}</p>

          {/* Image (if available) */}
          {post.image_url && (
            <div className="overflow-hidden rounded-lg border mt-3">
              <img src={post.image_url} alt="Uploaded" className="w-full object-cover h-64" />
            </div>
          )}

          {/* Actions (Delete Button) */}
          <div className="mt-4 flex justify-end">
            <button
              className="bg-red-500 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-red-600 transition"
              onClick={() => handleDelete(post.id)}
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PostList;
