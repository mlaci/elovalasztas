# Zavar a fejekben, avagy hogyan ne fejlessz online választási rendszert

**Mi lehet rosszabb annál, ha a megírt program nem azt csinálja, amit a fejlesztő szeretett volna?**
**Ha eleve nem is alkalmas arra, hogy megoldja azt a problémát, amire született.**

Egy online választási rendszer fejlesztése hatalmas kihívás, legutóbb épp a svájciaknak nem jött össze.
Pár hónappal a választás előtt kellett lefújniuk, mert szakértők kritikus hibákat találtak a rendszerben.

Azok a funkciók, amit egy e-voting rendszerek biztosítani kell (titkosság, ellenőrizhetőség, anonimitás), egyenként is nehéz számítástechnikai probléma, közösen pedig nagyon komplex rendszert alkotnak, így könnyen kerülhet homokszem a gépezetbe.

Az előválasztással kapcsolatban másról van szó.
Megtalálhatók benne egyes szükséges biztonsági funkciók.
Látszik, hogy sokat dolgoztak rajta a fejlesztők.
Mégis ezek technikai megvalósítása mindig valamilyen alapvető tévedésre épül, úgymond már a rajtvonalon elvéreznek.
Pedig ezek a problémák egy kis gondolkodással felismerhetőek lennének.

Amit bemutatok, csak pár hiba lesz, amibe belefutottam.
Nem is feltétlenül aktuálisak már, van köztük olyan megoldás is, amit biztosan csak egy korábbi rendszernél használtak a fejlesztők.
De nem is gondolom, hogy ebből a szempontból komolyan kellene venni ezt a projektet.

Inkább önmagukban lesznek érdekesek ezek a megoldások.
Kitalálni, hogy vajon mit gondolhattak a fejlesztők, mi volt a racionalitás mögötte, ha volt.
Ez néhol elég részletes magyarázatot igényel, de így is sok részletet kihagytam.

## 1. Bevezető

A történet úgy indult, hogy valamilyen bejelentés kapcsán az előválasztás honlapját olvastam, azon belül is az adatkezelési tájékoztatót.
A szokásos GDPR-os sorok között furcsa részbe botlottam:

> Az ELEVE applikáció kiszolgáló rendszere a dupla szavazás elkerülése érdekében egy nem visszafejthető matematikai algoritmus használatával (SHA 256) titkosítja és az adott kezdeményezésben meghatározott ideig tárolja a kezdeményezés oldalán egyértelműen megjelölt egyedi azonosítót, amely ezek egyike lehet: személyi igazolvány sorszáma, lakcímkártya sorszáma vagy személyes azonosító száma.

Azonnal tudtam, hogy egy ez hülyeség, de amúgy is ki ír bele ilyet egy adatkezelési tájékoztatóba?

Ez felkeltette a kíváncsiságomat, és alaposan átolvastam a hivatalos weboldalon szereplő információkat.
A legérdekesebb rész az belőle, ahol azokat a biztonsági feltételeket sorolják, amiket a rendszer biztosít a szavazás folyamán:

1. A szavazók személyes adatai nem kerülnek eltárolásra.
2. A rendszer kizárja a több szavazat egy szavazó által történő leadását (duplaszavazás).
3. A leadott szavazat semmilyen módon nem köthető a szavazóhoz (szavazatok anonimitása).
4. A rendszer igazolja a választásra való jogosultságot.

De ezek inkább csak ígéretek, mint konkrét megoldások.
Szerencsére megtaláltam a 2019-es rendszer forráskódját is, mivel az még nyilvánosan elérhető.
Abból jó rekonstruálható hogyan működött a rendszer a korábbi előválasztás során.

## 2. Visszafejthetetlen szavazói adatok

Térjünk vissza az idézett részre, ahol az egyedi azonosítók titkosításáról volt szó, és hülyeségnek neveztem!

Kiderül belőle, hogy a jogosultságot a személyi- vagy lakcímkártyaszámból képzett kriptográfia hash alapján ellenőrzik.
Ezzel az első két feltételt szeretnék biztosítani. A tárolt hash-ek alapján ellenőrizhető, hogy a szavazó adott-e le már korábban szavazatot.
Az azonosító pedig titkos marad, mivel a hash-ből annak értéke nem visszafejthető. Legalábbis ez lehetett fejlesztők elképzelése.

Abban szerintem megegyezhetünk, hogy a "nem visszafejthető" azt jelenti, hogy a nem lehet megállapítani milyen adatokból képezték a hash-t.
Viszont itt a helyes kifejezés a "nem visszafordítható" lenne (irreversible).
A nem visszafordíthatóság azt jelenti, hogy a hash-ből nem lehet *visszaszámítani* az eredeti értéket (egyirányú), **de ebből nem következik, hogy ne lenne visszafejthető!!!**

Elég csak arra gondolni, hogy ez a módszer megegyezik azzal, ahogy a jelszavakat tárolják.
Ha egy biztonsági incidens kapcsán kiszivárognak a jelszóhash-ek, attól függően, hogy az adott jelszó milyen erős, a támadók akár fel is törhetik azokat (password cracking).

