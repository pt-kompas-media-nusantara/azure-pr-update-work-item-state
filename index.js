const core = require("@actions/core");
const github = require("@actions/github");
const fetch = require("node-fetch");

const prHandler = require("./handlers/prHandler");
const branchHandler = require("./handlers/branchHandler");
const staticFunctions = require("./staticFunctions");
const version = "2.0.5";
global.Headers = fetch.Headers;

main();
async function main(){
    try {
        console.log("VERSION " + version);

        staticFunctions.getValuesFromPayload(github.context.payload);

        // HANDLING PULL REQUESTS
        if (process.env.GITHUB_EVENT_NAME.includes("pull_request")){
            console.log ("PR event detected");

            var [prName, prBody] = await prHandler.getPrInfo();

            console.log("prName : " + prName);
            console.log("prBody : " + prBody);

            if (prName === undefined) {
                console.log("Couldn't read PR name properly, ending checks");
                return;
            }

            if (prName.toLowerCase().includes("Code cleanup".toLowerCase()) ||
                prName.toLowerCase().includes("Swagger update".toLowerCase()) ||
                prName.toLowerCase().includes("Master to Dev".toLowerCase()) ||
                prName.toLowerCase().includes("Dev to Master".toLowerCase())) {
                    console.log ("No checkups for the code cleanup or swagger update branches or master to dev sync");
                    return;
            }

            var workItemIds = prHandler.getWorkItemIdFromPrBody(prBody);
            var taskItemIds = prHandler.getTaskItemIdFromPrBody(prBody);

            try {
                // hanya untuk testing agar cepat
                // if ((await prHandler.isPrOpen()) === true) {
                //     if (workItemIds && workItemIds.length > 0) {
                //         for (const workItemId of workItemIds) {
                //             try {
                //                 console.log("PR was opened, so moving AB#"+workItemId+" to "+process.env.closedstate+" state");
                //                 await prHandler.handleMergedPr(workItemId);
                //             } catch (err) {
                //                 console.log(`Couldn't update the work item with AB# ${workItemId}`);
                //                 core.setFailed(err.toString());
                //             }
                //         }
                //     }
                //     if (taskItemIds && taskItemIds.length > 0) {
                //         for (const taskItemId of taskItemIds) {
                //             try {
                //                 console.log("PR was opened, so moving TASK#"+taskItemId+" to "+process.env.closedtaskstate+" state");
                //                 await prHandler.handleTaskMergedPr(taskItemId);
                //             } catch (err) {
                //                 console.log(`Couldn't update the work item with TASK# ${taskItemId}`);
                //                 core.setFailed(err.toString());
                //             }
                //         }
                //     }
                // }
                // else 
                if ((await prHandler.isPrOpen()) === true) {
                    if (workItemIds && workItemIds.length > 0) {
                        for (const workItemId of workItemIds) {
                            try {
                                console.log("PR was opened, so moving AB#"+workItemId+" to "+process.env.propenstate+" state");
                                await prHandler.handleOpenedPr(workItemId);
                            } catch (err) {
                                console.log(`Couldn't update the work item with AB# ${workItemId}`);
                                core.setFailed(err.toString());
                            }
                        }
                    }
                    if (taskItemIds && taskItemIds.length > 0) {
                        for (const taskItemId of taskItemIds) {
                            try {
                                console.log("PR was opened, so moving TASK#"+taskItemId+" to "+process.env.propentaskstate+" state");
                                await prHandler.handleTaskOpenedPr(taskItemId);
                            } catch (err) {
                                console.log(`Couldn't update the work item with TASK# ${taskItemId}`);
                                core.setFailed(err.toString());
                            }
                        }
                    }
                }
                else if ((await prHandler.isPrMerged()) === true) {
                    if (workItemIds && workItemIds.length > 0) {
                        for (const workItemId of workItemIds) {
                            try {
                                console.log("PR was merged, so moving AB#"+workItemId+" to "+process.env.closedstate+" state");
                                await prHandler.handleMergedPr(workItemId);
                            } catch (err) {
                                console.log(`Couldn't update the work item with AB# ${workItemId}`);
                                core.setFailed(err.toString());
                            }
                        }
                    }
                    if (taskItemIds && taskItemIds.length > 0) {
                        for (const taskItemId of taskItemIds) {
                            try {
                                console.log("PR was merged, so moving TASK#"+taskItemId+" to "+process.env.closedtaskstate+" state");
                                await prHandler.handleTaskMergedPr(taskItemId);
                            } catch (err) {
                                console.log(`Couldn't update the work item with TASK# ${taskItemId}`);
                                core.setFailed(err.toString());
                            }
                        }
                    }                    
                }
                else if ((await prHandler.isPrClosed()) === true) {
                    if (workItemIds && workItemIds.length > 0) {
                        for (const workItemId of workItemIds) {
                            try {
                                console.log("PR was closed without merging, so moving AB#"+workItemId+" to "+process.env.inprogressstate+ " state");
                                await prHandler.handleClosedPr(workItemId);
                            } catch (err) {
                                console.log(`Couldn't update the work item with AB# ${workItemId}`);
                                core.setFailed(err.toString());
                            }
                        }
                    }
                    if (taskItemIds && taskItemIds.length > 0) {
                        for (const taskItemId of taskItemIds) {
                            try {
                                console.log("PR was closed without merging, so moving TASK#"+taskItemId+" to "+process.env.inprogresstaskstate+ " state");
                                await prHandler.handleTaskClosedPr(taskItemId);
                            } catch (err) {
                                console.log(`Couldn't update the work item with TASK# ${taskItemId}`);
                                core.setFailed(err.toString());
                            }
                        }
                    }
                }
            } catch (err) {
                console.log("Couldn't update the work item");
                core.setFailed(err.toString());
            }
        }
        // HANDLING BRANCHES
        else 
        {
            console.log ("Branch event detected");

            var branchName = branchHandler.getBranchTitle();

            console.log ("Branch name: " + branchName);
            
            if (branchName.toLowerCase().includes("code-cleanup".toLowerCase()) ||
                branchName.toLowerCase().includes("code cleanup".toLowerCase()) ||
                branchName.toLowerCase().includes("swagger-update".toLowerCase()) ||
                branchName.toLowerCase().includes("swagger update".toLowerCase()) ||
                (branchName.toLowerCase().includes("feature".toLowerCase()) === false && branchName.toLowerCase().includes("master".toLowerCase())) ||
                (branchName.toLowerCase().includes("feature".toLowerCase()) === false && branchName.toLowerCase().includes("dev".toLowerCase()))) {
                console.log ("No checkups for the code cleanup or swagger update or master/dev branches");
                return;
            }

            var workItemId = branchHandler.getWorkItemIdFromPrBody(branchName);
            var taskItemId = branchHandler.getTaskItemIdFromPrBody(branchName);
            
            try {
                var updated = await branchHandler.handleOpenedBranch(workItemId);
                var taskUpdate = await branchHandler.handleOpenedBranch(taskItemId);
                if (updated !== true) {
                    console.log("Couldn't update the work item");
                }
                if (taskUpdate !== true) {
                    console.log("Couldn't taskUpdate the work item");
                }
            } catch (err) {
                console.log("Couldn't update the work item");
                core.setFailed(err.toString());
            }
        }

    } catch (err) {
        core.setFailed(err.toString());
    }
}