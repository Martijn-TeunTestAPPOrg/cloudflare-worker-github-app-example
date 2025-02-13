import { App } from "@octokit/app";
import { WebhookEvent } from "@octokit/webhooks";


export function startMainCompile(context: WebhookEvent<any>) {
    console.log('Main-compile started');



    console.log('Main-compile completed');
}

