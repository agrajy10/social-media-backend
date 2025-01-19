import { faker } from "@faker-js/faker";
import { prisma } from "./app/index.js";
import encryptPassword from "./utils/encrptPassword.js";

async function generateUsers() {
  const users = [];

  for (let i = 0; i < 30; i++) {
    const hashedPassword = await encryptPassword(
      `${process.env.DEMO_USERS_PASS}`
    );
    const user = {
      email: faker.internet.email(),
      username: faker.internet.username().toLowerCase(),
      name: faker.person.fullName(),
      password: hashedPassword,
    };
    users.push(user);
  }

  return users;
}

async function generatePosts(numberOfPosts) {
  const posts = [];

  const usersId = await prisma.user.findMany({
    select: {
      id: true,
    },
  });

  for (let i = 0; i < numberOfPosts; i++) {
    const fakeDate = faker.date.past(5);
    const post = {
      title: faker.lorem.sentence(),
      content: `<p>${faker.lorem.paragraphs(
        faker.helpers.arrayElement([1, 2, 3])
      )}</p>`,
      authorId: faker.helpers.arrayElement(usersId).id,
      createdAt: fakeDate,
      updatedAt: fakeDate,
    };
    posts.push(post);
  }

  return posts;
}

async function loadPostLikes() {
  const postIds = await prisma.post.findMany({
    select: {
      id: true,
    },
  });

  const userIds = await prisma.user.findMany({
    select: {
      id: true,
    },
  });

  for (let i = 0; i < postIds.length; i++) {
    let users = userIds.slice(
      0,
      Math.floor(Math.random() * (userIds.length * 0.25))
    );
    console.log("users", users);
    for (let j = 0; j < users.length; j++) {
      await prisma.postLike.create({
        data: {
          postId: postIds[i].id,
          userId: users[j].id,
          likedAt: faker.date.past(5),
        },
      });
    }
  }
}

async function loadDummyData(batchSize, numberOfPosts) {
  try {
    const users = await generateUsers();
    await prisma.user.createMany({
      data: users,
    });

    const posts = await generatePosts(numberOfPosts);

    while (posts.length) {
      const batch = posts.splice(0, batchSize);
      await prisma.post.createMany({
        data: batch,
      });
    }
  } catch (error) {
    console.log(error);
  }
}

//loadDummyData(20, 20);
loadPostLikes();
