import express from "express";
import { getAllActivityLogController, getActivityLogByIdController } from "../controllers/activity-read";
import { authenticateToken } from "../../../middlewares/authenticate";
import { authorizeRoles } from "../../../middlewares/authorization";
import { checkModuleEnabled } from "../../../middlewares/check-module";

const router = express.Router();

router.use(checkModuleEnabled("activity"));
router.use(authenticateToken);
router.use(authorizeRoles("superadmin", "administrator"));
router.get("/show/all", getAllActivityLogController);
router.get("/show/:id", getActivityLogByIdController);

export default router;