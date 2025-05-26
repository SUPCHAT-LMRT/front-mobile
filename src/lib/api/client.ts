import axios from "axios";
import { env } from "$env/dynamic/public";
import { refreshAccessToken } from "./user";

export const baseClient = axios.create({
  baseURL: env.PUBLIC_API_ORIGIN,
  withCredentials: true,
});

const maxRetry = 3;
let retry = 0;

baseClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error?.config;

    if (error?.response?.status === 401 && !config?.sent && retry < maxRetry) {
      config.sent = true;
      retry++;

      const response = await refreshAccessToken();
      if (response.status === 204) {
        retry = 0;
      }
      return baseClient(config);
    }
    return Promise.reject(error);
  },
);
