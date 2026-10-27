
const mysql = require("mysql2/promise");
const env = require("../src/config/env");
const readline = require("node:readline");
const { stdin, stdout } = require("node:process");
const sequelize = require("../src/config/database");
const { User } = require("../src/models");
const ROLES = require("../src/constants/roles");
const { hashPassword } = require("../src/utils/password");


const LOCK_NAME = "hi_tech_edu_first_super_admin";
let lockConnection = null;


async function acquireLock() {
  lockConnection = await mysql.createConnection({
  host: env.database.host,
  port: Number(env.database.port),
  user: env.database.user,
  password: env.database.password,
  database: env.database.name,
  connectTimeout: 10000
});

  try {
    const [rows] = await lockConnection.execute(
      "SELECT GET_LOCK(?, 10) AS acquired",
      [LOCK_NAME]
    );

    if (rows[0]?.acquired !== 1) {
      throw new Error(
        "Could not acquire the Super Admin setup lock. Try again later."
      );
    }
  } catch (error) {
    const connection = lockConnection;
    lockConnection = null;

    if (connection) {
      await connection.end().catch(() => {});
    }

    throw error;
  }
}


async function releaseLock() {
  if (!lockConnection) return;

  const connection = lockConnection;
  lockConnection = null;

  try {
    const [rows] = await connection.execute(
      "SELECT RELEASE_LOCK(?) AS released",
      [LOCK_NAME]
    );

    if (rows[0]?.released !== 1) {
      throw new Error("MySQL did not confirm lock release.");
    }
  } finally {
    await connection.end();
  }
}


function ask(question) {
  const rl = readline.createInterface({ input: stdin, output: stdout });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function askHidden(question) {
  if (!stdin.isTTY || typeof stdin.setRawMode !== "function") {
    throw new Error(
      "Hidden password input requires an interactive terminal."
    );
  }

  stdout.write(question);

  return new Promise((resolve, reject) => {
    let password = "";
    let finished = false;

    function cleanup() {
      stdin.removeListener("data", onData);

      try {
        stdin.setRawMode(false);
      } catch {}

      stdin.pause();
    }

    function onData(chunk) {
      for (const char of chunk.toString()) {
        if (char === "\u0003") {
          finished = true;
          cleanup();
          stdout.write("\n");
          reject(new Error("Password entry cancelled."));
          return;
        }

        if (char === "\r" || char === "\n") {
          finished = true;
          cleanup();
          stdout.write("\n");
          resolve(password);
          return;
        }

        if (char === "\u007f" || char === "\b") {
          password = password.slice(0, -1);
        } else if (char >= " ") {
          password += char;
        }
      }
    }

    stdin.resume();
    stdin.setRawMode(true);
    stdin.on("data", onData);

    // Prevent an unused flag and make cleanup state explicit.
    void finished;
  });
}




async function createSuperAdmin() {
  let transaction;

  try {
    if (!stdin.isTTY || !stdout.isTTY) {
      throw new Error("Run this script directly in an interactive terminal.");
    }

    await sequelize.authenticate();
    await acquireLock();

    const existingAdmin = await User.findOne({
      where: { role: ROLES.SUPER_ADMIN },
      attributes: ["id"]
    });

    if (existingAdmin) {
      throw new Error(
        "A Super Admin already exists. No account was created."
      );
    }

    console.log("\nCreate the first HI-TECH-EDU Super Admin.\n");

    const fullName = await ask("Full name: ");
    const email = (await ask("Email: ")).toLowerCase();

    if (fullName.length < 2 || fullName.length > 120) {
      throw new Error("Full name must contain 2–120 characters.");
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 190) {
      throw new Error("Enter a valid email address.");
    }

    const password = await askHidden("Password (minimum 12 characters): ");

    if (password.length < 12) {
      throw new Error("Password must contain at least 12 characters.");
    }

    const confirmation = await askHidden("Confirm password: ");

    if (password !== confirmation) {
      throw new Error("Passwords do not match.");
    }

    transaction = await sequelize.transaction();

    const adminCount = await User.count({
      where: { role: ROLES.SUPER_ADMIN },
      transaction
    });

    if (adminCount > 0) {
      throw new Error(
        "A Super Admin already exists. No account was created."
      );
    }

    const existingUser = await User.findOne({
      where: { email },
      transaction,
      attributes: ["id"]
    });

    if (existingUser) {
      throw new Error(
        "That email is already registered. No account was created."
      );
    }

    const passwordHash = await hashPassword(password);

    await User.create(
      {
        fullName,
        email,
        passwordHash,
        role: ROLES.SUPER_ADMIN,
        isActive: true
      },
      { transaction }
    );

    await transaction.commit();
    transaction = null;

    console.log("\nSuper Admin account created successfully.");
    console.log(`Email: ${email}`);
    console.log("Keep your password private and store it securely.");
  } catch (error) {
    if (transaction) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        console.error("Transaction rollback failed.");
      }
    }

    console.error(`\nSetup failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    try {
      await releaseLock();
    } catch {
      console.error("Could not explicitly release the setup lock.");
    }

    await sequelize.close();
  }
}

createSuperAdmin();
