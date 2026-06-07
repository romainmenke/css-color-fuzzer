import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { chromium, firefox, webkit } from "playwright";
import { createServer } from "./util/create-server.mjs";
import { isTokenNumeric, stringify, tokenize } from "@csstools/css-tokenizer";

const results = {
	chromium: [],
	firefox: [],
	webkit: []
};

const server = createServer(
	(e) => {
		throw e;
	}
);
server.listen(8080);

const [chromiumInstance, firefoxInstance, webkitInstance] = await Promise.all([
	chromium.launch(),
	firefox.launch(),
	webkit.launch(),
]);

const browserNames = ["chromium", "firefox", "webkit"]

for (const browserName of browserNames) {
	let browser = chromiumInstance
	switch (browserName) {
		case "chromium":
			browser = chromiumInstance
			break;
		case "firefox":
			browser = firefoxInstance
			break;
		case "webkit":
			browser = webkitInstance
			break;
	}

	const context = await (('newContext' in browser) ? browser.newContext() : browser);

	const page = await context.newPage();

	if ('setCacheEnabled' in page) {
		await page.setCacheEnabled(false);
	}

	page.on('pageerror', (msg) => {
		throw new Error(msg);
		
	});

	{
		await page.goto(`http://localhost:8080`);
		await page.waitForLoadState('domcontentloaded');
		const result = await page.evaluate(async () => {
			const swatches = Array.from(document.querySelectorAll('.swatch'));
			return swatches.map((swatch) => {
				return {
					declared: window.getComputedStyle(swatch).content.slice(6, -1),
					computed: window.getComputedStyle(swatch).backgroundColor,
				};
			});
		});

		results[browserName] = result;
	}

	await page.close();
}

await server.closeAllConnections();
await server.close();

await Promise.all([
	firefoxInstance.close(),
	chromiumInstance.close(),
	webkitInstance.close(),
]);

function reducePrecision(color) {
	const tokens = tokenize({ css: color });

	for (let i = 0; i < tokens.length; i++) {
		const token = tokens[i];
		if (isTokenNumeric(token)) {
			const factor = Math.pow(10, 3);
			const y = Math.round(token[4].value * factor) / factor;

			token[1] = y.toString();
		}
	}

	return stringify(...tokens)
}

for (let i = 0; i < results.chromium.length; i++) {
	const chromiumResult = results.chromium[i];
	const firefoxResult = results.firefox[i];
	const webkitResult = results.webkit[i];

	if (reducePrecision(webkitResult.computed) !== reducePrecision(chromiumResult.computed) || reducePrecision(webkitResult.computed) !== reducePrecision(firefoxResult.computed)) {
		console.log('--------------');
		console.log(`declared: ${webkitResult.declared}`);
		console.log(`computed - chromium: ${chromiumResult.computed}`);
		console.log(`computed - firefox : ${firefoxResult.computed}`);
		console.log(`computed - webkit  : ${webkitResult.computed}`);
	}
}

await fs.writeFile(`./results/result-${crypto.randomUUID()}.json`, JSON.stringify(results, null, '\t'), 'utf-8');
