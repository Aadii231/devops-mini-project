import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPost } from "../api";
import PostForm from "../components/PostForm";

export default function Create() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async (data) => {
    setSubmitting(true);
    try {
      const post = await createPost(data);
      navigate(`/post/${post._id}`);
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-serif font-bold mb-8">New Post</h1>
      <PostForm onSubmit={handleCreate} submitting={submitting} />
    </div>
  );
}
