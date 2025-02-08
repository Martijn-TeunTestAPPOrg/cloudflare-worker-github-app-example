import { App } from "@octokit/app";
import { verifyWebhookSignature } from "./lib/verify.js";

export default {
  /**
   * @param {Request} request
   * @param {Record<string, any>} env
   */
  async fetch(request, env) {
    // wrangler secret put APP_ID
    const appId = env.APP_ID;
    // wrangler secret put WEBHOOK_SECRET
    const secret = env.WEBHOOK_SECRET;
    // wrangler secret put PRIVATE_KEY
    const privateKey = env.PRIVATE_KEY;

    // instantiate app
    // https://github.com/octokit/app.js/#readme
    const app = new App({
      appId,
      privateKey,
      webhooks: {
        secret,
      },
    });

    // Main compile
    app.webhooks.on("push", async (context) => {
      console.log("console push event received");

      
    });

    app.webhooks.on("issues.opened", async ({ octokit, payload }) => {
      await octokit.request(
        "POST /repos/{owner}/{repo}/issues/{issue_number}/comments",
        {
          owner: payload.repository.owner.login,
          repo: payload.repository.name,
          issue_number: payload.issue.number,
          body:
            "Hello there from [Cloudflare Workers](https://github.com/gr2m/cloudflare-worker-github-app-example/#readme)",
        }
      );
    });

    if (request.method === "GET") {
      const { data } = await app.octokit.request("GET /app");

      return new Response(
        `<h1>Content Compiler GitHub App</h1>

<p>Installation count: ${data.installations_count}</p>
    
<p><a href="https://github.com/apps/cloudflare-worker-example">Install</a> | <a href="https://github.com/gr2m/cloudflare-worker-github-app-example/#readme">source code</a></p>`,
        {
          headers: { "content-type": "text/html" },
        }
      );
    }

    const id = request.headers.get("x-github-delivery");
    const name = request.headers.get("x-github-event");
    const signature = request.headers.get("x-hub-signature-256") ?? "";
    const payloadString = await request.text();
    const payload = JSON.parse(payloadString);

    // Verify webhook signature
    try {
      await verifyWebhookSignature(payloadString, signature, secret);
    } catch (error) {
      app.log.warn(error.message);
      return new Response(`{ "error": "${error.message}" }`, {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    // Now handle the request
    try {
      await app.webhooks.receive({
        id,
        name,
        payload,
      });

      return new Response(`{ "ok": true }`, {
        headers: { "content-type": "application/json" },
      });
    } catch (error) {
      app.log.error(error);

      return new Response(`{ "error": "${error.message}" }`, {
        status: 500,
        headers: { "content-type": "application/json" },
      });
    }
  },
};
