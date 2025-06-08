let currentSelectedWorkspace = "";

export const setCurrentSelectedWorkspace = (workspaceId: string) => {
	currentSelectedWorkspace = workspaceId;
};

export const getCurrentSelectedWorkspace =
	(): typeof currentSelectedWorkspace => {
		return currentSelectedWorkspace;
	};