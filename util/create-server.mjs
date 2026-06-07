import http from 'node:http';
import { randomColor } from './../fuzzer/color.mjs';

function html() {
	let colors = '';
	for (let i = 0; i < 100; i++) {
		const color = randomColor();
		colors += `#a-${i} { background-color: ${color}; content: "" / "${color}" }`;
	}

	let elements = '';
	for (let i = 0; i < 100; i++) {
		elements += `<div id="a-${i}" class="swatch"></div>`;
	}

	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Colors</title>

	<style>
		.container {
			display: flex;
			flex-direction: row;
			flex-wrap: wrap;
		}
	
		.swatch {
			width: 50px;
			height: 50px;
			margin: 5px;
		}

		${colors}
	</style>
</head>
<body>
	<div class="container">
		${elements}
	</div>
</body>
</html>
`
}

export function createServer(serverErrorCallback) {
	const someHTML = html();
	const server = http.createServer(async (req, res) => {
		res.setHeader('Content-type', 'text/html');
		res.writeHead(200);
		res.end(someHTML);
	});

	server.timeout = 100;

	server.on('error', (e) => {
		serverErrorCallback(e);
	});

	return server;
}
