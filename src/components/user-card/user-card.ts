import { query } from 'express';
import { css, html, LitElement, PropertyValues } from 'lit';
import { customElement, property, queryAll } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

import componentStyles from './user-card.scss';

@customElement('user-card')
export class UserCardComponent extends LitElement {

  static styles = [componentStyles];

  @queryAll('video.user-card__video')
  videoElement?: HTMLVideoElement[];

  @property()
  stream?: MediaStream;

  @property({ type: Boolean, attribute: 'show-controls' })
  showControls = false;

  render() {
    return html`
      <div class="user-card">
        <video class="user-card__video" autoplay playsinline ?muted="${this.showControls}"></video>
        <div class="user-card__controls" ?hidden="${!this.showControls || !this.stream}">
          <button type="button"
                  class=${classMap({
                    red: !this.stream?.getVideoTracks()[0].enabled,
                    green: !!this.stream?.getVideoTracks()[0].enabled
                  })}
                  @click=${this.toggleVideo.bind(this)}>Video
          </button>
          <button type="button"
                  class=${classMap({
                    red: !this.stream?.getAudioTracks()[0].enabled,
                    green: !!this.stream?.getAudioTracks()[0].enabled
                  })}
                  @click=${this.toggleAudio.bind(this)}>Audio
          </button>
        </div>
      </div>
    `;
  }

  protected toggleVideo() {
    this.stream?.getVideoTracks().forEach(track => track.enabled = !track.enabled);
    this.requestUpdate();
  }

  protected toggleAudio() {
    this.stream?.getAudioTracks().forEach(track => track.enabled = !track.enabled);
    this.requestUpdate();
  }

  protected updated(_changedProperties: PropertyValues) {
    super.updated(_changedProperties);

    if (_changedProperties.has('stream') && this.videoElement) {
      this.videoElement[0].srcObject = this.stream as MediaStream;
    }
  }
}
