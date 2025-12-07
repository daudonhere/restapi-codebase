import express from "express";
import { createUserController, sendVerificationCodeController, confirmVerificationCodeController, restoreUserByIdController } from "../controllers/user-create";
import { findAllUsersController, findUserByEmailController, findUserByIdController } from "../controllers/user-read";
import { updateUserByIdController, updateUserRolesController, uploadAvatarController } from "../controllers/user-update";
import { deleteBulkUsersController, deleteUserByIdController, findDeletedUsersController } from "../controllers/user-delete";
import { checkModuleEnabled } from "../../../middlewares/check-module";
import { authenticateToken } from "../../../middlewares/authenticate";
import { authorizeRoles } from "../../../middlewares/authorization";
import { upload } from "../../../middlewares/multer-upload";

const router = express.Router();

router.use(checkModuleEnabled("user"));
router.post("/create", createUserController);
router.post("/verif/send", sendVerificationCodeController);
router.post("/verif/confirm", confirmVerificationCodeController);
router.use(authenticateToken);
router.get("/show/all", findAllUsersController);
router.get("/email/:email", findUserByEmailController);
router.get("/deleted/all", authorizeRoles("superadmin", "administrator"), findDeletedUsersController);
router.put("/restore/:id", authorizeRoles("superadmin", "administrator"), restoreUserByIdController);
router.put("/roles/:id", authorizeRoles("superadmin", "administrator"), updateUserRolesController);
router.delete("/delete", authorizeRoles("superadmin", "administrator"), deleteBulkUsersController);
router.put("/edit/:id", updateUserByIdController);
router.delete("/remove/:id", authorizeRoles("superadmin", "administrator"), deleteUserByIdController);
router.get("/show/:id", findUserByIdController);
router.patch("/avatar/:id", upload.single("avatar"), uploadAvatarController);

export default router;
