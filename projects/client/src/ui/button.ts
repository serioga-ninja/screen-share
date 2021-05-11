import { AppElementBase } from './app-element-base';

export abstract class Button extends AppElementBase {
  abstract onClickEvent(ev: Event): void;

  constructor() {
    super();

    this.addEventListener('click', e => {
      this.onClickEvent(e);
    });
  }

  connectedCallback() {
    this.innerHTML = '<b>I\'m an x-foo-with-markup!</b>';
  }
}
