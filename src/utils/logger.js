import chalk from "chalk";

export function log(msg) {
    console.log(chalk.green("[INFO]"), msg);
}
