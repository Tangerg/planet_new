export function warn(msg: string): string {
  const error = `[Planet warn]: ${msg}`;
  console.error(error);
  return error;
}
