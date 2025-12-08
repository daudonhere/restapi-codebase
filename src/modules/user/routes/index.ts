import express from "express";
import { createUserController, sendVerificationCodeController, confirmVerificationCodeController, restoreUserByIdController } from "../controllers/user-create";
import { findAllUsersController, findUserByIdController } from "../controllers/user-read";
import { updateUserByIdController, updateUserRolesController, uploadAvatarController, updateUserCredentialController } from "../controllers/user-update";
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
router.get("/deleted/all", authorizeRoles("superadmin", "administrator"), findDeletedUsersController);
router.put("/restore/:id", authorizeRoles("superadmin", "administrator"), restoreUserByIdController);
router.put("/roles/:id", authorizeRoles("superadmin", "administrator"), updateUserRolesController);
router.delete("/select/delete", authorizeRoles("superadmin", "administrator"), deleteBulkUsersController);
router.get("/find/all", authorizeRoles("superadmin", "administrator"), findAllUsersController);
router.delete("/delete/:id", authorizeRoles("superadmin", "administrator"), deleteUserByIdController);
router.put("/credential/self", updateUserCredentialController);
router.patch("/avatar/self", upload.single("avatar"), uploadAvatarController);
router.put("/edit/self", updateUserByIdController);
router.get("/find/:id", findUserByIdController);

export default router;