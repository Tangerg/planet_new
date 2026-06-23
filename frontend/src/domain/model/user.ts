import type {Image} from "./image";

/**
 * User, aligned with the Spotify User object (displayName + images).
 */
export type User = {
    id: string
    displayName: string
    images?: Image[]
}
