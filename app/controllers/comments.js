import sanitizeHtml from "sanitize-html";
import { prisma } from "../index.js";

export const createComment = async (req, res) => {
  const { content } = req.body;
  const sanitizedContent = sanitizeHtml(content);
  try {
    const comment = await prisma.comment.create({
      data: {
        content: sanitizedContent,
        author: {
          connect: {
            id: req.user.id,
          },
        },
        post: {
          connect: {
            id: parseInt(req.params.postId),
          },
        },
      },
    });

    return res.json({
      status: "success",
      message: "Comment posted successfully",
      data: comment,
    });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
};

export const createCommentReply = async (req, res) => {
  const { content } = req.body;
  const sanitizedContent = sanitizeHtml(content);
  try {
    const commentReply = await prisma.comment.create({
      data: {
        content: sanitizedContent,
        author: {
          connect: {
            id: req.user.id,
          },
        },
        post: {
          connect: {
            id: parseInt(req.params.postId),
          },
        },
        parent: {
          connect: {
            id: parseInt(req.params.commentId),
          },
        },
      },
    });

    return res.json({
      status: "success",
      message: "Comment posted successfully",
      data: commentReply,
    });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
};
