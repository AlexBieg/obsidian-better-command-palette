import {
    TestCase,
} from '../test-utils';

const testCase = new TestCase('Test File Palette');

testCase.addTest('Open, search, and close', async () => {
    await testCase.pressKey('O', { metaKey: true });
    await testCase.assertElCount('.suggestion-item', 20);

    await testCase.typeInEl('.prompt-input', 'e2e-test-file');
    await testCase.findEl('.suggestion-item', { text: 'e2e-test-file' });

    await testCase.pressKey('Esc');
    await testCase.assertElCount('.better-command-palette', 0);
});

testCase.addTest('Find unresolved links', async () => {
    await testCase.pressKey('O', { metaKey: true });
    await testCase.assertElCount('.suggestion-item', 20);

    await testCase.typeInEl('.prompt-input', 'e2e-unresolved-link');
    await testCase.findEl('.suggestion-item', { text: 'e2e-unresolved-link' });

    await testCase.pressKey('Esc');
    await testCase.assertElCount('.better-command-palette', 0);
});

testCase.addTest('Create file from unresolved link', async () => {
    await testCase.pressKey('O', { metaKey: true });
    await testCase.assertElCount('.suggestion-item', 20);

    await testCase.typeInEl('.prompt-input', 'e2e-unresolved-link');
    await testCase.findEl('.suggestion-item', { text: 'e2e-unresolved-link' });

    await testCase.pressKey('Enter');
    await testCase.assertElCount('.better-command-palette', 0);

    await testCase.findEl('.view-header-title', { text: 'e2e-unresolved-link' });
});

testCase.addTest('Recent files bubble up', async () => {
    await testCase.pressKey('O', { metaKey: true });

    await testCase.assertElCount('.suggestion-item', 20);
    await testCase.findEl('.suggestion-item:first-child', { text: 'e2e-unresolved-link' });
    await testCase.pressKey('Esc');
});

testCase.addTest('Open file in new pane', async () => {
    await testCase.pressKey('O', { metaKey: true });
    await testCase.assertElCount('.suggestion-item', 20);

    await testCase.typeInEl('.prompt-input', 'e2e-test-file');
    await testCase.pressKey('Enter', { shiftKey: true, selector: '.prompt-input' });

    await testCase.assertElCount('.view-header-title', 2);
    await testCase.findEl('.view-header-title', { text: 'e2e-unresolved-link' });
    await testCase.findEl('.view-header-title', { text: 'e2e-test-file' });

    await testCase.clickEl('.mod-close-leaf');
    await testCase.clickEl('.mod-close-leaf');
});

testCase.addTest('Create arbitrary file', async () => {
    await testCase.pressKey('O', { metaKey: true });
    await testCase.assertElCount('.suggestion-item', 20);

    await testCase.typeInEl('.prompt-input', 'e2e-test-folder/e2e-test-file-2');
    await testCase.pressKey('Enter', { metaKey: true, selector: '.prompt-input' });

    await testCase.assertElCount('.view-header-title', 1);
    await testCase.findEl('.view-header-title', { text: 'e2e-test-file-2' });
});

testCase.addTest('Create arbitrary file in new pane', async () => {
    await testCase.pressKey('O', { metaKey: true });
    await testCase.assertElCount('.suggestion-item', 20);

    await testCase.typeInEl('.prompt-input', 'e2e-test-folder/e2e-test-file-3');
    await testCase.pressKey('Enter', { shiftKey: true, metaKey: true, selector: '.prompt-input' });

    await testCase.assertElCount('.view-header-title', 2);
    await testCase.findEl('.view-header-title', { text: 'e2e-test-file-2' });
    await testCase.findEl('.view-header-title', { text: 'e2e-test-file-3' });

    await testCase.clickEl('.mod-close-leaf');
    await testCase.clickEl('.mod-close-leaf');
});

testCase.addTest('Search normal tag', async () => {
    await testCase.pressKey('O', { metaKey: true });
    await testCase.assertElCount('.suggestion-item', 20);

    await testCase.typeInEl('.prompt-input', '@#e2e-tag');
    await testCase.assertElCount('.suggestion-item', 1);
    await testCase.findEl('.suggestion-item', { text: 'e2e-test-file' });

    await testCase.pressKey('Enter', { selector: '.prompt-input' });
});

testCase.addTest('Search nested tag', async () => {
    await testCase.pressKey('O', { metaKey: true });
    await testCase.assertElCount('.suggestion-item', 20);

    await testCase.typeInEl('.prompt-input', '@#e2e-tag/e2e-nested-tag');
    await testCase.assertElCount('.suggestion-item', 1);
    await testCase.findEl('.suggestion-item', { text: 'e2e-test-file' });

    await testCase.pressKey('Enter', { selector: '.prompt-input' });
});

export default testCase;
