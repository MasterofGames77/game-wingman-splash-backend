"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const databaseConnections_1 = require("../utils/databaseConnections");
const User_1 = __importDefault(require("../models/User"));
const validator_1 = require("validator");
const mongodb_1 = require("mongodb");
const contentModeration_1 = require("../utils/contentModeration");
const cacheHeaders_1 = require("../utils/cacheHeaders");
const router = (0, express_1.Router)();
// Available forums to showcase on splash page
const SPLASH_PAGE_FORUMS = {
    supermario64wrspeedrun: {
        forumId: "forum_1748480234269_p7s8uq6wy",
        title: "Super Mario 64 World Record Speedrun",
        gameTitle: "Super Mario 64",
    },
    sonicunleashedrecompiled: {
        forumId: "forum_1749325232576_rj1ajsrwx",
        title: "Sonic Unleashed Recompiled",
        gameTitle: "Sonic Unleashed",
    },
    xenoblade3hero: {
        forumId: "forum_1760222601584_k4k6xncld",
        title: "Favorite Hero in Xenoblade Chronicles 3",
        gameTitle: "Xenoblade Chronicles 3",
    },
    celestegeneral: {
        forumId: "forum_1763160209962_x5ytzwz3a",
        title: "General Discussion",
        gameTitle: "Celeste",
    },
    jakanddaxtergeneral: {
        forumId: "forum_1763236935768_ih7j3ioea",
        title: "General Discussion",
        gameTitle: "Jak and Daxter: The Precursor Legacy",
    },
    apexlegendsgeneral: {
        forumId: "forum_1763236973075_bxzzix94i",
        title: "General Discussion",
        gameTitle: "Apex Legends",
    },
    eldenringlore: {
        forumId: "forum_1763681917979_3qgttdvtr",
        title: "Elden Ring Lore Discussion",
        gameTitle: "Elden Ring",
    },
    populationonemods: {
        forumId: "forum_1765116000030_1b7qw0ezu",
        title: "Mods",
        gameTitle: "Population: ONE",
    },
    sonicunleashedgeneral: {
        forumId: "forum_1765132200023_qxcmrzg6a",
        title: "General Discussion",
        gameTitle: "Sonic Unleashed",
    },
    candycrushgeneral: {
        forumId: "forum_1765150805927_hbtm3cuz6",
        title: "General Discussion",
        gameTitle: "Candy Crush Saga",
    },
    lastofusgameplay: {
        forumId: "forum_1765151756260_f3rhf8xjs",
        title: "Gameplay",
        gameTitle: "The Last of Us",
    },
    persona5royalhelp: {
        forumId: "forum_1765151949973_n6p0x4jtl",
        title: "Help & Support",
        gameTitle: "Persona 5: Royal",
    },
    xenoblade3general: {
        forumId: "forum_1765202400028_3bebk1iwx",
        title: "General Discussion",
        gameTitle: "Xenoblade Chronicles 3",
    },
    twopointmuseumgeneral: {
        forumId: "forum_1765218600020_esp7qcn89",
        title: "General Discussion",
        gameTitle: "Two Point Museum",
    },
    cyberpunk2077general: {
        forumId: "forum_1765226700037_obd4h66av",
        title: "General Discussion",
        gameTitle: "Cyberpunk 2077",
    },
    fzerogxgameplay: {
        forumId: "forum_1765303202811_k6sdc8fsb",
        title: "Gameplay",
        gameTitle: "F-Zero GX",
    },
    portal2general: {
        forumId: "forum_1765305000024_to7wisorn",
        title: "General Discussion",
        gameTitle: "Portal 2",
    },
    guiltygearstrivespeedruns: {
        forumId: "forum_1765371600044_lyloigfr7",
        title: "Speedruns",
        gameTitle: "Guilty Gear Strive",
    },
    uncharted2general: {
        forumId: "forum_1765371603574_xct3a4f68",
        title: "General Discussion",
        gameTitle: "Uncharted 2: Among Thieves",
    },
    supermeatboyspeedruns: {
        forumId: "forum_1765375200076_7k37mavqq",
        title: "Speedruns",
        gameTitle: "Super Meat Boy",
    },
    destiny2gameplay: {
        forumId: "forum_1765389600024_y0bkmus9y",
        title: "Gameplay",
        gameTitle: "Destiny 2",
    },
    raymanlegendsgameplay: {
        forumId: "forum_1765461600041_qmz75l03o",
        title: "Gameplay",
        gameTitle: "Rayman Legends",
    },
    celestegameplay: {
        forumId: "forum_1765476000035_pb3m35j0b",
        title: "Gameplay",
        gameTitle: "Celeste",
    },
    discoelysiumgeneral: {
        forumId: "forum_1765485900026_3t7qd4dkf",
        title: "General Discussion",
        gameTitle: "Disco Elysium",
    },
    eldenringspeedruns: {
        forumId: "forum_1765544400244_zwot700uo",
        title: "Speedruns",
        gameTitle: "Elden Ring",
    },
    theroomspeedruns: {
        forumId: "forum_1765544402914_x5sx5m1im",
        title: "Speedruns",
        gameTitle: "The Room (Game)",
    },
    titanfall2help: {
        forumId: "forum_1765562403375_1oyycofyl",
        title: "Help & Support",
        gameTitle: "Titanfall 2",
    },
    marvelsspidermanspeedruns: {
        forumId: "forum_1765564200033_2i7zz1z44",
        title: "Speedruns",
        gameTitle: "Marvel's Spider-Man",
    },
    lastofusgeneral: {
        forumId: "forum_1765572300021_ufrafordh",
        title: "General Discussion",
        gameTitle: "The Last of Us",
    },
    reddeadredemption2general: {
        forumId: "forum_1765630800043_poiuwxl56",
        title: "General Discussion",
        gameTitle: "Red Dead Redemption 2",
    },
    vampiremasqueradegameplay: {
        forumId: "forum_1765630803081_dohwiqa7x",
        title: "Gameplay",
        gameTitle: "Vampire: The Masquerade – Bloodhunt",
    },
    jakanddaxtergameplay: {
        forumId: "forum_1765650600021_5qpodadw1",
        title: "Gameplay",
        gameTitle: "Jak and Daxter: The Precursor Legacy",
    },
    assassinscreedvalhallageneral: {
        forumId: "forum_1765658700086_l98fb5asd",
        title: "General Discussion",
        gameTitle: "Assassin's Creed Valhalla",
    },
    dragonballfighterzgameplay: {
        forumId: "forum_1765717200148_kdsx0mujh",
        title: "Gameplay",
        gameTitle: "Dragon Ball FighterZ",
    },
    crashnsanegeneral: {
        forumId: "forum_1765720800037_umuwk5c97",
        title: "General Discussion",
        gameTitle: "Crash Bandicoot N-Sane Trilogy",
    },
    jakanddaxterspeedruns: {
        forumId: "forum_1765731600025_9qazdyc4y",
        title: "Speedruns",
        gameTitle: "Jak and Daxter: The Precursor Legacy",
    },
    thecrewmotorfestgeneral: {
        forumId: "forum_1765735200026_uk3s5hnlc",
        title: "General Discussion",
        gameTitle: "The Crew Motorfest",
    },
    harvestmoongameplay: {
        forumId: "forum_1765745100037_pv6lq4ewh",
        title: "Gameplay",
        gameTitle: "Harvest Moon",
    },
    crashbandicootnsanetrilogygameplay: {
        forumId: "forum_1765803600047_cr88cm4rf",
        title: "Gameplay",
        gameTitle: "Crash Bandicoot N-Sane Trilogy",
    },
    terrariagameplay: {
        forumId: "forum_1765821600040_nl5k2i19w",
        title: "Gameplay",
        gameTitle: "Terraria",
    },
    vampiremasqueradegeneral: {
        forumId: "forum_1765821603203_nttgvh862",
        title: "General Discussion",
        gameTitle: "Vampire: The Masquerade – Bloodhunt",
    },
    returnoftheobradinnmods: {
        forumId: "forum_1765823400030_pt19q5zpm",
        title: "Mods",
        gameTitle: "Return of the Obra Dinn",
    },
    bejeweledgameplay: {
        forumId: "forum_1765908000031_f1egw2poo",
        title: "Gameplay",
        gameTitle: "Bejeweled",
    },
    wipeoutomegacollectiongameplay: {
        forumId: "forum_1765908002702_f8d25potu",
        title: "Gameplay",
        gameTitle: "Wipeout Omega Collection",
    },
    theelderscrollsvgameplay: {
        forumId: "forum_1765909800276_ktm0b2ks2",
        title: "Gameplay",
        gameTitle: "The Elder Scrolls V: Skyrim",
    },
    supermarioodysseygameplay: {
        forumId: "forum_1765976400041_cr63gw075",
        title: "Gameplay",
        gameTitle: "Super Mario Odyssey",
    },
    storyofseasonshelp: {
        forumId: "forum_1765976403790_8to0xuhes",
        title: "Help & Support",
        gameTitle: "Story of Seasons",
    },
    theelderscrollsvgeneral: {
        forumId: "forum_1765980000034_7zjijo17s",
        title: "General Discussion",
        gameTitle: "The Elder Scrolls V: Skyrim",
    },
    portal2gameplay: {
        forumId: "forum_1765990800028_f7tra7i2j",
        title: "Gameplay",
        gameTitle: "Portal 2",
    },
    starwarsjedisurvivorgeneral: {
        forumId: "forum_1766077200027_hn2su1i2w",
        title: "General Discussion",
        gameTitle: "Star Wars Jedi: Survivor",
    },
    marvelsspidermangeneral: {
        forumId: "forum_1766080800046_a8gut80rh",
        title: "General Discussion",
        gameTitle: "Marvel's Spider-Man",
    },
    xenoblade3mods: {
        forumId: "forum_1766082600086_bk0tjrsr3",
        title: "Mods",
        gameTitle: "Xenoblade Chronicles 3",
    },
    zeldabreathofthewildmods: {
        forumId: "forum_1766090700026_778j09i7v",
        title: "Mods",
        gameTitle: "The Legend of Zelda: Breath of the Wild",
    },
    planetcoastergeneral: {
        forumId: "forum_1766098803286_jiu9mkja5",
        title: "General Discussion",
        gameTitle: "Planet Coaster",
    },
    uncharted2gameplay: {
        forumId: "forum_1766149200037_n543ogqon",
        title: "General Discussion",
        gameTitle: "Uncharted 2: Among Thieves",
    },
    thewitnessgeneral: {
        forumId: "forum_1766149202879_gcll70wi5",
        title: "General Discussion",
        gameTitle: "The Witness (Game)",
    },
    thewitcher3general: {
        forumId: "forum_1766163600031_kq36x5pil",
        title: "General Discussion",
        gameTitle: "The Witcher 3: Wild Hunt",
    },
    babaisyougeneral: {
        forumId: "forum_1766167202278_er25tt8gz",
        title: "General Discussion",
        gameTitle: "Baba is You",
    },
    tetrisgeneral: {
        forumId: "forum_1766195100370_hefugjhtk",
        title: "General Discussion",
        gameTitle: "Tetris",
    },
    overwatchgameplay: {
        forumId: "forum_1766235600039_o22ln5r7x",
        title: "Gameplay",
        gameTitle: "Overwatch",
    },
    eldenringhelp: {
        forumId: "forum_1766235604168_7wov1qikl",
        title: "Help & Support",
        gameTitle: "Elden Ring",
    },
    portal2mods: {
        forumId: "forum_1766250000027_xkn1y0y0d",
        title: "Mods",
        gameTitle: "Portal 2",
    },
    assassinscreedvalhallagameplay: {
        forumId: "forum_1766255400033_bg2wqb3j9",
        title: "Gameplay",
        gameTitle: "Assassin's Creed Valhalla",
    },
    pubgbattlegroundshelp: {
        forumId: "forum_1766322000048_okfsg7gfk",
        title: "Help & Support",
        gameTitle: "PUBG: Battlegrounds",
    },
    pokemonlegendsarceusmods: {
        forumId: "forum_1766325600027_8drfyhhmo",
        title: "Mods",
        gameTitle: "Pokémon Legends: Arceus",
    },
    citiesskylinesmods: {
        forumId: "forum_1766336400028_h7cd9mjg9",
        title: "Mods",
        gameTitle: "Cities: Skylines",
    },
    thewitnessgameplay: {
        forumId: "forum_1766340000027_c52z0spey",
        title: "Gameplay",
        gameTitle: "The Witness (Game)",
    },
    donkeykongcountryspeedruns: {
        forumId: "forum_1766349900040_krsoonmf2",
        title: "Speedruns",
        gameTitle: "Donkey Kong Country",
    },
    crashnsanetrilogyhelp: {
        forumId: "forum_1766408400041_m5ek27nmw",
        title: "Help & Support",
        gameTitle: "Crash Bandicoot N-Sane Trilogy",
    },
    baldursgate3mods: {
        forumId: "forum_1766408403807_uzsqwynq7",
        title: "Mods",
        gameTitle: "Baldur's Gate 3",
    },
    thecrewmotorfestmods: {
        forumId: "forum_1766426400044_qcycehgw2",
        title: "Mods",
        gameTitle: "The Crew Motorfest",
    },
    supermarioodysseygeneral: {
        forumId: "forum_1766498400033_fku88hylt",
        title: "General Discussion",
        gameTitle: "Super Mario Odyssey",
    },
    phasmophobiaspeedruns: {
        forumId: "forum_1767732300044_ppdbsos92",
        title: "Speedruns",
        gameTitle: "Phasmophobia",
    },
    uncharted2gameplay2: {
        forumId: "forum_1767790804028_jsbmpving",
        title: "Gameplay",
        gameTitle: "Uncharted 2: Among Thieves",
    },
    deadspacegameplay: {
        forumId: "forum_1767794400045_3ht7o54pd",
        title: "Gameplay",
        gameTitle: "Dead Space",
    },
    tenchustealthassassinsspeedruns: {
        forumId: "forum_1767805200039_vf41djbef",
        title: "Speedruns",
        gameTitle: "Tenchu: Stealth Assassins",
    },
    xenoblade3speedruns: {
        forumId: "forum_1767808800042_rngkyyegz",
        title: "Speedruns",
        gameTitle: "Xenoblade Chronicles 3",
    },
    castlevaniasymphonyofnightspeedruns: {
        forumId: "forum_1767808804987_jyn9u3qpz",
        title: "Speedruns",
        gameTitle: "Castlevania: Symphony of the Night",
    },
    sekirogeneral: {
        forumId: "forum_1767810600038_hfzqnmujn",
        title: "General Discussion",
        gameTitle: "Sekiro: Shadows Die Twice",
    },
    markoftheninjaspeedruns: {
        forumId: "forum_1767818700047_dugeftjyb",
        title: "Speedruns",
        gameTitle: "Mark of the Ninja",
    },
    tomclancysplintercellspeedruns: {
        forumId: "forum_1767877200048_l21a86kqx",
        title: "Speedruns",
        gameTitle: "Tom Clancy's Splinter Cell: Chaos Theory",
    },
    finalfantasyviigameplay: {
        forumId: "forum_1767877204692_romlj6pwn",
        title: "Gameplay",
        gameTitle: "Final Fantasy VII",
    },
    wiisportsgeneral: {
        forumId: "forum_1767895200061_x9m814h04",
        title: "General Discussion",
        gameTitle: "Wii Sports",
    },
    valorantgameplay: {
        forumId: "forum_1767895208558_4hag44uev",
        title: "Gameplay",
        gameTitle: "Valorant",
    },
    honorofkingsgeneral: {
        forumId: "forum_1767963600077_5e6nv51u8",
        title: "General Discussion",
        gameTitle: "Honor of Kings",
    },
    hitman3general: {
        forumId: "forum_1767981603240_n37zdvk52",
        title: "General Discussion",
        gameTitle: "Hitman 3",
    },
    starwarsjedisurvivorgameplay: {
        forumId: "forum_1767983400036_dfavztjaz",
        title: "Gameplay",
        gameTitle: "Star Wars Jedi: Survivor",
    },
    harvestmoongeneral: {
        forumId: "forum_1767991500052_apbj1bxso",
        title: "General Discussion",
        gameTitle: "Harvest Moon",
    },
    stardewvalleygeneral: {
        forumId: "forum_1768050000163_ymv9ip7rj",
        title: "General Discussion",
        gameTitle: "Stardew Valley",
    },
    raftgeneral: {
        forumId: "forum_1768050003238_jx6qnoim5",
        title: "General Discussion",
        gameTitle: "Raft",
    },
    dustelysiantailgameplay: {
        forumId: "forum_1768064400046_iy5t0q4a5",
        title: "Gameplay",
        gameTitle: "Dust: An Elysian Tail",
    },
    fzerogxgeneral: {
        forumId: "forum_1768068005337_s7degfsob",
        title: "General Discussion",
        gameTitle: "F-Zero GX",
    },
    donkeykongcountryhelp: {
        forumId: "forum_1768069800040_qbtf1negk",
        title: "Help & Support",
        gameTitle: "Donkey Kong Country",
    },
    shovelknightgameplay: {
        forumId: "forum_1768077900037_i6eg9zinu",
        title: "Gameplay",
        gameTitle: "Shovel Knight",
    },
    nierautomatagameplay: {
        forumId: "forum_1768136400054_bchcn3fef",
        title: "Gameplay",
        gameTitle: "NieR: Automata",
    },
    citiesskylinesgeneral: {
        forumId: "forum_1768150800037_20ewslsb8",
        title: "General Discussion",
        gameTitle: "Cities: Skylines",
    },
    supersmashbrosultimategeneral: {
        forumId: "forum_1768154400039_dalgdkhwl",
        title: "General Discussion",
        gameTitle: "Super Smash Bros. Ultimate",
    },
    thief2gameplay: {
        forumId: "forum_1768154403477_g67h5xb7w",
        title: "Gameplay",
        gameTitle: "Thief 2: The Metal Age",
    },
    cavestoryplusgeneral: {
        forumId: "forum_1768156200117_rt55ompcd",
        title: "General Discussion",
        gameTitle: "Cave Story+",
    },
    axiomvergehelp: {
        forumId: "forum_1768164300036_mloapl9nm",
        title: "Help & Support",
        gameTitle: "Axiom Verge",
    },
    nhl14general: {
        forumId: "forum_1768222800057_9f4owg2na",
        title: "General Discussion",
        gameTitle: "NHL 14",
    },
    microsoftflightsimulatorhelp: {
        forumId: "forum_1768222803904_3ngc4l2s9",
        title: "Help & Support",
        gameTitle: "Microsoft Flight Simulator",
    },
    dishonored2help: {
        forumId: "forum_1768240800086_7c1bzuoe9",
        title: "Help & Support",
        gameTitle: "Dishonored 2",
    },
    finalfantasyviispeedruns: {
        forumId: "forum_1768240806140_d1dm8d210",
        title: "Speedruns",
        gameTitle: "Final Fantasy VII",
    },
    alienisolationgameplay: {
        forumId: "forum_1768242600042_u69ctqz9h",
        title: "Gameplay",
        gameTitle: "Alien Isolation",
    },
    portal2speedruns: {
        forumId: "forum_1768250700095_7008m11cc",
        title: "Speedruns",
        gameTitle: "Portal 2",
    },
    banjokazooiegeneral: {
        forumId: "forum_1768309200127_3t8lo9tst",
        title: "General Discussion",
        gameTitle: "Banjo Kazooie",
    },
    hotshotsgolf3general: {
        forumId: "forum_1768309206454_clhwi9pup",
        title: "General Discussion",
        gameTitle: "Hot Shots Golf 3",
    },
    tomclancysplintercellgameplay: {
        forumId: "forum_1768312800043_05p5dlq3f",
        title: "Gameplay",
        gameTitle: "Tom Clancy's Splinter Cell: Chaos Theory",
    },
    pubgbattlegroundsgameplay: {
        forumId: "forum_1768327204006_039lcvhc0",
        title: "Gameplay",
        gameTitle: "PUBG: Battlegrounds",
    },
    tetrisspeedruns: {
        forumId: "forum_1768329000041_k595q0a6q",
        title: "Speedruns",
        gameTitle: "Tetris",
    },
    dustelysiantailgeneral: {
        forumId: "forum_1768337100050_27iq4yqyv",
        title: "General Discussion",
        gameTitle: "Dust: An Elysian Tail",
    },
    wipeoutomegacollectionhelp: {
        forumId: "forum_1768395600044_40opghlys",
        title: "Help & Support",
        gameTitle: "Wipeout Omega Collection",
    },
    diddykongracinggeneral: {
        forumId: "forum_1768395604876_8qd90u6q1",
        title: "General Discussion",
        gameTitle: "Diddy Kong Racing",
    },
    astrobotgeneral: {
        forumId: "forum_1768410000038_x1a2cnes6",
        title: "General Discussion",
        gameTitle: "Astro Bot",
    },
    raymanlegendsspeedruns: {
        forumId: "forum_1768413600053_fo1d1cmd5",
        title: "Speedruns",
        gameTitle: "Rayman Legends",
    },
    pokemonlegendsarceusgameplay: {
        forumId: "forum_1768413606836_f7s54r104",
        title: "Gameplay",
        gameTitle: "Pokémon Legends: Arceus",
    },
    ghostoftsushimageneral: {
        forumId: "forum_1768423500122_hw8btrpo1",
        title: "General Discussion",
        gameTitle: "Ghost of Tsushima",
    },
    mariogolfhelp: {
        forumId: "forum_1768482000054_sy22lls0s",
        title: "Help & Support",
        gameTitle: "Mario Golf",
    },
    pokemonplatinummods: {
        forumId: "forum_1768482005429_gjjlp2bzc",
        title: "Mods",
        gameTitle: "Pokémon Platinum",
    },
    bayonetta2general: {
        forumId: "forum_1768500000036_sovpszxi7",
        title: "General Discussion",
        gameTitle: "Bayonetta 2",
    },
    microsoftflightsimulatorgeneral: {
        forumId: "forum_1768501800053_5g8c1p9cl",
        title: "General Discussion",
        gameTitle: "Microsoft Flight Simulator",
    },
    powerwashsimulatorhelp: {
        forumId: "forum_1768568406120_gao24mfma",
        title: "Help & Support",
        gameTitle: "PowerWash Simulator",
    },
    chronotriggergeneral: {
        forumId: "forum_1768582800052_8kzrpkb1f",
        title: "General Discussion",
        gameTitle: "Chrono Trigger",
    },
    tetris99gameplay: {
        forumId: "forum_1768586400050_nfaqekg2d",
        title: "Gameplay",
        gameTitle: "Tetris 99",
    },
    sonicunleashedgameplay: {
        forumId: "forum_1768568400050_25zt7am3b",
        title: "Gameplay",
        gameTitle: "Sonic Unleashed",
    },
    wwe2k22gameplay: {
        forumId: "forum_1768586405538_62pxgdcei",
        title: "Gameplay",
        gameTitle: "WWE 2K22",
    },
    tomclancysplintercellhelp: {
        forumId: "forum_1768596300066_e4ns4f0ot",
        title: "Help & Support",
        gameTitle: "Tom Clancy's Splinter Cell: Chaos Theory",
    },
    sonicallstarsracingtransformedgeneral: {
        forumId: "forum_1768654800053_n5vzk4iqf",
        title: "General Discussion",
        gameTitle: "Sonic & All-Stars Racing Transformed",
    },
    pokemonlegendsarceushelp: {
        forumId: "forum_1768654805457_shs24cxla",
        title: "Help & Support",
        gameTitle: "Pokémon Legends: Arceus",
    },
    planetcoasterspeedruns: {
        forumId: "forum_1768658400043_ac07wypgc",
        title: "Speedruns",
        gameTitle: "Planet Coaster",
    },
    hollowknightgeneral: {
        forumId: "forum_1768672800039_gespebnxa",
        title: "General Discussion",
        gameTitle: "Hollow Knight",
    },
    mlbtheshow20gameplay: {
        forumId: "forum_1768672804786_80xyvr442",
        title: "Gameplay",
        gameTitle: "MLB The Show 20",
    },
    markoftheninjahelp: {
        forumId: "forum_1768674600032_et2ah0lbe",
        title: "Help & Support",
        gameTitle: "Mark of the Ninja",
    },
    planetcoasterhelp: {
        forumId: "forum_1768682700053_3mwrcf938",
        title: "Help & Support",
        gameTitle: "Planet Coaster",
    },
    dragonballfighterzgeneral: {
        forumId: "forum_1768741200065_c3tg5lyls",
        title: "General Discussion",
        gameTitle: "Dragon Ball FighterZ",
    },
    needforspeedmods: {
        forumId: "forum_1768759200055_ajedb5ptl",
        title: "Mods",
        gameTitle: "Need for Speed",
    },
    alienisolationgeneral: {
        forumId: "forum_1768759204509_419hgywm2",
        title: "General Discussion",
        gameTitle: "Alien Isolation",
    },
    dishonored2gameplay: {
        forumId: "forum_1768769100056_jnb8cmh7q",
        title: "Gameplay",
        gameTitle: "Dishonored 2",
    },
    blueprincegameplay: {
        forumId: "forum_1768827600040_gsmnaijx5",
        title: "Gameplay",
        gameTitle: "Blue Prince",
    },
    sonicmaniageneral: {
        forumId: "forum_1768827615491_p85qpxc9w",
        title: "General Discussion",
        gameTitle: "Sonic Mania",
    },
    donkeykongbananzaspeedruns: {
        forumId: "forum_1768831200056_l9ti1myon",
        title: "Speedruns",
        gameTitle: "Donkey Kong Bananza",
    },
    dragonballfighterzmods: {
        forumId: "forum_1768845600039_7dbrjjf88",
        title: "Mods",
        gameTitle: "Dragon Ball FighterZ",
    },
    castlevaniasymphonyofnightgeneral: {
        forumId: "forum_1768845604500_divlbfx60",
        title: "General Discussion",
        gameTitle: "Castlevania: Symphony of the Night",
    },
    supermeatboyhelp: {
        forumId: "forum_1768847400032_juovyznsc",
        title: "Help & Support",
        gameTitle: "Super Meat Boy",
    },
    markoftheninjagameplay: {
        forumId: "forum_1768855500047_n811b7e7x",
        title: "Gameplay",
        gameTitle: "Mark of the Ninja",
    },
    honorofkingshelp: {
        forumId: "forum_1768914000196_v6an9kbie",
        title: "Help & Support",
        gameTitle: "Honor of Kings",
    },
    dishonored2speedruns: {
        forumId: "forum_1768917600050_7k9hcrxn9",
        title: "Speedruns",
        gameTitle: "Dishonored 2",
    },
    untildawngameplay: {
        forumId: "forum_1768928400037_q0u4hf3uz",
        title: "Gameplay",
        gameTitle: "Until Dawn",
    },
    sonicmaniahelp: {
        forumId: "forum_1768932000047_gfd9k7dtv",
        title: "Help & Support",
        gameTitle: "Sonic Mania",
    },
    papermariothousandyeardoorgeneral: {
        forumId: "forum_1768933800059_avtb1p6wv",
        title: "General Discussion",
        gameTitle: "Paper Mario: The Thousand Year Door",
    },
    thewitcher3gameplay: {
        forumId: "forum_1767897000052_eed5je85k",
        title: "Gameplay",
        gameTitle: "The Witcher 3: Wild Hunt",
    },
    discoelysiumgameplay: {
        forumId: "forum_1765904400033_d1lmg3zfc",
        title: "Gameplay",
        gameTitle: "Disco Elysium",
    },
    pokemonlegendsarceusspeedruns: {
        forumId: "forum_1767978000049_c3s29vdxt",
        title: "Speedruns",
        gameTitle: "Pokémon Legends: Arceus",
    },
    finalfantasyviigeneral: {
        forumId: "forum_1768509900058_37e38rfq1",
        title: "General Discussion",
        gameTitle: "Final Fantasy VII",
    },
    genshinimpacthottakes: {
        forumId: "forum_1769000400048_ey04dbquh",
        title: "Hot Takes & Opinions",
        gameTitle: "Genshin Impact",
    },
    tetrismechanics: {
        forumId: "forum_1769000415285_bpobgyer2",
        title: "Mechanics & Strategies",
        gameTitle: "Tetris (Game Boy, 1989)",
    },
    hitmanbloodmoneyconsistency: {
        forumId: "forum_1769004000050_53g3m2e86",
        title: "PB Progress & Consistency",
        gameTitle: "Hitman: Blood Money",
    },
    astrobottips: {
        forumId: "forum_1769014800037_hvs35ue4b",
        title: "Need Tips / Advice",
        gameTitle: "Astro Bot",
    },
    supermeatboyfavmoments: {
        forumId: "forum_1769018400039_m6uw30c47",
        title: "Favorite Moments",
        gameTitle: "Super Meat Boy",
    },
    ghostoftsushimatips: {
        forumId: "forum_1769020200038_q0ctrmepu",
        title: "Gameplay Tips & Tech",
        gameTitle: "Ghost of Tsushima",
    },
    rivercitygirlswr: {
        forumId: "forum_1769028300033_w2no4ltwi",
        title: "World Record Discussion",
        gameTitle: "River City Girls",
    },
    clairobscur33help: {
        forumId: "forum_1769086800049_mw1fewvtk",
        title: "Help & Troubleshooting",
        gameTitle: "Clair Obscur: Expedition 33"
    },
    masseffect2story: {
        forumId: "forum_1769086816404_oify78cu3",
        title: "Characters & Story Talk",
        gameTitle: "Mass Effect 2",
    },
    oriandtheblindforestbeginner: {
        forumId: "forum_1769090400045_xjh8puzto",
        title: "Beginner Questions",
        gameTitle: "Ori and the Blind Forest",
    },
    dragonballfighterztips: {
        forumId: "forum_1769101200039_tjusspu5y",
        title: "Need Tips / Advice",
        gameTitle: "Dragon Ball FighterZ",
    },
    aceattorneygameplaytech: {
        forumId: "forum_1769104800036_yn3rj2xli",
        title: "Gameplay Tips & Tech",
        gameTitle: "Phoenix Wright: Ace Attorney"
    },
    left4dead2graphics: {
        forumId: "forum_1769104804445_kgph7jdm6",
        title: "Graphics / Texture Mods",
        gameTitle: "Left 4 Dead 2"
    },
    elderscrolls5pbprogress: {
        forumId: "forum_1769106600130_pmdnzljd7",
        title: "PB Progress & Consistency",
        gameTitle: "The Elder Scrolls V: Skyrim"
    },
    blueprincetips: {
        forumId: "forum_1769114700042_ej8ucltth",
        title: "Tips and Discoveries",
        gameTitle: "Blue Prince"
    },
    injustic2hottakes: {
        forumId: "forum_1769173200043_vgazg7jx3",
        title: "Hot Takes & Opinions",
        gameTitle: "Injustice 2"
    },
    madden24builds: {
        forumId: "forum_1769176800041_sf31644aa",
        title: "Builds / Loadouts / Setups",
        gameTitle: "Madden NFL 24"
    },
    supermario64mechanics: {
        forumId: "forum_1769187600034_bd7cbq583",
        title: "Mechanics & Strategies",
        gameTitle: "Super Mario 64"
    },
    wwe2k22fixes: {
        forumId: "forum_1769191200039_tpjyrfh3j",
        title: "Fixes & Workarounds",
        gameTitle: "WWE 2K22"
    },
    valheimoddingtools: {
        forumId: "forum_1769191207244_k4144k20k",
        title: "Modding Tools & Setup",
        gameTitle: "Valheim"
    },
    slaythespirehelp: {
        forumId: "forum_1769193000030_rr8c8cvx8",
        title: "Help & Troubleshooting",
        gameTitle: "Slay the Spire"
    },
    metalgearrisinghottakes: {
        forumId: "forum_1769201101553_9nat54h0m",
        title: "Hot Takes & Opinions",
        gameTitle: "Metal Gear Rising: Revengeance"
    },
    spidermangameplay: {
        forumId: "forum_1769259600055_n4916dm0x",
        title: "Gameplay Tips & Tech",
        gameTitle: "Marvel's Spider-Man"
    },
    warthunderadvancedtechniques: {
        forumId: "forum_1769259605534_jq5hlr3yi",
        title: "Advanced Techniques",
        gameTitle: "War Thunder"
    },
    astrobotanypercent: {
        forumId: "forum_1769263200052_skwoutfiv",
        title: "Any% Route & Strats",
        gameTitle: "Astro Bot"
    },
    conkurtimingwindo: {
        forumId: "forum_1769274000034_74s2e561p",
        title: "Timing Windows & Cycles",
        gameTitle: "Conkur's Bad Fur Day"
    },
    wipeoutfavmoments: {
        forumId: "forum_1769277600825_30q0johhq",
        title: "Favorite Moments",
        gameTitle: "Wipeout: Omega Collection"
    },
    sonicunleahsedfavmoments: {
        forumId: "forum_1769277607038_06x8f1zmj",
        title: "Favorite Moments",
        gameTitle: "Sonic Unleashed"
    },
    masseffect2timingwindows: {
        forumId: "forum_1769287500091_1nbilbjtb",
        title: "Timing Windows & Cycles",
        gameTitle: "Mass Effect 2"
    },
    aceattorneytips: {
        forumId: "forum_1769346001164_ksje6qvc9",
        title: "Tips and Discoveries",
        gameTitle: "Phoenix Wright: Ace Attorney"
    },
    residentevil7mechanics: {
        forumId: "forum_1769346007242_orekffjg5",
        title: " Mechanics & Strategies",
        gameTitle: "Resident Evil 7: Biohazard"
    },
    mlbtheshow20beginner: {
        forumId: "orum_1769349600109_b3xhcfzme",
        title: "Beginner Help Thread",
        gameTitle: "MLB The Show 20"
    },
    fallguysgameplaytips: {
        forumId: "forum_1769364008949_2flcz0kzx",
        title: " Gameplay Tips & Tech",
        gameTitle: "Fall Guys"
    },
    aceattorneyinvestigations: {
        forumId: "forum_1769365800841_urw2hpgvo",
        title: "Hot Takes & Opinions",
        gameTitle: "Ace Attorney Investigations: Miles Edgeworth"
    },
    theroomfavmoments: {
        forumId: "forum_1769373905108_3ivmn2z82",
        title: "Favorite Moments",
        gameTitle: "The Room (Game)"
    },
    uncharted3tips: {
        forumId: "forum_1769432402034_3fikyh7ep",
        title: "Tips and Discoveries",
        gameTitle: "Uncharted 3: Drake's Deception"
    },
    nierautomataspoilers: {
        forumId: "forum_1769436001075_62kdq3600",
        title: "Spoilers and Discussion",
        gameTitle: "NieR: Automata"
    },
    tetriss99hottakes: {
        forumId: "forum_1769446801230_qfyp46t9c",
        title: "Hot Takes & Opinions",
        gameTitle: "Tetris 99"
    },
    injustic2beginner: {
        forumId: "forum_1769450400050_1j5i5r63t",
        title: "Beginner Help Thread",
        gameTitle: "Injustice 2"
    },
    nhl14help: {
        forumId: "forum_1769450405660_8d08hewav",
        title: "Help & Troubleshooting",
        gameTitle: "NHL 14"
    },
    streetsofrage4beginner: {
        forumId: "forum_1769452200045_depa9qkds",
        title: "Beginner Questions",
        gameTitle: "Street of Rage 4"
    },
    sevendaystodie2beginner: {
        forumId: "forum_1769460300038_fkitdfv4q",
        title: "Beginner Questions",
        gameTitle: "7 Days to Die"
    },
    bloodstainedadvancedtech: {
        forumId: "forum_1769518800059_juxi2da3x",
        title: "Advanced Techniques",
        gameTitle: "Bloodstained: Ritual of the Night"
    },
    wwe2k22movement: {
        forumId: "forum_1769518806964_5tutkon63",
        title: "Movement Tech & Shortcuts",
        gameTitle: "WWE 2K22"
    },
    deadspacefixes: {
        forumId: "forum_1769522400060_h7fkoltqq",
        title: "Fixes & Workarounds",
        gameTitle: "Dead Space"
    },
    thelastofusbuilds: {
        forumId: "forum_1769533200036_8yvqq9g2a",
        title: "Builds / Loadouts / Setups",
        gameTitle: "The Last of Us"
    },
    nba2k11anypercent: {
        forumId: "forum_1769536800035_e0hdhphaw",
        title: "Any% Route & Strats",
        gameTitle: "NBA 2K11"
    },
    returnalbeginner: {
        forumId: "forum_1769536805643_z9hzdtvmp",
        title: "Beginner Questions",
        gameTitle: "Returnal"
    },
    assassinscreedvalhallagraphics: {
        forumId: "forum_1769538601210_s5hyga62q",
        title: "Graphics / Texture Mods",
        gameTitle: "Assassin's Creed Valhalla"
    },
    candycrushsagawr: {
        forumId: "forum_1769546700046_0uiizv961",
        title: "World Record Discussion",
        gameTitle: "Candy Crush Saga"
    },
    discoelysiummodding: {
        forumId: "forum_1769605201571_bozjcug4r",
        title: "Modding Tools & Setup",
        gameTitle: "Disco Elysium"
    },
    nhl14favmoments: {
        forumId: "forum_1769608801164_9w621ljhy",
        title: "Favorite Moments",
        gameTitle: "NHL 14"
    },
    tunichelp: {
        forumId: "forum_1769619600069_h6nu1smqz",
        title: "Help & Troubleshooting",
        gameTitle: "Tunic"
    },
    injustic2gameplaytips: {
        forumId: "forum_1769623200141_0z4tlsk6x",
        title: "Gameplay Tips & Tech",
        gameTitle: "Injustice 2"
    },
    powerwashsimulatormechanics: {
        forumId: "forum_1769623206849_01cybq75y",
        title: "Mechanics & Strategies",
        gameTitle: "PowerWash Simulator"
    },
    assassinscreedvalhallabeginnerquestions: {
        forumId: "forum_1769625000044_khiw04uxy",
        title: "Beginner Questions",
        gameTitle: "Assassin's Creed Valhalla"
    },
    nhl94help: {
        forumId: "forum_1769691600045_uqmy9i9pc",
        title: "Help & Troubleshooting",
        gameTitle: "NHL 94"
    },
    geometrydashhottakes: {
        forumId: "forum_1769691607241_pnhqemfym",
        title: "Hot Takes & Opinions",
        gameTitle: "Geometry Dash"
    },
    godofwarragnarokstuck: {
        forumId: "forum_1769695200037_jd7zk3woh",
        title: "Stuck? Ask Here",
        gameTitle: "God of War Ragnarök"
    },
    goldenaxefixes: {
        forumId: "forum_1769706000177_lm1z0q3v6",
        title: "Fixes & Workarounds",
        gameTitle: "Golden Axe"
    },
    phoenixwrightaceattorneyhelp: {
        forumId: "forum_1769709606492_n5cdkbnnk",
        title: "Help & Troubleshooting",
        gameTitle: "Phoenix Wright: Ace Attorney"
    },
    fatalfurycityofthewolvesgameplay: {
        forumId: "forum_1769711400035_z4whhzldu",
        title: "Gameplay Tips & Tech",
        gameTitle: "Fatal Fury: City of the Wolves"
    },
    mariosuperstarbaseballfixes: {
        forumId: "forum_1769719500031_jkv6v0ph0",
        title: "Fixes & Workarounds",
        gameTitle: "Mario Superstar Baseball"
    },
    soulcalibur2spoilers: {
        forumId: "forum_1769778001155_1ve7ovrgt",
        title: "Spoilers and Discussion",
        gameTitle: "Soulcalibur II"
    },
    neonwhitebeginner: {
        forumId: "forum_1769778006236_65sffm6er",
        title: "Beginner Questions",
        gameTitle: "Neon White"
    },
    sakurawarsgameplay: {
        forumId: "forum_1769781600046_dpyln0sg0",
        title: "Gameplay Tips & Tech",
        gameTitle: "Sakura Wars (2019)"
    },
    doubledragonspoilers: {
        forumId: "forum_1769796001783_9lqysvi69",
        title: "Spoilers and Discussion",
        gameTitle: "Double Dragon"
    },
    metalgearsolid2mechanics: {
        forumId: "forum_1769805900034_pfbl3bcob",
        title: "Mechanics & Strategies",
        gameTitle: "Metal Gear Solid 2: Sons of Liberty"
    },
    deadoralive3beginner: {
        forumId: "forum_1769864416759_64lsig7kf",
        title: "Beginner Help Thread",
        gameTitle: "Dead or Alive 3"
    },
    hadesIIpersonalbest: {
        forumId: "forum_1769878800056_vdu2w02zb",
        title: "PB Progress & Consistency",
        gameTitle: "Hades II"
    },
    dustpersonalbest: {
        forumId: "forum_1769882400039_4rt34c9m9",
        title: "PB Progress & Consistency",
        gameTitle: "Dust: An Elysian Tail"
    },
    soulcalibur2anypercent: {
        forumId: "forum_1769882403798_grzanx1li",
        title: "Any% Route & Strats",
        gameTitle: "Soulcalibur II"
    },
    untildawnanypercent: {
        forumId: "forum_1769884200161_ydzjntb4k",
        title: "Any% Route & Strats",
        gameTitle: "Until Dawn"
    },
    uncharted3beginner: {
        forumId: "forum_1769892300029_vrme0srhx",
        title: "Beginner Questions",
        gameTitle: "Uncharted 3: Drake's Deception"
    },
    arksurvivalworldrecord: {
        forumId: "forum_1769954400104_w26yf0thn",
        title: "World Record Discussion",
        gameTitle: "ARK: Survival Evolved"
    },
    hadesbeginner: {
        forumId: "forum_1769965200038_ff29ra2nx",
        title: "Beginner Questions",
        gameTitle: "Hades"
    },
    powerwashsimulatoroptimal: {
        forumId: "forum_1769968800089_8h793glhw",
        title: "Optimal Playthroughs & Routes",
        gameTitle: "PowerWash Simulator"
    },
    uncharted3optimal: {
        forumId: "forum_1769968804720_pk7n8xsdq",
        title: "Optimal Playthroughs & Routes",
        gameTitle: "Uncharted 3: Drake's Deception"
    },
    arksurvivalmodinstallation: {
        forumId: "forum_1769970600589_z1qchc7ed",
        title: "Mod Installation & Compatibility",
        gameTitle: "ARK: Survival Evolved"
    },
    riskofrain2beginner: {
        forumId: "forum_1769978700031_5q2oh4c0f",
        title: "Beginner Questions",
        gameTitle: "Risk of Rain 2"
    },
    azurestrikergunvoltspoilers: {
        forumId: "forum_1770037201911_5dkzrvuuo",
        title: "Spoilers and Discussion",
        gameTitle: "Azure Striker Gunvolt"
    },
    dragonquest3hd2dtechniques: {
        forumId: "forum_1770037213438_4m9le8y04",
        title: "Advanced Techniques",
        gameTitle: "Dragon Quest III HD-2D Remake"
    },
    thewitnessstory: {
        forumId: "forum_1770040803075_o65lnbr93",
        title: "Characters & Story Talk",
        gameTitle: "The Witness (Game)"
    },
    deadcellsstory: {
        forumId: "forum_1770051601077_pnpkrf1yc",
        title: "Characters & Story Talk",
        gameTitle: "Dead Cells"
    },
    nhl94movementtech: {
        forumId: "forum_1770055205761_brcv1iqmx",
        title: "Movement Tech & Shortcuts",
        gameTitle: "NHL 94"
    },
    nbajam93advancedtech: {
        forumId: "forum_1770057000031_up359rfka",
        title: "Advanced Techniques",
        gameTitle: "NBA Jam (1993)"
    },
    arksurvivalstorytalk: {
        forumId: "forum_1770065101027_mho4ey98u",
        title: "Characters & Story Talk",
        gameTitle: "ARK: Survival Evolved"
    }
};
// Default forum (Xenoblade Chronicles 3) for backward compatibility
const DEFAULT_FORUM_ID = SPLASH_PAGE_FORUMS.xenoblade3hero.forumId;
/**
 * Helper function to connect to Wingman database with proper error handling
 * Returns the database object or throws an error
 */
