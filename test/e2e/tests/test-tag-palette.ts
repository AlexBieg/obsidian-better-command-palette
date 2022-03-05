import {
    TestCase,
} from '../test-utils';

const testCase = new TestCase('Test Tag Palette');

testCase.addTest('Open, search, and close', async () => {
    await testCase.pressKey('T', { metaKey: true });
    await testCase.assertElCount('.suggestion-item', 20);

    await testCase.typeInEl('.prompt-input', 'e2e-tag');
    await testCase.assertElCount('.suggestion-item', 2);

    await testCase.pressKey('Esc');
    await testCase.assertElCount('.better-command-palette', 0);
});

testCase.addTest('Tag selection opens file search', async () => {
    await testCase.pressKey('T', { metaKey: true });
    await testCase.typeInEl('.prompt-input', 'e2e-tag');

    await testCase.pressKey('Enter');
    await testCase.assertElCount('.better-command-palette', 1);
    await testCase.findEl('.better-command-palette-title', { text: 'Files' });
    await testCase.assertElCount('.suggestion-item', 2);
    await testCase.pressKey('Esc');
});

export default testCase;
