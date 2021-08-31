export interface IUserOptions {
  roomId: string;
  userId: string;

}

const defaultOptions: Partial<IUserOptions> = {} as const;

export class User {


  constructor(private _stream: MediaStream, options: Partial<IUserOptions> = {}) {
    options = {
      ...defaultOptions,
      ...options
    };

  }
}