async function getWingmanDatabase() {
    if (!process.env.MONGODB_URI_WINGMAN) {
        throw new Error('Database configuration error: MONGODB_URI_WINGMAN not set');
    }
    let wingmanDB;
    try {
        wingmanDB = await (0, databaseConnections_1.connectToWingmanDB)();
    }
    catch (dbError) {
        console.error('Database connection error:', dbError);
        throw new Error(`Failed to connect to database: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`);
    }
    // Check if connection is usable
    // Mongoose readyState values:
    // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
    if (!wingmanDB) {
        console.error('Database connection object is not available');
        throw new Error('Database connection not available');
    }
    // Treat fully disconnected connections as an error, but allow "connecting" (2)
    // since the Mongo driver will queue operations until ready.
    if (wingmanDB.readyState === 0) {
        console.error('Database connection is disconnected. State:', wingmanDB.readyState);
        throw new Error('Database connection is disconnected');
    }
    // Ensure connection is ready (state 1 = connected)
    if (wingmanDB.readyState !== 1) {
        // Wait a bit for connection to be fully ready
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    // Access database - Mongoose 8+ connections expose the native MongoDB driver
    // Use getClient().db() method which is the most reliable way
    let db;
    try {
        // Mongoose 8+ has getClient() method - this is the most reliable way
        if (typeof wingmanDB.getClient === 'function') {
            const client = wingmanDB.getClient();
            if (client && typeof client.db === 'function') {
                db = client.db('vgWingman');
            }
        }
        // Fallback: try .db property (should work if dbName was specified in connection)
        if (!db && wingmanDB.db) {
            db = wingmanDB.db;
        }
    }
    catch (error) {
        console.error('Error accessing database:', error);
    }
    if (!db) {
        console.error('Database object not available - connection.db is undefined');
        console.error('Connection readyState:', wingmanDB.readyState);
        console.error('Connection has .db:', !!wingmanDB.db);
        console.error('Connection has getClient:', typeof wingmanDB.getClient === 'function');
        if (typeof wingmanDB.getClient === 'function') {
            try {
                const client = wingmanDB.getClient();
                console.error('Client type:', typeof client);
                console.error('Client has db method:', typeof client?.db === 'function');
            }
            catch (e) {
                console.error('Error getting client:', e);
            }
        }
        throw new Error('Failed to access database - native driver database not available');
    }
    // Verify it's the native MongoDB driver database object
    if (typeof db.collection !== 'function') {
        console.error('Database object does not have collection method - not a native MongoDB driver database');
        throw new Error('Database object is not a native MongoDB driver database');
    }
    return db;
}
/**
 * Helper function to get and validate forum ID from request
 * Checks query params first, then body, then defaults to Xenoblade forum
 */
function getForumId(req) {
    // Try query parameter first
    const forumIdFromQuery = String(req.query.forumId || '').trim();
    if (forumIdFromQuery) {
        // Validate it's one of our allowed forums
        const isValid = Object.values(SPLASH_PAGE_FORUMS).some(forum => forum.forumId === forumIdFromQuery);
        if (isValid) {
            return forumIdFromQuery;
        }
    }
    // Try body parameter (for POST/PUT/DELETE requests)
    const forumIdFromBody = req.body?.forumId;
    if (forumIdFromBody && typeof forumIdFromBody === 'string') {
        const trimmed = forumIdFromBody.trim();
        const isValid = Object.values(SPLASH_PAGE_FORUMS).some(forum => forum.forumId === trimmed);
        if (isValid) {
            return trimmed;
        }
    }
    // Default to Xenoblade forum for backward compatibility
    return DEFAULT_FORUM_ID;
}
/**
 * Helper function to convert timestamp to number (milliseconds since epoch)
 */
function getTimestampValue(post) {
    const timestamp = post.timestamp || post.createdAt || post.date;
    if (!timestamp)
        return 0;
    // If it's already a Date object, get time value
    if (timestamp instanceof Date) {
        return timestamp.getTime();
    }
    // If it's a number, assume it's already milliseconds
    if (typeof timestamp === 'number') {
        return timestamp;
    }
    // If it's a string, try to parse it as ISO date
    if (typeof timestamp === 'string') {
        const parsed = new Date(timestamp);
        return isNaN(parsed.getTime()) ? 0 : parsed.getTime();
    }
    return 0;
}
/**
 * Fetches all posts from all splash page forums
 * @param db - Database connection
 * @param gameTitle - Optional game title to filter by
 * @returns Array of posts with forum metadata
 */
async function getAllSplashPagePosts(db, gameTitle) {
    const forumsCollection = db.collection('forums');
    const allPostsWithForum = [];
    // Get all forum IDs from SPLASH_PAGE_FORUMS
    const forumIds = Object.values(SPLASH_PAGE_FORUMS).map(f => f.forumId);
    if (!forumIds || forumIds.length === 0) {
        console.warn('No forum IDs found in SPLASH_PAGE_FORUMS');
        return [];
    }
    // Build query - filter by forumId and optionally by gameTitle
    const query = { forumId: { $in: forumIds } };
    // Fetch all forums
    let forums;
    try {
        const cursor = forumsCollection.find(query, {
            projection: {
                _id: 0,
                forumId: 1,
                gameTitle: 1,
                title: 1,
                category: 1,
                posts: 1,
            }
        });
        // Ensure we're using the native MongoDB driver cursor
        forums = await cursor.toArray();
    }
    catch (queryError) {
        const errorMessage = queryError instanceof Error ? queryError.message : 'Unknown error';
        console.error('Database query error in getAllSplashPagePosts:', errorMessage);
        console.error('Query:', JSON.stringify(query, null, 2));
        throw new Error(`Database query failed: ${errorMessage}`);
    }
    if (!forums || forums.length === 0) {
        console.warn('No forums found matching query:', JSON.stringify(query, null, 2));
        return [];
    }
    // Process each forum
    for (const forum of forums) {
        // Apply game title filter if provided (case-insensitive, trimmed)
        if (gameTitle) {
            const forumGameTitle = (forum.gameTitle || '').trim();
            const filterGameTitle = gameTitle.trim();
            if (forumGameTitle.toLowerCase() !== filterGameTitle.toLowerCase()) {
                continue;
            }
        }
        // Find matching splash forum config for title format
        const splashForum = Object.values(SPLASH_PAGE_FORUMS).find(f => f.forumId === forum.forumId);
        const forumTitle = splashForum
            ? `${splashForum.gameTitle} - ${splashForum.title}`
            : (forum.gameTitle && forum.title
                ? `${forum.gameTitle} - ${forum.title}`
                : forum.title || 'Untitled Forum');
        const posts = forum.posts || [];
        // Add each post with forum metadata
        for (const post of posts) {
            allPostsWithForum.push({
                post,
                forumId: forum.forumId,
                gameTitle: forum.gameTitle || '',
                forumTitle,
                category: forum.category,
            });
        }
    }
    return allPostsWithForum;
}
/**
 * Transforms a post to the response format
 */
function transformPost(post, userId) {
    // Extract likes from metadata.likes (primary) or count metadata.likedBy array (fallback)
    let likes = 0;
    if (post.metadata && post.metadata.likes !== undefined && post.metadata.likes !== null) {
        // Primary: likes stored as number in metadata.likes
        likes = typeof post.metadata.likes === 'number' ? post.metadata.likes : 0;
    }
    else if (post.metadata && post.metadata.likedBy && Array.isArray(post.metadata.likedBy)) {
        // Fallback: count the likedBy array length
        likes = post.metadata.likedBy.length;
    }
    else if (post.likes !== undefined && post.likes !== null) {
        // Legacy fallback: check root-level likes
        if (Array.isArray(post.likes)) {
            likes = post.likes.length;
        }
        else if (typeof post.likes === 'number') {
            likes = post.likes;
        }
    }
    else if (post.likeCount !== undefined && post.likeCount !== null) {
        likes = typeof post.likeCount === 'number' ? post.likeCount : 0;
    }
    // Check if user has liked this post (only if userId is provided)
    let isLiked = false;
    if (userId && post.metadata && post.metadata.likedBy && Array.isArray(post.metadata.likedBy)) {
        isLiked = post.metadata.likedBy.includes(userId);
    }
    // Extract attachments from metadata.attachments
    const attachments = (post.metadata && post.metadata.attachments && Array.isArray(post.metadata.attachments))
        ? post.metadata.attachments
        : [];
    // Extract edited status and timestamp
    const isEdited = post.metadata && post.metadata.edited === true;
    const editedAt = post.metadata && post.metadata.editedAt
        ? post.metadata.editedAt
        : (post.metadata && post.metadata.lastEdited
            ? post.metadata.lastEdited
            : null);
    // Extract parentPostId (for replies)
    const parentPostId = post.parentPostId
        ? (post.parentPostId instanceof mongodb_1.ObjectId ? post.parentPostId.toString() : String(post.parentPostId))
        : null;
    return {
        postId: post._id?.toString() || null,
        author: post.username || post.author || post.postedBy || post.createdBy || 'Anonymous',
        content: post.message || post.content || post.text || '',
        timestamp: post.timestamp || post.createdAt || post.date || new Date().toISOString(),
        likes: likes,
        isLiked: isLiked,
        attachments: attachments,
        edited: isEdited,
        editedAt: editedAt,
        parentPostId: parentPostId,
        replies: [], // Will be populated by buildReplyTree
    };
}
/**
 * Validates that a parent post exists and returns its forum information
 * @param db - Database connection
 * @param parentPostId - The post ID to validate
 * @returns Object with forumId and parent post, or null if not found
 */
async function validateParentPost(db, parentPostId) {
    if (!mongodb_1.ObjectId.isValid(parentPostId)) {
        return null;
    }
    const forumsCollection = db.collection('forums');
    // Search all splash page forums for the parent post
    const forumIds = Object.values(SPLASH_PAGE_FORUMS).map(f => f.forumId);
    const cursor = forumsCollection.find({ forumId: { $in: forumIds } }, { projection: { forumId: 1, posts: 1 } });
    const forums = await cursor.toArray();
    // Search through all forums to find the parent post
    for (const forum of forums) {
        const posts = forum.posts || [];
        const parentPost = posts.find((post) => {
            const postId = post._id?.toString();
            return postId === parentPostId;
        });
        if (parentPost) {
            return {
                forumId: forum.forumId,
                parentPost: parentPost,
            };
        }
    }
    return null;
}
/**
 * Builds a nested reply tree structure from flat post list
 * Separates top-level posts from replies and nests replies under their parents
 */
function buildReplyTree(postsWithForum, userId) {
    // Transform all posts to response format
    const allPosts = postsWithForum.map(({ post, forumId, gameTitle, forumTitle, category }) => {
        const transformed = transformPost(post, userId);
        transformed.forumId = forumId;
        transformed.gameTitle = gameTitle;
        transformed.forumTitle = forumTitle;
        // Add category information
        if (category) {
            transformed.category = category;
        }
        // Extract category display name - prioritize SPLASH_PAGE_FORUMS title (contains exact category name)
        // This handles both standard categories (e.g., "General Discussion", "Gameplay") 
        // and unique category titles (e.g., "Hot Takes & Opinions", "Mechanics & Strategies")
        let categoryDisplayName;
        // First priority: Use title from SPLASH_PAGE_FORUMS (contains the exact category display name)
        const splashForum = Object.values(SPLASH_PAGE_FORUMS).find(f => f.forumId === forumId);
        if (splashForum && splashForum.title) {
            // The title field in SPLASH_PAGE_FORUMS is the category name
            // Examples: "General Discussion", "Gameplay", "Hot Takes & Opinions", "Need Tips / Advice"
            categoryDisplayName = splashForum.title;
        }
        // Fallback: extract from forumTitle if not found in SPLASH_PAGE_FORUMS
        if (!categoryDisplayName && forumTitle.includes(' - ')) {
            const parts = forumTitle.split(' - ');
            if (parts.length > 1) {
                categoryDisplayName = parts.slice(1).join(' - ');
            }
        }
        // Last fallback: format the database category field
        if (!categoryDisplayName && category) {
            // Map common category values to display names
            const categoryMap = {
                'gameplay': 'Gameplay',
                'help': 'Help & Support',
                'speedruns': 'Speedruns',
                'mods': 'Mods',
                'general': 'General Discussion',
            };
            const categoryLower = category.toLowerCase().trim();
            if (categoryMap[categoryLower]) {
                categoryDisplayName = categoryMap[categoryLower];
            }
            else {
                // Format category: capitalize first letter of each word
                categoryDisplayName = category
                    .split(' ')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                    .join(' ');
            }
        }
        // Always set categoryDisplayName if we have any category information
        if (categoryDisplayName) {
            transformed.categoryDisplayName = categoryDisplayName;
        }
        return transformed;
    });
    // Separate top-level posts from replies
    const topLevelPosts = [];
    const repliesMap = new Map(); // Map of parentPostId -> replies[]
    for (const post of allPosts) {
        // Check if this is a reply (has parentPostId)
        const parentId = post.parentPostId;
        if (parentId) {
            // This is a reply - add to replies map
            if (!repliesMap.has(parentId)) {
                repliesMap.set(parentId, []);
            }
            repliesMap.get(parentId).push(post);
        }
        else {
            // This is a top-level post
            topLevelPosts.push(post);
        }
    }
    // Sort replies by timestamp (newest first)
    for (const [parentId, replies] of repliesMap.entries()) {
        replies.sort((a, b) => {
            const timeA = getTimestampValue({ timestamp: a.timestamp });
            const timeB = getTimestampValue({ timestamp: b.timestamp });
            return timeB - timeA; // Newest first
        });
    }
    // Attach replies to their parent posts
    for (const post of topLevelPosts) {
        const postId = post.postId;
        if (postId && repliesMap.has(postId)) {
            post.replies = repliesMap.get(postId);
        }
        else {
            post.replies = [];
        }
    }
    // Sort top-level posts by timestamp (newest first)
    topLevelPosts.sort((a, b) => {
        const timeA = getTimestampValue({ timestamp: a.timestamp });
        const timeB = getTimestampValue({ timestamp: b.timestamp });
        // If timestamps are equal, use post ID as tiebreaker for stable sort
        if (timeB === timeA) {
            const idA = a.postId || '';
            const idB = b.postId || '';
            return idB.localeCompare(idA); // Descending order for IDs
        }
        return timeB - timeA; // Descending order (newest first)
    });
    return topLevelPosts;
}
/**
 * GET /api/public/forum-posts
 * Returns posts from all forums in a unified feed for the splash page
 * Query params:
 *   - gameTitle: (optional) Filter posts by game title (e.g., "Xenoblade Chronicles 3")
 *   - limit: number of posts to return (default: 50, max: 100)
 *   - offset: number of posts to skip (default: 0) - for pagination
 *   - userId: (optional) user's userId to check if they've liked each post
 *
 * Usage:
 *   - Initial load: GET /api/public/forum-posts?limit=50 (loads 50 posts from all games)
 *   - With game filter: GET /api/public/forum-posts?gameTitle=Xenoblade%20Chronicles%203&limit=50
 *   - With user context: GET /api/public/forum-posts?limit=50&userId=user-xxx (includes isLiked field)
 *   - Load more: GET /api/public/forum-posts?limit=50&offset=50&userId=user-xxx
 */
router.get('/public/forum-posts', cacheHeaders_1.cachePresets.forumPosts, cacheHeaders_1.addETag, async (req, res) => {
    try {
        // Get userId from query params (optional)
        const userId = String(req.query.userId || '').trim();
        // Get gameTitle filter (optional)
        const gameTitle = String(req.query.gameTitle || '').trim() || undefined;
        // Parse and validate limit parameter
        const limitParam = req.query.limit;
        let limit = 50; // default: show 50 posts initially
        if (limitParam) {
            const parsedLimit = parseInt(String(limitParam), 10);
            if (!isNaN(parsedLimit) && parsedLimit > 0) {
                limit = Math.min(parsedLimit, 100); // cap at 100
            }
        }
        // Parse and validate offset parameter
        const offsetParam = req.query.offset;
        let offset = 0; // default: start from beginning
        if (offsetParam) {
            const parsedOffset = parseInt(String(offsetParam), 10);
            if (!isNaN(parsedOffset) && parsedOffset >= 0) {
                offset = parsedOffset;
            }
        }
        // Connect to main application database
        let db;
        try {
            db = await getWingmanDatabase();
        }
        catch (dbError) {
            const errorMessage = dbError instanceof Error ? dbError.message : 'Unknown database error';
            console.error('Database error in forum-posts:', errorMessage);
            return res.status(500).json({
                success: false,
                message: errorMessage,
            });
        }
        // Fetch all posts from all splash page forums
        let allPostsWithForum;
        try {
            allPostsWithForum = await getAllSplashPagePosts(db, gameTitle);
        }
        catch (fetchError) {
            const errorMessage = fetchError instanceof Error ? fetchError.message : 'Unknown error';
            console.error('Error fetching posts from forums:', errorMessage);
            console.error('Error stack:', fetchError instanceof Error ? fetchError.stack : 'No stack trace');
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch posts from forums',
                error: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
            });
        }
        // Deduplicate posts by _id to prevent showing the same post multiple times
        const seenPostIds = new Set();
        const uniquePostsWithForum = allPostsWithForum.filter(({ post }) => {
            const postId = post._id?.toString();
            if (!postId)
                return true; // Keep posts without IDs (shouldn't happen, but be safe)
            if (seenPostIds.has(postId)) {
                return false; // Skip duplicate
            }
            seenPostIds.add(postId);
            return true;
        });
        // Build reply tree structure (nested replies under posts)
        const postsWithReplies = buildReplyTree(uniquePostsWithForum, userId || undefined);
        // Apply pagination: slice posts array based on offset and limit
        const paginatedPosts = postsWithReplies.slice(offset, offset + limit);
        // Get list of available games for filter
        const availableGames = Array.from(new Set(Object.values(SPLASH_PAGE_FORUMS).map(f => f.gameTitle))).sort();
        // Return unified feed with nested replies
        return res.status(200).json({
            success: true,
            posts: paginatedPosts,
            count: paginatedPosts.length,
            totalPosts: postsWithReplies.length,
            hasMore: offset + limit < postsWithReplies.length,
            availableGames: availableGames,
        });
    }
    catch (error) {
        console.error('Error fetching forum posts for preview:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const errorStack = error instanceof Error ? error.stack : undefined;
        console.error('Error details:', { message: errorMessage, stack: errorStack });
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch forum posts',
            // Include error details in development only
            ...(process.env.NODE_ENV === 'development' && {
                error: errorMessage,
                stack: errorStack
            })
        });
    }
});
/**
 * GET /api/public/forum-posts/available-forums
 * Returns list of available forums for the splash page
 */
