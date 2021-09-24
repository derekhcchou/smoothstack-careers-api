
import { handlerPath } from "@libs/handlerResolver";

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      http: {
        method: "post",
        path: "mass-update",
        cors: {
          origin: "*",
          headers: ["Content-Type"],
        },
      },
    },
  ],
  timeout: 900,
};