Két dolog miatt lehet gyenge egy jelszó.
Vagy mert valamilyen ismerhető információból áll, vagy mert a lehetséges jelszavak száma túl alacsony.
Az összes elképzelhető kombináció végigpróbálásával pedig kitalálható jelszó.

<div class="image-box">
  <img src="img/szemelyi.jpg" alt="Személyi igazolvány száma"/>
  <img src="img/lakcim.jpg" alt="Lakcímkártya száma"/>
</div>

A személyi és lakcímkártya száma 6 számjegyből és 2 betűből áll, ez 676 millió lehetséges kombinációt jelent.
Összehasonlításképp, ma egy erősebb gamer videókártya olyan 5 milliárd SHA-256 hash-t tud generálni másodpercenként, de egy asztali 8 magos processzor is megbirkózik pár száz millióval (per másodperc).
Ebből már lehet érzékelni, hogy mennyire kevés kombináció ez ahhoz, hogy visszafejthetetlennek nevezzük az előválasztás során használt hash-eket.

Bár nincs nagy jelentősége, de a 2019-es rendszer adatbázisában az azonosító két utolsó betűjét plaintextben is eltárolták, így ott csak egymillió lehetséges kombinációval kellett számolni.

#### Amiért ez eleve nem működhet

És nem csak a kombinációk alacsony száma a probléma. Egy másik projekt a lakcímkártyaszám helyett a `név` - `születési dátum` - `anyja neve` hármasra építette az azonosítási megoldását, hasonló elv alapján. Brute-force szempontból ez akár jobbnak is tűnhet, de itt jön be a másik ok, ami miatt gyengék lesznek a jelszavak.

Ha a támadó számára ismert a létező összes ilyen adat hármas, például egy állami adatbázisból, akkor elegendő csak azt a kb. 10 milliót végigellenőriznie, ami tényleg létezik.
Az összesre sincs szükség, ha egy munkahely szeretné ellenőrizni, hogy az alkalmazottai közül ki vett részt a választáson, a munkaszerződések tartalmazzák a szükséges adatokat.
Vagy ha a szomszédomról szeretném megtudni ugyanezt, és tudom a nevét, megtudom saccolni körülbelül a korát, és ismerem az édesanyja keresztnevét, már jelentősen csökkentettem is a lehetséges kombinációk számát (és a visszafejtéshez szükséges számítási költséget).

Sokan azt gondolják, hogy a jelszavak kiválasztásánál a legfontosabb szempont az egyediségük, minden ajánlás ezt hangsúlyozza, de van egy még fontosabb, a titkosságuk.
A jelszavak biztonsági modellje arra épül, hogy a jelszót csak a jelszó birtokosa ismerheti.
A jelszóhash pont azért lesz visszafejthetetlen, mert a jelszó titkos, és nem fordítva.
A hash csak egy bizonyíték, amivel igazolni lehet a jelszó egyezését anélkül, hogy ismernénk az értékét.
De önmagában hash-eléstől nem lesz titkos a jelszó.

<details>
<summary>Még több részlet</summary>

#### Salt

Az adatokhoz egyedi salt érték nem adható, mert akkor azonos adatok esetén is eltérnének a hash-ek, és nem lenne alkalmas a duplaszavazás kiszűrésére.

A 2019-ben használt keretrendszer lehetőséget ad egy közös fix salt érték használatára.
Ez egy plusz réteget ad a biztonsághoz, mert ezt a többi adattól elkülönítve tárolják, így a támadónak azt is meg kell szereznie, hogy vissza tudja fejteni a hash-eket.
Ezt a módszert szokták peppernek vagy `security salt`-nak is hívni, én az utóbbit fogom használni, mert kód is így hivatkozik rá.
A forráskódban található hash-ek alapján ellenőrizni tudtam, hogy ezt a funkciót biztosan használták a fejlesztők a 2019-es rendszerben.

Valójában ez a módszer semmilyen valós biztonsági garanciát nem ad.
De alapvetően is szkeptikus vagyok a hatékonyságával, mert ha a támadó már egy sebezhetőséget kihasználva hozzáért az adatbázishoz, jó eséllyel azon keresztű a `security salt` értékéhez is hozzáférhetett.
A hash-ek pedig biztosan nem ettől lesznek visszafejthetetlenek, hiszen ez egy fix érték egy konfigurációs fájlban, vagy például a runtime memóriájában, amit ki lehet olvasni.

#### Kriptográfia

Sőt, egy adott támadás esetében még a `security salt` értékét sem kell ismerni a hash-ek visszafejtéséhez.

Ezzel a példával csak annyit szeretnék bemutatni, hogy nem kell nagy hülyeséget se csinálni, a kriptográfia már önmagában egy footgun, ami avatatlan kezekben el is fog sülni.

Csak egy későbbi fejezetből derülne ki, de most ehhez fontos tudni, hogy a 2019-es választáson a jogosultság ellenőrzéshez szükséges szavazói adatok forrása, egy a személyi- és lakcímnyilvántartásból letölthető (PDF) dokumentum volt, és a hash alapját a lakcímkártyaszám képezte.
A támadás azon alapszik, hogy a támadó hozzáfér ehhez a rendszerhez, és módosítani tudja a generált dokumentumokat.

Három dolog szerencsés együttállása is kellett hozzá:

1. A hash függvény a `security salt` értékét egyszerűen csak stringként a hash-elt érték elé fűzi.
2. A rendszer lakcímkártyaszámként bármit elfogad, nem ellenőrzi a formátumát (kivéve üres nem lehet).
3. Az SHA-256 érintett a length extension attack nevű sebezhetőségben.

A támadáshoz először is ki kell deríteni a `security salt` hosszát.
Ehhez két különböző típusú PDF dokumentumra lesz szükség.
Az egyikben a lakcímkártyaszám szabadon megválasztható, a másikban ki lesz egészítve egy adott hosszúságú prefixszel, ahol a szabadon választott is a prefix része lesz.
Az ezekből képzett hash-ek alapján tesztelhető, hogy a megfelelő hosszúságú prefixet választottuk-e.
Ehhez nagyon jól jön, hogy a rendszer készségesen ki is írja regisztrációkor a generált hash-eket, ha a támadó ezen a ponton még nem férne hozzá az adatbázishoz.

<figure>
  <img src="img/adatok.png" alt="Adatok összegzése"/>
  <figcaption></figcaption>
</figure>

Ez pár próbálkozásból össze is jöhet, mivel valószínűsíthető, hogy a `security salt` értékét valamilyen fix módszerrel hozták létre, ahol adott a hossz.
Például 128 bites véletlen érték vagy 36 karakteres UUID.

Ha meg van, akkor minden letöltött dokumentumot el kell látni ezzel prefixszel.
A szabadon választott "lakcímkártyaszámból" generált hash birtokában az összes prefixszel ellátott hash visszafejthető lesz.

</details>

## 3. Szavazatok anonimitása

Az online választási rendszerek tipikusan kriptografiai módszereket alkalmaznak.
Ezért a 2019-es forráskód olvasása közben arra számítottam, hogy még több ilyen megoldásba futok bele, például a szavazatok anonimizálásánál, de nem találkoztam ilyenekkel.
A rendszer az előzőn túl nem nagyon különbözik egy sima webshoptól.

Az adatbázisban van egy `users` és egy `votes` tábla, amiben nyilvántartja ki szavazott, és milyen szavazatok születtek.
Az anonimitást pedig az biztosítaná, hogy a két tábla adatai nem összekapcsolhatóak.
És tényleg, semelyik szavaztat mellé sincs közvetlenül odaírva, hogy melyik szavazóhoz tartozik, **de ebből nem következik, hogy a két adat közti reláció ezzel megszűnne!!!**

<figure>
  <img src="img/issue.png" alt="Feljesztő kommentje"/>
  <figcaption>Feljesztő kommentje</figcaption>
</figure>

Egy normál szavazáson a szavazatok a szavazóurnában akaratlanul is összekeverednek, de a biztonság kedvéért megszámolás előtt a szavazóbiztosok meg is keverik őket.
Egy számítógépes rendszerben semmi nem történhet akaratlanul.
Mindig kiszámíthatóan működik, mert adott algoritmusokat követ, így századszor is ugyanazt fogja csinálni.

Egy algoritmusnak az eredményen túl egyéb mellékhatásai is lehetnek.
Ha közvetlen eredmény alapján nem is lehet megállapítani, hogy milyen adatok alapján dolgozott az algoritmus, a mellékhatások még mindig árulkodhatnak róla.
Egy operációs rendszer vagy egy adatbáziskezelő pedig elég komplex rendszer ahhoz, hogy ezernyi mellékhatása legyen bármilyen műveletnek.
Tehát még inkább nyilvánvaló, hogy kell valamilyen eljárás, ami garantálja, hogy nem maradnak ilyen nyomok a rendszerben.

Talán a legegyszerűbb példa arra, hogy nem kell közvetlen kapcsolat a két adat között, a sorba rendezhetőség.
Ha sorba tudjuk rendezni a szavazatokat a leadás sorrendjében, és szavazókról is megállapítható, hogy milyen sorrendben vettek részt a szavazáson, akkor egyértelműen összepárosítható, hogy kihez melyik szavazat tartozik.
Pont ezért is keverik össze a szavazatokat.

#### Időbélyeg

Vizsgáljuk meg az adatbázist!
Ehhez létrehoztam egy tesztpéldát, ahol a szavazókat és a jelölteket az ábécé nagybetűivel jelöltem.
A szavazókat G→D→H→E→J→B→A→F→C→I véletlen sorrendben regisztráltam, majd ábécé sorrendben leszavaztam velük az azonos nevű jelölre.

Már kapásból az sem igaz, amit a fenti kommentben állít a fejlesztő, hogy egyik táblában sincs kulcs a másikra.
Mind a szavazóhoz, mind szavazathoz tartozik egy azonos időbélyeg, ami azt jelöli mikor lett leadva a szavazat.
Ez alapján egyértelműen összekapcsolható a két tábla.

<figure>
  <img src="img/join.png" alt="Összekapcsolás időbélyeggel"/>
  <figcaption></figcaption>
</figure>

Az időbélyeg nem egyedi kulcs, de ha elég nagy felbontású, akkor annak tekinthető.
MySQL-ben alapbeállításként ez az időbélyeg másodperc felbontású, de szinte minden más adatbázisban mikroszekundum felbontású lenne.
2019-ben egy hét alatt 3,944 fő vett részt a választáson online, idén ennél azért jóval többre számítanak.

