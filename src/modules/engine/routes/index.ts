import express from "express";
import { getAllModulesController } from "../controllers/engine-read";
import { toggleModuleController } from "../controllers/engine-update";
import { authenticateToken } from "../../../middlewares/authenticate";
import { authorizeRoles } from "../../../middlewares/authorization";
import { checkModuleEnabled } from "../../../middlewares/check-module";
import { mainRateLimiter } from "../../../middlewares/rate-limit";

const router = express.Router();

router.use(checkModuleEnabled("engine"));
router.use(mainRateLimiter);
router.use(authenticateToken);
router.use(authorizeRoles("superadmin"));

router.get("/show", getAllModulesController);

router.put("/status/:name", toggleModuleController);

export default router;
