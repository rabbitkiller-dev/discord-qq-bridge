export function MatchUrlFromText(text: string): string[] {
	const regExp = new RegExp("(http|ftp|https)://([\\w+?\\.\\w+])+([a-zA-Z0-9\\~\\!\\@\\#\\$\\%\\^\\&\\*\\(\\)_\\-\\=\\+\\\\\\/\\?\\.\\:\\;\\'\\,\u4E00-\u9FFF]*)?", "g");
	return text.match(regExp);
}
