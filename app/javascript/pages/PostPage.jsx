import React, { useEffect, useState } from "react";
import { fetchPosts } from "../components/api";
import PostForm from "../components/PostForm";
import PostList from "../components/PostList";
import { Toaster } from "react-hot-toast";

const PostPage = () => {
  const [posts, setPosts] = useState([]);

  const refreshPosts = async () => {
    try {
      const { data } = await fetchPosts();
      setPosts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching posts:", error);
      setPosts([]);
    }
  };

  useEffect(() => {
    refreshPosts();
  }, []);

  return (
    <div className="max-w-xl mx-auto mt-10">
      <Toaster position="top-right" />
      <h2 className="text-2xl font-bold mb-4">Create a Post</h2>
      <PostForm refreshPosts={refreshPosts} />
      <h2 className="text-2xl font-bold mb-4">Recent Posts</h2>
      {posts.length > 0 ? <PostList posts={posts} refreshPosts={refreshPosts} /> : <p>No posts yet.</p>}
    </div>
  );
};

export default PostPage;
