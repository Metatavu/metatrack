import http from "http";
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import Routes from "./routes";

/**
 * Initializes the application
 * 
 * @returns {Server}
 */
export default async () => {
  
  const app = express();
  const httpServer = http.createServer(app);

  app.set("trust proxy", true);
  app.use(cors());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());

  const routes = new Routes(app);
  routes.init();
  
  return httpServer;
};