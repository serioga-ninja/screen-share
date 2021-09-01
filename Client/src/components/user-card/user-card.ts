import { query } from 'express';
import { css, html, LitElement, PropertyValues } from 'lit';
import { customElement, property, queryAll } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { repeat } from 'lit/directives/repeat.js';
import { BaseComponent } from '../../classes/base.component';
import { WebStreamController } from '../../reactive-controllers/web-stream.controller';
import { MediaStreamServiceEvents } from '../../services';
import { User } from '../../user';

import componentStyles from './user-card.scss';

@customElement('user-card')
export class UserCardComponent extends BaseComponent {

  static styles = [componentStyles];

  private _webStreamController?: WebStreamController;

  @queryAll('video.user-card__video')
  videoElement?: HTMLVideoElement[];

  @property()
  user?: User;

  @property({ type: Boolean, attribute: 'show-controls' })
  showControls = false;

  connectedCallback() {
    super.connectedCallback();

    this._webStreamController = new WebStreamController(this, this.user.stream);

    this.user.stream.addEventListener(MediaStreamServiceEvents.VideoStreamUpdated, () => {
      const videoElem = this.shadowRoot.querySelector('video');
      videoElem.srcObject = this.user.stream;
    });

    setTimeout(() => {
      const videoElem = this.shadowRoot.querySelector('video');
      videoElem.srcObject = this.user.stream;

      if (this.user.currentUser) {
        const videoElem = this.shadowRoot.querySelector('video');
        videoElem.muted = true;
      }
    }, 100);
  }

  render() {
    const stream = this.user.stream;

    return html`
      <div class="user-card">
        <video class="user-card__video" autoplay playsinline ?muted=${this.user.currentUser}></video>
      </div>
    `;
  }

  protected toggleTrack(track: MediaStreamTrack) {
    track.enabled = !track.enabled;

    this.requestUpdate();
  }
}
