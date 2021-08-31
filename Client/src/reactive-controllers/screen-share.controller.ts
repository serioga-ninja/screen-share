import { ReactiveController, ReactiveControllerHost } from 'lit';
import { App } from '../app';
import { UsersCollectionEvents } from '../users-collection';

export class ScreenShareController implements ReactiveController {
  constructor(private host: ReactiveControllerHost, private app: App) {
    host.addController(this);
  }

  hostConnected() {
    this.app.users.addEventListener(UsersCollectionEvents.Updated, () => {
      this.host.requestUpdate();
    });
  }
}
