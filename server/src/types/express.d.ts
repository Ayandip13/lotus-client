import { IPartner } from '../modules/partners/partner.model';

export interface AuthenticatedUserPayload {
  userId: string;
  partnerId: string;
  username: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUserPayload;
      partner?: IPartner;
    }
  }
}
