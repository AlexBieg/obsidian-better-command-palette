import {
    TestCase,
} from '../test-utils';

const testCase = new TestCase('Initialize Test Environment');

testCase.addTest('Create test folder', async () => {
    await testCase.pressKey('O', { metaKey: true });
    await testCase.typeInEl('.prompt-input', 'e2e-test-folder/');
    await testCase.pressKey('Enter', { metaKey: true, selector: '.prompt-input' });
    await testCase.findEl('.nav-folder-title-content', { text: 'e2e-test-folder' });
});

testCase.addTest('Create test file', async () => {
    await testCase.pressKey('O', { metaKey: true });
    await testCase.typeInEl('.prompt-input', 'e2e-test-folder/e2e-test-file');
    await testCase.pressKey('Enter', { metaKey: true, selector: '.prompt-input' });
    await testCase.clickEl('.nav-folder-title-content', { text: 'e2e-test-folder' });
    await testCase.findEl('.nav-file-title-content', { text: 'e2e-test-file' });
});

testCase.addTest('Add Links', async () => {
    await testCase.clickEl('.cm-content');
    await testCase.typeInEl('.cm-content', '[[e2e-test-folder/e2e-unresolved-link]]');
});

testCase.addTest('Add tags', async () => {
    await testCase.typeInEl('.cm-content', ' #e2e-tag ');
    await testCase.typeInEl('.cm-content', ' #e2e-tag/e2e-nested-tag ');
});

export default testCase;
