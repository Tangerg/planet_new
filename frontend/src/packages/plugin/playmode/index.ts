import {Plugin} from "../../core";

export enum Mode {
    Sequential = "sequential",
    Loop = "loop",
    Repeat = "repeat",
    Shuffle = "shuffle",
}


export class Playmode extends Plugin {
    private currentIndex: number = 0
    private modes: Mode[] = [Mode.Sequential, Mode.Loop, Mode.Repeat, Mode.Shuffle];

    public static readonly id: string = "Playmode"
    get id(): string {
        return Playmode.id
    }

    dispose(): void {
    }

    get current(): Mode {
        return this.modes[this.currentIndex]
    }

    private next(): void {
        this.currentIndex = (this.currentIndex + 1) % this.modes.length
    }
}

export default Playmode
