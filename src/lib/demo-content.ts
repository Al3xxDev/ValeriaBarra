export type ArticleContent = {
  title: string; slug: string; subtitle: string; category: string; date: string;
  image: string; imageAlt: string; content: string[]; author?: string; seoTitle?: string | null; seoDescription?: string | null; socialImage?: string | null;
};
export type RecipeContent = {
  title: string; slug: string; description: string; category: string; prepMinutes: number;
  difficulty: string; image: string; imageAlt: string; ingredients: string[]; method: string[];
};

export const articles: ArticleContent[] = [
  {
    title: "Mangiare bene, anche quando il tempo è poco", slug: "mangiare-bene-quando-il-tempo-e-poco",
    subtitle: "Piccole abitudini, scelte semplici e un’organizzazione che lascia spazio alla vita.",
    category: "Consapevolezza", date: "12 settembre 2026", image: "/images/tavola-mediterranea-placeholder.png",
    imageAlt: "Un piatto mediterraneo colorato preparato con ingredienti di stagione",
    content: ["Le giornate piene non richiedono regole più rigide: spesso aiutano poche scelte pratiche, pensate in anticipo e facili da ripetere.", "Tenere in dispensa legumi, cereali e verdure di stagione permette di comporre pasti diversi senza partire ogni volta da zero. Anche una preparazione essenziale può diventare un momento di cura.", "Non serve che tutto sia perfetto. Un percorso sostenibile tiene conto dei tuoi orari, dei gusti e delle occasioni che fanno parte della tua settimana."],
  },
  {
    title: "La spesa di stagione, con più serenità", slug: "la-spesa-di-stagione-con-serenita",
    subtitle: "Una traccia flessibile per scegliere ingredienti buoni e ridurre gli sprechi.",
    category: "Alimentazione", date: "28 agosto 2026", image: "/images/tavola-mediterranea-placeholder.png",
    imageAlt: "Verdure fresche e ingredienti semplici su una tavola chiara",
    content: ["Fare la spesa può essere più semplice quando si parte da una base flessibile: qualche verdura, una fonte proteica, pane o cereali e ingredienti che ami davvero.", "La stagionalità offre varietà e sapore, ma non deve diventare una nuova regola da seguire con ansia. Può essere un punto di partenza per esplorare ingredienti diversi.", "Prova a pianificare due o tre pasti, lasciando il resto della settimana aperto. La flessibilità aiuta a usare quello che hai già e a rispettare i tuoi ritmi."],
  },
];

export const recipes: RecipeContent[] = [
  {
    title: "Bowl di farro, ceci e verdure", slug: "bowl-farro-ceci-verdure",
    description: "Un piatto colorato e versatile, da comporre con le verdure che hai a disposizione.", category: "Piatti unici", prepMinutes: 25,
    difficulty: "Facile", image: "/images/tavola-mediterranea-placeholder.png", imageAlt: "Bowl di cereali e verdure di stagione",
    ingredients: ["Farro", "Ceci già cotti", "Pomodorini", "Zucchine", "Erbe fresche", "Olio extravergine d’oliva", "Limone"],
    method: ["Cuoci il farro seguendo i tempi indicati sulla confezione e lascialo intiepidire.", "Taglia le verdure e condiscile con olio e limone.", "Unisci farro e ceci, completa con le verdure e le erbe fresche."],
  },
  {
    title: "Pasta integrale con pomodorini", slug: "pasta-integrale-pomodorini",
    description: "Una ricetta essenziale che cambia con le erbe e i pomodori della stagione.", category: "Primi piatti", prepMinutes: 20,
    difficulty: "Facile", image: "/images/tavola-mediterranea-placeholder.png", imageAlt: "Ingredienti semplici per un pranzo mediterraneo",
    ingredients: ["Pasta integrale", "Pomodorini", "Basilico", "Olio extravergine d’oliva", "Scaglie di formaggio a scelta"],
    method: ["Cuoci la pasta in acqua salata.", "In una padella scalda i pomodorini con un filo d’olio e il basilico.", "Scola la pasta e amalgama con il condimento. Completa a piacere."],
  },
];
