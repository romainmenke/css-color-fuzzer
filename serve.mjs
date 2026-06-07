import { createServer } from "./util/create-server.mjs";

const server = createServer(
	(e) => {
		console.log('Server error.');
		console.error(e);
	},
);

server.listen(8080);
console.log('Server listening on http://localhost:8080');
