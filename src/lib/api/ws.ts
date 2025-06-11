import { env } from "$env/dynamic/public";
import { refreshAccessToken } from "$lib/api/user";
import {
	getCurrentOpenedRoom,
	RoomKind,
	setCurrentOpenedRoom
} from "./currentOpenedRoom";
import {
	getCurrentSelectedWorkspace,
	setCurrentSelectedWorkspace,
} from "./currentSelectedWorkspace";

class Ws {
	private subscribers: { subscriptionId: string; callback: (msg: any) => void }[] = [];
	private ws: WebSocket;
	private messageQueue: any[] = [];
	private connectionCrashed = false;

	public initWebSocket = async () => {
		// If the WebSocket is already open, do nothing
		if (this.ws && this.ws.readyState === WebSocket.OPEN) {
			return;
		}

		try {
			await refreshAccessToken();
		} catch (error) {
			console.error("Failed to refresh access token", error);
			setTimeout(() => this.initWebSocket(), 1000); // Retry after 1s
			return;
		}
		this.ws = new WebSocket(env.PUBLIC_API_WS);

		this.ws.onopen = () => {
			console.log("WebSocket connected");

			if (this.connectionCrashed) {
				console.log("WebSocket connection restored, rejoining room...");
				const currentOpenedRoom = getCurrentOpenedRoom();
				if (currentOpenedRoom?.id !== "") {
					this.joinRoom(currentOpenedRoom.id, currentOpenedRoom.kind);
				}
				const currentSelectedWorkspace = getCurrentSelectedWorkspace();
				if (currentSelectedWorkspace !== "") {
					this.selectWorkspace(currentSelectedWorkspace);
				}
				this.connectionCrashed = false;
			}

			// Send any queued messages
			while (this.messageQueue.length > 0) {
				this.ws.send(this.messageQueue.shift());
			}
		};

		this.ws.onclose = (event) => {
			this.connectionCrashed = true;
			console.log("WebSocket closed, retrying...", event);
			setTimeout(() => this.initWebSocket(), 1000); // Retry after 1s
		};

		this.ws.onerror = (error) => {
			console.error("WebSocket error:", error);
		};

		this.ws.onmessage = (event) => {
			this.handleNewMessage(event);
		};
	};

	public send = (message: any) => {
		if (this.ws?.readyState === WebSocket.OPEN) {
			this.ws.send(message);
		} else if (this.ws?.readyState === WebSocket.CONNECTING) {
			console.log(
				`WebSocket still connecting, queuing message ${message}...`,
			);
		}
		this.messageQueue.push(message);
	};

	private handleNewMessage = (event: any) => {
		let data = event.data;
		data = data.split(/\r?\n/);

		for (let i = 0; i < data.length; i++) {
			const msg = JSON.parse(data[i]);
			switch (msg.action) {
				case "channel-room-joined":
					this.handleChannelRoomJoined(msg);
					break;
				case "direct-room-joined":
					this.handleDirectRoomJoined(msg);
					break;
				default:
					break;
			}

			this.subscribers.forEach((subscriber) => {
				subscriber.callback(msg);
			});
		}
	};

	private handleChannelRoomJoined = ({ roomId }: { roomId: string }) => {
		setCurrentOpenedRoom(roomId, RoomKind.CHANNEL);
	};

	private handleDirectRoomJoined = ({
		otherUserId,
	}: {
		roomId: string;
		otherUserId: string;
	}) => {
		setCurrentOpenedRoom(otherUserId, RoomKind.DIRECT);
	};

	public sendChannelMessage = (roomId: string, message: any) => {
		this.send(
			JSON.stringify({
				action: "send-channel-message",
				content: message,
				channelId: roomId,
			}),
		);
	};

	public sendDirectMessage = (otherUserId: string, message: any) => {
		this.send(
			JSON.stringify({
				action: "send-direct-message",
				content: message,
				otherUserId,
			}),
		);
	};

