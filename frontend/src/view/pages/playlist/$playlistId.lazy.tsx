import React from "react";
import {createLazyFileRoute} from '@tanstack/react-router'
import NeteaseCloudMusic from "../../../packages/provider/NeteaseCloudMusic";
import {useQuery} from "@tanstack/react-query";
import Banner from "../../components/banner";
import {User} from "../../../packages/model/user";
import TrackList from "../../components/track-list";
import {Track} from "../../../packages/model/track";
import {usePlanet} from "../../hooks/usePlanet";

const api = new NeteaseCloudMusic({host: "http://localhost:3000"})

const Playlist: React.FC = () => {
    const {playlistId} = Route.useParams()
    const {data, isLoading} = useQuery({
        queryKey: ["playlist", playlistId],
        queryFn: async () => {
            return api.playlistDetail(playlistId)
        }
    })
    if (isLoading) {
        return <div>Loading</div>
    }
    const planet = usePlanet()
    const onRowClick = async (item: Track, items?: Track[]) => {
        const ids = items?.map(v => v.id)
        const urls = await api.playUrls(ids!)
        urls.forEach(url => {
            items?.forEach(t => {
                if (t.id === url.id) {
                    t.playUrl = url.playUrl
                }
            })
        })
        planet.hooks.emit("change_play_queue", {
            key: `playlist_${playlistId}`,
            tracks: items,
            track: item
        })
    }
    return <>
        <Banner
            category={"Playlist"}
            title={data?.name!}
            image={data?.image!}
            time={data?.createTime!}
            user={data?.creator! as User}
            trackCount={data?.trackCount!}
            durationCount={data?.durationCount!}
        />
        <TrackList onRowClick={onRowClick} tracks={data?.tracks as Track[]}/>
    </>
}

export const Route = createLazyFileRoute('/playlist/$playlistId')({
    component: Playlist
})
