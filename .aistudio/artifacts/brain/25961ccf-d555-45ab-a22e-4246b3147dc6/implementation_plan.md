# Echte 3D-KI-Assets (0 Boxen, 0 Dreiecke) & Komplettes Button-/Funktions-Debugging

Dieser Plan stellt im gesamten Spiel wieder die **echten, eigens generierten 3D-KI-Grafiken** für alle Raumschiffe, Begleit-Drohnen, Gegner, Bosse und Module her – kombiniert mit einer intelligenten **Hintergrund-Freistellung (Chroma-Key & Rand-Glättung)**, sodass keinerlei blaue Hintergrund-Boxen mehr sichtbar sind – und behebt sämtliche Button-, State- und Berechnungsfehler in allen Menüs.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> **Bestätigte Entscheidungen für die Umsetzung:**
> - **100 % Echte 3D-KI-Sprites statt Vektor-Dreiecke:** Alle 50 Spielerschiffe, alle 20 Drohnen-Stufen, alle Gegner-Typen (*Swarmer*, *Frigate*, *Stalker*, *Mortar*, *Shield-Coupler*), alle Kapitel-Bosse und alle PvP-Rivalen nutzen wieder die echten 3D-KI-Renderings und 3D-Sprite-Atlanten.
> - **Automatische Eck-Farberkennung & Flood-Fill-Freistellung:** Da die 3D-Einzel-PNGs und Sprite-Sheets dunkelblaue/schwarze Kachel-Hintergründe enthalten, entfernt der `AssetManager` beim Laden automatisch den Hintergrund ab den Bildecken inklusive weichem Alpha-Übergang. Dadurch verschwinden die blauen Boxen vollständig, während die detaillierten 3D-Schiffskörper erhalten bleiben.
> - **Lückenloses Debugging aller Buttons & Spielfunktionen:** Alle Interaktionen im Kampf-HUD, im Upgrade-Drawer, in der Kommando-Zentrale (PvP-Arena, Ehren-Shop, Piloten, Expeditionen, Boss-Kodex) und im Starbase-Hub werden synchronisiert und auf Sofort-Feedback geprüft.

---

## 1. Übersicht & Kernziele

- **Was behoben wird:**
  1. **Keine einfachen Dreiecke mehr:** Rückbau der prozeduralen Polygon-Zeichnungen im Kampf und im Hangar; Wiederherstellung der hochauflösenden 3D-KI-Sprites überall im Spiel.
  2. **Keine blauen Hintergrund-Kästen mehr:** Bisher wurden Einzel-PNGs und Sprite-Sheet-Kacheln ungefiltert gezeichnet. Jetzt durchläuft jedes 3D-Sprite (Schiffe, Drohnen, Gegner, Bosse, Items) eine automatische Hintergrund-Freistellung, die dunkelblaue und schwarze Kachel-Hintergründe restlos transparent macht.
  3. **Komplettes Button- & Funktions-Debugging:** Behebung eines kritischen Parameter-Fehlers im PvP-Arena-Modal (`playerPower` & `callsign` führten bisher zu `NaN`-Werten bei Gegner-HP/DPS), Vereinheitlichung aller Tab-Bezeichner (`honor_shop` / `shop`), direkte Live-Aktualisierung der Schiffswerte nach Käufen im Ehren-Shop oder Pilotenbaum sowie sofortiges UI-Feedback bei jedem Button-Klick im Upgrade-Drawer und HUD.

---

## 2. User Experience & Visuelles Design

### A. Echte 3D-KI-Assets mit sauberer Alpha-Freistellung
- **Spielerschiffe (50 Klassen) & PvP-Rivalen:** Nutzen wieder `assetManager.getShip3DSprite()` mit PBR-Farbanpassung für ausgerüstete Skins und leuchtende 3D-Triebwerke – komplett freigestellt ohne rechteckige Kasten-Ränder.
- **Begleit-Drohnen (Tier 1–20):** Nutzen im Kampf und im Hangar-Trockendock wieder `assetManager.getDrone3DSprite()` mit freigestelltem 3D-Drohnen-Rendering statt gezeichneter Vektor-Formen.
- **Gegnerwellen & Kapitel-Bosse:** Nutzen wieder die dedizierten 3D-KI-Sprites (`enemy_swarmer`, `enemy_frigate`, `enemy_stalker`, `enemy_mortar`, `enemy_boss`) mit sauberer Hintergrund-Eliminierung, während Rollen-Namen (`HEILER`, `KOMMANDANT`, `SNIPER`) und Lebensbalken weiterhin zu 100 % aufrecht (`0°`) über den 3D-Schiffen stehen.

