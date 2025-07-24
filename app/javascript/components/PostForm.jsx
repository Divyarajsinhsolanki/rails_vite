import React, { useState, useRef } from "react";
import toast from "react-hot-toast";
import { createPost } from "../components/api";
import { FiImage, FiSend } from 'react-icons/fi';

const PostForm = ({ refreshPosts }) => {
  const [message, setMessage] = useState("");
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim() && !image) {
      toast.error("Please write a message or upload an image.");
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("post[message]", message);
    if (image) formData.append("post[image]", image);

    try {
      await createPost(formData);
      toast.success("Post created successfully!");
      setMessage("");
      removeImage();
      refreshPosts();
    } catch (error) {
      toast.error("Failed to create post. Please try again.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-xl p-5 mb-8 border" encType="multipart/form-data">
      <textarea
        placeholder="What's on your mind?"
        className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow resize-none"
        rows="3"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        disabled={isSubmitting}
      />

      {imagePreview && (
        <div className="mt-4 relative w-32 h-32">
          <img src={imagePreview} alt="Preview" className="rounded-lg object-cover w-full h-full" />
          <button type="button" onClick={removeImage} className="absolute -top-2 -right-2 bg-slate-700 text-white rounded-full p-1 text-xs hover:bg-slate-900">
            &times;
          </button>
        </div>
      )}

      <div className="flex justify-between items-center mt-4">
        {/* Custom File Input Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors disabled:opacity-50"
          disabled={isSubmitting}
        >
          <FiImage size={20} />
          <span className="font-medium text-sm">Add Image</span>
        </button>
        <input type="file" ref={fileInputRef} className="hidden" onChange={handleImageChange} accept="image/*" />

        {/* Submit Button */}
        <button
          type="submit"
          className="flex items-center gap-2 bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all"
          disabled={(!message.trim() && !image) || isSubmitting}
        >
          {isSubmitting ? 'Posting...' : 'Post'}
          {!isSubmitting && <FiSend />}
        </button>
      </div>
    </form>
  );
};

export default PostForm;