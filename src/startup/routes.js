/*import express from "express";
import {
  registerUser,
  activationAccount,
  loginUser,
} from "../controllers/user.controller.js";


const router = express.Router();
router.post("/register", registerUser);
router.get("/activation/:token", activationAccount);
router.post("/login", loginUser);

export default router;*/
require("dotenv").config();
import userRoutes from "../routes/user.routes";
import express from "express";
import cors from "cors";

export default function (app) {
  //Midelwares
  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.static("public"));
  
  //app.use(express.static("public"));

  //Routes
  app.use("/", userRoutes);

}