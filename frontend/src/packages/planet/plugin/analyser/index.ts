import {Plugin} from "../plugin";

class Analyser extends Plugin {
    private frequencyData!: Uint8Array
    private analyserNode!: AnalyserNode
    private state: "running" | "suspended" = "suspended"

    constructor() {
        super();
        this.init()
    }

    init(): void {
        this.analyserNode = new AnalyserNode(
            this.planet.audioContext,
            {
                fftSize: 256
            }
        )
        this.frequencyData = new Uint8Array(this.analyserNode.frequencyBinCount)
    }

    name(): string {
        return this.fullname("analyser")
    }

    private resume(): void {
        this.state = "running"
        this.analyserNode.connect(this.planet.audioContext.destination)
        this.analyseFrequency(this.onFrequencyDataChange)
    }

    private suspend(): void {
        this.state = "suspended"
        this.analyserNode.disconnect()
    }

    private analyseFrequency(func?: Function) {
        const refresh = () => {
            if (this.state === "suspended") {
                return
            }
            this.analyserNode.getByteFrequencyData(this.frequencyData)
            func?.()
            requestAnimationFrame(refresh)
        }
        refresh()
    }

    private onFrequencyDataChange() {
        console.log(this.frequencyData)
    }
}
