export interface Genre {
  id: number;
  name: string;
}

export interface ProductionCompany {
  id: number;
  name: string;
  logo_path: string | null;
  origin_country: string;
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
}

export interface CrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path: string | null;
}

export interface Video {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
}

export interface Review {
  id: string;
  author: string;
  content: string;
  url: string;
}

export interface Movie {
  id: number;
  title: string;
  name?: string; // TV show compat when used as union
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids?: number[];
  genres?: Genre[];
  runtime?: number;
  tagline?: string;
  production_companies?: ProductionCompany[];
  credits?: { cast: CastMember[]; crew: CrewMember[] };
  videos?: { results: Video[] };
  reviews?: { results: Review[] };
  similar?: { results: Movie[] };
  recommendations?: { results: Movie[] };
  releases?: { countries: { certification: string; iso_3166_1: string }[] };
  alternative_titles?: { titles: { title: string; iso_3166_1: string }[] };
  spoken_languages?: { iso_639_1: string; name: string }[];
  homepage?: string;
  budget?: number;
  revenue?: number;
  original_title?: string;
}

export interface MovieListResponse {
  results: Movie[];
  total_pages: number;
  total_results: number;
  page: number;
}

export interface UserMediaStatus {
  isInFavoritesList: boolean;
  isInWatchList: boolean;
}
