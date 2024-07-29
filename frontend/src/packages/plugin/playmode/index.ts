import {Plugin} from "../../core";

export enum Mode {
    Sequence = "sequence",
    Queue = "queue",
    Repeat = "repeat",
    Shuffle = "shuffle",
}


export class Playmode extends Plugin {
    private _currentIndex: number = 0
    private modes: Mode[] = [Mode.Sequence, Mode.Queue, Mode.Repeat, Mode.Shuffle];

    public static id: string = "playmode"
    get id(): string {
        return Playmode.id
    }

    dispose(): void {
    }

    get current(): Mode {
        return this.modes[this._currentIndex]
    }

    private next(): void {
        if (this._currentIndex === this.modes.length - 1) {
            this._currentIndex = 0
        } else {
            this._currentIndex++
        }
    }
}

export default Playmode
