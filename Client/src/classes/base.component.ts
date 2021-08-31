import { LitElement } from 'lit';
import { Subject } from 'rxjs';

export abstract class BaseComponent extends LitElement {
  disconnected$ = new Subject();

  disconnectedCallback() {
    super.disconnectedCallback();
    this.disconnected$.complete();
  }
}
