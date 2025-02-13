import fs from 'fs';
import simpleGit from 'simple-git';
import { App } from "@octokit/app";
import { getDefaultConfig, getInstallationToken, configureGit, deleteFolderRecursiveSync, clearTempStorage } from "./helpers";
import { EmitterWebhookEvent  } from "@octokit/webhooks";


export async function startPreCompile(octokit: App, context: EmitterWebhookEvent <any>) {
    console.log('Pre-compile started');
    const { gitAppName, gitAppEmail, repoOwner, repoName, repoUrl, clonedRepoFolder, cloneTargetDirectory, tempStorageDirectory, datasetRepoUrl, datasetFolder } = getDefaultConfig(context);

    const payload = context.payload;
    const prNumber = payload.number;

    octokit.log.info(`Pull request ${prNumber} opened for ${repoOwner}/${repoName}`);
    octokit.log.info('Base branch: ', payload.pull_request.base.ref);
    octokit.log.info('Head branch: ', payload.pull_request.head.ref);

    // Get the installation token
    const token = await getInstallationToken(context);

    // Configure git with token
    const remoteUrl = `https://x-access-token:${token}@github.com/${repoOwner}/${repoName}.git`;
    let git = simpleGit();
    await configureGit(git, gitAppName, gitAppEmail);

    const baseBranch = payload.pull_request.base.ref;
    const headBranch = payload.pull_request.head.ref;

    let changedFiles: any[] = [];
    let illegalChangedFiles: any[] = [];

    // Step 1: Remove the temp folders
    clearTempStorage(octokit, cloneTargetDirectory, tempStorageDirectory);

    // Step 2: Clone the dataset
    try {
        octokit.log.info(`Cloning dataset...`);

        // Remove the dataset folder if it exists
        if (fs.existsSync(datasetFolder)) {
            deleteFolderRecursiveSync(octokit, datasetFolder);
        }

        await git.clone(datasetRepoUrl, datasetFolder);
        octokit.log.info(`Dataset cloned successfully to ${cloneTargetDirectory}`);
    }
    catch (error: any) {
        octokit.log.error(`Failed to clone dataset: ${error.message}`);
        throw error;
    }

    console.log('Pre-compile completed');
}

