import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API route to check if GitHub Client ID is configured
  app.get("/api/auth/config", (req, res) => {
    res.json({
      configured: !!process.env.GITHUB_CLIENT_ID,
      clientId: process.env.GITHUB_CLIENT_ID || "",
    });
  });

  // API Route to construct GitHub auth URL
  app.get("/api/auth/url", (req, res) => {
    const client_id = process.env.GITHUB_CLIENT_ID || "";
    // Build the redirect URI using APP_URL or falling back to current host
    const appUrl = process.env.APP_URL || "http://localhost:3000";
    const redirect_uri = `${appUrl.replace(/\/$/, "")}/auth/callback`;
    const scope = "repo read:user";
    
    if (!client_id) {
      return res.status(400).json({ error: "GITHUB_CLIENT_ID is not configured in .env" });
    }

    const authUrl = `https://github.com/login/oauth/authorize?client_id=${client_id}&redirect_uri=${encodeURIComponent(redirect_uri)}&scope=${encodeURIComponent(scope)}`;
    res.json({ url: authUrl });
  });

  // Handle callback route for OAuth and exchange code for token
  app.get(["/auth/callback", "/auth/callback/"], async (req, res) => {
    const { code } = req.query;
    if (!code) {
      return res.send(`
        <html>
          <head>
            <title>GitHub Connection Failed</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #f6f8fa; color: #24292f; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
              .card { background: white; padding: 2rem; border-radius: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); border: 1px solid #d0d7de; text-align: center; max-width: 400px; }
              h2 { margin-top: 0; color: #cf222e; }
              button { background-color: #0969da; color: white; border: none; padding: 10px 16px; border-radius: 6px; font-weight: 600; cursor: pointer; margin-top: 1rem; }
              button:hover { background-color: #0c4cb4; }
            </style>
          </head>
          <body>
            <div class="card">
              <h2>Authentication Failed</h2>
              <p>No authorization code was returned from GitHub. Please try again.</p>
              <button onclick="window.close()">Close Window</button>
            </div>
          </body>
        </html>
      `);
    }

    const client_id = process.env.GITHUB_CLIENT_ID || "";
    const client_secret = process.env.GITHUB_CLIENT_SECRET || "";
    const appUrl = process.env.APP_URL || "http://localhost:3000";
    const redirect_uri = `${appUrl.replace(/\/$/, "")}/auth/callback`;

    try {
      // Exchange code for access token
      const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          client_id,
          client_secret,
          code,
          redirect_uri,
        }),
      });

      const tokenData = await tokenResponse.json() as { access_token?: string; error?: string; error_description?: string };

      if (tokenData.error || !tokenData.access_token) {
        return res.send(`
          <html>
            <head>
              <title>GitHub Connection Error</title>
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #f6f8fa; color: #24292f; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
                .card { background: white; padding: 2rem; border-radius: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); border: 1px solid #d0d7de; text-align: center; max-width: 400px; }
                h2 { margin-top: 0; color: #cf222e; }
                button { background-color: #0969da; color: white; border: none; padding: 10px 16px; border-radius: 6px; font-weight: 600; cursor: pointer; margin-top: 1rem; }
                button:hover { background-color: #0c4cb4; }
              </style>
            </head>
            <body>
              <div class="card">
                <h2>Authentication Error</h2>
                <p>${tokenData.error_description || tokenData.error || "Failed to exchange authorization code for token."}</p>
                <button onclick="window.close()">Close Window</button>
              </div>
            </body>
          </html>
        `);
      }

      // Send success message to parent window and close popup
      res.send(`
        <html>
          <head>
            <title>Connected to GitHub!</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #f6f8fa; color: #24292f; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
              .card { background: white; padding: 2rem; border-radius: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); border: 1px solid #d0d7de; text-align: center; max-width: 400px; }
              h2 { margin-top: 0; color: #1a7f37; }
              .spinner { border: 3px solid #f3f3f3; border-top: 3px solid #1a7f37; border-radius: 50%; width: 24px; height: 24px; animation: spin 1s linear infinite; margin: 1rem auto; }
              @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            </style>
          </head>
          <body>
            <div class="card">
              <h2>Connection Successful!</h2>
              <p>Your GitHub account has been connected successfully. This window will close automatically.</p>
              <div class="spinner"></div>
              <script>
                if (window.opener) {
                  window.opener.postMessage({ type: "OAUTH_AUTH_SUCCESS", token: "${tokenData.access_token}" }, "*");
                  setTimeout(() => {
                    window.close();
                  }, 1000);
                } else {
                  window.location.href = "/";
                }
              </script>
            </div>
          </body>
        </html>
      `);
    } catch (err: any) {
      console.error("Error exchanging GitHub code:", err);
      res.send(`
        <html>
          <head>
            <title>Server Error</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #f6f8fa; color: #24292f; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
              .card { background: white; padding: 2rem; border-radius: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); border: 1px solid #d0d7de; text-align: center; max-width: 400px; }
              h2 { margin-top: 0; color: #cf222e; }
              button { background-color: #0969da; color: white; border: none; padding: 10px 16px; border-radius: 6px; font-weight: 600; cursor: pointer; margin-top: 1rem; }
            </style>
          </head>
          <body>
            <div class="card">
              <h2>Internal Server Error</h2>
              <p>${err.message || "An unexpected error occurred during the authentication exchange."}</p>
              <button onclick="window.close()">Close Window</button>
            </div>
          </body>
        </html>
      `);
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
