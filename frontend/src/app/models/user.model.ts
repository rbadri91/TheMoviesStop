export interface UserListItem {
  id: number;
  mediaType: 'movie' | 'shows';
  title?: string;
  poster_path?: string;
  ratingValue?: number;
}

export interface UserProfile {
  username: string;
  watchList: UserListItem[];
  favoritesList: UserListItem[];
  ratings: UserListItem[];
}
