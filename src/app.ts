import express, { Express, Request, Response, NextFunction, ErrorRequestHandler } from "express";
import dotenv from "dotenv";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { config } from "./configs";
import { swaggerSpec } from "./configs/swagger";
import { ResponsError } from "./constants/respons-error";
import { ResponsSuccess } from "./constants/respons-success";
import { Code } from "./constants/message-code";
import { activityContextMiddleware } from "./middlewares/activity-context";
import { securityMiddleware } from "./middlewares/security";
import { mainRateLimiter } from "./middlewares/rate-limit";
import cookieParser from "cookie-parser";
import routes from "./routes/v1";

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT;
const HOST = process.env.HOST;

app.set("trust proxy", true);

app.use(cors());
app.use(securityMiddleware());
app.use(mainRateLimiter);
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(activityContextMiddleware);
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/v1", routes);

app.get("/docs.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

app.get("/", (req: Request, res: Response) => {
  return ResponsSuccess(res, Code.OK, "server is up and running", { data: "services is healthy" });
});

app.use((req: Request, res: Response, next: NextFunction) => {
  next(new ResponsError(Code.NOT_FOUND, `route ${req.method} ${req.originalUrl} not found`));
});

const mapCodeToHttpStatus = (code: Code): number => {
  if (code >= 400 && code < 600) return code;

  switch (code) {
    case Code.UNAUTHORIZED:
      return Code.UNAUTHORIZED;
    case Code.FORBIDDEN:
      return Code.FORBIDDEN;
    case Code.CONFLICT:
      return Code.CONFLICT;
    default:
      return Code.BAD_REQUEST;
  }
};

const globalErrorHandler: ErrorRequestHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let errorResponse: ResponsError;
  if (err instanceof ResponsError) {
    errorResponse = err;
  }
  else {
    console.error(`[ERROR] ${err.stack || err.message}`);
    errorResponse = new ResponsError(
      Code.INTERNAL_SERVER_ERROR,
      err.message || "unexpected error occurred"
    );
  }

  const httpStatus = mapCodeToHttpStatus(errorResponse.code);
  return res.status(httpStatus).json(errorResponse.toJSON());
};

app.use(globalErrorHandler);

app.listen(PORT, () => {
  console.log(`services running at ${HOST}:${PORT}`);
  config.connect((err) => {
    if (err) {
      console.error("failed to connect to PostgreSQL cause ", err.message);
    } else {
      console.log("connected to Postgre successfully");
    }
  });
});

export default app;