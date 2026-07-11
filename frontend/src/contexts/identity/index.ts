/** Identity Context public API. */
export { IdentityService } from "@core/application/IdentityService";
export { Account } from "@domain/model/account";
export type { AccountSnapshot } from "@domain/model/account";
export { AuthSession } from "@domain/model/auth";
export type { LoginFlow, LoginStatus } from "@domain/model/auth";
export type { ActiveIdentitySource, IdentityGateway, IdentitySourcePort } from "@domain/ports/auth";
export type { CredentialStore } from "@domain/ports/credentials";
