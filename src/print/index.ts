import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import fs from "fs";
import config from "nconf";
import fetch from "node-fetch";
import tmp from "tmp";
import { spawn } from "child_process";

export interface Assignee {
  name: string,
  avatarUrl: string
}

export interface Estimate {
  presentation: string,
  minutes: number
}

export default class Print {

  private doc: PDFKit.PDFDocument;
  private data: any;

  constructor(data: any) {
    this.doc = new PDFDocument({margin: 15, size: [226, 285]});
    this.data = data;
  }

  async build() {
    this.writeHeader();
    this.writeDescription();
    this.writeEstimate();
    await this.writeAssignee();
    await this.writeQr();
    tmp.file({ prefix: "metatrack_", postfix: ".pdf" }, (err: any, path: string, fd: number, clean: () => void) => {
      const stream = fs.createWriteStream(path);
      stream.on("close", () => {
        const lp = spawn("lp", [path]);
        lp.on('close', code => {
          clean();
        });
      });
      this.doc.pipe(stream);
      this.doc.end();
    });
  }

  private writeHeader() {
    this.doc.fontSize(18);
    this.doc.text(this.data.summary);
    this.doc.moveDown();
  }

  private writeDescription() {
    this.doc.fontSize(12);
    this.doc.text(this.data.description);
  }

  private writeEstimate() {
    const estimate = this.getEstimate();
    if (!estimate) {
      return;
    }

    const points = estimate.minutes / 60;
    this.doc.fontSize(20);
    this.doc.text(points.toString(), 190, 15);
  }

  private async writeAssignee() {
    const assignee = this.getAssignee();
    if (!assignee) {
      return;
    }

    const url = `${config.get("youtrack:url")}${assignee.avatarUrl}`;
    const res = await fetch(url);
    const buffer = await res.arrayBuffer();
    this.doc.image(buffer, 140, 190, {width: 70});
  }

  private async writeQr() {
    this.doc.image(await QRCode.toDataURL(this.data.id, {errorCorrectionLevel: "H"}), 0, 180, {width: 100});
  }

  private getEstimate(): Estimate {
    const data = this.getField("Estimation");
    if (!data) {
      return undefined;
    }

    return {
      presentation: data.value.presentation,
      minutes: data.value.minutes
    };
  }

  private getAssignee(): Assignee {
    const data = this.getField("Assignee");
    if (!data) {
      return undefined;
    }

    return {
      name: data.value.name,
      avatarUrl: data.value.avatarUrl
    };
  }

  private getField(fieldName: string) {
    return this.data.fields.find((field: any) => field.projectCustomField.field.name === fieldName);
  }

}