router.get('/public/forum-posts/available-forums', cacheHeaders_1.cachePresets.staticContent, cacheHeaders_1.addETag, async (req, res) => {
    try {
        const forums = Object.values(SPLASH_PAGE_FORUMS).map(forum => {
            const displayTitle = `${forum.gameTitle} - ${forum.title}`; // Format: "Game Title - Forum Title"
            return {
                forumId: forum.forumId,
                title: displayTitle, // Use displayTitle format for title field to ensure frontend gets correct format
                gameTitle: forum.gameTitle,
                displayTitle: displayTitle, // Also provide as separate field for explicit use
            };
        });
        return res.status(200).json({
            success: true,
            forums: forums,
            defaultForumId: DEFAULT_FORUM_ID,
        });
    }
    catch (error) {
        console.error('Error fetching available forums:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch available forums',
        });
    }
});
/**
 * GET /api/public/forum-posts/available-games
 * Returns list of available games with post counts for filtering
 * Response includes:
 *   - gameTitle: Name of the game
 *   - forumCount: Number of forums for this game
 *   - postCount: Total number of top-level posts across all forums for this game
 */
router.get('/public/forum-posts/available-games', cacheHeaders_1.cachePresets.staticContent, cacheHeaders_1.addETag, async (req, res) => {
    try {
        // Connect to database
        let db;
        try {
            db = await getWingmanDatabase();
        }
        catch (dbError) {
            const errorMessage = dbError instanceof Error ? dbError.message : 'Unknown database error';
            console.error('Database error in available-games:', errorMessage);
            return res.status(500).json({
                success: false,
                message: errorMessage,
            });
        }
        // Get all forum IDs from SPLASH_PAGE_FORUMS
        const forumIds = Object.values(SPLASH_PAGE_FORUMS).map(f => f.forumId);
        const forumsCollection = db.collection('forums');
        // Fetch all forums
        const cursor = forumsCollection.find({ forumId: { $in: forumIds } }, { projection: { forumId: 1, gameTitle: 1, posts: 1 } });
        const forums = await cursor.toArray();
        // Group forums by gameTitle and count posts
        const gameMap = new Map();
        for (const forum of forums) {
            const gameTitle = forum.gameTitle || '';
            const posts = forum.posts || [];
            // Count only top-level posts (posts without parentPostId)
            const topLevelPosts = posts.filter((post) => {
                return !post.parentPostId || post.parentPostId === null;
            });
            if (gameMap.has(gameTitle)) {
                const existing = gameMap.get(gameTitle);
                existing.forumCount += 1;
                existing.postCount += topLevelPosts.length;
            }
            else {
                gameMap.set(gameTitle, {
                    gameTitle: gameTitle,
                    forumCount: 1,
                    postCount: topLevelPosts.length,
                });
            }
        }
        // Convert map to array and sort by gameTitle
        const games = Array.from(gameMap.values()).sort((a, b) => {
            return a.gameTitle.localeCompare(b.gameTitle);
        });
        return res.status(200).json({
            success: true,
            games: games,
        });
    }
    catch (error) {
        console.error('Error fetching available games:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch available games',
        });
    }
});
/**
 * GET /api/public/forum-posts/verify-user
 * Verifies if an email is on the waitlist or approved, returns userId
 * Query params:
 *   - email: user's email address
 */
