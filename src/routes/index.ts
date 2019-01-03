import { Express, Request, Response } from "express";
import YouTrack from "../youtrack";
import config from "nconf";
import Print from "../print";

export default class Routes {

  private app: Express;
  private youTrack: YouTrack;

  constructor(app: Express) {
    this.app = app;
    this.youTrack = new YouTrack(config.get("youtrack:url"), config.get("youtrack:token"));
  }

  init() {
    this.app.get("/", this.index.bind(this));
    this.app.get("/boards", this.boards.bind(this));
    this.app.get("/issues", this.issues.bind(this));
    this.app.get("/issues/:id", this.issue.bind(this));
    this.app.post("/issues/:id/state", this.updateIssueState.bind(this));
    this.app.get("/issues/:id/print", this.printIssue.bind(this));
  }

  handleError(res: Response, err?: Error) {
    res.status(500).send(err);
  }

  async index(req: Request, res: Response) {
    res.send("TODO: UI");
  }

  async boards(req: Request, res: Response) {
    try {
      res.send(await this.youTrack.listBoards(["id", "name"]));
    } catch(err) {
      this.handleError(res, err);
    }
  }

  async issues(req: Request, res: Response) {
    try {
      res.send(await this.youTrack.listIssues(["id", "summary", "description", "fields(id,projectCustomField(field(name)),value(name,avatarUrl,presentation,minutes))"]));
    } catch(err) {
      this.handleError(res, err);
    }
  }

  async issue(req: Request, res: Response) {
    try {
      var id = req.params.id;
      if (!id) {
        res.status(404).send();
        return;
      }

      res.send(await this.youTrack.findIssue(id, ["id", "summary", "description", "fields(id,projectCustomField(field(name)),value(id,name,avatarUrl,fullName,presentation,minutes,bundle(name,values(id,name))))"]));
    } catch(err) {
      this.handleError(res, err);
    }
  }

  async updateIssueState(req: Request, res: Response) {
    try {
      var id = req.params.id;
      var stateId = req.body.state;
      if (!id) {
        res.status(404).send();
        return;
      }
      const data = await this.youTrack.findIssue(id, ["id", "fields(id,projectCustomField(field(name)),value(id,name,bundle(name,values(id,name))))"]);
      const stateIndex = data.fields.findIndex((field: any) => field.projectCustomField.field.name === "State");
      if (stateIndex < 0) {
        res.status(400).send("Missing state");
        return
      }

      data.fields[stateIndex].value.id = stateId;
      res.send(await this.youTrack.updateIssue(data));
    } catch(err) {
      this.handleError(res, err);
    }
  }

  async printIssue(req: Request, res: Response) {
    try {
      var id = req.params.id;
      if (!id) {
        res.status(404).send();
        return;
      }

      const data = await this.youTrack.findIssue(id, ["id", "summary", "description", "fields(id,projectCustomField(field(name)),value(name,avatarUrl,fullName,presentation,minutes))"]);
      const print = new Print(data);
      await print.build();
      res.send(data);
    } catch(err) {
      this.handleError(res, err);
    }
  }

}