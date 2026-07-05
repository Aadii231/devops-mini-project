import { Link } from "react-router-dom";
import { Clock, ArrowUpRight } from "lucide-react";

function timeAgo(dateStr) {
  const seconds = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  const intervals = [
    [31536000, "year"],
    [2592000, "month"],
    [86400, "day"],
    [3600, "hour"],
    [60, "minute"],
  ];
  for (const [secs, label] of intervals) {
    const count = Math.floor(seconds / secs);
    if (count >= 1)
      return `${count} ${label}${count > 1 ? "s" : ""} ago`;
  }
  return "just now";
}

export default function PostCard({ post }) {
  const excerpt = post.body.slice(0, 160) + (post.body.length > 160 ? "…" : "");

  return (
    <Link
      to={`/post/${post._id}`}
      className="group block bg-surface rounded-2xl border border-border p-6 hover:shadow-lg hover:border-accent/30 transition-all duration-300"
    >
      {/* Color accent bar */}
      <div
        className="h-1 w-10 rounded-full mb-4"
        style={{ background: post.coverColor || "#6366f1" }}
      />

      <div className="flex items-start justify-between gap-4">
        <h2 className="text-lg font-serif font-bold leading-snug group-hover:text-accent transition-colors">
          {post.title}
        </h2>
        <ArrowUpRight
          size={18}
          className="text-muted group-hover:text-accent transition-colors shrink-0 mt-1"
        />
      </div>

      <p className="mt-3 text-sm text-muted leading-relaxed">{excerpt}</p>

      <div className="mt-4 flex items-center gap-3 text-xs text-muted">
        <span className="font-medium text-ink/70">{post.author}</span>
        <span>·</span>
        <span className="inline-flex items-center gap-1">
          <Clock size={12} />
          {timeAgo(post.createdAt)}
        </span>
        {post.tags?.length > 0 && (
          <>
            <span>·</span>
            <div className="flex gap-1.5">
              {post.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 bg-accent/10 text-accent rounded-full text-[11px] font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          </>
        )}
      </div>
    </Link>
  );
}
