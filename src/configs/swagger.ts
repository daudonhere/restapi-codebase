import dotenv from "dotenv";
import swaggerJsdoc from "swagger-jsdoc";

dotenv.config();

const HOST = process.env.HOST || "http://localhost";
const PORT = process.env.PORT || "4000";

const SERVER_URL = `${HOST.replace(/\/$/, "")}:${PORT}/v1`;

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "ExpressJs Backend API Starterkit",
      version: "1.0.0",
      description:
        "REST API documentation for Backend Starterkit built with ExpressJs and TypeScript",
    },
    servers: [
      {
        url: SERVER_URL,
        description: process.env.NODE_ENV === "production"
          ? "Production Server"
          : "Development Server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  apis: ["./src/modules/**/*.yaml"],
};

export const swaggerSpec = swaggerJsdoc(options);