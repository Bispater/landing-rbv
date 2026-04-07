import { Component, OnInit, AfterViewInit, OnDestroy, NgZone } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DataService, Evento } from '../../core/services/data.service';

declare global {
  interface Window {
    YT: typeof YT;
    onYouTubeIframeAPIReady: () => void;
  }
}
declare const YT: { Player: new (el: string, opts: object) => YTPlayer };
interface YTPlayer { playVideo(): void; seekTo(s: number, a: boolean): void; getPlayerState(): number; getCurrentTime(): number; }

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {
  proximosEventos: Evento[] = [];
  private ytPlayer: YTPlayer | null = null;
  private loopInterval: ReturnType<typeof setInterval> | null = null;
  private readonly CLIP_END = 8;

  constructor(private data: DataService, private zone: NgZone) {}

  ngOnInit(): void {
    this.data.listenToRef<Record<string, Evento>>('eventos', (val) => {
      const all = val ? Object.entries(val).map(([id, v]) => ({ ...v, id })) : [];
      this.proximosEventos = all
        .sort((a, b) => (a.fecha > b.fecha ? 1 : -1))
        .slice(0, 3);
    });
  }

  ngAfterViewInit(): void {
    this.zone.runOutsideAngular(() => {
      if ((window as Window).YT && (window as Window).YT.Player) {
        this.initPlayer();
      } else {
        (window as Window).onYouTubeIframeAPIReady = () => this.initPlayer();
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(tag);
      }
    });
  }

  private initPlayer(): void {
    this.ytPlayer = new YT.Player('yt-hero-player', {
      videoId: 'fbjNfowfN-A',
      playerVars: {
        autoplay: 1,
        mute: 1,
        controls: 0,
        disablekb: 1,
        fs: 0,
        iv_load_policy: 3,
        modestbranding: 1,
        rel: 0,
        showinfo: 0,
        start: 0,
      },
      events: {
        onReady: (e: { target: YTPlayer }) => {
          e.target.playVideo();
          this.forceIframeSize();
          this.startLoop();
        },
        onStateChange: (e: { data: number }) => {
          if (e.data === 0) {
            this.ytPlayer?.seekTo(0, true);
            this.ytPlayer?.playVideo();
          }
        },
      },
    });
  }

  private forceIframeSize(): void {
    const iframe = document.querySelector('.hero-video-wrap iframe') as HTMLIFrameElement | null;
    if (iframe) {
      iframe.style.cssText = [
        'position: absolute',
        'top: 50%',
        'left: 50%',
        'transform: translate(-50%, -50%)',
        'width: max(177.78vh, 100vw)',
        'height: max(56.25vw, 100vh)',
        'min-width: 100%',
        'border: none',
        'pointer-events: none',
      ].join(' !important; ') + ' !important';
    }
  }

  private startLoop(): void {
    this.loopInterval = setInterval(() => {
      if (!this.ytPlayer) return;
      const state = this.ytPlayer.getPlayerState();
      if (state === 1 && this.ytPlayer.getCurrentTime() >= this.CLIP_END) {
        this.ytPlayer.seekTo(0, true);
        this.ytPlayer.playVideo();
      } else if (state === 0) {
        this.ytPlayer.seekTo(0, true);
        this.ytPlayer.playVideo();
      }
    }, 150);
  }

  ngOnDestroy(): void {
    if (this.loopInterval) clearInterval(this.loopInterval);
  }
}
