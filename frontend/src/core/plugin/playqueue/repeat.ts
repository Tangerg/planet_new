export enum RepeatMode {
    OFF = 'off',
    ONE = 'one',
    ALL = 'all'
}

export class Repeat {
    private currentIndex: number = 0
    private readonly repeatModes: RepeatMode[] = [RepeatMode.OFF, RepeatMode.ONE, RepeatMode.ALL]

    get current(): RepeatMode {
        return this.repeatModes[this.currentIndex]
    }

    next(): RepeatMode {
        this.currentIndex = (this.currentIndex + 1) % this.repeatModes.length
        return this.current
    }
}