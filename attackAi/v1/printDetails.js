/** @param {NS} ns **/
/** @param {import(".").NS } ns */

import { helpers } from '/attackAI/v1/helpers/mainHelper.js';

export async function main(ns) {
    var filesInfo = await getInfo(ns);
    var targetServer = filesInfo.target;
    var maxMoney = await ns.getServerMaxMoney(targetServer);
    var moneyAvailable = await ns.getServerMoneyAvailable(targetServer);
    var minSecurity = await ns.getServerMinSecurityLevel(targetServer);
    var securityLevel = await ns.getServerSecurityLevel(targetServer);
    var securityThresh = await ns.getServerMinSecurityLevel(targetServer) + 5;
    var chanceToHack = await ns.hackAnalyzeChance(targetServer);
    var processes = await ns.ps('home')
    // Reporting Status
    ns.tprint(`--Status------------------`);
    ns.tprint(`Target : ${targetServer}`);
    ns.tprint(`MaxMoney : ${await helpers.convertMoney(maxMoney)}`);
    ns.tprint(`MoneyAvailable : ${await helpers.convertMoney(moneyAvailable)}`);
    ns.tprint(`MinSecurity : ${minSecurity}`);
    ns.tprint(`Security : ${securityLevel}`);
    ns.tprint(`SecurityThresh : ${securityThresh}`);
    ns.tprint(`ChanceToHack : ${chanceToHack}`);
    ns.tprint(`--Scripts--home--------`);
    for (let i = 0; i < processes.length; ++i) {
        ns.tprint(`[${processes[i].filename}] : ${processes[i].threads}`);
        if (processes[i].filename.startsWith('weaken')) {
            ns.tprint(`Time Taken : ${await helpers.convertTime(await ns.getWeakenTime(targetServer))}`)
        }
        else if (processes[i].filename.startsWith('grow')) {
            ns.tprint(`Time Taken : ${await helpers.convertTime(await ns.getGrowTime(targetServer))}`)
        }
        else if (processes[i].filename.startsWith('hack')) {
            ns.tprint(`Time Taken : ${await helpers.convertTime(await ns.getHackTime(targetServer))}`)
        }
    }
    ns.tprint('---------------------------');
}
async function getInfo(ns) {
    var readTarget = await ns.read('/attackAI/v1/sharedFiles/target.txt');
    var allTarget = readTarget.split(',') //for multiAttacks in future
    var target;
    if (allTarget.length == 1)
        target = allTarget[0];

    return {
        target: target
    }
}