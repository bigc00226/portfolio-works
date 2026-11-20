'use client';
/* Opens the visitor statistics of this page load (lib/track-client.ts). In the list page's and the player's layouts. */
import { useEffect } from 'react';
import { startView } from '@/lib/track-client';

export function Tracker() {
  useEffect(() => { startView(); }, []);
  return null;
}
