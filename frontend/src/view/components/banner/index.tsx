import React from "react";
import {banner, bannerContent} from "./style"
import {Image, Avatar} from "@fluentui/react-components"
import {User} from "../../../packages/model/user";
import {formatDurationMillisecond, Minute} from "../../../packages/shared-utils/time";

interface BannerProps {
    category: "Album" | "Playlist"
    title: string
    image: string
    user: User
    time: number
    trackCount: number
    durationCount: number
}

const formatDuration = (duration: number): string => {
    const dur = formatDurationMillisecond(duration)
    const durs = dur.split(":").map(Number)
    const rv: string[] = []
    if (durs[0] > 0) {
        rv.push(`${durs[0]} hr`)
    }
    if (durs[1] > 0) {
        rv.push(`${durs[1]} min`)
    }
    rv.push(`${durs[2]} sec`)
    return rv.join(" ")
}
const BannerContent: React.FC<BannerProps> = (props) => {
    const {category, title, image, user, time, trackCount, durationCount} = props;
    const classes = banner()
    const classes2 = bannerContent()
    return <div className={classes.content}>
        <div/>
        <div className={classes2.thumbnail}>
            <Image
                shape={"rounded"}
                src={image}/>
        </div>
        <div className={classes2.meta}>
            <div>{category}</div>
            <div className={classes2.meta_title}>
                <h1>
                    {title}
                </h1>
            </div>
            <div className={classes2.meta_creator}>
                <span>
                    <Avatar
                        size={28}
                        image={{
                            src: user.image,
                        }}/>
                </span>
                <span>{user.nickname}</span>
                <span>·</span>
                <span>{new Date(time).getFullYear()}</span>
            </div>
            <div className={classes2.meta_tracks}>
                <span>{trackCount} songs, {formatDuration(durationCount)}</span>
            </div>
        </div>
    </div>
}
const Banner: React.FC<BannerProps> = (props) => {
    const classes = banner()
    return <div className={classes.root}>
        <div className={classes.background}/>
        <div className={classes.backgroundmask}/>
        <BannerContent {...props}/>
    </div>
}
export default Banner