router.get('/public/forum-posts/verify-user', async (req, res) => {
    try {
        const email = String(req.query.email || '').toLowerCase().trim();
        if (!email || !(0, validator_1.isEmail)(email)) {
            return res.status(400).json({
                success: false,
                message: 'Valid email is required',
            });
        }
        // Check if user exists in splash page database
        const user = await User_1.default.findOne({ email }).lean().exec();
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Email not found on waitlist. Please sign up first.',
            });
        }
        // User exists - return userId (they can post whether approved or on waitlist)
        return res.status(200).json({
            success: true,
            userId: user.userId,
            email: user.email,
            isApproved: user.isApproved,
            hasProAccess: user.hasProAccess,
        });
    }
    catch (error) {
        console.error('Error verifying user:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to verify user',
        });
    }
});
/**
 * GET /api/public/forum-posts/check-status
 * Checks if a user can post (hasn't posted yet, or has 1 post they can manage)
 * Query params:
 *   - forumId: (optional) forum ID to check (defaults to Xenoblade Chronicles 3 forum)
 *   - userId: user's userId
 */
router.get('/public/forum-posts/check-status', async (req, res) => {
    try {
        // Get forum ID from query params (with validation and default)
        const forumId = getForumId(req);
        const userId = String(req.query.userId || '').trim();
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'userId is required',
            });
        }
        if (!process.env.MONGODB_URI_WINGMAN) {
            console.error('MONGODB_URI_WINGMAN not set');
            return res.status(500).json({
                success: false,
                message: 'Database configuration error: MONGODB_URI_WINGMAN not set',
            });
        }
        // Connect to database with better error handling
        let wingmanDB;
        try {
            wingmanDB = await (0, databaseConnections_1.connectToWingmanDB)();
        }
        catch (dbError) {
            console.error('Database connection error in check-status:', dbError);
            return res.status(500).json({
                success: false,
                message: 'Failed to connect to database',
                error: dbError instanceof Error ? dbError.message : 'Unknown database error',
            });
        }
        // Check if connection is ready
        if (!wingmanDB || wingmanDB.readyState !== 1) {
            console.error('Database connection not ready. State:', wingmanDB?.readyState);
            return res.status(500).json({
                success: false,
                message: 'Database connection not ready',
            });
        }
        // Access database - mongoose.Connection has .db property
        const db = wingmanDB.db || wingmanDB;
        if (!db) {
            console.error('Database object not available');
            return res.status(500).json({
                success: false,
                message: 'Failed to access database',
            });
        }
        const forumsCollection = db.collection('forums');
        const forum = await forumsCollection.findOne({ forumId: forumId });
        if (!forum) {
            return res.status(404).json({
                success: false,
                message: 'Forum not found',
            });
        }
        const posts = forum.posts || [];
        // Find user's post(s) - check createdBy field (which should be userId)
        const userPost = posts.find((post) => post.createdBy === userId);
        if (userPost) {
            // User has a post - return it so they can edit/delete
            const attachments = (userPost.metadata && userPost.metadata.attachments && Array.isArray(userPost.metadata.attachments))
                ? userPost.metadata.attachments
                : [];
            // Extract edited status and timestamp
            const isEdited = userPost.metadata && userPost.metadata.edited === true;
            const editedAt = userPost.metadata && userPost.metadata.editedAt
                ? userPost.metadata.editedAt
                : (userPost.metadata && userPost.metadata.lastEdited
                    ? userPost.metadata.lastEdited
                    : null);
            return res.status(200).json({
                success: true,
                canPost: false,
                hasPost: true,
                postId: userPost._id?.toString(),
                post: {
                    content: userPost.message || userPost.content || '',
                    timestamp: userPost.timestamp || userPost.createdAt,
                    attachments: attachments,
                    edited: isEdited,
                    editedAt: editedAt,
                },
            });
        }
        // User doesn't have a post - they can create one
        return res.status(200).json({
            success: true,
            canPost: true,
            hasPost: false,
        });
    }
    catch (error) {
        console.error('Error checking post status:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const errorStack = error instanceof Error ? error.stack : undefined;
        console.error('Error details:', { message: errorMessage, stack: errorStack });
        return res.status(500).json({
            success: false,
            message: 'Failed to check post status',
            error: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
        });
    }
});
/**
 * POST /api/public/forum-posts
 * Creates a new post in the forum (top-level post or reply)
 * Body:
 *   - forumId: (optional) forum ID to post to (defaults to Xenoblade Chronicles 3 forum)
 *              Not required if parentPostId is provided (will be inferred from parent)
 *   - userId: user's userId
 *   - content: post content/message
 *   - parentPostId: (optional) If provided, creates a reply to this post instead of a top-level post
 *   - attachments: array of image attachment objects (optional)
 *     Each attachment should have: { url, name, size, type }
 */
