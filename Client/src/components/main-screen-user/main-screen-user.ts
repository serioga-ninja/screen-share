import { html } from 'lit';
import { customElement } from 'lit/decorators.js';
import app from '../../app';
import { BaseComponent } from '../../classes';
import { User } from '../../user';
import componentStyles from './main-screen-user.scss';

@customElement('main-screen-user')
export class MainScreenUser extends BaseComponent {
  static styles = [componentStyles];

  user: User;

  constructor() {
    super();

    app.mainScreenLogic.mainScreenUser.subscribe(user => {
      this.user = user;

      this.requestUpdate();
    });
  }

  protected render() {
    return html`
      <main-screen-user-card></main-screen-user-card>
    `;
  }
}
