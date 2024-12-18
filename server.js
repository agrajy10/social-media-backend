import { PrismaClient } from "@prisma/client";
import e from "express";
import helmet from "helmet";
import { body } from "express-validator";

const app = e();
const prisma = new PrismaClient();

app.use(e.json());
app.use(helmet());

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});

app.get("/", async (req, res) => {
  const result = await prisma.user.findMany();
  res.json(result);
});
