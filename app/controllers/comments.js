import sanitizeHtml from "sanitize-html";
import { prisma } from "../index.js";

export const createComment = async (req, res) => {
  const { content } = req.body;
  const sanitizedContent = sanitizeHtml(content);
  try {
    const [createPostComment] = await prisma.$transaction(async (prisma) => {
      const postComment = await prisma.comment.create({
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

      await prisma.commentClosure.create({
        data: {
          descendantId: postComment.id,
          ancestorId: postComment.id,
        },
      });

      return [postComment];
    });

    return res.json({
      status: "success",
      message: "Comment posted successfully",
      data: createPostComment,
    });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
};
