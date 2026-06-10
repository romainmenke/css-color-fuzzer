export function randomCalc(unit = '', globals = [], min = 0, max = 1, depth = 0) {
	if (randomIndex(5) === 0 && depth < 3) {
		return calc(unit, globals, min, max, depth);
	} else {
		if (unit) {
			return dimension(unit, globals, min, max);
		} else {
			return number(globals, min, max);
		}
	}
}

function calc(unit = '', globals = [], min = 0, max = 1, depth = 0) {
	const ops = [
		'addition',
		'division',
		'multiplication',
		'subtraction',
		'unary',

		// TODO
		// 'acos',
		// 'asin',
		// 'atan',
		// 'atan2',
		'clamp',
		'cos',
		'exp',
		'hypot',
		// 'log',
		'max',
		'min',
		// 'mod',
		// 'pow',
		// 'random',
		// 'rem',
		// 'round',
		// 'sign',
		'sin',
		// 'sqrt',
		// 'tan',
	]

	if (unit === '') {
		ops.push('abs')
	}

	const op = ops[randomIndex(ops.length)];
	
	switch (op) {
		case 'addition':
			if (unit) {
				globals = [];
			}
			
			return `calc(${randomCalc(unit, globals, min / 3 * 2, max / 3 * 2, depth + 1)} + ${randomCalc(unit, globals, min / 3 * 2, max / 3 * 2, depth + 1)})`;
		case 'subtraction':
			if (unit) {
				globals = [];
			}
			
			return `calc(${randomCalc(unit, globals, min / 2 * 3, max / 2 * 3, depth + 1)} - ${randomCalc(unit, globals, min / 2 * 3, max / 2 * 3, depth + 1)})`;
		case 'multiplication':
			return `calc(${randomCalc(unit, globals, min / 5, max / 5, depth + 1)} * ${randomCalc('', globals, -2, 7, depth + 1)})`;
		case 'division':
			return `calc(${randomCalc(unit, globals, min * 3, max * 3, depth + 1)} / ${randomCalc('', globals, -1, 4, depth + 1)})`;
		case 'unary':
			return `calc(${randomCalc(unit, globals, min, max, depth + 1)})`;
	
		case 'abs':
			return `abs(${randomCalc('', globals, min, max, depth + 1) })`
		case 'clamp':
			return `clamp(${randomCalc(unit, globals, min, max, depth + 1)}, ${randomCalc(unit, globals, min, max, depth + 1)}, ${randomCalc(unit, globals, min, max, depth + 1) })`;
		case 'cos':
			return `cos(${randomCalc('deg', globals, -360, 360, depth + 1)})`
		case 'exp':
			return `exp(${randomCalc('', globals, -100, 100, depth + 1)})`
		case 'hypot':
			return `hypot(${randomCalc('', globals, min, max, depth + 1)}, ${randomCalc('', globals, min, max, depth + 1)})`;
		
		case 'min':
			return `min(${randomCalc(unit, globals, min, max, depth + 1)}, ${randomCalc(unit, globals, min, max, depth + 1)})`;
		case 'max':
			return `max(${randomCalc(unit, globals, min, max, depth + 1)}, ${randomCalc(unit, globals, min, max, depth + 1)})`;
		
		case 'sin':
			return `sin(${randomCalc(unit, globals, min, max, depth + 1)})`;
		
		default:
			break;
	}

	return result;
}

export function dimension(unit, globals = [], min = 0, max = 1) {
	// TODO: favor min, max, 1/3 and 1/2 over a fully random number
	if (globals.length > 0 && randomIndex(4) === 0) {
		return globals[randomIndex(globals.length)];
	}

	let result = Math.random() * (max - min) + min;

	let delta = max - 1;
	let e = delta / 1000;
	if ((max - result) < e) {
		return `${max}${unit}`;
	}

	if (result > 0 && result < 0.000001) {
		result = 0
	} else if (result < 0 && result > -0.000001) {
		result = 0
	}

	return `${truncateNumber(result)}${unit}`;
}

function number(globals = [], min = 0, max = 1) {
	if (Math.random() > 0.7) {
		if (randomBoolean()) {
			return min;
		} else if (randomBoolean()) {
			return max;
		} else if (randomBoolean()) {
			return truncateNumber(0.5 * (max - min) + min);
		} else if (randomBoolean()) {
			return truncateNumber((1 / 3) * (max - min) + min);
		} else if (randomBoolean()) {
			return truncateNumber((2 / 3) * (max - min) + min);
		}
	}

	if (globals.length > 0 && randomIndex(2) === 0) {
		return globals[randomIndex(globals.length)];
	}

	const constants = [
		'calc(e)',
		'calc(pi)',
		'calc(infinity)',
		'calc(-infinity)',
		'calc(nan)',
	]

	if (randomIndex(10) === 0) { // most use cases should just produce a number.
		return constants[randomIndex(constants.length)];
	}

	let result = Math.random() * (max - min) + min;

	let delta = max - 1;
	let e = delta / 1000;
	if ((max - result) < e) {
		return max;
	}

	if (result > 0 && result < 0.000001) {
		result = 0
	} else if (result < 0 && result > -0.000001) {
		result = 0
	}

	return truncateNumber(result);
}

function truncateNumber(number) {
	return parseFloat(number.toFixed(6));
}

export function randomBoolean() {
	return ((Math.floor(Math.random() * (Number.MAX_SAFE_INTEGER / 2)) % 2) === 0);
}

export function randomIndex(max) {
	return Math.floor(Math.random() * max);
}

export function oneOf(...items) {
	for (let i = 0; i < items.length; i++) {
		if (Math.random() > 0.2) {
			return items[i]
		}
	}

	return items.at(-1);
}
