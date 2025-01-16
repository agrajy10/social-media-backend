import sanitizeHtml from "sanitize-html";
import { prisma } from "../index.js";
import { getNestedReplies } from "./posts.js";

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
      include: {
        author: {
          select: {
            id: true,
            username: true,
            profileImage: true,
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
      include: {
        author: {
          select: {
            id: true,
            username: true,
            profileImage: true,
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

export const getPostComments = async (req, res) => {
  const limit = parseInt(req.query.limit) || 5;
  const page = parseInt(req.query.page) || 1;
  try {
    const comments = await prisma.comment.findMany({
      skip: (page - 1) * limit,
      take: limit,
      where: {
        post: {
          id: parseInt(req.params.postId),
        },
        parentId: null,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            profileImage: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const commentsWithAllReplies = await Promise.all(
      comments.map(async (comment) => {
        const replies = await getNestedReplies(comment.id);
        return { ...comment, replies };
      })
    );

    const totalComments = await prisma.comment.count({
      where: {
        post: {
          id: parseInt(req.params.postId),
        },
        parentId: null,
      },
    });

    const hasMore =
      totalComments > (page - 1) * limit + commentsWithAllReplies.length;

    return res.json({
      status: "success",
      page,
      hasMore,
      data: commentsWithAllReplies,
    });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
};