De ha lennének is ütközések, már 106 választókörzetben lehet szavazni, ami alapján akár tovább is lehet szűkíteni a párosítást.
Arról nem is beszélve, hogy nem csak a `users` tábla lehet az egyetlen forrás, ahonnan meg lehet állapítani, hogy egy adott szavazó mikor adta le a szavazatát.

Persze, ha nem egyeznének az időbélyegek, akkor is problémás lenne megjelölni az adatokat egy időponttal (vagy sorszámmal) a sorba rendezhetőség miatt.
Nem is értem mire kellett nekik az időbélyeg.

#### Adatfájlok

Ha nem valami távoli, elvont dologként gondolunk egy adatbázisra, akkor könnyű rájönni, hogy a bevitt adatok végül egy fizikai adatfájlban kötnek ki.
Egy fájlt legegyszerűbb és legoptimálisabb szekvenciálisan feltölteni.
Pont ez lesz az, amit a legtöbb adatbáziskezelő is csinál.
Az új sorokat egymás után – a beillesztés sorrendjében – írják a fájlba.
Az indexek pedig csak mutatók a fájl egyes pontjaira.
Ezt a típusú adatfájlt nevezik heapnek.

Egy ilyen fájlból a szavazatok sorrendje egyszerűen kiolvasható.
A szavazók esetén kicsit bonyolultabb a helyzet, mert 2019-ben külön regisztrációs időszak volt, és csak az után lehetett szavazni.
Tehát nem a szavazás, hanem csak a regisztráció sorrendje volt adott.

2021-ben nem lesz ilyen, regisztráció után azonnal lehet is szavazni.
Ha tökéletesen nem is fog egyezni a kettő, sok esetben elegendő lehet az egyértelmű összepárosításhoz.

De már önmagában a szavazatok sorba rendezhetősége is kihasználható lehet.

<details>
<summary>Még több részlet</summary>

#### Clustered index

Egy másik tipikus módszer, hogy az adatbázisok clustered indexben tárolják az adatokat.
Ebben az esetben, az adatsorok és a primary index egy fizikai struktúra, ami az elsődleges kulcs szerint rendezett.

Jelenleg főként a MySQL és a Microsoft SQL Server támogatja ezt a megoldást, de a PostgreSQL – ami ugyancsak egy népszerű adatbáziskezelő – viszont nem.
A 2019-es kód alapján nem lehet tudni milyen adatbázist használ az előválasztás rendszere.
Én MySQL-lel teszteltem, mert a mintaprojekt is ezt használja, amire építették a rendszert, de attól még használhattak bármi mást is.

A clustered index már egy jobb struktúra lehet az adatok tárolására a rendezettség miatt.
Meg is néztem mit tartalmaz a `votes` táblát tároló adatfájl:

<figure>
  <img src="img/votespage.png" alt="Adatfájl tartalma"/>
  <figcaption></figcaption>
</figure>

Az olvashatatlan részektől eltekintve, tisztán láthatóak a szavazatok kulcsai, ami alapján a sorok egyáltalán nem tűnnek rendezettnek.
A szavazatokat a jelöltekkel összekapcsolva az is kiderül, hogy ez a sorrend a létrehozás sorrendje:

<figure>
  <img src="img/voteids.png" alt="Szavazatok id-ja"/>
  <figcaption></figcaption>
</figure>

De nem olyan rossz a helyzet, mint amilyennek elsőre tűnik.
A clustered index egy B-fa, ami tényleg rendezett az elsődleges kulcs szerint, de a fa leveleiben tárolt adatok nem feltétlenül.
Az én példámban a fának még csak egy levele van.
A levelek 16KB-os memóriablokkok (page), amik szintén a beillesztés sorrendjében töltődnek fel az új sorokkal, mint ahogy a heap.

Ahogy nő a fa, és betelik egy page, az adatbázis szétválasztja két új page-re, ahol az adatok már kulcs szerint rendezésre kerülnek.
A `votes` tábla kulcsai véletlenszerűen generáltak.
A random kulcsok mentén újrarendezve pedig a sorok visszaállíthatatlanul összekeverednek.
Ez még akár egy szándékos megoldás is lehet a fejlesztők részéről (bár kétlem), de egyértelműen bíztató.

Csakhogy, amikor elég nagyra nő tábla, a random kulcsok miatt az index tele lesz félig üres page-ekkel.
Ezek a page-ek egyre ritkábban telnek be, ezért az új sorok nem kerülnek rendezésre.
Szerencsére, ha a page-en belül nem is, de a page-ek között azért összekeverednek ezek a sorok.
Így már csak kevés információt adnak a sorrendről, de szerintem ez még mindig több, mint az ideális.

Az egész módszer működőképessége attól függ, hogy hányan vesznek részt a szavazáson.
És nem csak a nagyon sok, hanem a nagyon kevés szavazat is probléma lehet.

#### Tranzakciós log

Az adatbázis változásait a tranzakciós log is nyilvántartja.
Íme, a tesztpélda szavazatait rögzítő rész a logból:

