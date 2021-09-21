import { css, html, LitElement, PropertyValues } from 'lit';
import { customElement, property, queryAll } from 'lit/decorators.js';
import app from '../../app';
import { BaseComponent } from '../../classes';
import { User } from '../../user';
import { UserCardComponent } from '../user-card/user-card';

import componentStyles from './main-screen-user-card.scss';

@customElement('main-screen-user-card')
export class MainScreenUserCardComponent extends BaseComponent {

  static styles = [componentStyles];

  user?: User;

  connectedCallback() {
    super.connectedCallback();

    app.mainScreenLogic.mainScreenUser.subscribe(user => {
      this.user = user;

      const videoElem = this.shadowRoot.querySelector('video');
      videoElem.srcObject = this.user.stream;
      this.requestUpdate();
    });
  }

  render() {
    const userName = this.user?.userID === app.currentUser?.userID ? `You (${this.user?.userID})` : this.user?.userID;

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
