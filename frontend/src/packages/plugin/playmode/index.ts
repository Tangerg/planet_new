import {Plugin} from "../../core";

export type Mode = "sequence" | "queue" | "repeat" | "shuffle"

export class Playmode extends Plugin {
    private current: number = 0
    private modes: Mode[] = ["sequence", "queue", "repeat", "shuffle"];

    public static id: string = "playmode"
    get id(): string {
        return Playmode.id
    }

    dispose(): void {
    }

    get currentMode(): Mode {
        return this.modes[this.current]
    }

    next(): void {
        if (this.current === this.modes.length - 1) {
            this.current = 0
        } else {
            this.current++
        }
    }
}

export default Playmode
