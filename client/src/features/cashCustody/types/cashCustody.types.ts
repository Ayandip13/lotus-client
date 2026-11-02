export type CashMovementType =
  | 'CASH_INCOME_ASSIGNED'
  | 'PARTNER_HANDOVER'
  | 'BANK_DEPOSIT'
  | 'BANK_WITHDRAWAL'
  | 'CASH_EXPENSE'
  | 'OPENING_BALANCE';

export interface PartnerCashBalance {
  partnerId: string;
  partnerName: string;
  partnerEmail?: string;
  partnerPhone?: string;
  cashInHand: number;
  cashInHandPaise: number;
}

export interface CashCustodyOverview {
  partners: PartnerCashBalance[];
  totalBusinessCashInHand: number;
  totalBusinessCashInHandPaise: number;
  commonBusinessBankBalance: number;
  commonBusinessTotalBalance: number;
}

export interface CashMovementItem {
  _id: string;
  movementType: CashMovementType;
  amount: number;
  amountPaise: number;
  movementDate: string;
  fromPartner?: {
    _id: string;
    name: string;
    email?: string;
  };
  toPartner?: {
    _id: string;
    name: string;
    email?: string;
  };
  sourceAccount: string;
  destinationAccount: string;
  description: string;
  relatedEvent?: {
    _id: string;
    title: string;
    eventDate: string;
  };
  createdByPartner: {
    _id: string;
    name: string;
  };
  createdAt: string;
}
