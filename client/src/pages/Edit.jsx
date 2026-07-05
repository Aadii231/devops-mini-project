import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchPost, updatePost } from "../api";
import PostForm from "../components/PostForm";

export default function Edit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPost(id)
      .then(setPost)
      .catch(() => navigate("/"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleUpdate = async (data) => {
    setSubmitting(true);
    try {
      const updated = await updatePost(id, data);
      navigate(`/post/${updated._id}`);
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="animate-pulse h-40 bg-surface rounded-2xl" />;
  if (!post) return null;

  return (
    <div>
      <h1 className="text-2xl font-serif font-bold mb-8">Edit Post</h1>
      <PostForm initial={post} onSubmit={handleUpdate} submitting={submitting} />
    </div>
  );
}