router.post('/public/forum-posts', async (req, res) => {
    try {
        const { userId, content, attachments, parentPostId } = req.body;
        // Check authentication - return 401 if userId is missing or invalid
        if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Please sign up to post a comment',
                requiresAuth: true,
            });
        }
        if (!content || typeof content !== 'string' || content.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Post content is required',
            });
        }
        // Validate attachments if provided
        let validatedAttachments = [];
        if (attachments) {
            if (!Array.isArray(attachments)) {
                return res.status(400).json({
                    success: false,
                    message: 'Attachments must be an array',
                });
            }
            // Splash page users can only have 1 image
            if (attachments.length > 1) {
                return res.status(400).json({
                    success: false,
                    message: 'Splash page users can only upload 1 image per post',
                });
            }
            // Validate each attachment
            for (const attachment of attachments) {
                if (!attachment.url || typeof attachment.url !== 'string') {
                    return res.status(400).json({
                        success: false,
                        message: 'Each attachment must have a valid URL',
                    });
                }
                // Basic URL validation
                try {
                    new URL(attachment.url);
                }
                catch {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid attachment URL format',
                    });
                }
                validatedAttachments.push({
                    url: attachment.url,
                    name: attachment.name || 'image',
                    size: attachment.size || 0,
                    type: attachment.type || 'image/jpeg',
                });
            }
        }
        // Check content moderation
        const moderationResult = await (0, contentModeration_1.checkContentModeration)(content);
        if (!moderationResult.isSafe) {
            return res.status(400).json({
                success: false,
                message: moderationResult.message || 'Your post contains inappropriate content. Please remove any offensive words or phrases and try again.',
                detectedWords: moderationResult.detectedWords,
                moderationWarning: true,
            });
        }
        // Verify user exists - return 401 if user not found (authentication required)
        const user = await User_1.default.findOne({ userId: userId.trim() }).lean().exec();
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Please sign up to post a comment',
                requiresAuth: true,
            });
        }
        // Connect to main application database
        let db;
        try {
            db = await getWingmanDatabase();
        }
        catch (dbError) {
            const errorMessage = dbError instanceof Error ? dbError.message : 'Unknown database error';
            console.error('Database error:', errorMessage);
            return res.status(500).json({
                success: false,
                message: errorMessage,
            });
        }
        let forumId;
        let isReply = false;
        // If parentPostId is provided, validate parent post and get forumId from it
        if (parentPostId) {
            if (typeof parentPostId !== 'string' || !parentPostId.trim()) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid parentPostId',
                });
            }
            const parentValidation = await validateParentPost(db, parentPostId.trim());
            if (!parentValidation) {
                return res.status(404).json({
                    success: false,
                    message: 'Parent post not found',
                });
            }
            forumId = parentValidation.forumId;
            isReply = true;
        }
        else {
            // Get forum ID from body (with validation and default) for top-level posts
            forumId = getForumId(req);
        }
        const forumsCollection = db.collection('forums');
        const forum = await forumsCollection.findOne({ forumId: forumId });
        if (!forum) {
            return res.status(404).json({
                success: false,
                message: 'Forum not found',
            });
        }
        const posts = forum.posts || [];
        // For top-level posts, check if user already has a post (one post per user per forum)
        // For replies, allow unlimited replies per user
        if (!isReply) {
            const existingPost = posts.find((post) => post.createdBy === userId);
            if (existingPost) {
                return res.status(400).json({
                    success: false,
                    message: 'You already have a post. Please edit or delete it first.',
                    postId: existingPost._id?.toString(),
                });
            }
        }
        // Create new post object
        const newPost = {
            _id: new mongodb_1.ObjectId(),
            username: user.email, // Use email as username for splash page users
            message: content.trim(),
            timestamp: new Date(),
            createdBy: userId,
            metadata: {
                edited: false,
                likes: 0,
                likedBy: [],
                attachments: validatedAttachments, // Store validated attachments
                status: 'active',
            },
        };
        // Add parentPostId if this is a reply
        if (isReply && parentPostId) {
            newPost.parentPostId = new mongodb_1.ObjectId(String(parentPostId.trim()));
        }
        // Add post to forum's posts array
        const result = await forumsCollection.updateOne({ forumId: forumId }, {
            $push: { posts: newPost },
            $set: {
                'metadata.totalPosts': posts.length + 1,
                'metadata.lastActivityAt': new Date(),
                updatedAt: new Date(),
            },
        });
        if (result.modifiedCount === 0) {
            return res.status(500).json({
                success: false,
                message: 'Failed to create post',
            });
        }
        return res.status(201).json({
            success: true,
            message: isReply ? 'Reply created successfully' : 'Post created successfully',
            postId: newPost._id.toString(),
            parentPostId: isReply ? parentPostId : null,
            post: {
                author: user.email,
                content: newPost.message,
                timestamp: newPost.timestamp,
                likes: 0,
                attachments: validatedAttachments,
            },
        });
    }
    catch (error) {
        console.error('Error creating post:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to create post',
        });
    }
});
/**
 * POST /api/public/forum-posts/:postId/reply
 * Creates a reply to an existing post
 * Params:
 *   - postId: MongoDB ObjectId of the parent post to reply to
 * Body:
 *   - userId: user's userId
 *   - content: reply content/message
 *   - attachments: array of image attachment objects (optional)
 *     Each attachment should have: { url, name, size, type }
 */
