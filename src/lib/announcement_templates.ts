/*
 * Copyright (C)  Online-Go.com
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

/* cspell:disable */

export interface SystemTemplate {
    id: string;
    name: string;
    translations: { [lang: string]: string };
    type: string;
    duration: number;
}

export const SYSTEM_TEMPLATES: SystemTemplate[] = [
    {
        id: "brief_maintenance",
        name: "Brief System Update",
        translations: {
            en: "A brief system update is underway. Games will resume within 5 minutes.",
            be: "Праводзіцца кароткае абнаўленне сістэмы. Гульні адновяцца на працягу 5 хвілін.",
            ca: "S'està realitzant una breu actualització del sistema. Els jocs es reprendran en 5 minuts.",
            cs: "Probíhá krátká aktualizace systému. Hry budou obnoveny do 5 minut.",
            da: "En kort systemopdatering er i gang. Spil genoptages inden for 5 minutter.",
            de: "Ein kurzes System-Update ist im Gange. Die Spiele werden in 5 Minuten fortgesetzt.",
            el: "Μια σύντομη ενημέρωση συστήματος είναι σε εξέλιξη. Τα παιχνίδια θα συνεχιστούν εντός 5 λεπτών.",
            eo: "Mallonga sistema ĝisdatigo okazas. Ludoj daŭrigos ene de 5 minutoj.",
            es: "Se está realizando una breve actualización del sistema. Los juegos se reanudarán en 5 minutos.",
            et: "Süsteemi lühike värskendus on käimas. Mängud jätkuvad 5 minuti jooksul.",
            eu: "Sistema eguneratze labur bat egiten ari da. Jokoak 5 minutu barru berrekingo dira.",
            fi: "Lyhyt järjestelmäpäivitys on käynnissä. Pelit jatkuvat 5 minuutin kuluessa.",
            fr: "Une brève mise à jour du système est en cours. Les parties reprendront dans 5 minutes.",
            he: "עדכון מערכת קצר מתבצע. המשחקים יחודשו תוך 5 דקות.",
            hr: "Kratko ažuriranje sustava je u tijeku. Igre će se nastaviti unutar 5 minuta.",
            hu: "Rövid rendszerfrissítés van folyamatban. A játékok 5 percen belül folytatódnak.",
            it: "È in corso un breve aggiornamento del sistema. Le partite riprenderanno entro 5 minuti.",
            ja: "システムの簡単な更新が進行中です。ゲームは5分以内に再開されます。",
            ko: "간단한 시스템 업데이트가 진행 중입니다. 게임은 5분 이내에 재개됩니다.",
            nl: "Er wordt een korte systeemupdate uitgevoerd. Games worden binnen 5 minuten hervat.",
            pl: "Trwa krótka aktualizacja systemu. Gry zostaną wznowione w ciągu 5 minut.",
            pt: "Uma breve atualização do sistema está em andamento. Os jogos serão retomados em 5 minutos.",
            ro: "O actualizare scurtă a sistemului este în curs. Jocurile vor fi reluate în 5 minute.",
            ru: "Проводится краткое обновление системы. Игры возобновятся в течение 5 минут.",
            sr: "Кратко ажурирање система је у току. Игре ће се наставити у року од 5 минута.",
            sv: "En kort systemuppdatering pågår. Spel kommer att återupptas inom 5 minuter.",
            th: "กำลังดำเนินการอัปเดตระบบสั้นๆ เกมจะกลับมาดำเนินการต่อภายใน 5 นาที",
            tr: "Kısa bir sistem güncellemesi yapılıyor. Oyunlar 5 dakika içinde devam edecek.",
            uk: "Проводиться коротке оновлення системи. Ігри відновляться протягом 5 хвилин.",
            vi: "Đang tiến hành cập nhật hệ thống ngắn. Trò chơi sẽ tiếp tục trong vòng 5 phút.",
            "zh-cn": "系统正在进行简短更新。游戏将在5分钟内恢复。",
            "zh-tw": "系統正在進行簡短更新。遊戲將在5分鐘內恢復。",
        },
        type: "system",
        duration: 300,
    },
    {
        id: "extended_maintenance",
        name: "Extended Maintenance",
        translations: {
            en: "System maintenance in progress. We expect to be back online within 30 minutes.",
            be: "Праводзіцца тэхнічнае абслугоўванне сістэмы. Мы чакаем вярнуцца ў сетку на працягу 30 хвілін.",
            ca: "Manteniment del sistema en curs. Esperem tornar a estar en línia en 30 minuts.",
            cs: "Probíhá údržba systému. Očekáváme návrat online do 30 minut.",
            da: "Systemvedligeholdelse i gang. Vi forventer at være tilbage online inden for 30 minutter.",
            de: "Systemwartung im Gange. Wir erwarten, in 30 Minuten wieder online zu sein.",
            el: "Συντήρηση συστήματος σε εξέλιξη. Αναμένουμε να επιστρέψουμε online εντός 30 λεπτών.",
            eo: "Sistema prizorgado okazas. Ni atendas reveni enretan ene de 30 minutoj.",
            es: "Mantenimiento del sistema en progreso. Esperamos volver a estar en línea en 30 minutos.",
            et: "Süsteemi hooldus käib. Ootame tagasi võrku 30 minuti jooksul.",
            eu: "Sistema mantentze-lanak egiten ari dira. 30 minutu barru berriz linean egotea espero dugu.",
            fi: "Järjestelmähuolto käynnissä. Odotamme olevamme takaisin verkossa 30 minuutin kuluessa.",
            fr: "Maintenance du système en cours. Nous prévoyons d'être de retour en ligne dans 30 minutes.",
            he: "תחזוקת מערכת בתהליך. אנו מצפים לחזור באינטרנט תוך 30 דקות.",
            hr: "Održavanje sustava u tijeku. Očekujemo da ćemo se vratiti online unutar 30 minuta.",
            hu: "Rendszerkarbantartás folyamatban. Várhatóan 30 percen belül újra online leszünk.",
            it: "Manutenzione del sistema in corso. Prevediamo di tornare online entro 30 minuti.",
            ja: "システムメンテナンス中です。30分以内にオンラインに戻る予定です。",
            ko: "시스템 유지보수가 진행 중입니다. 30분 이내에 다시 온라인 상태가 될 예정입니다.",
            nl: "Systeemonderhoud in uitvoering. We verwachten binnen 30 minuten weer online te zijn.",
            pl: "Trwa konserwacja systemu. Spodziewamy się powrócić online w ciągu 30 minut.",
            pt: "Manutenção do sistema em andamento. Esperamos voltar online em 30 minutos.",
            ro: "Întreținerea sistemului este în curs. Ne așteptăm să revenim online în 30 de minute.",
            ru: "Проводится техническое обслуживание системы. Мы ожидаем вернуться в сеть в течение 30 минут.",
            sr: "Одржавање система у току. Очекујемо да ћемо се вратити на мрежу у року од 30 минута.",
            sv: "Systemunderhåll pågår. Vi förväntar oss att vara tillbaka online inom 30 minuter.",
            th: "กำลังดำเนินการบำรุงรักษาระบบ เราคาดว่าจะกลับมาออนไลน์ภายใน 30 นาที",
            tr: "Sistem bakımı devam ediyor. 30 dakika içinde tekrar çevrimiçi olmayı bekliyoruz.",
            uk: "Проводиться технічне обслуговування системи. Ми очікуємо повернутися в мережу протягом 30 хвилин.",
            vi: "Bảo trì hệ thống đang diễn ra. Chúng tôi dự kiến sẽ trở lại trực tuyến trong vòng 30 phút.",
            "zh-cn": "系统维护正在进行中。我们预计在30分钟内恢复在线。",
            "zh-tw": "系統維護正在進行中。我們預計在30分鐘內恢復在線。",
        },
        type: "system",
        duration: 1800,
    },
    {
        id: "emergency_restart",
        name: "Emergency Restart",
        translations: {
            en: "Emergency server restart required. Games will resume momentarily.",
            be: "Патрабуецца экстранная перазагрузка сервера. Гульні адновяцца ў бліжэйшы час.",
            ca: "Cal reiniciar el servidor d'emergència. Els jocs es reprendran d'un moment a l'altre.",
            cs: "Je vyžadován nouzový restart serveru. Hry budou za okamžik obnoveny.",
            da: "Nødgenstart af server påkrævet. Spil genoptages om et øjeblik.",
            de: "Notfall-Serverneustart erforderlich. Die Spiele werden in Kürze fortgesetzt.",
            el: "Απαιτείται επείγουσα επανεκκίνηση διακομιστή. Τα παιχνίδια θα συνεχιστούν σύντομα.",
            eo: "Urĝa servila restartigo bezonata. Ludoj daŭrigos momente.",
            es: "Se requiere reinicio de emergencia del servidor. Los juegos se reanudarán momentáneamente.",
            et: "Vajalik on serveri hädaolukorra taaskäivitus. Mängud jätkuvad hetke pärast.",
            eu: "Larrialdiko zerbitzariaren berrabiaraztea beharrezkoa da. Jokoak laster berrekingo dira.",
            fi: "Hätäpalvelimen uudelleenkäynnistys vaaditaan. Pelit jatkuvat hetken kuluttua.",
            fr: "Redémarrage d'urgence du serveur requis. Les parties reprendront dans un instant.",
            he: "נדרשת הפעלה מחדש חירום של השרת. המשחקים יחודשו בקרוב.",
            hr: "Potreban je hitni restart poslužitelja. Igre će se nastaviti za trenutak.",
            hu: "Vészhelyzeti szerverújraindítás szükséges. A játékok hamarosan folytatódnak.",
            it: "Riavvio di emergenza del server richiesto. Le partite riprenderanno a breve.",
            ja: "緊急サーバー再起動が必要です。ゲームはまもなく再開されます。",
            ko: "긴급 서버 재시작이 필요합니다. 게임은 곧 재개됩니다.",
            nl: "Noodherstart van server vereist. Games worden zo hervat.",
            pl: "Wymagany awaryjny restart serwera. Gry zostaną wznowione za chwilę.",
            pt: "Reinicialização de emergência do servidor necessária. Os jogos serão retomados momentaneamente.",
            ro: "Este necesară o repornire de urgență a serverului. Jocurile vor fi reluate imediat.",
            ru: "Требуется экстренная перезагрузка сервера. Игры возобновятся в ближайшее время.",
            sr: "Потребно је хитно рестартовање сервера. Игре ће се наставити за тренутак.",
            sv: "Nödserveromstart krävs. Spel återupptas om en stund.",
            th: "ต้องรีสตาร์ทเซิร์ฟเวอร์ฉุกเฉิน เกมจะกลับมาดำเนินการต่อในไม่ช้า",
            tr: "Acil sunucu yeniden başlatması gerekiyor. Oyunlar kısa süre içinde devam edecek.",
            uk: "Потрібна екстрена перезавантаження сервера. Ігри відновляться найближчим часом.",
            vi: "Cần khởi động lại máy chủ khẩn cấp. Trò chơi sẽ tiếp tục ngay lập tức.",
            "zh-cn": "需要紧急重启服务器。游戏将立即恢复。",
            "zh-tw": "需要緊急重啟伺服器。遊戲將立即恢復。",
        },
        type: "system",
        duration: 120,
    },
];
