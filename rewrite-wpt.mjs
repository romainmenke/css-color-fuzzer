import fs from 'fs';

import { isTokenFunction, isTokenNumeric, stringify, tokenize } from "@csstools/css-tokenizer";
import { color } from "@csstools/css-color-parser";
import { parseComponentValue } from "@csstools/css-parser-algorithms";

function nanToNone(component) {
	if (Number.isNaN(component)) {
		return `none`;
	}

	return component;
}

function reducePrecision(color) {
	const tokens = tokenize({ css: color.trim() });

	const functionName = tokens[0][4].value

	let counter = 0;
	for (let i = 0; i < tokens.length; i++) {
		const token = tokens[i];
		if (isTokenNumeric(token)) {
			counter++;

			let factor = Math.pow(10, 8);

			const y = Math.round(token[4].value * factor) / factor;

			token[1] = y.toString();
		}
	}

	return stringify(...tokens)
}

function csstoolsColor(declared) {
	const colorData = color(parseComponentValue(tokenize({ css: declared })));
	if (!colorData) {
		return false;
	}

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
			if (colorData.channels.some(Number.isNaN) || Number.isNaN(colorData.alpha)) {
				if (colorData.alpha !== 1) {
					return `color(srgb ${nanToNone(colorData.channels[0])} ${nanToNone(colorData.channels[1])} ${nanToNone(colorData.channels[2])} / ${nanToNone(colorData.alpha)})`;
				}

				return `color(srgb ${nanToNone(colorData.channels[0])} ${nanToNone(colorData.channels[1])} ${nanToNone(colorData.channels[2])})`;
			}

			if (colorData.syntaxFlags.has('relative-color-syntax') || colorData.syntaxFlags.has('color-mix')) {
				return csstoolsColor(`color(from ${declared} srgb r g b / alpha)`);
			}

			if (colorData.alpha !== 1) {
				return `rgba(${Math.round(nanToNone(colorData.channels[0] * 255))}, ${Math.round(nanToNone(colorData.channels[1] * 255))}, ${Math.round(nanToNone(colorData.channels[2] * 255))}, ${nanToNone(colorData.alpha)})`;
			}

			return `rgb(${Math.round(nanToNone(colorData.channels[0] * 255))}, ${Math.round(nanToNone(colorData.channels[1] * 255))}, ${Math.round(nanToNone(colorData.channels[2] * 255))})`;

		case 'hsl': {
			if (colorData.channels.some(Number.isNaN) || Number.isNaN(colorData.alpha)) {
				if (colorData.alpha !== 1) {
					return `hsl(${nanToNone(colorData.channels[0])} ${nanToNone(colorData.channels[1])} ${nanToNone(colorData.channels[2])} / ${nanToNone(colorData.alpha)})`;
				}

				return `hsl(${nanToNone(colorData.channels[0])} ${nanToNone(colorData.channels[1])} ${nanToNone(colorData.channels[2])})`;
			}

			if (colorData.syntaxFlags.has('relative-color-syntax') || colorData.syntaxFlags.has('color-mix')) {
				return csstoolsColor(`color(from ${declared} srgb r g b / alpha)`);
			}

			const rgbColorData = color(parseComponentValue(tokenize({ css: `rgb(from ${declared} r g b / alpha)` })));
			if (rgbColorData.alpha !== 1) {
				return `rgba(${Math.round(nanToNone(rgbColorData.channels[0] * 255))}, ${Math.round(nanToNone(rgbColorData.channels[1] * 255))}, ${Math.round(nanToNone(rgbColorData.channels[2] * 255))}, ${nanToNone(rgbColorData.alpha)})`;
			}

			return `rgb(${Math.round(nanToNone(rgbColorData.channels[0] * 255))}, ${Math.round(nanToNone(rgbColorData.channels[1] * 255))}, ${Math.round(nanToNone(rgbColorData.channels[2] * 255))})`;
		}
		case 'hwb': {
			if (colorData.channels.some(Number.isNaN) || Number.isNaN(colorData.alpha)) {
				if (colorData.alpha !== 1) {
					return `hwb(${nanToNone(colorData.channels[0])} ${nanToNone(colorData.channels[1])} ${nanToNone(colorData.channels[2])} / ${nanToNone(colorData.alpha)})`;
				}

				return `hwb(${nanToNone(colorData.channels[0])} ${nanToNone(colorData.channels[1])} ${nanToNone(colorData.channels[2])})`;
			}

			if (colorData.syntaxFlags.has('relative-color-syntax') || colorData.syntaxFlags.has('color-mix')) {
				return csstoolsColor(`color(from ${declared} srgb r g b / alpha)`);
			}

			const rgbColorData = color(parseComponentValue(tokenize({ css: `rgb(from ${declared} r g b / alpha)` })));
			if (rgbColorData.alpha !== 1) {
				return `rgba(${Math.round(nanToNone(rgbColorData.channels[0] * 255))}, ${Math.round(nanToNone(rgbColorData.channels[1] * 255))}, ${Math.round(nanToNone(rgbColorData.channels[2] * 255))}, ${nanToNone(rgbColorData.alpha)})`;
			}

			return `rgb(${Math.round(nanToNone(rgbColorData.channels[0] * 255))}, ${Math.round(nanToNone(rgbColorData.channels[1] * 255))}, ${Math.round(nanToNone(rgbColorData.channels[2] * 255))})`;
		}
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

	console.error(declared);
	console.error(colorData);
	
	throw new Error('unsupported color');
}

const input = fs.readFileSync(0, 'utf-8');

let output = input;

const fuzzy_test_computed_color_backtick = /fuzzy_test_computed_color\(`([^`]*)`, `([^`]*)`/g

output = output.replaceAll(fuzzy_test_computed_color_backtick, (a, b, c) => {
	const result = csstoolsColor(b);
	if (!result) {
		return a;
	}

	return `fuzzy_test_computed_color(\`${b}\`, \`${reducePrecision(result)}\``;
});

const test_computed_value_double_quote = /test_computed_value\("([^"]*)", "([^"]*)", "([^"]*)"/g

output = output.replaceAll(test_computed_value_double_quote, (a, b, c) => {
	const result = csstoolsColor(c);
	if (!result) {
		return a;
	}

	return `test_computed_value("${b}", "${c}", "${reducePrecision(result)}"`;
});

const array_notation_computed_args_double_quote = /\["([^"]*)", "([^"]*)"/g

output = output.replaceAll(array_notation_computed_args_double_quote, (a, b, c) => {
	const result = csstoolsColor(b);
	if (!result) {
		return a;
	}

	return `["${b}", "${reducePrecision(result)}"`;
});

process.stdout.write(output);

