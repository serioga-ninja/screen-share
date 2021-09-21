import { css, html, LitElement, PropertyValues } from 'lit';
import { customElement, property, queryAll } from 'lit/decorators.js';
import app from '../../app';
import { User } from '../../user';
import { UserCardComponent } from '../user-card/user-card';

import componentStyles from './main-screen-user-card.scss';

@customElement('main-screen-user-card')
export class MainScreenUserCardComponent extends UserCardComponent {

  static styles = [componentStyles];

  @queryAll('video')
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
    const stream = this.user.stream;
    const userName = this.user.userID === app.currentUser.userID ? 'You' : this.user.userID;

    return html`
      <div class="main-screen-user-card">
        <h3 class="main-screen-user-card__user-name">${userName}</h3>
        <video class="main-screen-user-card__video" autoplay playsinline></video>
      </div>
    `;
  }

  protected toggleTrack(track: MediaStreamTrack) {
    track.enabled = !track.enabled;

    this.requestUpdate();
  }
}
