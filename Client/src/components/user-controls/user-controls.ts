import { html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { BaseComponent } from '../../classes/base.component';
import { mediaStreamService, MediaStreamServiceEvents } from '../../services';

import userControlsStyles from './user-controls.scss';

@customElement('user-controls')
export class UserControls extends BaseComponent {

  static styles = [userControlsStyles];

  connectedCallback() {
    super.connectedCallback();

    mediaStreamService.stream.addEventListener(MediaStreamServiceEvents.ReplaceTrackJSEvent, () => this.requestUpdate());
  }

  protected render() {
    const audioTrack = mediaStreamService.audioTrack;
    const webCamTrack = mediaStreamService.webCamTrack;
    const screenShareTrack = mediaStreamService.screenShareTrack;

    return html`
      <div class="user-controls">
        <button type="button"
                class=${classMap({
                  red: !audioTrack?.enabled,
                  green: audioTrack?.enabled
                })}
                @click=${() => this.toggleAudio()}>Audio
        </button>
        <button type="button"
                class=${classMap({
                  red: !webCamTrack?.enabled,
                  green: webCamTrack?.enabled
                })}
                @click=${() => this.toggleWebCam()}>WebCam
        </button>
        <button type="button"
                class=${classMap({
                  red: !screenShareTrack?.enabled,
                  green: screenShareTrack?.enabled
                })}
                @click=${() => this.toggleScreenShare()}>Share Screen
        </button>
      </div>
    `;
  }

  async toggleAudio() {
    if (!mediaStreamService.hasAudio) {
      await mediaStreamService.useAudio();
    } else {
      mediaStreamService.audioTrack.enabled = !mediaStreamService.audioTrack.enabled;
    }

    this.requestUpdate();
  }

  async toggleWebCam() {
    if (!mediaStreamService.webCamInProgress) {
      await mediaStreamService.useWebCamVideo();
    } else {
      mediaStreamService.turnOffWebCam();
    }

    this.requestUpdate();
  }

  async toggleScreenShare() {
    if (!mediaStreamService.screenShareInProgress) {
      await mediaStreamService.useScreenVideo();
    } else {
      mediaStreamService.turnOffScreenShare();
    }

    this.requestUpdate();
  }
}
