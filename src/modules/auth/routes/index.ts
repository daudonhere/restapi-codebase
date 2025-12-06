import express from "express";
import { loginController } from "../controllers/token-create";
import { refreshController } from "../controllers/token-refresh";
import { logoutController } from "../controllers/token-delete";
import { googleAuthRedirectController } from "../controllers/google-redirect";
import { googleCallbackController } from "../controllers/google-callback";
import { githubAuthRedirectController } from "../controllers/github-redirect";
import { githubCallbackController } from "../controllers/github-callback";
import { checkModuleEnabled } from "../../../middlewares/check-module";

const router = express.Router();

router.use(checkModuleEnabled("auth"));
router.post("/login", loginController);
router.post("/refresh", refreshController);
router.post("/logout", logoutController);
router.get("/google", googleAuthRedirectController);
router.get("/google/callback", googleCallbackController);
router.get("/github", githubAuthRedirectController);
router.get("/github/callback", githubCallbackController);

export default router;