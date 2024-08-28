import React from "react";
import {makeStyles, mergeClasses, Slider as StdSlider, SliderProps, sliderClassNames} from "@fluentui/react-components";


interface Props extends SliderProps {

}

const styles = makeStyles({
    thumb: {
        [`> .${sliderClassNames.thumb}`]: {
            transition: 'opacity 0.3s ease',
            opacity: 0,
            width: "15px",
            height: "15px",
        },
        ':hover': {
            [`& .${sliderClassNames.thumb}`]: {
                opacity: 1,
            },
        },
    },
})

const Slider: React.FC<Props> = (props) => {
    const classes = styles()
    const newProps = {
        ...props,
    }
    return <StdSlider className={mergeClasses(sliderClassNames.thumb, classes.thumb)} {...newProps}/>
}
export default Slider