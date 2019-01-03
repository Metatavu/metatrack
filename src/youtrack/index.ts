import fetch, { Headers, BodyInit } from "node-fetch";
import { URL, URLSearchParams } from "url";

export default class YouTrack {

  private accessToken: string;
  private apiUrl: string;

  constructor(apiUrl: string, accessToken: string) {
    this.apiUrl = apiUrl;
    this.accessToken = accessToken;
  }

  buildHeaders(): Headers {
    const headers = {
      "Authorization": `Bearer ${this.accessToken}`,
      "Accept": "application/json",
      "Cache-Control": "no-cache",
      "Content-Type": "application/json",
      "User-Agent": "Metatrack Robot"
    };

    return new Headers(headers);
  }

  buildUrl(path: string, params?: string | URLSearchParams | { [key: string]: string | string[]; } | Iterable<[string, string]> | [string, string][]): string {
    const url = new URL(`${this.apiUrl}${path}`);
    if (params) {
      url.search = new URLSearchParams(params).toString();
    }

    return url.toString();
  }

  doRequest(method: string, path: string, params?: string | URLSearchParams | { [key: string]: string | string[]; } | Iterable<[string, string]> | [string, string][], body?: BodyInit) {
    return fetch(this.buildUrl(path, params), {method: method, body: body, headers: this.buildHeaders() }).then(res => res.json());
  }

  updateIssue(issue: any) {
    return this.doRequest("POST", `/youtrack/api/issues/${issue.id}`, {}, JSON.stringify(issue));
  }

  listIssues(fields: string[]) {
    return this.doRequest("GET", "/youtrack/api/issues", {fields: fields});
  }

  findIssue(id: string, fields: string[]) {
    return this.doRequest("GET", `/youtrack/api/issues/${id}`, {fields: fields});
  }

  listBoards(fields: string[]) {
    return this.doRequest("GET", "/youtrack/api/agiles", {fields: fields});
  }
}