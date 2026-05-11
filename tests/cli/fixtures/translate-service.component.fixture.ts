import { Component, inject, signal } from '@angular/core';
import { translate, TranslateService } from '@ngx-translate/core';

@Component({
	selector: 'app-home',
	standalone: true,
	template: `
		<div>
			<h1>{{ welcomeMessage }}</h1>
			<p>{{ descriptionMessage }}</p>
		</div>

		@if (showMore()) {
			<button type="button" (click)="showMore.set(false)">{{ showLessLabel }}</button>
			<p>{{ detailsMessage }}</p>
		} @else {
			<button type="button" (click)="showMore.set(true)">{{ showMoreLabel }}</button>
		}
	`,
})
export class TranslateServiceComponentFixture {
	private readonly translate = inject(TranslateService);

	readonly welcomeMessage = translate('translate-service.comp.welcome');
	readonly descriptionMessage = this.translate.instant('translate-service.comp.description');
	readonly detailsMessage = this.translate.get('translate-service.comp.details');
	readonly showMoreLabel = this.translate.stream('translate-service.comp.show-more-label');
	readonly showLessLabel = this.translate.translate('translate-service.comp.show-less-label');

	readonly showMore = signal(false);
}
