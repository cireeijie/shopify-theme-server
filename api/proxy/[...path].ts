import type { VercelRequest, VercelResponse } from "@vercel/node";
import { parse } from "cookie";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { path } = req.query;

  if (!path) return res.status(400).json({ error: "Missing path" });

  const backendURL = `https://fernexcel-api.vercel.app/${
    Array.isArray(path) ? path.join("/") : path
  }`;

  try {
    // Convert headers for fetch
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    for (const key in req.headers) {
      const value = req.headers[key];
      if (typeof value === "string") headers[key] = value;
      else if (Array.isArray(value)) headers[key] = value.join(",");
    }

    // Forward the request to backend
    const response = await fetch(backendURL, {
      method: req.method,
      headers,
      body: req.method !== "GET" ? JSON.stringify(req.body) : undefined,
      credentials: "include",
    });

    const data = await response.json();

    // Forward Set-Cookie header so browser sees it as first-party
    const setCookie = response.headers.get("set-cookie");
    if (setCookie) res.setHeader("Set-Cookie", setCookie);

    res.status(response.status).json(data);
  } catch (err: any) {
    res.status(500).json({ error: "Proxy failed", details: err.message });
  }
}
