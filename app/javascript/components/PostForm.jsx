import React, { useState } from "react";
import { createPost } from "../components/api";

const PostForm = ({ refreshPosts }) => {
  const [message, setMessage] = useState("");
  const [image, setImage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();

    formData.append("post[message]", message); 
    if (image) formData.append("post[image]", image);
  
    await createPost(formData);
    setMessage("");
    setImage(null);
    refreshPosts();
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white shadow-md rounded p-4 mb-6" encType="multipart/form-data">
      <textarea placeholder="Write something..." className="w-full p-2 border rounded-md" value={message} onChange={(e) => setMessage(e.target.value)}/>
      <input type="file" className="mt-2" onChange={(e) => setImage(e.target.files[0])} />
      <button className="w-full mt-3 bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600">
        Post
      </button>
    </form>
  );
};

export default PostForm;
