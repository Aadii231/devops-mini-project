import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Sparkles } from "lucide-react";
import { fetchPosts } from "../api";
import PostCard from "../components/PostCard";

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = async (q = "") => {
    setLoading(true);
    try {
      const data = await fetchPosts(q);
      setPosts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => load(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div>
      {/* Hero */}
      <div className="mb-12 text-center">
        <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-tight">
          inkwell<span className="text-accent">.</span>
        </h1>
        <p className="mt-3 text-muted text-sm">
          A minimal space for your thoughts and ideas. Built with React, Node.js, and MongoDB.
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-8">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search posts…"
          className="w-full pl-11 pr-4 py-3 bg-surface border border-border rounded-full text-sm focus:border-accent focus:ring-2 focus:ring-accent/10 outline-none transition-all"
        />
      </div>

      {/* Posts */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-surface rounded-2xl border border-border p-6 animate-pulse">
              <div className="h-1 w-10 bg-border rounded-full mb-4" />
              <div className="h-5 bg-border rounded w-2/3 mb-3" />
              <div className="h-3 bg-border rounded w-full mb-2" />
              <div className="h-3 bg-border rounded w-4/5" />
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20">
          <Sparkles size={40} className="mx-auto text-muted/40 mb-4" />
          <p className="text-muted text-sm">No posts yet</p>
          <Link
            to="/create"
            className="inline-block mt-4 px-6 py-2.5 bg-ink text-paper text-sm font-medium rounded-full hover:bg-ink/80 transition-colors"
          >
            Write your first post
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard key={post._id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
