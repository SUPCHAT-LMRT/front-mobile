import { goto as _goto } from "$app/navigation";

type GotoOptions = {
  replaceState?: boolean | undefined;
  noScroll?: boolean | undefined;
  keepFocus?: boolean | undefined;
  invalidateAll?: boolean | undefined;
  state?: App.PageState | undefined;
};

export function goto(
  url: string,
  params?: { [key: string]: string },
  opts?: GotoOptions,
) {
  if (params && Object.keys(params).length > 0) {
    url = url.includes("?") ? url + "&" : url + "?";

    for (const [key, value] of Object.entries(params)) {
      url += key + "=" + value + "&";
    }
  }
  if (url.endsWith("&")) {
    url = url.substring(0, url.length - 1);
  }

  _goto(url, opts);
}
