// If the name has multiple words, take the first letter of each word (3 max) and return them as initials.
export const fallbackAvatarLetters = (name: string) => {
	const initials = name
		.split(" ")
		.map((word) => word[0])
		.join("")
		.toUpperCase();
	return initials.length > 3 ? initials.slice(0, 3) : initials;
};