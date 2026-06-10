import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { chromium, firefox, webkit } from "playwright";
import { createServer } from "./util/create-server.mjs";
import { isTokenNumeric, stringify, tokenize } from "@csstools/css-tokenizer";
import { color } from "@csstools/css-color-parser";
import { parseComponentValue } from "@csstools/css-parser-algorithms";

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
	const tokens = tokenize({ css: color.trim() });

	const functionName = tokens[0][4].value

	let counter = 0;
	for (let i = 0; i < tokens.length; i++) {
		const token = tokens[i];
		if (isTokenNumeric(token)) {
			counter++;
			
			let factor = Math.pow(10, 3);

			switch (functionName) {
				case 'rgb':
				case 'rgba':
					factor = Math.pow(10, 0);
					break;
				case 'lab':
				case 'lch':
					factor = Math.pow(10, 3);
					break;
				case 'oklab':
				case 'oklch':
					factor = Math.pow(10, 3);
					break;
				case 'color':
					factor = Math.pow(10, 4);
					break;
			
				default:
					break;
			}

			if (counter === 4) {
				factor = Math.pow(10, 2);
			}

			const y = Math.round(token[4].value * factor) / factor;

			token[1] = y.toString();
		}
	}

	return stringify(...tokens)
}

function nanToNone(component) {
	if (Number.isNaN(component)) {
		return `none`;
	}

	return component;
}