<figure>
  <img src="img/log.png" alt="Tranzakciós log"/>
  <figcaption><code>@2=</code> a jelölt id-ja</figcaption>
</figure>

Az INSERT művelet létrehozza az új szavazatot.
Az UPDATE rögzíti, hogy a szavazó már leadta a szavazatát.
A két művelet egyértelműen összepárosítható.

Bár tranzakciós log kikapcsolható lenne, de túl fontos funkciók alapulnak rajta, hogy egyszerűen csak kikapcsolásra kerüljön.
Biztonsági mentések után törölhetők lennének mentés előtti tranzakciók, de ha túl sűrűn készül inkrementális mentés az adatbázisról, akkor maga a biztonsági mentés lesz az, amiből visszaállítható ugyanez az információ.
Az adatbázisokat alapvetően hibatűrőre tervezik, ezért nehéz elérni, hogy valami ne legyen visszaállítható.

Az adatfájlok és tranzakciós log is permanensen egy háttértáron tárolódnak.
Egy sima törléstől ezek adatok még nem feltétlenül semmisülnek meg véglegesen.
Ha paranoiások akarunk lenni, csak a tároló fizikai megsemmisítése után lehetünk teljesen biztosak az adatok törlésében.

</details>

Összefoglalva, az lenne a jó, ha a szavazatokat már az adatbázisba kerülés előtt anonimizálnák.
Vannak elterjedt módszerek a szavazatok összekeverésére (mix network).
Kicsit többet kell vele dolgozni, mint egy webshoppal, de ez néha szükséges.

## 4. Szavazók egyértelmű azonosítása (2019)

A 2019-es online szavazáson a szavazók azonosítása a lakcímnyilvántartásból letöltött személyes adatlap alapján történt.
Ügyfélkapus bejelentkezés után bárki letöltheti a saját adatlapját a központi nyilvántartásból.
Ez az adatlap egy PDF dokumentum, ami tartalmazza a szavazó személyes adatait.

<figure>
  <img src="img/adatlap.png" alt="Adatlap" width="600"/>
  <figcaption>Adatlap</figcaption>
</figure>

A 2019-es előválasztás honlapján így hivatkoznak az azonosítási folyamatra:

>A választók azonosítása online szavazásnál az ügyfélkapu segítségével történt. Az onnan letöltött és hitelesített, valamint elektronikusan aláírt személyes adatokat tartalmazó dokumentum képezte az azonosítás alapját.

Hitelesített és elektronikusan aláírt dokumentum, tehát nem lehet meghamisítani.
Ez nagyon jó, mert így alkalmas arra, hogy egyértelműen azonosítja a szavazókat, hiszen mindenki csak a saját adatlapjához férhet hozzá.
Lelkesen én is letöltöttem a saját adatlapomat a nyilvántartásból, de nagy meglepetésemre semmilyen elektronikus aláírás nem volt rajta.
És ez nem 2019 óta változott meg, hanem soha nem is tartalmazott aláírást.
A fejlesztők készítettek egy videót, ami elmagyarázza a regisztráció folyamatát, és világosan kiderül a probléma:

<figure>
  <a href="https://www.youtube.com/watch?v=ghkuBwSTwhU">
    <img src="https://img.youtube.com/vi/ghkuBwSTwhU/maxresdefault.jpg" alt="Regisztráció menete 2019" width="600"/>
  </a>
  <figcaption></figcaption>
</figure>

A hitelesítést egy másik szolgáltatás végzi, az AVDH, teljes nevén Azonosításra Visszavezetett Dokumentumhitelesítés.
Ez a hagyományos tollal jegyzett aláírás digitális, hitelesített változata.
A feltöltött dokumentumokat az AVDH ellátja egy elektronikus aláírással, amely igazolja, hogy XY állampolgár írta alá azt a dokumentumot.
Bármilyen dokumentumot alá lehet így íratni az AVDH-val.

A feltöltött dokumentum aláírója mindig a fiók tulajdonosa, tehát ő hitelesíti a dokumentumot.
Az állam csak azt hitelesíti, hogy ő az aláíró, **de azt nem, hogy mi áll a dokumentumban!!!**

A dokumentumok ugyanazt a digitális aláírást tartalmazzák.
Az aláíró azonosításához szükséges információk csak csatolva vannak a dokumentumhoz.
A rendszer naplózza az egyes aláírásokat (feltöltéseket), amit évekig megőriznek.
Az állam számára így ellenőrizhető az aláíró személye, például elektronikus ügyintézés során vagy egy bírósági perben, de ehhez az információhoz csak az állam fér hozzá.

Ezen kívül az aláírás, mint azonosító csak egy nevet és egy e-mail-címet tartalmaz.
A név nem egyedi, így nem alkalmas azonosításra.
Az e-mail-cím ellenőrzésével próbálkoztak a fejlesztők, de azt az ügyfélkapu felületén könnyedén le lehet cserélni.
Így valójában semmilyen megbízható információt nem lehet kiolvasni a dokumentumból, amivel azonosítani lehetne a szavazókat.

<figure>
  <img src="img/email.png" alt="E-mail változtatás ügyfélkapun" width="600"/>
  <figcaption></figcaption>
</figure>

