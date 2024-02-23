import {Playmode as PlaymodeType} from "../../types"
import {AbstractPlugin} from "../abstract-plugin";

class Playmode extends AbstractPlugin {
    private currentIndex: number = 0
    private models: PlaymodeType[] = ["sequence", "queue", "repeat", "shuffle"]

    init(): void {
        throw new Error("Method not implemented.");
    }

    name(): string {
        return this.fullname("playmode")
    }

    change(): PlaymodeType {
        this.currentIndex++
        if (this.currentIndex === this.models.length) {
            this.currentIndex = 0
        }
        return this.models[this.currentIndex]
    }
}
