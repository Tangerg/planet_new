import {Plugin} from "../../core";

class Analyser extends Plugin {
    private frequencyData!: Uint8Array<ArrayBuffer>
    private analyserNode!: AnalyserNode
    private state: "running" | "suspended" = "suspended"

    public static readonly id = "Analyser"

    get id(): string {
        return Analyser.id
    }

    protected onInit(): void {
        this.analyserNode = new AnalyserNode(
            this.context.audioContext,
            {
                fftSize: 256
            })
        this.frequencyData = new Uint8Array(new ArrayBuffer(this.analyserNode.frequencyBinCount))
    }

    public resume(): void {
        if (this.state === "running") {
            return
        }
        this.state = "running"
        this.analyserNode.connect(this.context.audioContext.destination)
        this.analyseFrequency()
    }

    private suspend(): void {
        if (this.state === "suspended") {
            return
        }
        this.state = "suspended"
        this.analyserNode.disconnect()
    }

    dispose(): void {
        this.suspend()
        this.analyserNode = null as any;
        this.frequencyData = null as any;
    }

    private refreshFrequencyData() {
        this.analyserNode.getByteFrequencyData(this.frequencyData)
    }

    private analyseFrequency = () => {
        if (this.state === "suspended") {
            return
        }
        this.refreshFrequencyData()
        this.onFrequencyDataChanged()
        requestAnimationFrame(this.analyseFrequency)
    }

    private onFrequencyDataChanged() {
        console.log(this.frequencyData)
    }
}

export default Analyser