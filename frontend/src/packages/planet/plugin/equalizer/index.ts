import {Plugin} from "../plugin";
import {Effect, BiquadFilterOptions, EqualizerOptionNormalizer, Option} from "./biquadFilterOptions";
import {IManager} from "../../core";

export class Equalizer extends Plugin {
    private normalizer: EqualizerOptionNormalizer

    private mediaElementAudioSourceNode!: MediaElementAudioSourceNode
    private biquadFilterNodes!: BiquadFilterNode[]
    private biquadFilterNodeChain!: BiquadFilterNode
    private effectManager!: IManager<Effect>

    private state: "running" | "suspended" = "suspended"

    constructor(opt?: Option) {
        super();
        this.normalizer = new EqualizerOptionNormalizer()
        this.init()
        this.initBiquadFilterNodes(opt?.biquadFilters || [])
        this.initEffects(opt?.effects || [])
        this.connectBiquadFilterNodes()
    }


    init(): void {
        this.mediaElementAudioSourceNode = new MediaElementAudioSourceNode(
            this.planet.audioContext,
            {
                mediaElement: this.planet.audioElement
            }
        )
    }

    name(): string {
        return this.fullname("equalizer")
    }

    private initBiquadFilterNodes(opts: BiquadFilterOptions[]) {
        opts.forEach(opt => {
            const normalized = this.normalizer.normalize(opt)
            const biquadFilterNode = new BiquadFilterNode(this.planet.audioContext, {
                type: normalized.type,
                frequency: normalized.frequency,
                gain: normalized.gain
            })
            this.biquadFilterNodes.push(biquadFilterNode)
        })
    }

    private initEffects(effects: Effect[]) {
        this.effectManager.apply(effects)
    }

    connectBiquadFilterNodes() {
        this.biquadFilterNodeChain = this.biquadFilterNodes.reduce((previousValue, currentValue) => {
            previousValue.connect(currentValue)
            return currentValue
        })
    }

    private resume(): void {
        this.state = "running"
        this.mediaElementAudioSourceNode.connect(this.biquadFilterNodeChain).connect(this.planet.audioContext.destination)
    }

    private suspend(): void {
        this.state = "suspended"
        this.mediaElementAudioSourceNode.disconnect()
        this.biquadFilterNodeChain.disconnect()
    }


    useEffect(id: string) {
        if (!this.effectManager.has(id)) {
            return
        }
        const effect = this.effectManager.get(id) as Effect

        const min = Math.min(effect.gains.length, this.biquadFilterNodes.length)
        for (let i = 0; i < min; i++) {
            this.biquadFilterNodes[i].gain.value = effect.gains[i]
        }
    }
}

export default Equalizer
