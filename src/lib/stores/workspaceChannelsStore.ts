import {
    createWorkspaceChannel, getPrivateChannels,
    getWorkspaceChannels,
    type Channel,
} from "$lib/api/workspaces/channels";
import { Store, StoreResultState, type StoreResult } from "./store.svelte";

export type WorkspaceChannelsStoreResult = {
    channels: Channel[];
    privateChannels: Channel[];
};

class WorkspaceChannelsStore extends Store<WorkspaceChannelsStoreResult> {
    public getDefaultState(): StoreResult<WorkspaceChannelsStoreResult> {
        return {
            state: StoreResultState.IDLE,
            data: {
                channels: [],
                privateChannels: [],
            },
        };
    }

    public async fetch(
        workspaceId: string,
    ): Promise<WorkspaceChannelsStoreResult> {
        this.changeState(StoreResultState.LOADING);
        const [channels, privateChannels] = await Promise.all([
            getWorkspaceChannels(workspaceId),
            getPrivateChannels(workspaceId),
        ]);

        this.changeStateAndData(StoreResultState.LOADED, {
            channels,
            privateChannels,
        });

        return this.getData();
    }


    public async create(
        workspaceId: string,
        name: string,
        topic: string,
        isPrivate: boolean,
        members: string[],
    ): Promise<Channel> {
        return createWorkspaceChannel(workspaceId, name, topic, isPrivate, members)
    }

    public put(channel: Channel): void {
        if (channel.isPrivate) {
            this.changeData({
                channels: this.getData().channels,
                privateChannels: [...this.getData().privateChannels, channel],
            });
        } else {
            this.changeData({
                channels: [...this.getData().channels, channel],
                privateChannels: this.getData().privateChannels,
            });
        }
    }
}

export default new WorkspaceChannelsStore();
