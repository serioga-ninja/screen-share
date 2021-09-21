import { query } from 'express';
import { css, html, LitElement, PropertyValues } from 'lit';
import { customElement, property, queryAll } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { repeat } from 'lit/directives/repeat.js';
import app from '../../app';
import { BaseComponent } from '../../classes/base.component';
import { WebStreamController } from '../../reactive-controllers/web-stream.controller';
import { MediaStreamServiceEvents } from '../../services';
import { User } from '../../user';

import componentStyles from './user-card.scss';

@customElement('user-card')
export class UserCardComponent extends BaseComponent {

  static styles = [componentStyles];

  @queryAll('video.user-card__video')
  videoElement?: HTMLVideoElement[];

  @property()
  user?: User;

  @property({ type: Boolean, attribute: 'show-controls' })
  showControls = false;

  connectedCallback() {
    super.connectedCallback();

    setTimeout(() => {
      const videoElem = this.shadowRoot.querySelector('video');
      videoElem.srcObject = this.user.stream;
      videoElem.muted = true;
      videoElem.autoplay = true;
      videoElem.playsInline = true;
    }, 100);
  }

  render() {
    const userName = this.user.userID === app.currentUser.userID ? `You (${this.user.userID})` : this.user.userID;

    return html`
      <div class="user-card">
        <h3 class="user-card__user-name">${userName}</h3>
        <video class="user-card__video" autoplay playsinline></video>
      </div>
    `;
  }

  protected toggleTrack(track: MediaStreamTrack) {
    track.enabled = !track.enabled;

    this.requestUpdate();
  }
}
