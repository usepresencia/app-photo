import photosByCategory from "./_mock/photos.json";
import type { Photo } from "./_mock/types";

export interface EventFormat {
  title: string;
  subtitle: string;
  image: Photo;
}

const photos = photosByCategory as Record<string, Photo[]>;

const EVENTS: EventFormat[] = [
  {
    title: "Casamento civil",
    subtitle: "Pré-wedding / pós-cerimônia",
    image: photos["casamento-civil"][0],
  },
  {
    title: "Aniversário infantil",
    subtitle: "Festa, detalhes e convidados",
    image: photos["evento-aniversario"][0],
  },
  {
    title: "Making-of da noiva",
    subtitle: "Preparação antes do grande dia",
    image: photos["making-of-noiva"][0],
  },
];

export async function getEventFormats(): Promise<EventFormat[]> {
  return EVENTS;
}
