import { UsersCollection, UsersCollectionEvents } from '../users-collection';

const MIN_MAIN_SCREEN_TIME_MS = 10000;
const audioCtx = new (window.AudioContext || window.webkitAudioContext)(); // define audio context
const analyser = audioCtx.createAnalyser();


export class MainScreenLogic {
  constructor(private _users: UsersCollection) {
    _users.addEventListener(UsersCollectionEvents.Updated, () => this.userAdded());
  }

  userAdded() {

  }
}
