const DB_HOST = `127.0.0.1`;
const DB_NAME = `pgrepl`;

class ConfigService {
    get dbHost() {
        return process.env.DB_HOST || DB_HOST;
    }

    get dbName() {
        return process.env.DB_NAME || DB_NAME;
    }

    get dbUrl() {
        return `postgresql://postgres:postgres@${this.dbHost}:5432/${this.dbName}`;
    }
}

export default new ConfigService();