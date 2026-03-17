export type AddressItem = {
  address_id: number | string;
  FullName: string;
  phone1: string;
  phone2?: string;
  email?: string;
  address: string;
  city: string;
  district?: string;
  state: string;
  country: string;
  pinCode: string;
  addressType?: string;
  address_line2?: string;
};

export type AddressPayload = {
  FullName: string;
  phone1: string;
  phone2: string;
  email: string;
  address: string;
  address_line2: string;
  district: string;
  city: string;
  state: string;
  country: string;
  pinCode: string;
  addressType: string;
};
