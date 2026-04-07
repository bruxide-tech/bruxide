export type CanvasSize = 'instagram' | 'landscape' | 'story';
export type LayoutType = 'news' | 'announcement' | 'event' | 'promotion';
export type AccentColor = 'red' | 'blue' | 'yellow' | 'black' | 'white';

export interface Design {
  id: string;
  name: string;
  size: CanvasSize;
  layout: LayoutType;
  subheading: string;
  description: string;
  category: string;
  imageUrl: string | null;
  imageFilters?: {
    brightness: number;
    contrast: number;
    saturation: number;
    blur: number;
    grayscale: number;
    sepia: number;
  };
  gradient?: {
    color: string;
    opacity: number;
    height: number; // percentage of canvas
  };
  accentColor: AccentColor;
  lastModified: number;
}

export interface Preset {
  id: string;
  name: string;
  settings: Partial<Design>;
}

export const CANVAS_SIZES: Record<CanvasSize, { width: number; height: number; label: string }> = {
  instagram: { width: 1080, height: 1080, label: 'Instagram Post' },
  landscape: { width: 1920, height: 1080, label: 'Landscape Post' },
  story: { width: 1080, height: 1920, label: 'Story / Reel' },
};

export const ACCENT_COLORS: Record<AccentColor, string> = {
  red: '#ef4444',
  blue: '#3b82f6',
  yellow: '#f59e0b',
  black: '#000000',
  white: '#ffffff',
};
