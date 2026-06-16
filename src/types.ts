/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Activity {
  id: string;
  title: string;
  date: string;
  location: string;
  description: string;
  category: string;
  image: string;
  mediaType?: 'image' | 'video' | '';
}

export interface ItineraryItem {
  id: string;
  event: string;
  date: string;
  time: string;
  location: string;
  host: string;
  status: 'Confirmed' | 'Tentative' | 'Past' | string;
  notes?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | '';
}

export interface Inquiry {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  date: string;
  status: 'Unread' | 'Read' | string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

export interface MusicData {
  songTitle: string;
  artistName: string;
  albumName: string;
  audioUrl: string;
  coverUrl: string;
  quoteText: string;
  label: string;
  lyrics?: string;
}

export interface Leader {
  id: string;
  name: string;
  role: string;
  image: string;
  bio?: string;
  phone?: string;
}
