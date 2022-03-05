import {
    TestCase,
} from '../test-utils';

const testCase = new TestCase('Test Command Palette');

// Test open, search, and close
testCase.addTest('Open, search, and close', async () => {
    await testCase.pressKey('P', { metaKey: true });
    await testCase.assertElCount('.suggestion-item', 20);

    await testCase.typeInEl('.prompt-input', 'Toggle pin');
    await testCase.findEl('.suggestion-item', { text: 'Toggle pin' });

    await testCase.pressKey('Esc');
    await testCase.assertElCount('.better-command-palette', 0);
});

testCase.addTest('Close with backspace', async () => {
    await testCase.pressKey('P', { metaKey: true });
    await testCase.findEl('.better-command-palette');

    await testCase.pressKey('Backspace', { selector: '.prompt-input' });
    await testCase.assertElCount('.better-command-palette', 0);
});

// Test recent commands
testCase.addTest('Recent command bubbling', async () => {
    await testCase.pressKey('P', { metaKey: true });
    await testCase.typeInEl('.prompt-input', 'Toggle pin');
    await testCase.clickEl('.suggestion-item', { text: 'Toggle pin' });
    await testCase.pressKey('Enter');

    await testCase.pressKey('P', { metaKey: true });
    await testCase.findEl('.recent', { text: 'Toggle pin' });
    await testCase.pressKey('Esc');
});

testCase.addTest('Command fuzzy search', async () => {
    await testCase.pressKey('P', { metaKey: true });
    await testCase.typeInEl('.prompt-input', 'Toggle');
    await testCase.assertElCount('.suggestion-item', 19);
    await testCase.pressKey('Esc');
});

testCase.addTest('Command hotkeys', async () => {
    await testCase.pressKey('P', { metaKey: true });
    await testCase.typeInEl('.prompt-input', 'Toggle pin');
    await testCase.findEl('.suggestion-item', { text: '⌥ ^ ⌘ I' });
    await testCase.pressKey('Esc');
});

export default testCase;
