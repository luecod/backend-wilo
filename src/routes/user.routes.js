import express from "express";
import {
  registerUser,
  activationAccount,
  loginUser,
} from "../controllers/user.controller";

const router = express.Router();

router.get("/", (req, res) => {
  res.send({message:"Hola"});
});
router.post("/register", registerUser);
router.get("/activation/:token", activationAccount);
router.post("/login", loginUser);

export default router;