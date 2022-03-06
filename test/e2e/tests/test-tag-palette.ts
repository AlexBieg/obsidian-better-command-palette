import {
    TestCase,
} from '../test-utils';

const testCase = new TestCase('Test Tag Palette');

testCase.addTest('Open, search, and close', async () => {
    await testCase.pressKey('T', { metaKey: true });
    await testCase.assertElCount('.suggestion-item', 20);

    await testCase.typeInEl('.prompt-input', 'e2e-tag');
    await testCase.assertElCount('.suggestion-item', 3);

    await testCase.pressKey('Esc');
    await testCase.assertElCount('.better-command-palette', 0);
});

testCase.addTest('Finds frontmatter tags', async () => {
    await testCase.pressKey('T', { metaKey: true });

    await testCase.typeInEl('.prompt-input', 'e2e-frontmatter-tag');
    await testCase.assertElCount('.suggestion-item', 1);

    await testCase.pressKey('Esc');
});

testCase.addTest('Finds nested tags', async () => {
    await testCase.pressKey('T', { metaKey: true });

    await testCase.typeInEl('.prompt-input', 'e2e-nested-tag');
    await testCase.assertElCount('.suggestion-item', 1);

    await testCase.pressKey('Esc');
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

testCase.addTest('Empty Hidden Tag Header', async () => {
    await testCase.pressKey('T', { metaKey: true });
    await testCase.assertElCount('.hidden-items-header', 1, { text: '' });
    await testCase.pressKey('Esc');
});

testCase.addTest('Hide Tag', async () => {
    await testCase.pressKey('T', { metaKey: true });
    await testCase.typeInEl('.prompt-input', 'e2e-tag/e2e-nested-tag');
    await testCase.clickEl('.suggestion-flair');

    await testCase.assertElCount('.hidden-items-header', 1, { text: 'Show hidden items (1)' });
    await testCase.assertElCount('.suggestion-item', 0);
    await testCase.pressKey('Esc');
});

testCase.addTest('Show/Hide Hidden Tag', async () => {
    await testCase.pressKey('T', { metaKey: true });
    await testCase.typeInEl('.prompt-input', 'e2e-tag/e2e-nested-tag');

    await testCase.assertElCount('.hidden-items-header', 1, { text: 'Show hidden items (1)' });
    await testCase.assertElCount('.suggestion-item', 0);

    await testCase.clickEl('.hidden-items-header');
    await testCase.findEl('.suggestion-item.hidden', { text: 'e2e-tag/e2e-nested-tag' });
    await testCase.findEl('.hidden-items-header', { text: 'Hide hidden items (1)' });

    await testCase.clickEl('.hidden-items-header');
    await testCase.assertElCount('.suggestion-item', 0);
    await testCase.pressKey('Esc');
});

testCase.addTest('Unhide Tag', async () => {
    await testCase.pressKey('T', { metaKey: true });
    await testCase.typeInEl('.prompt-input', 'e2e-tag/e2e-nested-tag');
    await testCase.clickEl('.hidden-items-header');
    await testCase.clickEl('.suggestion-flair');

    await testCase.assertElCount('.hidden-items-header', 1, { text: '' });
    await testCase.assertElCount('.suggestion-item', 1);
    await testCase.pressKey('Esc');
});

export default testCase;