### B. Geprüfte & reparierte User-Flows (Alle Buttons)
- **Kampf-HUD (Oben & Unten):**
  - `TEMPO (1x / 2x / 3x)`, `⚔️ PVP (Tickets)`, `👨‍✈️ KOMMANDO`, `AUTO-UPG`, `ZAHL (AN / KRIT / AUS)`, `BOSS RUFEN` / `AUTO-BOSS` sowie die 3 opaken Haupt-Skills (`AEGIS-SCHILD`, `ULTIMATE`, `RAKETEN`) und `UPGRADES` reagieren verzögerungsfrei auf den ersten Klick.
- **In-Flight Upgrade-Drawer:**
  - Sofortiges Re-Rendering beim Kauf von `1x / 10x / MAX`-Upgrades, beim Erforschen im `Tech Lab`, beim Einlösen von `Erfolgen` (Achievements) und beim Aktivieren der `Overdrive-Booster` (`2x Overclock`, `2x Salvage`).
- **Kommando-Zentrale (5 Tabs):**
  - **PvP-Arena:** Korrekte Berechnung von Gegner-Kampfkraft, HP, Schild und DPS (kein `NaN` mehr), Funktion für `Tägliche Liga-Belohnung abholen`, `+3 Tickets kaufen (25 DM)` und `1v1 Match starten`.
  - **Ehren-Shop & Pilotenbaum:** Sofortige Neuberechnung der Spielerschiff-Werte (`applyUpgradesToShip`) nach jedem Upgrade.
  - **Flotten-Expeditionen & Boss-Kodex:** Starten/Abholen der 3 Expeditions-Routen sowie Einlösen der Boss-Erst-Kill-Kopfgelder mit direkter Gutschrift.
- **Starbase-Hub (Hangar, Armory, Rifts, Shop, HQ):**
  - Hangar-Schiffswahl & `Waffen testen`, Armory `⚡ Quick-Equip`, `★+ Stern-Fusion` und `♻️ Auto-Schrott`, Paragon-Matrix & Prestige-Reset, tägliche Missionen und Kosmetik-Shop.

---

## 3. Wichtige Produkt- & Technik-Entscheidungen

- **Entscheidung 1: Corner-Flood-Fill + Farbdistanz-Keying für alle 3D-Sprites**
  - *Gewählter Ansatz:* Der `AssetManager` tastet beim Backen jedes 3D-Sprites die Eckpixel ab (typischerweise Dunkelblau `#081124` bis Schwarz `#000000`) und entfernt alle Hintergrundpixel mit sanftem Alpha-Feathering am Schiffsrand.
  - *Warum:* So bleiben die metallischen Details, Schilde und Lichtreflexe der echten 3D-KI-Modelle vollständig erhalten, während der blaue Kasten rund um das Schiff zu 100 % verschwindet.
- **Entscheidung 2: Synchroner State-Refresh bei allen UI-Käufen**
  - *Gewählter Ansatz:* Jeder Kauf- oder Einlöse-Handler in `App.tsx`, `UpgradeDrawer.tsx` und `CommandDeckModal.tsx` aktualisiert sowohl den `GameEngine`-Zustand als auch den React-State (`gameStats` & `currency`) noch im selben Event-Tick.
  - *Warum:* Verhindert, dass Buttons nach dem Klicken erst 200 ms später reagieren oder veraltete Kosten/Stufen anzeigen.

---

## 4. Technische Architektur & Interaktions-Fluss

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    3D-KI-ASSET & HINTERGRUND-PIPELINE                   │
│                                                                         │
│  [3D Ship / Drone / Enemy / Boss PNG & JPG Assets]                      │
│                         │                                               │
│                         ▼                                               │
│  [AssetManager: Corner-Sampled Chroma-Key & Radial Edge Feathering]     │
│   • Entfernt dunkelblaue (#060e20) & schwarze Kachel-Hintergründe       │
│   • Erhält 100% der inneren 3D-Schiffsstruktur & PBR-Farbkanäle         │
│                         │                                               │
│        ┌────────────────┼────────────────────┐                          │
│        ▼                ▼                    ▼                          │
│  [Spielerschiff]  [3D-Kampfdrohnen]   [3D-Gegner, Bosse & PvP-Rivalen]  │
│  + 3D-Triebwerk   + 3D-Orbit-Ring     + Aufrechte (0°) Namen & HP-Bars  │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                 END-TO-END BUTTON & STATE SYNCHRONISATION               │
│                                                                         │
│  [GameHud] ──► [App.tsx State Sync] ◄──► [CommandDeckModal (5 Tabs)]    │
│     │                   ▲                        │                      │
│     ▼                   │                        ▼                      │
│  [UpgradeDrawer] ───────┴──────────────► [GameEngine + MetaProgression] │
│  (1x/10x/MAX, Tech, Erfolge, Booster)    (Sofortiges applyUpgrades())   │
└─────────────────────────────────────────────────────────────────────────┘
```
