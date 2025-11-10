import React, { useState } from 'react';
import { Volume2, Loader2 } from 'lucide-react';
import { Button } from './ui/button';

interface AudioButtonProps {
  text: string;
  audioUrl?: string;
  surahNumber?: number;
  ayahNumber?: number;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
}

export const AudioButton: React.FC<AudioButtonProps> = ({ 
  text, 
  audioUrl,
  surahNumber,
  ayahNumber,
  size = 'default',
  variant = 'ghost'
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  const playAudio = async () => {
    try {
      setIsLoading(true);
      
      // If we already have an audio element playing, stop it
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }

      let audioToPlay: HTMLAudioElement;

      if (audioUrl) {
        // Use provided audio URL
        audioToPlay = new Audio(audioUrl);
      } else if (surahNumber && ayahNumber) {
        // Use AlQuran.cloud API with Mishary Rashid Alafasy recitation
        // First, fetch the ayah data to get the audio URL
        const response = await fetch(
          `https://api.alquran.cloud/v1/ayah/${surahNumber}:${ayahNumber}/ar.alafasy`
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch audio');
        }

        const data = await response.json();
        
        if (data.status === 'OK' && data.data.audio) {
          audioToPlay = new Audio(data.data.audio);
        } else {
          throw new Error('Audio not available');
        }
      } else {
        // For letters and words, use web speech API as fallback
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = 'ar-SA';
          utterance.rate = 0.7;
          utterance.onstart = () => {
            setIsPlaying(true);
            setIsLoading(false);
          };
          utterance.onend = () => {
            setIsPlaying(false);
          };
          window.speechSynthesis.speak(utterance);
          return;
        } else {
          console.log('Audio not available for:', text);
          setIsLoading(false);
          return;
        }
      }

      audioToPlay.onloadeddata = () => {
        setIsLoading(false);
        setIsPlaying(true);
      };

      audioToPlay.onended = () => {
        setIsPlaying(false);
        setAudio(null);
      };

      audioToPlay.onerror = () => {
        console.error('Error loading audio');
        setIsLoading(false);
        setIsPlaying(false);
        // Fallback to speech synthesis
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = 'ar-SA';
          utterance.rate = 0.7;
          utterance.onend = () => setIsPlaying(false);
          window.speechSynthesis.speak(utterance);
          setIsPlaying(true);
        }
      };

      setAudio(audioToPlay);
      await audioToPlay.play();
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsPlaying(false);
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={playAudio}
      disabled={isPlaying || isLoading}
      className="gap-2 transition-all hover:scale-110"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Volume2 className={`h-4 w-4 ${isPlaying ? 'animate-pulse text-emerald-600' : ''}`} />
      )}
    </Button>
  );
};
