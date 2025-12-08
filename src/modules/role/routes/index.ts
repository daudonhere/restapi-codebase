import express from "express";
import { getAllRolesController, getRoleByIdController } from "../controllers/role-read";
import { createRoleController } from "../controllers/role-create";
import { updateRoleController } from "../controllers/role-update";
import { deleteRoleController, deleteBulkRolesController } from "../controllers/role-delete";
import { authorizeRoles } from "../../../middlewares/authorization";
import { authenticateToken } from "../../../middlewares/authenticate";
import { checkModuleEnabled } from "../../../middlewares/check-module";

const router = express.Router();

router.use(checkModuleEnabled("role"));
router.use(authenticateToken);
router.get("/show", getAllRolesController);
router.get("/find/:id", getRoleByIdController);
router.post(
  "/create",
  authorizeRoles("superadmin", "administrator"),
  createRoleController
);
router.put(
  "/edit/:id",
  authorizeRoles("superadmin", "administrator"),
  updateRoleController
);
router.delete(
  "/remove/:id",
  authorizeRoles("superadmin", "administrator"),
  deleteRoleController
);
router.delete(
  "/select",
  authorizeRoles("superadmin", "administrator"),
  deleteBulkRolesController
);

export default router;
