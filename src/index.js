import { Command } from "commander";
import { runConvert } from "./commands/convert.js";
import { runSplit } from "./commands/split.js";
import { runProcess } from "./commands/process.js";

const program = new Command();

program
    .name("app")
    .description("CLI tool for text processing pipeline")
    .version("1.0.0");

program
    .command("convert <epubFile> <outTxt>")
    .description("Convert EPUB to TXT")
    .action(runConvert);

program
    .command("split <txtFile> <outDir>")
    .description("Split TXT file into chunks and save into DB")
    .action(runSplit);

program
    .command("process")
    .description("Process chunks from DB and send to API")
    .action(runProcess);

program.parse(process.argv);
