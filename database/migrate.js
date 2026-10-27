
"use strict";

const fs = require("node:fs/promises");
const path = require("node:path");
const sequelize = require("../src/config/database");
const logger = require("../src/config/logger");

const MIGRATIONS_DIR = path.join(__dirname, "migrations");
const MIGRATIONS_TABLE = "SequelizeMeta";

async function ensureMigrationsTable(queryInterface) {
  const tables = await queryInterface.showAllTables();

  const exists = tables.some(
    (table) =>
      String(typeof table === "object" ? table.tableName || table.name : table)
        .toLowerCase() === MIGRATIONS_TABLE.toLowerCase()
  );

  if (!exists) {
    await queryInterface.createTable(MIGRATIONS_TABLE, {
      name: {
        type: sequelize.Sequelize.STRING,
        allowNull: false,
        primaryKey: true
      }
    });
  }
}

async function runMigrations() {
  const queryInterface = sequelize.getQueryInterface();

  await sequelize.authenticate();
  await ensureMigrationsTable(queryInterface);

  const [completedRows] = await sequelize.query(
    `SELECT name FROM \`${MIGRATIONS_TABLE}\``
  );

  const completed = new Set(completedRows.map((row) => row.name));

  const files = (await fs.readdir(MIGRATIONS_DIR))
    .filter((file) => file.endsWith(".js"))
    .sort();

  for (const file of files) {
    if (completed.has(file)) {
      logger.info("Migration already applied; skipping.", { file });
      continue;
    }

    const migration = require(path.join(MIGRATIONS_DIR, file));

    if (typeof migration.up !== "function") {
      throw new Error(`Migration "${file}" must export an up() function.`);
    }

    logger.info("Running migration.", { file });

    await migration.up(queryInterface);

    await sequelize.query(
      `INSERT INTO \`${MIGRATIONS_TABLE}\` (\`name\`) VALUES (?)`,
      { replacements: [file] }
    );

    logger.info("Migration completed.", { file });
  }
}

if (require.main === module) {
  runMigrations()
    .then(async () => {
      await sequelize.close();
      process.exitCode = 0;
    })
    .catch(async (error) => {
      logger.error("Migration failed.", { message: error.message });

      try {
        await sequelize.close();
      } catch {
        // Preserve the original migration error.
      }

      process.exitCode = 1;
    });
}

module.exports = { runMigrations, ensureMigrationsTable };
