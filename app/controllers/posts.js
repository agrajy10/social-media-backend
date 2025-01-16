import sanitizeHtml from "sanitize-html";
import { prisma } from "../index.js";

export const getNestedReplies = async (commentId) => {
  const replies = await prisma.comment.findMany({
    where: { parentId: commentId },
    include: {
      replies: true,
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

  if (!replies.length) {
    return [];
  }

  return Promise.all(
    replies.map(async (reply) => {
      reply.replies = await getNestedReplies(reply.id);
      return reply;
    })
  );
};

export const getPosts = async (req, res) => {
  const limit = parseInt(req.query.limit) || 5;
  const page = parseInt(req.query.page) || 1;
  try {
    const posts = await prisma.post.findMany({
      skip: (page - 1) * limit,
      take: limit,
      include: {
        author: {
          select: {
            id: true,
            username: true,
            profileImage: true,
          },
        },
        comments: {
          where: {
            parent: null,
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
          take: 5,
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const totalPosts = await prisma.post.count();

    const hasMore = (page - 1) * limit + posts.length < totalPosts;

    let postWithAllComments = await Promise.all(
      posts.map(async (post) => {
        if (post.comments.length) {
          const y = await Promise.all(
            post.comments.map(async (comment) => {
              comment.replies = await getNestedReplies(comment.id);
            })
          );
        }
        return post;
      })
    );

    postWithAllComments = postWithAllComments.map((post) => ({
      ...post,
      hasMoreComments: post.comments.length < post._count.comments,
    }));

    return res.json({
      status: "success",
      hasMore,
      page,
      data: postWithAllComments,
    });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
};

export const createPost = async (req, res) => {
  try {
    const { title, content } = req.body;
    const sanitizedTitle = sanitizeHtml(title);
    const sanitizedContent = sanitizeHtml(content);

    const post = await prisma.post.create({
      data: {
        title: sanitizedTitle,
        content: sanitizedContent,
        author: {
          connect: {
            id: req.user.id,
          },
        },
      },
    });

    return res.json({
      status: "success",
      message: "Post created successfully",
      data: post,
    });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
};

export const updatePost = async (req, res) => {
  try {
    const { title, content } = req.body;
    const sanitizedTitle = sanitizeHtml(title);
    const sanitizedContent = sanitizeHtml(content);

    const post = await prisma.post.update({
      where: {
        id: parseInt(req.params.id),
        authorId: req.user.id,
      },
      data: {
        title: sanitizedTitle,
        content: sanitizedContent,
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
      message: "Post updated successfully",
      data: post,
    });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
};

export const deletePost = async (req, res) => {
  try {
    await prisma.post.delete({
      where: {
        id: parseInt(req.params.id),
        authorId: req.user.id,
      },
    });

    return res.json({
      status: "success",
      message: "Post deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
};
