export enum RoomKind {
	UNKNOWN = "UNKNOWN",
	DIRECT = "DIRECT",
	GROUP = "GROUP",
	CHANNEL = "CHANNEL",
}

let currentOpenedRoom = {
	id: "",
	kind: RoomKind.UNKNOWN,
};

export const setCurrentOpenedRoom = (roomId: string, roomKind: RoomKind) => {
	currentOpenedRoom = {
		id: roomId,
		kind: roomKind,
	};
};

export const getCurrentOpenedRoom = (): typeof currentOpenedRoom => {
	return currentOpenedRoom;
};