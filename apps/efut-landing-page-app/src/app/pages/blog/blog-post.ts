import { CommonModule, DatePipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BLOG_POSTS } from './blog.data';

@Component({
  selector: 'app-blog-post',
  imports: [CommonModule, RouterLink, DatePipe],
  templateUrl: './blog-post.html',
  styleUrl: './blog-post.scss'
})
export class BlogPostPage {
  private readonly route = inject(ActivatedRoute);

  readonly slug = computed(() => this.route.snapshot.paramMap.get('slug') ?? '');
  readonly post = computed(() => BLOG_POSTS.find((item) => item.slug === this.slug()) ?? null);

  readonly shareUrl = computed(() => {
    const currentPost = this.post();

    if (!currentPost) {
      return '';
    }

    return `${window.location.origin}/blog/${currentPost.slug}`;
  });

  readonly shareMessage = computed(() => {
    const currentPost = this.post();

    if (!currentPost) {
      return '';
    }

    return `${currentPost.title} - ${this.shareUrl()}`;
  });

  readonly whatsappLink = computed(
    () => `https://api.whatsapp.com/send?text=${encodeURIComponent(this.shareMessage())}`
  );

  readonly xLink = computed(
    () =>
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(this.post()?.title ?? '')}&url=${encodeURIComponent(this.shareUrl())}`
  );

  readonly facebookLink = computed(
    () => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(this.shareUrl())}`
  );

  readonly linkedInLink = computed(
    () =>
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(this.shareUrl())}`
  );
}
