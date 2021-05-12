import express, { Express, Request, Response } from 'express';

export class Router {
  private _router: Express;

  get router() {
    return this._router;
  }


  constructor() {
    this._router = express();

    this._router.get('/:id', this.stream.bind(this));
  }

  stream(req: Request, res: Response) {

  }
}
