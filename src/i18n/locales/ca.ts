// Diccionari de cadenes en català. Claus planes amb notació de punt.
// Afegir un idioma nou = duplicar aquest fitxer i traduir els valors.
export const ca: Record<string, string> = {
  'app.title': 'Capitalist Game',

  // Pantalla inicial
  'start.subtitle': 'La vida financera d’una persona, torn a torn.',
  'start.intro':
    'Tria la família on naixeràs i acompanya la criatura any rere any. ' +
    'L’origen marca el punt de sortida... però no ho és tot.',
  'start.new': 'Nova partida',
  'start.continue': 'Continuar partida',

  // Selecció de família
  'family.select.title': 'On naixeràs?',
  'family.select.subtitle': 'Tria la família que et tocarà en sort.',
  'family.select.choose': 'Néixer aquí',

  'family.pobra.name': 'Família pobra',
  'family.pobra.desc':
    'Arribar a final de mes és una lluita constant, però no falta temps junts.',
  'family.treballadora.name': 'Família treballadora',
  'family.treballadora.desc':
    'Sous modestos i molta feina, amb l’economia sempre justa.',
  'family.mitjana.name': 'Família de classe mitjana',
  'family.mitjana.desc':
    'Estabilitat econòmica i una vida còmoda sense grans luxes.',
  'family.alta.name': 'Família de classe alta',
  'family.alta.desc':
    'Bons ingressos i cuidadors contractats, però pares sovint absents.',
  'family.rica.name': 'Família rica',
  'family.rica.desc':
    'Patrimoni important i tot resolt... excepte el temps dels pares.',
  'family.super_rica.name': 'Família super-rica',
  'family.super_rica.desc':
    'Una fortuna que ho cobreix tot. La criatura creix envoltada de personal.',

  'family.stat.ingressos': 'Ingressos mensuals',
  'family.stat.patrimoni': 'Patrimoni familiar',
  'family.stat.horesFeina': 'Hores de feina/setmana',
  'family.stat.horesCura': 'Hores de cura/setmana',
  'family.stat.cuidador': 'Cuidador contractat',
  'common.si': 'Sí',
  'common.no': 'No',

  // Pantalla de joc
  'game.stage.infancia': 'Infància',
  'game.age': '{anys} anys',
  'game.ageZero': 'Nadó (0 anys)',
  'game.turn': 'Torn {torn}',
  'game.nextYear': 'Següent any →',
  'game.birth.title': 'Acabes de néixer',
  'game.birth.desc':
    'Comences la teva vida en aquesta família. Prem «Següent any» per créixer.',

  'stat.benestar': 'Benestar',
  'benestar.molt_baix': 'En la misèria',
  'benestar.baix': 'Malament',
  'benestar.mig': 'Regular',
  'benestar.alt': 'Bé',
  'benestar.molt_alt': 'Vida plena',

  'patrimoni.title': 'El teu patrimoni',
  'patrimoni.efectiu': 'Efectiu',
  'patrimoni.estalvi': 'Estalvi',
  'patrimoni.inversions': 'Inversions',
  'patrimoni.cases': 'Cases',
  'patrimoni.total': 'Total',

  'context.title': 'Context familiar',
  'context.ingressos': 'Ingressos de la llar',
  'context.estalviAnual': 'T’estalvien cada any',

  'event.thisYear': 'Aquest any...',
  'event.choose': 'Què fas?',

  'log.title': 'Història',
  'log.empty': 'Encara no ha passat res.',
  'log.choice': 'Decisió: {opcio}',

  'category.familia': 'Família',
  'category.economia': 'Economia',
  'category.regal': 'Regal',
  'category.salut': 'Salut',
  'category.escola': 'Escola',

  // Final de fase
  'gameover.title': 'Fi de la infància',
  'gameover.subtitle':
    'Has arribat als 12 anys. Aviat comença l’institut i la vida es controlarà mes a mes.',
  'gameover.benestarFinal': 'Benestar final',
  'gameover.patrimoniFinal': 'Patrimoni acumulat',
  'gameover.soon': 'La pròxima fase (adolescència) arribarà en una futura versió.',
  'gameover.restart': 'Tornar a començar',

  // --- Esdeveniments ---
  'event.temps_familia.title': 'Temps en família',
  'event.temps_familia.desc':
    'Heu passat una temporada genial junts: excursions, jocs i molts riures.',

  'event.discussions_pares.title': 'Discussions a casa',
  'event.discussions_pares.desc':
    'Els teus pares discuteixen sovint pels diners. L’ambient a casa s’ha enrarit.',

  'event.vacances.title': 'Vacances d’estiu',
  'event.vacances.desc':
    'Heu pogut anar de vacances i has tornat amb les piles carregades.',

  'event.mudanca.title': 'Canvi de casa',
  'event.mudanca.desc':
    'La família es muda. Toca deixar enrere l’entorn conegut i adaptar-se.',

  'event.germa_nou.title': 'Un germanet nou',
  'event.germa_nou.desc':
    'Ha nascut un germà. La il·lusió es barreja amb menys atenció per a tu.',

  'event.mes_just.title': 'Mes molt just',
  'event.mes_just.desc':
    'Aquest any han calgut retallades a casa. Es nota la tensió econòmica.',

  'event.bon_any_economic.title': 'Bon any econòmic',
  'event.bon_any_economic.desc':
    'L’economia familiar ha anat de cara i fins i tot t’han pogut estalviar una mica.',

  'event.regal_diners_avis.title': 'Regal dels avis',
  'event.regal_diners_avis.desc':
    'Pel teu aniversari els avis t’han donat {amount} €. Què en fas?',
  'event.regal_diners_avis.choice.estalviar': 'Estalviar-los',
  'event.regal_diners_avis.choice.gastar': 'Gastar-los en alguna cosa que vols',

  'event.regal_joguina.title': 'Una joguina nova',
  'event.regal_joguina.desc': 'Has rebut la joguina que tant volies. Quina alegria!',

  'event.herencia.title': 'Una petita herència',
  'event.herencia.desc':
    'Ha mort un familiar i t’ha deixat {amount} € al teu compte. Tristesa i diners alhora.',

  'event.malaltia_lleu.title': 'Has agafat la grip',
  'event.malaltia_lleu.desc':
    'Una grip et té uns dies al llit. Res greu, però uns dies dolents.',

  'event.accident_petit.title': 'Un petit accident',
  'event.accident_petit.desc':
    'Una caiguda jugant t’ha portat a urgències. Ja estàs millor.',

  'event.bon_amic.title': 'Un bon amic',
  'event.bon_amic.desc':
    'Has fet un amic inseparable a l’escola. Us ho passeu d’allò més bé.',

  'event.assetjament.title': 'Ho passes malament a l’escola',
  'event.assetjament.desc':
    'Uns companys t’han pres com a objectiu. Anar a classe s’ha fet dur.',

  'event.extraescolar.title': 'Una activitat extraescolar',
  'event.extraescolar.desc':
    'Pots apuntar-te a una activitat que t’agrada (esport, música...). T’hi apuntes?',
  'event.extraescolar.choice.apuntar': 'Apuntar-m’hi',
  'event.extraescolar.choice.no': 'Deixar-ho passar',
}
