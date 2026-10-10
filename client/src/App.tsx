import { AnimatePresence, LazyMotion, MotionConfig, domAnimation } from 'motion/react';
import { useEffect, useState } from 'react';
import { AudioToggle } from './audio/AudioToggle';
import { spotifyTrackId } from './audio/config';
import { SpotifyPlayer } from './audio/SpotifyPlayer';
import { useBackgroundAudio } from './audio/useBackgroundAudio';
import { FilmGrain } from './components/FilmGrain';
import { RsvpModal } from './components/RsvpModal';
import { useScrollLock } from './hooks/useScrollLock';
import { warmUpApi } from './services/api';
import { Engagement } from './sections/Engagement';
import { Footer } from './sections/Footer';
import { Hero } from './sections/Hero';
import { Intro } from './sections/Intro';
import { Invitation } from './sections/Invitation';
import { Location } from './sections/Location';
import { Rsvp } from './sections/Rsvp';

const spotifyTrack = spotifyTrackId();

export default function App() {
  const [started, setStarted] = useState(false);
  const [rsvpOpen, setRsvpOpen] = useState(false);
  const audio = useBackgroundAudio();

  useScrollLock(!started || rsvpOpen);

  // Sempre começa do início do "filme".
  useEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
    warmUpApi();
  }, []);

  const start = () => {
    audio.play(); // síncrono dentro do toque: libera o áudio no celular
    setStarted(true);
  };

  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        <FilmGrain />

        <AnimatePresence>
          {!started && <Intro onStart={start} withSound={audio.available || Boolean(spotifyTrack)} />}
        </AnimatePresence>

        {/* Arquivo licenciado tem prioridade; sem ele, usa o player oficial do Spotify. */}
        {audio.status !== 'disabled'
          ? started && <AudioToggle status={audio.status} onToggle={audio.toggle} />
          : spotifyTrack && <SpotifyPlayer trackId={spotifyTrack} started={started} />}

        <main inert={!started || rsvpOpen}>
          <Hero started={started} />
          <Engagement />
          <Invitation />
          <Location />
          <Rsvp onOpen={() => setRsvpOpen(true)} />
          <Footer />
        </main>

        <RsvpModal open={rsvpOpen} onClose={() => setRsvpOpen(false)} />
      </MotionConfig>
    </LazyMotion>
  );
}