A PDF dokumentum átszerkesztésével egy tetszőleges tartalmú adatlapot készíthetünk, amit aláírva elfogad a rendszer.
Ha több regisztrációt szeretnénk készíteni, csak egy új e-mail-címet kell rögzítenünk ügyfélkapun.
Sőt, átszerkeszteni sem kell, én szimplán csak készítettem egy másik dokumentumot, ami tartalmazza a szükséges adatokat.

<figure>
  <img src="img/testpdf.png" alt="Teszt adatlap" width="600"/>
  <figcaption></figcaption>
</figure>

És működik.
Sajnos elképzelésem sincs, hogy ez a megoldás, hogyan születhetett meg a fejlesztők fejében.

<details>
<summary>Még több részlet</summary>

<p></p>

Még jobban összezavarodtam, amikor rendszer adatkezelési tájékoztatójában megtaláltam ezt a részt:

>Ezeknek az adatoknak az előválasztás adatbázisában való rögzítése után az eredeti feltöltött pdf-et a rendszer emberi közbeavatkozás nélkül, elkülönítve eltárolja egy kiemelt biztonsággal rendelkező alfiókba [...] célja a lakcímek lakcím-nyilvántartóban való szúrópróbaszerű csoportos ellenőrzése, annak biztosítása érdekében, hogy kizárólag budapesti lakosok vehessenek részt a szavazáson.

A kód alapján a feltöltött adatlapok feldolgozás után törlődnek, ami logikus.
Az volt az egész hash-elés lényege, hogy nem tárolják a személyes adatokat.
Erre most meg megőrzik a szavazók összes adatát tartalmazó adatlapot plaintextben?

Ha tényleg azt gondolták, hogy a feltöltött adatlapok hitelesek, miért akarják ellenőrizni a lakcímeket?
Ha felmerült bennük, hogy mégsem az, akkor miért csak a lakcímnél?

Az adatlekérést a nyilvántartásban pár kattintással le lehet tiltani, így a csoportos ellenőrzés teljesen hatástalan.
Még ha működne is a szúrópróbaszerű ellenőrzés, a nevéből adódóan szúrópróbaszerű, miközben ők azt vállalták, hogy a rendszer minden duplaszavazást kiszűr.

Nem mintha a lebukás olyan hatalmas kockázattal járna egy csalónak.
Milyen törvényi tényállást is merítene ki egy PDF dokumentum feltöltése?
De egy komoly támadónak amúgysem akadály megszerezni valaki ügyfélkapus bejelentkezési adatait, hogy aztán azt használja az aláírásokhoz.

</details>

## 5. Mobilapp

2021-re készült egy új mobilalkalmazás, amely egyszerűbb ügyfélkapus bejelentkezést hozott.
A korábbi AVDH-s hitelesítést pedig ejtették.

Le is töltöttem appot, de nekem jelenleg nem csinál semmit, csak három üres fehér képernyő jelenik meg.
Szerencsére találtam egy videót az interneten, amiben szerepel egy demó:

https://user-images.githubusercontent.com/9078618/135259135-be639022-0659-40d5-959c-50d2db181249.mp4

Ügyfélkapus bejelentkezés, <a href="https://youtu.be/8qh1Hb2LLo8?t=474">forrás</a>

#### Single sign-on

Ez elsőre egy tipikus SSO-s bejelentkezésnek tűnik, egy webview-ban beágyazva.

Amire mindenki ügyfélkapus azonosításként hivatkozik, az Központi Azonosítási Ügynök (KAÜ) néven tényleg egy SSO szolgáltatás, amivel az állampolgárok azonosítani tudják magukat online különböző hivatalok, állami szolgáltatások felé.

Az előválasztáson nem elég szimplán egy SSO-s azonosítás.
A rendszernek szüksége van a lakcímkártyaszámra, ami alapján offline is tudja azonosítani a szavazót.
Illetve a lakcímre a megfelelő szavazókör kiválasztásához.

Az SSO-s azonosítási folyamat során lehetőség van ezeket az információkat az azonosítást kérő és a hitelesítést végző szolgáltatás között egy megbízható csatornán kicserélni.
De ha jogilag lehetséges is lenne bárkinek úgy csatlakozni a KAÜ-höz, mint mondjuk a facebookos SSO-hoz, azt igencsak kétlem, hogy ilyen személyes adatokat csakúgy kiadnának bárkinek.

#### De mi lehet, ha nem SSO?

A videó alapján a szavazónak már nem kell letöltenie és hitelesíteni az adatlapot, az egész bejelentkezés automatikusan zajlik.
De ha nem az SSO-t használják, akkor mire szolgál a bejelentkezés, és hogyan jutnak hozzá a személyes adatokhoz?

Mivel a KAÜ egy SSO szolgáltatás, ezért a bejelentkezési felület az alkalmazásban – ha nem is az előválasztás rendszeréhez – de valamilyen szolgáltatás felé azonosít.
A szükséges adatok továbbra is a lakcímnyilvántartásból érhetőek el.
A nyilvántartás online felülete, a webes ügysegéd is a KAÜ-t használja azonosításhoz.

