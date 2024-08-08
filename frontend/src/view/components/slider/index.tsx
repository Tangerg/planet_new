import React from "react";
import {Slider as StdSlider, SliderProps} from "@fluentui/react-components";
import {SliderOnChangeData} from "@fluentui/react-slider";
import {debounce} from "../../../packages/shared-utils/function";


interface Props extends SliderProps {
    // Todo 换一种实现
    onChangeComplete?: (data: SliderOnChangeData) => void
}

const Slider: React.FC<Props> = (props) => {
    const {onChange, onChangeComplete} = props
    const onChangeCompleteWrap = onChangeComplete ? debounce(onChangeComplete, 300) : undefined
    const onChangeWrap = (ev: React.ChangeEvent<HTMLInputElement>, data: SliderOnChangeData) => {
        onChange?.(ev, data)
        onChangeCompleteWrap?.(data)
    }
    const newProps = {
        ...props,
        onChange: onChangeWrap
    }
    return <>
        <StdSlider
            {
                ...newProps
            }/>
    </>
}
export default Slider