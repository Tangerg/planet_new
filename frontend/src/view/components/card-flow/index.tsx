import React from "react";
import {cardFlow, card} from "./style";
import {Image} from "@fluentui/react-components";

interface CardProps {
    thumbnail: string
    shape?: 'circular' | 'rounded';
    title: string;
    subTitle?: string;
}

export const Card: React.FC<CardProps> = (props) => {
    const classes = cardFlow()
    const classes2 = card()
    const {thumbnail, shape = "rounded", title, subTitle} = props
    return <div className={classes.card}>
        <div className={classes2.background}/>
        <div className={classes2.thumbnail}><Image
            shape={shape}
            width={"100%"}
            height={"100%"}
            src={thumbnail}/>
        </div>
        <div className={classes2.text}>
            <div className={classes2.text_column}>
                <div className={classes2.text_primary}>
                    <h5>{title}</h5>
                </div>
                {subTitle &&
                    <div className={classes2.text_second}>
                        <p>{subTitle}</p>
                    </div>
                }
            </div>
        </div>
    </div>
}

export const CardFlow: React.FC<React.PropsWithChildren> = (props) => {
    const {children} = props
    const classes = cardFlow()
    return <div className={classes.root}>{children}</div>
}

export default CardFlow