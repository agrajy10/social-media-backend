import jwt from "jsonwebtoken";

export default function handleAuthentication(req, res, next) {
  console.log(req);
  const token = req.header("Authorization")?.replace("Bearer ", "");
  console.log(token);
  if (!token) {
    return res.status(401).json({ status: "error", message: "Unauthorized" });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ status: "error", message: "Unauthorized" });
  }
}
