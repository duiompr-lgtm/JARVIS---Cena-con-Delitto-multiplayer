# JARVIS — Cena con Delitto (MVP gratuito)

Prototipo multiplayer web per una serata tra amici.

## Cosa fa già
- lobby con codice
- 4–6 giocatori
- ruoli segreti assegnati casualmente
- chat pubblica sincronizzata
- indizi condivisi
- Game Master JARVIS deterministico
- voce JARVIS tramite SpeechSynthesis del browser (senza API a pagamento)
- accusa finale
- funzionamento su smartphone via browser

## Cosa NON fa ancora
- IA generativa vera
- chat privata tra giocatori
- database persistente
- generatore automatico di casi
- audio AI realistico

Queste funzioni sono la fase 2. Il primo obiettivo è verificare che la serata sia divertente e che la parte multiplayer funzioni.

## Avvio locale
Richiede Node.js 18+.

    npm install
    npm start

Apri http://localhost:10000 dal PC. Per i telefoni sulla stessa Wi-Fi usa l'indirizzo locale del PC, per esempio http://192.168.1.20:10000.

## Pubblicazione gratuita
Il progetto è predisposto per Render come Web Service. Collegalo a un repository GitHub e usa:
- Build Command: npm install
- Start Command: npm start
- Environment: Node
- porta: Render usa automaticamente PORT

Il piano gratuito Render è sufficiente per un test/hobby, ma il servizio va in sleep dopo 15 minuti senza traffico; per una partita in corso la connessione WebSocket e i messaggi mantengono il servizio attivo secondo le condizioni del piano. Lo stato è in memoria e viene perso al riavvio.

## Voce
La voce attuale usa SpeechSynthesis del browser. Per la serata è possibile usare il telefono dell'host collegato a una cassa. Non richiede una chiave API.