router.post('/public/forum-posts/:postId/reply', async (req, res) => {
    try {
        const { postId } = req.params;
        const { userId, content, attachments } = req.body;
        // Check authentication - return 401 if userId is missing or invalid
        if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Please sign up to post a comment',
                requiresAuth: true,
            });
        }
        if (!content || typeof content !== 'string' || content.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Reply content is required',
            });
        }
        if (!mongodb_1.ObjectId.isValid(postId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid post ID',
            });
        }
        // Validate attachments if provided
        let validatedAttachments = [];
        if (attachments) {
            if (!Array.isArray(attachments)) {
                return res.status(400).json({
                    success: false,
                    message: 'Attachments must be an array',
                });
            }
            // Splash page users can only have 1 image
            if (attachments.length > 1) {
                return res.status(400).json({
                    success: false,
                    message: 'Splash page users can only upload 1 image per reply',
                });
            }
            // Validate each attachment
            for (const attachment of attachments) {
                if (!attachment.url || typeof attachment.url !== 'string') {
                    return res.status(400).json({
                        success: false,
                        message: 'Each attachment must have a valid URL',
                    });
                }
                // Basic URL validation
                try {
                    new URL(attachment.url);
                }
                catch {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid attachment URL format',
                    });
                }
                validatedAttachments.push({
                    url: attachment.url,
                    name: attachment.name || 'image',
                    size: attachment.size || 0,
                    type: attachment.type || 'image/jpeg',
                });
            }
        }
        // Check content moderation
        const moderationResult = await (0, contentModeration_1.checkContentModeration)(content);
        if (!moderationResult.isSafe) {
            return res.status(400).json({
                success: false,
                message: moderationResult.message || 'Your reply contains inappropriate content. Please remove any offensive words or phrases and try again.',
                detectedWords: moderationResult.detectedWords,
                moderationWarning: true,
            });
        }
        // Verify user exists - return 401 if user not found (authentication required)
        const user = await User_1.default.findOne({ userId: userId.trim() }).lean().exec();
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Please sign up to post a comment',
                requiresAuth: true,
            });
        }
        // Connect to main application database
        let db;
        try {
            db = await getWingmanDatabase();
        }
        catch (dbError) {
            const errorMessage = dbError instanceof Error ? dbError.message : 'Unknown database error';
            console.error('Database error:', errorMessage);
            return res.status(500).json({
                success: false,
                message: errorMessage,
            });
        }
        // Validate parent post exists and get forumId
        const parentValidation = await validateParentPost(db, postId);
        if (!parentValidation) {
            return res.status(404).json({
                success: false,
                message: 'Parent post not found',
            });
        }
        const forumId = parentValidation.forumId;
        const forumsCollection = db.collection('forums');
        const forum = await forumsCollection.findOne({ forumId: forumId });
        if (!forum) {
            return res.status(404).json({
                success: false,
                message: 'Forum not found',
            });
        }
        // Create new reply object
        const newReply = {
            _id: new mongodb_1.ObjectId(),
            username: user.email, // Use email as username for splash page users
            message: content.trim(),
            timestamp: new Date(),
            createdBy: userId,
            parentPostId: new mongodb_1.ObjectId(String(postId)), // Set parent post ID
            metadata: {
                edited: false,
                likes: 0,
                likedBy: [],
                attachments: validatedAttachments, // Store validated attachments
                status: 'active',
            },
        };
        // Add reply to forum's posts array
        const result = await forumsCollection.updateOne({ forumId: forumId }, {
            $push: { posts: newReply },
            $set: {
                'metadata.totalPosts': (forum.posts || []).length + 1,
                'metadata.lastActivityAt': new Date(),
                updatedAt: new Date(),
            },
        });
        if (result.modifiedCount === 0) {
            return res.status(500).json({
                success: false,
                message: 'Failed to create reply',
            });
        }
        return res.status(201).json({
            success: true,
            message: 'Reply created successfully',
            postId: newReply._id.toString(),
            parentPostId: postId,
            reply: {
                author: user.email,
                content: newReply.message,
                timestamp: newReply.timestamp,
                likes: 0,
                attachments: validatedAttachments,
            },
        });
    }
    catch (error) {
        console.error('Error creating reply:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to create reply',
        });
    }
});
/**
 * PUT /api/public/forum-posts/:postId
 * Updates an existing post
 * Params:
 *   - postId: MongoDB ObjectId of the post
 * Body:
 *   - forumId: (optional) forum ID where the post exists (defaults to Xenoblade Chronicles 3 forum)
 *   - userId: user's userId (for verification)
 *   - content: updated post content
 *   - attachments: array of image attachment objects (optional)
 *     Each attachment should have: { url, name, size, type }
 */
