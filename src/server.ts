import app from "./app";
import config from "nconf";

config.argv();
config.file({file: config.get("config-file") || `${__dirname}/config.json`});

process.on("unhandledRejection", (error) => {
  console.error("UNHANDLED REJECTION", error ? error.stack : null);
});

app()
  .then((httpServer) => {
    httpServer.listen(config.get("port"), () => {
      console.log(`Listening to port ${config.get("port")}`);
    });
  })
  .catch((e) => {
    console.log("Error", e);
  });