import {FC} from "react";
import {Image} from "@nextui-org/react";
interface LeftControlsProps {

}

const LeftControls:FC<LeftControlsProps> = (props) =>{
    return <div className={"left-controls-wrapper"}>
        <div className={"left-controls"}>
            <div className={"left-controls_thumbnail"}>
                <Image
                    width={55}
                    height={55}
                    alt="Loading"
                    src="https://app.requestly.io/delay/5000/https://nextui-docs-v2.vercel.app/images/hero-card-complete.jpeg"
                />
            </div>
            <div className={"left-controls_meta"}>
                <span className={"left-controls_meta-title"}>花田错</span>
                <span className={"left-controls_meta-artists"}>王力宏</span>
            </div>
        </div>
    </div>
}
export default LeftControls