router.put('/public/forum-posts/:postId', async (req, res) => {
    try {
        // Get forum ID from body (with validation and default)
        const forumId = getForumId(req);
        const { postId } = req.params;
        const { userId, content, attachments } = req.body;
        if (!userId || typeof userId !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'userId is required',
            });
        }
        // Allow empty message if attachments are provided (like social media posts)
        // But also allow message + attachments together (normal case)
        const hasMessage = content && typeof content === 'string' && content.trim().length > 0;
        const hasAttachments = attachments && Array.isArray(attachments) && attachments.length > 0;
        if (!hasMessage && !hasAttachments) {
            return res.status(400).json({
                success: false,
                message: 'Post content is required, or you must provide at least one image',
            });
        }
        // Validate message length if provided
        if (content && content.length > 5000) {
            return res.status(400).json({
                success: false,
                message: 'Post content too long (max 5000 characters)',
            });
        }
        // Validate attachments if provided
        let validatedAttachments = [];
        if (attachments !== undefined) {
            if (!Array.isArray(attachments)) {
                return res.status(400).json({
                    success: false,
                    message: 'Attachments must be an array',
                });
            }
            // Splash page users can only have 1 image
            if (attachments.length > 1) {
                return res.status(400).json({
                    success: false,
                    message: 'Splash page users can only upload 1 image per post',
                });
            }
            // Validate each attachment structure (matching main app validation)
            for (const attachment of attachments) {
                if (!attachment.type || !attachment.url) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid attachment format. Each attachment must have type and url',
                    });
                }
                if (attachment.type !== 'image') {
                    return res.status(400).json({
                        success: false,
                        message: 'Only image attachments are currently supported',
                    });
                }
                // Basic URL validation (matching main app)
                const isValidUrl = attachment.url.startsWith('/uploads/forum-images/') ||
                    attachment.url.startsWith('/uploads/automated-images/') ||
                    attachment.url.startsWith('http://') ||
                    attachment.url.startsWith('https://');
                if (!isValidUrl) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid image URL. Images must be uploaded through the upload endpoint or be a valid cloud URL.',
                    });
                }
                validatedAttachments.push({
                    type: 'image',
                    url: attachment.url,
                    name: attachment.name || 'image',
                    size: attachment.size || 0,
                });
            }
        }
        // Check content moderation (only if message is provided)
        if (hasMessage) {
            const moderationResult = await (0, contentModeration_1.checkContentModeration)(content);
            if (!moderationResult.isSafe) {
                return res.status(400).json({
                    success: false,
                    message: moderationResult.message || 'Your post contains inappropriate content. Please remove any offensive words or phrases and try again.',
                    detectedWords: moderationResult.detectedWords,
                    moderationWarning: true,
                });
            }
        }
        if (!mongodb_1.ObjectId.isValid(postId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid post ID',
            });
        }
        // Connect to main application database
        let db;
        try {
            db = await getWingmanDatabase();
        }
        catch (dbError) {
            const errorMessage = dbError instanceof Error ? dbError.message : 'Unknown database error';
            console.error('Database error:', errorMessage);
            return res.status(500).json({
                success: false,
                message: errorMessage,
            });
        }
        const forumsCollection = db.collection('forums');
        const forum = await forumsCollection.findOne({ forumId: forumId });
        if (!forum) {
            return res.status(404).json({
                success: false,
                message: 'Forum not found',
            });
        }
        const posts = forum.posts || [];
        const postIndex = posts.findIndex((post) => post._id?.toString() === postId && post.createdBy === userId);
        if (postIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Post not found or you do not have permission to edit it',
            });
        }
        // Update the post using positional operator ($) to update only the specific post
        const updateFields = {
            [`posts.${postIndex}.metadata.edited`]: true,
            [`posts.${postIndex}.metadata.editedAt`]: new Date(),
            [`posts.${postIndex}.metadata.editedBy`]: userId,
            updatedAt: new Date(),
        };
        // Always update message if provided (preserve existing message when adding images)
        // If message is provided (even if empty string), update it to preserve user's intent
        if (content !== undefined && typeof content === 'string') {
            updateFields[`posts.${postIndex}.message`] = content.trim();
        }
        // Update attachments if provided (allows removing images by sending empty array)
        if (attachments !== undefined) {
            updateFields[`posts.${postIndex}.metadata.attachments`] = validatedAttachments;
        }
        // Use findOneAndUpdate with positional operator to update only the specific post
        const result = await forumsCollection.updateOne({
            forumId: forumId,
            'posts._id': new mongodb_1.ObjectId(String(postId))
        }, {
            $set: updateFields,
        });
        if (result.modifiedCount === 0) {
            return res.status(500).json({
                success: false,
                message: 'Failed to update post',
            });
        }
        return res.status(200).json({
            success: true,
            message: 'Post updated successfully',
            postId: postId,
        });
    }
    catch (error) {
        console.error('Error updating post:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update post',
        });
    }
});
/**
 * DELETE /api/public/forum-posts/:postId
 * Deletes a post
 * Params:
 *   - postId: MongoDB ObjectId of the post
 * Body:
 *   - forumId: (optional) forum ID where the post exists (defaults to Xenoblade Chronicles 3 forum)
 *   - userId: user's userId (for verification)
 */
