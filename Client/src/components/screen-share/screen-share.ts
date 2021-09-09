import { html } from 'lit';
import { customElement, } from 'lit/decorators.js';
import app, { App } from '../../app';
import { BaseComponent } from '../../classes/base.component';
import { ScreenShareController } from '../../reactive-controllers/screen-share.controller';
import { repeat } from 'lit/directives/repeat.js';
import { User } from '../../user';

import componentStyles from './screen-share.scss';

@customElement('screen-share')
export class ScreenShare extends BaseComponent {
  static styles = [componentStyles];

  private readonly _app: App;
  private readonly _screenShareController: ScreenShareController;
  private mainScreenUser?: User;

  constructor() {
    super();

    this._app = app;
    this._screenShareController = new ScreenShareController(this, this._app);

    app.mainScreenLogic.mainScreenUser.subscribe(user => {
      const needUpdate = this.mainScreenUser?.userID !== user?.userID;

      this.mainScreenUser = user;

      needUpdate && this.requestUpdate();
    });
  }

  render() {
    const users = this._app.users.toArray().filter(user => {
      return user.userID !== this.mainScreenUser?.userID;
    });

    return html`
      <div class="screen-share">
        <div class="screen-share__remote-streams">
          ${repeat(users, (user) => user.userID, (user) => html`
              <user-card .user=${user}></user-card>
            `
          )}
        </div>
        <main-screen-user class="screen-share__main-screen"></main-screen-user>
        <user-controls class="screen-share__controls"></user-controls>
      </div>
    `;
  }
}
