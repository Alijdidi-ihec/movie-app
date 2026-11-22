import { HttpClient } from "@angular/common/http";
import { computed, inject, Injectable, signal } from "@angular/core";
import { environment } from "../../environments/environment.development";
import { map, Observable } from "rxjs";
import { Movie } from "../interfaces/movie";
import { MovieResponse } from "../interfaces/movie-response";
import { Cast, Credits } from "../interfaces/credits";

export type MovieCategory = 'now_playing' | 'popular' | 'top_rated' | 'upcoming';

export interface CategoryOption {
    key: MovieCategory;
    label: string;
}

@Injectable({
    providedIn: 'root'

})
export class MovieService {

    private readonly http = inject(HttpClient)
    private readonly key = environment.apiKey
    private readonly movieUrl = environment.url_movie_api

    /** Catégories proposées dans la liste des films. */
    public readonly categories: CategoryOption[] = [
        { key: 'now_playing', label: 'Now Playing' },
        { key: 'popular', label: 'Popular' },
        { key: 'top_rated', label: 'Top Rated' },
        { key: 'upcoming', label: 'Upcoming' },
    ];

    public movieList = signal<Movie[]>([]);
    public Selectedmovie = signal<Movie | null>(null);
    public wishList = signal<Movie[]>([]);

    // État de la liste : catégorie, recherche et pagination
    public selectedCategory = signal<MovieCategory>('now_playing');
    public searchTerm = signal('');
    public page = signal(1);
    public totalPages = signal(1);
    public loading = signal(false);
    public hasMore = computed(() => this.page() < this.totalPages());

    isInWishList(id: number): boolean {
        return this.wishList().some(m => m.id === id);
    }

    addToWishList(movie: Movie): void {
        this.wishList.update(list =>
            this.isInWishList(movie.id) ? list.filter(m => m.id !== movie.id) : [...list, movie]
        );
    }

    /** Change de catégorie et recharge la première page. */
    selectCategory(category: MovieCategory): void {
        this.selectedCategory.set(category);
        this.loadMovies(1);
    }

    /** Charge une page de la catégorie courante (la page 1 remplace la liste, les suivantes s'ajoutent). */
    loadMovies(page = 1): void {
        const category = this.selectedCategory();
        this.loading.set(true);

        this.http.get<MovieResponse>(`${this.movieUrl}${category}`, {
            params: { api_key: this.key, page }
        }).subscribe({
            next: response => {
                // Réponse obsolète : l'utilisateur a changé de catégorie entre-temps
                if (category !== this.selectedCategory()) return;

                const items = this.applySearch(response.results);
                this.movieList.update(current => {
                    if (page === 1) return items;
                    const known = new Set(current.map(m => m.id));
                    return [...current, ...items.filter(m => !known.has(m.id))];
                });
                this.page.set(response.page);
                this.totalPages.set(response.total_pages);
                this.loading.set(false);
            },
            error: () => this.loading.set(false)
        });
    }

    /** Charge la page suivante de la catégorie courante. */
    loadMore(): void {
        if (this.hasMore() && !this.loading()) {
            this.loadMovies(this.page() + 1);
        }
    }

    private applySearch(list: Movie[]): Movie[] {
        const term = this.searchTerm().trim().toLowerCase();
        return term ? list.filter(m => m.title.toLowerCase().includes(term)) : list;
    }

    getMovieById(id: number): Observable<Movie> {
        return this.http.get<Movie>(`${this.movieUrl}${id}`, { params: { api_key: this.key } });
    }

    /** Distribution du film (acteurs principaux en premier). */
    getCast(id: number): Observable<Cast[]> {
        return this.http.get<Credits>(`${this.movieUrl}${id}/credits`, { params: { api_key: this.key } }).pipe(
            map(credits => credits.cast)
        );
    }

    /** Films similaires proposés par TMDB. */
    getSimilarMovies(id: number): Observable<Movie[]> {
        return this.http.get<MovieResponse>(`${this.movieUrl}${id}/similar`, { params: { api_key: this.key } }).pipe(
            map(response => response.results)
        );
    }

}
