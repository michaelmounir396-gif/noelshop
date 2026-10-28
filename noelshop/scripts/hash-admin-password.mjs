import { randomBytes, scryptSync } from "node:crypto";

if (!process.stdin.isTTY || !process.stdin.setRawMode) {
  console.error("Run this utility in an interactive terminal.");
  process.exit(1);
}

const chunks = [];
process.stdout.write("Enter a new admin password (minimum 12 characters): ");
process.stdin.setRawMode(true);
process.stdin.resume();
process.stdin.setEncoding("utf8");
process.stdin.on("data", chunk => {
  for (const char of chunk) {
    if (char === "\u0003") process.exit(130);
    if (char === "\r" || char === "\n") {
      process.stdin.setRawMode(false);
      process.stdin.pause();
      const password = chunks.join("");
      process.stdout.write("\n");
      if (password.length < 12) {
        console.error("Password must be at least 12 characters.");
        process.exit(1);
      }
      const salt = randomBytes(24).toString("hex");
      const hash = scryptSync(password, salt, 64).toString("hex");
      console.log(`NOEL_ADMIN_PASSWORD_SALT=${salt}`);
      console.log(`NOEL_ADMIN_PASSWORD_HASH=${hash}`);
      chunks.fill("");
      process.exit(0);
    }
    if (char === "\u007f" || char === "\b") chunks.pop();
    else if (char >= " ") chunks.push(char);
  }
});