	public joinRoom = (roomId: string, roomKind: RoomKind) => {
		const currentOpenedRoom = getCurrentOpenedRoom();
		if (currentOpenedRoom.id !== "") {
			this.leaveRoom(currentOpenedRoom.id);
		}

		switch (roomKind) {
			case RoomKind.DIRECT:
				this.send(
					JSON.stringify({ action: "join-direct-room", otherUserId: roomId }),
				);
				break;
			case RoomKind.GROUP:
				this.send(
					// TODO handle group rooms
					JSON.stringify({ action: "join-group-room", message: roomId }),
				);
				break;
			case RoomKind.CHANNEL:
				this.send(
					JSON.stringify({ action: "join-channel-room", channelId: roomId }),
				);
				break;
			default:
				throw new Error("Invalid room kind " + roomKind);
		}
	};

	public asyncChannelJoinRoom = async (
		roomId: string,
		roomKind: RoomKind,
	): Promise<string> => {
		return new Promise<string>((resolve) => {
			const unsubscribe = this.subscribe("channel-room-joined", (msg) => {
				resolve(msg.roomId);
				unsubscribe();
			});

			this.joinRoom(roomId, roomKind);
		});
	};

	public asyncDirectJoinRoom = async (
		roomId: string,
		roomKind: RoomKind,
	): Promise<{ roomId: string; otherUserId: string }> => {
		return new Promise<{ roomId: string; otherUserId: string }>((resolve) => {
			const unsubscribe = this.subscribe("direct-room-joined", (msg) => {
				resolve({ roomId: msg.roomId, otherUserId: msg.otherUserId });
				unsubscribe();
			});

			this.joinRoom(roomId, roomKind);
		});
	};

	public selectWorkspace = (workspaceId: string) => {
		const currentSelectedWorkspace = getCurrentSelectedWorkspace();
		if (currentSelectedWorkspace) {
			this.unselectWorkspace();
		}
		setCurrentSelectedWorkspace(workspaceId);
		this.send(
			JSON.stringify({ action: "select-workspace", workspaceId: workspaceId }),
		);
	};

	public unselectWorkspace = () => {
		if (getCurrentSelectedWorkspace() === "") {
			return;
		}
		setCurrentSelectedWorkspace("");
		this.send(JSON.stringify({ action: "unselect-workspace" }));
	};

	public leaveRoom = (roomId: string) => {
		setCurrentOpenedRoom("", RoomKind.UNKNOWN);
		this.send(JSON.stringify({ action: "leave-room", roomId: roomId }));
	};

	public toggleChannelMessageReaction = (
		roomId: string,
		messageId: string,
		reaction: string,
	) => {
		this.send(
			JSON.stringify({
				action: "channel-message-reaction-toggle",
				roomId,
				messageId,
				reaction,
			}),
		);
	};

	public toggleDirectMessageReaction = (
		otherUserId: string,
		messageId: string,
		reaction: string,
	) => {
		this.send(
			JSON.stringify({
				action: "direct-message-reaction-toggle",
				otherUserId,
				messageId,
				reaction,
			}),
		);
	};

	public subscribe = (
		action: string,
		callback: (msg: any) => void,
	): (() => void) => {
		const subscriptionId = Math.random().toString(36);
		this.subscribers = [
			...this.subscribers,
			{
				subscriptionId,
				callback: (msg) => {
					if (msg.action === action) {
						callback(msg);
					}
				},
			},
		];

		return () => this.unsubscribe(subscriptionId);
	};

	public unsubscribe = (subscriptionId: string) => {
		for (let i = 0; i < this.subscribers.length; i++) {
			if (this.subscribers[i].subscriptionId === subscriptionId) {
				this.subscribers.splice(i, 1);
				break;
			}
		}
	};

	private mapRoomKind = (roomKind: string): RoomKind => {
		switch (roomKind) {
			case "direct":
				return RoomKind.DIRECT;
			case "group":
				return RoomKind.GROUP;
			case "channel":
				return RoomKind.CHANNEL;
			default:
				return RoomKind.UNKNOWN;
		}
	};
}

export default new Ws();