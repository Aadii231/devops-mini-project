import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: 200,
    },
    body: {
      type: String,
      required: [true, "Body is required"],
      trim: true,
    },
    author: {
      type: String,
      default: "Anonymous",
      trim: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    coverColor: {
      type: String,
      default: "#6366f1",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Post", postSchema);
