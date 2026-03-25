// Script para sincronizar Macondo Playacar a Firestore
// Para usar: Copia este código en la consola del navegador mientras la app está abierta

const MACONDO_PLAYACAR_DATA = {
  name: "MACONDO_PLAYACAR",
  display_name: "Macondo Playacar",
  super_headline: "THE HEARTBEAT OF LUXURY",
  main_headline: "Macondo: Club Privado para\nCiudadanos del Mundo.",
  body_text: "Despertar, correr, nadar. El nuevo estándar de lujo en Playacar.\nQuiet Luxury respaldado por Porcelanosa y SMEG.",
  layout: "left",
  accent_color: "GOLD",
  main_text_color: "WHITE",
  location: "Playacar, Playa del Carmen",
  concept: "Club privado para ciudadanos del mundo. Ecosistema que funciona como activo de estilo de vida para High-Net-Worth individuals y nómadas digitales premium.",
  positioning: "Enclave más sofisticado de Playa del Carmen con seguridad 24/7 y densidad controlada. Proximidad inmediata al campo de golf con vistas perennes y barrera natural contra sobrepoblación.",
  brand_partners: ["Porcelanosa", "SMEG", "Eurovent"],
  construction_specs: {
    walls: "Panel de yeso con fibra acústica para aislamiento y privacidad",
    facade: "Cancelería Eurovent 150 con cristal templado 6mm y barandales 10mm",
    kitchen: "Cubiertas XTone Liem Black Mature, parrilla inducción SMEG, horno convección, microondas, cava de vinos, refrigerador y lavavajillas panelables",
    carpentry: "Puertas y closets en triplay de roble con boquillas de madera sólida",
    floors: "Porcelanatos tipo SMA de alta durabilidad y baja porosidad"
  },
  amenities: [
    "Range de golf",
    "Canchas de pádel",
    "Canchas de pickleball",
    "Gimnasio de última generación",
    "Servicio de carritos de golf",
    "Guest House compartido"
  ],
  unit_types: {
    "1BR": { interior_m2: 59.93, terrace_m2: 17.96, total_m2: 77.89, view: "Jardines Interiores" },
    "2BR": { interior_m2: 154.14, terrace_m2: 36.62, total_m2: 190.76, view: "Vista a Amenidades" },
    "3BR": { interior_m2: 159.93, terrace_m2: 30.84, total_m2: 190.77, view: "Vista Campo de Golf" },
    "PH_1BR": { interior_m2: 59.93, rooftop_m2: 54.61, total_m2: 114.54, view: "Panorámica" },
    "PH_3BR": { interior_m2: 159.93, rooftop_m2: 133.32, total_m2: 293.25, view: "Campo de Golf / Horizonte" }
  },
  pricing_examples: {
    "GH_01C_1BR_Corner": {
      plan_50_50: 7118222,
      plan_20_80: 7830044
    },
    "PH_03_2BR_Deluxe": {
      plan_50_50: 14275555,
      plan_20_80: 15703111
    }
  },
  payment_plans: {
    "50_50": "Opción más eficiente para inversores con capital líquido",
    "20_80": "Ideal para apalancamiento financiero"
  },
  target_audience: "High-Net-Worth Individuals, nómadas digitales premium, inversores sofisticados",
  key_differentiators: [
    "Quiet Luxury con alianza Porcelanosa",
    "Relación interior/exterior casi 1:1 en penthouses",
    "Guest House para maximizar ROI sin aumentar costo de adquisición",
    "Ubicación junto a campo de golf que protege plusvalía",
    "Cocina seamless con electrodomésticos panelables"
  ],
  tagline: "The heartbeat of luxury",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

// Exportar para uso en la app
export default MACONDO_PLAYACAR_DATA;
