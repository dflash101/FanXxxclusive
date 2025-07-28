import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ItemPrice {
  id: string;
  profile_id: string;
  item_index: number;
  item_type: 'photo' | 'video';
  price_cents: number;
}

export const useItemPrices = (profileId: string) => {
  const [prices, setPrices] = useState<ItemPrice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadItemPrices = async () => {
      try {
        const { data, error } = await supabase
          .from('item_prices')
          .select('*')
          .eq('profile_id', profileId);

        if (error) {
          console.error('Error loading item prices:', error);
          setPrices([]);
        } else {
          setPrices(data || []);
        }
      } catch (error) {
        console.error('Error loading item prices:', error);
        setPrices([]);
      } finally {
        setLoading(false);
      }
    };

    if (profileId) {
      loadItemPrices();
    }
  }, [profileId]);

  const getItemPrice = (itemIndex: number, itemType: 'photo' | 'video'): number => {
    const priceItem = prices.find(p => p.item_index === itemIndex && p.item_type === itemType);
    return priceItem?.price_cents || (itemType === 'photo' ? 499 : 999); // Default prices in cents
  };

  const setItemPrice = async (itemIndex: number, itemType: 'photo' | 'video', priceCents: number) => {
    try {
      const { error } = await supabase
        .from('item_prices')
        .upsert({
          profile_id: profileId,
          item_index: itemIndex,
          item_type: itemType,
          price_cents: priceCents
        }, {
          onConflict: 'profile_id,item_index,item_type'
        });

      if (error) {
        console.error('Error setting item price:', error);
        return false;
      }

      // Update local state
      setPrices(prev => {
        const filtered = prev.filter(p => !(p.item_index === itemIndex && p.item_type === itemType));
        return [...filtered, {
          id: `temp-${Date.now()}`,
          profile_id: profileId,
          item_index: itemIndex,
          item_type: itemType,
          price_cents: priceCents
        }];
      });

      return true;
    } catch (error) {
      console.error('Error setting item price:', error);
      return false;
    }
  };

  return {
    prices,
    loading,
    getItemPrice,
    setItemPrice
  };
};