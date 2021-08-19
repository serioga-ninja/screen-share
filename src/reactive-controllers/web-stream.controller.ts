import { ReactiveController, ReactiveControllerHost } from 'lit';

export class WebStreamController implements ReactiveController {

  constructor(private host: ReactiveControllerHost) {

    host.addController(this);
  }

  hostConnected() {

  }
}
