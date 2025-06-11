import {baseClient} from "$lib/api/client";

export interface Poll {
    id: string;
    question: string;
    options: Option[];
    createdby: string;
    createdat?: string;
    expiresat?: string;
}

export interface Option {
    id: string;
    text: string;
    votes: number;
    voters: string[];
    is_voted: boolean;
}

export const getPolls = async (
    workspaceId: string,
): Promise<Poll[]> => {
    try {
        const {data} = await baseClient.get(
            `/api/workspaces/${workspaceId}/poll`,
        );
        return data;
    } catch (e) {
        console.error(e);
        throw e;
    }
};

export const votePoll = async (
    workspaceId: string,
    pollId: string,
    optionId: string,
): Promise<void> => {
    try {
        await baseClient.post(
            `/api/workspaces/${workspaceId}/poll/${pollId}/vote/${optionId}`,
        );
    } catch (e) {
        console.error(e);
        throw e;
    }
}

export const unvotePoll = async (
    workspaceId: string,
    pollId: string,
    optionId: string,
): Promise<void> => {
    try {
        await baseClient.post(
            `/api/workspaces/${workspaceId}/poll/${pollId}/unvote/${optionId}`,
        );
    } catch (e) {
        console.error(e);
        throw e;
    }
}

export const createPoll = async (
    workspaceId: string,
    question: string,
    options: string[],
    expiresAt?: string,
): Promise<Poll> => {
    try {
        const {data} = await baseClient.post(
            `/api/workspaces/${workspaceId}/poll`,
            {
                question,
                options,
                expiresat: expiresAt,
            },
        );
        return data;
    } catch (e) {
        console.error(e);
        throw e;
    }
};

export const deletePoll = async (
    workspaceId: string,
    pollId: string,
): Promise<void> => {
    try {
        await baseClient.delete(
            `/api/workspaces/${workspaceId}/poll/${pollId}`,
        );
    } catch (e) {
        console.error(e);
        throw e;
    }
};