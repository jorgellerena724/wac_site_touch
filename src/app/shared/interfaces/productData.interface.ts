export interface ProductImage {
  title: string;
  media: string;
}

export interface ProductData {
  id: number;
  title: string;
  description: string;
  category: string;
  imageUrl: string;
  photo: string;
  mediaType?: 'image' | 'video';
  files?: ProductImage[];
  variants: ProductVariant[];
  imageLoaded: boolean;
}

export interface ProductVariant {
  description: string;
  price: number;
}

export interface CategoryData {
  id: number;
  title: string;
}
