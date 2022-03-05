const specialKeyCodes: Record<string, number> = {
    Enter: 13,
    Esc: 27,
    Backspace: 8,
    LeftArrow: 37,
    UpArrow: 38,
    RightArrow: 39,
    DownArrow: 40,
};

// Test interfaces
interface PressKeyOptions {
    shiftKey?: boolean,
    metaKey?: boolean,
    selector?: string,
}

// Test Utils

export function wait(ms: number = 100): Promise<void> {
    // eslint-disable-next-line
    return new Promise((resolve) => setTimeout(resolve, ms));
}

type TestCommand = (...any: any[]) => any | void;

export class TestCase {
    tests: [string, { (self: TestCase): void }][];

    name: string;

    constructor(testCaseName: string) {
        this.name = testCaseName;
        this.tests = [];
    }

    async run(): Promise<void> {
        for (let i = 0; i < this.tests.length; i += 1) {
            const [testName, test] = this.tests[i];
            // eslint-disable-next-line no-console
            console.log('\t- Running:', testName);
            try {
                // eslint-disable-next-line no-await-in-loop
                await test(this);
                // eslint-disable-next-line no-console
                console.log('%c\t\tTest Passed', 'color: green');
            } catch (e) {
                // eslint-disable-next-line no-console
                console.log('%c\t\tTest Failed', 'color: red');
                // eslint-disable-next-line no-console
                console.error(e);
            }
            // eslint-disable-next-line no-await-in-loop
            await wait();
        }
    }

    addTest(testName: string, testFunc: () => void) {
        this.tests.push([testName, testFunc]);
    }

    async runCommandWithRetries(
        command: TestCommand,
        { retryCount = 10, waitMs = 200 } = {},
    ): Promise<any> {
        let result: any;

        for (let i = 1; i <= retryCount; i += 1) {
            // eslint-disable-next-line no-await-in-loop
            await wait(waitMs);
            try {
                // eslint-disable-next-line no-await-in-loop
                result = await command();
                break;
            } catch (e) {
                if (i === retryCount) {
                    throw e;
                }
            }
        }

        return result;
    }

    // Internal funcs
    private findAllElsInternal = (selector: string, { text = '' } = {}) => (): Element[] => Array.from(document.querySelectorAll(selector)).filter((e) => e.innerHTML.includes(text));

    private findElInternal = (selector: string, {
        text = '',
        index = 0,
    }: {
        text?: string,
        index?: number,
    } = {}) => (): Element => {
        const el = this.findAllElsInternal(selector, { text })()[index];

        if (!el || !el.innerHTML.includes(text)) {
            throw new Error(`Could not find element with class "${selector}" and text "${text}"`);
        }

        return el;
    };

    private typeInternal = (
        selector: string,
        text: string,
        clearCurrentText: boolean = false,
    ) => () => {
        const el = this.findElInternal(selector)() as HTMLInputElement;

        if (el.isContentEditable) {
            const sel = window.getSelection();
            if (sel.getRangeAt && sel.rangeCount) {
                const selection = window.getSelection();
                const range = document.createRange();
                range.selectNodeContents(el);
                selection.removeAllRanges();
                selection.addRange(range);

                if (clearCurrentText) {
                    range.deleteContents();
                }

                range.collapse(false);
                range.insertNode(document.createTextNode(text));
                range.collapse(false);
            }
        } else {
            if (clearCurrentText) {
                el.value = '';
            }

            el.value += text;
        }

        el.dispatchEvent(new InputEvent('input'));
        el.dispatchEvent(new InputEvent('change'));
    };

    private clickElInternal = (selector: string, {
        rightClick = false,
        text = '',
        index = 0,
    } = {}) => () => {
        const el = this.findElInternal(selector, { index, text })();

        if (rightClick) {
            el.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true }));
        }
        el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    };

    private pressKeyInternal = (key: string, {
        metaKey = false,
        shiftKey = false,
        selector = 'body',
    }: PressKeyOptions = {}) => () => {
        const el = this.findElInternal(selector)();
        el.dispatchEvent(new KeyboardEvent('keydown', {
            metaKey,
            shiftKey,
            key: key.toUpperCase(),
            keyCode: specialKeyCodes[key] || key.toUpperCase().charCodeAt(0),
        }));
        el.dispatchEvent(new KeyboardEvent('keyup', {
            metaKey,
            shiftKey,
            key: key.toUpperCase(),
            keyCode: specialKeyCodes[key] || key.toUpperCase().charCodeAt(0),
        }));
        el.dispatchEvent(new Event('change'));
        el.dispatchEvent(new KeyboardEvent('input'));
    };

    private assertEqualInternal = (selector: string, count: number, options = {}) => () => {
        const els = this.findAllElsInternal(selector, options)();

        if (els.length !== count) {
            throw new Error(`Found ${els.length} not ${count}`);
        }
    };

    private assertExistsInternal = (val: any) => () => {
        if (!val) {
            throw new Error('Value does not exist');
        }
    };

    // External functions
    async findAllEls(selector: string): Promise<Element[]> {
        const result = await this.runCommandWithRetries(this.findAllElsInternal(selector));
        return result;
    }

    async findEl(selector: string, options: Object = {}): Promise<Element> {
        return this.runCommandWithRetries(this.findElInternal(selector, options));
    }

    async typeInEl(selector: string, text: string): Promise<void> {
        return this.runCommandWithRetries(this.typeInternal(selector, text));
    }

    async clickEl(selector: string, options: Object = {}) {
        return this.runCommandWithRetries(this.clickElInternal(selector, options));
    }

    async pressKey(key: string, options: PressKeyOptions = {}): Promise<void> {
        return this.runCommandWithRetries(this.pressKeyInternal(key, options));
    }

    async assertElCount(selector: string, count: number) {
        return this.runCommandWithRetries(this.assertEqualInternal(selector, count));
    }

    async assertExists(val: any) {
        return this.runCommandWithRetries(this.assertExistsInternal(val));
    }
}
