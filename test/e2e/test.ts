import plugin from 'src/main';
import { UnsafeAppInterface } from 'src/types/types';
import tests from './tests';

const badWindow = window as any;
const app = badWindow.app as UnsafeAppInterface;

app.workspace.onLayoutReady(async () => {
    // eslint-disable-next-line no-console
    console.log('the layout is ready for testing');
    for (let i = 0; i < tests.length; i += 1) {
        // eslint-disable-next-line no-console
        console.log('Running test suite:', tests[i].name);
        // eslint-disable-next-line no-await-in-loop
        await tests[i].run();
    }
});

export default plugin;
