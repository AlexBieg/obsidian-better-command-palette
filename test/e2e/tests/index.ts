import testCommandPalette from './test-command-palette';
import testFilePalette from './test-file-palette';
import testTagPalette from './test-tag-palette';
import init from './initialize-test-env';
import tearDown from './tear-down-test-env';

export default [
    init,
    testCommandPalette,
    testFilePalette,
    testTagPalette,
    tearDown,
];
