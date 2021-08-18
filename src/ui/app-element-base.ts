export abstract class AppElementBase extends HTMLElement {
  static get observedAttributes() {
    return ['disabled'];
  }

  get disabled() {
    return this.hasAttribute('disabled');
  }

  set disabled(val) {
    if (val) {
      this.setAttribute('disabled', '');
    } else {
      this.removeAttribute('disabled');
    }

  }
}
