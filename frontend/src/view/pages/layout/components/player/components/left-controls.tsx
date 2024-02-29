import {FC} from "react";
import {Image} from "@nextui-org/react";

interface LeftControlsProps {

}

const Thumbnail: FC = () => {
    return <div className={"left-controls_thumbnail"}>
        <Image
            width={50}
            height={50}
            radius={"full"}
            removeWrapper={true}
            src="https://nextui-docs-v2.vercel.app/images/album-cover.png"
        />
    </div>
}

const Meta: FC = () => {
    return <div className={"left-controls_meta"}>
        <span className={"left-controls_meta-title"}>花田错</span>
        <span className={"left-controls_meta-artists"}>王力宏</span>
    </div>
}
const LeftControls: FC<LeftControlsProps> = (props) => {
    return <div className={"left-controls-wrapper"}>
        <div className={"left-controls"}>
            <Thumbnail/>
            <Meta/>
        </div>
    </div>
}
export default LeftControls
