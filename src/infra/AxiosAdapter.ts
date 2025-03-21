/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";
import { parseCookies } from "nookies";

// export const URL_API = "https://fe1c-187-180-188-14.ngrok-free.app";
export const URL_API = `https://api.territory-manager.com.br`;

type AxiosResponse<T> =
  | {
    status: number;
    data: T;
    message?: undefined;
  }
  | {
    status: any;
    message: any;
    data?: undefined;
  };

export class AxiosAdapter {
  constructor(private version = "v1") {
    axios.interceptors.request.use((config: any) => {
      const { token: tokenBearer } = parseCookies();
      if (tokenBearer) {
        config.headers["Authorization"] = `Bearer ${tokenBearer}`;
      }
      return config;
    });
  }

  async get<T>(url: string) {
    const httpConfig = { method: "get" };
    return await this.axiosConfig<T>(url, httpConfig);
  }

  async post<Body = any, Response = any>(url: string, data: Body) {
    const httpConfig = { method: "post", data };
    return await this.axiosConfig<Response>(url, httpConfig);
  }

  async put(url: string, data: any) {
    const httpConfig = { method: "put", data };
    return await this.axiosConfig(url, httpConfig);
  }

  async patch(url: string, data?: any): Promise<any> {
    const httpConfig = { method: "patch", data };
    return await this.axiosConfig(url, httpConfig);
  }

  async postFile(url: string, data: any) {
    const httpConfig = { method: "post", data };
    return await this.axiosConfigFileUpload(url, httpConfig);
  }

  async delete(url: string) {
    const httpConfig = { method: "delete" };
    return await this.axiosConfig(url, httpConfig);
  }

  private async axiosConfig<T>(
    url: string,
    httpConfig: any
  ): Promise<AxiosResponse<T>> {
    try {
      const config = {
        ...httpConfig,
      };

      const response = await axios(`${URL_API}/${this.version}/${url}`, config);
      return {
        status: response.status,
        data: response.data,
      };
    } catch (error: any) {
      return {
        status: error?.response?.status,
        message: error?.response?.data?.error,
      };
    }
  }

  private async axiosConfigFileUpload(url: string, httpConfig: any) {
    try {
      const config = {
        ...httpConfig,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      };
      const response = await axios(`${URL_API}/${this.version}/${url}`, config);
      return {
        status: response?.status,
        data: response?.data,
      };
    } catch (error: any) {
      return {
        status: error?.response?.status,
        message: error?.response?.data?.error,
      };
    }
  }
}
