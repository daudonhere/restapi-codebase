import express from "express";
import { 
  createUserController, 
  sendVerificationCodeController, 
  confirmVerificationCodeController, 
  restoreUserByIdController 
} from "../controllers/user-create";

import { 
  findAllUsersController, 
  findUserByIdController 
} from "../controllers/user-read";

import { 
  updateUserByIdController, 
  updateUserRolesController, 
  uploadAvatarController, 
  updateUserCredentialController 
} from "../controllers/user-update";

import { 
  deleteBulkUsersController, 
  deleteUserByIdController, 
  findDeletedUsersController 
} from "../controllers/user-delete";

import { checkModuleEnabled } from "../../../middlewares/check-module";
import { authenticateToken } from "../../../middlewares/authenticate";
import { authorizeRoles } from "../../../middlewares/authorization";
import { upload } from "../../../middlewares/multer-upload";
import { mainRateLimiter } from "../../../middlewares/rate-limit";

const router = express.Router();

router.use(checkModuleEnabled("user"));
router.use(mainRateLimiter); 

router.post("/create", createUserController);
router.post("/verif/send", sendVerificationCodeController);
router.post("/verif/confirm", confirmVerificationCodeController);

router.use(authenticateToken);

router.get("/deleted",
    authorizeRoles("superadmin", "administrator"),
    findDeletedUsersController
);

router.put("/restore/:id",
    authorizeRoles("superadmin", "administrator"),
    restoreUserByIdController
);

router.put("/role/:id",
    authorizeRoles("superadmin", "administrator"),
    updateUserRolesController
);

router.delete("/select",
    authorizeRoles("superadmin", "administrator"),
    deleteBulkUsersController
);

router.get("/show",
    authorizeRoles("superadmin", "administrator"),
    findAllUsersController
);

router.delete("/delete/:id",
    authorizeRoles("superadmin", "administrator"),
    deleteUserByIdController
);

router.put("/credential", updateUserCredentialController);

router.patch(
  "/avatar",
  upload.single("avatar"),
  uploadAvatarController
);

router.put("/change", updateUserByIdController);

router.get("/find/:id", findUserByIdController);

export default router;