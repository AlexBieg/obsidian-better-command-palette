import {
    TestCase,
} from '../test-utils';

const testCase = new TestCase('Tear down test environment');

testCase.addTest('Delete test folder', async () => {
    await testCase.clickEl('.nav-folder-title-content', { text: 'e2e-test-folder', rightClick: true });
    await testCase.clickEl('.menu-item-title', { text: 'Delete' });
});

export default testCase;
