export interface KnownForItem {
  id: number;
  media_type: 'movie' | 'tv';
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  poster_path: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
}

export interface PersonCredit {
  id: number;
  media_type: 'movie' | 'tv';
  title?: string;
  name?: string;
  character?: string;
  job?: string;
  department?: string;
  poster_path: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  releaseYear?: string;
}

export interface TaggedImage {
  file_path: string;
  media_type: 'movie' | 'tv';
  media: {
    id: number;
    media_type: 'movie' | 'tv';
    title?: string;
    name?: string;
    poster_path: string | null;
    vote_average: number;
    release_date?: string;
    first_air_date?: string;
  };
}

export interface Person {
  id: number;
  name: string;
  biography: string;
  birthday: string | null;
  deathday: string | null;
  place_of_birth: string | null;
  profile_path: string | null;
  gender: number;
  known_for_department: string;
  imdb_id: string | null;
  also_known_as?: string[];
  known_for?: KnownForItem[];
  knownFor?: string;
  combined_credits?: { cast: PersonCredit[]; crew: PersonCredit[] };
  images?: { profiles: { file_path: string }[] };
  tagged_images?: { results: TaggedImage[] };
}

export interface PersonListResponse {
  results: Person[];
  total_pages: number;
  total_results: number;
  page: number;
}
