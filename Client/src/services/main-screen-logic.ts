import { Subject } from 'rxjs';
import { User } from '../user';
import { UsersCollection, UsersCollectionEvents } from '../users-collection';

const MIN_MAIN_SCREEN_TIME = 5000;

export class MainScreenLogic {
  mainScreenUser: Subject<User> = new Subject<User>();
  nextMainScreenUser: User;

  constructor(private _users: UsersCollection) {
    _users.addEventListener(UsersCollectionEvents.Updated, () => this.userAdded());

    setTimeout(() => {
      this.selectUser();
    }, MIN_MAIN_SCREEN_TIME);
  }

  userAdded() {
    this.calculateNextUser();
  }

  calculateNextUser() {
    if (this._users.length === 1) {
      this.nextMainScreenUser = this._users.currentUser;
    } else if (this._users.length === 2) {
      this.nextMainScreenUser = this._users.firstNotCurrentUser;
    }
  }

  selectUser() {
    this.mainScreenUser.next(this.nextMainScreenUser);
  }
}
