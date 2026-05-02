import { Service } from './service';

export interface AccountLoginParams {
  arl?: string;
  client_id?: string;
  app_version?: string;
  app_locale?: string;
  [key: string]: any;
}

export interface Account {
  uuid: string;
  service: Service | string;
  active: boolean;
  login?: AccountLoginParams;
}
