/** @param {NS} ns **/
/** @param {import(".").NS } ns */

export async function main(ns) {
	var loop = true; //toggle for loop
	var sleepTime;
	do {
		var filesInfo = await getInfo(ns);
		var target = filesInfo.target;
		var hackableServers = filesInfo.hackableServers;
		var targetInfo = {
			'name': target,
			'targetMaxMoney': await ns.getServerMaxMoney(target),
			'targetMoneyAvailable': await ns.getServerMoneyAvailable(target),
			'moneyThresh': await ns.getServerMaxMoney(target) * 0.90,
			'chanceToHack': await ns.hackAnalyzeChance(target),
			'minSecurity': await ns.getServerMinSecurityLevel(target),
			'targetSecurity': await ns.getServerSecurityLevel(target),
			'securityThresh': await ns.getServerMinSecurityLevel(target) + 5,
			'growTime': ns.getGrowTime(target),
			'weakenTime': ns.getWeakenTime(target),
			'hackTime': ns.getHackTime(target),
		}

		// ns.tprint(target);
		// ns.tprint(hackableServers);

		// Executing Scripts in all the hackable Servers except HOME
		for (var server of hackableServers) {
			var weakenRam = await ns.getScriptRam('weaken.ns');
			var growRam = await ns.getScriptRam('grow.ns');
			var hackRam = await ns.getScriptRam('hack.ns');
			var maxRam = await ns.getServerMaxRam(server);
			var maxRam = server == 'home' ? maxRam - 100 : maxRam;
			var weakenThreads = Math.floor(maxRam * 0.33 / weakenRam);
			var growThreads = Math.floor(maxRam * 0.33 / growRam);
			var hackThreads = Math.floor(maxRam * 0.33 / hackRam);
			var reqHackLevel = await ns.getServerRequiredHackingLevel(server);
			var playerHackLevel = await ns.getHackingLevel();

			// ns.tprint(`${server} : ${maxRam}`)
			// ns.tprint(weakenThreads)
			sleepTime = targetInfo.weakenTime;

			if (reqHackLevel > playerHackLevel || server == 'darkweb') {
				ns.print('Required hack level Higher than Player!!!')
			}
			else if (targetInfo.chanceToHack >= 0.70 || targetInfo.targetSecurity <= targetInfo.securityThresh) {
				if (await ns.scriptRunning('weaken.ns', server))
					await ns.scriptKill('weaken.ns', server);
				if (weakenThreads == 0 || growThreads == 0 || hackThreads == 0) {
					var threads = Math.floor(maxRam * 1 / growRam);
					if (await ns.scriptRunning('growW.ns', server))
						await ns.scriptKill('growW.ns', server);
					if ((maxRam - await ns.getServerUsedRam(server)) >= threads * growRam &&
						maxRam != 0 && !await ns.scriptRunning('growW.ns', server))
						ns.exec('growW.ns', server, threads, target);
					sleepTime = targetInfo.growTime;
				}
				else if (targetInfo.targetMoneyAvailable < targetInfo.moneyThresh || targetInfo.targetMoneyAvailable < targetInfo.targetMaxMoney * 0.75) {
					if (await ns.scriptRunning('hackW.ns', server))
						await ns.scriptKill('hackW.ns', server);
					if (!await ns.scriptRunning('growW.ns', server))
						ns.exec('growW.ns', server, growThreads, target);
					sleepTime = targetInfo.growTime;
				}
				else {
					if (await ns.scriptRunning('growW.ns', server))
						await ns.scriptKill('growW.ns', server);
					if (await ns.scriptRunning('hackW.ns', server))
						await ns.scriptKill('hackW.ns', server);
					if (!await ns.scriptRunning('weaken.ns', server))
						ns.exec('weaken.ns', server, weakenThreads, target);
					sleepTime = targetInfo.weakenTime;
				}
			}
			else {
				if (await ns.scriptRunning('growW.ns', server))
					await ns.scriptKill('growW.ns', server);
				if (await ns.scriptRunning('hackW.ns', server))
					await ns.scriptKill('hackW.ns', server);
				if (weakenThreads == 0 || growThreads == 0 || hackThreads == 0) {
					var threads = Math.floor(maxRam * 1 / weakenRam);
					if ((maxRam - await ns.getServerUsedRam(server)) >= threads * weakenRam &&
						maxRam != 0 && !await ns.scriptRunning('weaken.ns', server))
						ns.exec('weaken.ns', server, threads, target);
					sleepTime = targetInfo.weaken;
				}
				else {
					if (!await ns.scriptRunning('weaken.ns', server))
						ns.exec('weaken.ns', server, weakenThreads, target);
					sleepTime = targetInfo.weakenTime;
				}
			}
		}
		// ns.tprint(targetInfo);
		await ns.sleep(sleepTime + 1000);
	} while (loop);
}

async function getInfo(ns) {
	var readTarget = await ns.read('/attackAI/v1/sharedFiles/target.txt');
	var allTarget = readTarget.split(',') //for multiAttacks in future
	var target;
	if (allTarget.length == 1)
		target = allTarget[0];

	var readHackableServers = JSON.parse(await ns.read('/attackAI/v1/sharedFiles/hackableServers'));
	// var hackableServers = readHackableServers.split(',');

	return {
		target: target,
		hackableServers: readHackableServers
	}
}