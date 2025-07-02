# REST API for Hunity GRU (Ground Reference Unit)
<br>API végpontok dokumentációja: https://swagger.onionsat.com/hunity-gru-api
<br>API státusz: https://status.onionsat.com

A Swaggerben tudtok generálni cURL parancsokat, és az interneten találtok nagyon effektív cURL -> xy programozási nyelv átalakítókat (pl. [cURL to PHP](https://incarnate.github.io/curl-to-php/)).<br>
Így nagyon egyszerű felépíteni egy lokális parancslekérdezőt.

API kulcs módosítással, IP fehérlistával kapcsolatos módosításokat, egyéb észrevételeket a hunity@onionsat.com címen várunk.<br>
*Írhattok Messengeren is, de az e-mail-t jobban preferáljuk, ott nem veszik el a kérésetek biztosan!*

### Információk
- Másik csapat kísérleteit kiolvasni bárki kitudja, parancsot küldeni viszont csak saját API kulcs segítségével lehet (a lekérés is API kulcs meglétéhez kötött, az API kulcsok csapathoz vannak rendelve).
- Parancsküldésnél **(/writeCommand végpont)** a sikeres futtatás nem jelent sikeres parancsküldést. A sikeres futtatás azt jelenti, hogy várólistára lett helyezve a parancs, és ha minden jól megy 1 másodpercen belül lefut. A lefutásról a **/getCommands** végpont segítségével kaphatunk.
- Az API kulcsok IP fehérlistához vannak kötve, de ideiglenesen le tudjuk szedni ezt a korlátozást.

### Jelenlegi API szerverek
- https://gru.onionsat.com/v1
  - Minden végpont elérhető
  - 300 lekérés/perc (a hátralévő kvótáról a válaszfejlécek között található információ)
     - X-RateLimit-Reset: UNIX időbélyeg, kvóta visszaállításának időpontja (pl: 1747760646)
     - X-RateLimit-Limit: Lekérési kvótalimit (pl: 80)
     - X-RateLimit-Remaining: Hátralévő kvóta (pl: 79)
  - Az API kulcsot a Bearer hitelesítési fejlécben kell elküldeni.
     - Példa fejléc: Authorization: Bearer <api_kulcs>
