import express from "express";
import { getAllModulesController } from "../controllers/engine-read";
import { toggleModuleController } from "../controllers/engine-update";
import { authenticateToken } from "../../../middlewares/authenticate";
import { authorizeRoles } from "../../../middlewares/authorization";

const router = express.Router();

router.use(authenticateToken);
router.use(authorizeRoles("superadmin"));
router.get("/show/all", getAllModulesController);
router.put("/toggle/:name", toggleModuleController);

export default router;