A webview lényegében egy beágyazott böngésző, amivel az alkalmazás bármit megtehet, és minden adatához hozzáférhet.
Bejelentkezés után, az alkalmazás kiolvashatja az oldal sütijeit a webview-ból.
A sütik segítségével pedig megszemélyesítheti a bejelentkezett felhasználót, és letöltheti a háttérben az adatlapját.

De van még egy még ennél is egyszerűbb módszer.
A webview-t nem csak a felhasználó irányíthatja, hanem az alkalmazás is.
Miután a felhasználó megadta az adatait, és rányomott a bejelentkezés gombra, a KAÜ átirányítja a ügysegéd weboldalára.
Az alkalmazásnak ezután csak el kell navigálnia a webview-n belül a megfelelő oldalra, és onnan letöltenie az adatlapot.
Ebből a felhasználó semmit sem fog érzékelni.

Persze ekkor ezt még csak gyanítottam, mert az alkalmazást rendesen nem tudtam kipróbálni.

#### Mobilapp forrása

Azért megpróbáltam belenézni, letöltöttem az app APK-ját, és kicsomagoltam.
Megtaláltam benne a JavaScriptes forrásfájlokat, ahol ez fogadott:

<figure>
  <img src="img/obfusca.png" alt="Olvashatatlan kód" width="600"/>
  <figcaption></figcaption>
</figure>

Úgy tűnik nem akarták, hogy bárki is elolvassa a forrást. Szerencsére egy kis copy-paste-tel a string literálokat nem nehéz kihámozni belőle, így hamar meg is találtam ezeket a sorokat:

<figure>
  <img src="img/kauclick.png" alt="Olvasható sorok a kódból" width="600"/>
  <figcaption></figcaption>
</figure>

A `kauLoginLink` a bejelentkezés gomb id-ja, a hosszú link pedig az adatlaphoz vezet.
Nehéz elképzelni, hogy mi más miatt szerepelnének benne ezek a sorok.
Tehát tényleg az történik, hogy a webview tölti le a háttérben az adatlap tartalmát.

Szőrmentén ez meg is van említve az adatkezelési tájékoztatóban:

>A bejelentkezést követően az Ügyfélkapuról a jogosultság megállapításához szükséges adatok a telefonjának ideiglenes memóriájába kerülnek letöltésre, majd ellenőrzés után azonnal megsemmisülnek. Az Applikáció itt a Felhasználót segíti a nyilvántartott adatainak közvetlen letöltésében **(ez a művelet megegyezik a nyilvantarto.hu-ról a személyiadat- és lakcímnyilvántartásban nyilvántartott saját aktuális adatok megismerésére vonatkozó felhasználói kérelem benyújtásával és erre válaszul az Ügyfélkapu által generált oldal megküldésével)**.

#### Phishing

Még ha említik is, a felhasználók biztosan nem annak tudatában használják a bejelentkezési felületet, hogy az alkalmazás az ő nevükben ad be egy kérelmet bárhova is.
Ha ez csak egy kattintás is, nem erre számít, nem erre ad jogosultságot.
Először én is azt gondoltam, hogy ez egy normál SSO-s azonosítás.
Mindenki erre számít, ha nem hívják fel rá a figyelet, mert ez a megszokott. 

Őszintén szólva, ez a módszer nem sokban különbözik attól, amit egyes adathalász alkalmazások csinálnak.
Azon sem lepődnék meg, ha ezt a Play Store szabályzata tiltaná.

#### Kliensoldali feldolgozás

De van egy jóval nagyobb probléma a mobilalkalmazással, amit már lehet sejteni, de az idézett részben is benne van, hogy az adatokat kliensoldalon dolgozza fel.

A weben tiszta a helyzet, a kliens sosem megbízható.
Nem bízhatunk rá olyan műveletet, amiben meg szeretnénk bizonyosodni.
Mobilappoknál elterjedt megoldás, hogy root detektálással az alkalmazás integritása ellenőrizhető.
Certificate pinninggel pedig biztosítható a titkos kommunikáció a kliens és a szerver között.
Így olyan információkat is meg lehet osztani a klienssel, amit egyébként nem lenne biztonságos.
Ez megnehezíti a támadó dolgát, de sose nyújt 100%-os védelmet.

Olyan esetekben alkalmazható jól, ahol a támadás költsége meghaladja azt, amit a védelem megkerülésével lehetne nyerni.
Például egy bérletalkalmazásnál, ahol egy pár ezer forintos bérlet esetén, amit előfordulhat, hogy egy-két nap múlva nem is lehet már használni, nem éri meg a befektetett munkát a támadónak.

Ez a védelem mindig is csak egy kompromisszum volt, és mára nagyon hatékony eszközök vannak a kijátszására.
Csomó esetben praktikus megoldás lehet, **de egy választási rendszernek a biztonságát nem lehet rá építeni!!!**

<details>
<summary>Még több részlet</summary>

#### Single point of failure

Már a korábbi PDF feltöltős azonosításnál, de itt mobilappnál is rengeteg olyan megoldással találkoztam, amit akár egy apró változás is működésképtelenné tehet.
Például, ha megváltozik az adatlap formátuma, ha megváltozik az elektronikus aláírás neve, megváltozik az adatlaphoz vezető link, bármi eltörheti az egész folyamatot.
És ezek még a könnyen javítható problémák.