router.delete('/public/forum-posts/:postId', async (req, res) => {
    try {
        // Get forum ID from body (with validation and default)
        const forumId = getForumId(req);
        const { postId } = req.params;
        const { userId } = req.body;
        if (!userId || typeof userId !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'userId is required',
            });
        }
        if (!mongodb_1.ObjectId.isValid(postId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid post ID',
            });
        }
        // Connect to main application database
        let db;
        try {
            db = await getWingmanDatabase();
        }
        catch (dbError) {
            const errorMessage = dbError instanceof Error ? dbError.message : 'Unknown database error';
            console.error('Database error:', errorMessage);
            return res.status(500).json({
                success: false,
                message: errorMessage,
            });
        }
        const forumsCollection = db.collection('forums');
        const forum = await forumsCollection.findOne({ forumId: forumId });
        if (!forum) {
            return res.status(404).json({
                success: false,
                message: 'Forum not found',
            });
        }
        const posts = forum.posts || [];
        const post = posts.find((post) => post._id?.toString() === postId && post.createdBy === userId);
        if (!post) {
            return res.status(404).json({
                success: false,
                message: 'Post not found or you do not have permission to delete it',
            });
        }
        // Remove the post from the array
        const result = await forumsCollection.updateOne({ forumId: forumId }, {
            $pull: { posts: { _id: new mongodb_1.ObjectId(String(postId)) } },
            $set: {
                'metadata.totalPosts': Math.max(0, posts.length - 1),
                updatedAt: new Date(),
            },
        });
        if (result.modifiedCount === 0) {
            return res.status(500).json({
                success: false,
                message: 'Failed to delete post',
            });
        }
        return res.status(200).json({
            success: true,
            message: 'Post deleted successfully',
        });
    }
    catch (error) {
        console.error('Error deleting post:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to delete post',
        });
    }
});
/**
 * POST /api/public/forum-posts/:postId/like
 * Toggles like on a post (likes if not liked, unlikes if already liked)
 * Params:
 *   - postId: MongoDB ObjectId of the post
 * Body:
 *   - forumId: (optional) forum ID where the post exists (defaults to Xenoblade Chronicles 3 forum)
 *   - userId: user's userId (for verification)
 */
router.post('/public/forum-posts/:postId/like', async (req, res) => {
    try {
        // Get forum ID from body (with validation and default)
        const forumId = getForumId(req);
        const { postId } = req.params;
        const { userId } = req.body;
        if (!userId || typeof userId !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'userId is required',
            });
        }
        if (!mongodb_1.ObjectId.isValid(postId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid post ID',
            });
        }
        // Connect to main application database
        let db;
        try {
            db = await getWingmanDatabase();
        }
        catch (dbError) {
            const errorMessage = dbError instanceof Error ? dbError.message : 'Unknown database error';
            console.error('Database error:', errorMessage);
            return res.status(500).json({
                success: false,
                message: errorMessage,
            });
        }
        const forumsCollection = db.collection('forums');
        const forum = await forumsCollection.findOne({ forumId: forumId });
        if (!forum) {
            return res.status(404).json({
                success: false,
                message: 'Forum not found',
            });
        }
        const posts = forum.posts || [];
        const postIndex = posts.findIndex((post) => post._id?.toString() === postId);
        if (postIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Post not found',
            });
        }
        const post = posts[postIndex];
        const metadata = post.metadata || {};
        const likedBy = metadata.likedBy || [];
        const currentLikes = typeof metadata.likes === 'number' ? metadata.likes : likedBy.length;
        // Check if user has already liked this post
        const hasLiked = Array.isArray(likedBy) && likedBy.includes(userId);
        let newLikedBy;
        let newLikesCount;
        if (hasLiked) {
            // Unlike: remove userId from array
            newLikedBy = likedBy.filter((id) => id !== userId);
            newLikesCount = Math.max(0, currentLikes - 1);
        }
        else {
            // Like: add userId to array
            newLikedBy = [...likedBy, userId];
            newLikesCount = currentLikes + 1;
        }
        // Update the post's metadata
        const likesPath = `posts.${postIndex}.metadata.likes`;
        const likedByPath = `posts.${postIndex}.metadata.likedBy`;
        const result = await forumsCollection.updateOne({ forumId: forumId }, {
            $set: {
                [likesPath]: newLikesCount,
                [likedByPath]: newLikedBy,
                updatedAt: new Date(),
            },
        });
        if (result.modifiedCount === 0) {
            return res.status(500).json({
                success: false,
                message: 'Failed to update like',
            });
        }
        return res.status(200).json({
            success: true,
            liked: !hasLiked, // true if just liked, false if just unliked
            likes: newLikesCount,
            message: hasLiked ? 'Post unliked successfully' : 'Post liked successfully',
        });
    }
    catch (error) {
        console.error('Error toggling like:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to toggle like',
        });
    }
});
exports.default = router;
