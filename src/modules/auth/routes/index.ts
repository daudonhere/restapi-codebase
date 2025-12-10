import express from "express";
import { loginController } from "../controllers/token-create";
import { refreshController } from "../controllers/token-refresh";
import { logoutController } from "../controllers/token-delete";
import { googleAuthRedirectController } from "../controllers/google-redirect";
import { googleCallbackController } from "../controllers/google-callback";
import { githubAuthRedirectController } from "../controllers/github-redirect";
import { githubCallbackController } from "../controllers/github-callback";
import { checkModuleEnabled } from "../../../middlewares/check-module";
import { authRateLimiter, oauthRateLimiter } from "../../../middlewares/rate-limit";

const router = express.Router();

router.use(checkModuleEnabled("auth"));

router.post("/login", authRateLimiter, loginController);
router.post("/refresh", authRateLimiter, refreshController);
router.post("/logout", authRateLimiter, logoutController);

router.get("/google", oauthRateLimiter, googleAuthRedirectController);
router.get("/google/callback", oauthRateLimiter, googleCallbackController);

router.get("/github", oauthRateLimiter, githubAuthRedirectController);
router.get("/github/callback", oauthRateLimiter, githubCallbackController);

export default router;
