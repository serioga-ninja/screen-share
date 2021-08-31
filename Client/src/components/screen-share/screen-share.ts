import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import app, { App, EAppEvents } from '../../app';
import { BaseComponent } from '../../classes/base.component';
import { ScreenShareController } from '../../reactive-controllers/screen-share.controller';
import { connectionService } from '../../services';
import { mediaStreamService } from '../../services/media-stream.service';
import { repeat } from 'lit/directives/repeat.js';

import componentStyles from './screen-share.scss';

@customElement('screen-share')
export class ScreenShare extends BaseComponent {
  static styles = [componentStyles];

  private readonly _app: App;
  private readonly _screenShareController: ScreenShareController;

  constructor() {
    super();

    this._app = app;
    this._screenShareController = new ScreenShareController(this, this._app, connectionService);
  }

  render() {
    const remoteStreamsArr = Array.from(
      this._screenShareController.remoteStreams,
      ([name, value]) => (value)
    );

    return html`
      <div class="screen-share">
        <button @click=${() => this.shareScreen()}>Toggle Screen Share</button>
        <user-card show-controls="true" .stream=${this._screenShareController.stream}></user-card>
        <div style="display: flex; flex-direction: column">
          <h3>Remote Streams</h3>

          <div class="screen-share__remote-streams">
            ${repeat(remoteStreamsArr, (item) => item.id, (item) => html`
                <user-card .stream=${item}></user-card>
              `
            )}
          </div>
        </div>
      </div>
    `;
  }

  private shareScreen() {
    mediaStreamService.toggleVideo();
  }
}
