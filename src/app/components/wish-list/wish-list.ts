import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faHeartCrack, faStar, faTrashCan } from '@fortawesome/free-solid-svg-icons';
import { Movie } from '../../interfaces/movie';
import { MovieService } from '../../services/movie-service';

@Component({
  imports: [FaIconComponent],
  selector: 'app-wish-list',
  styleUrl: './wish-list.css',
  templateUrl: './wish-list.html',
})
export class WishList {

  private router = inject(Router);
  protected movieService = inject(MovieService);

  protected readonly imageBase = 'https://image.tmdb.org/t/p/w500';
  protected readonly faStar = faStar;
  protected readonly faTrashCan = faTrashCan;
  protected readonly faHeartCrack = faHeartCrack;

  openMovie(movie: Movie): void {
    this.router.navigate(['/', movie.id]);
  }

  /** Retire le film de la liste (addToWishList agit comme un interrupteur). */
  remove(movie: Movie): void {
    this.movieService.addToWishList(movie);
  }

  goToMovies(): void {
    this.router.navigate(['/']);
  }
}
