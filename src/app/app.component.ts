import { Component, OnInit } from '@angular/core';
import { MatomoInjector, MatomoTracker } from 'ngx-matomo';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  constructor(
    private matomoInjector: MatomoInjector,
    private matomoTracker: MatomoTracker
  ) {}

  ngOnInit() {
    if (environment.matomo) {
      this.matomoInjector.init(environment.matomo.url, environment.matomo.id);
      this.matomoTracker.disableCookies();
    }
  }
}
