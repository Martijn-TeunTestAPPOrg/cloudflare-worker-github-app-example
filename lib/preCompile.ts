import { App } from "@octokit/app";
import { WebhookEvent } from "@octokit/webhooks";


export function startPreCompile(context: WebhookEvent<any>) {
    console.log('Pre-compile started');



    console.log('Pre-compile completed');
}

