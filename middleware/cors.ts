import type { VercelRequest, VercelResponse } from "@vercel/node";

export default function withCors(handler: Function) {
  return async (req: VercelRequest, res: VercelResponse) => {
    const origin = req.headers.origin || "*";
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );

    if (req.method === "OPTIONS") return res.status(204).end();

    return handler(req, res);
  };
}
