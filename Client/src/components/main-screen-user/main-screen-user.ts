import { html } from 'lit';
import { customElement } from 'lit/decorators.js';
import app from '../../app';
import { BaseComponent } from '../../classes';
import { User } from '../../user';

@customElement('main-screen-user')
export class MainScreenUser extends BaseComponent {
  user: User;

  constructor() {
    super();

    app.mainScreenLogic.mainScreenUser.subscribe(user => {
      this.user = user;

      this.requestUpdate();
    });
  }

  protected render() {
    if (!this.user) return '';


    return html`
      <user-card .user=${this.user}></user-card>
    `;
  }
}
