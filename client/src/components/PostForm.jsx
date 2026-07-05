import { useState } from "react";

const COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e",
  "#f97316", "#eab308", "#22c55e", "#06b6d4",
  "#3b82f6", "#6b7280",
];

export default function PostForm({ initial = {}, onSubmit, submitting }) {
  const [form, setForm] = useState({
    title: initial.title || "",
    body: initial.body || "",
    author: initial.author || "",
    tags: initial.tags?.join(", ") || "",
    coverColor: initial.coverColor || COLORS[0],
  });

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...form,
      tags: form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <div>
        <label className="block text-xs font-medium text-muted mb-2 uppercase tracking-wider">
          Title
        </label>
        <input
          name="title"
          value={form.title}
          onChange={handleChange}
          required
          placeholder="Give your post a title…"
          className="w-full text-2xl font-serif font-bold bg-transparent border-b-2 border-border focus:border-accent outline-none py-3 transition-colors placeholder:text-muted/50"
        />
      </div>

      {/* Author */}
      <div>
        <label className="block text-xs font-medium text-muted mb-2 uppercase tracking-wider">
          Author
        </label>
        <input
          name="author"
          value={form.author}
          onChange={handleChange}
          placeholder="Anonymous"
          className="w-full bg-transparent border-b border-border focus:border-accent outline-none py-2 text-sm transition-colors placeholder:text-muted/50"
        />
      </div>

      {/* Body */}
      <div>
        <label className="block text-xs font-medium text-muted mb-2 uppercase tracking-wider">
          Content
        </label>
        <textarea
          name="body"
          value={form.body}
          onChange={handleChange}
          required
          rows={12}
          placeholder="Write your story…"
          className="w-full bg-transparent border border-border rounded-xl focus:border-accent outline-none p-4 text-sm leading-relaxed resize-none transition-colors placeholder:text-muted/50"
        />
      </div>

      {/* Tags */}
      <div>
        <label className="block text-xs font-medium text-muted mb-2 uppercase tracking-wider">
          Tags
        </label>
        <input
          name="tags"
          value={form.tags}
          onChange={handleChange}
          placeholder="react, javascript, web (comma separated)"
          className="w-full bg-transparent border-b border-border focus:border-accent outline-none py-2 text-sm transition-colors placeholder:text-muted/50"
        />
      </div>

      {/* Color picker */}
      <div>
        <label className="block text-xs font-medium text-muted mb-3 uppercase tracking-wider">
          Accent Color
        </label>
        <div className="flex gap-2">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setForm((f) => ({ ...f, coverColor: c }))}
              className="w-8 h-8 rounded-full transition-transform hover:scale-110"
              style={{
                background: c,
                boxShadow:
                  form.coverColor === c
                    ? `0 0 0 3px white, 0 0 0 5px ${c}`
                    : "none",
              }}
            />
          ))}
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting}
        className="w-full py-3 bg-ink text-paper font-medium rounded-full hover:bg-ink/80 disabled:opacity-50 transition-colors"
      >
        {submitting ? "Publishing…" : "Publish Post"}
      </button>
    </form>
  );
}
