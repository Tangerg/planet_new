import {Plugin} from "../../core";

export class PlayQueue extends Plugin {
    public static id: string = "playqueue"
    get id(): string {
        return PlayQueue.id
    }


    dispose(): void {
    }
}

