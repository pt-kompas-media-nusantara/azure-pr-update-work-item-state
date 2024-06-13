const core = require("@actions/core");

const fetch = require("node-fetch");
const staticFunctions = require('../staticFunctions');
const azureDevOpsHandler = require('./azureDevOpsHandler');

async function getPrInfo() {
    try {
        const requestUrl = "https://api.github.com/repos/"+process.env.ghrepo_owner+"/"+process.env.ghrepo+"/pulls/"+process.env.pull_number;

        const fetchResponse = await fetch(requestUrl, {
            method: 'GET',
            headers: staticFunctions.getRequestHeaders()
        });

        const jsonResponse = await fetchResponse.json();

        return [jsonResponse.title, jsonResponse.body];
    } catch (err) {
        console.log("Couldn't obtain PR title for PR number " + process.env.pull_number);
        core.setFailed(err.toString());
    }
}
exports.getPrInfo = getPrInfo;

function getWorkItemIdFromPrBody(fullPrTitle) {
    try {
        var foundMatches = fullPrTitle.match(/AB#[(0-9)]*/g);
        if (!foundMatches) {
            throw new Error("No AB# found in the title");
        }
        var workItemIds = foundMatches.map(match => match.match(/[0-9]+/)[0]);

        console.log("foundMatches AB : " + foundMatches);
        console.log("workItemIds AB : " + workItemIds);

        return workItemIds;
    } catch (err) {
        console.log("Couldn't obtain work item ID from PR Body Message, Please Defining Related WorkItem ID in PR Message: e.g: AB#12345");
        core.setFailed(err.toString());
    }
}
exports.getWorkItemIdFromPrBody = getWorkItemIdFromPrBody;

function getTaskItemIdFromPrBody(fullPrTitle) {
    try {
        var foundMatches = fullPrTitle.match(/TASK#[0-9]*/g);
        if (!foundMatches) {
            throw new Error("No TASK# found in the title");
        }
        var workItemIds = foundMatches.map(match => match.match(/[0-9]+/)[0]);

        console.log("foundMatches TASK : " + foundMatches);
        console.log("workItemIds TASK : " + workItemIds);

        return workItemIds;
    } catch (err) {
        console.log("Couldn't obtain work item ID from PR Body Message, Please Defining Related WorkItem ID in PR Message: e.g: TASK#12345");
        core.setFailed(err.toString());
    }
}
exports.getTaskItemIdFromPrBody = getTaskItemIdFromPrBody;

// ------------------------------------------------------
async function handleOpenedPr(workItemId) {
    let patchDocument = [
        {
            op: "add",
            path: "/fields/System.State",
            value: process.env.propenstate
        }
    ];

    await azureDevOpsHandler.updateWorkItem(patchDocument, workItemId);
    return true;
}
exports.handleOpenedPr = handleOpenedPr;

async function handleTaskOpenedPr(taskItemId) {
    let patchDocument = [
        {
            op: "add",
            path: "/fields/System.State",
            value: process.env.propentaskstate
        }
    ];

    await azureDevOpsHandler.updateWorkItem(patchDocument, taskItemId);
    return true;
}
exports.handleTaskOpenedPr = handleTaskOpenedPr;
// ------------------------------------------------------


// ------------------------------------------------------
async function handleMergedPr(workItemId) {
    let patchDocument = [
        {
            op: "add",
            path: "/fields/System.State",
            value: process.env.closedstate
        }
    ];

    await azureDevOpsHandler.updateWorkItem(patchDocument, workItemId);
    return true;
}
exports.handleMergedPr = handleMergedPr;

async function handleTaskMergedPr(taskItemId) {
    let patchDocument = [
        {
            op: "add",
            path: "/fields/System.State",
            value: process.env.closedtaskstate
        }
    ];

    await azureDevOpsHandler.updateWorkItem(patchDocument, taskItemId);
    return true;
}
exports.handleTaskMergedPr = handleTaskMergedPr;
// ------------------------------------------------------


// ------------------------------------------------------
async function handleClosedPr(workItemId) {
    let patchDocument = [
        {
            op: "add",
            path: "/fields/System.State",
            value: process.env.inprogressstate
        }
    ];

    await azureDevOpsHandler.updateWorkItem(patchDocument, workItemId);
    return true;
}
exports.handleClosedPr = handleClosedPr;

async function handleTaskClosedPr(taskItemId) {
    let patchDocument = [
        {
            op: "add",
            path: "/fields/System.State",
            value: process.env.inprogresstaskstate
        }
    ];

    await azureDevOpsHandler.updateWorkItem(patchDocument, taskItemId);
    return true;
}
exports.handleTaskClosedPr = handleTaskClosedPr;
// ------------------------------------------------------

async function isPrOpen(pullRequestNumber) {
    var pullRequestStatus = await getPrState(pullRequestNumber);
    return pullRequestStatus === "open";
}
exports.isPrOpen = isPrOpen;

async function isPrMerged(pullRequestNumber) {
    var mergeStatus = await getMergeState(pullRequestNumber);
    return mergeStatus === 204;
}
exports.isPrMerged = isPrMerged;

async function isPrClosed(pullRequestNumber) {
    var pullRequestStatus = await getPrState(pullRequestNumber);
    return pullRequestStatus === "closed";
}
exports.isPrClosed = isPrClosed;

// private functions

async function getPrState(pullRequestNumber) {
    if (pullRequestNumber == null) {
        pullRequestNumber = process.env.pull_number;
    }

    const requestUrl = "https://api.github.com/repos/"+process.env.ghrepo_owner+"/"+process.env.ghrepo+"/pulls/"+pullRequestNumber;
    var fetchResponse = await fetch (requestUrl, {
        method: 'GET',
        headers: staticFunctions.getRequestHeaders()
    });
    var jsonResponse = await fetchResponse.json();

    var pullRequestStatus = jsonResponse.state;
    return pullRequestStatus;
}

async function getMergeState(pullRequestNumber) {
    if (pullRequestNumber == null) {
        pullRequestNumber = process.env.pull_number;
    }

    const requestUrl = "https://api.github.com/repos/"+process.env.ghrepo_owner+"/"+process.env.ghrepo+"/pulls/"+pullRequestNumber+"/merge";
    var fetchResponse = await fetch (requestUrl, {
        method: 'GET',
        headers: staticFunctions.getRequestHeaders()
    });

    return fetchResponse.status;
}
