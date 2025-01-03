import sanitizeHtml from "sanitize-html";
import { prisma } from "../index.js";

export const getPosts = async (_, res) => {
  try {
    const posts = await prisma.post.findMany({
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
    return res.json({ status: "success", data: posts });
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
