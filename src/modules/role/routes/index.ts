import express from "express";
import { getAllRolesController, getRoleByIdController } from "../controllers/role-read";
import { createRoleController } from "../controllers/role-create";
import { updateRoleController } from "../controllers/role-update";
import { deleteRoleController, deleteBulkRolesController } from "../controllers/role-delete";
import { authorizeRoles } from "../../../middlewares/authorization";
import { authenticateToken } from "../../../middlewares/authenticate";
import { checkModuleEnabled } from "../../../middlewares/check-module";
import { mainRateLimiter } from "../../../middlewares/rate-limit";

const router = express.Router();

router.use(checkModuleEnabled("role"));
router.use(mainRateLimiter);
router.use(authenticateToken);
router.use(authorizeRoles("superadmin", "administrator"));

router.get("/show", getAllRolesController);
router.get("/find/:id", getRoleByIdController);
router.post("/create", createRoleController);
router.put("/edit/:id", updateRoleController);
router.delete("/remove/:id", deleteRoleController);
router.delete("/select", deleteBulkRolesController);

export default router;
