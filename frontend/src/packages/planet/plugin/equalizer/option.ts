export type Option = {
    type: BiquadFilterType
    frequency: number
    gain: number
}

export type Effect = {
    id: string
    gains: []
}

export class EqualizerOptionNormalizer {
    constructor() {
    }

    normalize(opt: Option): Option {
        return {
            type: opt.type,
            frequency: this.normalizeFrequency(opt.frequency),
            gain: this.normalizeGain(opt.gain)
        }
    }

    normalizeFrequency(v: number): number {
        if (v < 0) {
            return 0
        }
        if (v > 16000) {
            return 16000
        }
        return v
    }

    normalizeGain(v: number): number {
        if (v < -12) {
            return -12
        }
        if (v > 12) {
            return 12
        }
        return v
    }
}
