import { query } from 'express';
import { css, html, LitElement, PropertyValues } from 'lit';
import { customElement, property, queryAll } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { repeat } from 'lit/directives/repeat.js';
import { WebStreamController } from '../../reactive-controllers/web-stream.controller';

import componentStyles from './user-card.scss';

@customElement('user-card')
export class UserCardComponent extends LitElement {

  static styles = [componentStyles];

  private _webStreamController?: WebStreamController;

  @queryAll('video.user-card__video')
  videoElement?: HTMLVideoElement[];

  @property()
  stream?: MediaStream;

  @property({ type: Boolean, attribute: 'show-controls' })
  showControls = false;

  connectedCallback() {
    super.connectedCallback();

    this._webStreamController = new WebStreamController(this, this.stream);
  }

  render() {
    const stream = this.stream;

    return html`
      <div class="user-card">
        <video class="user-card__video" autoplay playsinline ?muted="${this.showControls}"></video>
        <div class="user-card__controls" ?hidden="${!this.showControls}">
          ${repeat(stream?.getTracks() || [], (item) => item.id, (item) => html`
              <button type="button"
                      class=${classMap({
                        red: !item.enabled,
                        green: item.enabled
                      })}
                      @click=${() => this.toggleTrack(item)}>${item.kind}
              </button>
            `
          )}
        </div>
      </div>
    `;
  }

  protected toggleTrack(track: MediaStreamTrack) {
    track.enabled = !track.enabled;

    this.requestUpdate();
  }

  protected updated(_changedProperties: PropertyValues) {
    super.updated(_changedProperties);

    if (_changedProperties.has('stream') && this.videoElement?.length > 0) {
      this.videoElement[0].srcObject = this.stream as MediaStream;
      this.requestUpdate();
    }
  }
}
