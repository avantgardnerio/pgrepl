import argparse from 'argparse';
import metadata from '../../package.json';

const parseArgs = () => {
    const parser = new argparse.ArgumentParser({
        version: metadata.version,
        addHelp: true,
        description: 'pgrepl load tester'
    });
    parser.addArgument(['-u', '--url'], {help: 'URL to test default=ws://127.0.0.1:8080'});
    parser.addArgument('--baz', {help: 'baz bar'});
    const args = parser.parseArgs();
    return args;
};

export default parseArgs;