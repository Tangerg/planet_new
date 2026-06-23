export function warn(msg: string): string {
  const error = `[Planet warn]: ${msg}`;
  console.error(error);
  return error;
}

export function assert(condition: string | boolean, msg: string) {
  if (!condition) {
    throw new Error("[Planet Assert]: " + msg);
  }
}
