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
  'start.newAt16': 'Proves: començar als 16',

  // Selecció de família
  'family.select.title': 'On naixeràs?',
  'family.select.titleAt16': 'On has crescut?',
  'family.select.subtitle': 'Tria la família que et tocarà en sort.',
  'family.select.choose': 'Néixer aquí',
  'family.select.chooseAt16': 'Començar als 16',

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
  'game.stage.adolescencia': 'Institut (ESO)',
  'game.stage.estudis_post': 'Estudis',
  'game.stage.laboral': 'Vida laboral',
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
  'context.paga': 'La teva paga',
  'context.ingressosPropis': 'El teu ingrés',

  'event.thisYear': 'El que ha passat:',
  'event.choose': 'Què fas?',

  // Itineraris (fork dels 16)
  'itinerari.batxillerat.label': 'Batxillerat',
  'itinerari.batxillerat.short': 'Batxillerat',
  'itinerari.batxillerat.desc':
    'Segueixes estudiant per anar, potser, a la universitat. Sense ingressos propis.',
  'itinerari.grau_mig.label': 'Mòdul de grau mitjà',
  'itinerari.grau_mig.short': 'Grau mitjà',
  'itinerari.grau_mig.desc':
    'Formació professional amb pràctiques: un petit ajut econòmic i feina abans.',
  'itinerari.treball.label': 'Posar-te a treballar',
  'itinerari.treball.short': 'Treballant',
  'itinerari.treball.desc':
    'Una feina i un sou propi. Comences a gestionar un pressupost mes a mes.',
  'itinerari.nini.label': 'No fer res',
  'itinerari.nini.short': 'Sense rumb',
  'itinerari.nini.desc':
    'Ni estudies ni treballes. Llibertat… però depens de casa i el temps passa.',

  // Fita dels 16 (postobligatòria)
  'milestone.post.kicker': 'Fi de l’ESO',
  'milestone.post.title': 'Fas 16 anys',
  'milestone.post.loreTitle': 'I ara, què?',
  'milestone.post.lore1':
    'S’acaba l’etapa obligatòria. Per primera vegada el camí no està marcat: tu tries cap on tira la teva vida.',
  'milestone.post.lore2':
    'Pots seguir estudiant (batxillerat o un grau mitjà) o entrar al món laboral. Encara no et pots emancipar: això arribarà als 18.',
  'milestone.post.summaryTitle': 'Com has arribat als 16',
  'milestone.post.summary.molt_baix':
    'Arribes a aquesta cruïlla tocat i amb poques forces. La decisió pesa el doble.',
  'milestone.post.summary.baix':
    'No ha estat fàcil arribar fins aquí, però hi ets. Toca decidir.',
  'milestone.post.summary.mig':
    'Arribes als 16 amb les idees més o menys clares i ganes de tirar endavant.',
  'milestone.post.summary.alt':
    'Arribes en bona forma i amb confiança per triar el teu camí.',
  'milestone.post.summary.molt_alt':
    'Arribes ple d’energia i seguretat: tens el futur a les teves mans.',

  // Pressupost mensual (fase laboral)
  'budget.title': 'El teu pressupost mensual',
  'budget.income': 'Ingrés',
  'budget.estalvi': 'Estalvi',
  'budget.estalvi.desc': 'El que apartes cada mes. El teu futur.',
  'budget.oci': 'Oci',
  'budget.oci.desc': 'Sortir, plans, capricis petits.',
  'budget.compres': 'Compres',
  'budget.compres.desc': 'Roba, tecnologia, els teus gustos.',
  'budget.casa': 'A casa',
  'budget.casa.desc': 'El que aportes a la família.',
  'budget.lliure': 'Sense assignar (a efectiu)',
  'budget.nextMonth': 'Següent mes →',

  // Estacions
  'season.tardor': 'Tardor',
  'season.hivern': 'Hivern',
  'season.primavera': 'Primavera',
  'season.estiu': 'Estiu',

  // Accions (adolescència)
  'action.title': 'Què fas aquest trimestre?',
  'action.sortir_amics.label': 'Sortir amb els amics',
  'action.sortir_amics.desc': 'Quedar, fer un beure, anar al cine... Costa, però va bé.',
  'action.mes_tranquil.label': 'Trimestre tranquil',
  'action.mes_tranquil.desc': 'Temps per a tu, sense gastar. Recarregues piles.',
  'action.ajudar_casa.label': 'Ajudar a casa per una paga extra',
  'action.ajudar_casa.desc': 'Feines i encàrrecs a canvi d’uns diners.',
  'action.caprici.label': 'Donar-te un caprici',
  'action.caprici.desc': 'Aquella cosa que tant vols. Alegria immediata, butxaca buida.',
  'action.feina_estiu.label': 'Feina d’estiu',
  'action.feina_estiu.desc': 'Treballar durant l’estiu: cansa, però omples la guardiola.',

  // Motius pels quals una acció està bloquejada
  'action.locked.diners': 'No tens prou diners',
  'action.locked.benestar': 'No tens prou ànims',
  'action.locked.estiu': 'Només a l’estiu',

  // Registre / log de transició a l'institut
  'transition.institut.title': 'Comences l’institut',
  'transition.institut.desc':
    'Fas 12 anys i entres a l’ESO. A partir d’ara reps una paga i decideixes, trimestre a trimestre, què en fas.',

  // Pantalla de transició infància → adolescència
  'transition.kicker': 'Fi de la infància',
  'transition.title': 'Fas 12 anys',
  'transition.summaryTitle': 'Com ha anat la teva infància',
  'transition.benestar': 'Benestar',
  'transition.estalvi': 'Estalvi acumulat',
  'transition.summary.molt_baix':
    'Han estat uns anys durs: pocs moments bons i molta motxilla emocional per carregar.',
  'transition.summary.baix':
    'Una infància amb més ombres que llums, amb dies difícils que han deixat empremta.',
  'transition.summary.mig':
    'Una infància normal, amb els seus alts i baixos, com la de tanta gent.',
  'transition.summary.alt':
    'Has crescut envoltat d’estima i estabilitat: una bona base per al que ve.',
  'transition.summary.molt_alt':
    'Una infància plena i feliç, un coixí que portaràs sempre amb tu.',
  'transition.loreTitle': 'I ara... l’institut',
  'transition.lore1':
    'S’acaba la infància i comença l’ESO. El món se t’obre: amics nous, primers amors, primeres responsabilitats... i les primeres decisions de debò.',
  'transition.lore2':
    'A partir d’ara reps una paga i ets tu qui decideix, trimestre a trimestre, si la gastes, l’estalvies o busques la manera de guanyar-ne més. Cada decisió compta.',
  'transition.continue': 'Començar l’institut →',

  'log.title': 'Història',
  'log.empty': 'Encara no ha passat res.',
  'log.choice': 'Decisió: {opcio}',

  'category.familia': 'Família',
  'category.economia': 'Economia',
  'category.regal': 'Regal',
  'category.salut': 'Salut',
  'category.escola': 'Escola',

  // Final de fase (majoria d'edat, als 18)
  'gameover.title': 'Fas 18 anys',
  'gameover.subtitle':
    'Arribes a la majoria d’edat. S’obre una nova etapa: pots anar a la universitat o buscar-te la vida i emancipar-te.',
  'gameover.benestarFinal': 'Benestar final',
  'gameover.patrimoniFinal': 'Patrimoni acumulat',
  'gameover.fork.question': 'I ara, què faràs?',
  'gameover.fork.uni': 'Anar a la universitat',
  'gameover.fork.emancipar': 'Treballar i emancipar-te',
  'gameover.soon':
    'La vida adulta (universitat, feina, emancipació i pressupostos de debò) arribarà en una futura versió.',
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

  // --- Esdeveniments d'adolescència (ESO) ---
  'event.examens.title': 'Època d’exàmens',
  'event.examens.desc':
    'Setmanes d’estudi intens i nervis. Les notes pesen i el cap també.',

  'event.primer_amor.title': 'El primer amor',
  'event.primer_amor.desc':
    'T’has enamorat per primera vegada. Tot brilla una mica més.',

  'event.bon_grup_amics.title': 'Una colla genial',
  'event.bon_grup_amics.desc':
    'Has trobat el teu grup. Rises, plans i gent que t’entén.',

  'event.baralla_amics.title': 'Conflicte amb la colla',
  'event.baralla_amics.desc':
    'Una baralla forta amb els amics t’ha deixat tocat aquests dies.',

  'event.xarxes.title': 'Comparacions a les xarxes',
  'event.xarxes.desc':
    'Hores de scroll i la sensació que tothom viu millor que tu. No ajuda.',

  'event.pressio_grup.title': 'Pressió de grup',
  'event.pressio_grup.desc':
    'La colla s’ho compra tot i t’empenyen a fer el mateix ({cost} €). Què fas?',
  'event.pressio_grup.choice.cedir': 'Seguir el corrent i comprar-ho',
  'event.pressio_grup.choice.plantarse': 'Plantar-te i estalviar els diners',

  'event.mobil_nou.title': 'Vols un mòbil nou',
  'event.mobil_nou.desc':
    'Ha sortit el model que vols ({cost} €). Tens estalvis... t’hi llences?',
  'event.mobil_nou.choice.comprar': 'Comprar-lo amb els meus estalvis',
  'event.mobil_nou.choice.esperar': 'Esperar i conservar el que tinc',

  'event.feina_caps_setmana.title': 'Feina de caps de setmana',
  'event.feina_caps_setmana.desc':
    'T’ofereixen feina els caps de setmana ({amount} € el trimestre). L’acceptes?',
  'event.feina_caps_setmana.choice.acceptar': 'Acceptar la feina',
  'event.feina_caps_setmana.choice.rebutjar': 'Rebutjar-la i tenir temps lliure',

  'event.conflicte_pares.title': 'Topades amb els pares',
  'event.conflicte_pares.desc':
    'Discutiu per horaris i llibertat. La convivència s’ha tensat.',

  'event.paga_extra_avis.title': 'Els avis t’ajuden',
  'event.paga_extra_avis.desc':
    'Els avis t’han donat {amount} € «per a les teves coses».',

  'event.despesa_inesperada.title': 'Una despesa imprevista',
  'event.despesa_inesperada.desc':
    'Se t’ha trencat una cosa i has hagut de pagar {cost} € de la teva butxaca.',

  'event.esport_equip.title': 'Entres en un equip',
  'event.esport_equip.desc':
    'T’has apuntat a un equip i has fet pinya amb la gent. T’ho passes bé.',

  'event.malaltia_ado.title': 'Uns dies de baixa',
  'event.malaltia_ado.desc': 'Una grip et deixa fet pols uns quants dies.',

  'event.festa.title': 'Una festa per recordar',
  'event.festa.desc':
    'Gran festa amb la colla ({cost} €). Cansat però amb un somriure.',

  // --- Esdeveniments laborals (treball, 16-18) ---
  'event.pujada_sou.title': 'Pugen el sou',
  'event.pujada_sou.desc':
    'La feina va bé i et reconeixen l’esforç amb una millora de sou.',

  'event.paga_extra.title': 'Paga extra',
  'event.paga_extra.desc': 'Arriba una paga extra de {amount} €. Benvinguda sigui!',

  'event.hores_extra.title': 'Et proposen hores extra',
  'event.hores_extra.desc':
    'Pots fer hores extra aquest mes ({amount} €). Més diners, menys temps. Què fas?',
  'event.hores_extra.choice.acceptar': 'Acceptar les hores extra',
  'event.hores_extra.choice.rebutjar': 'Rebutjar-les i descansar',

  'event.conflicte_cap.title': 'Problemes amb el cap',
  'event.conflicte_cap.desc':
    'Tensions amb qui mana. La feina s’ha fet incòmoda aquests dies.',

  'event.feina_dura.title': 'Un mes esgotador',
  'event.feina_dura.desc':
    'Molta càrrega i poc descans. Arribes a casa sense forces.',

  'event.companys_feina.title': 'Bona gent a la feina',
  'event.companys_feina.desc':
    'Has fet bon rotllo amb els companys i el dia a dia es fa més lleuger.',

  // --- Esdeveniments de no fer res (nini, 16-18) ---
  'event.avorriment.title': 'Dies que no passen',
  'event.avorriment.desc':
    'Les hores se’t fan llargues i la sensació de no anar enlloc creix.',

  'event.pressio_familiar.title': 'Pressió a casa',
  'event.pressio_familiar.desc':
    'A casa et pregunten cada dia què penses fer amb la teva vida. Pesa.',

  'event.amics_avancen.title': 'Els amics tiren endavant',
  'event.amics_avancen.desc':
    'Els teus amics estudien o treballen i tu et quedes enrere. No és agradable.',

  'event.temps_lliure.title': 'Temps per a tu',
  'event.temps_lliure.desc':
    'Almenys tens temps lliure i el dediques a coses que t’agraden.',

  'event.oferta_reengantxar.title': 'Una oportunitat',
  'event.oferta_reengantxar.desc':
    'Sorgeix una feina temporal ({amount} €). Podria ser una empenta. L’agafes?',
  'event.oferta_reengantxar.choice.acceptar': 'Agafar-la',
  'event.oferta_reengantxar.choice.passar': 'Deixar-ho córrer',
}
