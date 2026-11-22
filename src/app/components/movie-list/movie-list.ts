import { Component, computed, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Movie } from '../../interfaces/movie';
import { MovieCategory, MovieService } from '../../services/movie-service';

@Component({
  imports: [],
  selector: 'app-movie-list',
  styleUrl: './movie-list.css',
  templateUrl: './movie-list.html',
})
export class MovieList implements OnInit {
  router = inject(Router);
  movieService = inject(MovieService)

  /** Titre affiché : libellé de la catégorie active. */
  activeLabel = computed(() =>
    this.movieService.categories.find(c => c.key === this.movieService.selectedCategory())?.label ?? ''
  );

  ngOnInit(): void {
    this.movieService.loadMovies(1);
  }

  selectCategory(category: MovieCategory): void {
    this.movieService.selectCategory(category);
  }

  loadMore(): void {
    this.movieService.loadMore();
  }

  navigateTo(movie: Movie) {

    this.router.navigate(['/',movie.id])

  }
}
