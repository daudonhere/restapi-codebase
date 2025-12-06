import { Router } from "express";
import engineRoute from "../../modules/engine/routes";
import authRoutes from "../../modules/auth/routes";
import roleRoutes from "../../modules/role/routes";
import userRoutes from "../../modules/user/routes";
import activityRoutes from "../../modules/activity/routes";

const router = Router();

router.use("/engine", engineRoute);
router.use("/activity", activityRoutes);
router.use("/auth", authRoutes);
router.use("/role", roleRoutes);
router.use("/user", userRoutes);

export default router;
