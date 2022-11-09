import "reflect-metadata";
import { createConnection, Connection } from "typeorm";

class _DatabaseService {
	connection: Connection;
	async init() {
		const connection = (this.connection = await createConnection());
	}
}

export const DatabaseService = new _DatabaseService();
