import { User } from './user';

export enum UsersCollectionEvents {
  Updated = 'updated'
}

export class UsersCollection extends EventTarget {
  private _map: Map<string, User> = new Map<string, User>();

  get length() {
    return this._map.size;
  }

  get currentUser(): User | undefined {
    return this.toArray().find((user) => user.currentUser);
  }

  get firstNotCurrentUser(): User | undefined {
    return this.toArray().find((user) => !user.currentUser);
  }

  toArray(): User[] {
    return Array.from(this._map).map(([_userID, user]) => user);
  }

  set(userID: string, user: User): this {
    this._map.set(userID, user);

    user.setCollection(this);

    this.dispatchEvent(new CustomEvent(UsersCollectionEvents.Updated, {
      detail: {
        user
      }
    }));

    return this;
  }

  get(userID: string): User | undefined {
    return this._map.get(userID);
  }

  delete(userID: string): User | undefined {
    const user = this.get(userID);

    this._map.delete(userID);

    this.dispatchEvent(new CustomEvent(UsersCollectionEvents.Updated, {
      detail: {
        user
      }
    }));

    return user;
  }
}
