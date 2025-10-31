import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

export const login = async (req, res) => {
  const { email, password } = req.body;

  if (email !== process.env.ADMIN_EMAIL)
    return res.status(400).json({ message: "Invalid email" });

  const isMatch = password === process.env.ADMIN_PASSWORD;
  if (!isMatch) return res.status(400).json({ message: "Invalid password" });

  const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: "1d" });
  res.json({ token });
};
