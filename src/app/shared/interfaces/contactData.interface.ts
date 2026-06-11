export interface SocialNetwork {
  network: string;
  url: string;
  username: string;
  active: boolean;
}

export interface ContactData {
  id: number;
  address: string;
  email: string;
  social_networks?: SocialNetwork[];
}
