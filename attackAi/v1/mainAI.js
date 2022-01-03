/** @param {NS} ns **/
/** @param {import(".").NS } ns */


import { helpers } from '/attackAI/v1/helpers/mainHelper.js';
export async function main(ns) {
	ns.disableLog('ALL')
	ns.enableLog('print')
	ns.tail();
	var loop = true, printToggle = false, earnedMoney = 0;
	var playerMoney = await ns.getServerMoneyAvailable('home');
	earnedMoney = 0;
	await ns.scriptKill('/attackAI/v1/weakenControl.js', 'home')
	await ns.scriptKill('/attackAI/v1/growControl.js', 'home')
	await ns.scriptKill('/attackAI/v1/hackControl.js', 'home')
	ns.exec('/attackAI/v1/weakenControl.js', 'home');
	ns.exec('/attackAI/v1/growControl.js', 'home');
	ns.exec('/attackAI/v1/hackControl.js', 'home');
	do {
		// Purchasing Personal Servers If Possible
		await helpers.puchaseServers(ns);

		// Storing Servers Details
		var serverInfo = await helpers.scanAllServers(ns);
		var targetServer = await helpers.getOptimalTarget(ns, serverInfo.hackableServers);
		serverInfo.hackableServers.push('home')
		var hackableServers = JSON.stringify(serverInfo.hackableServers);


		// Writing Data Into File
		await ns.write('/attackAI/v1/sharedFiles/target.txt', targetServer, 'w');
		await ns.write('/attackAI/v1/sharedFiles/hackableServers.txt', hackableServers, 'w');

		var tempMoney = playerMoney;

		var reqHackLevel = await ns.getServerRequiredHackingLevel(targetServer);
		playerMoney = await ns.getServerMoneyAvailable('home');
		var maxMoney = await ns.getServerMaxMoney(targetServer);
		var moneyAvailable = await ns.getServerMoneyAvailable(targetServer);
		var minSecurity = await ns.getServerMinSecurityLevel(targetServer);
		var securityLevel = await ns.getServerSecurityLevel(targetServer);
		var securityThresh = await ns.getServerMinSecurityLevel(targetServer) + 5;
		var chanceToHack = await ns.hackAnalyzeChance(targetServer);
		var processes = await ns.ps('home')
		if (playerMoney >= tempMoney)
			earnedMoney = playerMoney - tempMoney;
		else {
			earnedMoney = 0;
		}

		if (securityLevel <= securityThresh && moneyAvailable >= maxMoney * 0.50) {
			if (!ns.scriptRunning('hack.ns', 'home')) {
				await ns.scriptKill('/attackAI/v1/hackControl.js', 'home')
				ns.exec('/attackAI/v1/hackControl.js', 'home');
			}
		}
		if (securityLevel > securityThresh) {
			if (!ns.scriptRunning('weakenG.ns', 'home')) {
				await ns.scriptKill('/attackAI/v1/growControl.js', 'home');
				ns.exec('/attackAI/v1/growControl.js', 'home');
			}
			if (!ns.scriptRunning('weakenH.ns', 'home')) {
				await ns.scriptKill('/attackAI/v1/hackControl.js', 'home');
				ns.exec('/attackAI/v1/hackControl.js', 'home');
			}
			if (!ns.scriptRunning('weaken.ns', 'home')) {
				await ns.scriptKill('/attackAI/v1/weakenControl.js', 'home')
				ns.exec('/attackAI/v1/weakenControl.js', 'home');
			}
		}
		var printType = 'print'
		if (printToggle) {
			printType = 'tprint'
		}
		// Reporting Status
		ns[printType](`--------------------------`);
		ns[printType](`Target : ${targetServer}`);
		ns[printType](`Required Hack Level : ${reqHackLevel}`);
		ns[printType](`Earned Money : ${earnedMoney}`);
		ns[printType](`MaxMoney : ${await helpers.convertMoney(maxMoney)}`);
		ns[printType](`MoneyAvailable : ${await helpers.convertMoney(moneyAvailable)}`);
		ns[printType](`MinSecurity : ${minSecurity}`);
		ns[printType](`Security : ${securityLevel}`);
		ns[printType](`SecurityThresh : ${securityThresh}`);
		ns[printType](`ChanceToHack : ${chanceToHack}`);
		ns[printType](`--Scripts--home--------`);
		for (let i = 0; i < processes.length; ++i) {
			ns[printType](`[${processes[i].filename}] : ${processes[i].threads}`);
			if (processes[i].filename.startsWith('weaken')) {
				ns[printType](`Time Taken : ${await helpers.convertTime(await ns.getWeakenTime(targetServer))}`)
			}
			else if (processes[i].filename.startsWith('grow')) {
				ns[printType](`Time Taken : ${await helpers.convertTime(await ns.getGrowTime(targetServer))}`)
			}
			else if (processes[i].filename.startsWith('hack')) {
				ns[printType](`Time Taken : ${await helpers.convertTime(await ns.getHackTime(targetServer))}`)
			}
		}
		ns[printType]('---------------------------');
		await ns.sleep(1 * 60 * 1000);
	} while (loop);
}