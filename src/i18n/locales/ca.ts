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
  'start.newAtCarrera': 'Proves: carrera i inversions (22)',

  // Selecció de família
  'family.select.title': 'On naixeràs?',
  'family.select.titleAt16': 'On has crescut?',
  'family.select.subtitle': 'Tria la família que et tocarà en sort.',
  'family.select.choose': 'Néixer aquí',
  'family.select.chooseAt16': 'Començar als 16',
  'family.select.chooseAtCarrera': 'Començar als 22',

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
  'game.stage.universitat': 'Universitat',
  'game.stage.carrera': 'Vida adulta',
  'game.stage.jubilacio': 'Jubilació',
  'game.generacio': 'Generació {n}',
  'game.age': '{anys} anys',
  'game.ageZero': 'Nadó (0 anys)',
  'game.turn': 'Torn {torn}',
  'game.nextYear': 'Següent any →',
  'game.detalls': 'Detalls (patrimoni i historial)',
  'game.tancar': 'Tancar',
  // Mode tutorial / coachmarks
  'coach.next': 'Entès',
  'coach.skip': 'Salta el tutorial',
  'coach.reset': 'Reinicia el tutorial',
  'so.activa': 'Activa el so i la vibració',
  'so.desactiva': 'Silencia el so i la vibració',
  'salut.perill.baixa': 'Salut baixa',
  'salut.perill.critica': 'Salut crítica — pots morir aviat',
  'salut.perill.extrema': 'A punt de morir',
  'tutorial.benestar.title': 'El benestar',
  'tutorial.benestar.body':
    'És com de bé estàs (0–100). No depèn només dels diners: el temps, la salut i els vincles hi pesen molt.',
  'tutorial.salut.title': 'La salut',
  'tutorial.salut.body':
    'La teva reserva de vida (0–100). Baixa amb l’edat, l’estrès i les malalties. Si arriba a 0, la partida acaba.',
  'tutorial.moralitat.title': 'La moralitat',
  'tutorial.moralitat.body':
    'El teu eix ètic (0–100): Malvat, Neutral o Bo. Les teves decisions la mouen —explotar baixa, ajudar puja— i sovint guanyar diners ràpid en costa. Segons la teva banda, s’obren o es tanquen oportunitats.',
  'tutorial.diners.title': 'El patrimoni net',
  'tutorial.diners.body':
    'Tot el que tens menys el que deus. Obre «Detalls» per veure’n el desglossament: efectiu, estalvis, inversions i deute.',
  'tutorial.event_result.title': 'Què passa cada any',
  'tutorial.event_result.body':
    'Cada any la vida et passa coses. Aquí veus què ha passat i com t’ha afectat.',
  'tutorial.event_choice.title': 'Tens decisions',
  'tutorial.event_choice.body':
    'De vegades hauràs de triar. Cada opció té conseqüències diferents en diners, benestar o salut.',
  'tutorial.milestone.title': 'Una cruïlla',
  'tutorial.milestone.body':
    'Has arribat a un moment clau de la vida. La teva tria marca el camí dels propers anys.',
  'tutorial.accions.title': 'Com passes l’any',
  'tutorial.accions.body':
    'Reparteix el teu temps i diners en activitats. Cada una afecta el benestar, els estudis o la cartera. Després, «Viu l’any».',
  'tutorial.pressupost.title': 'El pressupost mensual',
  'tutorial.pressupost.body':
    'Decideix on van els teus diners cada mes. Pots gastar més del que ingresses, però tiraràs d’estalvis.',
  'tutorial.pla_inversio.title': 'El pla d’inversió',
  'tutorial.pla_inversio.body':
    'El que estalvies i inverteixes compon any rere any. El fons indexat ret més però és volàtil; les pensions, estables però bloquejades.',
  'tutorial.cerca_feina.title': 'Buscar feina',
  'tutorial.cerca_feina.body':
    'Entrar al món laboral no et regala feina. Accepta una oferta o segueix buscant (perds un any i ànim). Estudis i experiència obren millors portes.',
  'tutorial.habitatge.title': 'On vius',
  'tutorial.habitatge.body':
    'Viure amb els pares és barat però limita. Llogar o comprar costa més; comprar necessita entrada i que el banc t’aprovi.',
  'tutorial.vincles.title': 'Els vincles',
  'tutorial.vincles.body':
    'Amistats, parella i comunitat. Sostenen el benestar encara que tinguis pocs diners; són difícils de mantenir si vas desbordat.',
  'tutorial.academic.title': 'El nivell acadèmic',
  'tutorial.academic.body':
    'L’esforç als estudis. No dóna benestar immediat, però millora el sou de partida i les ofertes de feina.',
  'tutorial.fills.title': 'La descendència',
  'tutorial.fills.body':
    'Tenir fills dóna sentit, però la criança és una despesa obligatòria durant anys. En morir, els deixes l’herència.',
  'tutorial.deute.title': 'El deute',
  'tutorial.deute.body':
    'Allò que ni els estalvis ni la família cobreixen es torna deute, que creix amb interessos i bloqueja la inversió fins que el saldis.',
  'tutorial.sequela.title': 'Les seqüeles',
  'tutorial.sequela.body':
    'Algunes lesions deixen petjada: rebaixen el teu benestar de referència de manera permanent.',
  'tutorial.jubilacio.title': 'La jubilació',
  'tutorial.jubilacio.body':
    'S’acaba el sou. Ara vius de la pensió pública i del que vas estalviar i invertir. Aquí es nota tot el que has fet abans.',
  'tutorial.dinastia.title': 'La dinastia',
  'tutorial.dinastia.body':
    'Pots continuar amb un descendent. Hereta part del teu patrimoni: l’origen condiciona el punt de sortida de la generació següent.',
  'game.birth.title': 'Acabes de néixer',
  'game.birth.desc':
    'Comences la teva vida en aquesta família. Prem «Següent any» per créixer.',

  'stat.benestar': 'Benestar',
  'stat.benestar.tip':
    'El benestar gravita cap a la teva referència d’entorn: es recupera lentament i cau de pressa (un cop dolent costa de remuntar).',
  'stat.salut': 'Salut',
  'stat.salut.tip':
    'La salut baixa amb l’edat, amb el benestar baix (estrès, ansietat) i amb les malalties (sobretot si no pots pagar els tractaments). Si arriba a 0, la persona mor.',
  'stat.moralitat': 'Moralitat',
  'stat.moralitat.tip':
    'El teu eix ètic: com tractes els altres, no quant tens. Baixa quan explotes (pagar precari, defraudar, especular, desnonar) i puja amb la solidaritat (pagar bé, donar, ajudar, cooperar). Sovint la via ràpida als diners costa moralitat. Segons la teva banda, s’obren o es tanquen oportunitats.',
  'stat.sindicat': 'Poder sindical',
  'stat.sindicat.tip':
    'Organització col·lectiva. A diferència de l’estalvi o el negoci (vies individuals), és una via COMPARTIDA: protegeix la feina dels acomiadaments i apuja els salaris de tothom qui s’hi organitza. Es construeix sindicant-se i secundant vagues, i decau si no es manté.',
  'moralitat.banda.malvat': 'Malvat',
  'moralitat.banda.neutral': 'Neutral',
  'moralitat.banda.bo': 'Bo',
  'stat.vincles': 'Vincles',
  'stat.vincles.tip':
    'Amistats, parella i comunitat. Una font de benestar que no es compra; pot sostenir una vida plena amb poc patrimoni. Es construeix amb decisions socials (i costa molt si vas endeutat).',
  'stat.sequela': 'Seqüeles',
  'stat.sequela.tip':
    'Dany permanent de salut (incapacitats). Rebaixa la teva referència de benestar per sempre: per això costa de remuntar.',
  'stat.academic': 'Nivell acadèmic',
  'stat.academic.tip':
    'Esforç i rendiment a la universitat. No dóna benestar immediat, però millora el sou de partida i les ofertes de feina en sortir.',
  'stat.fills': 'Fills',
  'stat.fills.tip':
    'La teva descendència. Donen sentit i vincles, però tenen un cost de criança durant molts anys que pesa més com menys marge tens.',
  'benestar.molt_baix': 'En la misèria',
  'benestar.baix': 'Malament',
  'benestar.mig': 'Regular',
  'benestar.alt': 'Bé',
  'benestar.molt_alt': 'Vida plena',

  'patrimoni.title': 'El teu patrimoni',
  'patrimoni.efectiu': 'Efectiu',
  'patrimoni.inversions': 'Inversions',
  'patrimoni.cases': 'Cases',
  'patrimoni.deute': 'Deute',
  'patrimoni.total': 'Patrimoni net',
  'patrimoni.total.tip':
    'Tot el que tens (efectiu + inversions + cases) menys el que deus (deute i hipoteca). Pot ser negatiu si deus més del que tens. Obre «Detalls» per veure’n el desglossament.',
  'patrimoni.liquid': 'Líquid (efectiu + inversions − deute): el que pots gastar de debò.',
  'patrimoni.immobiliari':
    'Immobiliari (cases − hipoteca): valor de la propietat, no és diner disponible. S’aprecia tot sol.',
  'patrimoni.veure.detall': 'Veure el detall del patrimoni i l’historial',
  'patrimoni.bretxa':
    'Bretxa de gènere/origen: cobres ~{pct}% menys que algú altre amb el mateix currículum.',

  'context.title': 'Context familiar',
  'context.ingressos': 'Ingressos de la llar',
  'context.estalviAnual': 'T’estalvien cada any',
  'context.paga': 'La teva paga',
  'context.ingressosPropis': 'El teu ingrés',
  'context.suportUni': 'Et queda cada any',
  'nomina.brut': 'Sou brut',
  'nomina.ss': 'Seguretat Social',
  'nomina.irpf': 'IRPF',
  'nomina.net': 'Sou net',

  'event.thisYear': 'El que ha passat:',
  'event.choose': 'Què fas?',

  // Mesos de l'any
  'mes.0': 'Gener',
  'mes.1': 'Febrer',
  'mes.2': 'Març',
  'mes.3': 'Abril',
  'mes.4': 'Maig',
  'mes.5': 'Juny',
  'mes.6': 'Juliol',
  'mes.7': 'Agost',
  'mes.8': 'Setembre',
  'mes.9': 'Octubre',
  'mes.10': 'Novembre',
  'mes.11': 'Desembre',

  // Creació de personatge
  'create.title': 'Qui seràs?',
  'create.bornOn': 'Naixeràs el {data}',
  'create.person': 'Tu',
  'create.nom': 'Nom',
  'create.genere': 'Gènere',
  'create.origen': 'Origen',
  'genere.dona': 'Dona',
  'genere.home': 'Home',
  'genere.no_binari': 'No binari',
  'origen.autocton': 'Autòcton',
  'origen.migrant': 'Migrant',
  'create.cognoms': 'Cognoms',
  'create.fullName': 'Et diràs',
  'create.pare': 'Pare',
  'create.mare': 'Mare',
  'create.random': 'A l’atzar',
  'create.start': 'Començar la vida',
  'create.mon': 'El món on neixes',
  'create.regim': 'Estat del benestar',
  'regim.residual.nom': 'Residual',
  'regim.residual.desc':
    'Estat mínim: serveis públics febles i ajuts escassos. Tot depèn de tu i la teva família. El mercat mana; qui cau, cau sol.',
  'regim.mixt.nom': 'Mixt',
  'regim.mixt.desc':
    'Model continental: sanitat i educació públiques, però xarxa d’ajuts limitada i amb forats. L’origen encara pesa molt.',
  'regim.socialdemocrata.nom': 'Socialdemòcrata',
  'regim.socialdemocrata.desc':
    'Estat social fort: serveis universals i ajuts amplis financats amb impostos progressius. El terra puja per a tothom, no només per a qui estalvia.',

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

  // Camins de la vida adulta (fites dels 18 i 22)
  'cami.universitat.label': 'Anar a la universitat',
  'cami.universitat.desc':
    'Quatre anys d’estudis. Costa diners i temps, però un títol obre portes i apuja el sou.',
  'cami.universitat_publica.label': 'Universitat pública',
  'cami.universitat_publica.desc':
    'Matrícula assequible (~1.800 €/any) i beca segons la renda: les rendes baixes en queden quasi exemptes. La via realista per estudiar sense una fortuna al darrere.',
  'cami.universitat_privada.label': 'Universitat privada',
  'cami.universitat_privada.desc':
    'Matrícula cara (~12.000 €/any) i sense beca pública. A canvi, contactes i prestigi que apugen el sou de partida. Una bona inversió per a qui s’ho pot pagar; un deute arriscat per a qui no.',
  'cami.carrera.label': 'Entrar al món laboral',
  'cami.carrera.desc':
    'Surts a buscar feina. No te’n regalen cap: el que trobis dependrà dels teus estudis, els contactes i l’experiència. Quan en tinguis, decidiràs què fas amb els teus diners.',
  'cami.carrera_titulat.label': 'Començar la carrera professional',
  'cami.carrera_titulat.desc':
    'Amb el títol a la mà surts a buscar feina: tens més opcions i millors ofertes, però encara l’has de trobar.',

  // Fita dels 18 (majoria d'edat)
  'milestone.majoria.kicker': 'Majoria d’edat',
  'milestone.majoria.title': 'Fas 18 anys',
  'milestone.majoria.summaryTitle': 'Com arribes als 18',
  'milestone.majoria.summary.molt_baix':
    'Arribes a la vida adulta esgotat i amb poc marge. Tot serà costa amunt.',
  'milestone.majoria.summary.baix':
    'No ho has tingut fàcil, però ja ets adult i toca decidir el teu camí.',
  'milestone.majoria.summary.mig':
    'Arribes als 18 amb una base raonable i ganes de construir la teva vida.',
  'milestone.majoria.summary.alt':
    'Arribes en bona forma, amb confiança per fer passes importants.',
  'milestone.majoria.summary.molt_alt':
    'Arribes ple d’energia i recursos: el món és teu.',
  'milestone.majoria.loreTitle': 'Comença la vida adulta',
  'milestone.majoria.lore1':
    'Ja ets major d’edat. Ara sí: les teves decisions tenen conseqüències de debò i de llarg recorregut.',
  'milestone.majoria.lore2':
    'Pots seguir estudiant a la universitat (inversió en tu mateix) o entrar al món laboral i començar a gestionar —i fer créixer— els teus diners.',

  // Fita dels 22 (fi de la universitat)
  'milestone.fi_uni.kicker': 'Fi de la universitat',
  'milestone.fi_uni.title': 'Ja ets titulat',
  'milestone.fi_uni.summaryTitle': 'Com surts de la universitat',
  'milestone.fi_uni.summary.molt_baix':
    'Han estat anys durs i acabes ben tocat, però amb un títol sota el braç.',
  'milestone.fi_uni.summary.baix':
    'No ha estat un camí fàcil, però te’n surts amb la carrera acabada.',
  'milestone.fi_uni.summary.mig':
    'Tanques una bona etapa amb el títol a la mà i ganes de menjar-te el món.',
  'milestone.fi_uni.summary.alt':
    'Acabes la carrera en plena forma i amb molt bones perspectives.',
  'milestone.fi_uni.summary.molt_alt':
    'Surts de la universitat imparable, amb títol i energia de sobres.',
  'milestone.fi_uni.loreTitle': 'I ara, a treballar',
  'milestone.fi_uni.lore1':
    'S’acaba la universitat. El títol no garanteix res, però sol obrir portes i millorar el sou de sortida.',
  'milestone.fi_uni.lore2':
    'Entres al món laboral adult: cada any decidiràs quant gastes i quant —i com— inverteixes per al teu futur.',

  // --- Fites de mitja carrera (40 / 50 / 60) ---
  'milestone.cruilla_40.kicker': 'Fas 40 anys',
  'milestone.cruilla_40.title': 'La cruïlla dels 40',
  'milestone.cruilla_40.summaryTitle': 'On ets a meitat de camí',
  'milestone.cruilla_40.summary.molt_baix':
    'Arribes als 40 cremat i sense gaire marge: la vida t’ha anat passant per sobre.',
  'milestone.cruilla_40.summary.baix':
    'Als 40 vas tirant, però amb la sensació que sempre vas just.',
  'milestone.cruilla_40.summary.mig':
    'A meitat de camí, amb una vida més o menys encarrilada i decisions per prendre.',
  'milestone.cruilla_40.summary.alt':
    'Arribes als 40 en bon moment, amb una base sòlida sota els peus.',
  'milestone.cruilla_40.summary.molt_alt':
    'Els 40 t’agafen en plena forma, amb temps, recursos i opcions.',
  'milestone.cruilla_40.loreTitle': 'Carrera o vida',
  'milestone.cruilla_40.lore1':
    'És el moment de decidir cap on tira la dècada: prémer l’accelerador a la feina o fer lloc a la resta de la vida.',
  'milestone.cruilla_40.lore2':
    'No hi ha resposta correcta: més sou ara o més temps i vincles que sostenen el benestar a la llarga.',
  'milestone.cruilla_40.premer.label': 'Prémer la carrera',
  'milestone.cruilla_40.premer.desc':
    'Hores i ambició: el sou puja, però el pagues amb desgast i menys vida personal.',
  'milestone.cruilla_40.conciliar.label': 'Conciliar i cuidar els vincles',
  'milestone.cruilla_40.conciliar.desc':
    'Baixes una marxa a la feina (menys sou) per guanyar benestar i relacions.',

  'milestone.revisio_50.kicker': 'Fas 50 anys',
  'milestone.revisio_50.title': 'La revisió dels 50',
  'milestone.revisio_50.summaryTitle': 'Com et trobes als 50',
  'milestone.revisio_50.summary.molt_baix':
    'Arribes als 50 esgotat; el cos i l’ànim comencen a passar factura.',
  'milestone.revisio_50.summary.baix':
    'Als 50 notes el cansament acumulat, però segueixes endavant.',
  'milestone.revisio_50.summary.mig':
    'Mitja vida feta: toca decidir a quin ritme vols afrontar l’última etapa laboral.',
  'milestone.revisio_50.summary.alt':
    'Arribes als 50 en bona forma, amb experiència i marge per triar.',
  'milestone.revisio_50.summary.molt_alt':
    'Els 50 t’agafen fort, amb salut i una posició consolidada.',
  'milestone.revisio_50.loreTitle': 'Aguantar o cuidar-se',
  'milestone.revisio_50.lore1':
    'L’última etapa laboral és exigent. Pots esprémer-la al màxim o baixar el ritme per arribar sencer a la jubilació.',
  'milestone.revisio_50.lore2':
    'El que decideixis ara marcarà com hi arribes: amb més diners o amb més salut i serenor.',
  'milestone.revisio_50.aguantar.label': 'Aguantar el ritme',
  'milestone.revisio_50.aguantar.desc':
    'Segueixes a tope: una mica més de sou, a canvi de desgast físic (seqüela) i benestar.',
  'milestone.revisio_50.cuidar_se.label': 'Cuidar-se i baixar el ritme',
  'milestone.revisio_50.cuidar_se.desc':
    'Prioritzes la salut i la vida: menys sou, però més benestar i vincles.',

  'milestone.recta_60.kicker': 'Fas 60 anys',
  'milestone.recta_60.title': 'La recta final',
  'milestone.recta_60.summaryTitle': 'A les portes de la jubilació',
  'milestone.recta_60.summary.molt_baix':
    'Arribes als 60 just i tocat, amb la jubilació com una incògnita angoixant.',
  'milestone.recta_60.summary.baix':
    'Als 60, amb la recta final a la vista i pocs estalvis de marge.',
  'milestone.recta_60.summary.mig':
    'La jubilació ja es veu a l’horitzó: toca decidir com encares els últims anys de feina.',
  'milestone.recta_60.summary.alt':
    'Arribes als 60 amb una bona base i la jubilació ben encaminada.',
  'milestone.recta_60.summary.molt_alt':
    'Els 60 t’agafen tranquil, amb el futur ben resolt.',
  'milestone.recta_60.loreTitle': 'Esprémer o desaccelerar',
  'milestone.recta_60.lore1':
    'Els últims anys de cotització compten per a la pensió. Pots estirar-los per arribar amb més coixí o anar deixant pas.',
  'milestone.recta_60.lore2':
    'És l’últim tram: o un esforç final per la pensió, o gaudir del temps que et queda abans de plegar.',
  'milestone.recta_60.seguir_fort.label': 'Esprémer els últims anys',
  'milestone.recta_60.seguir_fort.desc':
    'Estires la carrera per millorar la pensió: una mica més de sou, a canvi de salut i benestar.',
  'milestone.recta_60.desaccelerar.label': 'Desaccelerar cap a la jubilació',
  'milestone.recta_60.desaccelerar.desc':
    'Vas deixant pas: menys sou, però arribes a la jubilació amb més benestar i vincles.',

  // Jubilació (67): transició a viure de la pensió fins a la mort
  'milestone.jubilacio.kicker': 'Fas 67 anys',
  'milestone.jubilacio.title': 'Et jubiles',
  'milestone.jubilacio.summaryTitle': 'Com arribes a la jubilació',
  'milestone.jubilacio.summary.molt_baix':
    'Arribes a la jubilació esgotat i sense coixí: els anys que vénen seran difícils.',
  'milestone.jubilacio.summary.baix':
    'Et jubiles amb poc marge; tocarà estirar la pensió i el poc que hi ha.',
  'milestone.jubilacio.summary.mig':
    'Tanques la vida laboral amb una base raonable per encarar els anys que vénen.',
  'milestone.jubilacio.summary.alt':
    'Arribes a la jubilació en bona forma i amb els comptes sanejats.',
  'milestone.jubilacio.summary.molt_alt':
    'Et jubiles amb tot resolt: pots gaudir d’aquesta etapa amb tranquil·litat.',
  'milestone.jubilacio.loreTitle': 'Una nova etapa',
  'milestone.jubilacio.lore1':
    'S’acaba la vida laboral. A partir d’ara vius de la pensió pública i del que hagis estalviat i invertit.',
  'milestone.jubilacio.lore2':
    'La vida continua fins al final. Encara pots decidir com gastes, com cuides la salut i què deixes als teus.',
  'milestone.jubilacio.jubilar.label': 'Començar la jubilació',
  'milestone.jubilacio.jubilar.desc': 'Deixes de treballar i passes a viure de la pensió i els estalvis.',

  // Pressupost mensual (fase laboral)
  'budget.title': 'El teu pressupost mensual',
  'budget.income': 'Ingrés net',
  'budget.oci': 'Oci',
  'budget.oci.desc': 'Sortir, plans, capricis petits.',
  'budget.compres': 'Compres',
  'budget.compres.desc': 'Roba, tecnologia, els teus gustos.',
  'budget.casa': 'A casa',
  'budget.casa.desc': 'El que aportes a la família.',
  'budget.casa.obligatori': 'Obligatori mentre vius a casa · mín. {min}',
  'budget.balanc': 'Balanç del mes',
  'budget.balanc.estalvis': 'Gastes més del que ingresses: tires d’estalvis.',
  'budget.balanc.descobert':
    'No cobreixes {amount}/mes ni amb estalvis ni amb la família → −{punts} benestar.',
  'budget.benestar': 'Benestar (oci + compres)',
  'budget.benestar.min': 'Gasta almenys {min} en oci/compres per no perdre benestar.',
  'budget.nota':
    'Decideixes un pressupost mensual; en passar de torn el joc l’aplica els 12 mesos de l’any de cop.',
  'budget.nextYear': 'Viu un any →',

  // Pla d'inversió anual (fase de carrera)
  'pla.title': 'On poses els teus diners?',
  'pla.income': 'Ingrés',
  'pla.income.feina': 'Feina',
  'pla.income.empresa': 'Empresa',
  'pla.deixarFeina': 'Deixar de treballar',
  'pla.noTreballa': 'Has deixat de treballar. Vius de l’empresa, les inversions i els estalvis (sense sou ni prestació).',
  'pla.buscarFeina': 'Tornar a buscar feina',
  'pla.costVida': 'Cost de vida',
  'pla.costVida.desc': 'Supermercat i subministraments. Tria’n el nivell.',
  'pla.costVida.cobreix': 'Els teus pares et cobreixen {amount}/mes del cost de vida.',
  'nivellVida.minim': 'Mínim',
  'nivellVida.mig': 'Mig',
  'nivellVida.alt': 'Alt',
  'nivellVida.benestar': 'Benestar',
  'pla.oci': 'Oci i vida',
  'pla.oci.desc': 'Gaudir del present. El que et dóna (o et treu) benestar.',
  'pla.inversions': 'Inversió',
  'pla.inversions.desc':
    'Inverteix per fer créixer el patrimoni. Puja i baixa, però a llarg termini compon.',
  'pla.inversioSalut': 'Cuidar la salut',
  'pla.inversioSalut.nota': 'Gimnàs, revisions, bon menjar · {cost}/mes → recuperes salut',
  'pla.inversioFormacio': 'Seguir formant-me',
  'pla.inversioFormacio.nota': 'Cursos i estudi · {cost}/mes → puja el nivell acadèmic',
  'pla.benestar': 'Benestar (oci)',
  'pla.benestar.min': 'Dedica almenys {min} a oci per no perdre benestar.',
  'pla.notaIndex': 'La inversió rendeix de mitjana ~{pct}% l’any, però amb sotracs.',
  'pla.costHabitatge': 'Habitatge',
  'pla.costHabitatge.desc': 'Lloguer o hipoteca. Obligatori, no es pot modificar.',
  'pla.costFills': 'Criança ({fills} fill/s)',
  'pla.costFills.desc':
    'Cost net de criar els fills dependents (ja descomptada la prestació pública). Obligatori.',
  'pla.aportacioFamilia': 'Ajuda a la família',
  'pla.aportacioFamilia.desc':
    'Una part del sou se’n va a casa. Obligatori mentre la família et necessiti.',
  'pla.contribucioLlar': 'Contribució a la llar',
  'pla.contribucioLlar.desc':
    'Vius amb els pares: la teva manutenció i l’ajuda a casa, en un sol import. No pagues el cost de vida a part.',
  'pla.contribucioLlar.humil':
    'La teva família necessita una part gran del teu sou: viure-hi t’absorbeix gairebé tot el marge.',
  'pla.vidaSenzilla': 'Vida senzilla per elecció',
  'pla.vidaSenzilla.nota':
    'Has triat viure amb poc: la frugalitat ja no et resta benestar (és tria, no privació).',
  'pla.frugalitat.bloquejat':
    '🔒 Cal frugalitat {llindar} per viure de mínim sense patir-ho (ara: {nivell}). Es guanya amb formació i edat.',
  'pla.petjada': 'Petjada ecològica',
  'pla.petjada.baixa': 'baixa',
  'pla.petjada.mitjana': 'mitjana',
  'pla.petjada.alta': 'alta',
  'pla.balanc': 'Balanç del mes',
  'pla.balanc.estalvis': 'Gastes més del que ingresses: tires d’estalvis.',
  'pla.balanc.deute':
    'No cobreixes {amount}/mes ni amb estalvis ni amb la família: es convertirà en deute.',
  'pla.deute': 'Deute pendent',
  'pla.deute.nota':
    'Deus {amount}. Compon al {pct}% l’any i el teu marge va a pagar-lo: no pots invertir fins a saldar-lo. Hi ha un límit de préstec (uns 2,5 anys d’ingrés); el que no es pot ni finançar et resta benestar.',
  'pla.sobrecost':
    'La teva família paga un sobrecost pel mateix consum (habitatge precari, sense marge per negociar): la pobresa surt cara.',
  'pla.nota':
    'El pla és anual, però aquí els imports es mostren per mes (l’any sencer = × 12).',
  'pla.nextYear': 'Viu un any →',

  'chart.title': 'Evolució de les teves inversions',
  'chart.vida.title': 'Evolució de la salut i el benestar',
  'chart.patrimoni.title': 'Evolució del patrimoni net',
  'chart.ipc.title': 'Evolució dels preus (IPC)',
  'chart.ipc.label': 'IPC (base 100)',
  'chart.valor': 'Valor de la cartera',
  'chart.aportat': 'Aportat (sense rendiment)',

  // Dedicació de l'any d'universitat
  'uni.title': 'Com vius aquest curs?',
  'uni.nota': 'Tria com enfoques l’any: cada opció té els seus pros i contres.',
  'uni.estudis.label': 'Estudiar a fons',
  'uni.estudis.desc': 'T’hi deixes la pell: poc temps per a tu, però puja el nivell acadèmic (millor sou i feina en sortir).',
  'uni.treball.label': 'Treballar i estudiar',
  'uni.treball.desc': 'Compagines una feineta amb els estudis: uns diners, però esgota.',
  'uni.social.label': 'Vida universitària',
  'uni.social.desc': 'Surts, fas pinya, potser un Erasmus. Vincles per a tota la vida.',

  // Cerca de feina (carrera a l'atur: entrada al món laboral o després d'un acomiadament)
  'jobsearch.title': 'Busques feina',
  'jobsearch.ocupabilitat': 'Les teves opcions de trobar feina són {tram}.',
  'jobsearch.ocupabilitat.baixa': 'baixes',
  'jobsearch.ocupabilitat.mitjana': 'mitjanes',
  'jobsearch.ocupabilitat.alta': 'altes',
  'jobsearch.experiencia': '{anys} anys d’experiència',
  'jobsearch.prestacio': 'Cobres {amount}/mes de prestació d’atur (has cotitzat).',
  'jobsearch.sensePrestacio':
    'Sense prou cotització, no tens dret a prestació d’atur: vius dels estalvis.',
  'jobsearch.bretxa':
    'La discriminació (gènere/origen) et rebaixa les ofertes ~{pct}% respecte d’algú altre amb el mateix currículum.',
  'jobsearch.net': 'net',
  'jobsearch.accept': 'Acceptar',
  'jobsearch.seguir': 'Segueix buscant un any →',
  'jobsearch.nota':
    'Acceptar una oferta no et consumeix l’any. Si segueixes buscant, passa un any: gastes estalvis i l’ànim baixa, però poden sortir ofertes millors.',
  'jobsearch.found.title': 'Has trobat feina!',
  'jobsearch.found.desc': 'Comences en una feina nova amb un sou de {sou} € bruts/mes.',
  'oferta.precaria': 'Feina precària',
  'oferta.estandard': 'Feina estàndard',
  'oferta.bona': 'Bona feina',

  // Habitatge (a partir dels 18)
  'habitatge.title': 'El teu habitatge',
  'habitatge.actual': 'On vius',
  'habitatge.lloguer': 'Lloguer',
  'habitatge.valor': 'Valor de la casa',
  'habitatge.casesCount': 'Valor de {n} casa/es',
  'habitatge.deute': 'Deute pendent',
  'habitatge.quota': 'Quota hipoteca',
  'habitatge.sensehipoteca': '✅ Hipoteca pagada del tot!',
  'habitatge.comprar': 'Comprar un habitatge',
  'habitatge.comprarMes': '🏠 Comprar una altra casa',
  'habitatge.tornarPares': 'Tornar a viure amb els pares',
  'habitatge.vendre.titol': 'Vendre una propietat',
  'habitatge.vendre.casa': 'Vendre la casa {n}',
  'habitatge.vendre.valor': 'Valor de mercat: {valor}',
  'habitatge.vendre.reps': 'Reps (net)',
  // Canvis de situació d'habitatge al historial (efecte sobre la referència de benestar).
  'hist.habitatge.amb_pares.title': 'Tornes a casa dels pares',
  'hist.habitatge.amb_pares.desc':
    'Deixes el lloguer i tornes amb la família: estalvies habitatge, però viure amb els pares de gran pesa sobre el benestar.',
  'hist.habitatge.habitacio.title': 'Vius en una habitació de lloguer',
  'hist.habitatge.habitacio.desc':
    'Una habitació és barata però precària: compartir i no tenir espai propi rebaixa una mica el benestar.',
  'hist.habitatge.pis_lloguer.title': 'Llogues un pis',
  'hist.habitatge.pis_lloguer.desc':
    'Un pis de lloguer dóna independència i espai propi: millora el benestar respecte a compartir o viure amb els pares.',
  'hist.habitatge.propietat.title': 'Compres una casa',
  'hist.habitatge.propietat.desc':
    'Tenir casa pròpia dóna seguretat i arrelament: és el que més apuja la referència de benestar de l’habitatge.',
  'hist.habitatge.venda.title': 'Véns una propietat',
  'hist.habitatge.venda.desc':
    'Converteixes l’immoble en diners líquids (descomptant cost de venda i hipoteca pendent). Si era l’última casa, tornes a viure de lloguer o amb els pares.',
  // Emprenedoria (empresa pròpia)
  'empresa.fundar.titol': 'Muntar una empresa',
  'empresa.fundar.avis':
    'La majoria d’empreses tanquen als pocs anys. El capital que hi posis queda EN RISC: si fracassa, el perds. Qui es pot permetre fallar moltes vegades acaba encertant-ne una; qui no, s’hi arruïna.',
  'empresa.fundar.risc':
    'Si l’empresa tanca (cada any es juga), perds tot aquest capital. Podràs tornar-ho a provar si et queden estalvis.',
  'empresa.fundar.accio': 'Fundar amb {capital}',
  'empresa.fundar.sensecapital':
    'Et calen com a mínim {minim} d’estalvis per arriscar-te a muntar una empresa.',
  'empresa.capitalInicial': 'Capital que hi inverteixes',
  'empresa.titol': 'La teva empresa',
  'empresa.anys': '{anys} anys',
  'empresa.any': 'any',
  'empresa.capital': 'Capital',
  'empresa.empleats': 'Empleats',
  'empresa.risc': 'Risc tancar',
  'empresa.beneficiTipic':
    'Benefici típic ~{benefici}/any (varia amb la sort; pot ser negatiu un mal any).',
  'empresa.souEmpleats': 'Sou dels empleats',
  'empresa.historic.titol': 'Historial de l’empresa',
  'empresa.historic.any': 'Edat',
  'empresa.historic.benefici': 'Benefici',
  'empresa.historic.reinvertit': 'Reinvertit',
  'empresa.historic.sou': 'El teu sou',
  'empresa.historic.fracas': 'L’empresa va tancar',
  'empresa.reinversio': 'Reinversió / el teu sou',
  'empresa.reinversio.desc':
    'El que reinverteixes fa créixer l’empresa (més benefici futur); la resta és el teu sou aquest any.',
  'empresa.saturada':
    'L’empresa ha arribat a la seva mida màxima: el mercat ja no absorbeix més creixement.',
  'empresa.tancar': 'Tancar i recuperar {capital}',
  'empresa.sou.precari': 'Precari',
  'empresa.sou.molt_baix': 'Molt baix',
  'empresa.sou.baix': 'Baix',
  'empresa.sou.mercat': 'Mercat',
  'empresa.sou.alt': 'Alt',
  'empresa.sou.molt_alt': 'Molt alt',
  'habitatge.buscarCasa': 'Buscar casa o pis',
  'habitatge.liquid': 'Tens {amount} per a l’entrada (efectiu + estalvi)',
  'habitatge.preu': 'Preu',
  'habitatge.entrada': 'Entrada (20%)',
  'habitatge.despeses': 'Despeses (impostos, notaria…)',
  'habitatge.aportacioInicial': 'Has de posar ara',
  'habitatge.parellaMeitat': 'La parella en paga la meitat',
  'habitatge.mercatLloguer': 'Ofertes de lloguer d’aquest any:',
  'habitatge.ajutFamiliar': 'Ajut familiar per a l’entrada',
  'habitatge.ajutHipoteca': 'Ajut familiar amb la quota',
  'habitatge.termini': 'Com ho pagues',
  'habitatge.anys': '{anys} anys',
  'habitatge.comptat': 'Al comptat',
  'habitatge.noEntrada': 'No tens prou diners per a l’entrada',
  'habitatge.bancRebutja': 'El banc no t’aprova la hipoteca amb el teu sou actual',
  'habitatge.confirmaCompra': 'Comprar i firmar la hipoteca',
  'tipusHabitatge.amb_pares': 'Amb els pares',
  'tipusHabitatge.habitacio': 'Habitació de lloguer',
  'tipusHabitatge.pis_lloguer': 'Pis de lloguer',
  'tipusHabitatge.propietat': 'Casa pròpia',
  'propietat.estudi': 'Estudi (cèntric, petit)',
  'propietat.pis_petit': 'Pis petit',
  'propietat.pis': 'Pis ampli',
  'propietat.casa': 'Casa amb jardí',

  // Accions (adolescència) — un torn = un any
  'action.title': 'Què fas aquest any?',
  'action.nota':
    'Tria les coses que vols fer aquest any: pots combinar-ne diverses mentre tinguis temps i diners.',
  'action.temps': 'Temps',
  'action.setmanes': 'setm.',
  'action.ajudaCasa': 'Ja dediques {setmanes} setm. a ajudar a casa: et queda menys temps lliure.',
  'action.viu': 'Viu aquest any →',
  'action.viuLliure': 'Un any tranquil →',
  'action.estudiar.label': 'Estudiar de valent',
  'action.estudiar.desc':
    'Dedicar-te als estudis. Costa una mica (menys temps lliure), però apuja el nivell acadèmic.',
  'action.sortir_amics.label': 'Sortir amb els amics',
  'action.sortir_amics.desc': 'Quedar, fer un beure, anar al cine... Costa, però va bé. Teixeix vincles.',
  'action.hobby.label': 'Una afició',
  'action.hobby.desc': 'Música, esport, dibuix... Hi dediques temps i et fa feliç.',
  'action.ajudar_casa.label': 'Ajudar a casa',
  'action.ajudar_casa.desc':
    'Feines i encàrrecs a la llar. A les famílies amb marge, et cau una paga; a les que van justes, és ajuda necessària i no remunerada.',
  'action.vendre_coses.label': 'Vendre coses de segona mà',
  'action.vendre_coses.desc': 'Et treus uns calerons venent el que ja no fas servir.',
  'action.caprici.label': 'Donar-te un caprici',
  'action.caprici.desc': 'Aquella cosa que tant vols. Alegria immediata, butxaca buida.',
  'action.feina_estiu.label': 'Feina d’estiu',
  'action.feina_estiu.desc': 'Treballar durant l’estiu: cansa, però omples la guardiola.',

  // Motius pels quals una acció està bloquejada
  'action.locked.diners': 'No tens prou diners',
  'action.locked.benestar': 'No tens prou ànims',
  'action.locked.edat16': 'Només a partir dels 16 anys',

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
    'A partir d’ara reps una paga i ets tu qui decideix, any rere any, si la gastes, l’estalvies o busques la manera de guanyar-ne més. Cada decisió compta.',
  'transition.continue': 'Començar l’institut →',

  'log.title': 'Història',
  'log.empty': 'Encara no ha passat res.',
  'log.choice': 'Decisió: {opcio}',

  'category.familia': 'Família',
  'category.economia': 'Economia',
  'category.regal': 'Regal',
  'category.salut': 'Salut',
  'category.escola': 'Escola',

  // Final de la partida (jubilació als 67)
  'gameover.title': 'Et jubiles als 67',
  'gameover.subtitle':
    'Després de tota una vida laboral, ha arribat el moment de plegar. És hora de mirar enrere i veure on t’han portat les teves decisions.',
  'gameover.final.solid.title': 'Una vida assentada',
  'gameover.final.solid.desc':
    'Arribes a la vida adulta amb una base sòlida. El camí ha donat fruits: tens marge i tranquil·litat.',
  'gameover.final.plena.title': 'Una vida plena',
  'gameover.final.plena.desc':
    'No has acumulat gaire patrimoni, però tens el que de debò sosté una vida: vincles, salut i sentit. La llibertat no sempre es compra.',
  'gameover.final.precaria.title': 'Anys de lluita',
  'gameover.final.precaria.desc':
    'Han estat anys durs i el marge segueix sent escàs. L’origen ha pesat, i remar a contracorrent esgota.',
  'gameover.final.mort.title': 'Fi del camí',
  'gameover.final.mort.desc':
    'Als {edat} anys, la salut s’ha esgotat del tot. Els anys, les malalties, l’estrès i els cops que no s’han pogut tractar a temps s’han acumulat fins al final. La vida s’acaba aquí.',
  'gameover.final.jub_daurada.title': 'Una jubilació daurada',
  'gameover.final.jub_daurada.desc':
    'Arribes als 67 amb la vida resolta: la pensió i les rendes del teu patrimoni cobreixen de sobres el que necessites. Pots gaudir d’aquests anys sense neguit.',
  'gameover.final.jub_tranquila.title': 'Una jubilació tranquil·la',
  'gameover.final.jub_tranquila.desc':
    'Et jubiles amb el just per viure amb dignitat: la pensió i els estalvis cobreixen el dia a dia. No t’ha sobrat, però te’n surts.',
  'gameover.final.jub_precaria.title': 'Una jubilació precària',
  'gameover.final.jub_precaria.desc':
    'Després de tota una vida, la jubilació torna a ser una lluita: la pensió no arriba i amb prou feines tens coixí. La precarietat t’ha acompanyat fins al final.',
  'gameover.benestarFinal': 'Benestar final',
  'gameover.patrimoniFinal': 'Patrimoni net',
  'gameover.desglos': 'De què es compon el teu patrimoni',
  'gameover.desglosBenestar': 'Per què el teu benestar (què t’apuja i què t’esfondra)',
  'desglos.titol': 'D’on surt el teu benestar',
  'desglos.nota':
    'El benestar gravita cap a aquesta referència. Cada factor hi suma o resta: per això la situació d’habitatge, els vincles o el deute es noten tant.',
  'desglos.base': 'Base vital',
  'desglos.ingres': 'Poder adquisitiu del sou',
  'desglos.patrimoni': 'Patrimoni acumulat',
  'desglos.habitatge': 'Situació d’habitatge',
  'desglos.vincles': 'Vincles i comunitat',
  'desglos.deute': 'Viure endeutat',
  'desglos.sequela': 'Seqüeles de salut',
  'desglos.petjada': 'Cost del consum',
  'desglos.precarietat': 'Precarietat d’origen',
  'gameover.notaInversio':
    'Un {pct}% del teu patrimoni està invertit i treballant per tu. L’interès compost premia qui inverteix aviat i s’hi manté, fins i tot quan el mercat tremola.',
  'gameover.notaLlegat':
    'Deixes {fills} fill/s. A cada un li tocaria un llegat d’uns {llegat}: com tu vas arrencar d’on et van deixar els teus pares, ells arrenquen d’aquí. Així es transmet (o no) l’avantatge entre generacions.',
  // Què ha marcat la vida: atribució del resultat a la seva FONT (estructura vs esforç).
  'gameover.factors.titol': 'Què t’ha marcat la vida',
  'gameover.factor.origen':
    'El teu origen, {classe}: el punt de sortida pesa més que cap altra cosa.',
  'gameover.factor.regim':
    'Vas viure sota un estat del benestar {regim}: les regles del joc no eren naturals, eren polítiques.',
  'gameover.factor.diploma':
    'Vas estudiar una carrera: el capital humà et va donar un terra de sou més alt.',
  'gameover.factor.negoci_just':
    'Vas tenir un negoci i vas pagar bé la teva gent: menys benefici per a tu, més dignitat per a ells.',
  'gameover.factor.negoci_explotador':
    'Vas tenir un negoci i vas pagar sous baixos: el teu dividend va sortir de la butxaca dels qui hi treballaven.',
  'gameover.factor.sindicat':
    'Et vas organitzar col·lectivament: el que no s’aconsegueix sol, es va arrencar en comú.',
  'gameover.factor.herencia':
    'L’herència (rebuda o deixada) va moure la teva línia: el capital es transmet entre generacions.',
  'gameover.factor.moral_bo':
    'Vas tractar bé els altres: no t’ho va pagar el mercat, però vas viure amb la consciència tranquil·la.',
  'gameover.factor.moral_malvat':
    'Vas trepitjar qui calia per pujar: el sistema premia qui no té escrúpols… fins que es passa comptes.',
  'gameover.contrafactic.residual':
    'Vas jugar amb les regles d’un estat mínim: sense xarxa, qui queia es quedava a terra. Amb un estat del benestar fort, el mateix esforç hauria rendit molt més — i molta més gent hauria arribat al final. La diferència no eres tu: era la regla.',
  'gameover.contrafactic.mixt':
    'Vas jugar amb les regles d’un estat del benestar a mitges: protegia una mica, però amb forats. Amb un estat més fort, el terra de tothom seria més alt; amb un de residual, molt més baix. Les regles es trien; no són naturals.',
  'gameover.contrafactic.socialdemocrata':
    'Vas jugar amb les regles d’un estat del benestar fort: el terra estava més amunt per a tothom, no només per a qui estalviava. Amb un estat residual, el mateix esforç t’hauria deixat molt més exposat. El context no el vas triar tu, però ho va canviar tot.',
  // Dinastia: herència i continuació amb un descendent
  'gameover.dinastia.titol': 'El llinatge continua',
  'gameover.dinastia.herencia':
    'Deixes {fills} fill/s. Cadascun hereta uns {llegat} (mort + herència en vida, menys impostos). Com tu vas arrencar d’on et van deixar els teus pares, ells arrenquen d’aquí.',
  'gameover.dinastia.continuar': 'Continuar com a fill/a (generació {generacio})',
  // Balanç de jubilació
  'gameover.jubilacio.titol': 'D’on viuràs a partir d’ara',
  'gameover.jubilacio.pensio': '🏛️ Pensió pública',
  'gameover.jubilacio.rendaPatrimoni': '📈 Rendes del patrimoni',
  'gameover.jubilacio.total': 'Renda total',
  'gameover.jubilacio.necessitats': 'El que necessites per viure',
  'gameover.jubilacio.daurada':
    'La teva renda de jubilació supera de sobres les teves necessitats: has construït un coixí sòlid.',
  'gameover.jubilacio.tranquila':
    'La teva renda de jubilació cobreix el que necessites per viure. Just, però suficient.',
  'gameover.jubilacio.precaria':
    'La teva renda de jubilació NO arriba al que necessites per viure: la vellesa serà ajustada i dependràs del que puguis estirar.',
  'gameover.soon':
    'Els anys de jubilació (com gastes el que has estalviat, la salut, els néts...) arribaran en una futura versió.',
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
    'Ha mort un familiar i t’ha deixat uns diners al teu compte. Tristesa i diners alhora.',

  'event.malaltia_lleu.title': 'Has agafat la grip',
  'event.malaltia_lleu.desc':
    'Una grip et té uns dies al llit. Res greu, però uns dies dolents.',

  'event.accident_petit.title': 'Un petit accident',
  'event.accident_petit.desc':
    'Una caiguda jugant t’ha portat a urgències. Ja estàs millor.',

  'event.bon_amic.title': 'Un bon amic',
  'event.bon_amic.desc':
    'Has fet un amic inseparable a l’escola. Us ho passeu d’allò més bé.',

  'event.connexio_profunda.title': 'Un moment que recordaràs',
  'event.connexio_profunda.desc':
    'Malgrat tot, un moment de connexió profunda a casa: una conversa, un riure, sentir-te acompanyat.',
  'event.tensio_llar.title': 'Tensió a casa',
  'event.tensio_llar.desc':
    'L’angoixa i el cansament esclaten en una mala temporada a casa. Et toca de prop.',

  'event.assetjament.title': 'Ho passes malament a l’escola',
  'event.assetjament.desc':
    'Uns companys t’han pres com a objectiu. Anar a classe s’ha fet dur.',

  'event.extraescolar.title': 'Una activitat extraescolar',
  'event.extraescolar.desc':
    'Pots apuntar-te a una activitat que t’agrada (esport, música...). T’hi apuntes?',
  'event.extraescolar.choice.apuntar': 'Apuntar-m’hi',
  'event.extraescolar.choice.no': 'Deixar-ho passar',

  'event.equip_esport.title': 'Un equip d’esport',
  'event.equip_esport.desc':
    'Pots entrar a l’equip del barri: entrenaments, partits i colla nova. T’hi apuntes?',
  'event.equip_esport.choice.apuntar': 'Apuntar-m’hi',
  'event.equip_esport.choice.ara_no': 'Ara no',
  'event.instrument.title': 'Aprendre un instrument',
  'event.instrument.desc':
    'Hi ha l’opció d’aprendre música. Costa constància, però omple.',
  'event.instrument.choice.aprendre': 'Aprendre’n',
  'event.instrument.choice.no': 'No, ara no',
  'event.fer_pinya.title': 'Un amic ho passa malament',
  'event.fer_pinya.desc':
    'Un company de classe necessita una mà. L’ajudes encara que et costi temps?',
  'event.fer_pinya.choice.ajudar': 'Ajudar-lo',
  'event.fer_pinya.choice.passar': 'Passar-ne',

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
    'T’ofereixen feina els caps de setmana ({amount} € l’any). L’acceptes?',
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

  // Sou i feina
  'event.demanar_augment.title': 'Vols demanar un augment',
  'event.demanar_augment.desc':
    'Creus que mereixes cobrar més. Et fa respecte, però... ho demanes?',
  'event.demanar_augment.choice.demanar': 'Demanar l’augment',
  'event.demanar_augment.choice.callar': 'Deixar-ho estar',

  'event.ascens.title': 'T’ofereixen un ascens',
  'event.ascens.desc':
    'Més responsabilitat i més sou, però també més hores i pressió. L’acceptes?',
  'event.ascens.choice.acceptar': 'Acceptar l’ascens',
  'event.ascens.choice.rebutjar': 'Quedar-te com estàs',

  'event.retallada.title': 'Et retallen el sou',
  'event.retallada.desc':
    'L’empresa va justa i abaixa sous. La teva nòmina se’n ressent.',

  'event.perdre_feina.title': 'Et quedes sense feina',
  'event.perdre_feina.desc':
    'Acomiadaments a l’empresa i et toca a tu. De cop, sense ingressos.',

  // A l'atur
  'event.oferta_feina.title': 'Una oferta de feina',
  'event.oferta_feina.desc':
    'Després de buscar, surt una feina. Sembla decent. L’acceptes?',
  'event.oferta_feina.choice.acceptar': 'Acceptar la feina',
  'event.oferta_feina.choice.esperar': 'Esperar-ne una de millor',

  'event.oferta_precaria.title': 'Una feina precària',
  'event.oferta_precaria.desc':
    'Surt una feina mal pagada i de poca cosa. Pitjor això que res?',
  'event.oferta_precaria.choice.acceptar': 'Acceptar-la igualment',
  'event.oferta_precaria.choice.rebutjar': 'Rebutjar-la',

  'event.feineta.title': 'Una feineta puntual',
  'event.feineta.desc': 'Et surt un “bolo” d’un dia ({amount} €). Sempre va bé.',

  'event.desanim.title': 'Desànim',
  'event.desanim.desc':
    'Tanta porta tancada desgasta. Costa mantenir les ganes de buscar.',

  // Nini
  'event.curset_pares.title': 'Els pares et paguen un curset',
  'event.curset_pares.desc':
    'A casa t’ofereixen pagar-te una formació per veure si t’hi enganxes. Hi vas?',
  'event.curset_pares.choice.apuntar': 'Apuntar-m’hi',
  'event.curset_pares.choice.passar': 'Passar-ne',

  // --- Xocs i decisions de vida (16+) ---
  'event.emergencia_salut.title': 'Una emergència de salut',
  'event.emergencia_salut.desc':
    'Un problema seriós que no pot esperar. El tractament costa {cost} €.',

  'event.accident.title': 'Has tingut un accident',
  'event.accident.desc':
    'Et pots tractar de seguida en una clínica privada ({cost} €) o esperar la pública. Què fas?',
  'event.accident.choice.privat': 'Anar al privat i recuperar-me ràpid',
  'event.accident.choice.public': 'Esperar la sanitat pública',

  'event.avaria.title': 'Una avaria seriosa',
  'event.avaria.desc':
    'Se t’ha espatllat una cosa important i la reparació puja {cost} €.',

  'event.multa.title': 'Una multa',
  'event.multa.desc': 'T’ha caigut una sanció de {cost} €. Quin disgust.',

  'event.amic_demana.title': 'Un amic et demana diners',
  'event.amic_demana.desc':
    'Un bon amic passa un mal moment i et demana {amount} €. L’ajudes?',
  'event.amic_demana.choice.deixar': 'Deixar-li els diners',
  'event.amic_demana.choice.no': 'Dir-li que no pots',

  'event.compra_temptadora.title': 'Una compra temptadora',
  'event.compra_temptadora.desc':
    'Hi ha una cosa que vols molt ({cost} €). Te la compres o et contens?',
  'event.compra_temptadora.choice.comprar': 'Comprar-la',
  'event.compra_temptadora.choice.contenir': 'Contenir-me',

  // --- Esdeveniments d'universitat (18→22) ---
  'event.examens_uni.title': 'Setmana d’exàmens finals',
  'event.examens_uni.desc':
    'Nits sense dormir i molta cafeïna. La pressió es nota.',

  'event.aprovar_curs.title': 'Aproves el curs',
  'event.aprovar_curs.desc':
    'Has tret el curs net. Una bona empenta d’autoconfiança.',

  'event.suspendre_uni.title': 'Et queden assignatures',
  'event.suspendre_uni.desc':
    'No ha anat com volies i arrossegues feina per al setembre.',

  'event.colla_uni.title': 'La colla de la facultat',
  'event.colla_uni.desc':
    'Has trobat gent amb qui compartir hores de biblioteca i de festa.',

  'event.festa_uni.title': 'Festa major universitària',
  'event.festa_uni.desc':
    'Concerts, amics i una nit per recordar ({cost} €).',

  'event.erasmus.title': 'Oportunitat d’Erasmus',
  'event.erasmus.desc':
    'Pots passar un curs a l’estranger ({cost} €). Una experiència única, però costa. Hi vas?',
  'event.erasmus.choice.anar': 'Marxar d’Erasmus',
  'event.erasmus.choice.quedarse': 'Quedar-me aquí',

  'event.beca_merit.title': 'Beca per mèrits',
  'event.beca_merit.desc':
    'Les teves notes t’han valgut una beca de {amount} €. Ben merescuda.',

  'event.practiques_uni.title': 'Pràctiques remunerades',
  'event.practiques_uni.desc':
    'Et surten pràctiques a una empresa ({amount} € el curs). Resten temps d’estudi. Les acceptes?',
  'event.practiques_uni.choice.acceptar': 'Acceptar les pràctiques',
  'event.practiques_uni.choice.rebutjar': 'Centrar-me en estudiar',

  // --- Esdeveniments de carrera adulta (→35) ---
  'event.pujada_anual.title': 'Revisió salarial',
  'event.pujada_anual.desc':
    'L’empresa reconeix la teva feina amb una pujada de sou.',

  'event.ascens_carrera.title': 'T’ofereixen un ascens',
  'event.ascens_carrera.desc':
    'Més sou i responsabilitat, però també més hores i estrès. L’acceptes?',
  'event.ascens_carrera.choice.acceptar': 'Acceptar l’ascens',
  'event.ascens_carrera.choice.rebutjar': 'Quedar-me com estic',

  'event.negociar_sou.title': 'Vols negociar el sou',
  'event.negociar_sou.desc':
    'Creus que mereixes cobrar més. És el moment de demanar-ho?',
  'event.negociar_sou.choice.negociar': 'Negociar amb el cap',
  'event.negociar_sou.choice.conformar': 'Deixar-ho estar',

  'event.retallada_carrera.title': 'Retallada a l’empresa',
  'event.retallada_carrera.desc':
    'Mal any per al sector i et toca apretar-te el cinturó.',

  'event.acomiadament.title': 'Et fan fora',
  'event.acomiadament.desc':
    'Una reestructuració i el teu lloc desapareix. De cop, sense sou.',

  'event.nova_feina.title': 'Una oferta millor',
  'event.nova_feina.desc':
    'Una altra empresa et vol i paga més. Canviar fa respecte… ho fas?',
  'event.nova_feina.choice.canviar': 'Acceptar la nova feina',
  'event.nova_feina.choice.quedarse': 'Quedar-me on soc',

  'event.crisi_mercat.title': 'Crac borsari',
  'event.crisi_mercat.desc':
    'Els mercats s’enfonsen i el teu fons indexat cau en picat. Respira: històricament, sempre s’ha recuperat.',

  'event.rally_mercat.title': 'La borsa s’enfila',
  'event.rally_mercat.desc':
    'Un bon any als mercats i el teu fons indexat puja amb força.',
  'event.projecte_exitos.title': 'Un projecte que surt bé',
  'event.projecte_exitos.desc':
    'Una feina ben feta crea valor i es reconeix: et puja el sou i la moral.',
  'event.muntar_negoci.title': 'Muntar un negoci',
  'event.muntar_negoci.desc':
    'Tens l’oportunitat d’emprendre. Pot multiplicar el teu patrimoni molt per damunt d’un sou… o fer-te fer figa. Com més formació, contactes i capital, més probabilitats d’èxit.',
  'event.muntar_negoci.choice.muntar': 'Arrisco i munto el negoci',
  'event.muntar_negoci.choice.no': 'Millor no arrisco',

  // Gestió del negoci: la política de sou dels empleats (explotació visible).
  'event.sou_empleats.title': 'Quant pagues els empleats?',
  'event.sou_empleats.desc':
    'El teu negoci tira gràcies a la gent que hi treballa. Decideixes què cobren: com menys els pagues, més dividend t’endús tu… però cada euro que t’estalvies surt de la seva butxaca. Què fas?',
  'event.sou_empleats.choice.precari': 'Sous precaris — màxim benefici per a mi',
  'event.sou_empleats.choice.molt_baix': 'Molt baixos',
  'event.sou_empleats.choice.baix': 'Baixos',
  'event.sou_empleats.choice.mercat': 'El que marca el mercat',
  'event.sou_empleats.choice.alt': 'Bons sous — comparteixo el benefici',
  'event.sou_empleats.choice.molt_alt': 'Sous molt alts i repartiment de beneficis',

  // Cruïlles morals universals.
  'event.frau_fiscal.title': 'Defraudar a Hisenda',
  'event.frau_fiscal.desc':
    'El teu gestor t’insinua una manera d’amagar ingressos i pagar molts menys impostos. És il·legal i deixa sense recursos els serveis públics, però ningú no se n’adonaria.',
  'event.frau_fiscal.choice.defraudar': 'Defraudo: m’estalvio els diners',
  'event.frau_fiscal.choice.pagar': 'Pago el que toca',
  'event.donatiu_solidari.title': 'Una causa que importa',
  'event.donatiu_solidari.desc':
    'Una entitat que coneixes lluita per una bona causa i necessita finançament. Podries fer-hi una donació generosa.',
  'event.donatiu_solidari.choice.donar': 'Hi dono {amount} €',
  'event.donatiu_solidari.choice.passar': 'Ara no puc',
  'event.voluntariat.title': 'Fer-te voluntari',
  'event.voluntariat.desc':
    'Et proposen dedicar unes hores a la setmana a ajudar els qui ho necessiten. No cobraràs res, però fa molt de bé (i te’n fa).',
  'event.voluntariat.choice.apuntar': 'M’hi apunto',
  'event.voluntariat.choice.no': 'No tinc temps',

  // Oportunitats depredadores (només si la moralitat ja no és alta).
  'event.desnonar_llogater.title': 'Pujar el lloguer o desnonar',
  'event.desnonar_llogater.desc':
    'Un dels teus pisos està llogat per sota del preu de mercat. Pots forçar-ne la sortida i tornar a llogar molt més car: és legal i molt rendible, però deixes una família al carrer.',
  'event.desnonar_llogater.choice.desnonar': 'Els faig fora i apujo el lloguer',
  'event.desnonar_llogater.choice.mantenir': 'Mantinc el lloguer assequible',
  'event.suborn_feina.title': 'Un sobre per sota la taula',
  'event.suborn_feina.desc':
    'Un proveïdor t’ofereix una bona comissió si l’afavoreixes en una adjudicació. Diners fàcils a canvi de mirar cap a una altra banda.',
  'event.suborn_feina.choice.acceptar': 'Accepto el suborn',
  'event.suborn_feina.choice.denunciar': 'El denuncio',

  // Acció col·lectiva (sindicat, vagues).
  'event.afiliar_sindicat.title': 'Sindicar-te',
  'event.afiliar_sindicat.desc':
    'Els companys de feina t’animen a afiliar-te al sindicat. Sol no pots gaire, però junts podeu negociar millors condicions i protegir-vos els uns als altres. Què fas?',
  'event.afiliar_sindicat.choice.afiliar': 'M’hi afilio',
  'event.afiliar_sindicat.choice.no': 'No m’hi vull complicar',
  'event.vaga.title': 'Convocatòria de vaga',
  'event.vaga.desc':
    'El sindicat convoca una vaga per millorar els sous i les condicions. Si la secundes, perds el jornal del dia… però la força és en el nombre.',
  'event.vaga.choice.secundar': 'Secundo la vaga',
  'event.vaga.choice.esquirol': 'Vaig a treballar igualment',

  'event.consell_inversio.title': 'Un consell financer',
  'event.consell_inversio.desc':
    'Un company et convenç dels avantatges del fons indexat. Hi mous fins a {amount} € de l’efectiu?',
  'event.consell_inversio.choice.invertir': 'Invertir-hi',
  'event.consell_inversio.choice.passar': 'Deixar-ho a efectiu',

  'event.cotxe_nou.title': 'Et cal un cotxe',
  'event.cotxe_nou.desc':
    'Necessites vehicle. Un de nou ({cost} €) o un de segona mà més assequible?',
  'event.cotxe_nou.choice.comprar': 'Comprar-lo nou',
  'event.cotxe_nou.choice.segona_ma': 'Buscar-ne un de segona mà',

  'event.viatge_adult.title': 'El viatge dels teus somnis',
  'event.viatge_adult.desc':
    'Una oportunitat de fer aquell viatge ({cost} €). Memorable, però costa. Hi vas?',
  'event.viatge_adult.choice.anar': 'Fer el viatge',
  'event.viatge_adult.choice.esperar': 'Deixar-ho per a un altre any',

  'event.formacio_adult.title': 'Formar-te més',
  'event.formacio_adult.desc':
    'Un curs especialitzat ({cost} €) que pot millorar el teu sou. Hi inverteixes?',
  'event.formacio_adult.choice.formar': 'Apuntar-m’hi',
  'event.formacio_adult.choice.passar': 'Ara no',

  'event.herencia_adult.title': 'Una herència',
  'event.herencia_adult.desc':
    'Es mor un familiar i t’hereta el que tenia. Tristesa i, alhora, un coixí.',

  'event.ajudar_familia_adult.title': 'La família necessita ajuda',
  'event.ajudar_familia_adult.desc':
    'Els teus pares passen un mal moment i et demanen {amount} €. Els ajudes?',
  'event.ajudar_familia_adult.choice.ajudar': 'Ajudar-los',
  'event.ajudar_familia_adult.choice.no_puc': 'No puc permetre-m’ho',

  // --- Salut (catàstrofe per al ric, erosió estructural per al pobre) ---
  'event.malaltia_greu.title': 'Una malaltia greu',
  'event.malaltia_greu.desc':
    'Un problema de salut seriós t’estira amunt: tractaments, baixa i una despesa de {cost} €. La família en cobreix el que pot; la resta, la pateixes tu.',
  'event.esgotament.title': 'Esgotament',
  'event.esgotament.desc':
    'Massa hores, massa pressió, poc descans. El cos i el cap passen factura.',
  'event.incapacitat.title': 'Una incapacitat',
  'event.incapacitat.desc':
    'Un accident o una malaltia greu et deixen seqüeles permanents. {cost} € de despeses i una vida que ja no torna a ser igual.',
  // Salut per edat (50+)
  'event.xacra_edat.title': 'El cos passa factura',
  'event.xacra_edat.desc':
    'Amb els anys apareixen xacres: l’esquena, les articulacions, el cansament. Res greu, però hi conviuràs a partir d’ara.',
  'event.operacio.title': 'Cal passar pel quiròfan',
  'event.operacio.desc':
    'Una operació que no pot esperar: {cost} € entre intervenció i recuperació, i una temporada tocat. Et deixa alguna seqüela.',
  'event.cura_pares_grans.title': 'Els pares es fan grans',
  'event.cura_pares_grans.desc':
    'Els teus pares ja no es valen sols i necessiten cures. Has de decidir com els atens (uns {amount} € de despesa).',
  'event.cura_pares_grans.choice.cuidar': 'Cuidar-los tu mateix',
  'event.cura_pares_grans.choice.residencia': 'Pagar una residència',
  // Salut mental (estrès / ansietat)
  'event.ansietat.title': 'Atacs d’ansietat',
  'event.ansietat.desc':
    'L’angoixa s’ha apoderat del teu dia a dia. Pots posar-t’hi en mans d’un professional (uns {cost} €) o intentar tirar endavant pel teu compte.',
  'event.ansietat.choice.terapia': 'Anar a teràpia',
  'event.ansietat.choice.aguantar': 'Aguantar com puguis',
  'event.estres_cronic.title': 'Estrès crònic',
  'event.estres_cronic.desc':
    'Jornades llargues, pocs descansos i pressió constant. El desgast no es veu, però et va menjant la salut.',
  // Herència que es rep dels pares
  'event.ajut_pares.title': 'Els pares t’ajuden',
  'event.ajut_pares.desc':
    'Els teus pares et donen un cop de mà econòmic. Un coixí que no tothom té: l’origen acomodat allunya de la precarietat.',
  'event.herencia_pares.title': 'Mor un dels teus pares',
  'event.herencia_pares.desc':
    'Perds un progenitor. Entre el dol, en reps l’herència: el que et deixen depèn del que la família va poder acumular.',
  'event.herencia_dinastia.title': 'Mor el teu progenitor',
  'event.herencia_dinastia.desc':
    'Mor qui et va precedir al llinatge. Reps l’herència que et va deixar (cases, fons, estalvis...): el que va poder acumular en vida, ara és teu.',
  // Herència en vida
  'event.herencia_en_vida.title': 'Ajudar els fills ara',
  'event.herencia_en_vida.desc':
    'Tens un coixí i els fills el necessiten per arrencar (un pis, un projecte...). Pots avançar-los part de l’herència ara, lliure d’impostos, o esperar.',
  'event.herencia_en_vida.choice.donar': 'Avançar-los una part',
  'event.herencia_en_vida.choice.no': 'Millor ho guardo',
  // Descendència
  'event.tenir_fill.title': 'Voleu tenir un fill?',
  'event.tenir_fill.desc':
    'Amb la teva parella us plantegeu formar una família. Un fill omple la vida de sentit i vincles, però també porta una despesa important durant molts anys.',
  'event.tenir_fill.choice.si': 'Sí, endavant',
  'event.tenir_fill.choice.no': 'Ara no toca',
  'familia.title': 'Família',
  'familia.parella': 'Parella',
  'familia.fill': 'Fill/a',
  'familia.edat': '{anys} anys',
  'event.fi_contracte_lloguer.title': 'No et renoven el contracte',
  'event.fi_contracte_lloguer.desc':
    'El propietari ven el pis i no et renova el lloguer. A corre-cuita, tornes a casa els pares mentre busques on viure.',
  'event.desnonament.title': 'Desnonament',
  'event.desnonament.desc':
    'Les pujades de lloguer t’ofeguen i acabes fora del pis. Un cop dur: tornes a casa els pares.',
  // Viure en una HABITACIÓ compartida (pitjor que un pis: conflictes, soroll, inestabilitat).
  'event.conflicte_companys.title': 'Tensió amb els companys de pis',
  'event.conflicte_companys.desc':
    'Compartir habitació/pis no sempre és fàcil: neteja, despeses, horaris… la convivència es tensa i es fa pesada.',
  'event.soroll_nit.title': 'Nits sense dormir',
  'event.soroll_nit.desc':
    'Parets primes, festes al costat, soroll del carrer. Dormir malament passa factura: estàs esgotat.',
  'event.pujada_habitacio.title': 'Et fan deixar l’habitació',
  'event.pujada_habitacio.desc':
    'El propietari apuja el preu de l’habitació o la necessita: a l’habitació de lloguer hi ha encara menys estabilitat. Tornes a casa els pares.',
  // Ser PROPIETARI: seguretat, però despeses pròpies de la casa.
  'event.derrama_comunitat.title': 'Derrama de la comunitat',
  'event.derrama_comunitat.desc':
    'La comunitat de veïns aprova una derrama (façana, ascensor…). Ser propietari també té costos que el llogater no paga.',
  'event.avaria_llar.title': 'Una avaria a casa',
  'event.avaria_llar.desc':
    'La caldera, una canonada, la teulada… quan ets propietari, les reparacions les pagues tu.',
  'event.la_meva_llar.title': 'La meva llar',
  'event.la_meva_llar.desc':
    'Tens casa pròpia: ningú no et pot fer fora. La seguretat d’un sostre que és teu dóna pau.',
  // Atzar: la sort i la mala sort de la vida (magnitud aleatòria).
  'event.cop_de_sort.title': 'Un cop de sort',
  'event.cop_de_sort.desc':
    'Un premi petit, una bonificació inesperada, una venda rodona… de tant en tant la sort somriu. Cap a la cartera!',
  'event.imprevist_car.title': 'Un imprevist car',
  'event.imprevist_car.desc':
    'El cotxe, una multa, una reparació urgent, un viatge no previst… la vida té sorpreses cares que toca pagar.',
  'event.herencia_llunyana.title': 'Una herència inesperada',
  'event.herencia_llunyana.desc':
    'Un parent llunyà que amb prou feines coneixies t’ha deixat alguna cosa. Ni te l’esperaves.',
  'event.estafa.title': 'T’han estafat',
  'event.estafa.desc':
    'Una inversió que prometia molt era un frau. Quan te n’adones, ja has perdut una part dels estalvis. Ningú no n’està exempt.',
  'event.desgracia_irreversible.title': 'Una desgràcia irreversible',
  'event.desgracia_irreversible.desc':
    'Un accident greu, una malaltia fulminant. De cop, sense avís i sense que hi puguis fer res. Et deixa una seqüela que t’acompanyarà la resta de la vida. La sort, de vegades, és cruel amb qualsevol.',
  'event.coneixer_parella.title': 'Una relació que arrela',
  'event.coneixer_parella.desc':
    'Coneixes algú amb qui compartir la vida. Formar parella no es compra amb el sou (pesa molt al benestar) i, a més, repartiu les despeses de la llar i obre la porta a tenir fills.',
  'event.coneixer_parella.choice.si': 'Sí, anem a viure junts',
  'event.coneixer_parella.choice.no': 'Millor sol/a de moment',
  'event.fill_fita_felic.title': 'Una fita del teu fill',
  'event.fill_fita_felic.desc':
    'Primeres passes, primer dia d’escola, una victòria… veure créixer la criatura t’omple d’orgull.',
  'event.fill_complicitat.title': 'Complicitat amb la canalla',
  'event.fill_complicitat.desc':
    'Una tarda de joc, una confidència, una rialla compartida. Els petits moments amb els fills teixeixen vincle.',
  'event.fill_dificultats.title': 'El teu fill ho passa malament',
  'event.fill_dificultats.desc':
    'Problemes a l’escola, una mala temporada, et preocupa veure’l patir. La criança també desgasta.',
  'event.fill_malaltia.title': 'El teu fill emmalalteix',
  'event.fill_malaltia.desc':
    'Un ensurt de salut de la criatura: visites, medicació i nits sense dormir. L’angoixa pesa, però cuidar-lo us uneix.',
  'event.arrelar_comunitat.title': 'Fer comunitat',
  'event.arrelar_comunitat.desc':
    'T’impliques al barri, al club, a un grup: gent amb qui comptar. Els vincles teixeixen una xarxa que sosté.',
  'event.aillament.title': 'Aïllament',
  'event.aillament.desc':
    'Entre la feina i les obligacions, t’has anat aïllant. La soledat pesa.',

  // --- A l'atur durant la carrera (mentre busques feina) ---
  'event.subsidi_atur.title': 'Cobres l’atur',
  'event.subsidi_atur.desc':
    'La prestació d’atur t’arriba ({amount} €) i et dóna una mica d’aire.',

  'event.desanim_adult.title': 'Desànim',
  'event.desanim_adult.desc':
    'Tantes portes tancades pesen. Costa mantenir l’ànim per seguir buscant.',

  // Etiquetes d'efecte i notes
  'effect.salari': 'Sou',
  'effect.salariNou': 'Nova feina',
  'effect.atur': 'Et quedes sense feina',
  'effect.despesaGreu': 'Despesa greu',
  'effect.mercat': 'Mercat',
  'effect.llegatEnVida': '🎁 Herència als fills',
  'note.donacio': 'La família cobreix {amount}',
  'note.descobert': 'No has pogut cobrir {amount} → benestar',
  'context.atur': 'A l’atur',
  'context.aturVoluntari': 'Sense feina (per decisió)',
}
