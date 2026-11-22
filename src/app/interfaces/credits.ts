export interface Cast {
    id: number;
    name: string;
    character: string;
    profile_path: string | null;
    order: number;
}

export interface Credits {
    id: number;
    cast: Cast[];
}
