import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { IconDefinition, faCalendarDays, faFilm, faLanguage, faStar, faUser, faUsers } from '@fortawesome/free-solid-svg-icons';
import { catchError, forkJoin, of, switchMap } from 'rxjs';
import { Cast } from '../../interfaces/credits';
import { Movie } from '../../interfaces/movie';
import { MovieService } from '../../services/movie-service';

interface InfoCard {
  label: string;
  icon: IconDefinition;
  value: string | number;
}

@Component({
  imports: [FaIconComponent],
  selector: 'app-movie-detail',
  styleUrl: './movie-detail.css',
  templateUrl: './movie-detail.html',
})
export class MovieDetail implements OnInit {

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  protected movieService = inject(MovieService);

  protected readonly imageBase = 'https://image.tmdb.org/t/p/w500';
  protected readonly profileBase = 'https://image.tmdb.org/t/p/w185';
  protected readonly faStar = faStar;
  protected readonly faUser = faUser;

  /** Acteurs principaux et films similaires affichés sous la fiche. */
  protected cast = signal<Cast[]>([]);
  protected similar = signal<Movie[]>([]);

  /** Cartes d'information affichées à côté de l'affiche. */
  protected infoCards = computed<InfoCard[]>(() => {
    const movie = this.movieService.Selectedmovie();
    if (!movie) return [];
    return [
      { label: 'Original title', icon: faFilm, value: movie.original_title },
      { label: 'Original language', icon: faLanguage, value: this.languageName(movie.original_language) },
      { label: 'Release date', icon: faCalendarDays, value: this.formatDate(movie.release_date) },
      { label: 'Vote average', icon: faStar, value: movie.vote_average.toFixed(1) + ' / 10' },
      { label: 'Vote count', icon: faUsers, value: movie.vote_count.toLocaleString('en-US') },
    ];
  });

  protected inWishList = computed(() => {
    const movie = this.movieService.Selectedmovie();
    return !!movie && this.movieService.wishList().some(m => m.id === movie.id);
  });

  private languageName(code: string): string {
    try {
      return new Intl.DisplayNames(['en'], { type: 'language' }).of(code) ?? code;
    } catch {
      return code;
    }
  }

  private formatDate(date: string): string {
    return date
      ? new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
      : '-';
  }

  ngOnInit(): void {
    // Se redéclenche à chaque changement d'id (ex. clic sur un film similaire)
    this.route.paramMap.pipe(
      switchMap(params => {
        const id = Number(params.get('id'));
        this.movieService.Selectedmovie.set(null);
        this.cast.set([]);
        this.similar.set([]);
        window.scrollTo({ top: 0 });

        return forkJoin({
          movie: this.movieService.getMovieById(id),
          cast: this.movieService.getCast(id).pipe(catchError(() => of([] as Cast[]))),
          similar: this.movieService.getSimilarMovies(id).pipe(catchError(() => of([] as Movie[]))),
        });
      })
    ).subscribe(({ movie, cast, similar }) => {
      this.movieService.Selectedmovie.set(movie);
      this.cast.set(cast.slice(0, 12));
      this.similar.set(similar.filter(m => m.poster_path).slice(0, 12));
    });
  }

  openMovie(movie: Movie): void {
    this.router.navigate(['/', movie.id]);
  }

  goBack(): void {
    this.location.back();
  }

  addToWishList(): void {
    const movie = this.movieService.Selectedmovie();
    if (movie) this.movieService.addToWishList(movie);
  }
}
