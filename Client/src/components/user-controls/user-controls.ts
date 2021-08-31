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
    const audioTrack = mediaStreamService.stream.getAudioTracks()[0];
    const videoTrack = mediaStreamService.stream.getVideoTracks()[0];

    return html`
      ${!audioTrack ? '' : html`
        <button type="button"
                class=${classMap({
                  red: !audioTrack.enabled,
                  green: audioTrack.enabled
                })}
                @click=${() => this.toggleTrack(audioTrack)}>${audioTrack.kind}
        </button>
      `}
      ${!videoTrack ? '' : html`
        <button type="button"
                class=${classMap({
                  red: !videoTrack.enabled,
                  green: videoTrack.enabled
                })}
                @click=${() => this.toggleTrack(videoTrack)}>${videoTrack.kind}
        </button>
      `}
    `;
  }

  protected toggleTrack(track: MediaStreamTrack) {
    track.enabled = !track.enabled;

    this.requestUpdate();
  }

  private shareScreen() {
    mediaStreamService.toggleVideo();
  }
}
