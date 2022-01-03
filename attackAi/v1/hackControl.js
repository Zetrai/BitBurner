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
			sleepTime = targetInfo.weakenTime;

			if (reqHackLevel >= playerHackLevel || server == 'darkweb') {
				ns.print('Required hack level Higher than Player!!!')
			}
			else if (targetInfo.targetMoneyAvailable <= (targetInfo.targetMaxMoney * 0.50) ||
				(targetInfo.targetSecurity > targetInfo.minSecurity &&
					targetInfo.chanceToHack < 0.70)) {
				if (await ns.scriptRunning('hack.ns', server))
					await ns.scriptKill('hack.ns', server);

				if (weakenThreads == 0 || growThreads == 0 || hackThreads == 0) {
					var threads = Math.floor(maxRam * 1 / growRam);
					if ((maxRam - await ns.getServerUsedRam(server)) >= threads * growRam &&
						maxRam != 0 && !await ns.scriptRunning('grow.ns', server))
						ns.exec('grow.ns', server, threads, target);
					sleepTime = targetInfo.growTime;
				}
				else if (targetInfo.chanceToHack < 0.60) {
					// ns.tprint(targetInfo.chanceToHack)
					if (await ns.scriptRunning('growH.ns', server))
						await ns.scriptKill('growH.ns', server);
					if (!await ns.scriptRunning('weakenH.ns', server))
						ns.exec('weakenH.ns', server, weakenThreads, target);
					sleepTime = targetInfo.weakenTime;
				}
				else if (targetInfo.targetMoneyAvailable <= (targetInfo.targetMaxMoney * 0.50)) {
					if (await ns.scriptRunning('weakenH.ns', server))
						await ns.scriptKill('weakenH.ns', server);
					if (!await ns.scriptRunning('growH.ns', server))
						ns.exec('growH.ns', server, growThreads, target);
					sleepTime = targetInfo.growTime;
				}
			}
			else {
				if (await ns.scriptRunning('growH.ns', server))
					await ns.scriptKill('growH.ns', server);
				if (await ns.scriptRunning('weakenH.ns', server))
					await ns.scriptKill('weakenH.ns', server);
				if (weakenThreads == 0 || growThreads == 0 || hackThreads == 0) {
					var threads = Math.floor(maxRam * 1 / hackRam);
					if ((maxRam - await ns.getServerUsedRam(server)) >= threads * hackRam &&
						maxRam != 0 && !await ns.scriptRunning('hack.ns', server))
						ns.exec('hack.ns', server, threads, target);
					sleepTime = targetInfo.hackTime;
				}
				else {
					if (!await ns.scriptRunning('hack.ns', server))
						ns.exec('hack.ns', server, hackThreads, target);
					sleepTime = targetInfo.hackTime;
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