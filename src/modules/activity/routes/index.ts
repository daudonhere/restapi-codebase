import express from "express";
import { getAllActivityLogController, getActivityLogByIdController } from "../controllers/activity-read";
import { authenticateToken } from "../../../middlewares/authenticate";
import { authorizeRoles } from "../../../middlewares/authorization";
import { checkModuleEnabled } from "../../../middlewares/check-module";
import { mainRateLimiter } from "../../../middlewares/rate-limit";

const router = express.Router();

router.use(checkModuleEnabled("activity"));
router.use(authenticateToken);
router.use(mainRateLimiter);
router.use(authorizeRoles("superadmin", "administrator"));

router.get("/show", getAllActivityLogController);
router.get("/find/:id", getActivityLogByIdController);

export default router;