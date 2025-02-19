import { prisma } from "../index.js";
import encryptPassword from "../../utils/encrptPassword.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import generateResetToken from "../../utils/generateResetToken.js";
import axios from "axios";

export const registerUser = async (req, res) => {
  try {
    const hashedPassword = await encryptPassword(req.body.password);
    const user = await prisma.user.create({
      data: {
        email: req.body.email,
        username: req.body.username,
        name: req.body.name,
        password: hashedPassword,
      },
    });

    return res.json({
      status: "success",
      message: "User registered successfully",
      data: {
        email: user.email,
        username: user.username,
        name: user.name,
        profileImage: user.profileImage,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const loginUser = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          {
            email: username,
          },
          {
            username: username,
          },
        ],
      },
    });
    if (!user) {
      return res
        .status(401)
        .json({ status: "error", message: "Invalid credentials" });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        status: "error",
        message: "Invalid credentials",
      });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.json({
      status: "success",
      message: "User logged in successfully",
      data: {
        email: user.email,
        username: user.username,
        name: user.name,
        profileImage: user.profileImage,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        token,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getMyProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: req.user.id,
      },
    });
    if (!user) {
      return res.status(401).json({
        status: "error",
        message: "User not found",
      });
    }
    return res.json({
      status: "success",
      data: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        profileImage: user.profileImage,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

export const getUserProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        username: req.params.username,
      },
    });
    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    const totalPosts = await prisma.post.count({
      where: {
        author: {
          id: user.id,
        },
      },
    });

    const followers = await prisma.follower.findMany({
      where: {
        following: {
          id: user.id,
        },
      },
    });

    const following = await prisma.follower.count({
      where: {
        follower: {
          id: user.id,
        },
      },
    });

    return res.json({
      status: "success",
      data: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        profileImage: user.profileImage,
        totalPosts,
        followers: followers.length,
        isFollowing: followers
          .map((follower) => follower.followerId)
          .includes(req.user.id),
        following,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

export const uploadProfileImage = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: req.user.id,
      },
    });
    if (!user) {
      return res.status(401).json({
        status: "error",
        message: "User not found",
      });
    }
    const uploadedProfileImage = await axios.post(
      `${process.env.SM_AWS_API_URL}/upload-profile-image`,
      {
        image: req.body.profile_image,
      }
    );
    const updatedUser = await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        profileImage: uploadedProfileImage.data.url,
        updatedAt: new Date(),
      },
    });
    return res.json({
      status: "success",
      data: {
        id: updatedUser.id,
        email: updatedUser.email,
        username: updatedUser.username,
        name: updatedUser.name,
        profileImage: updatedUser.profileImage,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    const user = await prisma.user.findUnique({
      where: {
        id: req.user.id,
      },
    });
    if (!user) {
      return res.status(401).json({
        status: "error",
        message: "User not found",
      });
    }
    const isPasswordValid = await bcrypt.compare(
      current_password,
      user.password
    );
    if (!isPasswordValid) {
      return res.status(401).json({
        status: "error",
        message: "Current password is incorrect",
      });
    }
    const hashedPassword = await encryptPassword(new_password);
    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        password: hashedPassword,
        updatedAt: new Date(),
      },
    });
    return res.json({
      status: "success",
      message: "Password changed successfully",
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const hashedPassword = await encryptPassword(password);
    const user = await prisma.user.findFirst({
      where: {
        AND: [
          { resetToken: hashedToken },
          {
            resetTokenExpiresAt: {
              gt: new Date(),
            },
          },
        ],
      },
    });
    if (!user) {
      return res.status(400).json({
        status: "error",
        message: "Invalid or expired token",
      });
    }
    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiresAt: null,
        updatedAt: new Date(),
      },
    });
    return res.json({
      status: "success",
      message: "Password reset successfully",
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const { token, hashedToken } = generateResetToken();

    await prisma.user.update({
      where: {
        email: email,
      },
      data: {
        resetToken: hashedToken,
        resetTokenExpiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    });

    await axios.post(`${process.env.SM_AWS_API_URL}/send-reset-password`, {
      email,
      token,
    });

    return res.json({
      status: "success",
      message: "Reset password link sent to your email",
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

export const getMyPosts = async (req, res) => {
  try {
    const posts = await prisma.post.findMany({
      where: {
        authorId: req.user.id,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            profileImage: true,
          },
        },
        likes: {
          where: {
            userId: req.user.id,
          },
        },
        _count: {
          select: {
            likes: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const postWithLikes = posts.map((post) => ({
      ...post,
      isLiked: post.likes.length > 0,
      likes: undefined,
    }));

    return res.json({
      status: "success",
      data: postWithLikes,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

export const followUser = async (req, res) => {
  try {
    const result = await prisma.$transaction(async (tx) => {
      await tx.follower.create({
        data: {
          follower: {
            connect: {
              id: req.user.id,
            },
          },
          following: {
            connect: {
              id: parseInt(req.params.userId),
            },
          },
        },
      });

      await tx.notification.create({
        data: {
          userId: parseInt(req.params.userId),
          message: `${req.user.username} followed you`,
        },
      });

      const followers = await tx.follower.count({
        where: {
          followerId: req.user.id,
        },
      });

      return followers;
    });

    return res.json({
      status: "success",
      message: "User followed successfully",
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

export const unfollowUser = async (req, res) => {
  try {
    const result = await prisma.$transaction(async (tx) => {
      await tx.follower.delete({
        where: {
          followerId_followingId: {
            followerId: req.user.id,
            followingId: parseInt(req.params.userId),
          },
        },
      });

      const followers = await tx.follower.count({
        where: {
          followerId: req.user.id,
        },
      });

      return followers;
    });

    return res.json({
      status: "success",
      message: "User unfollowed successfully",
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};
