import {
  ImageItem,
  PhoneCarousel,
} from "@/components/ui/phone-mockups-1-utils/phone-carousel";

const exampleImages: ImageItem[] = [
  {
    src: "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=720&h=1560&fit=crop&q=80",
    alt: "Pessoa correndo ao nascer do sol",
    caption: "Meta: Maratona 10k · passo de hoje: correr 3 km",
  },
  {
    src: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=720&h=1560&fit=crop&q=80",
    alt: "Caderno de estudos aberto com anotações",
    caption: "Meta: Fluência B2 · passo de hoje: estudar 25 min",
  },
  {
    src: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=720&h=1560&fit=crop&q=80",
    alt: "Diário e notebook sobre a mesa",
    caption: "Diário do dia: registre como foi e o quanto foi difícil",
  },
  {
    src: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=720&h=1560&fit=crop&q=80",
    alt: "Academia com halteres alinhados",
    caption: "Troféu “Sem folga” · 12 dias seguidos",
  },
];

export default function PhoneMockupBasic() {
  return <PhoneCarousel images={exampleImages} />;
}
