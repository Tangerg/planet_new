import {Plugin} from "../../core";

enum Mode {
    Sequence = "sequence",
    Queue = "queue",
    Repeat = "repeat",
    Shuffle = "shuffle",
}


export class Playmode extends Plugin {
    private current: number = 0
    private modes: Mode[] = [Mode.Sequence, Mode.Queue, Mode.Repeat, Mode.Shuffle];

    public static id: string = "playmode"
    get id(): string {
        return Playmode.id
    }

    dispose(): void {
    }

    get currentMode(): Mode {
        return this.modes[this.current]
    }

    private next(): void {
        if (this.current === this.modes.length - 1) {
            this.current = 0
        } else {
            this.current++
        }
    }
}

export default Playmode
