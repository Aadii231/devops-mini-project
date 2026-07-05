import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Pencil, Trash2, Clock, User } from "lucide-react";
import { fetchPost, deletePost } from "../api";

function timeAgo(dateStr) {
  const seconds = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  const intervals = [
    [31536000, "year"], [2592000, "month"], [86400, "day"],
    [3600, "hour"], [60, "minute"],
  ];
  for (const [secs, label] of intervals) {
    const count = Math.floor(seconds / secs);
    if (count >= 1) return `${count} ${label}${count > 1 ? "s" : ""} ago`;
  }
  return "just now";
}

export default function PostView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    fetchPost(id)
      .then(setPost)
      .catch(() => navigate("/"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    await deletePost(id);
    navigate("/");
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-1 w-10 bg-border rounded-full" />
        <div className="h-8 bg-border rounded w-3/4" />
        <div className="h-4 bg-border rounded w-1/3" />
        <div className="h-40 bg-border rounded" />
      </div>
    );
  }
  if (!post) return null;

  return (
    <article>
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink transition-colors mb-8"
      >
        <ArrowLeft size={14} />
        Back
      </Link>

      {/* Accent bar */}
      <div
        className="h-1 w-16 rounded-full mb-6"
        style={{ background: post.coverColor }}
      />

      <h1 className="text-3xl md:text-4xl font-serif font-bold leading-tight">
        {post.title}
      </h1>

      <div className="mt-4 flex items-center gap-4 text-sm text-muted">
        <span className="inline-flex items-center gap-1.5">
          <User size={14} />
          {post.author}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Clock size={14} />
          {timeAgo(post.createdAt)}
        </span>
      </div>

      {post.tags?.length > 0 && (
        <div className="mt-4 flex gap-2">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 bg-accent/10 text-accent rounded-full text-xs font-medium"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Body */}
      <div className="mt-10 text-[15px] leading-[1.85] text-ink/85 whitespace-pre-wrap font-serif">
        {post.body}
      </div>

      {/* Actions */}
      <div className="mt-12 pt-6 border-t border-border flex gap-3">
        <Link
          to={`/edit/${post._id}`}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-surface border border-border rounded-full text-sm font-medium hover:border-accent hover:text-accent transition-colors"
        >
          <Pencil size={14} />
          Edit
        </Link>

        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-surface border border-border rounded-full text-sm font-medium text-danger hover:bg-danger hover:text-white transition-colors"
          >
            <Trash2 size={14} />
            Delete
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={handleDelete}
              className="px-5 py-2.5 bg-danger text-white text-sm font-medium rounded-full hover:bg-danger/80 transition-colors"
            >
              Confirm delete
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="px-5 py-2.5 text-sm text-muted hover:text-ink transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
