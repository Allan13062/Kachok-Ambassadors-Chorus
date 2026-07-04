let app: any;
let startupError: any;

try {
  const mod = await import("../server");
  app = mod.default;
} catch (err: any) {
  startupError = err;
}

export default function handler(req: any, res: any) {
  if (startupError) {
    return res.status(500).json({
      error: "Server failed to start",
      message: startupError.message,
      stack: startupError.stack?.split("\n").slice(0, 8).join("\n")
    });
  }
  return app(req, res);
}
