import 'dotenv/config';
import { Command } from "commander";
import { runConvert } from "./commands/convert.js";
import { runSplit } from "./commands/split.js";
import { runProcess } from "./commands/process.js";
import { runProcessEleven } from "./commands/process-eleven.js";
import { runSeed } from "./commands/seed.js";
import { runEncode } from "./commands/encode.js";

const program = new Command();

program
    .name("app")
    .description("CLI tool for text processing pipeline")
    .version("2.0.0");

program
    .command("convert")
    .description("Convert EPUB to TXT")
    .action(runConvert);

program
    .command("split")
    .description("Split TXT file into chunks and save into DB")
    .action(runSplit);

program
    .command("process")
    .description("Process chunks from DB and send to API")
    .action(runProcess);

program
    .command("process-eleven")
    .description("Process chunks from DB and send to ElevenLabs API")
    .action(runProcessEleven);

program
    .command("seed")
    .description("Seed API keys")
    .action(runSeed);

program
    .command("encode")
    .description("Encode wav to mp3")
    .action(runEncode);

program.parse(process.argv);
