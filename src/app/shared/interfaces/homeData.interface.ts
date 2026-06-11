export interface HomeData {
  id: number;
  title: string;
  description: string;
  charge?: string;
  fecha: string;
  photo: string;
  imageUrl: string;
  mediaType?: 'image' | 'video';
  star_rating?: number;
}
