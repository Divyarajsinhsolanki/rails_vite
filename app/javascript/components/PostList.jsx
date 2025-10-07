import React, { useContext } from "react";
import toast from "react-hot-toast";
import { formatDistanceToNow } from 'date-fns';
import { FiTrash2, FiHeart, FiMessageCircle, FiShare2 } from 'react-icons/fi';
import { deletePost, likePost, unlikePost, createComment, deleteComment } from "../components/api";
import Avatar from "./ui/Avatar";
import { AuthContext } from "../context/AuthContext";

const PostList = ({ posts, refreshPosts, onPostUpdate = () => {} }) => {
  const [likedPosts, setLikedPosts] = React.useState(new Set());
  const [likeCounts, setLikeCounts] = React.useState({});
  const [expandedComments, setExpandedComments] = React.useState(new Set());
  const [commentInputs, setCommentInputs] = React.useState({});
  const [submittingComments, setSubmittingComments] = React.useState(new Set());
  const { user } = useContext(AuthContext);

  React.useEffect(() => {
    const initialLikedPosts = new Set();
    const initialLikeCounts = {};

    posts.forEach((post) => {
      if (post.liked_by_current_user) {
        initialLikedPosts.add(post.id);
      }
      initialLikeCounts[post.id] = post.likes_count ?? 0;
    });

    setLikedPosts(initialLikedPosts);
    setLikeCounts(initialLikeCounts);
  }, [posts]);

  const handleShare = async (post) => {
    const url = `${window.location.origin}${window.location.pathname}#post-${post.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Post', text: post.message, url });
      } catch (error) {
        console.error('Error sharing', error);
      }
    } else if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied to clipboard');
      } catch (error) {
        toast.error('Failed to copy link');
        console.error(error);
      }
    } else {
      window.prompt('Copy this link', url);
    }
  };

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

  const toggleLike = async (postId) => {
    const isCurrentlyLiked = likedPosts.has(postId);

    try {
      const { data } = isCurrentlyLiked ? await unlikePost(postId) : await likePost(postId);

      setLikedPosts((prev) => {
        const updated = new Set(prev);
        if (data.liked_by_current_user) {
          updated.add(postId);
        } else {
          updated.delete(postId);
        }
        return updated;
      });

      setLikeCounts((prev) => ({
        ...prev,
        [postId]: data.likes_count ?? 0,
      }));
    } catch (error) {
      toast.error(isCurrentlyLiked ? 'Failed to remove like' : 'Failed to like post');
      console.error(error);
    }
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

  const handleCommentChange = (postId, value) => {
    setCommentInputs((prev) => ({
      ...prev,
      [postId]: value,
    }));
  };

  const handleCommentSubmit = async (event, postId) => {
    event.preventDefault();
    const body = (commentInputs[postId] || "").trim();
    if (!body) return;

    setSubmittingComments((prev) => {
      const updated = new Set(prev);
      updated.add(postId);
      return updated;
    });

    try {
      const { data } = await createComment(postId, { comment: { body } });
      toast.success("Comment added");
      setCommentInputs((prev) => ({
        ...prev,
        [postId]: "",
      }));
      onPostUpdate(postId, (prevPost) => {
        const existingComments = Array.isArray(prevPost.comments) ? prevPost.comments : [];
        const currentCount = typeof prevPost.comments_count === 'number'
          ? prevPost.comments_count
          : existingComments.length;

        return {
          ...prevPost,
          comments: [...existingComments, data],
          comments_count: currentCount + 1,
        };
      });
    } catch (error) {
      toast.error("Failed to add comment");
      console.error(error);
    } finally {
      setSubmittingComments((prev) => {
        const updated = new Set(prev);
        updated.delete(postId);
        return updated;
      });
    }
  };

  const handleCommentDelete = async (postId, commentId) => {
    if (!window.confirm("Are you sure you want to delete this comment?")) {
      return;
    }

    try {
      await deleteComment(postId, commentId);
      toast.success("Comment deleted");
      onPostUpdate(postId, (prevPost) => {
        const existingComments = Array.isArray(prevPost.comments) ? prevPost.comments : [];
        const updatedComments = existingComments.filter((comment) => comment.id !== commentId);
        const currentCount = typeof prevPost.comments_count === 'number'
          ? prevPost.comments_count
          : existingComments.length;

        return {
          ...prevPost,
          comments: updatedComments,
          comments_count: Math.max(currentCount - 1, updatedComments.length),
        };
      });
    } catch (error) {
      toast.error("Failed to delete comment");
      console.error(error);
    }
  };

  return (
    <div className="space-y-5">
      {posts.map((post) => {
        const fullName = [post.user.first_name, post.user.last_name].filter(Boolean).join(' ') || post.user.email;
        const comments = Array.isArray(post.comments) ? post.comments : [];
        const commentCount = post.comments_count ?? comments.length;
        const currentUserName = user ? [user.first_name, user.last_name].filter(Boolean).join(' ') || user.email : 'Current User';
        const currentUserAvatar = user?.profile_picture || user?.profile_picture_url;

        return (
          <article id={`post-${post.id}`} key={post.id} className="bg-white rounded-lg shadow-xs border border-slate-200 hover:shadow-md transition-shadow">
            <div className="p-5">
            {/* Post Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start space-x-3">
                <Avatar
                  name={fullName}
                  src={post.user.profile_picture}
                  className="w-10 h-10"
                />
                <div>
                  <p className="text-slate-800 font-semibold">{fullName}</p>
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
                aria-pressed={likedPosts.has(post.id)}
              >
                <FiHeart size={18} className={likedPosts.has(post.id) ? 'fill-current' : ''} />
                <span>{likedPosts.has(post.id) ? 'Liked' : 'Like'}</span>
                <span
                  className={`text-xs font-medium ml-1 ${likedPosts.has(post.id) ? 'text-red-500' : 'text-slate-500'}`}
                >
                  {likeCounts[post.id] ?? post.likes_count ?? 0}
                </span>
              </button>
              
              <button
                onClick={() => toggleComments(post.id)}
                className="flex items-center space-x-1 px-3 py-1 rounded-md hover:bg-slate-100 transition-colors"
              >
                <FiMessageCircle size={18} />
                <span>Comment</span>
                <span className="text-xs font-medium ml-1 text-slate-500">{commentCount}</span>
              </button>
              
              <button
                onClick={() => handleShare(post)}
                className="flex items-center space-x-1 px-3 py-1 rounded-md hover:bg-slate-100 transition-colors"
              >
                <FiShare2 size={18} />
                <span>Share</span>
              </button>
            </div>

            {/* Comments Section */}
            {expandedComments.has(post.id) && (
              <div className="mt-3 pt-3 border-t border-slate-100">
                <form onSubmit={(event) => handleCommentSubmit(event, post.id)} className="flex items-start space-x-3">
                  <Avatar name={currentUserName} src={currentUserAvatar} className="w-8 h-8 text-sm" />
                  <div className="flex-1 bg-slate-100 rounded-xl px-3 py-2 flex items-center space-x-2">
                    <input
                      type="text"
                      value={commentInputs[post.id] ?? ""}
                      onChange={(event) => handleCommentChange(post.id, event.target.value)}
                      placeholder="Write a comment..."
                      className="w-full bg-transparent outline-none text-sm text-slate-700"
                    />
                    <button
                      type="submit"
                      disabled={submittingComments.has(post.id)}
                      className="text-sm font-medium text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Post
                    </button>
                  </div>
                </form>

                <div className="mt-3 space-y-3">
                  {comments.length === 0 ? (
                    <p className="text-sm text-slate-500">Be the first to comment.</p>
                  ) : (
                    comments.map((comment) => {
                      const commenterName = [comment.user.first_name, comment.user.last_name].filter(Boolean).join(' ') || comment.user.email;
                      const commentTimestamp = comment.created_at
                        ? formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })
                        : '';
                      return (
                        <div key={comment.id} className="flex items-start space-x-2">
                          <Avatar name={commenterName} src={comment.user.profile_picture} className="w-8 h-8 text-sm" />
                          <div className="bg-slate-100 rounded-xl px-3 py-2 text-sm flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-medium text-slate-800">{commenterName}</p>
                                {commentTimestamp && (
                                  <p className="text-xs text-slate-500">{commentTimestamp}</p>
                                )}
                              </div>
                              {comment.can_delete && (
                                <button
                                  type="button"
                                  onClick={() => handleCommentDelete(post.id, comment.id)}
                                  className="text-slate-400 hover:text-red-500 p-1 rounded-full transition-colors"
                                  aria-label="Delete comment"
                                >
                                  <FiTrash2 size={14} />
                                </button>
                              )}
                            </div>
                            <p className="text-slate-700 mt-1 whitespace-pre-wrap">{comment.body}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
            </div>
          </article>
        );
      })}
    </div>
  );
};

export default PostList;