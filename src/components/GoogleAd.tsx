import React, { useEffect } from 'react';
import { cn } from '../lib/utils';

interface GoogleAdProps {
  slot: string;
  format?: 'auto' | 'fluid' | 'rectangle';
  responsive?: boolean;
  className?: string;
}

export const GoogleAd: React.FC<GoogleAdProps> = ({ 
  slot, 
  format = 'auto', 
  responsive = true,
  className 
}) => {
  const clientId = import.meta.env.VITE_GOOGLE_ADSENSE_CLIENT_ID;

  useEffect(() => {
    if (clientId) {
      try {
        // @ts-ignore
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) {
        console.error('AdSense error:', e);
      }
    }
  }, [clientId]);

  if (!clientId) {
    return (
      <div className={cn(
        "bg-gray-50/50 border border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center p-6 text-center",
        className
      )}>
        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mb-2">
          <span className="text-gray-400 text-xs font-bold">Ad</span>
        </div>
        <p className="text-gray-400 text-[10px] font-medium uppercase tracking-wider mb-1">Advertisement Space</p>
        <p className="text-gray-300 text-[9px]">Configure VITE_GOOGLE_ADSENSE_CLIENT_ID to display ads</p>
      </div>
    );
  }

  return (
    <div className={cn("overflow-hidden w-full", className)}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={clientId}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? 'true' : 'false'}
      />
    </div>
  );
};