Ha az adatlap letöltését a ügysegéden az üzemeltetők ellátják egy CAPTCHA-val, azt már nem fogják tudni a webview-n belül megkerülni, mert azt nem lehet automatizálni.
Onnantól nem fog működni az azonosítás, mert erre épült a teljes folyamat.

Az egész egy külső szolgáltatástól függ, amivel semmilyen megállapodásuk, de még kapcsolatuk sincs. Informatikai megoldásokat nem szoktak ilyen bizonytalan körülményekre építeni.

</details>

## 6. Hirdetőtábla

<details>
<summary>Lehetséges probléma, amit nem tudtam megvizsgálni</summary>

<p></p>

Létezik egy hirdetőtábla nevű funkció.
Nyilvánosan alig található róla bármi az interneten.
Én két interjúból tudok róla, ahol említették a fejlesztők.

Elvileg arra való, hogy a leadott szavazatokat ellenőrizzék, történt-e utólagos változtatás az adatbázisban.
Ezt úgy biztosítaná, hogy a szavazás folyamán a szavazatok ellenőrzésre alkalmas bizonyítékokat osztanak meg a hirdetőtáblán.
A szavazás lezárulta után, amikor a szavazatok már nem titkosak, a közzétett bizonyítékok alapján ellenőrizhető, hogy közben azok értéke nem változott.

Nyilván csak találgatni tudok hogyan valósították meg ezt a funkciót.
A lakcímkártyás rész után, azért vannak tippjeim, hogy hol lehet benne probléma.

Kifejezetten érdekelt volna ez a funkció, mert ha tényleg hibás, akkor annak elég súlyos következménye is lehetne.
Például visszafejthetőek lehetnek belőle szavazatok, ezzel együtt a szavazás állása, már a szavazás alatt.
Úgy, hogy a támadónak ehhez semmilyen sebezhetőséget nem kell kihasználnia, hiszen nyilvános a hirdetőtábla.

De ha utólagosan megosztják, akkor is érdekes lesz megvizsgálni, főleg az előző problémák árnyékában.

</details>

## 7. Offline szavazólapok

<details>
<summary>Találgatás a szavazólapokról</summary>

<p></p>

2019-ről 2021-re nagy változás történt az offline szavazásban.
A szavazólapok egyedi azonosítót kaptak, amit leadás előtt elektronikusan rögzítenek a központi adatbázisban.

Így már a szavazók és szavazatok összekapcsolhatósága legalább annyira érinti az offline szavazást, mint korábban az online-t.
Annyi különbséggel, hogy a konkrét szavazatot (kire lett leadva) nem az adatbázisban tárolják, hanem egy jól azonosítható papírlapon.
(Lehet ezt valaki nem tekinti ugyanakkora kockázatnak, de technikailag ugyanaz)

Sőt, 2019-ben még több információt is tároltak a sátras szavazásnál, mint online esetén.
Például a közreműködő önkéntes azonosítóját és a szavazás helyszínét is (az időbélyeg mellett).
Persze nem tudhatom idén mit tárolnak el és mit nem, hülyeség is lenne találgatni.

Mindenki érti, hogy milyen veszélyei vannak a szavazatok azonosíthatóságának.
Kevés szokatlanabb megoldás lehet egy választáson, minthogy vizuálisan azonosíthatóvá teszik a szavazólapkat.

Ami szerintem kérdéses, hogy miért cserébe vállalták be ezt a megoldást?
Mivel tud többet, mint a hagyományos pecsételgetős módszer?
Mi az a csalás, amit ez a módszer ki tud szűrni és a hagyományos nem?

A szavazóbiztosokat egyértelműen nem váltja ki.
Ha ők nem ellenőrzik egymást, a QR-kódos szavazólap ugyanúgy elcsalható.
Annyi nehézség van benne csak, hogy a már beolvasott és leadott szavazatokat kell kicserélni egy azonos kódú szavazólapra.
Mindenkinek a fantáziájára bízom ezt hogyan lehet megcsinálni.

Ha pedig ellenőrzik egymást, akkor a bélyegző ugyanezt tudja, mert más szavazólapokat nem tudnak lepecsételni.
Az üres szavazólapokkal el kell számolni, az urnába dobott szavazatoknak meg kell egyeznie a megjelent szavazók számával, stb.
Ez egy kipróbált módszer.

Talán, ha a szavazatokat automatizált módszerrel számolják össze, beszkennelik őket, akkor a QR-kódot a programnak könnyebb ellenőriznie, mint egy pecsétet.
Sehol nem hallottam, hogy ez így lenne, és nem hiszem, hogy ekkora problémát jelentene a szavazatszámlálás.

Így nem találtam rá magyarázatot.
Nekem inkább ez is a többi megoldásra hasonlít, ahol kitaláltak valamit, és ha jó ötletnek tűnt, akkor nem gondolkodtak rajta, hanem csak megcsinálták.

</details>

## 8. Tesztszerver

A 2019-es rendszer kipróbálásához:

```
git clone https://gist.github.com/699129027a438c823fb739aeb68ff2c4.git elovalasztas
cd elovalasztas
docker compose up
``` 
[Link](https://gist.github.com/mlaci/699129027a438c823fb739aeb68ff2c4) a kódhoz.