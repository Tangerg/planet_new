/**
 * QQMusic provider — public surface. Everything QQ (the provider class, raw
 * types, and field mapper) lives in this folder; only the provider class is
 * exposed. The composition root constructs it via the `@providers` barrel and
 * talks to it through registered context ports.
 */
export { QQMusic } from "./QQMusic";
