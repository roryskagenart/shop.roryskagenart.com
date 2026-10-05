/**
 * Universal Fourthwall Platform API types.
 *
 * These describe the wire format of the Fourthwall design pipeline.
 * They are NOT coupled to any specific shop, artwork catalogue, or product domain.
 *
 * Source of truth: https://docs.fourthwall.com/api-reference/platform/
 */

// ---------------------------------------------------------------------------
// Credentials & Auth
// ---------------------------------------------------------------------------

export interface FourthwallCredentials {
  /** Platform API base URL. Default: https://api.fourthwall.com */
  platformApiUrl?: string;
  /** OAuth Bearer token (preferred). */
  accessToken?: string;
  /** Basic auth username. */
  apiUsername?: string;
  /** Basic auth password. */
  apiPassword?: string;
}

export type AuthMode = 'bearer' | 'basic' | 'none';

// ---------------------------------------------------------------------------
// Product Templates
// ---------------------------------------------------------------------------

export interface ProductTemplate {
  /**
   * The template's canonical, opaque identifier — the only thing the API accepts.
   *
   * ⚠️ This field was previously declared as `id: string`, which the wire format has
   * never contained. Measured 2026-10-04 against `GET /open-api/v1.0/product-templates`:
   * the response keys templates by `productId` (`pro_…`) and carries no `id` at all.
   * A config built from a dashboard label like `"Mugz M065"` 404s with
   * `PRODUCT_CATALOG_PRODUCT_ID_NOT_FOUND` — the dashboard label is not an id. → T07
   */
  productId: string;
  name: string;
  category?: string;
  brand?: string;
  basePrice?: { amount: number; currency: string };
  productionMethod?: string;
  supportsBackendRendering?: boolean;
  slug?: string;
}

export interface TemplateArea {
  /**
   * Per-template identifier used by `regions[].region` when creating a design product.
   *
   * ⚠️ Measured `null` on real templates — e.g. `pro_lLYMnccJTqOijMduWMT-fA` (Area Rug) and
   * `pro_f0b3df34ce6144fb86` (Canvas (in)) both return `regionId: null` with `type: "front"`.
   * So a null regionId is a valid, orderable template, not a broken one. Do not type this as a
   * non-nullable `string` and do not filter nulls out — and do not hardcode a value, because
   * the same field is `"default"` on some templates and `"front"` on others. → T08
   */
  regionId: string | null;
  name?: string;
  type?: string;
  available?: boolean;
  dimensions?: {
    dpi?: number;
    pixelsWidth?: number;
    pixelsHeight?: number;
    inchesWidth?: number;
    inchesHeight?: number;
  };
  placements?: Array<{ id: string; name?: string }>;
}

/**
 * The full detail document for one template — `GET /product-templates/{productId}`.
 *
 * Sizes are **readable**, but not from a top-level field and not from `sizeGuide` (measured
 * `{url: null, content: null}` on every template). They live **nested**:
 * `colorVariants[].sizeVariants[].size`. Measured 2026-10-04 — 14 sizes on
 * `pro_15bc29bc8a324d449d`, 36 on `pro_kRSsoYjwSoyyTEmWko5o0A`, 1 on the candle.
 *
 * An earlier note here claimed no `sizes` field existed anywhere in the document. That was wrong, and
 * the error was costly: it was cited as the justification for transcribing sizes by hand, when the launch
 * had already read them from this endpoint to avoid exactly that. → T06
 */
export interface ProductTemplateDetail {
  productId: string;
  name: string;
  category?: string;
  brand?: string;
  slug?: string;
  description?: string;
  productionMethod?: string;
  supportsBackendRendering?: boolean;
  customizableAreas?: TemplateArea[];
  colorVariants?: Array<{
    color?: { name?: string; hex?: string };
    photos?: unknown[];
    status?: string;
    available?: boolean;
    /**
     * Per-size variants — **this is where a template's accepted sizes live.**
     *
     * ⚠️ Measured 2026-10-04. The detail document has NO top-level `sizes` or `sizeVariants`
     * key, and `sizeGuide` is `{url: null, content: null}` on every template — but the ladder is
     * nested at `colorVariants[].sizeVariants[].size`. An earlier note here asserted no such
     * field existed anywhere in the document; that was a partial read reported as a property of
     * the set, and it was costly: it justified transcribing sizes by hand when the endpoint had
     * already returned them. → T06
     *
     * Note `price` is per-size and in **dollars** (T09): the framed poster's smallest size is
     * $20.35 and its largest is a different figure on the same template. A single `profitMargin`
     * across a ladder therefore produces a price spread you did not choose.
     */
    sizeVariants?: Array<{
      variantId?: string;
      size?: string;
      price?: { amount: number; currency: string };
      available?: boolean;
    }>;
  }>;
  /** Convenience: every distinct `size` across all colour variants. Not from the wire format. */
  sizeGuide?: { url?: string | null; content?: string | null };
  minimumOrdersNumber?: number;
  priceFrom?: { amount: number; currency: string };
  priceTo?: { amount: number; currency: string };
}

