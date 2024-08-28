import React from "react";
import NeteaseCloudMusic from "../../../packages/provider/NeteaseCloudMusic";
import {useQuery} from "@tanstack/react-query";
import {Card, CardFlow} from "../../components/card-flow";
import Title from "../../components/title";
import {createLazyFileRoute, Link} from "@tanstack/react-router";


const api = new NeteaseCloudMusic({host: "http://localhost:3000"})
const Home: React.FC = () => {
    const {data, isLoading}
        = useQuery({
        queryKey: ["personalized"],
        queryFn: async () => {
            return await api.personalized()
        }
    })
    if (isLoading) {
        return <div>Loading</div>
    }
    console.log(data)
    return <div>
        <Title content={"Playlists for you"}/>
        <CardFlow>
            {data?.playlists.map(playlist => {
                return <Link
                    to={"/playlist/$playlistId"}
                    params={{
                        playlistId: playlist.id!,
                    }}
                    key={playlist.id}
                >
                    <Card
                        title={playlist.name!}
                        thumbnail={playlist.image!}
                        shape={"rounded"}/>
                </Link>
            })}
        </CardFlow>
        <Title content={"Albums for you"}/>
        <CardFlow>
            {data?.albums!.map(al => {
                return <Link
                    to={"/album/$albumId"}
                    params={{
                        albumId: al.id!,
                    }}
                    key={al.id}
                >
                    <Card
                        title={al.name!}
                        subTitle={al.artist?.name}
                        thumbnail={al.image!}
                    />
                </Link>
            })}
        </CardFlow>
        <Title content={"Artists for you"}/>
        <CardFlow>
            {data?.artists!.map(ar => {
                return <Card
                    shape={"circular"}
                    title={ar.name!}
                    subTitle={ar.alias![0]}
                    thumbnail={ar.image!}
                    key={ar.id}
                />
            })}
        </CardFlow>
    </div>
}

export const Route = createLazyFileRoute('/home/')({
    component: Home
})