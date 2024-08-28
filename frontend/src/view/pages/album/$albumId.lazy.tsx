import React from "react";
import TrackList from "../../components/track-list";
import NeteaseCloudMusic from "../../../packages/provider/NeteaseCloudMusic";
import {useQuery} from "@tanstack/react-query";
import {Track} from "../../../packages/model/track";
import Banner from "../../components/banner";
import {createLazyFileRoute} from "@tanstack/react-router";

const api = new NeteaseCloudMusic({host: "http://localhost:3000"})
const Album: React.FC = () => {
    const {albumId} = Route.useParams()
    console.log(albumId)
    const {data, isLoading} = useQuery({
        queryKey: ["album", albumId],
        queryFn: async () => {
            return await api.albumDetail(albumId)
        }
    })
    if (isLoading) {
        return <div>Loading</div>
    }
    return <>
        <Banner
            category={"Album"}
            title={data?.name!}
            image={data?.image!}
            time={data?.publishTime!}
            user={{
                id: data?.artist?.id!,
                nickname: data?.artist?.name!,
                image: data?.image!,
            }}
            trackCount={data?.trackCount!}
            durationCount={data?.durationCount!}
        />
        <TrackList hiddenAlbum tracks={data?.tracks as Track[]}/>
    </>
}

export const Route = createLazyFileRoute('/album/$albumId')({
    component: Album
})