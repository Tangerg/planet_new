import {Planet} from "./core";
import {Lyric, Volume, Play} from "./core";
import Provider from "../provider";


const lrc = new Lyric()
const v = new Volume()
const p = new Play()
const p1 = new Provider()
Planet.use(lrc).use(v).use(p).use(p1)

const pl = new Planet()
