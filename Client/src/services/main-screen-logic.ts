import { UsersCollection, UsersCollectionEvents } from '../users-collection';

export class MainScreenLogic {
  constructor(private _users: UsersCollection) {
    _users.addEventListener(UsersCollectionEvents.Updated, () => this.userAdded());
  }

  userAdded() {

  }
}
