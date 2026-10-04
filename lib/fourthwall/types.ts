export type FourthwallMoney = {
  value: number;
  currency: string;
}

export type FourthwallCollection = {
  id: string;
  name: string;
  slug: string;
  description: string;
  updatedAt: string;
};

export type FourthwallProduct = {
  id: string;
  name: string;
  slug: string;
  description: string;

  images: FourthwallProductImage[];
  variants: FourthwallProductVariant[];

  /**
   * Sellability, as returned by the storefront API. Verified live 2026-10-03:
   * `state.type` is `AVAILABLE` / `SOLD_OUT`, `access.type` is `PUBLIC` / `ARCHIVED`.
   * Optional because the type predates these fields and several fixtures omit them —
   * so every read treats an absent value as "not asserted" rather than "bad".
   */
  state?: { type: string };
  access?: { type: string };

  updatedAt: string;
};

export type FourthwallProductImage = {
  id: string;
  url: string;
  transformedUrl: string;
  width: number;
  height: number;
};

export type FourthwallProductVariant = {
  id: string;
  name: string;
  sku: string;
  unitPrice: FourthwallMoney;

  images: FourthwallProductImage[];

  stock: {
    type: 'UNLIMITED' | 'LIMITED';
    inStock?: number;
  }

  // other attr
  attributes: {
    description: string;
    color?: {
      name: string;
      swatch: string;
    },
    size?: {
      name: string;
    };
  }

  product?: {
    id: string;
    slug: string;
    name: string;
  }
};

export type FourthwallCart = {
  id: string | undefined;
  items: FourthwallCartItem[];
};

export type FourthwallCartItem = {
  variant: FourthwallProductVariant;
  quantity: number;
};

export type FourthwallCheckout = {
  id: string
};

export type FourthwallShop = {
  id: string;
  name: string;
  domain: string;
  publicDomain: string;
};

export type FourthwallOgImageResponse = {
  url: string | null;
};
