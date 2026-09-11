import type { Profile } from "@/api/domain/profile/Profile";
import type { ProfileRepository } from "@/api/domain/profile/ProfileRepository";

// Dado local (dev/test/CI sem Firebase) com o mesmo texto e ordem de
// parágrafos usados no seed real do Firestore.
const PROFILE: Profile = {
  capaCaption: "Há vários anos marcando momentos",
  profissao: {
    titulo: "Profissão",
    eyebrow: "Formação e trajetória",
    paragrafos: [
      "Formada em Design Gráfico com pós-graduação em Marketing Digital, trago uma bagagem de mais de 10 anos em comunicação visual e edição.",
      "Minha prática na fotografia une técnica em estúdio, domínio de iluminação e direção de retratos a um propósito claro: capturar histórias com intenção e sensibilidade.",
      "Seja para fortalecer sua presença profissional ou registrar marcos da sua vida pessoal, meu compromisso é criar imagens que preservem exatamente a verdade e a essência daquilo que você viveu.",
    ],
  },
  familia: {
    titulo: "Família",
    paragrafos: [
      "Aprendi o verdadeiro valor da fotografia quando percebi como a saudade busca, nos detalhes, os momentos que não puderam ser registrados.",
      "Foi assim que entendi que fotografar vai muito além de uma imagem bonita: é criar pontes para o passado, preservando histórias, pessoas e a essência de quem amamos.",
      "Porque o tempo passa rápido, mas uma fotografia tem o poder de nos levar de volta exatamente para onde fomos felizes.",
    ],
    legendaFoto:
      "Quando estive no altar, ao lado de quem amo e com a nossa filha nos braços, percebi de vez: essas são as imagens que contam quem nós somos. Viver esse momento do outro lado da câmera me fez valorizar ainda mais cada segundo que registro. Ter esse dia guardado me traz de volta o abraço, o olhar e a certeza de que a família é o nosso bem mais precioso.",
  },
};

export class MockProfileRepository implements ProfileRepository {
  async get(): Promise<Profile | null> {
    return PROFILE;
  }
}
