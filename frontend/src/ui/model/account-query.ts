export type AccountQueryPlanInput = {
  loggedIn: boolean;
  authSupported: boolean;
};

export function accountQueryEnabled({ loggedIn, authSupported }: AccountQueryPlanInput): boolean {
  return loggedIn && authSupported;
}
