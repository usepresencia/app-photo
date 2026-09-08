export interface Profile {
  capaCaption: string;
  profissao: {
    titulo: string;
    eyebrow: string;
    paragrafos: string[];
  };
  familia: {
    titulo: string;
    paragrafos: string[];
    legendaFoto: string;
  };
}
