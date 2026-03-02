import { CommonModule, DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BLOG_POSTS } from './blog.data';

@Component({
  selector: 'app-blog',
  imports: [CommonModule, RouterLink, DatePipe],
  templateUrl: './blog.html',
  styleUrl: './blog.scss'
})
export class BlogPage {
  readonly posts = BLOG_POSTS;
}
