import { Component, OnInit, AfterViewInit, OnDestroy, NgZone } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DataService, Evento, Contenido, DEFAULT_CONTENIDO, conContenidoDefaults, ocurrenciasEvento, fechaPrincipal, esVisible } from '../../core/services/data.service';
import { FechaLargaPipe } from '../../core/util/fecha.pipe';

declare global {
  interface Window {
    YT: typeof YT;
    onYouTubeIframeAPIReady: () => void;
  }
}
declare const YT: { Player: new (el: string, opts: object) => YTPlayer };
interface YTPlayer { playVideo(): void; seekTo(s: number, a: boolean): void; getPlayerState(): number; getCurrentTime(): number; loadVideoById(id: string, start?: number): void; }

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, CommonModule, FechaLargaPipe],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {
  proximosEventos: Evento[] = [];
  ocurrenciasDe = ocurrenciasEvento;

  // Editable site content (hero/about/contact); starts from defaults until RTDB loads.
  contenido: Contenido = structuredClone(DEFAULT_CONTENIDO);

  // Rotating tagline shown under the hero title (fades between phrases)
  get frases(): string[] { return this.contenido.hero.frases; }
  fraseActual = 0;
  fraseVisible = true;
  private fraseInterval: ReturnType<typeof setInterval> | null = null;

  // Video de fondo del hero (configurable desde el admin)
  videoTipo: 'youtube' | 'archivo' = 'youtube';
  videoUrl = '';
  private videoYoutubeId = DEFAULT_CONTENIDO.hero.video.youtubeId;
  private videoInicio = 0;
  private videoFin = 0;
  private ytReady = false;
  private ytPlayer: YTPlayer | null = null;
  private loopInterval: ReturnType<typeof setInterval> | null = null;
  private onResize = (): void => this.forceIframeSize();

  constructor(private data: DataService, private zone: NgZone) {}

  ngOnInit(): void {
    this.data.listenToRef<Record<string, Evento>>('eventos', (val) => {
      const all = val ? Object.entries(val).map(([id, v]) => ({ ...v, id })) : [];
      const d = new Date();
      const hoy = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      this.proximosEventos = all
        .filter(esVisible)
        .sort((a, b) => {
          const fa = fechaPrincipal(a);
          const fb = fechaPrincipal(b);
          const aFut = fa >= hoy;
          const bFut = fb >= hoy;
          if (aFut !== bFut) return aFut ? -1 : 1;       // futuros primero
          if (aFut) return fa < fb ? -1 : 1;             // futuros: el más cercano primero
          return fa > fb ? -1 : 1;                       // pasados: el más reciente primero
        })
        .slice(0, 3);
    });

    this.data.listenToRef<Contenido>('contenido', (val) => {
      this.contenido = conContenidoDefaults(val);
      const v = this.contenido.hero.video;
      this.videoTipo = v.tipo;
      this.videoUrl = v.url;
      this.videoYoutubeId = v.youtubeId || this.videoYoutubeId;
      this.videoInicio = Math.max(0, v.inicio ?? 0);
      this.videoFin = Math.max(0, v.fin ?? 0);
      this.zone.runOutsideAngular(() => this.aplicarHeroVideo());
    });

    this.fraseInterval = setInterval(() => {
      this.fraseVisible = false;
      setTimeout(() => {
        const n = this.frases.length || 1;
        this.fraseActual = (this.fraseActual + 1) % n;
        this.fraseVisible = true;
      }, 500);
    }, 3000);
  }

  ngAfterViewInit(): void {
    this.zone.runOutsideAngular(() => {
      if ((window as Window).YT && (window as Window).YT.Player) {
        this.ytReady = true;
        this.aplicarHeroVideo();
      } else {
        (window as Window).onYouTubeIframeAPIReady = () => {
          this.ytReady = true;
          this.aplicarHeroVideo();
        };
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(tag);
      }
      window.addEventListener('resize', this.onResize);
    });
  }

  /** Aplica la configuración de video: inicializa/actualiza el player de YouTube cuando corresponde. */
  private aplicarHeroVideo(): void {
    if (this.videoTipo !== 'youtube' || !this.ytReady || !this.videoYoutubeId) return;
    if (this.ytPlayer) {
      this.ytPlayer.loadVideoById(this.videoYoutubeId, this.videoInicio);
    } else if (document.getElementById('yt-hero-player')) {
      this.initPlayer(this.videoYoutubeId);
    }
  }

  private initPlayer(videoId: string): void {
    this.ytPlayer = new YT.Player('yt-hero-player', {
      videoId,
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
        start: this.videoInicio,
      },
      events: {
        onReady: (e: { target: YTPlayer }) => {
          e.target.playVideo();
          this.forceIframeSize();
          this.startLoop();
        },
        // Si termina el video, vuelve al inicio del tramo.
        onStateChange: (e: { data: number }) => {
          if (e.data === 0) {
            this.ytPlayer?.seekTo(this.videoInicio, true);
            this.ytPlayer?.playVideo();
          }
        },
      },
    });
  }

  /** Reproduce en bucle el tramo [inicio, fin]: al pasar el segundo "fin" vuelve a "inicio". */
  private startLoop(): void {
    if (this.loopInterval) clearInterval(this.loopInterval);
    this.loopInterval = setInterval(() => {
      if (!this.ytPlayer) return;
      const t = this.ytPlayer.getCurrentTime();
      const reproduciendo = this.ytPlayer.getPlayerState() === 1;
      if (this.videoFin > this.videoInicio && reproduciendo && t >= this.videoFin) {
        this.ytPlayer.seekTo(this.videoInicio, true);
      }
    }, 250);
  }

  /** Dimensiona el iframe de YouTube para cubrir (cover 16:9) el contenedor real del hero,
      que en móvil puede ser más alto que 100vh y dejaría franjas si usáramos medidas fijas. */
  private forceIframeSize(): void {
    const wrap = document.querySelector('.hero-video-wrap') as HTMLElement | null;
    const iframe = wrap?.querySelector('iframe') as HTMLIFrameElement | null;
    if (!wrap || !iframe) return;
    const cw = wrap.clientWidth;
    const ch = wrap.clientHeight;
    let width = cw;
    let height = (cw * 9) / 16;
    if (height < ch) {
      height = ch;
      width = (ch * 16) / 9;
    }
    iframe.style.cssText = [
      'position: absolute',
      'top: 50%',
      'left: 50%',
      'transform: translate(-50%, -50%)',
      `width: ${Math.ceil(width)}px`,
      `height: ${Math.ceil(height)}px`,
      'max-width: none',
      'border: none',
      'pointer-events: none',
    ].join(' !important; ') + ' !important';
  }

  ngOnDestroy(): void {
    if (this.fraseInterval) clearInterval(this.fraseInterval);
    if (this.loopInterval) clearInterval(this.loopInterval);
    window.removeEventListener('resize', this.onResize);
  }
}