// ---------------------------------------------------------------------------
// Media Upload
// ---------------------------------------------------------------------------

export interface UploadUrlRequest {
  fileName: string;
  contentType: string;
  size: number;
}

export interface UploadUrlResponse {
  uploadUrl: string;
  fileUrl: string;
}

export interface RegisterImageRequest {
  fileUrl: string;
  width: number;
  height: number;
}

export interface RegisterImageResponse {
  id: string;
}

// ---------------------------------------------------------------------------
// Design Product Creation
// ---------------------------------------------------------------------------

export type PlacementStrategy = 'AUTO' | 'FILL_ALL' | 'FULL_REGION' | 'PLACEMENT_ID';

export interface DesignRegion {
  region: string;
  imageId: string;
  placementStrategy: PlacementStrategy;
  placementId?: string;
}

export interface CreateDesignProductRequest {
  type: 'design';
  productTemplateId: string;
  name: string;
  description: string;
  regions: DesignRegion[];
  colors?: string[];
  sizes?: string[];
  profitMargin?: number;
  publishOnCreate?: boolean;
}

export interface CreateDesignProductResponse {
  productId: string;
  customizationId: string;
  images: Array<{
    url: string;
    width: number;
    height: number;
    style?: string;
    color?: string;
    size?: string;
    region?: string;
  }>;
}

// ---------------------------------------------------------------------------
// Product Listing
// ---------------------------------------------------------------------------

export interface ProductSummary {
  id: string;
  name: string;
  slug: string;
  description: string;
  type: string;
  state: { type: string };
  access: { type: string };
  images: Array<{
    id: string;
    url: string;
    width: number;
    height: number;
    transformedUrl: string;
  }>;
  variants: Array<{
    id: string;
    name: string;
    sku: string;
    unitPrice: { value: number; currency: string };
    attributes: {
      description: string;
      color?: { name: string; swatch: string };
      size?: { name: string };
    };
    stock: { type: 'UNLIMITED' | 'LIMITED'; inStock?: number };
    images: Array<{
      id: string;
      url: string;
      width: number;
      height: number;
      transformedUrl: string;
    }>;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface ListProductsResponse {
  results: ProductSummary[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
}

// ---------------------------------------------------------------------------
// Collections
// ---------------------------------------------------------------------------

export interface Collection {
  id: string;
  shopId: string;
  name: string;
  slug: string;
  description: string;
  available: boolean;
  state: { available: boolean; type: string };
  offerIds: string[];
}

export interface CreateCollectionRequest {
  name: string;
  description: string;
  offerIds: string[];
}

export interface SetCollectionProductsRequest {
  offerIds: string[];
}

// ---------------------------------------------------------------------------
// Seeder Configuration
// ---------------------------------------------------------------------------

/** A single artwork/image to be rendered onto merchandise. */
export interface SeederArtwork {
  /** Unique identifier — used for logging and deduplication. */
  id: string;
  /** Human-readable name — becomes the product name prefix. */
  name: string;
  /** Product description. */
  description: string;
  /** Source image URL (must be fetchable). */
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  /** MIME type of the source image. */
  imageContentType: 'image/png' | 'image/jpeg';
}

/** A template + margin configuration for a product line. */
export interface SeederTemplateConfig {
  templateId: string;
  templateName: string;
  /** Which customizable area to render into. */
  region: string;
  placementStrategy?: PlacementStrategy;
  /** USD profit margin over base cost. */
  profitMargin: number;
  /** Target retail price (informational). */
  targetPrice?: number;
  colors?: string[];
  sizes?: string[];
  publishOnCreate?: boolean;
}

/** A collection definition that groups products. */
export interface SeederCollectionConfig {
  handle: string;
  name: string;
  description: string;
  /** Which (artworkId, templateId) pairs belong here. */
  pairs: Array<{ artworkId: string; templateId: string }>;
}

/** Complete seed configuration. */
export interface SeederConfig {
  credentials: FourthwallCredentials;
  artworks: SeederArtwork[];
  templates: SeederTemplateConfig[];
  collections: SeederCollectionConfig[];
}

// ---------------------------------------------------------------------------
// Execution Result
// ---------------------------------------------------------------------------

export interface SeederResult {
  executionId: string;
  timestamp: string;
  products: Array<{
    artworkId: string;
    templateId: string;
    productId: string;
    name: string;
    imageId: string;
  }>;
  collections: Array<{
    handle: string;
    collectionId: string;
    name: string;
  }>;
  errors: Array<{
    artworkId?: string;
    templateId?: string;
    collectionHandle?: string;
    step: 'UPLOAD' | 'REGISTER' | 'CREATE_PRODUCT' | 'CREATE_COLLECTION' | 'SET_PRODUCTS';
    message: string;
    status?: number;
  }>;
}
