import { Genre, CastMember, CrewMember, Video, Review } from './movie.model';

export interface Network {
  id: number;
  name: string;
  logo_path: string | null;
  origin_country: string;
}

export interface Season {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  season_number: number;
  episode_count: number;
  air_date: string;
}

export interface Episode {
  id: number;
  name: string;
  overview: string;
  still_path: string | null;
  episode_number: number;
  season_number: number;
  air_date: string;
  vote_average: number;
}

export interface SeasonDetail {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  season_number: number;
  air_date: string;
  episodes: Episode[];
}

export interface Show {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids?: number[];
  genres?: Genre[];
  networks?: Network[];
  seasons?: Season[];
  number_of_seasons?: number;
  number_of_episodes?: number;
  credits?: { cast: CastMember[]; crew: CrewMember[] };
  videos?: { results: Video[] };
  reviews?: { results: Review[] };
  similar?: { results: Show[] };
  recommendations?: { results: Show[] };
  content_ratings?: { results: { iso_3166_1: string; rating: string }[] };
}

export interface ShowListResponse {
  results: Show[];
  total_pages: number;
  total_results: number;
  page: number;
}