function csstoolsColor(declared) {
	const colorData = color(parseComponentValue(tokenize({ css: declared })));

	switch (colorData.colorNotation) {
		case 'lab':
			if (colorData.alpha !== 1) {
				return `lab(${nanToNone(colorData.channels[0])} ${nanToNone(colorData.channels[1])} ${nanToNone(colorData.channels[2])} / ${nanToNone(colorData.alpha)})`;
			}
			
			return `lab(${nanToNone(colorData.channels[0])} ${nanToNone(colorData.channels[1])} ${nanToNone(colorData.channels[2])})`;
		case 'lch':
			if (colorData.alpha !== 1) {
				return `lch(${nanToNone(colorData.channels[0])} ${nanToNone(colorData.channels[1])} ${nanToNone(colorData.channels[2])} / ${nanToNone(colorData.alpha)})`;
			}

			return `lch(${nanToNone(colorData.channels[0])} ${nanToNone(colorData.channels[1])} ${nanToNone(colorData.channels[2])})`;
		
		case 'oklab':
			if (colorData.alpha !== 1) {
				return `oklab(${nanToNone(colorData.channels[0])} ${nanToNone(colorData.channels[1])} ${nanToNone(colorData.channels[2])} / ${nanToNone(colorData.alpha)})`;
			}

			return `oklab(${nanToNone(colorData.channels[0])} ${nanToNone(colorData.channels[1])} ${nanToNone(colorData.channels[2])})`;
		case 'oklch':
			if (colorData.alpha !== 1) {
				return `oklch(${nanToNone(colorData.channels[0])} ${nanToNone(colorData.channels[1])} ${nanToNone(colorData.channels[2])} / ${nanToNone(colorData.alpha)})`;
			}

			return `oklch(${nanToNone(colorData.channels[0])} ${nanToNone(colorData.channels[1])} ${nanToNone(colorData.channels[2])})`;
		
		case 'rgb':
			if (colorData.syntaxFlags.has('relative-color-syntax')) {
				return csstoolsColor(`color(from ${declared} srgb r g b / alpha)`);
			}
			
			if (colorData.alpha !== 1) {
				return `rgb(${nanToNone(colorData.channels[0] * 255)} ${nanToNone(colorData.channels[1] * 255)} ${nanToNone(colorData.channels[2] * 255)} / ${nanToNone(colorData.alpha)})`;
			}

			return `rgb(${nanToNone(colorData.channels[0] * 255)} ${nanToNone(colorData.channels[1] * 255)} ${nanToNone(colorData.channels[2] * 255)})`;
		
		case 'hsl':
			if (colorData.channels.some(Number.isNaN) || Number.isNaN(colorData.alpha)) {
				if (colorData.alpha !== 1) {
					return `hsl(${nanToNone(colorData.channels[0])} ${nanToNone(colorData.channels[1])} ${nanToNone(colorData.channels[2])} / ${nanToNone(colorData.alpha)})`;
				}

				return `hsl(${nanToNone(colorData.channels[0])} ${nanToNone(colorData.channels[1])} ${nanToNone(colorData.channels[2])})`;
			}

			return csstoolsColor(`color(from ${declared} srgb r g b / alpha)`);
		
		case 'hwb':
			if (colorData.channels.some(Number.isNaN) || Number.isNaN(colorData.alpha)) {
				if (colorData.alpha !== 1) {
					return `hwb(${nanToNone(colorData.channels[0])} ${nanToNone(colorData.channels[1])} ${nanToNone(colorData.channels[2])} / ${nanToNone(colorData.alpha)})`;
				}

				return `hwb(${nanToNone(colorData.channels[0])} ${nanToNone(colorData.channels[1])} ${nanToNone(colorData.channels[2])})`;
			}

			return csstoolsColor(`color(from ${declared} srgb r g b / alpha)`);
		
		case 'srgb':
			if (colorData.alpha !== 1) {
				return `color(srgb ${nanToNone(colorData.channels[0])} ${nanToNone(colorData.channels[1])} ${nanToNone(colorData.channels[2])} / ${nanToNone(colorData.alpha)})`;
			}

			return `color(srgb ${nanToNone(colorData.channels[0])} ${nanToNone(colorData.channels[1])} ${nanToNone(colorData.channels[2])})`;
		
		case 'srgb-linear':
			if (colorData.alpha !== 1) {
				return `color(srgb-linear ${nanToNone(colorData.channels[0])} ${nanToNone(colorData.channels[1])} ${nanToNone(colorData.channels[2])} / ${nanToNone(colorData.alpha)})`;
			}

			return `color(srgb-linear ${nanToNone(colorData.channels[0])} ${nanToNone(colorData.channels[1])} ${nanToNone(colorData.channels[2])})`;
		
		case 'display-p3':
			if (colorData.alpha !== 1) {
				return `color(display-p3 ${nanToNone(colorData.channels[0])} ${nanToNone(colorData.channels[1])} ${nanToNone(colorData.channels[2])} / ${nanToNone(colorData.alpha)})`;
			}

			return `color(display-p3 ${nanToNone(colorData.channels[0])} ${nanToNone(colorData.channels[1])} ${nanToNone(colorData.channels[2])})`;
		
		case 'display-p3-linear':
			if (colorData.alpha !== 1) {
				return `color(display-p3-linear ${nanToNone(colorData.channels[0])} ${nanToNone(colorData.channels[1])} ${nanToNone(colorData.channels[2])} / ${nanToNone(colorData.alpha)})`;
			}

			return `color(display-p3-linear ${nanToNone(colorData.channels[0])} ${nanToNone(colorData.channels[1])} ${nanToNone(colorData.channels[2])})`;

		case 'a98-rgb':
			if (colorData.alpha !== 1) {
				return `color(a98-rgb ${nanToNone(colorData.channels[0])} ${nanToNone(colorData.channels[1])} ${nanToNone(colorData.channels[2])} / ${nanToNone(colorData.alpha)})`;
			}

			return `color(a98-rgb ${nanToNone(colorData.channels[0])} ${nanToNone(colorData.channels[1])} ${nanToNone(colorData.channels[2])})`;

		case 'prophoto-rgb':
			if (colorData.alpha !== 1) {
				return `color(prophoto-rgb ${nanToNone(colorData.channels[0])} ${nanToNone(colorData.channels[1])} ${nanToNone(colorData.channels[2])} / ${nanToNone(colorData.alpha)})`;
			}

			return `color(prophoto-rgb ${nanToNone(colorData.channels[0])} ${nanToNone(colorData.channels[1])} ${nanToNone(colorData.channels[2])})`;

		case 'rec2020':
			if (colorData.alpha !== 1) {
				return `color(rec2020 ${nanToNone(colorData.channels[0])} ${nanToNone(colorData.channels[1])} ${nanToNone(colorData.channels[2])} / ${nanToNone(colorData.alpha)})`;
			}

			return `color(rec2020 ${nanToNone(colorData.channels[0])} ${nanToNone(colorData.channels[1])} ${nanToNone(colorData.channels[2])})`;

		case 'xyz':
			if (colorData.alpha !== 1) {
				return `color(xyz ${nanToNone(colorData.channels[0])} ${nanToNone(colorData.channels[1])} ${nanToNone(colorData.channels[2])} / ${nanToNone(colorData.alpha)})`;
			}

			return `color(xyz ${nanToNone(colorData.channels[0])} ${nanToNone(colorData.channels[1])} ${nanToNone(colorData.channels[2])})`;
		
		case 'xyz-d50':
			if (colorData.alpha !== 1) {
				return `color(xyz-d50 ${nanToNone(colorData.channels[0])} ${nanToNone(colorData.channels[1])} ${nanToNone(colorData.channels[2])} / ${nanToNone(colorData.alpha)})`;
			}

			return `color(xyz-d50 ${nanToNone(colorData.channels[0])} ${nanToNone(colorData.channels[1])} ${nanToNone(colorData.channels[2])})`;
		
		case 'xyz-d65':
			if (colorData.alpha !== 1) {
				return `color(xyz-d65 ${nanToNone(colorData.channels[0])} ${nanToNone(colorData.channels[1])} ${nanToNone(colorData.channels[2])} / ${nanToNone(colorData.alpha)})`;
			}

			return `color(xyz-d65 ${nanToNone(colorData.channels[0])} ${nanToNone(colorData.channels[1])} ${nanToNone(colorData.channels[2])})`;

		
		default:
			break;
	}
	
	console.log(declared);
	console.log(colorData);
	
	throw new Error('unsupported color');
}

for (let i = 0; i < results.chromium.length; i++) {
	const chromiumResult = results.chromium[i];
	const firefoxResult = results.firefox[i];
	const webkitResult = results.webkit[i];
	const csstoolsResult = csstoolsColor(webkitResult.declared);

	if (reducePrecision(webkitResult.computed) !== reducePrecision(chromiumResult.computed) || reducePrecision(webkitResult.computed) !== reducePrecision(firefoxResult.computed)) {
		console.log('--------------');
		console.log(`declared: ${webkitResult.declared}`);
		console.log(`computed - chromium : ${chromiumResult.computed}`);
		console.log(`computed - firefox  : ${firefoxResult.computed}`);
		console.log(`computed - webkit   : ${webkitResult.computed}`);
		console.log(`computed - csstools : ${reducePrecision(csstoolsColor(webkitResult.declared))}`);
	}
}

await fs.writeFile(`./results/result-${crypto.randomUUID()}.json`, JSON.stringify(results, null, '\t'), 'utf-8');
