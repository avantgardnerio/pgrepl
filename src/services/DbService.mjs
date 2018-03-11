import ConfigService from './ConfigService.mjs';
import pgp from 'pg-promise';

const sqlList = "SELECT datname FROM pg_database WHERE datistemplate = FALSE;";
const sqlSlots = "SELECT slot_name FROM pg_replication_slots WHERE database = ?;";

export const pg = pgp();
export const db = pg(ConfigService.dbUrl);

class DbService {
}

export default new DbService();