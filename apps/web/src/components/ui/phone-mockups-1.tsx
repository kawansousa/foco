import {
  ImageItem,
  PhoneCarousel,
} from "@/components/ui/phone-mockups-1-utils/phone-carousel";

/** Prints reais do app (simulador iOS), em public/app. */
const exampleImages: ImageItem[] = [
  {
    src: "/app/hoje-light.png",
    srcDark: "/app/hoje-dark.png",
    alt: "Tela Hoje do Foco: passos do dia com 4 de 5 concluídos e sequência de 13 dias",
    caption: "Hoje: seus passos do dia, com progresso e sequência",
  },
  {
    src: "/app/metas-light.png",
    srcDark: "/app/metas-dark.png",
    alt: "Tela Metas do Foco: metas ativas com prazo, passo diário e barra de progresso",
    caption: "Metas: prazo, passo diário e progresso de cada meta",
  },
  {
    src: "/app/progresso-light.png",
    srcDark: "/app/progresso-dark.png",
    alt: "Tela Progresso do Foco: constância dos últimos 30 dias, dias fortes e dificuldade média",
    caption: "Progresso: constância, dias fortes e dificuldade média",
  },
  {
    src: "/app/trofeus-light.png",
    srcDark: "/app/trofeus-dark.png",
    alt: "Tela Troféus do Foco: conquistas de bronze, prata e ouro, com data e contexto",
    caption: "Troféus: cada conquista guarda a data e o contexto",
  },
  {
    src: "/app/fo-light.png",
    srcDark: "/app/fo-dark.png",
    alt: "Tela do Fô, o mascote do Foco: horários dos lembretes, tom das mensagens e dias de descanso",
    caption: "Fô: lembretes no seu horário e no seu tom",
  },
];

export default function PhoneMockupBasic() {
  return <PhoneCarousel images={exampleImages} notch={false} />;
}
