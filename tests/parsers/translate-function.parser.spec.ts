import { describe, beforeEach, expect, it } from 'vitest';

import { TranslateFunctionParser } from '../../src/parsers/translate-function.parser.js';

describe('TranslateFnParser', () => {
	const componentFilename: string = 'test.component.ts';

	let parser: TranslateFunctionParser;

	beforeEach(() => {
		parser = new TranslateFunctionParser();
	});

	describe('class property initializers', () => {
		it('should extract keys from class property initializers', () => {
			const contents = `
			import { translate } from '@ngx-translate/core';

			@Component({ template: '' })
			export class App {
				greeting = translate('hello');
				farewell = translate('goodbye');
			}
		`;
			const keys = parser.extract(contents, componentFilename).keys();
			expect(keys).to.deep.equal(['hello', 'goodbye']);
		});

		it('should extract array of keys from class property initializer', () => {
			const contents = `
			import { translate } from '@ngx-translate/core';

			@Component({ template: '' })
			export class App {
				labels = translate(['yes', 'no', 'cancel']);
			}
		`;
			const keys = parser.extract(contents, componentFilename).keys();
			expect(keys).to.deep.equal(['yes', 'no', 'cancel']);
		});

		it('should extract key and ignore params argument', () => {
			const contents = `
			import { translate } from '@ngx-translate/core';

			@Component({ template: '' })
			export class App {
				greeting = translate('hello', { name: 'John' });
			}
		`;
			const keys = parser.extract(contents, componentFilename).keys();
			expect(keys).to.deep.equal(['hello']);
		});

		it('should not extract key when class property receives a signal as key', () => {
			const contents = `
			import { translate } from '@ngx-translate/core';

			@Component({ template: '' })
			export class App {
				keySignal = signal('hello');
				dynamic = translate(this.keySignal);
			}
		`;
			const keys = parser.extract(contents, componentFilename).keys();
			expect(keys).to.deep.equal([]);
		});

		it('should not extract key when class property receives an arrow function as key', () => {
			const contents = `
			import { translate } from '@ngx-translate/core';

			@Component({ template: '' })
			export class App {
				model = signal({ key: 'hello' });
				dynamic = translate(() => this.model().key);
			}
		`;
			const keys = parser.extract(contents, componentFilename).keys();
			expect(keys).to.deep.equal([]);
		});

		it('should extract split string keys from class property initializers', () => {
			const contents = `
			import { translate } from '@ngx-translate/core';

			@Component({ template: '' })
			export class App {
				label = translate('very.' + 'long.' + 'key');
			}
		`;
			const keys = parser.extract(contents, componentFilename).keys();
			expect(keys).to.deep.equal(['very.long.key']);
		});
	});

	describe('constructor', () => {
		it('should extract keys from constructor', () => {
			const contents = `
			import { translate } from '@ngx-translate/core';

			@Component({ template: '' })
			export class App {
				readonly staticLabel: string;
				readonly label: string;

				constructor() {
					this.staticLabel = translate('hello')();
					this.label = translate('word');
				}
			}
		`;
			const keys = parser.extract(contents, componentFilename).keys();
			expect(keys).to.deep.equal(['hello', 'word']);
		});

		it('should extract keys from constructor with binary expression', () => {
			const contents = `
			import { translate } from '@ngx-translate/core';

			@Component({ template: '' })
			export class App {
				constructor() {
					translate(condition || 'fallback.key');
				}
			}
		`;
			const keys = parser.extract(contents, componentFilename).keys();
			expect(keys).to.deep.equal(['fallback.key']);
		});

		it('should extract keys from constructor with ternary expression', () => {
			const contents = `
			import { translate } from '@ngx-translate/core';

			@Component({ template: '' })
			export class App {
				constructor() {
					translate(condition ? 'key.true' : 'key.false');
				}
			}
		`;
			const keys = parser.extract(contents, componentFilename).keys();
			expect(keys).to.deep.equal(['key.true', 'key.false']);
		});
	});

	describe('runInInjectionContext', () => {
		it('should extract keys used inside runInInjectionContext', () => {
			const contents = `
			import { translate } from '@ngx-translate/core';

			runInInjectionContext(injector, () => {
				const greeting = translate('hello');
				const farewell = translate('goodbye');
			});
		`;
			const keys = parser.extract(contents, componentFilename).keys();
			expect(keys).to.deep.equal(['hello', 'goodbye']);
		});
	});

	describe('Import variations', () => {
		it('should extract keys when translate is imported with an alias', () => {
			const contents = `
			import { translate as _ } from '@ngx-translate/core';

			@Component({ template: '' })
			export class App {
				greeting = _('hello');
			}
		`;
			const keys = parser.extract(contents, componentFilename).keys();
			expect(keys).to.deep.equal(['hello']);
		});

		it('should not extract keys when translate is not imported from @ngx-translate/core', () => {
			const contents = `
			import { translate } from './translate-wrapper';

			@Component({ template: '' })
			export class App {
				greeting = translate('hello');
			}
		`;
			const keys = parser.extract(contents, componentFilename).keys();
			expect(keys).to.deep.equal([]);
		});

		it('should not extract keys when there is no import', () => {
			const contents = `
			@Component({ template: '' })
			export class App {
				greeting = translate('hello');
			}
		`;
			const keys = parser.extract(contents, componentFilename).keys();
			expect(keys).to.deep.equal([]);
		});
	});

	describe('edge cases', () => {
		it('should not extract empty or whitespace-only string keys', () => {
			const contents = `
			import { translate } from '@ngx-translate/core';

			@Component({ template: '' })
			export class App {
				empty = translate('');
				whitespace = translate('   ');
			}
		`;
			const keys = parser.extract(contents, componentFilename).keys();
			expect(keys).to.deep.equal([]);
		});

		it('should not extract template literal keys with expressions', () => {
			const contents = `
			import { translate } from '@ngx-translate/core';

			@Component({ template: '' })
			export class App {
				dynamic = translate(\`HELLO.\${this.name}\`);
			}
		`;
			const keys = parser.extract(contents, componentFilename).keys();
			expect(keys).to.deep.equal([]);
		});

		it('should not break after bracket syntax casting', () => {
			const contents = `
			import { translate } from '@ngx-translate/core';

			@Component({ template: '' })
			export class App {
				label: string;

				constructor() {
					const input: unknown = 'hello';
					const myNiceVar1 = input as string;
					translate('hello.after.as.syntax');

					const myNiceVar2 = <string>input;
					translate('hello.after.bracket.syntax');
				}
			}
		`;
			const keys = parser.extract(contents, componentFilename).keys();
			expect(keys).to.deep.equal(['hello.after.as.syntax', 'hello.after.bracket.syntax']);
		});
	});
});
