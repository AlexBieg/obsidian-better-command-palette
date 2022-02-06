import { writeFile, mkdirSync } from 'fs';
import yargs from 'yargs'; // eslint-disable-line import/no-extraneous-dependencies
import { hideBin } from 'yargs/helpers'; // eslint-disable-line import/no-extraneous-dependencies

const { argv } = yargs(hideBin(process.argv))
    .option('count', {
        alias: 'c',
        describe: 'The number of files to create',
    })
    .option('path', {
        alias: 'p',
        describe: 'The path to create the files at',
        default: './test-vault/',
    })
    .option('ext', {
        alias: 'e',
        describe: 'The extension of the files to be created',
        default: 'md',
    })
    .option('name', {
        alias: 'n',
        describe: 'The base name of the files to be created',
        default: 'test-file',
    })
    .option('text', {
        alias: 't',
        describe: 'The text to add to the files. Use {c} to have the current count inserted into the text.',
        default: '',
    })
    .demandOption(['count']);

mkdirSync(argv.path, { recursive: true });

for (let i = 0; i < argv.count; i += 1) {
    const fileName = `${argv.path}${argv.name}${i}.${argv.ext}`;
    writeFile(fileName, argv.text.replaceAll('{c}', i), () => {});
}

// eslint-disable-next-line no-console
console.log(`Created ${argv.count} at ${argv.path}`);
