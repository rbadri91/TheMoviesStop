export interface UserListItem {
  id: number;
  mediaType: 'movie' | 'shows';
  title?: string;
  poster_path?: string;
}

export interface UserProfile {
  username: string;
  watchList: UserListItem[];
  favoritesList: UserListItem[];
}
