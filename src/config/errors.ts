export class ApplicationError extends Error {
  code: number;
  data?: any;
  constructor(message: string, statusCode = 500, data?: any) {
    super(message);
    this.code = statusCode;
    this.data = data;
  }
}
